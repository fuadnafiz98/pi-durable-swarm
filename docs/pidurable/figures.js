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

/* ─── 03 · STORAGE: one commit, atom by atom ───────────────────────────── */
INFO.commit = {
  callback: ["One commit callback can change documents, create tasks and append entries together — they share one fate.", "src/harness/harness.ts:230-232 (commitWith) · src/types.ts:146-150"],
  overlay: ["Inside the callback, reads replay committed data plus your drafts. Other processes bind to the last committed incarnation and never see a draft.", "src/session/transaction.ts:683-690 (drafts revoked at prepare) · src/types.ts:887"],
  judge: ["For a task phase the rule is absolute: the checkpoint or outcome returned through <code>runtime.commit()</code> is the decision; returning without durable progress faults the task.", "src/types.ts:146-150 · src/harness/scheduler.ts:1363"],
  ledger: ["All writes ride one SQLite transaction: metadata → global-id checks → document checks → table writes → document actions — then the seq advances.", "src/storage/sqlite/storage.ts:191-201"],
  settled: ["Committed rows are closed to change: a dead process cannot unwrite, and the next process opening the file reads exactly these rows.", "src/types.ts:505-536 · lab 05"],
  tables: ["The nine public tables: durable_schema, durable_metadata, record_ids, conversations, entries, tasks, submissions, documents, document_revisions.", "src/storage/sqlite/schema.ts:5-16"],
};
(function () {
  const s = flat("commit");
  const CX = 640, CY = 118;
  function ledger() {
    s.cyl(CX, CY, 210, 140, "side", "cap");
    s.t(CX, CY + 64, "your SQLite file", "lbl", "middle");
    s.t(CX, CY + 86, "9 public tables", "lbl-s", "middle");
    s.hit(CX - 105, CY, 210, 150, "tables");
  }
  steps("commit", [
    { cap: "<b>one callback.</b> Docs, tasks, entries: whatever one <code>commit(fn)</code> touches lands — or rolls back — together." },
    { cap: "<b>the overlay.</b> Your reads see committed rows re-played with your drafts; nobody else ever sees a draft." },
    { cap: "<b>the judge.</b> For task phases the returned state <em>is</em> the decision: a bare return faults <code>faulted</code>." },
    { cap: "<b>the ledger.</b> One SQLite transaction applies everything; the ledger jumps settled → settled." },
    { cap: "<b>settled.</b> Rows are forever; the retry re-runs from state, and committed state never reverts." },
  ], function (i) {
    s.clear();
    ledger();
    if (i === 0) {
      s.box(140, 124, 200, 56, "host commit(fn)", "docs · tasks · entries together", "cap", "callback");
      s.box(336, 104, 130, 38, "doc draft", "", "side", "callback");
      s.box(336, 148, 130, 38, "task + entry", "", "side", "callback");
      s.arrow([[244, 124], [266, 108]], "ln", 4);
      s.arrow([[244, 130], [266, 146]], "ln", 4);
      s.arrow([[404, 126], [532, 148]], "ln", 5);
      s.t(24, 200, "one callback, one fate — everything lands or nothing does", "lbl-s");
    } else if (i === 1) {
      s.t(24, 64, "the draft overlay", "lbl-s");
      s.box(250, 130, 300, 64, "you read", "committed rows + your drafts", "cap", "overlay");
      s.box(250, 262, 300, 64, "every other process", "committed rows only — never drafts", "side", "overlay");
      s.arrow([[402, 130], [532, 152]], "ln", 5);
      s.arrow([[402, 262], [532, 218]], "wire", 4);
      s.xmark(492, 244);
      s.t(24, 314, "drafts exist only under the writer — outside, the last commit", "lbl-s");
    } else if (i === 2) {
      s.box(150, 120, 190, 52, "task phase", "the handler runs", "cap", "judge");
      s.box(500, 144, 300, 56, "runtime.commit(fn) → returned", "the state that survives", "ok-f", "judge");
      s.arrow([[248, 122], [346, 138]], "ln", 5);
      s.box(500, 242, 300, 44, "bare return", "no committed checkpoint", "cut", "judge");
      s.arrow([[585, 174], [585, 218]], "guide", 4);
      s.xmark(750, 242); s.t(768, 248, "faulted", "lbl-b");
      s.t(24, 314, "returning without durable progress is a contract break, reported loudly", "lbl-s");
    } else if (i === 3) {
      var rows = ["metadata check", "checkGlobalIds", "checkDocumentActions", "applyTableWrite …", "applyDocumentActions"];
      rows.forEach(function (t, r) {
        s.r(760, 52 + r * 36, 190, 30, r < 4 ? "ok-f" : "cap");
        s.t(852, 68 + r * 36, t, r < 4 ? "lbl" : "lbl-s", "middle");
        if (r < 4) s.t(938, 68 + r * 36, "✓", "lbl");
      });
      s.box(170, 208, 210, 56, "one SQLite transaction", "then the seq advances", "cap", "ledger");
      s.arrow([[278, 208], [754, 190]], "ln", 5);
      s.t(24, 314, "intermediate states never exist to observers — settled jumps to settled", "lbl-s");
    } else {
      s.box(150, 120, 190, 52, "process A", "died mid-flight", "cut", "settled");
      s.xmark(240, 94);
      s.box(150, 252, 190, 52, "process B", "opens the same file", "cap", "settled");
      s.arrow([[248, 122], [568, 166]], "guide", 4);
      s.arrow([[248, 252], [568, 142]], "ln", 4);
      s.t(24, 314, "the retry re-runs from state; the committed rows never revert", "lbl-s");
    }
  });
})();

