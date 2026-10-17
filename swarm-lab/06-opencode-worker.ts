// 06 — OpenCode v2 as a durable swarm member. The `opencode` CLI runs wherever
// a tool or task runs it, so this experiment drives it two ways, and everything
// it produces is committed state:
//
//   A. Foreground: the hub's model calls an `opencode` tool; the tool task
//      executes the CLI through the harness ExecutionEnv, streams its output,
//      and the transcript keeps the answer. `replay: "unsafe"` — a rerun after
//      a crash would run the agent again, so an interrupted call stays settled.
//
//   B. Background: the host creates a durable `lab.opencode-job` task that runs
//      the CLI while no conversation is busy, writing progress into a session
//      document others can read while they work. The child process is not
//      durable state: a restart re-runs the job (at-least-once); the record and
//      the coordination are what survive.
//
// Run: npm run 06
import { BACKGROUND_CONTEXT, freshStorage, modelRef, setupModels } from "./_shared.ts";
import { fauxAssistantMessage, fauxText, fauxToolCall } from "@earendil-works/pi-ai/providers/faux";
import { NodeExecutionEnv } from "@earendil-works/pi-durable/env/node";
import {
	createRegistry,
	defineDoc,
	defineExtension,
	defineTask,
	defineTool,
	Harness,
	type ExecutionEnv,
} from "@earendil-works/pi-durable";
import { Type } from "@earendil-works/pi-ai";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const context = BACKGROUND_CONTEXT;
const scratch = join(import.meta.dirname, ".data", "opencode-scratch");
await mkdir(scratch, { recursive: true });

// The environment every call and task phase gets. On a Durable Object (the
// celld path) this same seam is what forwards exec() to a machine that has the
// opencode binary on PATH.
const envFor = (): ExecutionEnv => new NodeExecutionEnv({ cwd: scratch });

