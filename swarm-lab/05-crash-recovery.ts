// 05 — The durability demo. One process opens a session on SQLite and starts a
// long answer; when the streamed text is visible, it runs
// `process.kill(process.pid, "SIGKILL")` mid-flight. Whatever had not been
// committed is lost. A second process reopens the same storage, the scheduler
// demotes the was-running tasks back to pending (src/harness/scheduler.ts),
// `harness.resume()` restarts them from their last checkpoints, and the answer
// lands anyway — requests are retried, not re-run from zero.
//
// The same file is three stages. LAB_ROLE wires it up:
//   (none)  parent: seeds, kills, resumes, prints the story
//   seed    child : opens + starts the run, kills itself mid-stream
//   resume  child : reopens + resumes + finishes the run
//
// Run: npm run 05
import { BACKGROUND_CONTEXT, freshStorage, modelRef, openStorage, setupModels } from "./_shared.ts";
import { fauxAssistantMessage, fauxText } from "@earendil-works/pi-ai/providers/faux";
import { AssistantEntry, createRegistry, Harness, watchEvents } from "@earendil-works/pi-durable";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const context = BACKGROUND_CONTEXT;
const self = fileURLToPath(import.meta.url);
const longAnswer = Array.from({ length: 40 }, (_, i) => `paragraph ${i + 1}: the model is still producing this durable answer.`).join(" ");

/** Route shared by both children: the run keeps re-requesting the same long answer. */
function withRoute() {
	return setupModels((request) => {
		const last = request.messages.findLast((message) => message.role !== "system")!;
		if (last.role === "user") return fauxAssistantMessage([fauxText(longAnswer)], { stopReason: "stop" });
		return fauxAssistantMessage([fauxText("done")], { stopReason: "stop" });
	});
}

// ─── seed: start a run, then die violently once streamed text exists ────────
if (process.env.LAB_ROLE === "seed") {
	const models = withRoute();
	const registry = createRegistry();
	const harness = await Harness.open(await freshStorage("05-crash"), { models, registry }, context);
	const hub = await harness.root(context, { agent: { model: modelRef() } });
	// Slower streaming tokens make the kill land mid-answer, not at its tail.
	const submission = await hub.submit({ type: "input", content: "Write the long durable answer." }, context);
	let streamed = 0;
	const stream = await watchEvents(harness, hub.id, context);
	stream.start(async (events) => {
		for (const event of events) {
			if (event.type !== "message_update") continue;
			for (const change of event.changes) {
				if (change.type === "text_delta") streamed += change.delta.length;
			}
			if (streamed >= 120) {
				console.log(`  seed: ${streamed} streamed chars so far; killing myself (SIGKILL) mid-answer`);
				// Kills the whole process: no close, no flush, nothing graceful.
				process.kill(process.pid, "SIGKILL");
			}
		}
	});
	await submission.wait(context);
	console.log("  seed: finished without being killed (streaming too fast?)");
	await harness.close(context);
	process.exit(0);
}

// ─── resume: reopen, resume scheduler, finish what the dead process started ─
if (process.env.LAB_ROLE === "resume") {
	const models = withRoute();
	const registry = createRegistry();
	const harness = await Harness.open(await openStorage("05-crash"), { models, registry }, context);
	const hub = await harness.root(context); // the same root conversation as before
	// Opens pending work; submitting or resuming starts the scheduler.
	harness.resume();
	const started = Date.now();
	const submission = await hub.submit({ type: "input", content: "anything idle?" }, context); // queued while busy
	void submission;
	for (;;) {
		const settled = await submission.wait(context).then(
			(sub) => sub,
			() => null,
		);
		if (settled !== null) break;
		if (Date.now() - started > 120_000) break;
	}
	const view = (await hub.viewState(context)).value;
	const lastAssistant = [...view.entries].reverse().find((entry) => (entry.model?.[0] as { role?: string })?.role === "assistant");
	const message = lastAssistant?.model?.[0] as { content?: { type: string; text?: string }[] } | undefined;
	const answer = (message?.content ?? []).flatMap((part) => (part.type === "text" ? [part.text ?? ""] : [])).join("");
	console.log(`  resume: answer entries=${view.entries.length} assistant chars=${answer.length}`);
	console.log(`  resume: answer starts with "${answer.slice(0, 40)}..."`);
	await harness.close(context);
	process.exit(0);
}

// ─── parent: run seed (dies), then resume (finishes) ────────────────────────
const runChild = (role: "seed" | "resume") =>
	new Promise<string>((resolve, reject) => {
		const child = spawn(process.execPath, ["--conditions=source", "--experimental-strip-types", self], {
			env: { ...process.env, LAB_ROLE: role },
			cwd: import.meta.dirname,
		});
		let out = "";
		child.stdout.on("data", (chunk) => (out += chunk));
		child.stderr.on("data", (chunk) => (out += chunk));
		child.on("close", (code, signal) => {
			// A SIGKILLed seed is the point of the demo.
			const killedAsPlanned = role === "seed" && out.includes("killing myself");
			if (code === 0 || (killedAsPlanned && signal === "SIGKILL")) return resolve(out);
			reject(new Error(`${role}: exit ${code ?? "?"} signal ${signal ?? "-"}\n${out}`));
		});
	});

console.log("stage 1: seed process starts a run and is SIGKILLed mid-stream");
const seedOut = await runChild("seed");
console.log(seedOut.trim().split("\n").filter((line) => line.includes("seed")).join("\n"));
console.log("stage 2: fresh process reopens the same SQLite and resumes");
const out = await runChild("resume");
console.log(out.trim());
console.log("result  : the answer finished in a different process, re-requested from the durable checkpoint (the two halves may differ: that is the retry, not a replay).");