/* ─── 04 · SUBMISSIONS: the two lifetimes ──────────────────────────────── */
INFO.subm = {
  queued: ["Admitted but not yet in the transcript: it waits behind the inbox (busy gates, queue order).", "src/types.ts:383-390 · src/harness/inbox.ts:99-111"],
  placed: ["A run owns it: the entry is in the transcript and the run owes the answer.", "src/types.ts:391-398"],
  done: ["The answer entry (or appended write) is committed; waiters resolve. It never changes again.", "src/types.ts:399-406 · src/types.ts:843 (settleSubmission)"],
  unanswered: ["Terminal without an answer, with a durable reason. A placed input keeps its entry.", "src/types.ts:407-414"],
  write: ["Passive writes have no model round: the entry lands and it settles done — or unanswered.", "src/types.ts:416-443"],
  abort: ["<code>abortSubmission</code>: 'aborted' (in flight), 'already_placed' (a run owns it), 'settled', 'not_found'.", "src/harness/submissions.ts:30 · src/harness/harness.ts:290-293"],
  requestid: ["Host-supplied dedupe: same requestId + type idempotently settles — retry-safe delivery.", "src/types.ts:374-375"],
};
(function () {
  const s = flat("subm");
  function draw(k) {
    s.clear();
    const input = k === "input";
    s.box(170, 108, 130, 46, "queued", "", "cap", "queued");
    if (input) {
      s.box(450, 108, 130, 46, "placed", "entryId", "cap", "placed");
      s.arrow([[238, 108], [382, 108]], "ln", 5);
      s.t(310, 90, "inbox admits it", "lbl-s", "middle");
      s.box(730, 108, 160, 46, "done ✓", "answer entryId", "ok-f", "done");
      s.arrow([[518, 108], [646, 108]], "ln", 5);
      s.t(582, 90, "answered", "lbl-s", "middle");
      s.box(730, 232, 160, 46, "unanswered ✗", "reason + detail", "side", "unanswered");
      s.arrow([[518, 128], [628, 214]], "guide", 4);
      s.t(540, 176, "never answered", "lbl-s");
    } else {
      s.box(730, 108, 160, 46, "done ✓", "entryId", "ok-f", "write");
      s.arrow([[238, 108], [646, 108]], "ln", 5);
      s.t(442, 90, "appendEntry — no model round", "lbl-s", "middle");
      s.box(730, 232, 160, 46, "unanswered ✗", "reason", "side", "unanswered");
      s.arrow([[238, 128], [628, 214]], "guide", 4);
      s.t(420, 170, "kept out — or the entry refuses", "lbl-s");
    }
    s.box(190, 272, 240, 40, "submission.wait(context)", "resolves on done · unanswered", "side", "abort");
    s.t(322, 274, "you hold this Promise; the state is on disk", "lbl-s");
    s.t(24, 24, "one submission row per input (or write)", "lbl-s");
    s.hit(24, 14, 260, 18, "requestid");
  }
  choose("subm", [
    { k: "input", label: "an input", cap: "<b>Input.</b> queued → placed (its <code>pi.user</code> entry) → done (its answer) or unanswered. <code>wait()</code> resolves on the terminal states; a restart replays the record, not the round." },
    { k: "write", label: "a passive write", cap: "<b>Write.</b> Same record shape, no model: the entry lands and it settles <code>done</code> — or stays <code>unanswered</code> with a reason. Writes never park a run." },
  ], draw, "kind");
})();

