/* The diagram grammar catalog — 101 grammars over the same pi-durable facts.
 * Receipts inherited from docs/pidurable. Static grammars are compact; the
 * interactive ones reuse proven figure shapes. */

/* small local helpers */
const lg = (s, pts, label, cls, lx, ly, an) => { s.arrow(pts, cls || "ln", 5); if (label) s.t(lx, ly, label, cls === "wire" ? "lbl-s" : "lbl", an || "middle"); };

/* ─ g01 regions ─────────────────────────────────────────────────────────── */
INFO.g01 = {
  "queue": ["Admits an input: the pi.user entry and a submission row in one commit; same requestId returns the first submission.", "src/harness/submissions.ts:224-239"],
  "scheduler": ["Pending/running/waiting lanes; submissions, waits and aborts resume the pump.", "src/harness/scheduler.ts:318-321"],
  "transcripts": ["Entries per conversation, the pi.live doc, committed documents with history.", "src/harness/live.ts:111 · src/documents.ts:39-41"],
  "events": ["One watchEvents stream per conversation: committed facts, not callbacks.", "src/harness/events.ts:69-120"],
  storage: ["One storage contract, four shapes; one process owns one storage at a time.", "src/storage/sqlite/cloudflare.ts:187-197"],
  foreign: ["Agents outside durability: the real OpenCode CLI inside a durable tool call.", "swarm-lab/06 · src/env/index.ts"],
};
(function () {
  const s = flat("g01");
  s.r(30, 62, 200, 62, "cut"); s.t(44, 86, "your host", "lbl"); s.t(44, 104, "hub.submit() · wait()", "lbl-s");
  s.hit(30, 62, 200, 62, "queue");
  s.r(310, 50, 360, 186, "cap"); s.t(490, 74, "harness · one session", "mid", "middle");
  [["submission queue", "admit · settle · requestIds", 96], ["scheduler", "lanes · ownership · restarts", 132],
   ["transcripts", "entries · live · documents", 168], ["events", "state-derived, not callbacks", 204]].forEach(r => {
    s.r(326, r[2], 328, 30, "side"); s.t(338, r[2] + 15, r[0], "lbl"); s.t(338, r[2] + 27, r[1], "lbl-s"); s.hit(326, r[2], 328, 30, r[0]);
  });
  s.cyl(810, 74, 150, 112, "side", "cap"); s.t(810, 132, "storage", "lbl", "middle"); s.t(810, 150, "one commit at a time", "lbl-s", "middle");
  s.hit(735, 60, 150, 130, "storage");
  s.r(30, 268, 320, 46, "cut"); s.t(46, 290, "foreign agents · the OpenCode CLI", "lbl"); s.t(46, 306, "reached only via an ExecutionEnv seam", "lbl-s");
  s.hit(30, 268, 320, 46, "foreign");
  lg(s, [[232, 93], [306, 93]], "input → run", "ln", 269, 79, "middle");
  lg(s, [[672, 100], [730, 100]], "commit", "ln", 700, 86, "middle");
  lg(s, [[500, 238], [500, 264]], "tools · env.exec()", "wire", 514, 256, "start");
  s.t(24, 322, "hatched = outside durability — the boundary is the picture (src/types.ts:148)", "lbl-s");
})();

/* ─ g02 topology small-multiples ───────────────────────────────────────── */
(function () {
  const s = flat("g02");
  const P = [24, 258, 492, 726], W = 210;
  s.t(P[0] + W / 2, 42, "star — one hub", "lbl-s", "middle"); s.t(P[1] + W / 2, 42, "ring — peers", "lbl-s", "middle");
  s.t(P[2] + W / 2, 42, "bus — one line", "lbl-s", "middle"); s.t(P[3] + W / 2, 42, "mesh — everyone", "lbl-s", "middle");
  const node = (x, y, t) => s.box(x, y, 44, 24, t, "", "cap");
  s.box(P[0] + 105, 118, 56, 30, "hub", "", "side");
  [[70, 168], [140, 168], [105, 100]].forEach(d => { lg(s, [[P[0] + 105, 118], [P[0] + d[0], d[1]]]); node(P[0] + d[0], d[1], "cell"); });
  const C = [P[1] + 105, 135], R = 46;
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4, p = [C[0] + R * Math.cos(a), C[1] + R * Math.sin(a)];
    const a2 = ((i + 1) % 4) * Math.PI / 2 + Math.PI / 4, q = [C[0] + R * Math.cos(a2), C[1] + R * Math.sin(a2)];
    s.p(pp([p, q], false), "ln"); node(p[0], p[1], "cell");
  }
  const bx = P[2] + 105;
  s.p(`M${bx - 80} 135H${bx + 80}`, "ln");
  [[-55, 96], [0, 96], [55, 172], [-15, 172]].forEach(d => { s.p(`M${bx + d[0]} 135V${d[1] + (d[1] > 135 ? 12 : -12)}`, "ln2"); node(bx + d[0], d[1], "cell"); });
  const mx = P[3] + 105, pts = [[mx - 55, 95], [mx + 55, 95], [mx - 55, 172], [mx + 55, 172]];
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) s.p(pp([pts[i], pts[j]], false), "ln2");
  pts.forEach(p => node(p[0], p[1], "cell"));
  s.t(24, 202, "the nine storage tables are the same in every shape — only the wiring differs (src/storage/sqlite/schema.ts:5-16)", "lbl-s");
})();

/* ─ g03 bipartite columns ──────────────────────────────────────────────── */
(function () {
  const s = flat("g03");
  ["12", "13", "14"].forEach((n, i) => { const y = 66 + i * 62; s.box(190, y, 150, 46, "tool " + n, "pi.tool", i === 1 ? "cap" : "side"); });
  ["15", "21", "27"].forEach((n, i) => { const y = 66 + i * 62; s.box(700, y, 190, 46, "conversation " + n, "child transcript", i === 1 ? "cap" : "side"); });
  s.t(445, 48, "owns", "lbl", "middle");
  ["12", "13", "14"].forEach((n, i) => { const y = 66 + i * 62; lg(s, [[266, y], [603, y]], "", i === 1 ? "ln" : "wire"); });
  s.t(24, 218, "one edge type, drawn twice — children hold their own transcripts (lab 02 · src/types.ts:306-315)", "lbl-s");
})();

/* ─ g04 adjacency matrix ───────────────────────────────────────────────── */
(function () {
  const s = flat("g04");
  const rows = ["submit()", "wait()", "abort()", "resume()", "plain commit"], cols = ["resume", "admit", "drain", "settle"];
  const x0 = 200, y0 = 66, cw = 120, rh = 40;
  cols.forEach((c, j) => s.t(x0 + j * cw + cw / 2, 50, c, "lbl", "middle"));
  const M = { "submit()": [1, 1, 1, 0], "wait()": [1, 0, 1, 1], "abort()": [1, 0, 1, 0], "resume()": [1, 0, 1, 0], "plain commit": [0, 0, 0, 0] };
  rows.forEach((r, i) => {
    const y = y0 + i * rh;
    s.t(x0 - 12, y + rh / 2 + 4, r, "lbl", "end");
    for (let j = 0; j < 4; j++) {
      const x = x0 + j * cw;
      s.r(x, y, cw - 3, rh - 3, "guide");
      if (M[r][j]) s.c(x + cw / 2, y + rh / 2, 7, "ok-s");
    }
  });
  s.t(x0 - 12, 246 + 20, "all empty — see below", "lbl-b", "end");
  s.t(24, 288, "rows flip the pump on; only submit() admits a run — and a plain commit resumes nothing: the trap (scheduler.ts:1096-1112 · harness.ts:244-290)", "lbl-s");
})();

/* ─ g05 arc diagram ────────────────────────────────────────────────────── */
(function () {
  const s = flat("g05");
  const X = t => 90 + (t - 30) * 61; // entry ids 30..41 mapped to 90..761
  [30, 34, 36, 38, 41].forEach(t => { s.p(`M${X(t)} 140V158`, "ln2"); s.t(X(t), 174, "e" + t, "lbl-s", "middle"); });
  s.p(`M90 140H765`, "ln2");
  const arc = (a, b, h, lbl, cls) => { const x1 = X(a), x2 = X(b); s.p(`M${x1} 136Q${(x1 + x2) / 2} ${136 - h} ${x2} 136`, cls || "ln"); s.t((x1 + x2) / 2, 136 - h - 8, lbl, "lbl", "middle"); };
  arc(30, 36, 52, "A · answered in e36");
  arc(34, 41, 84, "B · answered in e41");
  arc(36, 38, 28, "C · write, settled at once", "wire");
  s.t(24, 210, "every arc spans one submission's committed life — placed at its entry, closed at its answer (src/types.ts:383-414)", "lbl-s");
})();

/* ─ g06 fan tree ───────────────────────────────────────────────────────── */
(function () {
  const s = flat("g06");
  s.box(130, 64, 190, 44, "root conversation", "lab 02", "side");
  s.box(480, 150, 170, 44, "generation 9", "the round", "cap");
  const T = [[210, 78], [480, 52], [750, 78]], K = [[140, 246], [480, 250], [812, 246]];
  T.forEach((t, i) => {
    s.box(t[0], t[1] + 40, 130, 40, "tool " + ["12", "13", "14"][i], "pi.tool", i === 1 ? "cap" : "side");
    s.p(`M480 128Q${t[0]} ${t[1] + 20} ${t[0]} ${t[1] + 62}`, "guide");
    s.box(K[i][0], K[i][1], 200, 44, "conversation " + ["15", "21", "27"][i], "child transcript", "side");
    lg(s, [[t[0], t[1] + 62], [K[i][0], K[i][1] - 24]], "", i === 1 ? "ln" : "wire");
  });
  lg(s, [[228, 66], [400, 132]], "runs on", "ln", 268, 92, "middle");
  s.t(24, 274, "width encodes nothing — peerness over size (generation.ts:697-710)", "lbl-s");
})();

/* ─ g07 circuit ────────────────────────────────────────────────────────── */
(function () {
  const s = flat("g07");
  const contact = (cx, cy) => { s.c(cx - 11, cy, 2.5, "solid"); s.c(cx + 11, cy, 2.5, "solid"); s.p(`M${cx - 8} ${cy + 5}L${cx + 8} ${cy - 5}`, "ln"); };
  const Y = [64, 106, 148, 190], L = ["submit()", "wait()", "abort()", "resume()"];
  s.p(`M86 ${Y[0]}V${Y[3]}`, "ln"); s.p(`M400 ${Y[0]}V${Y[3]}`, "ln");
  Y.forEach((y, i) => {
    s.p(`M86 ${y}H231`, "ln"); s.p(`M256 ${y}H400`, "ln");
    contact(243, y); s.t(243, y - 12, L[i], "lbl", "middle");
    s.c(86, y, 3, "solid"); s.c(400, y, 3, "solid");
  });
  s.p(`M400 ${Y[0]}H470`, "ln"); // merged out
  s.box(545, 151, 150, 50, "enable gate", "enabled = true", "cap");
  lg(s, [[622, 129], [622, 152]], "the pump flips", "ln", 636, 144, "start");
  lg(s, [[622, 152], [790, 152]], "drain sweep", "ln", 706, 168, "middle");
  s.box(880, 152, 150, 44, "scheduler", "running", "side");
  // the trap: an open contact that can never close
  s.p(`M86 232H231`, "ln2"); s.c(243, 232, 2.5, "solid"); s.c(265, 232, 2.5, "solid");
  s.p(`M340 232H400`, "ln2"); s.xmark(254, 232, 6, "bad-l");
  s.t(24, 244, "a plain commit never closes its contact — the trap (scheduler.ts:1096-1099)", "lbl-b");
})();

/* ─ g08 orbits (loop) ─────────────────────────────────────────────────── */
(function () {
  const s = flat("g08"), C = [420, 138], R = 96;
  const gate = ["the OpenCode CLI", "a Claude Code job", "any exec'd binary"];
  function draw(T, sc) {
    s.clear();
    s.c(C[0], C[1], 62, "cap"); s.t(C[0], C[1] - 4, "the session", "lbl", "middle"); s.t(C[0], C[1] + 12, "commits live here", "lbl-s", "middle");
    s.c(C[0], C[1], R, "guide");
    const off = T * .18;
    [0, 2.1, 4.2].forEach((a0, i) => {
      const a = a0 + off, p = [C[0] + R * Math.cos(a), C[1] + R * Math.sin(a)];
      const side = Math.cos(a) >= 0 ? 1 : -1;
      const box = [p[0] + side * 78, p[1]];
      s.p(`M${p[0]} ${p[1]}L${box[0] - side * 75} ${box[1]}`, "wire");
      s.r(box[0] - 75, box[1] - 19, 150, 38, "cut");
      s.t(box[0], box[1] - 2, gate[i], "lbl", "middle"); s.t(box[0], box[1] + 12, "via ExecutionEnv", "lbl-s", "middle");
    });
    const k = (Math.sin(T * 1.4) + 1) / 2; s.token([[C[0] + 62, C[1]], [C[0] + R, C[1]], [C[0], C[1] - R]], k / 2, "solid", 6);
  }
  play("g08", { orbit: { label: "orbit", end: 20, events: [
    { t: 0, cap: "<b>The rim holds.</b> Foreign agents ride outside the session disk — separate processes, separate storage, separate fates." },
    { t: 7, cap: "<b>The seam.</b> Whatever moves between rim and disk moves through one <code>ExecutionEnv</code> connector: a durable tool call, not a shared address space." },
    { t: 14, cap: "<b>Still outside.</b> The session never opens for a foreign CLI; it commits receipts about one instead (src/env/index.ts)." }] } },
    (T, sc) => draw(T, sc), { speed: 3, label: "watch" });
})();

/* ─ g09 hypercube of booleans ─────────────────────────────────────────── */
(function () {
  const s = flat("g09");
  const A = [430, 90], B = [620, 90], C = [620, 175], D = [430, 175];       // front face
  const O = [100, -48];                                                     // depth offset
  const P2 = [A[0] + O[0], A[1] + O[1]], Q = [B[0] + O[0], B[1] + O[1]], Rr = [C[0] + O[0], C[1] + O[1]], S2 = [D[0] + O[0], D[1] + O[1]];
  [A, B, C, D].forEach((p, i) => { const q = [P2, Q, Rr, S2][i]; s.p(pp([p, q], false), "ln2"); });
  s.p(pp([A, B, C, D, A], false), "ln2"); s.p(pp([P2, Q, Rr, S2, P2], false), "ln2");
  // legal route: pre-submit → placed → enabled → settled (three cube edges)
  lg(s, [D, C], "the run is placed", "ln", 525, 193, "middle");
  lg(s, [C, Rr], "enabled (the pump)", "ln", 684, 156, "start");
  lg(s, [Rr, Q], "", "ln", 0, 0, "middle"); s.t(732, 84, "settled", "lbl-g", "start");
  s.t(D[0] - 4, D[1] + 18, "pre-submit", "lbl", "middle");
  s.t(C[0] + 8, C[1] + 18, "running", "lbl", "middle");
  s.t(S2[0], S2[1] - 10, "seeded, pump off", "lbl-s", "middle");
  s.t(24, 210, "three axes — placed · enabled · settled — and one lit route through the cube (lab 05)", "lbl-s");
  s.t(24, 254, "the only legal resting states are the two corners: nothing owned, or everything committed (src/types.ts:505-536)", "lbl-s");
})();

