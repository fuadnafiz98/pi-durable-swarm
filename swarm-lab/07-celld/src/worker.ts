// The celld experiment: a pi-durable Harness running INSIDE a Durable Object.
//
// A Durable Object cell is exactly the target pi-durable's Cloudflare adapter
// was written for: `openDurableObjectSqliteStorage(ctx.storage)` treats the
// cell's SQLite storage as the session's commit surface. One cell holds one
// session; the HTTP surface here is just a demo remote that proves the shape:
//
//   POST /submit  {"message": "..."}  → append an input, wait for its answer
//   GET  /view                        → the conversation's transcript snapshot
//   GET  /usage                       → harness usage rollups
//   GET  /live                        → `pi.live` (run control) of the one root
//
// This file was written against the pi-mono sources checked out beside this
// repo (../pi) and EXECUTED under `celld dev` (v0.6.2) on Oct 17 2026, keyless
// (faux provider): a /submit turn wrote a note through the DO's SQLite and
// answered; after a workerd restart the full transcript and notes recovered
// from the cell. With OPENAI_API_KEY in the env (a `vars` entry under celld,
// a secret on Cloudflare) the same file runs real OpenAI instead. See
// README.md in this directory.
import { createRegistry, defineDoc, defineExtension, defineTool, Harness } from "@earendil-works/pi-durable";
import { openDurableObjectSqliteStorage } from "@earendil-works/pi-durable/storage/sqlite/cloudflare";
import { createModels } from "@earendil-works/pi-ai/models";
import { openaiProvider } from "@earendil-works/pi-ai/providers/openai";
import { fauxAssistantMessage, fauxProvider, fauxText, fauxToolCall, type FauxResponseStep } from "@earendil-works/pi-ai/providers/faux";
import { InMemoryCredentialStore, Type } from "@earendil-works/pi-ai";
import { BACKGROUND_CONTEXT } from "@earendil-works/chord/context";
import type { Credential } from "@earendil-works/pi-ai";

const context = BACKGROUND_CONTEXT;
type Env = {
	SWARM_CELL: { idFromName(name: string): { toString(): string }; get(id: unknown): DurableObjectStub };
	OPENAI_API_KEY?: string;
};

// The cell keeps one session document (session scope: shared by every
// conversation in the cell), so tools can write durable notes like the lab's
// experiments do on the laptop.
const Notes = defineDoc<{ notes: Record<string, string> }>({
	kind: "cell.notes",
	version: 1,
	scope: "session",
	initial: () => ({ notes: {} }),
});

const note = defineTool({
	name: "note",
	description: "Write one durable note into the cell's session document.",
	parameters: Type.Object({ key: Type.String(), text: Type.String() }),
	execute: async (args, api, callContext) => {
		await api.commit(async (tx) => {
			(await tx.doc(Notes)).notes[args.key] = args.text;
		}, callContext);
		return { output: [{ type: "text" as const, text: `noted ${args.key}` }] };
	},
});

const CellTools = defineExtension({ name: "cell-tools", tools: [note] });

/** Scripted route for the keyless cell: a remember-request becomes a durable note write, then a wrap-up answer. */
const cellFauxRoute: FauxResponseStep = (request) => {
	const last = request.messages.findLast((message) => message.role !== "system")!;
	const content = typeof last.content === "string" ? [{ type: "text", text: last.content }] : last.content;
	const text = content.flatMap((part) => (part.type === "text" ? [part.text ?? ""] : [])).join("");
	// Round 2: the note tool ran ("noted <key>") — wrap up over committed state.
	if (text.startsWith("noted ")) {
		return fauxAssistantMessage(
			[fauxText("The note is committed to the cell's session document — it survives cold starts like every other commit in this cell.")],
			{ stopReason: "stop" },
		);
	}
	// Round 1: a remember request turns into a note-tool call.
	const remembered = text.match(/remember under key ([\w-]+):\s*(.*)/i);
	if (remembered) {
		return fauxAssistantMessage([fauxToolCall("note", { key: remembered[1], text: remembered[2] })], { stopReason: "toolUse" });
	}
	return fauxAssistantMessage([fauxText(`cell heard: ${text}`)], { stopReason: "stop" });
};

/** A credential store that hands the env binding's key to every provider. */
class EnvCredentialStore extends InMemoryCredentialStore {
	constructor(private readonly key: string) {
		super();
	}
	override async read(providerId: string): Promise<Credential | undefined> {
		return this.key === "" ? undefined : { type: "api_key", key: this.key };
	}
}

