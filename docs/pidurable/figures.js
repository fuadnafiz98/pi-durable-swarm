/* One file of drawings for the pi-durable page. Every claim flagged with a
 * path and a line was read in the vendored sources under pi/packages/. */

/* ─── 01 · BIG PICTURE: what talks to what ─────────────────────────────── */
INFO.map = {
  "your host": ["Where you write code. The public surface is the session's Object API: <code>harness.root()</code>, <code>conversation.submit()</code>, <code>conversation.commit()</code>, <code>harness.usage()</code>, watchers.", "swarm-lab/01-hello-harness.ts"],
  "submission queue": ["Admits an input: appends the <code>pi.user</code> entry and a submission row in one commit; re-sends with the same <code>requestId</code> return the first submission.", "src/harness/submissions.ts:224-239"],
  "scheduler · task graph": ["The pending/running lanes. Tasks only work when the scheduler is enabled — submissions, waits and aborts resume it; host seeding needs its own <code>resume()</code>.", "src/harness/scheduler.ts:318-321"],
  "conversations + documents": ["Transcripts as entries, the per-conversation <code>pi.live</code> control document, and committed documents with history: the shared memory of a swarm.", "src/harness/live.ts:111 · src/documents.ts:39-41"],
  "watchEvents": ["One event stream per conversation — callers read committed facts, not callbacks into running code.", "src/harness/events.ts:69-120"],
  "pi-ai": ["The model layer: catalogs, credentials, request transforms. Streaming and deferred polls, with retriable attempts, land here.", "packages/ai/src (pi-mono)"],
  storage: ["One storage contract, four shapes: a SQLite file (Node), a Durable Object's storage (Cloudflare/celld), memory, or JSONL. One process owns one storage at a time.", "README.md:669 · src/storage/sqlite/cloudflare.ts:187-197"],
  "foreign agents": ["Agents that are not host-side model calls: the real OpenCode CLI run inside a tool call, or work forwarded through an ExecutionEnv to a machine with the binaries.", "swarm-lab/06-opencode-worker.ts · src/env/index.ts"],
  "the boundary": ["Commits survive a kill; child processes do not. A CLI run is at-least-once on restart; its transcript and coordination are durable.", "src/types.ts:148 · README 'replay'"],
};
(function () {
  const s = flat("map");
  const SUBMIT = [[240, 105], [420, 105]], CALL = [[725, 306], [725, 330]], EXEC = [[420, 361], [316, 361]], COMMIT = [[806, 108], [830, 108]];
  function draw(t) {
    s.clear();
    // host (hatched: outside durability)
    s.r(30, 76, 210, 60, "cut"); s.t(48, 100, "your host", "lbl"); s.t(48, 118, "hub.submit · wait()", "lbl-s"); s.hit(30, 76, 210, 60, "your host");
    // harness box holding its organs
    s.r(422, 62, 390, 244, "cap"); s.t(617, 88, "harness · one Session", "mid", "middle"); s.hit(422, 62, 390, 244, "harness");
    [["submission queue", "admit · settle · idempotent requestIds", 112],
     ["scheduler · task graph", "lanes · ownership · restarts", 154],
     ["conversations + documents", "entries · live · committed docs", 196],
     ["watchEvents", "state-derived events, not callbacks", 238]].forEach(row => {
      s.r(436, row[2], 362, 32, "side"); s.t(446, row[2] + 15, row[0], "lbl"); s.t(446, row[2] + 27, row[1], "lbl-s"); s.hit(436, row[2], 362, 32, row[0]);
    });
    // storage
    s.cyl(892, 62, 116, 96, "side", "cap"); s.t(892, 104, "storage", "lbl", "middle"); s.t(892, 122, "one commit", "lbl-s", "middle"); s.t(892, 134, "at a time", "lbl-s", "middle"); s.hit(834, 62, 116, 96, "storage");
    // pi-ai (bottom middle-right)
    s.r(600, 330, 250, 46, "cap"); s.t(725, 348, "pi-ai · models", "lbl", "middle"); s.t(725, 366, "catalogs · credentials · streams", "lbl-s", "middle"); s.hit(600, 330, 250, 46, "pi-ai");
    // foreign agents (bottom left)
    s.r(60, 330, 250, 62, "cut"); s.t(80, 352, "foreign agents", "lbl"); s.t(80, 370, "OpenCode CLI · other agents,", "lbl-s"); s.t(80, 384, "via an ExecutionEnv seam", "lbl-s"); s.hit(60, 330, 250, 62, "foreign agents");
    // arrows
    s.arrow(SUBMIT, "ln", 6); s.t(330, 94, "input → durable run", "lbl-s", "middle");
    s.arrow(COMMIT, "ln", 5);
    s.arrow(CALL, "ln", 5); s.t(735, 322, "model calls (streamed)", "lbl-s");
    s.arrow(EXEC, "wire", 5); s.t(368, 350, "env.exec()", "lbl-s", "middle");
    s.t(30, 428, "the durability boundary: commits survive a kill; child processes do not — running external agents is therefore at-least-once on restart", "lbl-s");
    s.hit(30, 418, 640, 20, "the boundary");
    if (t != null) { const k = (t * .5) % 2; if (k < 1) s.token(SUBMIT, k, "solid", 7); else s.token(CALL, (k - 1) * 2, "solid", 7) }
  }
  draw(null); loop("map", (dt, t) => draw(t));
})();