/* ─ g10 nested regions ────────────────────────────────────────────────── */
(function () {
  const s = flat("g10");
  s.r(60, 34, 860, 150, "side"); s.t(78, 56, "session scope", "lbl");
  s.r(120, 66, 480, 100, "cap"); s.t(138, 88, "conversation scope", "lbl");
  s.r(180, 96, 250, 50, "side"); s.t(196, 116, "task scope", "lbl");
  s.box(760, 78, 180, 38, "session doc", "everyone", "cap");
  s.box(660, 150, 200, 36, "conversation doc", "this conversation", "cap");
  s.box(268, 128, 150, 26, "task doc", "", "cap");
  s.t(24, 210, "a doc can read outward; only its scope writes it — the nesting is the permission model (src/documents.ts:39-51)", "lbl-s");
})();

/* ─ g11 metro ─────────────────────────────────────────────────────────── */
(function () {
  const s = flat("g11");
  s.p("M70 160H210L270 120H430L490 160H650H710", "ln");
  const st = (x, y, lbl, above) => { s.c(x, y, 7, "cap"); if (lbl) s.t(x, above ? y - 16 : y + 24, lbl, "lbl", "middle"); };
  st(70, 160, "submit", true); st(270, 120, "prepare", true); st(430, 120, "stream", true);
  st(650, 160, "answer", false); st(710, 160, "", true);
  s.c(490, 160, 11, "ln"); s.t(490, 184, "tools ⤷ branch", "lbl-s", "middle");
  s.p("M490 160L560 220H780", "ln");
  st(560, 220, "", true);
  [620, 690, 760].forEach((x, i) => { s.c(x, 220, 7, "cap"); s.t(x, 244, "child " + ["15", "21", "27"][i], "lbl-s", "middle"); });
  s.t(710, 184, "settle", "lbl", "middle");
})();

/* ─ g12 chords to adapters ────────────────────────────────────────────── */
(function () {
  const s = flat("g12");
  s.box(150, 120, 190, 64, "the session", "one commit at a time", "cap");
  const ys = [46, 102, 158, 208];
  const names = ["sqlite file", "DO storage", "memory", "jsonl"];
  ys.forEach((y, i) => { s.box(760, y, 180, 38, names[i], "", i === 0 ? "cap" : "side"); s.p(`M246 120Q440 ${y < 120 ? y - 26 : y + 26} 668 ${y}`, i === 0 ? "ln" : "guide"); });
  s.t(430, 30, "exactly one adapter live per process", "lbl-s", "middle");
  s.t(24, 214, "swap the shop, keep the receipts — the contract is the same (src/storage/sqlite/cloudflare.ts:187-197 · README.md:669)", "lbl-s");
})();
/* ─ g13 stations (steps) ───────────────────────────────────────────────── */
(function () {
  const s = flat("g13"), X = i => 20 + i * 136, Y = 78;
  const N = ["submit", "admit", "prepare", "request", "tools", "answer", "settle"];
  const OUT = ["entry + row", "run + task id", "checkpoint", "stream", "child tasks", "assistant entry", "wait() ✓"];
  const S = [
    { cap: "<b>submit.</b> The input and its submission row land in one commit — a requestId makes re-sends idempotent (submissions.ts:224-239)." },
    { cap: "<b>admit.</b> The scheduler starts a run: a pi.generation task owned by the conversation (generation.ts:697-710)." },
    { cap: "<b>prepare.</b> The checkpoint commits before any model bytes: model, cutoff, gate — a retry resumes exactly here." },
    { cap: "<b>request.</b> The model streams; the throttled partial commits every ~100 ms (agent.ts:35)." },
    { cap: "<b>tools.</b> Tool calls become their own pi.tool child tasks; the run parks waiting on them." },
    { cap: "<b>answer.</b> The assistant message appends like everything else." },
    { cap: "<b>settle.</b> The submission records its answer and resolves the waiter (types.ts:843)." },
  ];
  let cur = 0;
  function draw() {
    s.clear();
    N.forEach((n, i) => {
      s.box(X(i) + 56, Y, 112, 40, n, "", i < cur ? "cap" : i === cur ? "ok-f cur" : "side");
      s.t(X(i) + 56, Y + 44, OUT[i], i <= cur ? "lbl" : "lbl-s", "middle");
      if (i < cur) s.check(X(i) + 56, Y - 30, 5);
      if (i < N.length - 1) lg(s, [[X(i) + 116, Y], [X(i + 1) - 4, Y]], "", i < cur ? "ln" : "wire");
    });
  }
  steps("g13", S, i => { cur = i; draw(); });
})();

/* ─ g14 swimlanes (steps) ──────────────────────────────────────────────── */
(function () {
  const s = flat("g14");
  const L = { host: 70, harness: 130, storage: 190 };
  const S = [
    { cap: "<b>submit.</b> All lanes start in yours: one call. The commit happens on the way in.", lane: "host", t: "hub.submit()" },
    { cap: "<b>admit.</b> The harness appends pi.user and the row, and starts the run.", lane: "harness", t: "admit · entry" },
    { cap: "<b>prepare.</b> The checkpoint commits in the harness; storage only ever sees whole commits.", lane: "harness", t: "prepare" },
    { cap: "<b>stream.</b> Partial land in storage every ~100 ms — the only lane that touches storage alone.", lane: "storage", t: "commits" },
    { cap: "<b>tools.</b> Child tasks spawn; the run parks in the harness lane.", lane: "harness", t: "tools (park)" },
    { cap: "<b>answer.</b> The assistant entry appends — back through the same commit gate.", lane: "storage", t: "append" },
    { cap: "<b>settle.</b> Your wait() resolves from committed rows — the wait itself was also a row.", lane: "storage", t: "settle ✓" },
  ];
  steps("g14", S, (i, st) => {
    s.clear();
    Object.keys(L).forEach(k => { s.t(24, L[k] + 4, k, "lbl"); s.p(`M110 ${L[k]}H900`, "ln2"); });
    let prev = null;
    for (let k = 0; k <= i; k++) {
      const x = 150 + k * 104, y = L[S[k].lane];
      const hot = k === i;
      s.box(x, y, 96, 36, S[k].t, "", hot ? "ok-f cur" : k < i ? "cap" : "side");
      if (prev) lg(s, [[prev.x + 50, prev.y], [x - 50, y]], "", k < i ? "ln" : "wire");
      prev = { x, y };
    }
  });
})();

/* ─ g15 sequence (steps) ───────────────────────────────────────────────── */
(function () {
  const s = flat("g15");
  const L = { host: 200, harness: 480, storage: 760 };
  const S = [
    { cap: "<b>submit.</b> The host calls in; the harness commits the input in one transaction.", m: [[L.host, 96, L.harness, "hub.submit()"], [L.harness, 120, L.storage, "entry + row", true]] },
    { cap: "<b>admit.</b> The scheduler creates the generation task — no storage round-trip behind it.", m: [[L.harness, 170, L.harness, "start the run", true]] },
    { cap: "<b>prepare.</b> The checkpoint commits before any model bytes are asked for.", m: [[L.harness, 214, L.storage, "checkpoint commit"]] },
    { cap: "<b>stream.</b> The request streams; partial commits keep the tail at most ~100 ms.", m: [[L.harness, 258, L.storage, "partial commit × n"]] },
    { cap: "<b>answer + settle.</b> The answer appends, then the wait resolves from the row it became.", m: [[L.harness, 296, L.storage, "answer appended"], [L.storage, 318, L.host, "wait() resolves · entryId", true]] },
  ];
  steps("g15", S, (i, st) => {
    s.clear();
    s.t(24, 28, "call-and-return — every return is committed state", "lbl-s");
    Object.keys(L).forEach(k => { const x = L[k]; s.box(x, 52, 120, 32, k, "", "side"); s.p(`M${x} 68V320`, "ln2"); });
    let prev = null;
    st.m.forEach((mm, j) => {
      const [x1, y, x2, text, dashed] = mm;
      if (x1 === x2) { s.r(x1 - 3, y - 8, 6, 16, "solid"); s.t(x1 + 12, y + 4, text, "lbl", "start"); return; }
      if (dashed) s.arrow([[x1, y], [x2, y]], "guide", 5); else s.arrow([[x1, y], [x2, y]], "ln", 5);
      const mx = (x1 + x2) / 2;
      s.t(Math.min(Math.max(mx, 190), 770), y - 7, text, "lbl", "middle");
    });
  });
})();

/* ─ g16 bpmn ──────────────────────────────────────────────────────────── */
(function () {
  const s = flat("g16");
  s.c(96, 116, 15, "cap"); s.c(96, 116, 8, "ln");
  s.t(96, 152, "round starts", "lbl-s", "middle");
  s.r(170, 96, 140, 40, "cap"); s.t(240, 112, "run the round", "lbl", "middle"); s.t(240, 128, "one task", "lbl-s", "middle");
  lg(s, [[112, 116], [168, 116]]);
  s.p(`M${314} ${116}H398`, "ln2");
  s.p("M440 88L492 116L440 144L388 116Z", "cap"); s.t(440, 120, "classify", "lbl-s", "middle");
  lg(s, [[494, 116], [560, 116]], "plain text", "ln", 524, 104, "middle");
  s.box(640, 96, 150, 40, "answer appended", "", "cap");
  lg(s, [[715, 116], [790, 116]]);
  s.c(810, 116, 15, "cap"); s.c(810, 116, 8, "bad-l");
  s.t(810, 152, "settled", "lbl-s", "middle");
  // tool branch
  lg(s, [[440, 146], [440, 180], [456, 180]], "tool calls", "ln", 452, 158, "start");
  s.box(520, 180, 130, 36, "tool tasks", "parallel", "cap");
  s.arrow([[590, 198], [590, 216], [310, 216], [310, 140]], "wire", 5); s.t(400, 206, "results return", "lbl-s", "middle");
  s.t(24, 226, "one gateway, one loop — the everyday shape of a tool round (src/harness/agent.ts:69)", "lbl-s");
})();

/* ─ g17 conveyor (loop) ───────────────────────────────────────────────── */
(function () {
  const s = flat("g17");
  const stations = [[250, "prepare"], [430, "request"], [610, "tools"], [790, "append"]];
  function draw(t) {
    s.clear();
    s.p(`M100 86H880`, "ln"); s.p(`M100 126H880`, "ln");
    for (let x = 132; x < 880; x += 62) s.c(x, 106, 12, "cap");
    stations.forEach(st => { s.p(`M${st[0]} 64V82`, "ln2"); s.t(st[0], 56, st[1], "lbl-s", "middle"); });
    const x = t == null ? 250 : 130 + ((t * 55) % 640);
    s.box(x, 106, 104, 32, "one round", "", "cap");
    s.t(480, 156, "commit every ~100 ms (agent.ts:35) — the belt never rolls back", "lbl-s", "middle");
    s.t(24, 182, "everything on the belt is already committed; the belt is the session line", "lbl-s");
  }
  draw(null); loop("g17", (d, t) => draw(t));
})();

/* ─ g18 fork and join ─────────────────────────────────────────────────── */
(function () {
  const s = flat("g18");
  s.box(480, 46, 180, 44, "pi.generation", "the round", "cap");
  s.p(`M480 68V84`, "ln");
  s.p(`M300 86H660`, "ln");
  [300, 480, 660].forEach((x, i) => {
    s.p(`M${x} 86V108`, "ln");
    s.box(x, 130, 130, 40, "tool " + ["12", "13", "14"][i], "pi.tool", i === 1 ? "cap" : "side");
    s.p(`M${x} 150V190`, "ln");
  });
  s.p(`M300 192H742`, "ln");
  lg(s, [[716, 192], [754, 192]], "all terminal", "ln", 540, 184, "middle");
  s.box(840, 192, 164, 36, "answer appended", "", "ok-f");
})();

/* ─ g19 pipeline with buffer ──────────────────────────────────────────── */
(function () {
  const s = flat("g19");
  s.box(170, 100, 200, 56, "model stream", "fast, partials", "cap");
  for (let i = 0; i < 4; i++) s.r(292 + i * 20, 112, 14, 30, "side");
  s.t(322, 72, "the uncommitted tail", "lbl-s", "middle");
  lg(s, [[358, 112], [445, 112]], "drained", "ln", 400, 130, "middle");
  s.box(560, 100, 230, 56, "progress commits", "every ~100 ms", "ok-f");
  s.t(24, 196 - 30, "the buffer is bounded — its bound is exactly what a crash can lose (lab 05: 144 chars)", "lbl-s");
})();

/* ─ g20 waterfall ─────────────────────────────────────────────────────── */
(function () {
  const s = flat("g20");
  const N = ["prepare", "request", "tools", "answer", "settle"];
  s.r(120, 200, 720, 10, "side");
  N.forEach((n, i) => {
    const x = 40 + i * 175, y = 24 + i * 34;
    s.r(x, y, 160, 30, "cap"); s.t(x + 12, y + 20, n, "lbl-s");
    s.arrow([[x + 80, y + 34], [x + 80, 196]], "wire", 4);
  });
  s.t(848, 196, "the ledger", "lbl-s", "end");
  s.t(24, 222, "nothing cascades back up: the stairs fall, the ledger keeps (src/harness/generation.ts:181-199)", "lbl-s");
})();

