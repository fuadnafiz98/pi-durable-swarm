// 02 — Two-level swarm: an orchestrator calls one self-contained `swarm` tool
// three times in a single round. The harness runs tool tasks in parallel by
// default, so three child conversations are created, each owned by its tool
// task, and their answers come back as the tool results the orchestrator
// composes into its final answer.
//
// While the run is busy, we watch the task graph: the run's generation task
// owns the tool tasks, and each tool task owns its child conversation.
//
// Run: npm run 02
import { BACKGROUND_CONTEXT, freshStorage, modelRef, setupModels } from "./_shared.ts";
import { fauxAssistantMessage, fauxText, fauxToolCall } from "@earendil-works/pi-ai/providers/faux";
import { AssistantEntry, configure, createRegistry, defineExtension, defineTool, Harness } from "@earendil-works/pi-durable";
import type { ToolExecutionApi } from "@earendil-works/pi-durable";
import { Type } from "@earendil-works/pi-ai";

const context = BACKGROUND_CONTEXT;

// ─── The swarm tool ─────────────────────────────────────────────────────────

/** The child's committed answer entry, read back as its assistant message text. */
async function answerText(api: ToolExecutionApi, answer: string, callContext: typeof context): Promise<string> {
	const entry = await api.commit((tx) => tx.entry(AssistantEntry, answer), callContext);
	const message = entry?.model?.[0] as { content?: { type: string; text?: string }[] } | undefined;
	return (message?.content ?? []).flatMap((part) => (part.type === "text" ? [part.text] : [])).join("");
}

const swarm = defineTool({
	name: "swarm",
	description: "Delegate one self-contained job to a private agent and return its answer.",
	parameters: Type.Object({
		job: Type.String({ description: "What the agent should do" }),
	}),
	// A crash mid-call is safe to rerun: the rerun re-finds the child conversation
	// and the submission it already recorded, so no agent runs twice.
	replay: "safe",
	execute: async (args, api, callContext) => {
		// The child is created inside one atomic commit and owned by this tool
		// task: aborting the call aborts the child, and the call cannot complete
		// while the child is still busy (spec §6.4).
		const child = await api.commit(async (tx) => {
			// The ownership index remembers the child, so a rerun finds it instead
			// of creating a second one.
			const existing = (await tx.scanConversations({ ownerTaskId: api.taskId }, 1)).items[0];
			if (existing !== undefined) return existing.id;
			const created = await tx.createConversation({ ownership: { kind: "task", taskId: api.taskId } });
			// The child inherits this conversation's agent (model, tools, cwd);
			// remove the swarm tool so children cannot spawn children.
			await configure(tx, created.id, { extensions: { remove: [SwarmTool] } });
			return created.id;
		}, callContext);
		// A UI watching the parent finds the child here and can attach to it.
		await api.details({ conversationId: child }, callContext);

		const handle = (await api.conversation(child, callContext))!;
		const request = { type: "input" as const, content: args.job, requestId: `swarm:${api.taskId}` } as const;
		const settled = await (await handle.submit(request, callContext)).wait(callContext);
		if (settled.status !== "done" || settled.type !== "input") {
			throw new Error(`swarm agent failed: ${settled.status}`);
		}
		const answer = await answerText(api, settled.answer, callContext);
		return { output: [{ type: "text" as const, text: answer }], details: { conversationId: child } };
	},
});

const SwarmTool = defineExtension({ name: "swarm-tool", tools: [swarm] });

// ─── Host setup ─────────────────────────────────────────────────────────────

const models = setupModels((request) => {
	// Route by the newest non-system message, which is how the request arrives.
	const last = request.messages.findLast((message) => message.role !== "system")!;
	const content = typeof last.content === "string" ? [{ type: "text", text: last.content }] : last.content;
	const text = content.flatMap((part) => (part.type === "text" ? [part.text] : [])).join("");

	// The children answer their exact job text. They inherit the agent, so the
	// route must not confuse them with the orchestrator.
	const job = /^Explore (rivers|mountains|coasts)$/.exec(text)?.[1];
	if (job !== undefined) return fauxAssistantMessage([fauxText(`${job}: calm, mapped, no incidents.`)], { stopReason: "stop" });

	// One orchestrator turn answers with THREE tool calls at once; the harness
	// starts that round's tool tasks in parallel (default `toolExecution`).
	if (text.startsWith("Explore the region")) {
		return fauxAssistantMessage(
			[
				fauxToolCall("swarm", { job: "Explore rivers" }),
				fauxToolCall("swarm", { job: "Explore mountains" }),
				fauxToolCall("swarm", { job: "Explore coasts" }),
			],
			{ stopReason: "toolUse" },
		);
	}
	// All three toolResult messages of the round arrive together; compose them.
	const results = request.messages.filter((message) => message.role === "toolResult");
	const joined = results
		.flatMap((message) =>
			typeof message.content === "string" ? [message.content] : message.content.flatMap((part) => (part.type === "text" ? [part.text] : [])),
		)
		.filter((part) => part !== undefined)
		.join(" | ");
	return fauxAssistantMessage([fauxText(`Composed report: ${joined}`)], { stopReason: "stop" });
});

const registry = createRegistry();
registry.install(SwarmTool);
const harness = await Harness.open(await freshStorage("02-orchestrator"), { models, registry }, context);
const root = await harness.root(context, { agent: { model: modelRef() } });

const submission = await root.submit(
	{ type: "input", content: "Explore the region: rivers, mountains, and coasts. Then write a composed report." },
	context,
);

// While the run is busy, every commit can touch the task graph; watch it and
// print two distinct moments once each: the parallel round, then the children.
const graph = await harness.taskGraph(context);
let printedRound = false;
let printedChildren = false;
graph.subscribe((value) => {
	const tasks = Object.entries(value.tasks);
	if (!printedRound && tasks.length >= 4) {
		printedRound = true;
		console.log(`tasks   : ${tasks.length} live tasks, one generation owns three tool calls`);
		for (const [id, node] of tasks) {
			const owner = node.owner === undefined ? `conversation ${node.conversationId}` : `owned by ${node.owner}`;
			console.log(`  ${id} ${node.kind} ${node.state.status} ${owner}`);
		}
	}
	if (!printedChildren && tasks.some(([, node]) => node.conversationId !== root.id)) {
		printedChildren = true;
		console.log("tasks   : children spawned - each child conversation now runs its own generation");
	}
});

const settled = await submission.wait(context);
console.log(`settled : ${settled.status}`);
if (settled.status === "done") {
	const view = (await root.viewState(context)).value;
	const last = view.entries.findLast((entry) => (entry.model?.[0] as { role?: string })?.role === "assistant");
	const message = last?.model?.[0] as { content?: { type: string; text?: string }[] } | undefined;
	console.log(`answer  : ${(message?.content ?? []).flatMap((part) => (part.type === "text" ? [part.text] : [])).join("")}`);
}
const usage = await harness.usage(context);
console.log(`tokens  : total ${Object.values(usage.models).reduce((sum, u) => sum + u.totalTokens, 0)} across ${Object.keys(usage.models).length} model key(s) (orchestrator + children)`);
console.log(`root entries: ${(await root.viewState(context)).value.entries.length}`);

await graph.dispose();
await harness.close(context);
