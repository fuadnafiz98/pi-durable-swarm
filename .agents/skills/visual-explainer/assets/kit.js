/* visual-explainer kit. build.py wraps this file, the page's figures.js and start() in one function scope,
   so every name below is a plain local inside figures.js. Primitives only: each diagram is composed for its page. */
const NS = "http://www.w3.org/2000/svg";
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = id => document.getElementById(id);
const f = n => (+n).toFixed(1);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const pad2 = n => String(n).padStart(2, "0");
function el(t, a, p) { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e }
function pp(pts, close = true) { return "M" + pts.map(p => f(p[0]) + " " + f(p[1])).join("L") + (close ? "Z" : "") }
function arrowHead(x, y, ang, sz = 6) { const a1 = ang + 2.6, a2 = ang - 2.6; return `M${f(x + sz * Math.cos(a1))} ${f(y + sz * Math.sin(a1))}L${f(x)} ${f(y)}L${f(x + sz * Math.cos(a2))} ${f(y + sz * Math.sin(a2))}` }
function polyLen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L }
function polyCut(pts, d) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (d <= l) { const k = l ? d / l : 0; out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]); return out }
    d -= l; out.push(b)
  }
  return out
}
// The point a fraction k (0..1) along a polyline: for tokens travelling an arrow.
const along = (pts, k) => polyCut(pts, polyLen(pts) * clamp(k, 0, 1)).pop();
function isCaps(s) { s = String(s); return /\p{L}/u.test(s) && s === s.toUpperCase() }

/* ---------- hover notes ---------- */
const INFO = {};
const Tip = {
  el: null, cur: null,
  show(fig, label, x, y) {
    if (!this.el) { this.el = document.createElement("div"); this.el.className = "tip"; this.el.setAttribute("role", "tooltip"); document.body.appendChild(this.el) }
    const d = (INFO[fig] || {})[label]; if (!d) { this.hide(); return }
    if (this.cur !== fig + label) {
      this.cur = fig + label; this.el.textContent = "";
      const tt = document.createElement("div"); tt.className = "tt"; tt.textContent = label;
      const p = document.createElement("p"); p.innerHTML = d[0];
      this.el.append(tt, p);
      if (d[1]) { const sp = document.createElement("div"); sp.className = "spec"; sp.textContent = d[1]; this.el.appendChild(sp) }
    }
    const w = this.el.offsetWidth || 280, h = this.el.offsetHeight || 120;
    if (x + w > innerWidth - 8) x = Math.max(8, x - w - 28); if (y + h > innerHeight - 8) y = Math.max(8, y - h - 32);
    this.el.style.left = x + "px"; this.el.style.top = y + "px"; this.el.classList.add("show")
  },
  hide() { if (this.el) { this.el.classList.remove("show"); this.cur = null } }
};
addEventListener("scroll", () => Tip.hide(), { passive: true });
function hoverable(svg) {
  svg.addEventListener("pointermove", e => {
    const h = e.target.closest && e.target.closest("[data-tip]");
    if (h) Tip.show(svg.dataset.fig, h.getAttribute("data-tip"), e.clientX + 14, e.clientY + 16); else Tip.hide()
  });
  svg.addEventListener("pointerleave", () => Tip.hide())
}

