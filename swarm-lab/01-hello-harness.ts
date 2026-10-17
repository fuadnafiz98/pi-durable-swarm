// 01 — Hello harness. The smallest durable run: one conversation, one question,
// one committed answer, watched live.
//
// Run: npm run 01
import { BACKGROUND_CONTEXT, freshStorage, modelRef, setupModels } from "./_shared.ts";
import { fauxAssistantMessage, fauxText } from "@earendil-works/pi-ai/providers/faux";
import { createRegistry, Harness, watchEvents } from "@earendil-works/pi-durable";

const context = BACKGROUND_CONTEXT;

// The faux provider answers every request with one assistant message. A real
// API key swaps the provider; the conversation shape stays identical.
const models = setupModels(
	fauxAssistantMessage([fauxText("The capital of France is Paris.")], { stopReason: "stop" }),
);

const registry = createRegistry();
const harness = await Harness.open(await freshStorage("01-hello"), { models, registry }, context);
const root = await harness.root(context, { agent: { model: modelRef() } });

// A UI never reads storage directly. It attaches to committed state and gets
// one batch of derived events per commit that touches the conversation.
const stream = await watchEvents(harness, root.id, context);
stream.start(async (events) => {
	for (const event of events) {
		if (event.type === "message_end") {
			const message = event.entry.model?.[0];
			if (message.role === "user") console.log(`user    : ${stringOf(message.content)}`);
			if (message.role === "assistant") console.log(`agent   : ${stringOf(message.content)}`);
		}
	}
});

const submission = await root.submit({ type: "input", content: "What is the capital of France?" }, context);
const settled = await submission.wait(context);
console.log(`settled : ${settled.status}`);

// Committed state after the run: the transcript is entries, each with its kind.
const view = (await root.viewState(context)).value;
console.log(`entries : ${view.entries.map((entry) => entry.kind).join(" -> ")}`);
console.log(`usage   : ${JSON.stringify((await harness.usage(context)).models)} token totals`);

await stream.stop();
await harness.close(context);

function stringOf(content: string | readonly { type: string; text?: string }[]): string {
	return typeof content === "string" ? content : content.flatMap((part) => (part.text === undefined ? [] : [part.text])).join("");
}