/* ─── 06 · GRAPHS: lab 02's real graph, edge by edge ───────────────────── */
INFO.graphs = {
  genroot: ["The round runs as a generation task — a <code>pi.generation</code> owned by the root conversation.", "src/harness/generation.ts:697-710 · INFO.flow:admit"],
  tooltask: ["Each tool call of an answer is its own <code>pi.tool</code> task, parallel by default; the run parks <code>waiting</code> on them.", "src/harness/agent.ts:69 · src/types.ts:519-525"],
  owneredge: ["The ownership edge: <code>ConversationRecord.owner = { conversationId, taskId }</code>. The task owns the child conversation — aborts walk it, waits sum it.", "src/types.ts:306-315"],
  idlewait: ["Idle waits over a conversation sum its subtree: every ordinary (non-background) owned task must be terminal.", "src/harness/scheduler.ts · src/types.ts:287-293"],
  abortwalk: ["An abort mark walks the ordinary ownership scope top-down; the invocation dies at its next step, settling <code>aborted</code>.", "src/harness/scheduler.ts:396-414 · lab 03"],
};
(function () {
  const s = flat("graphs");
  const T = { gen9: [150, 130, "generation 9"], t12: [430, 130, "tool 12"], t13: [650, 130, "tool 13"], t14: [855, 130, "tool 14"] };
  const C = { root: [150, 322, "root conversation"], c15: [430, 322, "conversation 15"], c21: [650, 322, "conversation 21"], c27: [855, 322, "conversation 27"] };
  const OWN = [["t12", "c15"], ["t13", "c21"], ["t14", "c27"]];
  function draw(i) {
    s.clear();
    s.t(24, 24, "lab 02's committed graph — ids exactly as they landed in .data", "lbl-s");
    for (const key in C) {
      const c = C[key];
      if (i < (key === "root" ? 0 : 2)) continue;
      s.cyl(c[0], c[1], key === "root" ? 200 : 160, 80, key === "root" ? "cap" : "side", "cap");
      s.t(c[0], c[1] + 44, c[2], "lbl", "middle");
    }
    s.arrow([[150, 152], [150, 318]], i === 0 ? "ln" : "wire", 4);
    s.t(166, 236, "runs on ↓", "lbl-s");
    s.box(T.gen9[0], T.gen9[1], 170, 44, "generation 9", "the round", i === 0 ? "ok-f cur" : "can fm", "genroot");
    s.hit(150 - 85, T.gen9[1] - 22, 170, 44, "genroot");
    if (i >= 1) {
      ["t12", "t13", "t14"].forEach(function (tk) {
        const t = T[tk];
        s.box(t[0], t[1], 150, 44, t[2], "pi.tool", (i >= 3 && tk === "t13") ? "warn-f cur" : i === 1 ? "ok-f cur" : "cap", "tooltask");
        s.hit(t[0] - 75, t[1] - 22, 150, 44, "tooltask");
      });
      s.arrow([[240, 126], [352, 122]], i === 1 ? "ln" : "wire", 4);
      s.t(300, 104, "× 3 tool tasks", "lbl-s", "middle");
      s.hit(340, 262, 220, 140, "owneredge");
      s.hit(590, 100, 130, 180, "abortwalk");
      s.hit(780, 262, 200, 140, "idlewait");
    }
    if (i >= 2) {
      OWN.forEach(function (o) {
        const t = T[o[0]];
        const hot = o[0] === "t13" && i === 3;
        s.arrow([[t[0], 152], [t[0], 318]], hot ? "bad-l" : i === 3 ? "wire" : "ln", 5);
        s.t(t[0] + 42, 236, "owns ↓", hot ? "lbl-b" : "lbl-s");
      });
    }
    if (i === 3) {
      s.xmark(650, 244);
      s.t(548, 258, "aborted ✗", "lbl-b");
      s.t(24, 414, "idle waits sum the ordinary owned edges; background ones sit outside the sum", "lbl-s");
      s.hit(24, 402, 920, 22, "idlewait");
    }
  }
  steps("graphs", [
    { cap: "<b>root runs.</b> One root conversation; its round is generation task 9 — the runs-on edge." },
    { cap: "<b>tools spawn.</b> Three tool calls become three durable <code>pi.tool</code> tasks, parallel by default." },
    { cap: "<b>children open.</b> Each tool task owns a child conversation — the edge that powers all choreography." },
    { cap: "<b>abort + waits.</b> An abort walks one ownership edge down; idle waits need the ordinary edges standing." },
  ], draw);
})();