/* ─── 02 · WORKFLOW: what happens to one input ─────────────────────────── */
INFO.flow = {
  submit: ["<code>hub.submit({type:'input', content})</code> appends the <code>pi.user</code> entry and a submission row in one commit; the scheduler resumes.", "src/harness/submissions.ts:224-239"],
  admit: ["The scheduler starts a run for the queued inputs: a <code>pi.generation</code> task owned by the conversation, referenced from <code>pi.live.run</code>.", "src/harness/generation.ts:697-710"],
  prepare: ["The generation's first phase commits the checkpoint: model, cutoff entry, compaction gate — so a retry resumes exactly here.", "src/harness/generation.ts:181-199"],
  request: ["The request streams the model. Every ~100 ms the throttled partial is committed — that is the granularity a crash keeps.", "src/harness/agent.ts:35 (partialIntervalMs: 100)"],
  tools: ["Tool calls of an answer become their own <code>pi.tool</code> child tasks — parallel by default — and the generation parks until they are terminal.", "src/harness/agent.ts:69 (toolExecution: 'parallel') · types.ts:519-525"],
  answer: ["The finished assistant message is appended as a <code>pi.assistant</code> entry; the run hands over control or idles.", "src/harness/generation.ts (classify → appendEntry)"],
  settle: ["The submission records its answer entry and resolves waiters. The transcript holds the whole round; nothing was ever memory-only.", "src/harness/submissions.ts"],
};
(function () {
  const s = flat("flow"), X = i => 62 + i * 130, Y = 108;
  const N = ["submit", "admit", "prepare", "request", "tools", "answer", "settle"];
  const OUT = ["pi.user entry", "run + task id", "checkpoint saved", "stream + partials", "pi.tool tasks", "pi.assistant entry", "wait() returns"];
  const S = [
    { cap: "<b>submit.</b> The host appends the input and a submission record in one commit. A <code>requestId</code> makes re-sends idempotent." },
    { cap: "<b>admit.</b> The scheduler groups queued inputs into a run and creates the generation task. Tasks run only when the scheduler is enabled: submissions, waits, aborts, or an explicit resume()." },
    { cap: "<b>prepare.</b> First committed checkpoint: model reference, cutoff entry, compaction gate. A crash here re-executes the same plan." },
    { cap: "<b>request.</b> Streaming begins. The committed partial marches ~100 ms behind the provider stream — the tail a SIGKILL can never erase." },
    { cap: "<b>tools.</b> Tool calls become parallel child tasks; the generation parks (<code>waiting</code>) until every call settles." },
    { cap: "<b>answer.</b> The assistant message lands as an entry — what <code>watchEvents</code> reports as <code>message_end</code>." },
    { cap: "<b>settle.</b> The input submission resolves and waiters wake. The run's whole round is now committed state." }
  ];
  let cur = 0;
  function draw() {
    s.clear();
    N.forEach((n, i) => {
      s.box(X(i), Y, 108, 44, n, "", i < cur ? "cap" : i === cur ? "ok-f cur" : "side", n);
      s.t(X(i), Y + 34, OUT[i], i <= cur ? "lbl" : "lbl-s", "middle");
      if (i < N.length - 1) s.arrow([[X(i) + 54, Y], [X(i + 1) - 54, Y]], i < cur ? "ln" : "wire", 4);
    });
    s.t(24, 40, "one durable conversation round · experiment 01 runs exactly this", "lbl-s");
  }
  steps("flow", S, i => { cur = i; draw() });
})();

