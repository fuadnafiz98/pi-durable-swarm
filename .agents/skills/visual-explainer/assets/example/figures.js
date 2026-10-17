/* FIG map: the pipeline, hover for notes; a token runs the arrows while visible */
INFO.map = {
  "page folder": ["What you write. <code>page.json</code> holds the title and dek, <code>body.html</code> the sections, <code>figures.js</code> the drawings. <code>code.json</code> is read only for a code build.", "page.json · body.html · figures.js · code.json"],
  "build.py": ["Standard-library Python. Expands figure placeholders, numbers them, builds the contents list, inlines the fonts, and with --code embeds the source lines each pane shows.", "python3 scripts/build.py PAGE_DIR [--code]"],
  "page.html": ["One file with everything inside, fonts included: no outside request. Works as an artifact or opened from disk.", ""],
  "check.mjs": ["Playwright opens the page at desktop and phone width and clicks every step, option and event.", "node scripts/check.mjs page.html shots/"],
  "screenshots": ["One PNG per figure state, and report.json with page errors, sideways scroll, clipped and overlapping labels.", ""],
  "publish": ["An artifact when the Artifact tool is there; otherwise the HTML file itself.", ""]
};
(function () {
  const s = flat("map");
  const legs = [[[195, 140], [258, 140]], [[400, 140], [453, 140]], [[605, 140], [648, 140]], [[790, 140], [823, 140]]];
  function draw(t) {
    s.clear();
    s.r(25, 75, 170, 130, "cap"); s.t(37, 96, "page folder", "lbl");
    ["page.json", "body.html", "figures.js"].forEach((n, i) => s.t(37, 122 + i * 18, n, "lbl-s"));
    s.t(37, 176, "code.json · optional", "lbl-s", "start", { opacity: ".6" }); s.hit(25, 75, 170, 130, "page folder");
    s.box(330, 140, 140, 50, "build.py", "stdlib Python", "cap", "build.py");
    s.box(530, 140, 150, 50, "page.html", "one file", "ok-f", "page.html");
    s.box(720, 140, 140, 50, "check.mjs", "Playwright", "cap", "check.mjs");
    s.box(880, 140, 110, 50, "publish", "link or file", "cap", "publish");
    s.box(720, 250, 170, 40, "screenshots", "+ report.json", "side", "screenshots");
    legs.forEach(l => s.arrow(l, "ln", 5));
    s.arrow([[720, 165], [720, 228]], "ln", 5);
    s.t(806, 106, "0 errors", "lbl-g", "middle");
    s.arrow([[635, 250], [110, 250], [110, 207]], "wire", 5); s.t(372, 268, "fix the folder, build again", "lbl-s", "middle");
    if (t != null) { const k = (t * .9) % legs.length; s.token(legs[Math.floor(k)], k % 1) }
  }
  draw(null); loop("map", (dt, t) => draw(t));
})();

