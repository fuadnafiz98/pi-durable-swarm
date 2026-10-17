# pi-durable-swarm

An investigation of `pi durable` — durable AI agent sessions from
[`pi-mono`](https://github.com/badlogic/pi-mono) — plus a swarm where
**OpenCode v2 and Claude Code itself** join as workers, and a self-hosted
Durable Object target. The pi-mono checkout lives **beside this repo**
(`../pi`) and is not committed here.

```
swarm-lab/            the experiments + a DO deployment story (this repo)
docs/                 the visual explainer (open index.html)   (this repo)
pi   (sibling)        ../pi — the pi-mono checkout `npm run setup` manages
```

### Prerequisites: none by hand — `npm run setup` does it

```sh
git clone <this-repo> somewhere && cd somewhere/swarm-lab
npm run setup                        # PI_DIR=/custom/location to override
npm run 01                           # … 02, 03, 04, 05, 06, 07
```

`npm run setup` locates a pi-mono checkout (`../pi` by default — or clones
[badlogic/pi-mono](https://github.com/badlogic/pi-mono) there if absent),
installs its workspace, regenerates its model data (one fetch from
models.dev), builds it, and wires `@earendil-works/*` into
`node_modules/@earendil-works/`. Every step is idempotent and safe to rerun.

## Start here

1. **[swarm-lab/README.md](swarm-lab/README.md)** — the experiments,
   `npm run 01 … 07` one by one, with what each commits and what to watch for.
2. **[docs/index.html](docs/index.html)** — the illustrated walkthrough:
   how a session becomes durable state, the task graphs, the state machine,
   the crash story, and the three swarm patterns.
3. **[swarm-lab/07-celld/](swarm-lab/07-celld/README.md)** — the same harness
   inside a Durable Object cell, to run under
   [celld](https://github.com/denoland/celld) on your own machines.

## What was verified

- All experiments ran clean on this machine (Node 26; faux provider).
- Real-model runs: `OPENAI_API_KEY` switches them to OpenAI
  (`ANTHROPIC_API_KEY` → Anthropic, `ANTHROPIC_MODEL` picks the Claude model).
- Upstream examples 14/22/23/24 also ran from `../pi/packages/durable` directly
  (`node --conditions=source --experimental-strip-types test/examples/…`).
- The Durable Object / celld path **ran for real**: under `celld dev` (v0.6.2)
  a SwarmCell held one durable session — a `/submit` turn committed a note
  through the DO's own SQLite and answered; after killing workerd and
  restarting, the full transcript and notes recovered from the cell. Real-OpenAI
  in the cell is wired but unexecuted (no key configured).
- OpenCode v2 integration verified real: the durable tool call shells out to
  `opencode run` (v2.0.29) and the answer lands in the committed transcript.
- Claude Code integration is **written but not executed here** —
  `swarm-lab/07-claude-code.ts` runs the `claude -p` CLI inside a durable tool
  and task, but no Claude Code auth (`ANTHROPIC_API_KEY` / `claude /login`)
  was configured on this machine; export a key and `npm run 07` runs it.

## Where the source knowledge lives

- `../pi/packages/durable/README.md` — the package's own documentation.
- `../pi/packages/durable/src/` — harness, scheduler, generation, storage.
- The explainer cites `path:line` for every claim it makes.
- The explainer's buildable source page: `docs/pidurable/`
  (`page.json` + `body.html` + `figures.js`; rebuild with
  `python3 .agents/skills/visual-explainer/scripts/build.py docs/pidurable`).