/* ─── 03 · STATE: the life of a task ───────────────────────────────────── */
INFO.state = {
  pending: ["Eligible for scheduling, with its full checkpoint. A restart demotes every was-running task here — the checkpoint is the recovery point.", "src/types.ts:505-510 · scheduler.ts:306-309"],
  running: ["Reserved by one in-memory invocation; exactly no second invocation exists for it.", "src/types.ts:512-517"],
  waiting: ["Parked with no invocation until every task in <code>on</code> is terminal — tool rounds, fail-fast joins, deferred provider polls.", "src/types.ts:519-525"],
  completing: ["Outcome decided and committed; it becomes terminal as soon as no ordinary owned work below it is live. Runs no more code.", "src/types.ts:527-531"],
  terminal: ["The permanent receipt: completed, failed, aborted, orphaned or faulted. Nothing runs here again.", "src/types.ts:533-536 · 465-499"],
  restart: ["<code>Harness.open()</code> scans live statuses and, in the same commit, rewrites <code>running</code> → <code>pending</code>. A crash costs the invocation, not the run.", "src/harness/scheduler.ts:296-312"],
  abortmark: ["<code>conversation.abort()</code> sets an abort mark bottom-up over ordinary ownership; the invocation dies at its next step and settles <code>aborted</code>. Background boundaries stop the walk unless <code>{ background: true }</code>.", "src/harness/scheduler.ts:396-414 · lab 03"],
  outcomes: ["completed (with result) · failed (expected, error) · aborted (cancel intent honored) · orphaned (its definition is gone) · faulted (contract broke: uncaught throw, no durable progress).", "src/types.ts:465-499"],
};
(function () {
  const s = flat("state");
  const N = { pending: [130, 88], running: [440, 88], waiting: [760, 88], completing: [440, 218], terminal: [760, 218] };
  const E = [
    ["pending", "running", [[210, 88], [360, 88]], "scheduler admits a lane", [282, 74, "middle"]],
    ["running", "waiting", [[520, 78], [680, 78]], "tool round · deferred poll", [598, 66, "middle"]],
    ["waiting", "running", [[680, 104], [520, 104]], "on[] all terminal", [598, 122, "middle"]],
    ["running", "completing", [[440, 112], [440, 194]], "answer committed; children alive", [450, 156, "start"]],
    ["completing", "terminal", [[520, 218], [680, 218]], "no owned work below live", [598, 206, "middle"]],
    [null, "restart", [[412, 56], [250, 48], [146, 64]], "restart: open() demotes running→pending", [270, 40, "middle"]],
    [null, "abortmark", [[492, 112], [660, 190]], "abort mark: outcome aborted", [524, 142, "start"]],
  ];
  const OS = [["completed", 96], ["failed", 224], ["aborted", 348], ["orphaned", 476], ["faulted", 608]];
  function draw(k) {
    s.clear();
    E.forEach(e => {
      const on = k !== undefined && (e[0] === k || (e[0] === null && e[1] === k));
      s.arrow(e[2], e[0] === null ? (on ? "ln" : "guide") : (on ? "ln" : "wire"), 5);
      s.t(e[4][0], e[4][1], e[3], on ? "lbl" : "lbl-s", e[4][2]);
    });
    for (const n in N) { s.box(N[n][0], N[n][1], 150, 42, n, "", n === k ? "ok-f cur" : "cap"); s.hit(N[n][0] - 75, N[n][1] - 21, 150, 42, n) }
    s.t(24, 280, "outcome on terminal:", "lbl-s");
    OS.forEach(o => { s.box(o[1], 308, 112, 30, o[0], "", k === "outcomes" ? "ok-f cur" : "side"); s.hit(o[1] - 56, 293, 112, 30, "outcomes") });
    s.hit(196, 30, 176, 22, "restart"); s.hit(508, 132, 176, 22, "abortmark");
    s.t(24, 344, "a task's whole life is committed state; the invocation is the only thing a restart loses", "lbl-s");
  }
  choose("state", [
    { k: "pending", label: "pending", cap: "<b>pending.</b> Eligible for scheduling with the complete checkpoint that a later start resumes from. A restart makes every interrupted run plan again, not lose." },
    { k: "running", label: "running", cap: "<b>running.</b> Reserved by one in-memory invocation. The committed checkpoint grows here: prepare's cutoff, then the throttled partials of the streaming request." },
    { k: "waiting", label: "waiting", cap: "<b>waiting.</b> No invocation: parked until every task in <code>on</code> is terminal (tool rounds, fail-fast joins, deferred polls). Then it resumes at its checkpoint." },
    { k: "completing", label: "completing", cap: "<b>completing.</b> The outcome is written; children settle. Runs no code. When the ownership walk is quiet it passes to terminal." },
    { k: "terminal", label: "terminal", cap: "<b>terminal.</b> The permanent receipt — completed, failed, aborted, orphaned, faulted; waiters resolve here and the row never changes again." },
    { k: "restart", label: "after a restart", cap: "<b>Restart.</b> <code>Harness.open()</code> demotes every <code>running</code> task to <code>pending</code> in the open scan. Experiment 05's resumed worker relies on exactly this before <code>resume()</code>." },
    { k: "abortmark", label: "given an abort", cap: "<b>Abort mark.</b> Marks land on the ordinary ownership scope; the invocation ends at its next step with outcome <code>aborted</code>. Lab 03 aborts mid-stream and the mid-answer is dropped." },
    { k: "outcomes", label: "the five outcomes", cap: "<b>Outcomes.</b> completed · failed · aborted · orphaned · faulted. A fault is a contract break the scheduler reports loudly — no durable progress, or an uncaught throw." }
  ], draw, "life of a task");
})();