/* FIG flow: seven stages in a row; the token runs into the current one */
(function () {
  const s = flat("flow"), X = i => 75 + i * 135, Y = 110;
  const N = ["read", "outline", "design", "draw", "build", "check", "publish"];
  const OUT = ["facts, file:line", "question headings", "one sketch each", "figures.js", "page.html", "0 errors", "a link"];
  const S = [
    { cap: "<b>Read.</b> Read the code, the diff or the PR until you can state each fact with a file and a line. Every claim on the page is checked against the code, not memory." },
    { cap: "<b>Outline.</b> One question per section, in reading order: big picture, workflows, structure, state, time, call stacks. Code only if the reader asked for it." },
    { cap: "<b>Design.</b> For each figure decide what the picture is about: the parts this project really has, where its boundaries are, what changes from step to step. Sketch it first." },
    { cap: "<b>Draw.</b> Write <code>figures.js</code> with the kit's primitives. Each step's picture is computed from scratch, so prev and next always agree." },
    { cap: "<b>Build.</b> <code>build.py</code> numbers the figures, builds the contents list, inlines the fonts and, with <code>--code</code>, embeds the lines the panes show.", code: ["build", ["build.main"]] },
    { cap: "<b>Check.</b> <code>check.mjs</code> clicks every step at desktop and phone width. Then read every screenshot yourself: overlaps, clipping, a fact that is wrong." },
    { cap: "<b>Publish.</b> As an artifact when the tool is there, otherwise hand over the HTML file." }
  ];
  let cur = 0;
  function draw(t) {
    s.clear();
    N.forEach((n, i) => {
      s.box(X(i), Y, 112, 46, n, "", i === cur ? "ok-f cur" : "cap");
      s.t(X(i), Y + 46, OUT[i], i <= cur ? "lbl" : "lbl-s", "middle");
      if (i < cur) s.check(X(i) + 44, Y - 34, 5);
      if (i < N.length - 1) s.arrow([[X(i) + 56, Y], [X(i + 1) - 56, Y]], i < cur ? "ln" : "wire", 5);
    });
    s.t(X(0) - 56, 40, "reading order of the work", "lbl-s");
    if (t != null && cur > 0) s.token([[X(cur - 1) + 56, Y], [X(cur) - 56, Y]], (t * 1.2) % 1);
  }
  steps("flow", S, i => { cur = i; draw(null) });
  loop("flow", (dt, t) => draw(t));
})();

/* FIG layers: an isometric stack; the code layer exists only in a code build */
(function () {
  const s = flat("layers");
  const L = [["style.css + fonts", "tokens, light and dark"], ["kit.js", "primitives, controls, one loop"], ["figures.js", "this page's drawings"],
    ["body.html", "sections, prose, tables"], ["code panes", "only with --code"]];
  function draw(k) {
    s.clear();
    const I = s.iso({ ox: 300, oy: 218 }), W = 200, D = 150, H = 20, GAP = 42;
    L.forEach(([name, sub], i) => {
      const z = i * GAP, ghost = i === 4 && k !== "code";
      if (ghost) I.face([[0, 0, z + H], [W, 0, z + H], [W, D, z + H], [0, D, z + H]], "guide");
      else I.box(0, 0, z, W, D, H, { top: i === 4 ? "ok-f" : "cap", label: null });
      const [px] = I.P(W, D / 2, z + H / 2);
      I.label(W, D / 2, z + H / 2, ghost ? name + " · absent" : name, { dx: 560 - px, dy: -4, sub, cls: ghost ? "lbl-s" : "lbl" });
    });
  }
  choose("layers", [
    { k: "default", label: "default page", cap: "<b>The default page</b> has four layers and no code: the reader sees pictures and captions. Most readers want this." },
    { k: "code", label: "with --code", cap: "<b>With <code>--code</code></b> every interactive figure gets a source pane that follows its steps. On wide screens the figure becomes two columns: drawing left, code right.", code: ["build", ["build.bundle"]] }
  ], draw, "build");
})();