/* ─ g21 comic ─────────────────────────────────────────────────────────── */
(function () {
  const s = flat("g21");
  const P = [30, 260, 490, 720], cap = ["1 · an input arrives", "2 · checkpoint stamped", "3 · SIGKILL", "4 · resume at the checkpoint"];
  P.forEach((x, i) => {
    s.r(x, 30, 210, 160, "cap");
    s.t(x + 10, 210, cap[i], "lbl-s");
    if (i === 0) { s.box(x + 105, 70, 100, 32, "input", "", "cap"); s.r(x + 50, 120, 110, 10, "side"); s.r(x + 50, 138, 110, 10, "side"); lg(s, [[x + 105, 86], [x + 105, 116]], "", "ln"); }
    if (i === 1) { s.box(x + 105, 62, 110, 30, "prepare", "", "ok-f"); s.c(x + 165, 52, 10, "ok-f"); s.check(x + 165, 52, 5); s.t(x + 105, 122, "model · cutoff · gate", "lbl-s", "middle"); }
    if (i === 2) { s.r(x + 30, 62, 150, 34, "cut"); s.t(x + 105, 84, "the process", "lbl", "middle"); s.xmark(x + 105, 128, 9); s.t(x + 105, 150, "no flush, no handler", "lbl-s", "middle"); }
    if (i === 3) { s.r(x + 96, 62, 110, 26, "guide"); s.t(x + 151, 78, "prepare?", "lbl-s", "middle"); s.r(x + 40, 118, 130, 10, "side"); s.r(x + 40, 136, 130, 10, "cap"); lg(s, [[x + 151, 90], [x + 105, 114]], "retry", "ln", 142, 106); }
  });
})();

/* ─ g22 ladder ───────────────────────────────────────────────────────── */
(function () {
  const s = flat("g22");
  s.p(`M60 60V210`, "ln"); s.p(`M900 60V210`, "ln");
  const contact = (cx, cy, lbl, hot) => {
    s.c(cx - 12, cy, 2.5, "solid"); s.c(cx + 12, cy, 2.5, "solid");
    s.p(`M${cx - 9} ${cy + 6}L${cx + 9} ${cy - 6}`, hot ? "ln" : "ln2");
    s.t(cx, cy - 10, lbl, "lbl", "middle");
  };
  [78, 104, 130, 156].forEach((y, i) => {
    s.p(`M60 ${y}H480`, "ln2");
    contact(150, y, ["submit()", "wait()", "abort()", "resume()"][i], i === 0);
  });
  s.p(`M480 78V156H560`, "ln2");
  s.box(720, 117, 130, 50, "the coil", "drain sweeps", "ok-f");
  lg(s, [[574, 117], [653, 117]], "if any closed", "ln", 613, 105, "middle");
  lg(s, [[786, 117], [900, 117]], "", "ln");
  s.t(24, 246 - 30, "relay logic's oldest answer: a parallel OR — any single closed contact coils the pump (scheduler.ts:1096-1112)", "lbl-s");
})();

/* ─ g23 interaction overview ──────────────────────────────────────────── */
(function () {
  const s = flat("g23");
  s.box(170, 56, 170, 40, "submit · admit", "", "cap");
  lg(s, [[170, 76], [170, 104]]);
  s.box(170, 124, 170, 40, "prepare", "", "cap");
  lg(s, [[256, 124], [400, 124]], "expand", "ln", 330, 112, "middle");
  s.r(400, 50, 530, 150, "side");
  s.t(416, 70, "expanded: the request", "lbl");
  const lif = { h: 490, r: 650, t: 820 };
  Object.keys(lif).forEach(k => { s.box(lif[k], 88, 70, 24, k, "", "cap"); s.p(`M${lif[k]} 100V186`, "ln2"); });
  lg(s, [[lif.h, 128], [lif.t, 128]], "checkpoint", "ln", 655, 118, "middle");
  lg(s, [[lif.r, 156], [lif.t, 156]], "partial × n", "ln", 570, 146, "middle");
  s.arrow([[lif.t, 180], [lif.r, 180]], "guide", 5); s.t(735, 172, "settled each", "lbl-s", "middle");
  s.arrow([[665, 202], [258, 228]], "guide", 5); s.t(470, 222, "return with the answer", "lbl-s", "middle");
  s.box(170, 228, 170, 32, "append · settle", "", "cap");
  s.t(24, 246, "one fragment expanded at full resolution — everything else stays a step (agent.ts:35)", "lbl-s");
})();
/* ─ g24 state machine (choose) ─────────────────────────────────────────── */
INFO.g24 = {
  pending: ["Eligible with its full checkpoint — where every was-running task lands after a restart.", "src/types.ts:505-510"],
  running: ["Reserved by one invocation; the checkpoint grows here.", "src/types.ts:512-517"],
  waiting: ["Parked until every task in on[] is terminal.", "src/types.ts:519-525"],
  completing: ["Outcome decided and committed; runs no more code.", "src/types.ts:527-531"],
  terminal: ["The permanent receipt. Nothing runs again.", "src/types.ts:533-536"],
  restart: ["Harness.open() demotes running → pending in the open scan.", "src/harness/scheduler.ts:296-312"],
  abortmark: ["Abort marks land on ordinary ownership; the invocation dies at its next step.", "src/harness/scheduler.ts:396-414"],
  outcomes: ["completed · failed · aborted · orphaned · faulted.", "src/types.ts:465-499"],
};
(function () {
  const s = flat("g24");
  const N = { pending: [130, 88], running: [440, 88], waiting: [760, 88], completing: [440, 218], terminal: [760, 218] };
  const E = [
    ["pending", "running", [[210, 70], [360, 70]], "admit", [282, 60, "middle"]],
    ["running", "waiting", [[520, 80], [680, 80]], "tool round", [598, 68, "middle"]],
    ["waiting", "running", [[680, 106], [520, 106]], "on[] terminal", [598, 122, "middle"]],
    ["running", "completing", [[440, 112], [440, 196]], "answer", [452, 158, "start"]],
    ["completing", "terminal", [[520, 218], [680, 218]], "quiet below", [598, 206, "middle"]],
    [null, "restart", [[412, 56], [250, 48], [146, 64]], "restart demotes", [270, 38, "middle"]],
    [null, "abortmark", [[492, 112], [660, 190]], "abort mark", [520, 148, "start"]],
  ];
  const OS = [["completed", 96], ["failed", 224], ["aborted", 348], ["orphaned", 476], ["faulted", 608]];
  function draw(k) {
    s.clear();
    E.forEach(e => {
      const on = k !== undefined && (e[0] === k || (e[0] === null && e[1] === k));
      s.arrow(e[2], e[0] === null ? (on ? "ln" : "guide") : (on ? "ln" : "wire"), 5);
      s.t(e[4][0], e[4][1], e[3], on ? "lbl" : "lbl-s", e[4][2]);
    });
    for (const n in N) { s.box(N[n][0], N[n][1], 150, 42, n, "", n === k ? "ok-f cur" : "cap"); s.hit(N[n][0] - 75, N[n][1] - 21, 150, 42, n); }
    s.t(24, 282, "the five outcomes:", "lbl-s");
    OS.forEach(o => s.box(o[1], 310, 112, 30, o[0], "", k === "outcomes" ? "ok-f cur" : "side"));
    s.hit(196, 292, 100, 24, "outcomes"); s.hit(60, 30, 130, 60, "restart");
  }
  choose("g24", [
    { k: "pending", label: "pending", cap: "<b>pending.</b> Eligible, with the checkpoint a later start resumes from. A restart makes interrupted runs plan again, not lose." },
    { k: "running", label: "running", cap: "<b>running.</b> One invocation reserves it; the committed checkpoint grows beneath." },
    { k: "waiting", label: "waiting", cap: "<b>waiting.</b> No invocation — parked until every task in on[] settles. Then it resumes at its checkpoint." },
    { k: "completing", label: "completing", cap: "<b>completing.</b> The outcome is written; it passes to terminal when the ownership walk is quiet." },
    { k: "terminal", label: "terminal", cap: "<b>terminal.</b> The permanent receipt; waiters resolve here." },
    { k: "restart", label: "after a restart", cap: "<b>Restart.</b> The open scan rewrites running → pending in one commit." },
    { k: "abortmark", label: "given an abort", cap: "<b>Abort mark.</b> The invocation ends at its next step; outcome aborted." },
    { k: "outcomes", label: "the five outcomes", cap: "<b>Outcomes.</b> completed · failed · aborted · orphaned · faulted." },
  ], draw, "state");
})();

/* ─ g25 statechart nesting ────────────────────────────────────────────── */
(function () {
  const s = flat("g25");
  s.box(100, 104, 110, 40, "pending", "", "cap");
  s.r(280, 62, 390, 128, "cap"); s.t(296, 84, "running", "lbl");
  s.box(400, 112, 110, 34, "streaming", "", "side");
  s.box(580, 112, 130, 34, "tool round", "", "side");
  s.arrow([[456, 106], [514, 106]], "wire", 4); s.arrow([[514, 126], [456, 126]], "wire", 4);
  s.t(485, 176, "whichever sub-state held it, the mark ends it", "lbl-s", "middle");
  s.hit(280, 62, 390, 128, "region");
  s.box(760, 104, 120, 40, "completing", "", "cap");
  s.box(880, 104, 110, 40, "terminal", "", "side");
  lg(s, [[156, 104], [276, 104]], "admit", "ln", 216, 92, "middle");
  lg(s, [[672, 104], [698, 104]], "", "ln");
  s.t(680, 140, "answer ✓", "lbl-s", "middle");
  lg(s, [[822, 104], [822, 104]], "", "wire");
  s.p("M300 170C300 232 160 228 118 128", "guide"); s.t(196, 240, "restart demotes the region", "lbl-s", "start");
})();

/* ─ g26 transition matrix ─────────────────────────────────────────────── */
(function () {
  const s = flat("g26");
  const cols = ["pending", "running", "waiting", "completing", "terminal"];
  const rows = cols;
  const x0 = 210, y0 = 70, cw = 130, rh = 38;
  cols.forEach((c, j) => s.t(x0 + j * cw + cw / 2, 54, c, "lbl", "middle"));
  const F = { "pending>running": 1, "running>waiting": 1, "waiting>running": 1, "running>completing": 1, "completing>terminal": 1, "running>pending": 2 };
  rows.forEach((r, i) => {
    const y = y0 + i * rh;
    s.t(x0 - 10, y + rh / 2 + 4, r, "lbl", "end");
    cols.forEach((c, j) => {
      const x = x0 + j * cw;
      const v = F[r + ">" + c];
      s.r(x, y, cw - 2, rh - 2, "guide");
      if (v === 1) s.r(x + 7, y + 7, cw - 16, rh - 16, "ok-f");
      if (v === 2) { s.r(x + 7, y + 7, cw - 16, rh - 16, "bad-f"); s.t(x + cw / 2, y + rh / 2 + 8, "restart", "lbl-b", "middle"); }
    });
  });
  s.t(24, 262, "no entry ever moves backwards — except the one the open scan writes (scheduler.ts:296-312)", "lbl-s");
})();

/* ─ g27 petri ────────────────────────────────────────────────────────── */
(function () {
  const s = flat("g27");
  const P = { pending: [140, 160], running: [360, 160], waiting: [600, 160], terminal: [830, 110] };
  for (const k in P) { s.c(P[k][0], P[k][1], 24, "cap"); s.t(P[k][0], P[k][1] + 40, k, "lbl-s", "middle"); }
  const bar = (x, y, lbl) => { s.r(x - 4, y - 18, 8, 36, "solid"); s.t(x, y - 28, lbl, "lbl", "middle"); };
  bar(250, 160, "admit"); bar(480, 160, "park / wake"); bar(712, 133, "answer");
  lg(s, [[164, 160], [245, 160]], "", "ln"); lg(s, [[384, 160], [474, 160]], "", "ln");
  lg(s, [[600, 142], [714, 118]], "", "ln");
  s.p("M600 148C600 118 500 118 384 142", "guide"); s.t(500, 108, "wake (on[] all terminal)", "lbl-s", "middle");
  s.r(354, 154, 12, 12, "solid"); // the invocation token, in running
  s.c(360, 160, 34, "guide"); s.t(360, 216, "abort mark lands here", "lbl-b", "middle");
  s.t(24, 250 - 10, "places are stored states; the token is the in-memory invocation — the one thing a restart loses (src/types.ts:512-517)", "lbl-s");
})();

/* ─ g28 decision table ───────────────────────────────────────────────── */
(function () {
  const s = flat("g28");
  const conds = ["was running?", "has checkpoint?", "abandon-on-restart?", "definition exists?"];
  const rules = [["Y", "Y", "–", "Y", "demote → pending"], ["Y", "Y", "Y", "–", "abort · restart"], ["N", "–", "–", "N", "orphaned"]];
  const x0 = 400, cw = 150, y0 = 70, rh = 30;
  s.t(210, 48, "the open scan · one commit", "lbl");
  rules.forEach((r, j) => s.t(x0 + j * cw + cw / 2, 62, "rule " + (j + 1), "lbl-s", "middle"));
  conds.forEach((c, i) => {
    const y = y0 + i * rh;
    s.t(x0 - 14, y + rh / 2 + 4, c, "lbl", "end");
    rules.forEach((r, j) => {
      const x = x0 + j * cw;
      s.r(x, y, cw - 4, rh - 3, "side");
      s.t(x + cw / 2, y + rh / 2 + 4, r[i], r[i] === "Y" ? "lbl" : "lbl-s", "middle");
    });
  });
  rules.forEach((r, j) => {
    const x = x0 + j * cw, y = y0 + 4 * rh;
    s.r(x, y, cw - 4, 40, j === 0 ? "ok-f" : "cap");
    s.t(x + cw / 2 - 2, y + 24, r[4], "lbl", "middle");
  });
  s.t(24, 244, "rules, not arrows: the scan writes all three outcomes in one pass (scheduler.ts:296-312)", "lbl-s");
})();

/* ─ g29 karnaugh grid ────────────────────────────────────────────────── */
(function () {
  const s = flat("g29");
  const x0 = 330, y0 = 62, cw = 160, ch = 62;
  s.t(x0 + cw / 2, 48, "replay: safe", "lbl", "middle"); s.t(x0 + cw + cw / 2, 48, "replay: unsafe", "lbl", "middle");
  s.t(x0 - 12, y0 + ch / 2, "committed", "lbl", "end"); s.t(x0 - 12, y0 + ch + ch / 2, "fresh", "lbl", "end");
  const C = [
    ["rerun = same rows", "ok-f"], ["side effects ×2", "bad-f"],
    ["retry repeats the call", "side"], ["never rerun — answer first", "side"],
  ];
  C.forEach((c, i) => {
    const x = x0 + (i % 2) * cw, y = y0 + Math.floor(i / 2) * ch;
    s.r(x, y, cw - 4, ch - 4, c[1]);
    s.t(x + cw / 2, y + ch / 2 + 4, c[0], c[1] === "bad-f" ? "lbl-b" : "lbl", "middle");
  });
  s.t(24, 214 - 8, "the red cell is the reason replay is a knob at all (src/harness/tool.ts · lab 06)", "lbl-s");
})();