/* ---------- flat canvas ---------- */
// Coordinates are viewBox units (960 wide). Every method draws into the figure's own <g>; clear() empties it.
function flat(id) {
  const svg = $(id), g = el("g", {}, svg), vb = svg.viewBox.baseVal;
  const api = {
    svg, g, w: vb.width, h: vb.height,
    clear() { g.textContent = "" },
    p(d, cls, extra) { const e = el("path", { d, class: cls }, g); if (extra) for (const k in extra) e.setAttribute(k, extra[k]); return e },
    t(x, y, txt, cls = "lbl", anchor = "start", extra) {
      const e = el("text", { x: f(x), y: f(y), class: cls + " halo" + (isCaps(txt) ? " caps" : ""), "text-anchor": anchor }, g);
      if (extra) for (const k in extra) e.setAttribute(k, extra[k]); e.textContent = txt; return e
    },
    c(x, y, r, cls, extra) { const e = el("circle", { cx: f(x), cy: f(y), r: f(r), class: cls }, g); if (extra) for (const k in extra) e.setAttribute(k, extra[k]); return e },
    r(x, y, w, h, cls, extra) { return api.p(`M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`, cls, extra) },
    hit(x, y, w, h, label) { return el("rect", { x: f(x), y: f(y), width: f(w), height: f(h), class: "hit", "data-tip": label }, g) },
    arrow(pts, cls = "ln", sz = 6, extra) {
      const e = api.p(pp(pts, false), cls, extra), a = pts[pts.length - 1], b = pts[pts.length - 2];
      const h = api.p(arrowHead(a[0], a[1], Math.atan2(a[1] - b[1], a[0] - b[0]), sz), cls); if (extra && extra.opacity) h.setAttribute("opacity", extra.opacity); return e
    },
    // A box centred on (x, y) with a title and an optional second line; tip names its INFO entry.
    box(x, y, w, h, a, b, cls = "cap", tip) { api.r(x - w / 2, y - h / 2, w, h, cls); api.t(x, b ? y - 2 : y + 4, a, "lbl", "middle"); if (b) api.t(x, y + 12, b, "lbl-s", "middle"); if (tip) api.hit(x - w / 2, y - h / 2, w, h, tip) },
    cyl(cx, y, w, h, cls = "side", top = "cap") {
      const x = cx - w / 2, rx = w / 2, ry = 7;
      api.p(`M${x} ${y}V${y + h}A${rx} ${ry} 0 0 0 ${x + w} ${y + h}V${y}`, cls); api.p(`M${x} ${y}A${rx} ${ry} 0 0 0 ${x + w} ${y}A${rx} ${ry} 0 0 0 ${x} ${y}Z`, top)
    },
    xmark(x, y, s = 7, cls = "bad-l") { api.p(`M${f(x - s)} ${f(y - s)}L${f(x + s)} ${f(y + s)}M${f(x + s)} ${f(y - s)}L${f(x - s)} ${f(y + s)}`, cls, { "stroke-width": "2" }) },
    check(x, y, s = 7, cls = "ok-l") { api.p(`M${f(x - s)} ${f(y)}L${f(x - s / 3)} ${f(y + s * .7)}L${f(x + s)} ${f(y - s * .8)}`, cls, { "stroke-width": "2" }) },
    // A small square riding a polyline: k in 0..1. Use inside loop() for motion along the active path.
    token(pts, k, cls = "solid", size = 7) { const q = along(pts, k); return api.r(q[0] - size / 2, q[1] - size / 2, size, size, cls) },
    iso(opts) { return isoOf(api, opts) }
  };
  svg.dataset.fig = id; hoverable(svg); return api
}

/* ---------- isometric projection over a flat canvas ---------- */
// World axes: x runs down-right, y runs down-left, z runs up. (ox, oy) is where world (0,0,0) lands; u = px per world unit.
// Painter's order is yours: draw far things first (smaller x + y), then nearer; lower z before higher.
function isoOf(api, { ox = 480, oy = 80, u = 1, angle = 30 } = {}) {
  const c = Math.cos(angle * Math.PI / 180), s = Math.sin(angle * Math.PI / 180);
  const P = (x, y, z = 0) => [ox + (x - y) * c * u, oy + (x + y) * s * u - z * u];
  const face = (pts, cls, extra) => api.p(pp(pts.map(p => P(...p))), cls, extra);
  const I = {
    P,
    face,
    // A cuboid at (x, y, z) sized w (along x) × d (along y) × h (up). Faces: top, front-left (+y), front-right (+x).
    box(x, y, z, w, d, h, { top = "cap", left = "side", right = "dk", label, sub, tip, onTop = true } = {}) {
      face([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]], left);
      face([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]], right);
      face([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]], top);
      const [cx, cy] = P(x + w / 2, y + d / 2, z + h);
      if (label && onTop) { api.t(cx, sub ? cy - 2 : cy + 4, label, "lbl", "middle"); if (sub) api.t(cx, cy + 12, sub, "lbl-s", "middle") }
      if (tip) { const pts = [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z), P(x, y + d, z)]; const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); api.hit(Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), tip) }
      return { top: [x + w / 2, y + d / 2, z + h], x, y, z, w, d, h }
    },
    slab(x, y, z, w, d, opt = {}) { return I.box(x, y, z, w, d, opt.h ?? 6, opt) },
    // Layers bottom-up on one footprint: [{h, label, sub, top, left, right, tip}]. Returns each layer's box.
    stack(x, y, z, w, d, layers, gap = 10) { let zz = z; return layers.map(L => { const b = I.box(x, y, zz, w, d, L.h ?? 24, L); zz += (L.h ?? 24) + gap; return b }) },
    // Ground-plane grid, drawn first.
    grid(x, y, w, d, step = 40, cls = "ln2") { for (let i = 0; i <= w; i += step) api.p(pp([P(x + i, y), P(x + i, y + d)], false), cls); for (let j = 0; j <= d; j += step) api.p(pp([P(x, y + j), P(x + w, y + j)], false), cls) },
    // A 3-D polyline with an arrow head, e.g. from one box top to another: [[x,y,z], ...].
    arrow(pts3, cls = "ln", sz = 6, extra) { return api.arrow(pts3.map(p => P(...p)), cls, sz, extra) },
    line(pts3, cls = "ln", extra) { return api.p(pp(pts3.map(p => P(...p)), false), cls, extra) },
    // Upright text with a leader from a world point: labels stay readable instead of skewed onto faces.
    label(x, y, z, text, { dx = 40, dy = -26, sub, cls = "lbl", anchor } = {}) {
      const [px, py] = P(x, y, z), tx = px + dx, ty = py + dy;
      api.p(pp([[px, py], [tx, ty + (dy < 0 ? 4 : -10)]], false), "wire"); api.c(px, py, 2, "solid");
      const an = anchor || (dx < 0 ? "end" : "start");
      api.t(tx, ty, text, cls, an); if (sub) api.t(tx, ty + 14, sub, "lbl-s", an)
    },
    token(pts3, k, cls = "solid", size = 7) { return api.token(pts3.map(p => P(...p)), k, cls, size) }
  };
  return I
}

