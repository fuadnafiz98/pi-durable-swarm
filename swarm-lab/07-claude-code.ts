// 07 — Claude Code as a durable swarm member. The `claude` CLI runs wherever a
// tool or task runs it, so this experiment drives it the same two ways as 06,
// and everything it produces is committed state:
//
//   A. Foreground: the hub's model calls a `claude_code` tool; the tool task
//      executes the CLI through the harness ExecutionEnv, streams its output,
//      and the transcript keeps the answer. `replay: "unsafe"` — a rerun after
//      a crash would run the agent again, so an interrupted call stays settled.
//
//   B. Background: the host creates a durable `lab.claude-job` task that runs
//      the CLI while no conversation is busy, writing progress into a session
//      document others can read while they work. The child process is not
//      durable state: a restart re-runs the job (at-least-once); the record
//      and the coordination are what survive.
//
// Auth: the CLI runs when ANTHROPIC_API_KEY is exported or after `claude`
// /login (OAuth). With the key, the hub itself also runs on Anthropic
// models; without it the hub stays on the scripted faux provider.
//
// Run: npm run 07
import { spawnSync } from "node:child_process";
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
const scratch = join(import.meta.dirname, ".data", "claude-code-scratch");
await mkdir(scratch, { recursive: true });

// ─── Preflight: does the CLI answer a prompt? ───────────────────────────────

const probe = spawnSync("claude", ["-p", "Reply with exactly one word: ok", "--output-format", "text"], {
	encoding: "utf8",
	timeout: 60_000,
});
const probeOut = `${probe.stdout ?? ""}${probe.stderr ?? ""}`;
if (probe.error !== undefined) {
	console.error("preflight: `claude` CLI not found — install Claude Code, then npm run 07");
	process.exit(0);
}
if (probe.status !== 0 || /not logged in|invalid api key/i.test(probeOut)) {
	console.log("07 — Claude Code as a durable swarm member.");
	console.log(`preflight: \`claude\` CLI is present but not usable: ${probeOut.trim().slice(0, 120)}`);
	console.log("not executed. Make it runnable with either:");
	console.log("  export ANTHROPIC_API_KEY=sk-ant-...   # auths the CLI and the hub itself");
	console.log("  claude                                # then run /login (CLI-only auth; hub stays faux)");
	console.log("then: npm run 07");
	process.exit(0);
}
console.log("preflight: ok — claude CLI answers prompts");

// The environment every call and task phase gets. On a Durable Object (the
// celld path) this same seam is what forwards exec() to a machine that has
// the claude binary and its credentials.
const envFor = (): ExecutionEnv => new NodeExecutionEnv({ cwd: scratch });