/* ─ g30 decision tree ────────────────────────────────────────────────── */
(function () {
  const s = flat("g30");
  s.box(140, 80, 150, 44, "classify", "the end of the stream", "cap");
  s.box(410, 80, 140, 44, "tool calls?", "", "cap");
  lg(s, [[216, 80], [338, 80]], "", "ln");
  s.box(400, 196, 190, 44, "append pi.assistant", "", "cap");
  lg(s, [[410, 102], [410, 172]], "plain text", "ln", 424, 140);
  s.box(660, 80, 120, 44, "per call:", "", "cap");
  lg(s, [[482, 80], [598, 80]], "", "ln");
  s.box(660, 196, 170, 44, "own child task", "pi.tool task", "ok-f");
  lg(s, [[640, 102], [640, 172]], "replay safe", "ln", 654, 140);
  s.box(890, 196, 150, 44, "refuse loudly", "lab 07 door", "side");
  lg(s, [[710, 102], [840, 180]], "foreign CLI", "wire", 782, 132, "middle");
  s.t(24, 260 - 24, "trees make every path printable — replay decides, then ownership, then the task (src/harness/tool.ts)", "lbl-s");
})();

/* ─ g31 outcome quadrant ─────────────────────────────────────────────── */
(function () {
  const s = flat("g31");
  s.p(`M480 48V210`, "ln2"); s.p(`M140 140H900`, "ln2");
  s.t(150, 158, "expected domain failure", "lbl-s", "start");
  s.t(560, 158, "contract broken", "lbl-s", "start");
  s.t(492, 56, "finished its job", "lbl-s");
  const dot = (x, y, lbl, cls) => { s.c(x, y, 9, cls || "solid"); s.t(x, y - 16, lbl, "lbl", "middle"); };
  dot(700, 86, "completed", "ok-s"); dot(850, 96, "faulted", "bad-s");
  dot(240, 196, "failed"); dot(380, 196, "aborted"); dot(700, 196, "orphaned");
  s.t(480, 226, "stopped", "lbl-s");
})();

/* ─ g32 phase diagram ────────────────────────────────────────────────── */
(function () {
  const s = flat("g32");
  const X = t => 80 + t * 82.2;
  s.r(80, 70, X(0.7) - 80, 80, "side"); s.t(112, 108, "zero kept", "lbl-s", "middle");
  s.r(X(0.7), 70, X(4.9) - X(0.7), 80, "cap");
  s.t(X(0.7) + 8, 94, "checkpoint + partials kept", "lbl", "start");
  s.r(X(4.9), 70, X(9) - X(4.9), 80, "ok-f"); s.t(X(4.9) + 10, 108, "nothing lost", "lbl-g", "start");
  s.p(`M80 170H820`, "ln"); s.p(`M80 176V164`, "ln2"); s.p(`M820 176V164`, "ln2");
  [0, 0.7, 2.7, 4.9, 9].forEach((t, i) => {
    s.p(`M${X(t)} 170V178`, "ln2"); s.t(X(t), 196, ["t=0", "prepare", "kill", "answer", "t=9"][i], "lbl-s", "middle");
  });
  s.xmark(X(2.7), 176, 6, "bad-l");
  s.t(24, 40, "for any crash time, the band says what survives — the picture is the contract (lab 05 · agent.ts:35)", "lbl-s");
  s.t(560, 206, "→ when the process dies", "lbl-s");
})();

/* ─ g33 classic flowchart ────────────────────────────────────────────── */
(function () {
  const s = flat("g33");
  s.c(480, 36, 8, "solid");
  s.box(480, 76, 190, 40, "run the phase", "", "cap");
  lg(s, [[480, 44], [480, 56]]);
  s.p("M480 108L560 138L480 168L400 138Z", "cap"); s.t(480, 142, "committed?", "lbl-s", "middle");
  lg(s, [[560, 138], [648, 138]], "yes", "ln", 602, 126, "middle");
  s.box(740, 138, 190, 44, "completing", "outcome committed", "ok-f");
  lg(s, [[480, 168], [480, 210]], "no", "ln", 494, 192);
  s.box(480, 228, 150, 36, "faulted", "", "bad-f");
  lg(s, [[400, 138], [240, 138]], "retriable", "ln", 320, 126, "middle");
  s.p("M240 138V88H383", "ln2");
})();
/* ─ g34 iso stack ─────────────────────────────────────────────────────── */
(function () {
  const s = flat("g34");
  const I = s.iso({ ox: 330, oy: 90 }), W = 210, D = 140, H = 14, GAP = 34;
  const rows = [
    ["extensions", "your tools + task kinds", "cap"],
    ["conversations", "entries · live · docs", "cap"],
    ["scheduler", "lanes · ownership", "cap"],
    ["session line", "guarded commits", "cap"],
    ["durable storage", "four adapters, one contract", "side"],
  ];
  rows.forEach((r, i) => {
    const z = (rows.length - 1 - i) * GAP;
    I.box(0, 0, z, W, D, H, { top: r[2], label: null });
    const c = I.P(W / 2, D / 2, z + H);
    s.p(`M${c[0]} ${c[1]}L600 ${c[1]}`, "wire");
    s.t(608, c[1] - 4, r[0], "lbl"); s.t(608, c[1] + 12, r[1], "lbl-s");
  });
  s.t(24, 282, "slabs, not boxes — the load path is literal: your extensions rest on fixed runtime (src/harness/registry.ts)", "lbl-s");
})();

/* ─ g35 strata ───────────────────────────────────────────────────────── */
(function () {
  const s = flat("g35");
  const bands = [
    ["e15 · answer entry", "cap"], ["e14 · tool results", "side"], ["e13 · partials, 100 ms each", "side"],
    ["e12 · the checkpoint", "side"], ["base · schema + migrations", "side"],
  ];
  bands.forEach((b, i) => {
    const y = 44 + i * 32;
    s.r(70, y, 780, 28, b[1]); s.t(86, y + 19, b[0], "lbl");
  });
  s.t(878, 62, "reads", "lbl-s", "end"); s.t(878, 80, "dig down", "lbl-s", "end");
  s.p("M826 74H850", "ln2");
  s.t(24, 234, "strata only settle downward: no band is ever rewritten (src/harness/agent.ts:35 · storage.ts:191-201)", "lbl-s");
})();

/* ─ g36 directory tree ───────────────────────────────────────────────── */
(function () {
  const s = flat("g36");
  s.t(40, 46, "session/", "lbl-b");
  const rows = [
    ["session/session.ts", "the guarded line one transaction at a time"],
    ["session/harness/submissions.ts", "input commit · requestIds · settles"],
    ["session/harness/scheduler.ts", "lanes · the pump · the open scan"],
    ["session/harness/generation.ts", "prepare · request · classify"],
    ["session/harness/events.ts", "watchEvents per conversation"],
    ["session/documents.ts", "scopes session / conversation / task"],
    ["session/types.ts", "task states · outcomes · ownership"],
    ["session/storage/sqlite/{schema,storage}.ts", "nine public tables · the ledger"],
  ];
  s.p("M34 56V254", "ln2");
  rows.forEach((r, i) => {
    const y = 72 + i * 26;
    s.p(`M34 ${y}H44`, "ln2");
    s.t(56, y, r[0], "lbl-s"); s.t(320, y, r[1], "lbl-s", "start");
  });
  s.t(24, 282, "five modules hold every receipt in this catalog — the tree is the legend for everything else", "lbl-s");
})();

/* ─ g37 outline groups ───────────────────────────────────────────────── */
(function () {
  const s = flat("g37");
  const box = (x, y, w, h, head, kids) => {
    s.r(x, y, w, h, "cap"); s.t(x + 16, y + 20, head, "lbl-b");
    kids.forEach((k, i) => s.t(x + 28, y + 40 + i * 18, k, "lbl-s"));
  };
  box(30, 52, 430, 84, "durable bookkeeping", ["durable_schema — the migration record", "durable_metadata — tiny facts", "record_ids — id issuance"]);
  box(520, 52, 410, 62, "the conversation", ["conversations — nodes of the graph", "entries — the transcript"]);
  box(30, 150, 430, 62, "the work", ["tasks — queued, lanes, owners", "submissions — inputs + answers"]);
  box(520, 150, 410, 84, "the documents", ["documents — latest committed", "document_revisions — the history (diffs)"]);
  s.t(24, 250, "nine public tables, four jobs (schema.ts:5-16)", "lbl-s");
})();

/* ─ g38 treemap ──────────────────────────────────────────────────────── */
(function () {
  const s = flat("g38");
  const tile = (x, y, w, h, t, cls) => { s.r(x, y, w, h, cls); s.t(x + w / 2, y + h / 2 + 4, t, w < 110 ? "lbl-s" : "lbl", "middle"); };
  tile(90, 50, 390, 110, "entries", "cap");
  tile(90, 160, 200, 26, "durable_schema", "side");
  tile(290, 160, 190, 26, "durable_metadata", "side");
  tile(480, 50, 80, 136, "record_ids", "side");
  tile(560, 50, 180, 74, "submissions", "cap");
  tile(740, 50, 130, 74, "tasks", "cap");
  tile(560, 124, 110, 62, "documents", "side");
  tile(670, 124, 70, 62, "revisions", "side");
  tile(740, 124, 130, 62, "conversations", "side");
  s.t(90, 208, "area ≈ writes a busy round touches — the transcript dwarfs the bookkeeping (schema.ts:5-16)", "lbl-s");
})();

/* ─ g39 sunburst ─────────────────────────────────────────────────────── */
(function () {
  const s = flat("g39");
  const C = [230, 130];
  const seg = (r0, r1, a0, a1, cls) => {
    const pts = [];
    const n0 = Math.max(2, Math.round((a1 - a0) / 0.14));
    for (let i = 0; i <= n0; i++) { const a = a0 + (a1 - a0) * i / n0; pts.push([C[0] + r1 * Math.cos(a), C[1] + r1 * Math.sin(a)]); }
    for (let i = n0; i >= 0; i--) { const a = a0 + (a1 - a0) * i / n0; pts.push([C[0] + r0 * Math.cos(a), C[1] + r0 * Math.sin(a)]); }
    s.p(pp(pts), cls);
  };
  const D = -Math.PI / 2, SPAN = Math.PI * 1.5;
  const groups = [
    { name: "conversation", span: 90, kids: [["entries", 70], ["conversations", 20]] },
    { name: "work", span: 100, kids: [["submissions", 50], ["tasks", 50]] },
    { name: "documents", span: 35, kids: [["documents", 20], ["revisions", 15]] },
    { name: "bookkeeping", span: 45, kids: [["record_ids", 15], ["metadata", 15], ["schema", 15]] },
  ];
  let a = D;
  groups.forEach(g => {
    const g0 = a, g1 = a + g.span * SPAN / 270;
    seg(48, 74, g0, g1, "side");
    let k = g0;
    g.kids.forEach(kid => {
      const k1 = k + kid[1] * SPAN / 270;
      seg(74, 104, k, k1, "cap");
      const am = (k + k1) / 2, p = [C[0] + 112 * Math.cos(am), C[1] + 112 * Math.sin(am)];
      s.t(p[0], p[1] + 4, kid[0], "lbl-s", Math.cos(am) < -0.2 ? "end" : Math.cos(am) > 0.2 ? "start" : "middle");
      k = k1;
    });
    const gm = (g0 + g1) / 2, gp = [C[0] + 61 * Math.cos(gm), C[1] + 61 * Math.sin(gm)];
    s.t(gp[0], gp[1] + 3, g.name, "lbl-s", "middle");
    a = g1;
  });
  s.t(C[0], C[1] - 4, "session", "lbl", "middle");
  const L = [
    ["conversation", "entries + conversations — the transcript of record"],
    ["work", "submissions + tasks — the queues and the lanes"],
    ["documents", "documents + revisions — committed history"],
    ["bookkeeping", "schema · metadata · record ids — the frame"],
  ];
  L.forEach((l, i) => { s.t(560, 64 + i * 44, l[0], "lbl-b"); s.t(560, 80 + i * 44, l[1], "lbl-s"); });
  s.t(560, 230, "same data; radial trades reading order for share", "lbl-s");
})();

/* ─ g40 org chart ───────────────────────────────────────────────────── */
(function () {
  const s = flat("g40");
  s.box(480, 74, 230, 48, "the session line", "one commit at a time", "cap");
  const kids = [[150, "submissions", "the input commit"], [370, "scheduler", "lanes · the pump"], [600, "conversations", "entries · docs"], [830, "watchEvents", "facts stream"]];
  s.p("M480 98V126", "ln2"); s.p("M150 126H830", "ln2");
  kids.forEach(k => {
    s.p(`M${k[0]} 126V146`, "ln2");
    s.box(k[0], 176, 180, 52, k[1], k[2], "side");
  });
  s.t(24, 226, "no dotted lines, no matrix: every organ writes through one commit (types.ts:146-150)", "lbl-s");
})();

/* ─ g41 exploded commit ─────────────────────────────────────────────── */
(function () {
  const s = flat("g41");
  const stages = ["document actions", "table writes", "document checks", "global-id checks", "metadata"];
  stages.forEach((t, i) => {
    const y = 36 + i * 44;
    s.r(120, y, 340, 30, "cap"); s.t(134, y + 20, (i + 1) + " · " + t, "lbl");
    s.p(`M462 ${y + 15}L644 148`, "wire");
  });
  s.cyl(740, 96, 170, 112, "side", "cap"); s.t(740, 146, "your SQLite file", "lbl", "middle"); s.t(740, 166, "one transaction", "lbl-s", "middle");
  s.t(24, 254, "five stages, zero intermediate observers — settled jumps to settled (storage.ts:191-201)", "lbl-s");
})();

/* ─ g42 blueprint ───────────────────────────────────────────────────── */
(function () {
  const s = flat("g42");
  s.r(120, 92, 820, 62, "cap");
  [[240, "id", "uuid"], [430, "requestId", "your key"], [620, "state", "queued → done"], [760, "entry", "entryId"], [820, "answer", "answerId"]].forEach((f, i, all) => {
    const x0 = f[0], x1 = i < all.length - 1 ? all[i + 1][0] : 940;
    s.p(`M${x0} 92V154`, "ln2");
    s.t((x0 + x1) / 2, 116, f[1], "lbl", "middle"); s.t((x0 + x1) / 2, 134, f[2], "lbl-s", "middle");
  });
  const dim = (x1, x2, y, lbl, cls) => {
    s.p(`M${x1} ${y}h6M${x2 - 6} ${y}h6`, cls);
    s.p(`M${x1} ${y}H${x2}`, cls); s.p(`M${x1 + 4} ${y - 4}L${x1} ${y}L${x1 + 4} ${y + 4}`, cls); s.p(`M${x2 - 4} ${y - 4}L${x2} ${y}L${x2 - 4} ${y + 4}`, cls);
    s.t((x1 + x2) / 2, y - 8, lbl, "lbl-s", "middle");
  };
  dim(240, 430, 176, "requestId — dedupe by key (types.ts:374-375)", "ln");
  dim(620, 940, 176, "state → its own answer slot", "ln2");
  dim(430, 620, 70, "the state machine fits one field", "ln2");
  s.t(24, 214, "the slot widths are illustrative — the dimension grammar says 'measured', the caption confesses", "lbl-s");
})();