/* ─── 04 · STRUCTURE: the isometric stack + the schema ─────────────────── */
INFO.layers = {
  extensions: ["Your code and the built-ins: tools, task kinds, documents, hooks. Installed into a registry at open; the built-ins are <code>pi.*</code> extensions like any other.", "src/harness/registry.ts · README extensions"],
  conversations: ["Transcripts (entries), per-conversation live control docs (<code>pi.live</code>), documents with scopes: conversation, task, session — the swarm's shared state with history.", "src/harness/live.ts:111 · src/documents.ts:39-41"],
  scheduler: ["The lanes: pending/running/waiting tasks, ownership walks, abort cascades, restart scans. An in-memory map over committed records, not a schema of its own.", "src/harness/scheduler.ts:296-414"],
  "session line": ["One commit at a time on a guarded line: every change — entry, document, task — rides one transaction; a write-after-read in a commit fails loudly.", "src/session/session.ts (guarded calls)"],
  "durable storage": ["What survives a kill; what a Durable Object or a JSONL file can equally provide. Same contract, four adapters.", "src/storage/sqlite/{node,cloudflare,storage}.ts"],
  tables: ["Nine tables: durable_schema, durable_metadata, record_ids, conversations, entries, tasks, submissions, documents, document_revisions — names are public contract and prefix-safe.", "src/storage/sqlite/schema.ts:5-16"],
};
(function () {
  const s = flat("layers");
  const rows = [
    { n: "durable storage", sub: "sqlite · DO · memory · jsonl", tip: "durable storage", top: "side" },
    { n: "session line", sub: "guarded commits, serialized", tip: "session line" },
    { n: "scheduler", sub: "lanes · ownership · restarts", tip: "scheduler" },
    { n: "conversations", sub: "entries · live · documents", tip: "conversations" },
    { n: "extensions", sub: "tools · task kinds · docs · hooks", tip: "extensions" },
  ];
  function drawStack() {
    s.clear();
    const I = s.iso({ ox: 250, oy: 150 }), W = 220, D = 150, GAP = 34;
    rows.forEach((row, i) => {
      const z = i * GAP;
      I.box(0, 0, z, W, D, 18, { top: row.top || "cap", label: null });
      const C = I.P(W / 2, D / 2, z + 9);
      s.p(`M${C[0]} ${C[1]}L590 ${C[1] - 8}`, "wire");
      s.t(600, C[1] - 12, row.n, "lbl"); s.t(600, C[1] + 4, row.sub, "lbl-s");
      s.hit(600, C[1] - 24, 330, 36, row.tip);
    });
    s.t(24, 404, "same storage contract, four shapes — one process owns one storage; the pi.* built-ins are extensions too:", "lbl-s");
    [["node", "SQLite file on disk"], ["cloudflare", "Durable Object storage"], ["memory", "in-RAM sessions"], ["jsonl", "append-only file"]].forEach((a, i) =>
      s.box(124 + i * 150, 432, 140, 40, a[0], a[1], "side"));
  }
  function drawTables() {
    s.clear();
    const T = [["durable_schema", "the migration record"], ["durable_metadata", "tiny metadata"], ["record_ids", "id issuance"], ["conversations", "nodes of the graph"], ["entries", "transcript rows"], ["tasks", "durable task records"], ["submissions", "queued inputs + answers"], ["documents", "committed docs (diffs)"], ["document_revisions", "the history"]];
    T.forEach((row, i) => {
      const x = 170 + (i % 3) * 300, y = 96 + Math.floor(i / 3) * 74;
      s.box(x, y, 250, 46, row[0], "", "side"); s.t(x, y + 34, row[1], "lbl-s", "middle"); s.hit(x - 125, y - 23, 250, 46, "tables");
    });
    s.t(24, 44, "the SQL layer's public schema — the same names a Durable Object cell keeps", "lbl-s");
    s.t(24, 336, "names are prefix-safe contract; migrations never recreate history.", "lbl-s");
  }
  choose("layers", [
    { k: "stack", label: "the stack", cap: "<b>The stack.</b> Extension code registers into a registry; below it everything is fixed runtime; below that the storage contract — swappable by adapter." },
    { k: "tables", label: "what storage keeps", cap: "<b>Storage tables.</b> conversations, entries, tasks, submissions, documents as diffs with revisions — the schema a DO cell or a JSONL file equally fulfils." }
  ], k => (k === "tables" ? drawTables() : drawStack()), "look at");
})();