/* ---------- controls ---------- */
function pressed(group, pred) { [...group.querySelectorAll("button")].forEach(b => b.setAttribute("aria-pressed", String(pred(b)))) }
function chips(id, items, onPick, label) {
  const box = $(id); box.textContent = "";
  if (label) { const s = document.createElement("span"); s.className = isCaps(label) ? "lab caps" : "lab"; s.textContent = label; box.appendChild(s) }
  items.forEach(it => { const b = document.createElement("button"); b.type = "button"; b.textContent = it.label; b.dataset.k = it.k; b.addEventListener("click", () => onPick(it.k)); box.appendChild(b) });
  return box
}
const caption = (id, html) => { const c = $(id + "Cap"); if (c) c.innerHTML = html || "" };

/* ---------- code panes (only present when the page is built with --code) ---------- */
const CODE = (typeof __CODE__ !== "undefined") ? __CODE__ : { files: {}, ranges: {} };
function pane(id) {
  const box = $(id + "Code"); let cur = null;
  if (!box) return { show() {} };
  return {
    show(ref) {
      if (!ref) return;
      const [key, names] = ref, s = CODE.files[key]; if (!s) return;
      if (cur !== key) {
        cur = key; box.textContent = "";
        const h = document.createElement("div"); h.className = "ch"; h.textContent = s.path; box.appendChild(h);
        s.lines.forEach((ln, i) => { const d = document.createElement("span"); d.className = "l"; const n = document.createElement("i"); n.textContent = String(s.start + i); d.append(n, document.createTextNode(ln || " ")); box.appendChild(d) })
      }
      const ranges = names.map(n => CODE.ranges[n]).filter(Boolean); let first = null;
      box.querySelectorAll(".l").forEach((d, i) => { const no = s.start + i, on = ranges.some(([a, b]) => no >= a && no <= b); d.classList.toggle("on", on); if (on && !first) first = d });
      box._first = first; scrollPane(box)
    }
  }
}
function scrollPane(box) { if (box._first && box.offsetParent) box.scrollTop = Math.max(0, box._first.offsetTop - box.querySelector(".ch").offsetHeight - 14) }

