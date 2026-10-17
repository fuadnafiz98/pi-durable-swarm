// 04 — A swarm that shares one transactional blackboard. The host spawns three
// background workers in a single atomic commit; each worker conversation runs
// its own generation and records findings into one session-scoped document.
// Reads and writes to that document go through the same commit line as every
// entry, so three concurrent agents cannot tear it: each write is a full
// revision. When all workers are idle, the host reads the blackboard and
// prints what the room knows.
//
// Run: npm run 04
import { BACKGROUND_CONTEXT, freshStorage, modelRef, setupModels } from "./_shared.ts";
import { fauxAssistantMessage, fauxText, fauxToolCall } from "@earendil-works/pi-ai/providers/faux";
import {
	type AssistantMessage,
	type ConversationId,
	createRegistry,
	defineDoc,
	defineExtension,
	defineTask,
	defineTool,
	Harness,
	watchEvents,
} from "@earendil-works/pi-durable";
import { Type } from "@earendil-works/pi-ai";

const context = BACKGROUND_CONTEXT;

// The blackboard. Session scope: one document per storage, not per
// conversation — this is the state the whole swarm shares.
const Board = defineDoc<{ notes: Record<string, string> }>({
	kind: "lab.board",
	version: 1,
	scope: "session",
	initial: () => ({ notes: {} }),
});

// Workers persist through a background anchor, as in experiment 03.
const Anchor = defineTask<null, { phase: "done" }, null>({
	name: "lab.anchor-04",
	version: 1,
	initial: () => ({ phase: "done" }),
	phases: {
		done: (_task, runtime, taskContext) =>
			runtime.commit(() => ({ status: "terminal" as const, outcome: { status: "completed", result: null } }), taskContext),
	},
	abort: (_task, runtime, taskContext) =>
		runtime.commit(() => ({ status: "terminal" as const, outcome: { status: "aborted" } }), taskContext),
});

// A tool that writes the shared blackboard. It runs inside whichever
// conversation's generation called it, yet commits into session scope.
const record = defineTool({
	name: "record",
	description: "Record one finding on the swarm blackboard.",
	parameters: Type.Object({
		item: Type.String({ description: "Which item was surveyed" }),
		note: Type.String({ description: "The finding" }),
	}),
	execute: async (args, api, callContext) => {
		await api.commit(async (tx) => {
			(await tx.doc(Board)).notes[args.item] = args.note;
		}, callContext);
		return { output: [{ type: "text" as const, text: `recorded ${args.item}: ${args.note}` }] as { type: "text"; text: string }[] };
	},
});

const SwarmBoard = defineExtension({
	name: "swarm-board",
	tasks: [Anchor],
	tools: [record],
});

// ─── Host setup ─────────────────────────────────────────────────────────────

const items = ["rivers", "mountains", "coasts"] as const;

const models = setupModels((request) => {
	const last = request.messages.findLast((message) => message.role !== "system")!;
	const content = typeof last.content === "string" ? [{ type: "text", text: last.content }] : last.content;
	const text = content.flatMap((part) => (part.type === "text" ? [part.text ?? ""] : [])).join("");
	const item = items.find((candidate) => text.toLowerCase().includes(candidate));
	if (item !== undefined && text.includes("Assess")) {
		// One round, three durable writes, then the answer.
		return fauxAssistantMessage(
			[
				fauxToolCall("record", { item, note: `${item}: mapped at depth ${item.length}` }),
				fauxToolCall("record", { item: `bonus-${item}`, note: `${item}: also logged a bonus note` }),
			],
			{ stopReason: "toolUse" },
		);
	}
	const message = last as { role?: string; content?: unknown };
	if (message.role === "toolResult") {
		return fauxAssistantMessage(
			[fauxText(`${(last as { content?: { type: string; text?: string }[] }).content?.length ?? 1} findings committed.`)],
			{ stopReason: "stop" },
		);
	}
	return fauxAssistantMessage([fauxText(`${text} (acknowledged)`)], { stopReason: "stop" });
});

const registry = createRegistry();
registry.install(SwarmBoard);
const harness = await Harness.open(await freshStorage("04-blackboard"), { models, registry }, context);
const hub = await harness.root(context, { agent: { model: modelRef() } });

// Spawn three workers owned by background anchors, then send each its job.
const spawnAll = (await hub.commit(async (tx) => {
	const seeds: { name: string; conversationId: ConversationId }[] = [];
	for (const item of items) {
		const anchor = await tx.createTask(Anchor, null, { ownership: { kind: "conversation" }, background: true });
		const child = await tx.createConversation({ ownership: { kind: "task", taskId: anchor } });
		seeds.push({ name: item, conversationId: child.id });
	}
	return JSON.parse(JSON.stringify(seeds));
}, context)) as unknown as { name: string; conversationId: ConversationId }[];

let speeches = 0;
const prints = new Map<ConversationId, string>(
	spawnAll.map((seed, index) => [seed.conversationId, index === 0 ? "worker-0" : `worker-${index}`]),
);
const stream = await watchEvents(harness, spawnAll[0]!.conversationId, context);
stream.start(async (events) => {
	for (const event of events) {
		if (event.type === "message_end") {
			const message = event.entry.model?.[0] as AssistantMessage | undefined;
			if (message?.role === "assistant" && message.content?.some((part) => part.type === "toolCall")) speeches++;
		}
	}
});

console.log(`spawned : ${spawnAll.map((seed) => `${seed.name} (conversation ${seed.conversationId})`).join(", ")}`);
for (const seed of spawnAll) {
	await (await (await harness.conversation(seed.conversationId, context))!.submit(
		{ type: "input", content: `Assess the ${seed.name}. Record your findings on the blackboard.` },
		context,
	)).wait(context);
}

// Everything settled: read the whole blackboard in one committed revision.
const board = (await harness.snapshot(Board, context))?.notes ?? {};
console.log(`blackboard (${Object.keys(board).length} notes written by 3 concurrent agents):`);
for (const [item, note] of Object.entries(board)) console.log(`  - ${item}: ${note}`);
console.log(`rounds  : ${speeches} tool-call messages seen on worker-0 (one stream attached); tokens=${Object.values((await harness.usage(context)).models).reduce((sum, u) => sum + u.totalTokens, 0)}`);

for (const seed of spawnAll) await (await harness.conversation(seed.conversationId, context))!.waitForIdle(context);
await harness.close(context);