/* ─── 05 · OVER TIME: healthy run vs crash-and-resume ──────────────────── */
INFO.clock = {
  commit: ["Progress commits ride the session line like everything else: the throttled partial, then entry commits. Each is a storage transaction.", "src/harness/agent.ts:35"],
  demote: ["On reopen the scheduler scans live tasks and rewrites running → pending in the same scan commit.", "src/harness/scheduler.ts:306-309"],
  resume: ["<code>harness.resume()</code> enables the scheduler; without it nothing runs — the seeded tasks sit waiting.", "src/harness/scheduler.ts:318-321"],
  kill: ["SIGKILL: no handlers, no flush, nothing graceful. Whatever was committed stays; the invocation is gone.", "lab 05's worker does this to itself"],
};
(function () {
  const s = flat("clock");
  const Y = { proc: 84, gen: 148, sto: 212, AX: 274 };
  const SC = {
    healthy: { label: "healthy round", end: 9,
      acts: [["proc", 0, 0.7, "open", "cap"], ["gen", 0.7, 1.5, "prepare commit", "cap"], ["gen", 1.5, 4.9, "request · stream", "cap"], ["sto", 0.7, 4.9, "progress commits · 100 ms (agent.ts:35)", "side"], ["sto", 4.9, 5.6, "answer entry", "ok"]],
      marks: [["gen", 4.9, "ok", "pi.assistant committed"], ["proc", 5.7, "ok", "submission settles · idle"]],
      events: [{ t: 0.7, cap: "<b>prepare.</b> The checkpoint commits before any model bytes: cutoff, model, compaction gate." },
        { t: 1.5, cap: "<b>request.</b> Streaming starts; the partial lands every ~100 ms." },
        { t: 4.9, cap: "<b>Answer committed.</b> The assistant entry rides the same commit line as everything else." },
        { t: 5.7, cap: "<b>Settle.</b> The submission resolves; the conversation idles. Experiment 01's transcript: <code>pi.user → pi.system → pi.assistant</code>." }] },
    crash: { label: "SIGKILL mid-stream", end: 9,
      acts: [["proc", 0, 0.7, "open", "cap"], ["gen", 0.7, 1.5, "prepare commit", "cap"], ["gen", 1.5, 2.7, "request · stream", "cap"], ["sto", 0.7, 2.7, "progress commits", "side"], ["proc", 4.2, 5.0, "reopen · open() scan", "cap"], ["gen", 5.0, 8.2, "request retried", "warn"], ["sto", 5.0, 8.2, "progress commits again", "side"]],
      marks: [["proc", 2.7, "bad", "SIGKILL"], ["gen", 4.2, "bad", "stale: running → pending"], ["proc", 5.05, "ok", "resume()"], ["gen", 8.2, "ok", "answer committed (2 550 chars)"]],
      events: [{ t: 1.5, cap: "<b>Streaming.</b> 144 streamed chars were the tail; earlier partials are durable." },
        { t: 2.7, cap: "<b>SIGKILL.</b> Unflushed stream, dead process; storage keeps everything up to the last progress commit." },
        { t: 4.2, cap: "<b>Reopen.</b> The scheduler's open scan rewrites <code>running</code> → <code>pending</code> for the interrupted generation." },
        { t: 5.0, cap: "<b>resume().</b> Scheduling enabled; the task re-runs from its checkpoint — the two halves differ: it is a retry, not a replay." },
        { t: 8.2, cap: "<b>The answer lands anyway.</b> Experiment 05's second process committed 2 550 chars. The run survived; the invocation did not." }] },
  };
  function draw(T, sc) {
    s.clear();
    const X = t => 120 + (t / 9) * 640;
    ["proc", "gen", "sto"].forEach((lane, i) => {
      s.t(24, Y[lane] + 4, ["processes", "generation task", "storage"][i], "lbl"); s.p(`M${X(0)} ${Y[lane]}H${X(9)}`, "ln2");
    });
    s.p(`M${X(0)} ${Y.AX}H${X(9)}`, "ln"); for (let t = 0; t <= 9; t += 3) { s.p(`M${X(t)} ${Y.AX - 4}V${Y.AX + 4}`, "ln"); s.t(X(t), Y.AX + 16, "t=" + t, "lbl-s", "middle") }
    sc.acts.forEach(a => {
      if (T < a[1]) return; const e = Math.min(T, a[2]);
      const tone = a[4] === "ok" ? "ok-f" : a[4] === "warn" ? "warn-f" : a[4];
      const w = Math.max(2, X(e) - X(a[1]));
      s.r(X(a[1]), Y[a[0]] - 9, w, 18, tone);
      if (typeof a[3] === "string" && w > a[3].length * 5.4 + 8) s.t(X(a[1]) + 5, Y[a[0]] + 4, a[3], "lbl-s");
    });
    sc.marks.forEach(m => {
      if (T < m[1]) return;
      m[2] === "bad" ? s.xmark(X(m[1]), Y[m[0]] - 22, 5) : s.check(X(m[1]), Y[m[0]] - 22, 5);
      s.t(X(m[1]) + 10, Y[m[0]] - 18, m[3], m[2] === "bad" ? "lbl-b" : "lbl-g");
    });
    s.p(`M${X(T)} 52V${Y.AX}`, "guide"); s.t(X(T), 46, "t = " + (Math.round(T * 10) / 10) + " s", "lbl", "middle");
    ["proc", "gen", "sto"].forEach(l => s.hit(X(0), Y[l] - 12, 660, 26, "commit"));
    s.hit(X(4.2), Y.gen - 22, 10, 10, "demote");
  }
  play("clock", SC, (T, sc) => draw(T, sc), { speed: 2.4, label: "scenario" });
})();