/* FIG state: the play() control as a state machine */
(function () {
  const s = flat("state");
  const N = { playing: [180, 150], dwelling: [480, 60], paused: [480, 240], ended: [790, 150] };
  const E = [
    ["playing", "dwelling", [[255, 132], [405, 54]], "reached an event", [322, 84, "end"]],
    ["dwelling", "playing", [[405, 72], [255, 150]], "dwell over · 2.6 s", [340, 124, "start"]],
    ["playing", "paused", [[255, 160], [405, 234]], "pause · prev · next", [338, 186, "start"]],
    ["paused", "playing", [[405, 252], [255, 170]], "play", [300, 240, "end"]],
    ["playing", "ended", [[180, 128], [180, 24], [790, 24], [790, 128]], "the clock reaches the end", [620, 17, "middle"]],
    ["ended", "playing", [[790, 172], [790, 286], [180, 286], [180, 172]], "replay", [640, 280, "middle"]]
  ];
  function draw(k) {
    s.clear();
    E.forEach(([a, , pts, label, [lx, ly, an]]) => { s.arrow(pts, a === k ? "ln" : "wire", 5); s.t(lx, ly, label, a === k ? "lbl" : "lbl-s", an) });
    for (const n in N) s.box(N[n][0], N[n][1], 150, 44, n, "", n === k ? "ok-f cur" : "cap");
  }
  choose("state", [
    { k: "playing", label: "playing", cap: "<b>playing.</b> Each frame moves the clock by dt × speed (16 s of figure time per real second). Crossing an event snaps the clock onto it.", code: ["kit", ["kit.anim"]] },
    { k: "dwelling", label: "dwelling", cap: "<b>dwelling.</b> The clock waits 2.6 s on the event so its caption can be read, then plays on.", code: ["kit", ["kit.anim"]] },
    { k: "paused", label: "paused", cap: "<b>paused.</b> Pause, or a jump with ◀ event or event ▶, stops the clock. Play resumes from where it stands.", code: ["kit", ["kit.jump"]] },
    { k: "ended", label: "ended", cap: "<b>ended.</b> The clock stops at the scenario's end and the button reads replay. Under reduced motion there is no clock: the button steps one event at a time.", code: ["kit", ["kit.play"]] }
  ], draw, "state");
})();

/* FIG round: one build-and-check round on a clock, three scenarios */
(function () {
  const s = flat("round"), X = t => 130 + t * 13, Y = { build: 70, check: 120, you: 170 }, AX = 215;
  const SC = {
    clean: { label: "clean", end: 60,
      acts: [["build", 0, 2, "build", "ok"], ["check", 3, 25, "check · every state, two widths", "cap"], ["you", 25, 30, "read shots", "cap"]],
      marks: [["check", 25, "ok", "0 errors"], ["you", 30, "ok", "publish"]],
      events: [{ t: 0, cap: "<b>Build.</b> Figures numbered, fonts inlined: one file.", code: ["build", ["build.main"]] }, { t: 3, cap: "<b>Check.</b> Every step of every figure, at 1440 and 390 px wide." },
        { t: 25, cap: "<b>0 errors.</b> The script found nothing; now read every screenshot yourself. The script cannot see a wrong fact or an arrow that points at the wrong box." },
        { t: 30, cap: "<b>Publish.</b>" }] },
    anchor: { label: "missing anchor", end: 60,
      acts: [["build", 0, 1, "build", "bad"], ["you", 1, 10, "fix code.json", "cap"], ["build", 10, 12, "build", "ok"], ["check", 13, 35, "check", "cap"]],
      marks: [["build", 1, "bad", "anchor not found"], ["check", 35, "ok", "0 errors"], ["you", 40, "ok", "publish"]],
      events: [{ t: 1, cap: "<b>The build stops.</b> A code anchor in <code>code.json</code> no longer matches the source: the code moved. Better than a pane that highlights the wrong lines.", code: ["build", ["build.at"]] },
        { t: 10, cap: "<b>Fix the anchor</b> to the code as it is now, and build again." }, { t: 35, cap: "<b>Clean.</b>" }, { t: 40, cap: "<b>Publish.</b>" }] },
    clipped: { label: "clipped label", end: 60,
      acts: [["build", 0, 2, "build", "ok"], ["check", 3, 25, "check", "bad"], ["you", 25, 32, "move label", "cap"], ["build", 32, 34, "", "ok"], ["check", 35, 55, "check", "cap"]],
      marks: [["check", 25, "bad", "text outside viewBox"], ["check", 55, "ok", "0 errors"], ["you", 58, "ok", "publish"]],
      events: [{ t: 25, cap: "<b>Check fails:</b> a label runs past the right edge of its figure at one step. The screenshot shows which." },
        { t: 32, cap: "<b>Move the label</b> (anchor it to the end, or inside), build, check again." }, { t: 55, cap: "<b>Clean.</b>" }, { t: 58, cap: "<b>Publish.</b>" }] }
  };
  function draw(T, sc) {
    s.clear();
    for (const k in Y) { s.t(24, Y[k] + 4, k === "you" ? "you" : k === "build" ? "build.py" : "check.mjs", "lbl"); s.p(`M${X(0)} ${Y[k]}H${X(60)}`, "ln2") }
    s.p(`M${X(0)} ${AX}H${X(60)}`, "ln"); for (let t = 0; t <= 60; t += 10) { s.p(`M${X(t)} ${AX - 4}V${AX + 4}`, "ln"); s.t(X(t), AX + 16, t + " s", "lbl-s", "middle") }
    sc.acts.forEach(([lane, a, b, label, tone]) => {
      if (T < a) return; const e = Math.min(T, b), y = Y[lane];
      s.r(X(a), y - 9, Math.max(2, X(e) - X(a)), 18, tone === "ok" ? "ok-f" : tone === "bad" && T >= b ? "bad-f" : "cap");
      if (label && X(e) - X(a) > label.length * 6.2 + 10) s.t(X(a) + 6, y + 4, label, "lbl-s");
    });
    sc.marks.forEach(([lane, t, kind, label]) => {
      if (T < t) return; const y = Y[lane];
      kind === "bad" ? s.xmark(X(t), y - 20, 5) : s.check(X(t), y - 20, 5);
      s.t(X(t) + 9, y - 16, label, kind === "bad" ? "lbl-b" : "lbl-g");
    });
    s.p(`M${X(T)} 40V${AX}`, "guide"); s.t(X(T), 32, `t = ${Math.round(T)} s`, "lbl", "middle");
  }
  play("round", SC, draw, { speed: 8, label: "round" });
})();

