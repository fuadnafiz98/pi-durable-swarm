# Reading the code and writing the page

## Reading

Collect **facts**, each with `path:line`. A fact is something the code does, not what a name suggests: read function bodies, not just signatures.

- **Repo**: entry points first (`main`, server start-up, CLI, job runners), then follow one real request or job end to end, then the stores it touches. Config defaults (timeouts, limits, intervals) are facts too — read them from the config file, they become the numbers in captions.
- **PR or diff**: `git diff <base>...HEAD --stat`, then every touched file in full, then the callers of every changed function (`grep`/LSP). Collect before and after for each behaviour that changed, and the reason if the PR or commits state it.
- **Feature**: start from where a user triggers it (route, command, button handler) and follow it to every side effect.

For every flow, also collect: what happens on failure, what is retried, what runs concurrently, what is guarded by a lock or a transaction, and who is allowed to do it. These are what readers get wrong, and what figures show best.

Keep an **open questions** list for what the code cannot answer (intent, deployment, numbers in production). They go on the page as questions, or to the user before publishing, never as guesses.

## Outline

Default order — each kind only if the subject has it:

| Section kind | Answers | Usual figure |
| --- | --- | --- |
| Big picture | What are the parts, and what talks to what? | map with hover notes |
| Workflows | What happens, in order, for the main use cases? | workflow steps, swimlanes |
| Structure | What is built on what, what runs where? | isometric stack or deployment, layered map |
| State | What states can this thing be in, and what moves it? | state machine with choose |
| Time | What happens over time, under load or failure? | clock timeline with scenarios |
| Call stacks | Which function calls which, and what comes back? | call stack frames, sequence diagram |
| Changes (PR) | What changed, and why? | before/after via choose |

- **Heading = the reader's question**, in their words: "Why are there two literature folders?", not "Folder structure". The kicker above it (`<span class="n">03 · STRUCTURE</span>`) names the section kind and number.
- **One idea per section.** If a section needs two figures, it is two sections.
- **Big picture first, always** — even for a one-file PR, start with where that file sits.
- A contents list (`<!-- toc -->`) at the top; the build fills it from the `h2` ids.

## Prose

- Lead paragraph under each heading: two to four sentences, the answer first, then why it matters.
- Plain words, short sentences. Define a term the first time it appears ("a **lease**: the run owns the collection until `lease_until`") and use the same word every time after.
- Numbers come with their source: "every 15 s (`DATA_COLLECTION_WATCHDOG_SECONDS`)".
- Point the reader at the figure: "Pick a scenario", "Step through", "Hover any box".
- **Honest notes**: when something is debatable, overbuilt or unverified, say so in a short paragraph after the figure. A page that only praises the code is not trusted.

## Captions

Each step, option or event has a caption: a **bold lead** that names the moment, then one to three sentences on what changed in the picture and why. Name the real function or file in `<code>`. The caption explains the delta, not the whole figure again.

```js
{ cap: "<b>165 s: the lease ran out.</b> <code>release_expired</code> marks the collection failed and clears the lease." }
```

## Tables

After a figure, a reference table when the reader will want to look things up later: `function | called by | what it does`, or `file | used by | what it does`. Markup: `<div class="tw"><table class="t"><caption>Table 2. …</caption>…</table></div>`.

## Code mode

Only when the user asks for code. `code.json` names the files and the line ranges the panes highlight:

```json
{ "root": "../repo", "files": { "queue": "app/core/queue.py" },
  "ranges": { "q.loop": ["queue", "fn", "CollectionQueue._loop"],
              "q.wake": ["queue", "at", "self._wake.set()", 1],
              "q.run":  ["queue", "span", "async def _run(", "finally:"],
              "q.top":  ["queue", "lines", 1, 20] } }
```

`fn` resolves a Python function or method by name (the safest: it follows the code when lines move). For other languages use `at` (a snippet that must match exactly once, plus a line count) or `span` (start snippet to the first later line containing the end snippet). A file entry may be `{"path": …, "lines": [a, b]}` to embed an excerpt instead of the whole file. Each step then carries `code: ["queue", ["q.loop", "q.wake"]]`.