/* ─── 06 · CALL STACK: a submit, frame by frame ────────────────────────── */
INFO.calls = {
  "hub.submit()": ["The host's handle: drafts the submission and hands it to the session's submissions pipeline.", "src/harness/types.ts:90-104"],
  "admit · submissions.ts": ["One commit appends <code>pi.user</code>, creates the submission row, and resumes the scheduler.", "src/harness/submissions.ts:224-239"],
  "drain · scheduler.ts": ["The scheduler runs tasks in ownership order; a lane reserves one: the record flips to <code>running</code>. startRun creates the generation task.", "src/harness/generation.ts:697-710"],
  "prepare · generation.ts": ["A phase: it must commit a changed checkpoint or a terminal outcome — otherwise the scheduler faults the task.", "src/types.ts:148 · lab 06's fault message"],
  "request · generation.ts": ["The request phase wraps one attempt: convert partials, build the model call, classify. Retriable failures re-enter prepare.", "src/harness/generation.ts (request phase)"],
  "streamResponse · pi-ai": ["The provider stream; its abort signal is the invocation's <code>runtime.signal</code> — an abort mark cuts exactly here.", "src/harness/generation.ts:227-240"],
  "progress commit (agent.ts:35)": ["The throttled partial every ~100 ms; the write still waits in the session line.", "src/harness/agent.ts:35"],
  "classify · generation.ts": ["Tool calls? park. Plain text? append the assistant entry, then settle the run.", "src/harness/generation.ts (classify)"],
  "wait() resolves": ["<code>submission.wait()</code> resolves with the answer's entry id — everything the stack reached was committed state.", "src/harness/submissions.ts"],
};
(function () {
  const s = flat("calls"), BASE = 300, FH = 36, GAP = 8;
  const S = [
    { st: ["hub.submit()"], note: "the host drafts an input", cap: "<b>hub.submit()</b> — the durable run starts with one call from your code.", tip: "hub.submit()" },
    { st: ["hub.submit()", "admit · submissions.ts"], note: "pi.user entry + submission row, one commit", cap: "<b>Admit</b> appends the entry and the submission in one transaction; the scheduler resumes.", tip: "admit · submissions.ts" },
    { st: ["hub.submit()", "drain · scheduler.ts"], note: "a lane reserves the run: createGeneration", cap: "<b>Drain</b> starts the run: a <code>pi.generation</code> task owned by the conversation, with the run's inputs.", tip: "drain · scheduler.ts" },
    { st: ["hub.submit()", "drain · scheduler.ts", "prepare · generation.ts"], note: "checkpoint {phase: prepare, cutoff…}", cap: "<b>Prepare</b> commits what later restarts resume: the model ref, cutoff, compaction gate.", tip: "prepare · generation.ts" },
    { st: ["hub.submit()", "drain · scheduler.ts", "request · generation.ts", "streamResponse · pi-ai"], note: "signal: runtime.signal — abort lands here", cap: "<b>streamResponse</b> streams the provider. The invocation's signal is the runtime's: aborts cut exactly here.", tip: "streamResponse · pi-ai" },
    { st: ["hub.submit()", "drain · scheduler.ts", "request · generation.ts", "progress commit (agent.ts:35)"], note: "the partial lands every ~100 ms", cap: "<b>Progress commit</b> keeps the streamed partial in durable state — the crash tail.", tip: "progress commit (agent.ts:35)" },
    { st: ["hub.submit()", "drain · scheduler.ts", "classify · generation.ts"], note: "assistant entry appended; run hands over", cap: "<b>Classify</b> decides the next move: plain text appends the answer; tool calls hand over to child tasks.", tip: "classify · generation.ts" },
    { st: ["hub.submit()", "wait() resolves"], note: "settled: done → answer entry id", cap: "<b>The submission settles.</b> The host's Promise resolves with committed facts — the stack collapses, the state stays.", tip: "wait() resolves" },
  ];
  steps("calls", S, (i, step) => {
    s.clear();
    s.t(60, 30, "call stack · the top frame is running", "lbl-s");
    const frames = step.st;
    frames.forEach((fn, j) => {
      const y = BASE - j * (FH + GAP);
      s.box(300, y, 420, FH, fn, "", j === frames.length - 1 ? "ok-f cur" : "cap");
      s.hit(90, y - FH / 2, 420, FH, fn);
    });
    s.t(620, 96, "now", "lbl-s"); s.t(620, 122, step.note, "lbl");
  });
})();