/* ─── 09 · PUMP: what turns work on ────────────────────────────────────── */
INFO.pump = {
  paused: ["The scheduler ships <code>#enabled = false</code>: no drain, no admit, no work at all.", "src/harness/scheduler.ts:267 · :1096-1099 · :1266 ('paused')"],
  submit: ["<code>conversation.submit()</code> resumes the pump before returning.", "src/harness/submissions.ts:65 · src/harness/harness.ts:205"],
  waits: ["Every wait — <code>waitForTask</code>, <code>waitForIdle</code>, <code>submission.wait</code> — resumes first, settles second.", "src/harness/harness.ts:244-290"],
  abort: ["<code>conversation.abort()</code> resumes too: cancel intents need a live pump to walk.", "src/harness/harness.ts:150-152 · scheduler.ts:396-414"],
  trap: ["A commit can seed tasks (<code>createTask</code>)… but a commit alone never flips the pump. Seeded work sits as rows.", "src/harness/scheduler.ts:1096-1099"],
  kick: ["<code>harness.resume()</code> sets enabled = true: the explicit kick, exactly what lab 03's host needed.", "src/harness/scheduler.ts:318-321 · lab 03"],
  drain: ["Once enabled, <code>#drain()</code> sweeps pending work; callers never see a half-drained state.", "src/harness/scheduler.ts:1102-1112"],
};
(function () {
  const s = flat("pump");
  const labels = ["plain commit", "submit()", "wait()", "abort()", "createTask in commit", "harness.resume()"];
  const chips = ["paused", "submit", "waits", "abort", "trap", "kick"];
  function draw(i) {
    s.clear();
    const paused = i === 0 || i === 4;
    s.box(150, 148, 200, 56, "host", "your code", "cap");
    s.box(500, 150, 280, 110, "scheduler", "gate: draining? enabled?", paused ? "cut" : "can fm", chips[i]);
    s.t(500, 228, paused ? "scheduling: paused" : i === 5 ? "scheduling: RUNNING (kicked)" : "scheduling: running", paused ? "lbl-s" : "lbl", "middle");
    s.cyl(850, 96, 170, 110, "side", "cap");
    s.t(850, 190, "storage", "lbl", "middle");
    s.arrow([[254, 148], [356, 148]], paused ? "wire" : "ln", 5);
    s.t(305, 130, labels[i], "lbl-s", "middle");
    s.arrow([[644, 148], [760, 148]], (i >= 1 && i !== 4) ? "ln" : "wire", 5);
    if (i === 1) s.t(500, 76, "resume ← submissions", "lbl", "middle");
    if (i === 2) s.t(500, 76, "resume ← every wait", "lbl", "middle");
    if (i === 3) s.t(500, 76, "resume ← conversation.abort", "lbl", "middle");
    if (i === 5) s.t(500, 76, "resume() — enabled = true", "lbl", "middle");
    if (i >= 4) {
      s.box(790, 252, 220, 40, "seeded task row", "waiting in storage", i === 5 ? "ok-f" : "side", "trap");
      s.arrow([[856, 208], [856, 230]], "guide", 4);
      s.hit(678, 230, 280, 50, "trap");
    }
    s.t(24, 24, "one gate answers to four kinds of call-ins (scheduler.ts:1096)", "lbl-s");
    s.hit(24, 12, 380, 20, "paused");
    s.hit(770, 62, 180, 180, "drain");
  }
  steps("pump", [
    { cap: "<b>commits happen, pump paused.</b> A commit writes rows and stops — nothing schedules." },
    { cap: "<b>submit().</b> Admission calls <code>tasks.resume()</code> on the way in — the pump flips running." },
    { cap: "<b>any wait().</b> waitForTask / waitForIdle / submission.wait() resume first." },
    { cap: "<b>an abort().</b> Cancellation resumes too — the abort walk needs a live pump." },
    { cap: "<b>the trap.</b> A commit-seeded task is stored… and waits: a pure commit can't start it." },
    { cap: "<b>the kick.</b> <code>harness.resume()</code> enables; the drain sweeps everything seeded — lab 03's fix." },
  ], draw);
})();