/* ---------- figure behaviours ---------- */
// steps: prev/next through S = [{cap, code:[fileKey, [rangeNames]], ...anything draw needs}]; draw(i, step).
function steps(id, S, draw) {
  const code = pane(id), prev = $(id + "Prev"), next = $(id + "Next"), lab = $(id + "Step"); let i = 0;
  function go(k) { i = k; prev.disabled = i === 0; next.disabled = i === S.length - 1; lab.textContent = "step " + pad2(i + 1) + " of " + pad2(S.length); draw(i, S[i]); caption(id, S[i].cap); code.show(S[i].code) }
  prev.addEventListener("click", () => { if (i > 0) go(i - 1) }); next.addEventListener("click", () => { if (i < S.length - 1) go(i + 1) });
  go(0); return { go, get i() { return i } }
}
// choose: one of several states or variants, O = [{k, label, cap, code}]; draw(k, option).
function choose(id, O, draw, label = "show") {
  const code = pane(id); let cur = O[0].k;
  const b = chips(id + "Act", O, k => pick(k), label);
  function pick(k) { cur = k; const o = O.find(x => x.k === k); pressed(b, x => x.dataset.k === k); draw(k, o); caption(id, o.cap); code.show(o.code) }
  pick(cur); return { pick, get k() { return cur } }
}
// play: a clock per scenario that pauses on each event. SC = {key: {label, end, events: [{t, cap, code}]}};
// draw(T, scenario, key) redraws the whole picture for time T (derive state from T; never accumulate).
function play(id, SC, draw, { speed = 16, dwell = 2.6, label = "scenario", unit = "s" } = {}) {
  const code = pane(id), keys = Object.keys(SC); let key = keys[0], sc = SC[key], T = 0, playing = !reduce, hold = dwell, shown = -1;
  const btn = { play: $(id + "Play"), prev: $(id + "Prev"), next: $(id + "Next"), lab: $(id + "Step") };
  function render() {
    draw(T, sc, key);
    let ei = -1; sc.events.forEach((e, i) => { if (e.t <= T + 1e-6) ei = i });
    if (ei !== shown) { shown = ei; const e = sc.events[Math.max(0, ei)]; caption(id, e.cap); code.show(e.code) }
    btn.lab.textContent = `${unit === "s" ? "t = " + Math.round(T) + " s · " : ""}event ${pad2(Math.max(1, ei + 1))} of ${pad2(sc.events.length)}`;
    btn.prev.disabled = T <= 0; btn.next.disabled = T >= sc.end;
    btn.play.textContent = reduce ? "next" : playing ? "pause" : T >= sc.end ? "replay" : "play"
  }
  const jump = t => { T = t; playing = false; hold = 0; render() };
  const nextEv = () => { const n = sc.events.find(e => e.t > T + 1e-6); jump(n ? n.t : sc.end) };
  btn.next.addEventListener("click", nextEv);
  btn.prev.addEventListener("click", () => { const p = [...sc.events].reverse().find(e => e.t < T - 1e-6); jump(p ? p.t : 0) });
  btn.play.addEventListener("click", () => {
    if (reduce) { T >= sc.end ? jump(0) : nextEv(); return }
    if (T >= sc.end) { T = 0; shown = -1; hold = dwell; playing = true } else playing = !playing; render()
  });
  if (keys.length > 1) {
    const b = chips(id + "Act", keys.map(k => ({ k, label: SC[k].label })), k => { key = k; sc = SC[k]; T = 0; shown = -1; hold = dwell; playing = !reduce; pressed(b, x => x.dataset.k === k); render() }, label);
    pressed(b, x => x.dataset.k === key)
  } else { const a = $(id + "Act"); if (a) a.remove() }
  ANIM[id] = dt => {
    if (!playing) return; if (hold > 0) { hold -= dt; return }
    const prev = T; T = Math.min(sc.end, T + dt * speed);
    const hit = sc.events.find(e => e.t > prev && e.t <= T); if (hit) { T = hit.t; hold = dwell }
    if (T >= sc.end) playing = false; render()
  };
  render(); return { jump }
}
// loop: continuous motion for a figure while it is on screen, fn(dt, seconds). Off under reduced motion.
function loop(id, fn) { let t = 0; ANIM[id] = dt => { t += dt; fn(dt, t) } }

/* ---------- one animation loop for the page ---------- */
const ANIM = {};
function start() {
  document.querySelectorAll(".fh b,h2 .n,.tabs [role=tab],.chips .lab").forEach(e => { if (isCaps(e.textContent)) e.classList.add("caps") });
  const paneIO = new IntersectionObserver(en => en.forEach(x => { if (x.isIntersecting) scrollPane(x.target) }));
  document.querySelectorAll("pre.code").forEach(b => paneIO.observe(b));
  tabs();
  if (reduce) return;
  const vis = new Set();
  const io = new IntersectionObserver(en => en.forEach(x => { x.isIntersecting ? vis.add(x.target.id) : vis.delete(x.target.id) }), { rootMargin: "100px" });
  Object.keys(ANIM).forEach(id => { const s = $(id); if (s) io.observe(s) });
  let last = null;
  function frame(now) { if (last === null) last = now; const dt = Math.min((now - last) / 1000, .05); last = now; for (const id of vis) if (ANIM[id]) ANIM[id](dt, now); requestAnimationFrame(frame) }
  requestAnimationFrame(frame)
}
// Optional tabs: <nav class="tabs" role="tablist"><button role="tab" aria-controls="tab-x">…</button></nav> + <section id="tab-x" role="tabpanel">.
function tabs() {
  const list = document.querySelector(".tabs[role=tablist]"); if (!list) return;
  const btns = [...list.querySelectorAll("[role=tab]")];
  function show(id, push) {
    btns.forEach(b => { const on = b.getAttribute("aria-controls") === id; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; $(b.getAttribute("aria-controls")).hidden = !on });
    if (push) history.replaceState(null, "", "#" + id.replace(/^tab-/, ""))
  }
  btns.forEach(b => b.addEventListener("click", () => show(b.getAttribute("aria-controls"), true)));
  const h = location.hash.slice(1), byHash = h && btns.find(b => b.getAttribute("aria-controls") === "tab-" + h);
  const inside = h && !byHash && document.getElementById(h) && document.getElementById(h).closest("[role=tabpanel]");
  show(byHash ? "tab-" + h : inside ? inside.id : btns[0].getAttribute("aria-controls"), false);
  if (inside) document.getElementById(h).scrollIntoView()
}