export class SwarmCell {
	readonly #env: Env;
	readonly #ctx: { storage: unknown };
	#harness?: Awaited<ReturnType<typeof Harness.open>>;
	#hub?: Awaited<ReturnType<InstanceType<typeof Harness.open>["root"]>>;

	constructor(ctx: DurableObjectState, env: Env) {
		// Typed loosely: the pi package's adapter takes a structural subset of
		// `ctx.storage` (`sql.exec` + `transaction`), not the full DO type.
		this.#ctx = { storage: ctx.storage };
		this.#env = env;
	}

	/** The DO owns the storage: one session per cell, resumed on every cold start. */
	async #open(): Promise<void> {
		// Memoize the PROMISE itself: two fetches arriving during the first cold
		// start must not double-open the harness.
		if (this.#open_done !== undefined) return this.#open_done;
		this.#open_done = (async () => {
			const storage = await openDurableObjectSqliteStorage(this.#ctx.storage as never);
			const models = createModels({ credentials: new EnvCredentialStore(this.#env.OPENAI_API_KEY ?? "") });
			let model: { provider: string; modelId: string };
			if (this.#env.OPENAI_API_KEY !== undefined) {
				models.setProvider(openaiProvider());
				model = { provider: "openai", modelId: "gpt-6-sol" };
			} else {
				// Same convention as the laptop lab: no key means the scripted
				// provider runs the cell, so `celld dev` is a free green demo.
				const faux = fauxProvider({ tokensPerSecond: 50 });
				faux.setResponses(Array.from({ length: 200 }, () => cellFauxRoute));
				models.setProvider(faux.provider);
				model = { provider: "faux", modelId: "faux-1" } as const;
			}
			const registry = createRegistry();
			registry.install(CellTools);
			this.#harness = await Harness.open(storage, { models, registry }, context);
			this.#hub = await this.#harness.root(context, { agent: { model } });
		})();
		return this.#open_done;
	}

	#open_done?: Promise<void>;

	async fetch(request: Request): Promise<Response> {
		try {
			await this.#open();
			const url = new URL(request.url);
			const hub = this.#hub!;
			if (request.method === "POST" && url.pathname === "/submit") {
				const body = (await request.json()) as { message?: string; model?: string };
				if (typeof body.message !== "string" || body.message === "") {
					return Response.json({ error: "POST /submit needs { message: string }" }, { status: 400 });
				}
				const submission = await hub.submit({ type: "input", content: body.message }, context);
				const settled = await submission.wait(context);
				// Read the answer from the transcript, not from the submission value.
				const view = (await hub.viewState(context)).value;
				const last = [...view.entries].reverse().find((entry) => entry.kind === "pi.assistant");
				const message = (last?.model?.[0] as { content?: { type: string; text?: string }[] } | undefined)?.content ?? [];
				const text = message.flatMap((part) => (part.type === "text" ? [part.text ?? ""] : [])).join("");
				return Response.json({ settled: settled.status, answer: text.slice(-2000) });
			}
			if (request.method === "GET" && url.pathname === "/view") {
				const view = (await hub.viewState(context)).value;
				return Response.json({
					entries: view.entries.map((entry) => entry.kind),
					transcript: view.entries.map((entry) => {
						const message = entry.model?.[0] as { role?: string; content?: string | { type: string; text?: string }[] };
						const text = typeof message?.content === "string"
							? message.content
							: (message?.content ?? []).flatMap((part) => (part.type === "text" ? [part.text ?? ""] : [])).join("");
						return `${entry.kind}: ${text}`.slice(0, 300);
					}),
				});
			}
			if (request.method === "GET" && url.pathname === "/live") {
				const live = (await hub.viewState(context)).value.docs?.["pi.live"];
				return Response.json(live ?? { idle: true });
			}
			if (request.method === "GET" && url.pathname === "/usage") {
				return Response.json(await this.#harness!.usage(context));
			}
			if (request.method === "POST" && url.pathname === "/answer") {
				// Host-side shortcut: "what does the cell know?" — runs a normal turn.
				const sessionNotes = await this.#harness!.snapshot(Notes, context);
				return Response.json({ notes: sessionNotes?.notes ?? {} });
			}
			return new Response("try POST /submit, GET /view | /live | /usage | /answer", { status: 404 });
		} catch (error) {
			return Response.json({ error: String((error as { message?: string }).message ?? error).slice(0, 500) }, { status: 500 });
		}
	}
}

export default {
	fetch(request: Request, env: Env): Promise<Response> {
		// One named cell ("lab") for the demo; scale by name.
		return env.SWARM_CELL.get(env.SWARM_CELL.idFromName("lab")).fetch(request);
	},
} satisfies ExportedHandler<Env>;