/* ─── 12 · FACTORY: floor, shelves, machines, shipping ─────────────────── */
INFO.factory = {
  intake: ["Inputs arrive as submissions with a dedupe key; the queue is durable rows, not memory.", "src/types.ts:371-376 · inbox.ts:99-111"],
  router: ["The root conversation reads the board and drives; its model calls spawn durable tasks.", "lab 02 · INFO.flow:admit"],
  workshop: ["A workshop = a task owning a worker conversation; the bond survives any restart.", "src/types.ts:306-315 · lab 03"],
  shelves: ["Scoped docs: session (shared by all), conversation (per workshop), task (per job).", "src/documents.ts:39-51 · lab 04"],
  machines: ["Tools shell out via one ExecutionEnv seam; foreign CLIs are durable calls, replay-guarded.", "src/harness/tool.ts · lab 06/07"],
  shipping: ["The answer lands (its entryId); the submission settles done; waiters wake.", "src/types.ts:843 · submission.wait()"],
  human: ["A human is just another submission: queued until they return — the factory never blocks forever on them.", "inbox.ts:99-111"],
  report: ["Reporter tasks are forklifts: deliver orders, carry results back — at-least-once across restarts.", "lab 03 reporters"],
};
(function () {
  const s = flat("factory");
  function workshop(x, name, active) {
    s.box(x, 150, 160, 60, name, "anchor owns workers", active ? "can fm cur" : "cap", "workshop");
    s.cyl(x, 250, 160, 80, "side", "cap");
    s.t(x, 292, "worker transcript", "lbl", "middle");
    s.arrow([[x, 182], [x, 246]], "ln", 4);
    s.t(x + 34, 214, "owns ↓", "lbl-s");
  }
  function draw(k) {
    s.clear();
    if (k === "floor") {
      s.box(120, 150, 170, 60, "intake", "submit {requestId}", "cap", "intake");
      s.box(400, 150, 170, 60, "router", "root conversation", "cap", "router");
      s.arrow([[207, 150], [313, 150]], "ln", 5);
      workshop(640, "workshop A", true);
      workshop(840, "workshop B", false);
      s.cyl(400, 270, 170, 80, "cap", "cap");
      s.t(400, 312, "job doc · session scope", "lbl", "middle");
      s.arrow([[450, 184], [412, 266]], "wire", 4);
      s.box(120, 400, 170, 52, "human gate", "", "cut", "human");
      s.t(133, 368, "their next input →", "lbl-s");
      s.arrow([[88, 396], [88, 184]], "guide", 4);
      s.t(56, 300, "slot in", "lbl-s");
      s.box(670, 400, 200, 52, "shipping", "submissions → done ✓", "cap", "shipping");
      s.arrow([[650, 332], [668, 372]], "wire", 4);
      s.t(24, 24, "the floor — pick a zone chip; hover anything for its primitive", "lbl-s");
      s.hit(28, 82, 180, 100, "intake");
      s.hit(320, 82, 160, 100, "router");
      s.hit(560, 82, 200, 100, "workshop");
      s.hit(28, 372, 190, 80, "human");
      s.hit(578, 372, 250, 70, "shipping");
    } else if (k === "shelves") {
      [[150, "session doc", "one per session · everyone"], [500, "conversation doc", "one per conversation"], [830, "task doc", "one per task"]].forEach(function (z) {
        s.cyl(z[0], 70, 200, 84, "cap", "cap");
        s.t(z[0], 112, z[1], "lbl", "middle");
        s.t(z[0], 132, z[2], "lbl-s", "middle");
      });
      s.box(150, 250, 200, 48, "who writes?", "every worker (blackboard)", "cap", "shelves");
      s.box(500, 250, 200, 48, "who reads?", "that conversation + tasks", "cap", "shelves");
      s.box(830, 250, 200, 48, "who commits?", "the owning task's phases", "cap", "shelves");
      s.t(24, 330, "one write = one committed revision; rewindable scopes replay history", "lbl-s");
      s.t(24, 24, "scoped documents = the shelving system", "lbl-s");
    } else if (k === "machines") {
      s.box(150, 128, 150, 62, "exec env", "the seam", "cap", "machines");
      s.box(420, 128, 240, 62, "tool call", "replay decides re-runs", "cap", "machines");
      s.arrow([[228, 128], [296, 128]], "ln", 5);
      s.t(262, 110, "api.env.exec", "lbl-s", "middle");
      s.r(140, 210, 520, 110, "cut");
      s.t(400, 234, "remote machine — separate, untrusted process", "lbl-s", "middle");
      [260, 420, 580].forEach(function (x, n) { s.box(x, 282, 150, 36, ["opencode run", "claude -p", "bash"][n], "", "cap", "machines"); });
      s.t(24, 350, "one seam: the same tools run on a laptop or inside a DO cell", "lbl-s");
      s.t(24, 24, "machines", "lbl-s");
    } else {
      [[170, "queued"], [450, "placed → entry"], [720, "done ✓ → answer"]].forEach(function (p, n) {
        s.box(p[0], 120, 170, 50, p[1], "", n === 2 ? "ok-f" : "cap", "shipping");
        if (n < 2) s.arrow([[p[0] + 88, 120], [p[0] + 172, 120]], "ln", 5);
      });
      s.box(200, 260, 240, 56, "reporter task", "deliver ↔ carry back", "cap", "report");
      s.box(560, 260, 240, 56, "human re-entry", "the next submit", "side", "human");
      s.arrow([[536, 142], [560, 230]], "guide", 4);
      s.t(24, 340, "the line ends committed: an answer entry, a settled row", "lbl-s");
      s.t(24, 24, "shipping", "lbl-s");
    }
  }
  choose("factory", [
    { k: "floor", label: "the floor", cap: "<b>Floor.</b> Intake → router → workshops → shipping; a human slides in as just another submission — a dashed gate, never a blocking boss." },
    { k: "shelves", label: "the shelves", cap: "<b>Shelves.</b> Scoped documents: the scope defines who shares them; every write is one committed revision." },
    { k: "machines", label: "the machines", cap: "<b>Machines.</b> Tools run binaries through one seam; foreign CLIs are machines too — replay decides crash semantics." },
    { k: "shipping", label: "shipping", cap: "<b>Shipping.</b> A job ends when its submission settles <code>done</code> with an answer entry — waiters wake everywhere." },
  ], draw, "zone");
})();