/* ─ g43 anatomy ─────────────────────────────────────────────────────── */
(function () {
  const s = flat("g43");
  const F = [
    ["id", "issued by record_ids — one global counter"],
    ["requestId", "your dedupe key: same key settles once"],
    ["status", "queued · placed · done · unanswered (types.ts:383-414)"],
    ["answer", "the entryId that wait() returns (types.ts:843)"],
    ["detail", "why it was left unanswered (types.ts:407-414)"],
  ];
  s.t(140, 32, "one submission row", "lbl-b");
  F.forEach((f, i) => {
    const y = 46 + i * 34;
    s.r(140, y, 190, 26, i === 2 ? "cap" : "side");
    s.t(152, y + 18, f[0], "lbl");
    s.p(`M330 ${y + 13}H348`, "wire");
    s.t(356, y + 17, f[1], "lbl-s");
  });
  s.t(140, 224, "each field one receipt — the row explains itself", "lbl-s");
})();

/* ─ g44 ER ──────────────────────────────────────────────────────────── */
(function () {
  const s = flat("g44");
  s.box(140, 74, 190, 56, "conversations", "nodes of the graph", "cap");
  s.box(510, 74, 180, 56, "tasks", "durable work", "cap");
  s.box(830, 74, 160, 56, "documents", "committed docs", "cap");
  s.box(140, 196, 190, 52, "entries", "the transcript", "side");
  s.box(500, 196, 190, 52, "child conversations", "one per tool task", "side");
  s.box(830, 196, 160, 52, "revisions", "diffs + history", "side");
  lg(s, [[235, 74], [418, 74]], "1 — ∗", "ln", 338, 62, "middle");
  lg(s, [[600, 102], [750, 102]], "1 — ∗", "ln", 675, 90, "middle");
  lg(s, [[140, 102], [140, 170]], "1 — ∗", "ln", 152, 140, "start");
  lg(s, [[560, 102], [560, 170]], "1 — 1", "ln", 572, 140, "start");
  lg(s, [[830, 102], [830, 170]], "1 — ∗", "ln", 842, 140, "start");
  lg(s, [[420, 210], [239, 210]], "written by", "guide", 372, 198, "middle");
  s.t(24, 232, "crow's feet are foreign keys; the dashed edge is a write, not an ownership (src/types.ts:306-315)", "lbl-s");
})();

/* ─ g45 star schema ─────────────────────────────────────────────────── */
(function () {
  const s = flat("g45");
  s.box(490, 140, 200, 62, "entries", "the fact · measurable", "cap");
  const dims = [[190, 70, "conversations", "which transcript"], [490, 52, "tasks", "which work"], [790, 70, "documents", "which doc diffs"], [190, 224, "record_ids", "which ids"], [790, 224, "submissions", "which input"]];
  dims.forEach(d => s.box(d[0], d[1], 180, 52, d[2], d[3], "side"));
  lg(s, [[490, 78], [490, 108]], "1 — ∗", "ln", 504, 94, "start");
  lg(s, [[388, 122], [282, 84]], "", "wire");
  lg(s, [[592, 122], [698, 84]], "", "wire");
  lg(s, [[388, 158], [282, 216]], "", "wire");
  lg(s, [[592, 158], [698, 216]], "", "wire");
})();
/* ─ g46 b-tree ────────────────────────────────────────────────────────── */
(function () {
  const s = flat("g46");
  s.box(480, 60, 280, 40, "root · internal page", "separators route every lookup", "cap");
  const L = [[150, "ids ≤ 9"], [370, "10–39"], [590, "40–69"], [810, "≥ 70"]];
  L.forEach((l, i) => {
    const hot = i === 1;
    s.box(l[0], 170, 200, 44, "leaf page", l[1], hot ? "cap" : "side");
    lg(s, [[480 - 105 + i * 70, 80], [l[0], 146]], "", hot ? "ln" : "wire");
  });
  s.c(380, 186, 5, "solid"); s.t(370, 212, "target: entry 22 — three reads", "lbl-s", "middle");
  s.t(24, 234, "every durable id resolves through this shape — the receipt is the lookup path (schema.ts:5-16)", "lbl-s");
})();

/* ─ g47 lsm flush ─────────────────────────────────────────────────────── */
(function () {
  const s = flat("g47");
  s.box(150, 90, 180, 50, "memtable", "uncommitted partials", "side");
  lg(s, [[244, 100], [425, 128]], "flush → commit ~100 ms", "ln", 320, 100, "middle");
  s.box(430, 56, 190, 24, "run k−2 — oldest", "", "guide");
  s.box(430, 90, 190, 24, "run k−1", "", "side");
  s.box(430, 124, 190, 24, "run k — newest", "", "cap");
  s.p("M420 80C380 92 370 108 424 116", "guide"); s.t(320, 146, "compaction merges old runs", "lbl-s", "middle");
  s.t(24, 196 - 20, "each flush is one progress commit; between flushes the memtable is the crash tail (lab 05: 144 chars)", "lbl-s");
})();

/* ─ g48 hash buckets ──────────────────────────────────────────────────── */
(function () {
  const s = flat("g48");
  const B = [[180, ["q-7", "q-31"]], [360, ["q-2"]], [540, ["q-9", "q-44"]], [720, []]];
  B.forEach((b, i) => {
    s.box(b[0], 62, 110, 26, "bucket " + i, "", "cap");
    b[1].forEach((k, j) => {
      const y = 92 + j * 26;
      s.r(b[0] - 52, y - 11, 104, 22, k === "q-31" ? "cap cur" : "side");
      s.t(b[0], y + 4, k, "lbl-s", "middle");
    });
    if (!b[1].length) s.t(b[0], 100, "empty", "lbl-s", "middle");
  });
  s.p("M180 96L126 152", "guide"); s.t(96, 166, "hash(key) % 4", "lbl-s", "middle");
  s.t(180, 40, "a retry of q-31 lands in the same cell", "lbl-s", "middle");
  s.t(24, 196, "deterministic filing is idempotency: same key, same bucket, same submission (src/types.ts:374-375)", "lbl-s");
})();

/* ─ g49 ring buffer ───────────────────────────────────────────────────── */
(function () {
  const s = flat("g49");
  const C = [480, 112], R = 70;
  const slots = ["", "", "seq 22", "seq 23", "seq 24", ""];
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 3, p = [C[0] + R * Math.cos(a), C[1] + R * Math.sin(a)];
    const cl = slots[i] ? "cap" : "guide";
    s.r(p[0] - 45, p[1] - 15, 90, 30, cl);
    if (slots[i]) s.t(p[0], p[1] + 4, slots[i], "lbl-s", "middle");
  }
  s.arrow([[700, 188], [532, 188]], "ln", 5); s.t(700, 174, "new event", "lbl-s", "end");
  s.arrow([[432, 62], [230, 48]], "wire", 5); s.t(240, 34, "readers replay", "lbl-s", "start");
  s.t(C[0], C[1], "events", "lbl-s", "middle");
  s.t(24, 202, "slots overwrite in place — a reader behind the write head replays committed facts (events.ts:69-120)", "lbl-s");
})();

/* ─ g50 write-ahead strip (steps) ─────────────────────────────────────── */
(function () {
  const s = flat("g50");
  const CELLS = [20, 21, 22, 23, 24];
  const S = [
    { cap: "<b>Attached.</b> Every write means one transaction: metadata first, then the tables — nothing in between is observable.", done: 3, flight: -1, head: 3 },
    { cap: "<b>Commit 23 lands.</b> The strip extends by exactly one cell; the head stands at 23.", done: 4, flight: -1, head: 4 },
    { cap: "<b>Commit 24 in flight.</b> Dashed: you may not observe half of it — callers see 22 or 23, never between.", done: 4, flight: 4, head: 4 },
    { cap: "<b>Settled jumps to settled.</b> 24 commits whole; the next transaction may begin.", done: 5, flight: -1, head: 5 },
  ];
  steps("g50", S, (i, st) => {
    s.clear();
    s.t(24, 34, "the session line as tape — left: settled, right: next", "lbl-s");
    CELLS.forEach((n, j) => {
      const x = 140 + j * 130, done = j < st.done, flight = j === st.flight;
      s.r(x, 96, 118, 42, flight ? "guide" : "cap");
      s.t(x + 59, 122, "commit " + n, flight ? "lbl-b" : "lbl", "middle");
      if (done) s.check(x + 59, 152, 5);
    });
    if (st.head < 5) { const hx = 140 + st.head * 130; s.arrow([[hx - 20, 190], [hx + 30, 190]], "ln2", 5); s.t(hx + 44, 186, "head", "lbl-s"); }
  });
})();

/* ─ g51 vector clocks ─────────────────────────────────────────────────── */
(function () {
  const s = flat("g51");
  const K = [[170, ["A 3", "B 1", "C 0"]], [450, ["A 2", "B 4", "C 1"]], [730, ["A 2", "B 1", "C 3"]]];
  const names = ["conv A", "conv B", "conv C"];
  K.forEach((k, i) => {
    s.box(k[0], 118, 130, 86, "", "", "side"); s.t(k[0], 68, names[i], "lbl-b", "middle");
    k[1].forEach((l, j) => s.t(k[0] - 30, 100 + j * 24, l, "lbl-s", "start"));
    s.hit(k[0] - 65, 75, 130, 94, names[i]);
  });
  s.p("M515 118H665", "guide"); s.t(590, 104, "B4 ∥ C3", "lbl-b", "middle");
  s.t(590, 180, "concurrent — both durable, neither first", "lbl-s", "middle");
  s.t(24, 226, "no entry needs a global order to be durable — counts reconcile on read (src/harness/live.ts:111)", "lbl-s");
})();

/* ─ g52 merkle ladder ─────────────────────────────────────────────────── */
(function () {
  const s = flat("g52");
  const R = ["rev 4 · h3 + Δ4", "rev 3 · h2 + Δ3", "rev 2 · h1 + Δ2", "rev 1 · the base"];
  R.forEach((t, i) => { const y = 56 + i * 48; s.r(360, y, 240, 30, "cap"); s.t(480, y + 19, t, "lbl-s", "middle"); });
  s.arrow([[330, 210], [330, 72]], "ln2", 5); s.t(306, 140, "each Δ rides the line", "lbl-s", "end");
  s.arrow([[660, 72], [660, 210]], "guide", 5); s.t(672, 140, "rewind replays", "lbl-s", "start");
})();

/* ─ g53 crdt lattice ──────────────────────────────────────────────────── */
(function () {
  const s = flat("g53");
  const N = { a: [480, 190], b: [350, 112], c: [610, 112], d: [480, 42] };
  const Lab = { a: "rev 5", b: "worker 1", c: "worker 2", d: "join?" };
  ["a", "b", "c"].forEach(k => { s.c(N[k][0], N[k][1], 22, "cap"); s.t(N[k][0], N[k][1] + 38, Lab[k], "lbl-s", "middle"); });
  s.c(N.d[0], N.d[1], 22, "guide"); s.t(N.d[0], N.d[1] + 38, "a merge must be chosen", "lbl-s", "middle");
  lg(s, [[N.a[0] - 60, N.a[1] - 18], [N.b[0], N.b[1] + 24]], "", "wire");
  lg(s, [[N.a[0] + 60, N.a[1] - 18], [N.c[0], N.c[1] + 24]], "", "wire");
  lg(s, [[N.b[0] + 20, N.b[1] - 20], [N.d[0] - 12, N.d[1] + 20]], "", "wire");
  lg(s, [[N.c[0] - 20, N.c[1] - 20], [N.d[0] + 12, N.d[1] + 20]], "", "wire");
  s.t(426, 58, "B ∥ C", "lbl-b", "middle");
})();

/* ─ g54 quorum circles ────────────────────────────────────────────────── */
(function () {
  const s = flat("g54");
  s.c(380, 128, 74, "ln"); s.c(520, 128, 74, "ln");
  s.t(356, 76, "read set", "lbl", "middle"); s.t(544, 76, "write set", "lbl", "middle");
  s.cyl(450, 96, 64, 70, "side", "cap"); s.t(450, 126, "the one", "lbl-s", "middle"); s.t(450, 140, "adapter", "lbl-s", "middle");
})();

/* ─ g55 queue tape ────────────────────────────────────────────────────── */
(function () {
  const s = flat("g55");
  const cells = ["w", "w", "w", "w", "a", "a", "a", "p", "p", "", "", ""];
  cells.forEach((c, i) => {
    const x = 90 + i * 58;
    s.r(x, 92, 54, 40, c === "p" ? "cap" : c ? "side" : "guide");
  });
  s.t(201, 66, "waiting — behind the gates", "lbl-s", "middle");
  s.t(407, 66, "admitted", "lbl-s", "middle");
  s.t(552, 66, "placed — owned by a run", "lbl-s", "middle");
  s.p(`M${90 + 4 * 58 - 3} 78V146`, "guide"); s.t(90 + 4 * 58 - 3, 152, "gates: busy-checks", "lbl-s", "middle");
  s.arrow([[898, 112], [790, 112]], "ln", 5); s.t(856, 96, "new input", "lbl-s", "middle");
  s.t(24, 186, "the same tape drawn right-to-left: enter at the right, settle from the left (src/harness/inbox.ts:99-111)", "lbl-s");
})();