/* ─── 07 · SWARM: the three topologies (+ a foreign agent) ─────────────── */
INFO.swarm = {
  "tool child": ["A tool call owns its child conversation: the subagent runs and returns, the round continues; tool replay semantics decide what a crash may rerun.", "examples/22 · src/harness/tool.ts (replay: safe | unsafe)"],
  "child transcript": ["Children hold their own transcript and generations; the parent keeps the composed answer.", "lab 02: generation 9 → pi.tool 12/13/14, children 15/21/27"],
  anchor: ["A background task that finishes at once but owns the worker conversation forever after — persistence without work.", "examples/23 · lab 03"],
  "reporter task": ["A durable task per message: deliver (idempotent requestId), wait for the answer, report. Checkpoints make restarts continue mid-delivery.", "examples/23 (app.subagent-reporter)"],
  boundary: ["The background boundary: the hub's idle waits and plain aborts stop here; <code>{ background: true }</code> crosses.", "README aborts · scheduler.ts:396-414"],
  "shared doc": ["A session-scoped document every worker reads and writes; each write is one whole revision on the session line.", "src/documents.ts:39-41 · lab 04"],
  "blackboard result": ["Six notes landed from three concurrent agents — every write a transactional revision; the host read them like any document.", "lab 04 output"],
  opencode: ["The real OpenCode CLI (v2.0.29) inside a durable tool call, and inside a background job: transcript, usage and job record all committed; exit 0.", "lab 06 output · NodeExecutionEnv via api.env"],
  claude: ["The same two doors for the real Claude Code CLI (`claude -p`): a `claude_code` tool with replay \"unsafe\" and a `lab.claude-job` background task. Written and refused loudly until the CLI is authed (`ANTHROPIC_API_KEY` or `claude /login`).", "lab 07 script (not executed here — no Claude Code auth on the machine)"],
};
(function () {
  const s = flat("swarm");
  function foreground() {
    s.clear();
    s.box(160, 130, 260, 64, "orchestrator conversation", "one durable transcript", "cap", "child transcript");
    s.box(520, 130, 220, 64, "pi.generation", "parks on child calls", "cap", "tool child");
    s.arrow([[290, 130], [408, 130]], "ln", 5); s.t(349, 112, "one round · 3 tools", "lbl-s", "middle");
    [420, 540, 660].forEach((x, i) => {
      s.box(x, 226, 108, 44, "pi.tool", "call " + (i + 1), i === 1 ? "cap" : "side", "tool child");
      s.arrow([[520 + (i - 1) * 40, 164], [x, 202]], i === 1 ? "ln" : "wire", 4);
    });
    s.box(520, 318, 300, 52, "child conversations · 15 / 21 / 27", "own transcripts · own generations", "side", "child transcript");
    s.arrow([[476, 250], [468, 290]], "ln", 5); s.arrow([[544, 250], [520, 288]], "wire", 5); s.arrow([[636, 250], [572, 288]], "wire", 5);
    s.t(24, 380, "lab 02 · example 22: the composed answer cites all three children", "lbl-s");
  }
  function background() {
    s.clear();
    s.box(150, 96, 240, 60, "hub conversation", "idle between reports", "cap");
    s.p("M340 40V330", "guide"); s.t(425, 52, "background boundary", "lbl-b", "middle"); s.t(425, 68, "plain abort() stops here;", "lbl-s", "middle"); s.t(425, 82, "{background:true} crosses", "lbl-s", "middle"); s.hit(348, 40, 132, 290, "boundary");
    s.box(585, 130, 190, 46, "anchor task", "background · done at once", "cap", "anchor");
    s.arrow([[274, 110], [486, 130]], "wire", 5); s.t(370, 134, "spawned", "lbl-s", "middle");
    s.box(800, 90, 190, 46, "worker conversation", "persistent", "side");
    s.arrow([[650, 118], [701, 95]], "wire", 5); s.t(672, 78, "owns", "lbl-s", "middle");
    s.box(660, 246, 250, 52, "reporter task", "deliver → wait → report", "cap", "reporter task");
    s.arrow([[800, 116], [745, 218]], "ln", 5); s.arrow([[535, 272], [235, 128]], "ln", 5);
    s.t(330, 190, "report lands as follow-up input", "lbl-s", "middle");
    s.t(24, 380, "lab 03 · example 23: atlas aborted mid-answer (stopReason aborted), boreas reported, hub acknowledged", "lbl-s");
  }
  function blackboard() {
    s.clear();
    s.box(140, 74, 220, 46, "host", "seeds workers, reads results", "cap");
    [168, 232, 296].forEach((y, i) => {
      s.box(140, y, 220, 44, "worker " + (i + 1), "own generation", "side");
      s.arrow([[254, y + 4], [606, y + 4]], i === 0 ? "ln" : "wire", 4);
      s.hit(330, y - 26, 300, 40, "shared doc");
    });
    s.cyl(700, 108, 170, 150, "side", "cap"); s.t(700, 174, "session doc", "lbl", "middle"); s.t(700, 192, "one revision per write", "lbl-s", "middle");
    s.r(460, 328, 420, 48, "cut"); s.t(482, 348, "OpenCode CLI (the real one) · lab 06", "lbl"); s.t(482, 364, "runs inside a durable tool call; answer committed", "lbl-s"); s.hit(460, 328, 420, 48, "opencode");
    s.t(24, 404, "lab 04: 6 notes from 3 concurrent agents · lab 06: exit 0, answer in the transcript", "lbl-s");
    s.hit(24, 394, 660, 20, "blackboard result");
    s.t(24, 422, "lab 07: the same two doors now also wrap `claude -p` (Claude Code) — runs once the CLI is authed.", "lbl-s");
    s.hit(24, 412, 660, 18, "claude");
  }
  choose("swarm", [
    { k: "foreground", label: "foreground subagents", cap: "<b>Foreground.</b> The orchestrator's round spawns tool tasks; each owns a child conversation with its own transcript. The composed answer assembles all of them. (lab 02 · example 22)" },
    { k: "background", label: "persistent + reported", cap: "<b>Persistent.</b> Anchors keep workers alive across turns; reporters carry messages in and answers out as durable tasks. Abort crosses the boundary only when asked. (lab 03 · example 23)" },
    { k: "blackboard", label: "blackboard + foreign", cap: "<b>Host-driven.</b> Workers coordinate through one session document — every write a revision — and a foreign agent (the real OpenCode CLI) joins through a tool call. (lab 04 + 06)" }
  ], k => (k === "background" ? background() : k === "blackboard" ? blackboard() : foreground()), "pattern");
})();