INFO.knobs = {
  scope: ["<code>session | conversation | task</code>: who shares the doc; rewindable scopes replay history.", "src/documents.ts:39-51"],
  own: ["A task always names its owner: conversation-owned (joins that conversation's waits/aborts) or task-owned (nesting).", "src/types.ts:274-286"],
  bg: ["<code>background: true</code> subtracts the task from idle waits, conversation aborts and cascades — it outlives the round.", "src/types.ts:287-293 · lab 03"],
  abandon: ["<code>abandonOnRestart</code>: if its creator died with the restart, the task is abort-marked 'restart' — not worth resuming alone.", "src/types.ts:295-299 · :560-561"],
  replay: ["Tool <code>replay: 'safe' | 'unsafe'</code>: would a crash re-run this call? Foreign CLIs answer 'no'.", "src/harness/tool.ts · lab 06"],
  waits: ["<code>submission.wait()</code> for your own input; <code>waitForTask</code>/<code>waitForIdle</code> for ownership sums — each resumes the pump.", "src/harness/harness.ts:244-290"],
};
(function () {
  const s = flat("knobs");
  const K = [
    ["doc scope", "session · conversation · task", "scope", 170, 110],
    ["ownership", "conversation | task", "own", 480, 110],
    ["background", "out of waits & aborts", "bg", 790, 110],
    ["abandonOnRestart", "creator died → abort it", "abandon", 170, 250],
    ["tool replay", "safe | unsafe", "replay", 480, 250],
    ["the waits", "task · idle · submission", "waits", 790, 250],
  ];
  s.clear();
  K.forEach(function (k) {
    s.box(k[3], k[4], 240, 76, k[0], k[1], "cap", k[2]);
    s.hit(k[3] - 120, k[4] - 38, 240, 76, k[2]);
  });
  s.t(24, 24, "six decisions per member — hover a knob for its receipt", "lbl-s");
  s.t(24, 340, "combine: anchor = ownership + background · blackboard = docs + waits · subagents = tools + replay", "lbl-s");
})();

