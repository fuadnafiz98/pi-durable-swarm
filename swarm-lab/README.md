# swarm-lab — durable experiments and a deployment skeleton

Every experiment opens a pi-durable `Harness` (from the pi-mono checkout
beside this repo, [`../pi/packages/durable`](../../pi/packages/durable)) over
a fresh SQLite file in
`.data/`, runs a small scripted scenario, prints what state it committed, and
closes. Deterministic by default: a fake provider answers every model request
from a fixed script, so no API key is needed. Export a real key and the same
scripts run against a real model:

- `OPENAI_API_KEY` — OpenAI (`gpt-6-sol`)
- `ANTHROPIC_API_KEY` — Anthropic; `ANTHROPIC_MODEL` picks the Claude model
  (default `claude-sonnet-4-5`; Anthropic wins when both keys are set)

```sh
npm run setup        # one-time: clone/fetch pi-mono, install + build it, wire node_modules
npm run 01           # … or 02, 03, 04, 05, 06, 07
```

**Wiring, automated.** `npm run setup` locates (or clones) a pi-mono
checkout — default `../pi`; override with `PI_DIR=/path/to/pi-mono` — installs
its workspace, regenerates its model data (one fetch from models.dev), builds
it, and links `@earendil-works/*` into `node_modules/@earendil-works/`. Clone
this repo anywhere; `npm run setup` is the only step.

`node --conditions=source --experimental-strip-types` runs the TypeScript
sources directly (vendored package `exports` map to source).

## The experiments

| # | what it shows | key facts you can see |
| --- | --- | --- |
| `01-hello-harness.ts` | the smallest durable conversation | `submit → wait → committed transcript`; `viewState` entry kinds; `harness.usage()` |
| `02-orchestrator-swarm.ts` | one orchestrator, three subagents in one round | the model's tool calls become `pi.tool` tasks; child conversations spawn their own generations; the composed answer uses all three |
| `03-persistent-swarm.ts` | background agents that outlive turns | anchors own worker conversations; a reporter delivers messages and reports answers back; `abort({ background: true })` cut mid-answer (`stopReason: "aborted"`) |
| `04-blackboard-workers.ts` | concurrent agents sharing one document | a session-scoped doc accepts writes from three conversations; each write is one transactional revision |
| `05-crash-recovery.ts` | SIGKILL mid-stream, then resume | the was-running generation is demoted `running → pending`; a new process `harness.resume()`s; the answer still lands (the two halves differ — it is a retry, not a replay) |
| `06-opencode-worker.ts` | **OpenCode v2 as a swarm member** | the real `opencode run` CLI executes inside a durable tool call and inside a background job; progress is committed to a session doc |
| `07-claude-code.ts` | **Claude Code as a swarm member** | the same two doors as 06 with `claude -p`; needs `ANTHROPIC_API_KEY` (hub runs real Claude too) or a logged-in CLI (`claude /login`); refuses loudly until then |
| `07-celld/` | **the deployment story — the harness inside a Durable Object** | executed under `celld dev`: a `/submit` turn wrote a note through the DO's SQLite and answered; after restarting workerd the transcript + notes recovered from the cell |

## Things worth knowing before you tweak

- **What makes the scheduler run.** Commits alone never start work. Only
  `submit`, `abort`, `waitForTask`/`waitForIdle`, or an explicit
  `harness.resume()` enable it. A host that seeds tasks in a commit needs the
  explicit kick; otherwise its later `abort()` is what starts everything
  (all at once), which is exactly the race 03 avoids with `resume()`.
- **Task phases commit, then return.** The durable decision is the value
  returned inside `runtime.commit(...)`; a bare `return` from a phase faults
  the task ("returned without durable progress").
- **`tx.doc(Token)` needs the owner id** for conversation/task-scoped
  documents; session-scoped docs omit it. Deep-copy drafts before returning
  them from a commit callback (the chord settled-overlay rejects live drafts).
- **Aborting across ownership.** `conversation.abort(context)` does not cross
  background boundaries; `{ background: true }` reaches into anchor-owned
  worker conversations.
- **Mid-stream abort.** The run-control doc (`pi.live`) proves a run was
  *admitted*; only `pi.live.generation.message` proves a model request is
  actually streaming. Trigger the abort on the partial, not on `run`.
- **A child process is not durable state.** 06's background job re-runs the
  CLI after a restart (at-least-once); the tool side uses `replay: "unsafe"`
  so an interrupted call is never silently repeated.

## 07 — the Durable Object cell

See [`07-celld/README.md`](07-celld/README.md). It ran under
[celld](https://github.com/denoland/celld) `dev` (v0.6.2): one SwarmCell DO
held one durable session across a workerd restart, with the scripted provider
(`OPENAI_API_KEY` switches the cell to real OpenAI).

## `npm run 07` (the script) vs `07-celld/` (the folder)

`07-claude-code.ts` runs Claude Code as a durable member: a `claude_code`
foreground tool (`replay: "unsafe"`) and a `lab.claude-job` background task,
mirroring 06. Its preflight asks the CLI a one-word prompt; if the CLI is not
authenticated the script explains how (`ANTHROPIC_API_KEY` export or
`claude /login`) and exits without touching the harness — it was not executed
during the play session (no Claude Code auth was configured on this machine).
`07-celld/` is the separate deployment story, **executed** under `celld dev`.
