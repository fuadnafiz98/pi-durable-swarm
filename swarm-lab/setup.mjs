// One-time wiring for the swarm-lab: put a pi-mono checkout where the
// `@earendil-works/*` imports can find it, install/build it, and link the four
// packages this lab uses.
//
//   npm run setup                # default: pi-mono beside this repo at ../pi
//   PI_DIR=/some/pi-mono npm run setup
//
// What it does, in order (every step idempotent):
//   1. find (or `git clone --depth 1` from github) a pi-mono checkout
//   2. `npm install` inside it, if its workspace install hasn't run yet
//   3. regenerate packages/ai model data (fetched from models.dev), if absent
//   4. `npm run build`, if the dists the Do/esbuild bundle needs are absent
//   5. (re)create node_modules/@earendil-works/* symlinks and verify imports
//
// Experiments run with `--conditions=source` against pi's TypeScript sources,
// so they don't need dist — only the celld/esbuild bundle (07-celld) does.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readlinkSync, rmSync, symlinkSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const lab = fileURLToPath(new URL(".", import.meta.url)); // ends in swarm-lab/
const repo = resolve(lab, "..");
const step = (message) => console.log(`setup: ${message}`);
const die = (message) => {
	console.error(`setup: ${message}`);
	process.exit(1);
};
const run = (cmd, args, cwd, what) => {
	const r = spawnSync(cmd, args, { cwd, stdio: "inherit" });
	if (r.status !== 0) die(`"${cmd} ${args.join(" ")}" failed in ${cwd} — see output above (${what})`);
};

// ─── 1. locate (or clone) pi-mono ───────────────────────────────────────────

const piDir = process.env.PI_DIR ? resolve(process.env.PI_DIR.trim()) : resolve(repo, "..", "pi");
const existing = [piDir, resolve(repo, "..", "pi-mono")].find(existsSync);
const pi = existing ?? piDir;

if (!existing) {
	step(`no pi-mono checkout found — cloning badlogic/pi-mono into ${pi}`);
	mkdirSync(dirname(pi), { recursive: true });
	run("git", ["clone", "--depth", "1", "https://github.com/badlogic/pi-mono", pi], dirname(pi), "cloning pi-mono");
} else {
	step(`pi-mono at ${pi}`);
}

const mark = (file) => join(pi, file); // marker path inside the pi checkout
if (!existsSync(mark("packages/durable"))) die(`${pi} does not look like pi-mono (no packages/durable) — point PI_DIR at the monorepo root`);

// ─── 2. workspace install ───────────────────────────────────────────────────

if (!existsSync(mark("node_modules"))) {
	step("pi workspace is not installed — running npm install (a few minutes)");
	run("npm", ["install"], pi, "pi workspace install");
} else {
	step("pi workspace install: already done");
}

// ─── 3. regenerate pi-ai model data (network once: models.dev) ─────────────

const anthropicData = mark("packages/ai/src/providers/data/anthropic.json");
if (!existsSync(anthropicData)) {
	step("pi-ai model data is missing — regenerating via `npm run generate:models` (fetches models.dev/api.json)");
	run("npm", ["run", "generate:models"], pi, "model-data generation");
} else {
	step("pi-ai model data: present");
}

// ─── 4. build the packages whose dist the DO/esbuild bundle needs ──────────

if (!existsSync(mark("packages/durable/dist/index.js")) || !existsSync(mark("packages/ai/dist/index.js"))) {
	step("pi packages are not built — running npm run build (a few minutes)")
	run("npm", ["run", "build"], pi, "pi package builds");
} else {
	step("pi package dist: present");
}

// ─── 5. link @earendil-works/* into the lab's node_modules ──────────────────

// Link name → directory inside pi/packages (as published names map to dirs).
const packages = { chord: "chord", "pi-ai": "ai", "pi-codemode": "codemode", "pi-durable": "durable" };
const linkDir = join(lab, "node_modules", "@earendil-works");
mkdirSync(linkDir, { recursive: true });
let replaced = 0;
for (const [name, pkg] of Object.entries(packages)) {
	const target = relative(linkDir, mark(join("packages", pkg)));
	const linkPath = join(linkDir, name);
	const current = existsSync(linkPath) ? readlinkSync(linkPath) : undefined;
	if (current !== target) {
		rmSync(linkPath, { force: true, recursive: current === undefined ? false : true });
		symlinkSync(target, linkPath, "dir");
		replaced++;
	}
}
step(replaced === 0 ? "node_modules/@earendil-works links: up to date" : `(re)created ${replaced} node_modules/@earendil-works links`);

// ─── verification ────────────────────────────────────────────────────────────

const check = spawnSync("node", [
	"--conditions=source", "-e",
	"Promise.all(['@earendil-works/pi-durable', '@earendil-works/pi-ai', '@earendil-works/chord'].map((m) => import(m))).then((mods) => console.log('imports ok:', mods.map((m) => Object.keys(m).length).join('/')))",
], { cwd: lab, encoding: "utf8" });
if (check.status !== 0 || !check.stdout.includes("imports ok")) {
	die(`import check failed:\n${check.stderr ?? check.stdout}`);
}
step(check.stdout.trim());

console.log("\nnext: npm run 01   (…02, 03, 04, 05, 06, 07)");
console.log("     07-celld additionally needs `celld` and esbuild on PATH —");
console.log("     see swarm-lab/07-celld/README.md");