/** Run `opencode run <prompt>` headless; stream chunks into onChunk as they arrive. */
async function runOpencode(
	env: ExecutionEnv,
	prompt: string,
	onChunk: (text: string) => void,
	runContext: typeof context,
): Promise<{ exitCode: number; text: string }> {
	let text = "";
	const result = await env.exec(["opencode", "run", prompt], {
		onOutput: (chunk) => {
			text += chunk;
			onChunk(chunk);
		},
		timeout: 180_000,
	}, runContext);
	if (!result.ok) throw new Error(`Failed to launch opencode: ${result.error.message}`);
	return { exitCode: result.value.exitCode, text: text.replaceAll(/\x1b\[[0-9;]*m/g, "") };
}

// ─── A. The foreground tool ─────────────────────────────────────────────────

const opencodeTool = defineTool({
	name: "opencode",
	description: "Run OpenCode headless on one prompt and return its final answer text.",
	parameters: Type.Object({ prompt: Type.String({ description: "The prompt for the OpenCode agent" }) }),
	// A crash mid-call is NOT rerun: running an agent twice is an external side
	// effect we cannot undo. The model sees the interrupted call instead.
	replay: "unsafe",
	execute: async (args, api, callContext) => {
		const env = api.env;
		if (env === undefined) return { output: [{ type: "text" as const, text: "No environment configured." }], isError: true };
		const run = await runOpencode(env, args.prompt, (chunk) => api.output(chunk), callContext);
		const answer =
			run.exitCode === 0 ? run.text.trim() || "opencode finished with no output" : `opencode exited ${run.exitCode}: ${run.text}`;
		return {
			output: [{ type: "text" as const, text: answer }],
			structuredOutput: { exitCode: run.exitCode, answer },
			details: { prompt: args.prompt, exitCode: run.exitCode },
		};
	},
});
const OpencodeTool = defineExtension({ name: "opencode-tool", tools: [opencodeTool] });

// ─── B. The background job task ─────────────────────────────────────────────

// A session-scoped document any conversation or task reads while a job runs.
const Jobs = defineDoc<{ jobs: Record<string, { prompt: string; text: string; exitCode?: number }> }>({
	kind: "lab.opencode-jobs",
	version: 1,
	scope: "session",
	initial: () => ({ jobs: {} }),
});

type JobInput = { id: string; prompt: string };
type JobState = { phase: "run" } | { phase: "final"; exitCode: number; text: string };
const OpencodeJob = defineTask<JobInput, JobState, { exitCode: number; text: string }>({
	name: "lab.opencode-job",
	version: 1,
	initial: () => ({ phase: "run" }),
	phases: {
		run: async (task, runtime, taskContext) => {
			// Tasks build their environment at each use, like tools do.
			const env = (await runtime.env(taskContext)) ?? envFor();
			let soFar = "";
			// Publish progress at a coarse pace; each frame is a storage commit.
			let published = 0;
			let timer = Date.now();
			const onChunk = (chunk: string) => {
				soFar += chunk;
				if (Date.now() - timer < 1000 && soFar.length < published + 2000) return;
				timer = Date.now();
				published = soFar.length;
				void runtime.commit(async (tx) => {
					(await tx.doc(Jobs)).jobs[task.input.id].text = soFar.slice(-2000);
				}, taskContext).catch(() => {});
			};
			const run = await runOpencode(env, task.input.prompt, onChunk, taskContext);
			// The durable decision is returned inside the commit, as in every
			// example task; a bare return carries no checkpoint progress.
			return await runtime.commit(async (tx) => {
				const job = (await tx.doc(Jobs)).jobs[task.input.id];
				job.exitCode = run.exitCode;
				job.text = run.text.slice(-2000);
				return { status: "terminal", outcome: { status: "completed", result: run } } as const;
			}, taskContext);
		},
	},
	abort: (_task, runtime, taskContext) =>
		runtime.commit(() => ({ status: "terminal", outcome: { status: "aborted" } }), taskContext),
});
const OpencodeJobs = defineExtension({ name: "opencode-jobs", tasks: [OpencodeJob] });

// ─── Host setup ─────────────────────────────────────────────────────────────

const models = setupModels((request) => {
	const last = request.messages.findLast((message) => message.role !== "system")!;
	const content = typeof last.content === "string" ? [{ type: "text", text: last.content }] : last.content;
	const text = content.flatMap((part) => (part.type === "text" ? [part.text ?? ""] : [])).join("");
	if (text.includes("Consult OpenCode")) {
		return fauxAssistantMessage([fauxToolCall("opencode", { prompt: "Reply with exactly one word: ok" })], { stopReason: "toolUse" });
	}
	return fauxAssistantMessage([fauxText(`OpenCode said: ${text}`)], { stopReason: "stop" });
});

const registry = createRegistry();
registry.install(OpencodeTool);
registry.install(OpencodeJobs);
const harness = await Harness.open(await freshStorage("06-opencode"), {
	models,
	registry,
	env: () => envFor(),
}, context);
const hub = await harness.root(context, { agent: { model: modelRef() } });

// A. The transcript records the whole round: input -> tool call -> answer.
const submission = await hub.submit({ type: "input", content: "Consult OpenCode and tell me its reply." }, context);
const settled = await submission.wait(context);
console.log(`A. durable tool: settled=${settled.status}`);
const view = (await hub.viewState(context)).value;
console.log(`   transcript: ${view.entries.map((entry) => entry.kind).join(" -> ")}`);
const lastAssistant = [...view.entries].reverse().find((entry) => (entry.model?.[0] as { role?: string })?.role === "assistant");
const message = lastAssistant?.model?.[0] as { content?: { type: string; text?: string }[] } | undefined;
console.log(`   answer: ${(message?.content ?? []).flatMap((part) => (part.type === "text" ? [part.text ?? ""] : [])).join("")}`);

// B. A background job runs without tying up any conversation.
const jobId = `opencode-${Date.now()}`;
const jobTaskId = await hub.commit(async (tx) => {
	(await tx.doc(Jobs)).jobs[jobId] = { prompt: "Reply with exactly one word: ok", text: "" };
	return await tx.createTask(
		OpencodeJob,
		{ id: jobId, prompt: "Reply with exactly one word: ok" },
		{ ownership: { kind: "conversation" }, background: true },
	);
}, context);
console.log(`B. durable job: task ${jobTaskId}`);
const jobSettled = await harness.waitForTask(jobTaskId, context);
const final = (await harness.snapshot(Jobs, context))?.jobs[jobId];
if (jobSettled.state.status !== "terminal" || jobSettled.state.outcome.status !== "completed")
	throw new Error(`job did not complete: ${JSON.stringify(jobSettled.state)}`);
console.log(`   job result: exit=${final?.exitCode} text="${(final?.text ?? "").trim().replaceAll("\n", " ").slice(-60)}"`);

const usage = await harness.usage(context);
console.log(`usage   : ${Object.values(usage.models).reduce((sum, u) => sum + u.totalTokens, 0)} hub tokens (the OpenCode run bills its own session, not this transcript)`);
await hub.waitForIdle(context);
await harness.close(context);
