// 03 — Persistent swarm without an orchestrator. The HOST (this script, not a
// model) runs a pool of named agents that outlive single turns. Each agent is
// its own conversation owned by a "background anchor" task; each message to an
// agent is delivered by a durable "reporter" task that posts the answer back to
// the hub conversation as a follow-up when it arrives. One agent is stopped
// mid-answer with conversation.abort(), and the hub keeps working.
//
// This is the pattern of pi-durable example 23, generalized: the model does not
// have to orchestrate — the app can, from ordinary host code.
//
// Run: npm run 03
import { BACKGROUND_CONTEXT, freshStorage, modelRef, setupModels } from "./_shared.ts";
import { type AssistantMessage } from "@earendil-works/pi-ai";
import { fauxAssistantMessage, fauxText } from "@earendil-works/pi-ai/providers/faux";
import {
	AssistantEntry,
	type ConversationId,
	createRegistry,
	defineDoc,
	defineExtension,
	defineTask,
	Harness,
	LiveDoc,
	watchEvents,
} from "@earendil-works/pi-durable";

const context = BACKGROUND_CONTEXT;

// ─── Swarm state on the hub conversation ────────────────────────────────────

type AgentRecord = { conversationId: ConversationId; reported: string[] };
const Agents = defineDoc<{ agents: Record<string, AgentRecord>; reporters: Record<string, unknown> }>({
	kind: "lab.agents",
	version: 1,
	scope: "conversation",
	history: "latest",
	fork: "initial",
	initial: () => ({ agents: {}, reporters: {} }),
});

// Ownership decides reach: aborting a conversation stops tasks it owns, except
// background ones. An anchor is a background task that finishes at once, so a
// worker conversation it owns survives the hub's Esc and aborts — the boundary
// that makes agents persistent.
const Anchor = defineTask<null, { phase: "done" }, null>({
	name: "lab.anchor",
	version: 1,
	initial: () => ({ phase: "done" }),
	phases: {
		done: (_task, runtime, taskContext) =>
			runtime.commit(() => ({ status: "terminal" as const, outcome: { status: "completed", result: null } }), taskContext),
	},
	abort: (_task, runtime, taskContext) =>
		runtime.commit(() => ({ status: "terminal" as const, outcome: { status: "aborted" } }), taskContext),
});

// A reporter delivers one message and reports the answer back. Tasks are
// durable: each phase ends with a committed checkpoint, and a restart resumes
// where it stopped. Request IDs make a repeated send idempotent.
type ReporterInput = { name: string; conversationId: ConversationId; message: string };
type ReporterState = { phase: "deliver" } | { phase: "report"; report?: string };
const Reporter = defineTask<ReporterInput, ReporterState, null>({
	name: "lab.reporter",
	version: 1,
	initial: () => ({ phase: "deliver" }),
	phases: {
		deliver: async (task, runtime, taskContext) => {
			const { name, conversationId, message } = task.input;
			const agent = (await runtime.conversation(conversationId, taskContext))!;
			const request = { type: "input" as const, content: message } as const;
			const settled = await (await agent.submit({ ...request, requestId: `reporter:${task.id}` }, taskContext)).wait(taskContext);
			await runtime.commit(async (tx) => {
				const next = (report?: string) => ({ status: "running" as const, checkpoint: { phase: "report", report } }) as const;
				if (settled.status !== "done" || settled.type !== "input") {
					// Stopped while queued or mid-answer: nothing to report.
					return next(settled.reason === "aborted" ? undefined : `[worker ${name} failed: ${settled.reason}]`);
				}
				const record = (await tx.doc(Agents, runtime.conversationId)).agents[name];
				if (record && record.reported.includes(settled.answer)) return next();
				record?.reported.push(settled.answer);
				const answer = (await tx.entry(AssistantEntry, settled.answer))?.model?.[0] as AssistantMessage;
				const text = (answer.content ?? []).flatMap((part) => (part.type === "text" ? [part.text ?? ""] : [])).join("");
				return next(`[worker ${name} answered] ${text}`);
			}, taskContext);
		},
		report: async (task, runtime, taskContext) => {
			const report = task.state.checkpoint?.report;
			if (typeof report === "string") {
				const hub = (await runtime.conversation(runtime.conversationId, taskContext))!;
				const input = { type: "input" as const, content: report, whenBusy: "followUp" } as const;
				await hub.submit({ ...input, requestId: `report:${task.id}` }, taskContext);
			}
			await runtime.commit(() => ({ status: "terminal" as const, outcome: { status: "completed", result: null } }), taskContext);
		},
	},
	abort: (_task, runtime, taskContext) =>
		runtime.commit(() => ({ status: "terminal" as const, outcome: { status: "aborted" } }), taskContext),
});

const Swarm = defineExtension({ name: "swarm-runtime", tasks: [Anchor, Reporter] });

// ─── Host setup ─────────────────────────────────────────────────────────────

const models = setupModels((request) => {
	const last = request.messages.findLast((message) => message.role !== "system")!;
	const content = typeof last.content === "string" ? [{ type: "text", text: last.content }] : last.content;
	const text = content.flatMap((part) => (part.type === "text" ? [part.text ?? ""] : [])).join("");
	// A worker answers its counting job with a long, slow line; a second
	// follow-up message gets a fresh count.
	if (text.startsWith("[worker ") || last.role === "toolResult") {
		return fauxAssistantMessage([fauxText("Noted; the hub acknowledges the report.")], { stopReason: "stop" });
	}
	if (text.includes("Count up")) {
		return fauxAssistantMessage(
			[fauxText(Array.from({ length: 400 }, (_, i) => `${i + 1}`).join(" "))],
			{ stopReason: "stop" },
		);
	}
	if (text.includes("Count down")) return fauxAssistantMessage([fauxText("25 24 23 22 21 20 19 18 17 16 15 14 13")], { stopReason: "stop" });
	if (text.includes("count primes")) return fauxAssistantMessage([fauxText("2 3 5 7 11 13 17 19 23 29 31 37")], { stopReason: "stop" });
	return fauxAssistantMessage([fauxText(`${text} (acknowledged)`)], { stopReason: "stop" });
});