/* ─ g56 lane clock (play) ─────────────────────────────────────────────── */
(function () {
  const s = flat("g56"), X = t => 130 + t * 68;
  const Y = { proc: 100, gen: 164, sto: 228, AX: 266 };
  const lanes = { proc: "processes", gen: "generation task", sto: "storage" };
  const SC = {
    healthy: { label: "healthy round", end: 9,
      acts: [["proc", 0, .7, "open", "cap"], ["gen", .7, 4.9, "prepare + request · stream", "cap"], ["sto", .8, 4.9, "progress commits", "side"], ["proc", 5.7, 6.2, "wait() ✓", "cap"]],
      marks: [["gen", .7, "ok", "checkpoint"], ["gen", 4.9, "ok", "answer committed"], ["proc", 5.7, "ok", "settled"]],
      events: [
        { t: .7, cap: "<b>Prepare.</b> The checkpoint commits before any model bytes — a retry resumes exactly here." },
        { t: 4.9, cap: "<b>Answer committed.</b> The assistant entry rides the same commit line as everything else." },
        { t: 5.7, cap: "<b>Settle.</b> The submission resolves; the lanes go quiet." }] },
    crash: { label: "killed mid-stream", end: 9,
      acts: [["proc", 0, .7, "open", "cap"], ["gen", .7, 2.7, "prepare + request · stream", "cap"], ["sto", .8, 2.7, "progress commits", "side"],
             ["proc", 4.2, 5.0, "reopen · open() scan", "cap"], ["gen", 5.0, 8.2, "request retried", "warn"], ["sto", 5.0, 8.2, "progress commits again", "side"]],
      marks: [["proc", 2.7, "bad", "SIGKILL"], ["gen", 4.2, "bad", "running → pending"], ["proc", 5.05, "ok", "resume()"], ["gen", 8.2, "ok", "answer committed · 2 550 chars"]],
      events: [
        { t: 1.5, cap: "<b>Streaming.</b> 144 streamed chars are the tail; earlier partials are already durable." },
        { t: 2.7, cap: "<b>SIGKILL.</b> No flush, no handlers — storage keeps everything up to the last progress commit." },
        { t: 4.2, cap: "<b>Reopen.</b> The open scan rewrites running → pending for the interrupted generation." },
        { t: 5.0, cap: "<b>resume()</b> — the task re-runs from its checkpoint: a retry, not a replay." },
        { t: 8.2, cap: "<b>The answer lands anyway.</b> 2 550 chars committed by the second process (lab 05)." }] },
  };
  function draw(T, sc) {
    s.clear();
    ["proc", "gen", "sto"].forEach(l => { s.t(24, Y[l] + 4, lanes[l], "lbl"); s.p(`M${X(0)} ${Y[l]}H${X(9)}`, "ln2"); });
    s.p(`M${X(0)} ${Y.AX}H${X(9)}`, "ln");
    for (let t = 0; t <= 9; t++) { s.p(`M${X(t)} ${Y.AX - 4}V${Y.AX + 4}`, "ln2"); s.t(X(t), Y.AX + 18, "" + t, "lbl-s", "middle"); }
    sc.acts.forEach(a => {
      if (T < a[1]) return; const e = Math.min(T, a[2]);
      const tone = a[4] === "warn" ? "warn-f" : a[4];
      const w = Math.max(2, X(e) - X(a[1]));
      s.r(X(a[1]), Y[a[0]] - 12, w, 24, tone);
      if (w > a[3].length * 5.4 + 8) s.t(X(a[1]) + 6, Y[a[0]] + 4, a[3], "lbl-s");
    });
    sc.marks.forEach(m => {
      if (T < m[1]) return;
      (m[2] === "bad" ? s.xmark : s.check)(X(m[1]), Y[m[0]] - 22, 5);
      s.t(X(m[1]) + 10, Y[m[0]] - 18, m[3], m[2] === "bad" ? "lbl-b" : "lbl-g");
    });
    s.p(`M${X(T)} 56V${Y.AX}`, "guide"); s.t(X(T), 50, "t = " + (Math.round(T * 10) / 10) + " s", "lbl", "middle");
  }
  play("g56", SC, (T, sc) => draw(T, sc), { speed: 2.4, label: "scenario" });
})();

/* ─ g57 gantt ─────────────────────────────────────────────────────────── */
(function () {
  const s = flat("g57"), X = t => 120 + t * 59;
  const rows = [["open scan", 0, 4.2, "open scan"], ["demote", 4.2, 4.9, ""], ["resume()", 4.9, 5.0, ""], ["retried request", 5.0, 8.2, "retried request · from the checkpoint"]];
  rows.forEach((r, i) => {
    const y = 66 + i * 34;
    s.t(24, y + 4, r[0] === r[3] ? r[0] : r[0], "lbl", "start");
    const x0 = X(r[1]), x1 = X(r[2]);
    s.r(x0, y - 12, x1 - x0, 24, i === 3 ? "warn" : "cap");
    if (x1 - x0 > r[3].length * 5.4 + 10) s.t(x0 + 8, y + 4, r[3], "lbl-s");
  });
  s.p(`M${X(4.2)} 66V${66 + 34 - 12}`, "ln2"); s.p(`M${X(4.9)} ${66 + 34}V${66 + 68 - 12}`, "ln2");
  s.p(`M120 34H600`, "ln2");
  [0, 2, 4, 6, 8].forEach(t => { s.p(`M${X(t)} 30V38`, "ln2"); s.t(X(t), 24, "" + t, "lbl-s", "middle"); });
  s.t(600, 38, "seconds →", "lbl-s", "start");
  s.check(X(8.2), 66 + 3 * 34 - 20, 5); s.t(X(8.2) + 10, 66 + 3 * 34 - 16, "answer committed", "lbl-s", "start");
  s.t(24, 210, "reopen → demote → resume → re-run: four bars, each ending where the next begins (lab 05 · scheduler.ts:296-312)", "lbl-s");
})();

/* ─ g58 departure board ───────────────────────────────────────────────── */
(function () {
  const s = flat("g58");
  s.r(100, 64, 760, 100, "cap");
  s.p("M100 114H860", "ln2");
  s.t(132, 94, "attempt", "lbl"); s.t(390, 94, "1 · the killed stream", "lbl-b"); s.t(640, 94, "144 chars unflushed", "lbl-b"); s.t(846, 94, "retry follows", "lbl-s", "end");
  s.t(132, 144, "attempt", "lbl"); s.t(390, 144, "2 · reopened + resumed", "lbl-g"); s.t(640, 144, "2 550 chars committed", "lbl-g"); s.t(846, 144, "settled", "lbl-s", "end");
  s.t(24, 196, "one row per attempt — the board cannot show a half-attempt, and neither can durability (lab 05)", "lbl-s");
})();

/* ─ g59 seismograph ───────────────────────────────────────────────────── */
(function () {
  const s = flat("g59");
  s.p("M110 170H900", "ln");
  for (let k = 0; k < 14; k++) { const x = 130 + k * 40; s.p(`M${x} 170V146`, "ln"); s.c(x, 144, 2.5, "solid"); }
  s.p("M736 170V96", "bad-l"); s.xmark(736, 92, 6, "bad-l");
  s.t(752, 108, "SIGKILL", "lbl-b", "start");
  s.t(130, 192, "0 ms", "lbl-s", "middle"); s.t(410, 192, "one spike per progress commit (~100 ms)", "lbl-s", "middle");
})();

/* ─ g60 burn-down ─────────────────────────────────────────────────────── */
(function () {
  const s = flat("g60"), X = t => 110 + t * 82, Y = c => 175 - (c / 600) * 110;
  s.p("M110 175H880", "ln2"); s.p("M110 55V175", "ln2");
  s.p(`M${X(.7)} 175L332 ${Y(288)}`, "ln");
  s.t(250, Y(288) - 30, "streamed · 288 ch", "lbl", "middle");
  let d = `M${X(.7)} 175`;
  for (let k = 1; k <= 20; k++) d += `L${(X(.7) + (332 - X(.7)) * k / 20).toFixed(1)} ${(175 - 26 * k / 20).toFixed(1)}`;
  s.p(d, "ln2"); s.t(346, 168, "committed · 144 ch", "lbl", "start");
  s.arrow([[332, Y(288) + 2], [332, 147]], "bad-l", 4); s.t(344, Y(288) + 8, "the tail: 144 chars", "lbl-b", "start");
  s.xmark(332, 171, 5, "bad-l"); s.t(332, 96, "SIGKILL", "lbl-b", "middle");
  [0, 3, 6, 9].forEach(t => s.t(X(t), 192, "t=" + t, "lbl-s", "middle"));
  s.t(880, 44, "the staircase survives — the gap is the crash tail (lab 05)", "lbl-s", "end");
})();

/* ─ g61 interval bars ─────────────────────────────────────────────────── */
(function () {
  const s = flat("g61");
  for (let i = 0; i < 5; i++) {
    const y = 50 + i * 26, cw = 120 + i * 34;
    s.r(140, y, 300, 20, "side");
    s.r(140, y, cw, 20, "cap");
    s.t(128, y + 14, "t+" + i * 100, "lbl-s", "end");
  }
  s.t(140, 40, "provider bytes (light) vs the committed slice (solid)", "lbl-s");
  s.t(24, 196, "in each window the committed slice lands before the next one opens (agent.ts:35)", "lbl-s");
})();

/* ─ g62 lineage ledger ────────────────────────────────────────────────── */
(function () {
  const s = flat("g62");
  const rows = [["e11", "pi.user — the input, committed"], ["e12", "pi.system — the round opens"], ["e13", "pi.tool ×3 — children 15 / 21 / 27"], ["e14", "pi.tool results — one entry"], ["e15", "pi.assistant — the answer"]];
  rows.forEach((r, i) => {
    const y = 58 + i * 32;
    s.t(120, y, r[0], "lbl-s", "end"); s.p(`M132 ${y - 4}H160`, "ln2"); s.t(172, y, r[1], "lbl");
  });
  s.p("M640 42V186", "ln2"); s.p("M640 42H628", "ln2"); s.p("M640 186H628", "ln2");
  s.t(656, 112, "one round", "lbl", "start");
  s.t(24, 218, "schematic ids — the shape of the receipt matters, not the lab numbers (lab 02)", "lbl-s");
})();

/* ─ g63 retry ladder ──────────────────────────────────────────────────── */
(function () {
  const s = flat("g63");
  s.p("M820 50V200H90", "ln2");
  s.p("M90 200L300 120", "ln"); s.xmark(300, 116, 6, "bad-l");
  s.p("M420 200L640 74L816 74", "ln");
  s.box(886, 60, 130, 30, "the answer ✓", "", "ok-f");
  s.t(90, 218, "attempt 1 — fell at the kill", "lbl-s", "start");
  s.t(420, 218, "attempt 2 — resumed at the checkpoint", "lbl-s", "start");
  s.t(90, 56, "height = progress · floor = storage", "lbl-s", "start");
})();

/* ─ g64 strip chart handover ──────────────────────────────────────────── */
(function () {
  const s = flat("g64");
  s.r(100, 100, 300, 24, "cap"); s.t(108, 116, "process A — killed at t=2.7", "lbl-s");
  s.r(470, 100, 420, 24, "ok-f"); s.t(478, 116, "process B — reopen · resume · answer ✓", "lbl-s");
  s.p("M440 78V156", "guide"); s.t(440, 172, "handover = one commit", "lbl-s", "middle");
  s.xmark(380, 112, 5, "bad-l");
  s.t(24, 190, "two bars, one run — the strip's whole point is the seam (lab 05)", "lbl-s");
})();
/* ─ g65 call stack (steps) ────────────────────────────────────────────── */
(function () {
  const s = flat("g65"), BX = 280, W = 380, BASE = 296, FH = 34, GAP = 6;
  const S = [
    { f: ["hub.submit()"], n: "all lanes start in one call" },
    { f: ["hub.submit()", "append entry + row"], n: "one commit: pi.user + submission" },
    { f: ["hub.submit()", "wait() parked"], n: "the caller waits on a committed row" },
    { f: ["drain sweep", "admit a generation task"], n: "the scheduler starts the run" },
    { f: ["drain sweep", "prepare — the checkpoint"], n: "model · cutoff · gate, before any bytes" },
    { f: ["drain sweep", "streamResponse", "progress commit"], n: "partials every ~100 ms (agent.ts:35)" },
    { f: ["drain sweep", "classify"], n: "text → entry · tools → child tasks" },
    { f: [], n: "stack empty — the submission settled from committed rows", ghost: 1 },
  ];
  steps("g65", S, (i, st) => {
    s.clear();
    s.t(24, 40, "frames vanish; state stays", "lbl-s");
    st.f.forEach((fr, j) => {
      const y = BASE - j * (FH + GAP);
      s.r(BX, y - FH, W, FH, j === st.f.length - 1 ? "cap cur" : "side");
      s.t(BX + 14, y - 12, fr, "lbl");
    });
    if (st.ghost) s.r(BX, BASE - FH, W, FH, "guide");
    s.t(672, 96, "now:", "lbl-s");
    s.t(672, 120, st.f.length ? st.n : "stack empty — settled from rows", "lbl");
    s.p(`M${BX - 26} ${BASE}V84`, "ln2"); s.t(BX - 34, 88, "depth ↑", "lbl-s", "end");
  });
})();

/* ─ g66 flame bars ────────────────────────────────────────────────────── */
(function () {
  const s = flat("g66");
  s.r(140, 56, 700, 28, "cap"); s.t(150, 74, "drain sweep — one scheduler tick", "lbl");
  const row = [[150, 100, 96, "prepare"], [250, 100, 240, "request (stream)"], [494, 100, 190, "tool round"], [688, 100, 152, "append"]];
  row.forEach(b => { s.r(b[0], 90, b[2], 22, "side"); if (b[2] > b[3].length * 5.4 + 8) s.t(b[0] + 7, 105, b[3], "lbl-s"); });
  for (let k = 0; k < 5; k++) s.r(254 + k * 28, 118, 20, 14, "cap");
  s.t(254, 150, "one thin bar per progress commit (~100 ms)", "lbl-s", "start");
  s.t(112, 72, "1", "lbl-s", "end"); s.t(112, 104, "2", "lbl-s", "end"); s.t(112, 128, "3", "lbl-s", "end");
  s.t(24, 200, "widths are schematic — the grammar is borrowed for shape, not for profiling (agent.ts:35)", "lbl-s");
})();

/* ─ g67 waterfall trace ───────────────────────────────────────────────── */
(function () {
  const s = flat("g67"), X = t => 110 + t * 82;
  const spans = [["admit", 0, .6, 62], ["prepare", .6, 1.4, 90], ["request (stream)", 1.4, 4.9, 118], ["append", 4.9, 5.4, 146]];
  spans.forEach(sp => {
    const x0 = X(sp[1]), x1 = X(sp[2]);
    s.r(x0, sp[3], x1 - x0, 22, "side");
    s.t(x0 + 7, sp[3] + 15, sp[0], x1 - x0 > sp[0].length * 5.4 + 8 ? "lbl-s" : "lbl-s", "start");
  });
  [1.6, 2.6, 3.6].forEach(t => s.p(`M${X(t)} 140V150`, "ln2"));
  s.t(240, 166, "partial commits every ~100 ms", "lbl-s", "start");
  s.p("M110 176H880", "ln2");
  [0, 3, 6, 9].forEach(t => { s.p(`M${X(t)} 172V180`, "ln2"); s.t(X(t), 194, "t=" + t, "lbl-s", "middle"); });
  s.check(X(5.7), 152, 5); s.t(X(5.7) + 10, 156, "wait() resolves", "lbl-s", "start");
})();