/** Run `claude -p <prompt>` headless; stream chunks into onChunk as they arrive. */
async function runClaude(
	env: ExecutionEnv,
	prompt: string,
	onChunk: (text: string) => void,
	runContext: typeof context,
): Promise<{ exitCode: number; text: string }> {
	let text = "";
	const result = await env.exec(["claude", "-p", prompt, "--output-format", "text"], {
		onOutput: (chunk) => {
			text += chunk;
			onChunk(chunk);
		},
		timeout: 180_000,
	}, runContext);
	if (!result.ok) throw new Error(`Failed to launch claude: ${result.error.message}`);
	return { exitCode: result.value.exitCode, text: text.replaceAll(/\x1b\[[0-9;]*m/g, "") };
}

// ─── A. The foreground tool ─────────────────────────────────────────────────

const claudeCodeTool = defineTool({
	name: "claude_code",
	description: "Run Claude Code headless on one prompt and return its final answer text.",
	parameters: Type.Object({ prompt: Type.String({ description: "The prompt for the Claude Code agent" }) }),
	// A crash mid-call is NOT rerun: running an agent twice is an external side
	// effect we cannot undo. The model sees the interrupted call instead.
	replay: "unsafe",
	execute: async (args, api, callContext) => {
		const env = api.env;
		if (env === undefined) return { output: [{ type: "text" as const, text: "No environment configured." }], isError: true };
		const run = await runClaude(env, args.prompt, (chunk) => api.output(chunk), callContext);
		const answer =
			run.exitCode === 0 ? run.text.trim() || "claude finished with no output" : `claude exited ${run.exitCode}: ${run.text}`;
		return {
			output: [{ type: "text" as const, text: answer }],
			structuredOutput: { exitCode: run.exitCode, answer },
			details: { prompt: args.prompt, exitCode: run.exitCode },
		};
	},
});
const ClaudeCodeTool = defineExtension({ name: "claude-code-tool", tools: [claudeCodeTool] });

// ─── B. The background job task ─────────────────────────────────────────────

// A session-scoped document any conversation or task reads while a job runs.
const Jobs = defineDoc<{ jobs: Record<string, { prompt: string; text: string; exitCode?: number }> }>({
	kind: "lab.claude-jobs",
	version: 1,
	scope: "session",
	initial: () => ({ jobs: {} }),
});

type JobInput = { id: string; prompt: string };
type JobState = { phase: "run" } | { phase: "final"; exitCode: number; text: string };
const ClaudeJob = defineTask<JobInput, JobState, { exitCode: number; text: string }>({
	name: "lab.claude-job",
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
			const run = await runClaude(env, task.input.prompt, onChunk, taskContext);
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
const ClaudeJobs = defineExtension({ name: "claude-jobs", tasks: [ClaudeJob] });

// ─── Host setup ─────────────────────────────────────────────────────────────

// With ANTHROPIC_API_KEY the hub itself runs on Claude; otherwise the faux
// route scripts the same shape of run: input -> claude_code call -> answer.
const models = setupModels(process.env.ANTHROPIC_API_KEY !== undefined ? undefined : (request) => {
	const last = request.messages.findLast((message) => message.role !== "system")!;
	const content = typeof last.content === "string" ? [{ type: "text", text: last.content }] : last.content;
	const text = content.flatMap((part) => (part.type === "text" ? [part.text ?? ""] : [])).join("");
	if (text.includes("Consult Claude Code")) {
		return fauxAssistantMessage([fauxToolCall("claude_code", { prompt: "Reply with exactly one word: ok" })], { stopReason: "toolUse" });
	}
	return fauxAssistantMessage([fauxText(`Claude Code said: ${text}`)], { stopReason: "stop" });
});

const registry = createRegistry();
registry.install(ClaudeCodeTool);
registry.install(ClaudeJobs);
const harness = await Harness.open(await freshStorage("07-claude-code"), {
	models,
	registry,
	env: () => envFor(),
}, context);
const hub = await harness.root(context, { agent: { model: modelRef() } });

// A. The transcript records the whole round: input -> tool call -> answer.
const submission = await hub.submit({ type: "input", content: "Consult Claude Code and tell me its reply." }, context);
const settled = await submission.wait(context);
console.log(`A. durable tool: settled=${settled.status}`);
const view = (await hub.viewState(context)).value;
console.log(`   transcript: ${view.entries.map((entry) => entry.kind).join(" -> ")}`);
const lastAssistant = [...view.entries].reverse().find((entry) => (entry.model?.[0] as { role?: string })?.role === "assistant");
const message = lastAssistant?.model?.[0] as { content?: { type: string; text?: string }[] } | undefined;
console.log(`   answer: ${(message?.content ?? []).flatMap((part) => (part.type === "text" ? [part.text ?? ""] : [])).join("")}`);

// B. A background job runs without tying up any conversation.
const jobId = `claude-${Date.now()}`;
const jobTaskId = await hub.commit(async (tx) => {
	(await tx.doc(Jobs)).jobs[jobId] = { prompt: "Reply with exactly one word: ok", text: "" };
	return await tx.createTask(
		ClaudeJob,
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
console.log(`usage   : ${Object.values(usage.models).reduce((sum, u) => sum + u.totalTokens, 0)} hub tokens (the Claude Code run bills its own session/CLI login, not this transcript)`);
await hub.waitForIdle(context);
await harness.close(context);