const registry = createRegistry();
registry.install(Swarm);
const harness = await Harness.open(await freshStorage("03-persistent"), { models, registry }, context);
const hub = await harness.root(context, { agent: { model: modelRef() } });

// What the hub hears, with who is speaking, as state is committed.
async function follow(id: ConversationId, label: string) {
	const stream = await watchEvents(harness, id, context);
	stream.start(async (events) => {
		for (const event of events) {
			if (event.type !== "message_end") continue;
			const stop = (event.entry.model?.[0] as { stopReason?: string } | undefined)?.stopReason;
			console.log(label.padEnd(8), "entry", event.entry.kind, "stop", stop, "t", Date.now() % 100000);
			const message = event.entry.model?.[0] as { role?: string; content?: string | { type: string; text?: string }[] };
			if (message.role === "assistant" || message.role === "user") {
				const text =
					typeof message.content === "string"
						? message.content
						: (message.content ?? []).flatMap((part) => (part.type === "text" ? [part.text ?? ""] : [])).join("");
				if (text !== "") console.log(`${label.padEnd(8)} ${message.role === "user" ? "> " : "- "}${text}`);
			}
		}
	});
}
await follow(hub.id, "hub");

// Spawn two named workers in one atomic commit: each is a conversation owned by
// a background anchor task, and a reporter delivers its first message.
const spawned = (await hub.commit(async (tx) => {
	const state = await tx.doc(Agents, hub.id);
	const jobs = [
		{ name: "atlas", message: "Count up from 1 to 9000" },
		{ name: "boreas", message: "count primes up to 40" },
	];
	for (const job of jobs) {
		const anchor = await tx.createTask(Anchor, null, { ownership: { kind: "conversation" }, background: true });
		const child = await tx.createConversation({ ownership: { kind: "task", taskId: anchor } });
		state.agents[job.name] = { conversationId: child.id, reported: [] };
		// The reporter's input carries the child's id: its runtime reads that
		// conversation by it in every phase.
		state.reporters[job.name] = await tx.createTask(
			Reporter,
			{ name: job.name, conversationId: child.id, message: job.message },
			{ ownership: { kind: "conversation" } },
		);
	}
	// Drafts settle when this callback ends; return plain JSON copies.
	return { agents: JSON.parse(JSON.stringify(state.agents)) };
}, context)) as unknown as { agents: Record<string, AgentRecord> };

for (const [name, record] of Object.entries(spawned?.agents ?? {})) await follow(record.conversationId, name);

// Kick the scheduler: nothing resumes it by itself — only submissions, waits,
// aborts, or an explicit harness.resume() do. Without this kick the seeded
// tasks sit unscheduled, and a later abort() is what would start them.
harness.resume();

// Wait until atlas is truly streaming and the hub has heard from boreas.

// Wait for every reporter to finish and the hub to be idle.
const settle = async () => {
	const state = await harness.snapshot(Agents, hub.id, context);
	for (const id of Object.values(state?.reporters ?? {})) await harness.waitForTask(id as never, context);
	await hub.waitForIdle(context);
};

const working = async (name: string) => {
	const record = (await harness.snapshot(Agents, hub.id, context))?.agents[name];
	return record !== undefined && ((await harness.snapshot(LiveDoc, record.conversationId, context))?.run !== undefined);
};

// atlas answers slowly; stop it mid-answer. boreas finishes and reports back.
const until = async (check: () => Promise<boolean>) => {
	for (let i = 0; i < 2000 && !(await check()); i++) await new Promise((resolve) => setTimeout(resolve, 10));
};
await until(async () => {
	const live = (await harness.snapshot(LiveDoc, spawned.agents.atlas!.conversationId, context)) as
		| { generation?: { message?: { content?: { type: string; text?: string }[] } } }
		| undefined;
	const text = (live?.generation?.message?.content ?? []).flatMap((part) => ("text" in part ? [part.text ?? ""] : [])).join("");
	return text.length > 50;
});
const atlas = (await harness.snapshot(Agents, hub.id, context))?.agents.atlas;
if (atlas === undefined) throw new Error("spawned agent record missing");
console.log("stop    : aborting atlas mid-answer; its report is dropped, boreas still reports");
// { background: true } crosses the background boundary: atlas lives under a
// background anchor task, and a plain abort() would not reach it.
await (await harness.conversation(atlas!.conversationId, context))!.abort(context, { background: true });
await settle();

// A later message to boreas reuses the same agent: it remembers its transcript.
const boreas = (await harness.snapshot(Agents, hub.id, context))?.agents.boreas;
await hub.commit(async (tx) => {
	const state = await tx.doc(Agents, hub.id);
	state.reporters["boreas-2"] = await tx.createTask(
		Reporter,
		{ name: "boreas", conversationId: state.agents.boreas!.conversationId, message: "Count down from 25" },
		{ ownership: { kind: "conversation" } },
	);
}, context);
await settle();

console.log(`agents  : atlas=${await working("atlas") ? "working" : "idle"} boreas=${await working("boreas") ? "working" : "idle"}`);
console.log(`usage   : ${Object.keys((await harness.usage(context)).models).length} model key(s), total tokens ${Object.values((await harness.usage(context)).models).reduce((sum, u) => sum + u.totalTokens, 0)}`);
await hub.waitForIdle(context);
await harness.close(context);