INFO.pipeline = {
  spec: ["The build request is a submitted, placed input — the line's first committed row.", "src/harness/submissions.ts · INFO.flow"],
  builder: ["The router spawns the builder inside its own commit: <code>createTask</code> + conversation ownership.", "src/types.ts:274-286"],
  wait: ["The builder parks <code>waiting</code> until its tester task settles, then resumes at the checkpoint.", "src/types.ts:519-525"],
  failed: ["<code>failed</code> is decided by the task and is terminal — the orchestrator spawns the next thing instead.", "src/types.ts:465-475"],
  bgstate: ["A background reviewer writes progress into a doc; the line's waits ignore it.", "src/types.ts:287-293"],
  finish: ["The orchestrator appends the answer; <code>settleSubmission</code> marks done — the original wait resolves.", "src/types.ts:843"],
};
(function () {
  const s = flat("pipeline");
  const P = { spec: [100, 120], router: [290, 120], builder: [490, 120], tester: [700, 120], fixer: [880, 120], reviewer: [490, 260], ship: [720, 260] };
  const act = ["spec", "router", "builder", "tester", "reviewer", "ship"];
  const tips = { spec: "spec", router: "builder", builder: "wait", tester: "failed", fixer: "failed", reviewer: "bgstate", ship: "finish" };
  const states = ["placed", "spawns builder", "waiting on tester", "failed → spawn fixer", "background:true", "settled ✓"];
  function draw(i) {
    s.clear();
    const who = act[i];
    const edges = [
      { pts: [[172, 120], [218, 120]], on: i >= 1 },
      { pts: [[362, 120], [418, 120]], on: i >= 2 },
      { pts: [[562, 120], [628, 120]], on: i >= 3 },
      { pts: [[772, 120], [808, 120]], on: i >= 3 },
      { pts: [[490, 144], [490, 236]], on: i >= 4 },
      { pts: [[880, 144], [880, 230], [792, 260]], on: i >= 5 },
    ];
    edges.forEach(function (e) { if (e.on) s.arrow(e.pts, "wire", 4); });
    ["spec", "router", "builder", "tester", "fixer", "reviewer", "ship"].forEach(function (name, n) {
      const p = P[name];
      const on = n <= i && !(name === "fixer" && i < 3);
      const hot = name === who;
      s.box(p[0], p[1], on ? 140 : 120, 44, name, "", hot ? "ok-f cur" : on ? "cap" : "guide", tips[name]);
      if (name === who) s.t(p[0], p[1] + 42, states[i], "lbl", "middle");
    });
    if (i === 3) s.xmark(P.tester[0] + 62, P.tester[1] - 16);
    s.t(24, 24, "one build job — everything lit is already committed state", "lbl-s");
    s.hit(560, 84, 190, 52, "wait");
    s.hit(740, 180, 170, 50, "failed");
    s.hit(400, 214, 180, 52, "bgstate");
    s.hit(620, 226, 190, 52, "finish");
  }
  steps("pipeline", [
    { cap: "<b>spec in.</b> The request is a placed input — the line's first committed row." },
    { cap: "<b>router plans.</b> The root conversation spawns the builder inside its own commit." },
    { cap: "<b>builder waits.</b> It parks on the tester, then resumes at its checkpoint — never from zero." },
    { cap: "<b>tester fails.</b> Outcome <code>failed</code> is terminal; the fixer is spawned next." },
    { cap: "<b>reviewer behind.</b> Background: writes progress as it goes, never blocks the line." },
    { cap: "<b>ship.</b> The answer appends; the original submission settles done. The whole job is stored state." },
  ], draw);
})();
