# 07 — the SwarmCell: a durable swarm agent inside a Durable Object

This is the deployment story the rest of the lab prod: the same `Harness` the
laptop experiments run against a local SQLite file now opens against the
SQLite storage **of a Durable Object** (`openDurableObjectSqliteStorage(ctx.storage)`
from `@earendil-works/pi-durable/storage/sqlite/cloudflare`). One cell = one
session = one durable transcript; commits are the DO's storage transactions.

`src/worker.ts` is a small HTTP surface around one root conversation:

| route | what happens |
| --- | --- |
| `POST /submit {"message": …}` | appends an input, waits for the model's answer, returns it |
| `GET /view` | the transcript snapshot (entry kinds + last texts) |
| `GET /live` | the built-in `pi.live` document (run control) |
| `GET /usage` | the harness' usage rollup |
| `POST /answer` | the cell's session doc (`cell.notes`) written by the `note` tool |

## Run under celld (self-hosted)

[celld](https://github.com/denoland/celld) runs workerd locally with SQLite Durable
Objects and (for real deploys) storage buckets; `celld dev` needs no bucket:

```sh
npm install -g esbuild                      # one-time: celld's build dependency
curl -fsSL https://celld.dev/install.sh | sh # one-time install (v0.6.2 used here)
cd swarm-lab/07-celld
celld dev                                    # workerd on 127.0.0.1:9876

# then exercise the cell (the exact round that ran on Oct 17 2026):
curl -s localhost:9876/submit -X POST -H 'content-type: application/json' \
     -d '{"message": "Remember under key agenda: build the swarm"}'
curl -s localhost:9876/view | python3 -m json.tool
curl -s -X POST localhost:9876/answer        # the notes doc: {"agenda": "build the swarm"}

# kill and re-run `celld dev`: transcript + notes recover from the cell (cold start)
```

For a persistent deploy celld leases a bucket (`celld deploy --bucket s3://…`).

## Run on Cloudflare instead

```sh
npx wrangler deploy
npx wrangler secret put OPENAI_API_KEY
```

## Honest status

- **Executed under `celld dev` (v0.6.2) on Oct 17 2026 — keyless.** The round
  below ran real DO mechanics end to end: `POST /submit` → scripted provider →
  `note` tool → `openDurableObjectSqliteStorage` transaction → answer
  (`settled: "done"`); the transcript (`pi.user → pi.system → pi.assistant →
  pi.tool-result → pi.assistant`), the notes doc
  (`{"agenda": "build the swarm"}`) and usage rollups all served back.
  - **Cold start verified:** after killing workerd and re-running
    `celld dev`, the whole transcript and the notes recovered from the cell's
    SQLite — and a second turn appended to the same conversation.
  - Real-OpenAI inside the cell is **not executed** (no key configured);
    the path is wired but only the keyless run has been.
- Primitives installed during the smoke test: `celld v0.6.2` and `esbuild
  0.28.2` (its build dependency).
- Setup fixed while executing: the original imports resolved
  `InMemoryCredentialStore`/`Credential` from
  `@earendil-works/pi-ai/auth/...`, which the package's `exports` map does not
  expose — both come from the package root (`@earendil-works/pi-ai`).
- The model defaults to the scripted provider when no key is present (the
  lab's convention), so `celld dev` is a free green demo; with
  `OPENAI_API_KEY` the cell runs real OpenAI.
- Cell-side tools that shell out (`bash`) need an `ExecutionEnv` wrapper that
  forwards `exec()` to a machine with the binary — the same seam
  `NodeExecutionEnv` fills on the laptop (see experiment 06, and the new
  `07-claude-code.ts` for the CLI version of that story).