/* ─ g68 actor mailbox ─────────────────────────────────────────────────── */
(function () {
  const s = flat("g68");
  ["q-5", "q-6", "q-7"].forEach((q, i) => {
    const y = 56 + i * 34;
    s.r(130, y, 90, 24, "side"); s.t(175, y + 16, "sub " + q, "lbl-s", "middle");
  });
  lg(s, [[224, 108], [356, 108]], "one at a time", "ln", 292, 94, "middle");
  s.box(480, 116, 240, 84, "the inbox", "admit · park · settle", "cap");
  lg(s, [[604, 122], [718, 122]], "stamped done", "ln", 664, 108, "middle");
  s.box(800, 122, 150, 34, "settled ✓", "", "ok-f");
  s.t(480, 186, "same requestId → same letter, once (types.ts:374-375)", "lbl-s", "middle");
  s.t(24, 222, "at-least-once in, exactly-once settled — the stamp, not the envelope", "lbl-s");
})();

/* ─ g69 loop ring ─────────────────────────────────────────────────────── */
(function () {
  const s = flat("g69"), C = [400, 130], R = 88;
  s.c(C[0], C[1], R, "ln");
  const ST = [[-3 * Math.PI / 4, "take pending"], [-Math.PI / 4, "mark settled"], [3 * Math.PI / 4, "take input"], [Math.PI / 4, "walk aborts"]];
  ST.forEach(st => {
    const a = st[0], p = [C[0] + R * Math.cos(a), C[1] + R * Math.sin(a)];
    s.box(p[0], p[1], 120, 32, st[1], "", "side");
  });
  [[-Math.PI / 2, 1, 0], [0, 0, 1], [Math.PI / 2, -1, 0], [Math.PI, 0, -1]].forEach(h => {
    const x = C[0] + R * Math.cos(h[0]), y = C[1] + R * Math.sin(h[0]);
    s.p(`M${x - h[1] * 7 + h[2] * 5} ${y - h[2] * 7 + h[1] * 5}L${x + h[1] * 7} ${y + h[2] * 7}L${x - h[1] * 7 - h[2] * 5} ${y - h[2] * 7 - h[1] * 5}`, "ln");
  });
  lg(s, [[180, 192], [274, 192]], "submit · wait · abort", "ln", 196, 172, "start");
  lg(s, [[508, 130], [660, 130]], "committed state", "ln", 570, 116, "middle");
  s.box(750, 130, 160, 40, "the ledger", "", "cap");
})();

/* ─ g70 csp channel ───────────────────────────────────────────────────── */
(function () {
  const s = flat("g70");
  s.box(150, 110, 200, 60, "the writer", "commit callback", "cap");
  s.p("M270 104H620", "ln2"); s.p("M270 126H620", "ln2");
  s.r(400, 99, 34, 30, "solid");
  s.t(418, 156, "one parcel, accepted whole", "lbl-s", "middle");
  s.box(710, 110, 210, 60, "the ledger", "applies or faults", "side");
  lg(s, [[624, 116], [700, 116]], "", "ln");
  s.t(24, 196, "half-commits are unthinkable in this grammar — and unobservable in the real one", "lbl-s");
})();

/* ─ g71 worker pool ───────────────────────────────────────────────────── */
(function () {
  const s = flat("g71");
  s.r(120, 62, 720, 110, "side");
  s.t(136, 82, "the pool", "lbl");
  s.box(220, 118, 170, 40, "tool 12", "running", "cap");
  s.box(460, 118, 170, 40, "tool 13", "running", "cap");
  s.box(700, 118, 170, 40, "tool 14", "parked · waiting", "ok-f");
  s.arrow([[890, 118], [936, 118]], "wire", 5); s.t(936, 136, "→ next", "lbl-s", "end");
  s.t(24, 196, "parallel by default, capacity made visible — three tools, one parked (src/types.ts:519-525)", "lbl-s");
})();

/* ─ g72 heap generations ──────────────────────────────────────────────── */
(function () {
  const s = flat("g72");
  s.r(120, 70, 500, 110, "cap"); s.t(136, 92, "old generation", "lbl-b"); s.t(136, 112, "committed state — survives every collect", "lbl-s");
  s.r(680, 70, 200, 110, "cut"); s.t(696, 92, "nursery", "lbl-b"); s.t(696, 112, "unflushed tail — dies", "lbl-s");
  s.p("M640 125L676 125", "ln"); s.arrow([[676, 112], [676, 138]], "bad-l", 4);
  s.t(24, 206, "map the GC labels onto processes: SIGKILL collects the nursery; committed state is untouched (lab 05)", "lbl-s");
})();

/* ─ g73 before/after overlay (choose) ─────────────────────────────────── */
(function () {
  const s = flat("g73");
  const N = [70, 180, 290, 400, 510, 620], T = ["submit", "admit", "prepare", "request", "tools", "answer"], H = 120;
  function draw(m) {
    s.clear();
    s.t(24, 40, m === "memory-only" ? "mode 1 — memory-only process: nothing below it" : "mode 2 — the durable session: every step commits", "lbl");
    T.forEach((t, i) => {
      const x = N[i] + 40;
      if (m === "memory-only") { s.r(x, H, 84, 36, "guide"); s.t(x + 42, H + 22, t, "lbl-s", "middle"); }
      else { s.box(x, H + 8, 84, 36, t, "", "cap"); s.check(x + 42, H - 8, 5); }
      if (i < N.length - 1) s.p(`M${x + 86} ${H + 18}H${N[i + 1] + 38}`, m === "memory-only" ? "guide" : "ln");
    });
    if (m === "memory-only") { s.p("M752 138V188", "bad-l"); s.xmark(752, 192, 6, "bad-l"); s.t(766, 190, "the tail — gone", "lbl-b", "start"); }
    else { s.r(70, 188, 760, 10, "side"); s.t(848, 196, "the ledger", "lbl-s", "end"); s.t(70, 196, "survives the kill", "lbl-s"); }
  }
  choose("g73", [{ k: "memory-only", label: "memory only", cap: "<b>Memory-only.</b> Frames and their tail share one fate." }, { k: "committed", label: "committed", cap: "<b>Committed.</b> Same steps, each one leaving a receipt below." }], (i) => draw(i), "mode");
})();

/* ─ g74 side by side ──────────────────────────────────────────────────── */
(function () {
  const s = flat("g74");
  s.p("M480 40V230", "ln2");
  s.t(250, 52, "foreground rule", "lbl-b", "middle");
  s.box(250, 96, 150, 40, "generation 9", "the round", "cap");
  ["12", "13", "14"].forEach((n, i) => {
    s.box(160 + i * 96, 172, 90, 36, "t " + n, "", "side");
    lg(s, [[250, 116], [160 + i * 96, 152]], "", i === 1 ? "ln" : "wire");
  });
  s.t(160, 226, "children are the answer", "lbl-s", "middle");
  s.t(720, 52, "background rule", "lbl-b", "middle");
  s.box(660, 96, 130, 40, "anchor task", "lasting", "cap");
  s.box(600, 172, 110, 36, "worker a", "", "side");
  s.box(760, 172, 110, 36, "worker b", "", "side");
  lg(s, [[660, 116], [600, 152]], "", "wire"); lg(s, [[780, 116], [760, 152]], "", "wire");
  s.t(700, 226, "reporters outlive the round", "lbl-s", "middle");
  s.t(24, 252 - 10, "two canvases, one inline each — the honest grammar when the options differ structurally (lab 02 · lab 03)", "lbl-s");
})();

/* ─ g75 diff marks ────────────────────────────────────────────────────── */
(function () {
  const s = flat("g75");
  const cols = ["submit", "admit", "prepare", "stream", "tools", "answer", "settle"];
  cols.forEach((c, i) => s.t(140 + i * 108, 54, c, "lbl-s", "middle"));
  cols.forEach((c, i) => s.check(140 + i * 108, 86, 6));
  s.t(40, 90, "healthy", "lbl", "start");
  cols.forEach((c, i) => {
    const x = 140 + i * 108;
    if (i === 3) { s.xmark(x, 146, 7, "bad-l"); s.t(x, 176, "lost tail", "lbl-b", "middle"); }
    else if (i >= 4) { s.p(`M${x - 30} 146H${x + 30}`, "guide"); s.t(x, 176, i === 6 ? "settled ✓" : "retried", "lbl-s", "middle"); s.check(i === 6 ? x : x + 30, 146, 5); }
    else s.check(x, 146, 6);
  });
  s.t(40, 150, "killed", "lbl", "start");
  s.t(24, 206, "one alignment rule: phase names align, times do not — the diff marks do the rest (lab 05)", "lbl-s");
})();

/* ─ g76 catalog quadrant ──────────────────────────────────────────────── */
(function () {
  const s = flat("g76");
  s.p("M480 40V220", "ln2"); s.p("M140 130H900", "ln2");
  s.t(482, 52, "what one look teaches ↑", "lbl-s", "start");
  s.t(150, 148, "cheap to author", "lbl-s", "start"); s.t(892, 148, "expensive to author", "lbl-s", "end");
  const D = [[220, 84, "regions map"], [330, 70, "adjacency matrix"], [560, 96, "strata"], [640, 180, "metro"], [420, 150, "sequence"], [280, 128, "ledger"]];
  D.forEach(d => { s.c(d[0], d[1], 8, "solid"); s.t(d[0], d[1] - 14, d[2], "lbl-s", "middle"); });
  s.t(24, 238, "the catalog judging itself: fidelity vs the tokens it costs — for 'one figure, any page', start upper-left", "lbl-s");
})();

/* ─ g77 adapter scatter ───────────────────────────────────────────────── */
(function () {
  const s = flat("g77");
  s.p("M140 60V210H900", "ln2");
  s.t(148, 52, "guarantees ↑", "lbl-s", "start"); s.t(892, 226, "commit latency →", "lbl-s", "end");
  const D = [[220, 186, "memory"], [300, 150, "jsonl"], [560, 76, "sqlite file"], [760, 72, "DO storage"]];
  D.forEach(d => { s.c(d[0], d[1], 8, "solid"); s.t(d[0], d[1] - 14, d[2], "lbl", "middle"); });
  s.t(244, 214, "no durability", "lbl-s", "middle");
  s.t(560, 100, "full · single writer", "lbl-s", "middle");
})();

/* ─ g78 phase transition ──────────────────────────────────────────────── */
(function () {
  const s = flat("g78");
  s.p("M110 170H880", "ln2");
  s.p("M110 130H300", "cap"); s.p("M300 130V60", "ln"); s.p("M300 60H620", "cap"); s.p("M620 60V130", "ln"); s.p("M620 130H880", "cap");
  s.t(200, 118, "paused", "lbl", "middle"); s.t(460, 48, "running — the pump drains", "lbl", "middle"); s.t(750, 118, "paused", "lbl", "middle");
  s.t(300, 152, "submit / wait / abort / resume", "lbl-s", "middle"); s.t(300, 172, "the cliff, not a ramp", "lbl-b", "middle");
  s.t(640, 172, "quiet → paused again", "lbl-s", "middle");
  s.t(24, 200, "phases suit the pump because there is no in-between: it flips (scheduler.ts:1096-1112)", "lbl-s");
})();

/* ─ g79 traffic lights ────────────────────────────────────────────────── */
(function () {
  const s = flat("g79");
  const rows = ["submit()", "wait()", "abort()", "resume()", "open() restart"], cols = ["resumes pump", "admits work", "drains", "settles waiters"];
  const M = {
    "submit()": [2, 2, 2, 0], "wait()": [2, 0, 2, 2], "abort()": [2, 0, 2, 0],
    "resume()": [2, 0, 2, 0], "open() restart": [1, 0, 1, 1],
  };
  cols.forEach((c, j) => s.t(260 + j * 170, 50, c, "lbl", "middle"));
  s.t(24, 26, "filled = does · crossed = never · ? = depends on the state (harness.ts:244-290)", "lbl-s");
  rows.forEach((r, i) => {
    const y = 68 + i * 30;
    s.t(150, y + 5, r, "lbl", "end");
    M[r].forEach((v, j) => {
      const x = 260 + j * 170 + 60;
      if (v === 2) s.c(x, y, 8, "ok-s");
      else if (v === 1) { s.c(x, y, 8, "side"); s.t(x, y + 4, "?", "lbl-s", "middle"); }
      else { s.c(x, y, 8, "ln"); s.p(`M${x - 5} ${y - 5}L${x + 5} ${y + 5}`, "ln2"); }
    });
  });
})();
/* ─ g80 patch panel ───────────────────────────────────────────────────── */
(function () {
  const s = flat("g80");
  s.r(150, 60, 130, 180, "side"); s.t(165, 80, "the patch bay", "lbl");
  [100, 140, 180, 220].forEach((y, i) => { s.c(185, y, 6, "cap"); s.t(205, y + 4, "port " + (i + 1), "lbl-s", "start"); });
  s.box(640, 140, 180, 60, "the session", "one commit at a time", "cap");
  lg(s, [[185, 100], [560, 128]], "plugs in", "ln", 330, 96, "middle");
  lg(s, [[185, 220], [560, 152]], "", "wire");
  s.r(330, 96, 60, 26, "cap cur"); s.t(360, 112, "in flight", "lbl-s", "middle");
  s.t(24, 262 - 16, "connections are explicit and auditable — a half-made connection cannot exist (src/harness/types.ts:90-104)", "lbl-s");
})();

/* ─ g81 plumbing ──────────────────────────────────────────────────────── */
(function () {
  const s = flat("g81");
  const pipe = (x, w) => { s.p(`M${x} 100H${x + w}`, "ln2"); s.p(`M${x} 130H${x + w}`, "ln2"); };
  pipe(80, 160); pipe(320, 160); pipe(560, 160);
  const valve = (x, lbl) => { s.p(`M${x} 88L${x + 20} 138L${x - 20} 138Z`, "cap"); s.t(x, 72, lbl, "lbl-s", "middle"); };
  valve(262, "write"); valve(502, "write"); valve(742, "write");
  s.p("M720 100H860", "ln2"); s.p("M720 130H860", "ln2");
  s.box(880, 115, 140, 50, "the ledger", "", "side");
  s.p("M282 115h24", "ln"); s.arrow([[296, 115], [318, 115]], "ln", 6);
  s.t(460, 172, "a check valve after each write: flow never reverses", "lbl-s", "middle");
  s.t(24, 210, "the session line as one pipe — commits flow one way, under pressure (src/session/session.ts)", "lbl-s");
})();