/* FIG calls: the call stack of build.py --code */
(function () {
  const s = flat("calls"), BASE = 276, FH = 40, GAP = 8;
  const S = [
    { st: ["main"], ret: "", note: "parse arguments, read page.json", cap: "<b>main()</b> reads the arguments and <code>page.json</code>.", code: ["build", ["build.main"]] },
    { st: ["main", "expand"], ret: "", note: "find figure placeholders in body.html", cap: "<b>expand()</b> walks <code>body.html</code> for figure placeholders.", code: ["build", ["build.expand"]] },
    { st: ["main", "expand", "figure_html"], ret: "<figure class=\"split\">…", note: "one placeholder → full figure markup", cap: "<b>figure_html()</b> turns one placeholder into the figure, its controls and, in a code build, its pane.", code: ["build", ["build.fig"]] },
    { st: ["main", "expand"], popped: "figure_html", ret: "body with FIG_01 … FIG_06", note: "numbers, {{fig:id}}, contents list", cap: "<b>Back in expand()</b>: every figure numbered, <code>{{fig:id}}</code> references filled in, contents list built.", code: ["build", ["build.expand"]] },
    { st: ["main", "code_bundle"], popped: "expand", ret: "", note: "read code.json and every file it names", cap: "<b>code_bundle()</b> runs only with <code>--code</code>: it reads each file <code>code.json</code> names.", code: ["build", ["build.bundle"]] },
    { st: ["main", "code_bundle", "at"], ret: "[first line, last line]", note: "a snippet must match exactly once", cap: "<b>at()</b> finds a line range by a snippet that must match exactly once. Zero or two matches stop the build: the pane can never point at the wrong lines.", code: ["build", ["build.at"]] },
    { st: ["main", "code_bundle"], popped: "at", ret: "{files, ranges}", note: "excerpts and line ranges", cap: "<b>Back in code_bundle()</b> with every range resolved.", code: ["build", ["build.bundle"]] },
    { st: ["main"], popped: "code_bundle", ret: "page.code.html written", note: "shell + style + kit + figures", cap: "<b>main()</b> fills the shell and writes the page.", code: ["build", ["build.main"]] }
  ];
  steps("calls", S, (i, st) => {
    s.clear();
    s.t(60, 30, "call stack · top is running", "lbl-s");
    st.st.forEach((fn, j) => { const y = BASE - j * (FH + GAP); s.box(250, y, 380, FH, fn + "()", j === 0 ? "build.py" : "", j === st.st.length - 1 ? "ok-f cur" : "cap") });
    if (st.popped) { const y = BASE - st.st.length * (FH + GAP); s.r(60, y - FH / 2, 380, FH, "guide"); s.t(250, y + 4, st.popped + "() returned", "lbl-s", "middle") }
    s.t(520, 100, "now running", "lbl-s"); s.t(520, 122, st.st[st.st.length - 1] + "()", "lbl");
    s.t(520, 146, st.note, "lbl-s");
    if (st.ret) { s.t(520, 196, "returned", "lbl-s"); s.t(520, 218, st.ret, "lbl-g") }
  });
})();