/* ─── 08 · DEPLOY: laptop, cell, fleet ─────────────────────────────────── */
INFO.deploy = {
  "node storage": ["One SQLite file under the lab; freshStorage for a new run, openStorage to reattach (crash experiment 05).", "swarm-lab/_shared.ts · lab 05"],
  "do storage": ["The same storage contract over <code>ctx.storage.sql</code>: commits are the DO's storage transactions; one session per cell.", "src/storage/sqlite/cloudflare.ts:187-197"],
  celld: ["Self-hosted workerd runs wrangler bundles; dev mode needs no bucket, deploys lease one. The README measures ~90 ms per DO write vs ~25 ms on plain disk per line.", "denoland/celld README (fetched) · lab 07 executed under celld dev v0.6.2"],
  "cloudflare today": ["Cloudflare's own SQLite-backed Durable Objects take the same worker today; deployment there is a wrangler bind away, no code change.", "README.md:669 · lab 07 wrangler.jsonc"],
};
(function () {
  const s = flat("deploy");
  function laptop() {
    s.clear();
    s.box(300, 120, 360, 74, "your process", "Node 26 · the lab's runs", "cap", "node storage");
    s.arrow([[300, 158], [300, 210]], "ln", 5);
    s.cyl(300, 212, 210, 88, "side", "cap"); s.t(300, 248, "SQLite file", "lbl", "middle"); s.t(300, 266, "commits = journal transactions", "lbl-s", "middle");
    s.t(24, 330, "experiments 01–06 ran here for real — SIGKILL and resume included (05).", "lbl-s");
  }
  function object() {
    s.clear();
    s.box(300, 110, 380, 66, "worker: SwarmCell", "one harness · one root · HTTP demo routes", "cap", "do storage");
    s.arrow([[404, 146], [404, 210]], "ln", 5); s.t(292, 182, "openDurableObjectSqliteStorage(ctx.storage)", "lbl-s", "end");
    s.cyl(300, 212, 240, 92, "side", "cap"); s.t(300, 250, "DO storage", "lbl", "middle"); s.t(300, 268, "commits = DO storage transactions", "lbl-s", "middle");
    s.t(24, 330, "lab 07: EXECUTED under `celld dev` — note written through the cell's SQLite; restart recovered it.", "lbl-s");
  }
  function fleet() {
    s.clear();
    [["cell 1", 130], ["cell 2", 470], ["cell 3", 810]].forEach(c => {
      s.box(c[1], 100, 164, 54, c[0], "one session each", "cap", "celld");
      s.arrow([[c[1], 130], [470, 226]], "wire", 4);
    });
    s.cyl(470, 228, 220, 96, "side", "cap"); s.t(470, 266, "bucket", "lbl", "middle"); s.t(470, 284, "leases · LTX replication", "lbl-s", "middle");
    s.t(24, 352, "celld: `celld dev` local (no bucket, port 9876) · `celld deploy --bucket s3://…` for a fleet.", "lbl-s");
    s.t(24, 370, "the same cells run on Cloudflare today; the worker file is identical (compat flags aside).", "lbl-s");
    s.hit(24, 358, 660, 20, "cloudflare today");
  }
  choose("deploy", [
    { k: "laptop", label: "a laptop first", cap: "<b>Node first.</b> The lab's experiments ran on plain Node + a SQLite file: durable semantics are the runtime's, not the host's." },
    { k: "object", label: "one DO cell", cap: "<b>A Durable Object.</b> <code>openDurableObjectSqliteStorage</code> aims the harness at <code>ctx.storage</code>; commits become the cell's transactions. Same application code." },
    { k: "fleet", label: "a self-hosted fleet", cap: "<b>Fleet.</b> celld runs the same worker as a fleet over a bucket; <code>celld dev</code> exercises it locally without a bucket." }
  ], k => (k === "object" ? object() : k === "fleet" ? fleet() : laptop()), "target");
})();