/* ─ g82 orchestra ─────────────────────────────────────────────────────── */
(function () {
  const s = flat("g82");
  s.box(240, 70, 170, 44, "the conductor", "one direction at a time", "cap");
  s.box(600, 70, 150, 44, "section a", "a worker", "cap");
  s.box(600, 150, 150, 44, "section b", "resting", "side");
  lg(s, [[330, 92], [524, 92]], "", "ln");
  s.p("M740 84C790 74 790 130 740 156", "guide");
  s.r(320, 200, 420, 12, "side"); s.t(320, 188, "the score — the session document, committed", "lbl-s");
  s.t(24, 236, "parts differentiate, but the score synchronizes — sections read the same bar (src/documents.ts:39-51)", "lbl-s");
})();

/* ─ g83 assembly line ─────────────────────────────────────────────────── */
(function () {
  const s = flat("g83");
  s.p("M110 170H850", "ln2"); [180, 400, 620].forEach(x => { s.c(x, 170, 12, "cap"); s.p(`M${x} 146V116`, "ln2"); });
  s.box(180, 96, 130, 34, "station 1", "", "side"); s.box(400, 96, 130, 34, "station 2", "", "side"); s.box(620, 96, 130, 34, "station 3", "", "side");
  s.box(300, 140, 110, 60, "checkpoint", "", "cap cur");
  s.t(180, 60, "model", "lbl-s", "middle"); s.t(400, 60, "cutoff", "lbl-s", "middle"); s.t(620, 60, "the gate", "lbl-s", "middle");
  s.t(24, 208, "the chassis accumulates: each station stamps one more field onto the checkpoint (generation.ts:181-199)", "lbl-s");
})();

/* ─ g84 warehouse ─────────────────────────────────────────────────────── */
(function () {
  const s = flat("g84");
  s.r(80, 50, 800, 150, "side");
  const aisle = (x, lbl) => { s.p(`M${x} 70V180`, "ln2"); s.t(x + 24, 70, lbl, "lbl-s", "start"); };
  aisle(200, "swarm: tasks"); aisle(420, "records: conversations · entries"); aisle(640, "documents");
  for (let k = 0; k < 3; k++) { s.p(`M200 ${86 + k * 32}H396`, "ln2"); s.p(`M420 ${86 + k * 32}H616`, "ln2"); s.p(`M640 ${86 + k * 32}H760`, "ln2"); }
  s.box(320, 128, 110, 44, "the commit", "one crate, whole", "cap cur");
  s.t(24, 232, "aisles are tables, shelves are rows — and the forklift moves whole crates only (schema.ts:5-16)", "lbl-s");
})();

/* ─ g85 postal sorter ─────────────────────────────────────────────────── */
(function () {
  const s = flat("g85");
  s.r(100, 70, 200, 50, "side"); s.t(200, 90, "the intake", "lbl-s", "middle"); s.t(200, 108, "letters in", "lbl-s", "middle");
  s.p("M310 95L430 95", "ln2");
  const bin = (x, lbl, cls, hot) => { s.r(x - 50, 130, 100, 60, cls); s.p(`M${x - 30} 150 ${x + 30} 150`, "ln2"); s.p(`M${x - 30} 150 ${x - 22} 178`, "ln2"); s.p(`M${x - 30} 150 ${x - 38} 178`, "ln2"); s.t(x, 122, lbl, "lbl-s", "middle"); if (hot) s.t(x, 168, "retry ✓", "lbl-g", "middle"); };
  bin(480, "bin by q-2", "cap"); bin(640, "bin by q-5", "side"); bin(800, "bin by q-7", "side");
  lg(s, [[430, 95], [474, 118]], "", "ln"); s.p("M430 95C520 80 580 96 634 118", "guide");
  s.t(620, 90, "the same letter re-files itself", "lbl-s", "middle");
  s.t(24, 218, "sorting by key is idempotency: deterministic routing needs no memory (types.ts:374-375)", "lbl-s");
})();

/* ─ g86 elevator ──────────────────────────────────────────────────────── */
(function () {
  const s = flat("g86");
  s.p("M200 50V220H420", "ln2");
  const fl = ["pending", "running", "waiting", "completing", "terminal"];
  fl.forEach((f, i) => { const y = 56 + i * 34; s.p(`M330 ${y}H200`, "ln2"); s.t(344, y + 4, "f" + (4 - i) + " · " + f, "lbl-s", "start"); });
  s.r(238, 84, 90, 26, "cap cur"); s.t(283, 100, "the cabin", "lbl-s", "middle");
  s.r(560, 84, 240, 30, "guide"); s.t(680, 102, "reopened: the cabin is stored", "lbl-s", "middle");
  s.arrow([[560, 99], [470, 99]], "guide", 5);
  s.t(24, 238, "the building persists; the cabin is state: a restart rebuilds the shaft and resets the cabin (types.ts:505-536)", "lbl-s");
})();

/* ─ g87 scoreboard ────────────────────────────────────────────────────── */
(function () {
  const s = flat("g87");
  s.r(160, 56, 640, 116, "cap");
  s.t(180, 84, "1 · completed — promised, delivered", "lbl");
  s.t(180, 116, "2 · failed — expected domain refusal", "lbl");
  s.t(180, 148, "3–5 · aborted · orphaned · faulted", "lbl");
})();

/* ─ g88 gears ─────────────────────────────────────────────────────────── */
(function () {
  const s = flat("g88");
  const gear = (cx, cy, r, n) => { for (let i = 0; i < n; i++) { const a = i * 2 * Math.PI / n; s.p(`M${(cx + (r + 8) * Math.cos(a)).toFixed(1)} ${(cy + (r + 8) * Math.sin(a)).toFixed(1)}L${(cx + (r + 14) * Math.cos(a)).toFixed(1)} ${(cy + (r + 14) * Math.sin(a)).toFixed(1)}`, "ln"); } s.c(cx, cy, r, "ln"); s.c(cx, cy, 5, "solid"); };
  gear(380, 120, 56, 10); gear(540, 158, 40, 8);
  s.p("M436 150L480 172", "ln");
  s.t(380, 210, "the pump gear", "lbl-s", "middle"); s.t(560, 210, "the drain gear", "lbl-s", "middle");
  ["submit", "wait", "resume", "abort"].forEach((k, i) => {
    const x = 700 + i * 60;
    s.p(`M${x} 96L740 130`, "wire"); s.t(x, 84, k + "()", "lbl-s", "middle");
  });
  s.t(740, 152, "engagement arms", "lbl-s", "middle");
})();

/* ─ g89 punch tape ────────────────────────────────────────────────────── */
(function () {
  const s = flat("g89");
  s.r(80, 80, 800, 60, "side");
  const rows = [["e11", "pi.user"], ["e12", "checkpoint"], ["e13", "partials ×n"], ["e14", "pi.tool ×3"], ["e15", "pi.assistant"]];
  rows.forEach((r, i) => {
    const x = 130 + i * 150;
    s.c(x, 96, 3, "solid"); s.c(x, 110, 3, "solid");
    s.t(x, 128, r[0], "lbl-s", "middle"); s.t(x + 30, 128, r[1], "lbl-s", "start");
  });
  s.arrow([[640, 60], [640, 76]], "ln", 5); s.t(654, 64, "the write head", "lbl-s", "start");
  s.t(24, 186, "you can only add holes: the jsonl adapter is append-only, one writer (src/types.ts:416-443)", "lbl-s");
})();

/* ─ g90–g101: one round, twelve grammars ──────────────────────────────── */
(function () {
  const s = flat("g90");
  s.r(70, 50, 300, 110, "cap"); s.t(86, 72, "the harness", "lbl");
  ["submit", "round", "answer"].forEach((t, i) => s.box(110 + i * 84, 112, 74, 30, t, "", "side"));
  s.box(560, 62, 180, 40, "your host", "", "cut"); s.cyl(760, 120, 140, 90, "side", "cap");
  lg(s, [[254, 105], [550, 82]], "", "ln");
  lg(s, [[254, 112], [700, 130]], "", "ln");
})();
(function () {
  const s = flat("g91");
  const L = [120, 420, 720];
  ["host", "harness", "storage"].forEach((n, i) => { s.box(L[i], 56, 110, 28, n, "", "side"); s.p(`M${L[i]} 70V186`, "ln2"); });
  lg(s, [[120, 100], [420, 100]], "submit", "ln", 270, 88, "middle");
  lg(s, [[420, 140], [720, 140]], "commit", "ln", 570, 128, "middle");
  s.arrow([[720, 176], [120, 176]], "guide", 5); s.t(420, 168, "wait() resolves", "lbl-s", "middle");
})();
(function () {
  const s = flat("g92");
  const L = { host: 80, harness: 130, storage: 180 };
  Object.keys(L).forEach(k => { s.t(24, L[k] + 4, k, "lbl-s"); s.p(`M100 ${L[k]}H920`, "ln2"); });
  ["submit", "prepare", "stream", "settle"].forEach((t, i) => {
    const x = 180 + i * 220, y = [80, 130, 180, 180][i];
    s.box(x, y, 90, 30, t, "", "cap");
  });
  lg(s, [[270, 95], [270, 115]], "", "wire"); lg(s, [[620, 145], [620, 165]], "", "wire");
})();
(function () {
  const s = flat("g93");
  s.p("M120 120C240 60 340 60 460 90", "ln2"); s.p("M120 120C240 170 460 150 580 132", "ln2");
  s.t(240, 66, "thinking (wide)", "lbl-s", "middle"); s.t(360, 166, "tools (narrow)", "lbl-s", "middle");
  s.box(560, 84, 130, 42, "settle", "", "cap"); s.box(690, 106, 130, 42, "answer", "", "side");
  lg(s, [[500, 96], [556, 96]], "", "ln"); lg(s, [[690, 120], [686, 124]], "", "wire");
  s.t(24, 176, "band width = where the wall-clock went", "lbl-s");
})();
(function () {
  const s = flat("g94");
  const rows = [["1", "commit"], ["2", "commit"], ["3", "commit"], ["4", "commit"]];
  rows.forEach((r, i) => { const y = 64 + i * 30; s.t(140, y, r[0], "lbl-s", "end"); s.p(`M152 ${y - 4}H180`, "ln2"); s.t(192, y, r[1] + " " + ["e11", "e12", "partial", "e15"][i], "lbl-s"); });
  s.r(300, 52, 130, 118, "cap"); s.t(365, 106, "the strip", "lbl-s", "middle");
  s.t(300, 188, "one transaction per line", "lbl-s", "start");
})();
(function () {
  const s = flat("g95");
  s.p("M70 110H880", "ln");
  ["submit", "prepare", "tools ⤷", "answer", "settle"].forEach((t, i) => { s.c(100 + i * 196, 110, 7, "cap"); s.t(100 + i * 196, 134, t, i === 2 ? "lbl-s" : "lbl", "middle"); });
  s.p("M492 110L560 170H760", "ln");
  s.c(660, 170, 6, "cap"); s.t(660, 192, "child 15", "lbl-s", "middle");
})();
(function () {
  const s = flat("g96");
  s.box(120, 110, 110, 36, "pending", "", "side");
  s.r(300, 66, 260, 96, "cap"); s.t(316, 88, "running", "lbl");
  s.box(380, 112, 80, 30, "tool", "", "side"); s.box(490, 112, 90, 30, "stream", "", "side");
  s.box(700, 110, 130, 36, "completing", "", "side");
  lg(s, [[176, 110], [296, 110]], "", "ln"); lg(s, [[562, 110], [696, 110]], "answer", "ln", 628, 98, "middle");
  s.t(430, 146, "the abort mark ends it", "lbl-s", "middle");
})();
(function () {
  const s = flat("g97");
  const rows = [["round", 0, 6], ["tool round", 1, 4], ["commit", .8, 6]];
  rows.forEach((r, i) => { const y = 64 + i * 36; s.t(24, y + 4, r[0], "lbl-s"); s.r(140 + r[1] * 60, y - 10, (r[2] - r[1]) * 60, 20, "cap"); });
  s.p("M140 40H620", "ln2"); [0, 3, 6].forEach(t => s.t(140 + t * 60, 32, "t" + t, "lbl-s", "middle"));
  lg(s, [[420, 74], [420, 90]], "", "ln"); lg(s, [[360, 110], [360, 126]], "", "ln");
})();
(function () {
  const s = flat("g98");
  [40, 260, 480, 700].forEach((x, i) => {
    s.r(x, 40, 200, 120, "cap");
    s.t(x + 10, 180, ["input lands", "checkpoint", "killed", "resumed ✓"][i], "lbl-s");
    if (i === 2) s.xmark(x + 100, 100, 9);
  });
  lg(s, [[138, 96], [180, 116]], "", "ln"); lg(s, [[580, 100], [620, 116]], "", "ln");
})();
(function () {
  const s = flat("g99");
  s.c(80, 110, 14, "cap"); s.c(80, 110, 7, "ln");
  s.r(140, 92, 120, 36, "cap"); s.t(200, 110, "run", "lbl", "middle");
  s.p("M380 96L420 110L380 124L340 110Z", "cap"); s.t(380, 114, "tools?", "lbl-s", "middle");
  s.r(470, 92, 110, 36, "cap"); s.t(525, 110, "tool x n", "lbl", "middle");
  s.r(500, 160, 110, 32, "side"); s.t(555, 176, "loop back", "lbl-s", "middle");
  s.c(700, 110, 14, "cap"); s.c(700, 110, 7, "bad-l");
  lg(s, [[430, 110], [466, 110]], "", "ln"); lg(s, [[582, 110], [684, 110]], "answer", "ln", 634, 98, "middle");
})();
(function () {
  const s = flat("g100");
  [[420, "submit()"], [380, "drain"], [340, "prepare"], [300, "stream"], [460, "settled ✓"]].forEach((f, i) => {
    const y = 180 - i * 34;
    s.r(280, y - 30, 300, 30, i === 4 ? "ok-f" : "side"); s.t(294, y - 10, f[1], "lbl");
  });
  s.p("M280 182H584", "ln2");
})();
(function () {
  const s = flat("g101");
  const cols = ["sub", "run", "park", "set"], rows = ["sub", "run", "park", "set"];
  const x0 = 150, y0 = 60, cw = 150, rh = 34;
  cols.forEach((c, j) => s.t(x0 + j * cw + cw / 2, 48, c, "lbl", "middle"));
  rows.forEach((r, i) => {
    s.t(x0 - 12, y0 + i * rh + 21, r, "lbl", "end");
    for (let j = 0; j < 4; j++) {
      s.r(x0 + j * cw, y0 + i * rh, cw - 2, rh - 2, "guide");
      if (i === 1 && j === 2) s.r(x0 + j * cw + 6, y0 + i * rh + 6, cw - 14, rh - 14, "cap");
    }
  });
})();