/* FIG where: an isometric deployment; each step lights one place and runs a token along the hop */
(function () {
  const s = flat("where");
  const B = { folder: [20, 25], build: [115, 25], check: [210, 25], host: [355, 25], browser: [460, 25] }, BW = 60, BH = 30, Z = 8;
  const top = k => [B[k][0] + BW / 2, B[k][1] + BW / 2, Z + BH];
  // hops run along the floor in front of the boxes, so they never cross a box face or its label
  const hop = (a, b) => { const ya = B[a][1] + BW, yb = B[b][1] + BW, ax = B[a][0] + BW / 2, bx = B[b][0] + BW / 2; return [[ax, ya, Z], [ax, ya + 15, Z], [bx, yb + 15, Z], [bx, yb, Z]] };
  const S = [
    { on: "folder", cap: "<b>Write the folder</b> on your machine: words, drawings, and <code>code.json</code> only for a code build." },
    { on: "build", path: hop("folder", "build"), cap: "<b>Build.</b> <code>build.py</code> reads the folder and writes one HTML file. Python's standard library only." },
    { on: "check", path: hop("build", "check"), cap: "<b>Check.</b> A headless Chromium (Playwright) opens the page at two widths and screenshots every state." },
    { on: "host", path: hop("build", "host"), cap: "<b>Publish.</b> The one file goes to the artifact host. Nothing else travels: fonts and code excerpts are inside it." },
    { on: "browser", path: hop("host", "browser"), cap: "<b>Read.</b> The reader's browser runs the page. It makes no outside request: fonts, drawings and code are all inside the file." }
  ];
  let cur = 0;
  function draw(t) {
    s.clear();
    const I = s.iso({ ox: 250, oy: 40 }), st = S[cur];
    I.slab(0, 0, 0, 300, 110, { h: Z, top: "side" });
    I.slab(335, 0, 0, 100, 110, { h: Z, top: "side" });
    I.slab(445, 0, 0, 100, 110, { h: Z, top: "side" });
    for (const k in B) I.box(B[k][0], B[k][1], Z, BW, BW, BH, { top: k === st.on ? "ok-f" : "cap", label: k });
    S.forEach((x, i) => { if (x.path && i <= cur) I.arrow(x.path, i === cur ? "ln" : "wire", 5) });
    I.label(0, 110, Z / 2, "your machine", { dx: -20, dy: 40, sub: "build.py · check.mjs", anchor: "end" });
    I.label(385, 110, Z / 2, "artifact host", { dx: -10, dy: 46, sub: "stores the page", anchor: "end" });
    I.label(545, 55, Z / 2, "reader's browser", { dx: 90, dy: 10, sub: "runs it" });
    if (st.path && t != null) I.token(st.path, (t * .8) % 1);
  }
  steps("where", S, i => { cur = i; draw(null) });
  loop("where", (dt, t) => draw(t));
})();
