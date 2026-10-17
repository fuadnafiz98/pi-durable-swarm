// Shared setup for the swarm-lab experiments.
//
// Every experiment uses the scripted "faux" provider by default, so runs are
// deterministic and free. Set OPENAI_API_KEY and/or ANTHROPIC_API_KEY to run
// the same harness against a real model (ANTHROPIC_MODEL picks the Claude
// model, default "claude-sonnet-4-5"); the faux route step is only consulted
// by the faux provider.
import { BACKGROUND_CONTEXT } from "@earendil-works/chord/context";
import { createModels } from "@earendil-works/pi-ai/models";
import { anthropicProvider } from "@earendil-works/pi-ai/providers/anthropic";
import { openaiProvider } from "@earendil-works/pi-ai/providers/openai";
import { type FauxResponseStep, fauxProvider } from "@earendil-works/pi-ai/providers/faux";
import { openNodeSqliteStorage } from "@earendil-works/pi-durable/storage/sqlite/node";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

export { BACKGROUND_CONTEXT };

/** The agent model identity. "faux-1" is scripted; real models when a key is present. */
export function modelRef() {
	if (process.env.ANTHROPIC_API_KEY !== undefined)
		return { provider: "anthropic", modelId: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5" } as const;
	if (process.env.OPENAI_API_KEY !== undefined) return { provider: "openai", modelId: "gpt-6-sol" } as const;
	return { provider: "faux", modelId: "faux-1" } as const;
}

/** A fresh SQLite storage file under swarm-lab/.data/<name>.sqlite (recreated each run). */
export async function freshStorage(name: string) {
	await mkdir(join(import.meta.dirname, ".data"), { recursive: true });
	const file = join(import.meta.dirname, ".data", `${name}.sqlite`);
	await rm(file, { force: true });
	return await openNodeSqliteStorage(file);
}

/** Reopen an existing storage file without deleting it (the crash-recovery path). */
export async function openStorage(name: string) {
	const file = join(import.meta.dirname, ".data", `${name}.sqlite`);
	return await openNodeSqliteStorage(file);
}

/** Build the model registry. With a route, the faux provider answers every request through that route function. */
export function setupModels(route?: FauxResponseStep) {
	const models = createModels();
	const hasKey = process.env.OPENAI_API_KEY !== undefined || process.env.ANTHROPIC_API_KEY !== undefined;
	if (hasKey && route === undefined) {
		// Real run: install every provider with a key; the model ref names which one answers.
		if (process.env.ANTHROPIC_API_KEY !== undefined) models.setProvider(anthropicProvider()); // reads ANTHROPIC_API_KEY
		if (process.env.OPENAI_API_KEY !== undefined) models.setProvider(openaiProvider()); // reads OPENAI_API_KEY
	} else {
		// One route function shapes the whole scripted run; 400 responses cover
		// long conversations, and every request hands the next one.
		const faux = fauxProvider({ tokensPerSecond: 50 });
		if (route !== undefined) faux.setResponses(Array.from({ length: 400 }, () => route));
		models.setProvider(faux.provider);
	}
	return models;
}
