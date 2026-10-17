# Kit reference (`assets/kit.js`)

`build.py` puts the kit, `__CODE__` (code mode) and the page's `figures.js` in one function scope, so every name here is a plain local. Wrap each figure in its own `(function(){ … })();`.

## Page markup (`body.html`)

```html
<div class="prose"><!-- toc -->
  <h2 id="s1"><span class="n">01 · BIG PICTURE</span>What talks to what?</h2><p>…</p></div>
<figure data-fig="map" data-h="300" data-nav="none" data-title="the parts" aria-label="…">Static caption, optional.</figure>
<figure data-fig="flow" data-h="260" data-nav="steps" data-title="one request" aria-label="…"></figure>
<figure data-fig="pick" data-h="300" data-nav="choose" data-act="state" data-title="…" aria-label="…"></figure>
<figure data-fig="clock" data-h="400" data-nav="play" data-act="scenario" data-title="…" aria-label="…"></figure>
```

`data-fig` is the svg id used in `figures.js`; `data-h` the viewBox height (width is always 960); `data-act` labels the chip group; `data-code="off"` keeps one figure without a pane in a code build. `{{fig:flow}}` in prose becomes `FIG_02`. Tables: `<div class="tw"><table class="t">`; callouts: `<div class="note"><b>NOTE</b><p>…</p></div>`; tabs: `<nav class="tabs" role="tablist"><button role="tab" aria-controls="tab-a">…</button></nav>` + `<section id="tab-a" role="tabpanel">`.

## Canvas: `const s = flat(id)`

| Call | Draws |
| --- | --- |
| `s.clear()` | empties the figure |
| `s.t(x, y, text, cls="lbl", anchor="start", extra)` | text with a halo; all-caps text switches to the caps font |
| `s.box(cx, cy, w, h, title, sub, cls="cap", tip)` | box centred on (cx, cy); `tip` names an `INFO` entry for hover |
| `s.r(x, y, w, h, cls)` / `s.c(x, y, r, cls)` / `s.p(d, cls)` | rect, circle, raw path |
| `s.arrow(pts, cls="ln", size=6)` | polyline with a head at the last point |
| `s.cyl(cx, y, w, h)` | a database cylinder |
| `s.xmark(x, y)` / `s.check(x, y)` | failure and success marks |
| `s.token(pts, k)` | small square a fraction k along a polyline |
| `s.hit(x, y, w, h, label)` | invisible hover area for `INFO[id][label]` |
| `s.iso({ox, oy, u})` | isometric helper on the same canvas (below) |
| `s.w`, `s.h` | viewBox size |

`extra` objects set attributes, e.g. `{ opacity: ".5", "stroke-dasharray": "4 3" }`.

## Isometric: `const I = s.iso({ ox, oy, u = 1, angle = 30 })`

`I.P(x, y, z)` → screen point. `I.box(x, y, z, w, d, h, {top, left, right, label, sub, tip})` returns `{top: [x, y, z], …}`; `I.slab(…, {h})`; `I.stack(x, y, z, w, d, layers, gap)`; `I.grid(x, y, w, d, step)`; `I.arrow(pts3, cls)`; `I.line(pts3, cls)`; `I.face(pts3, cls)`; `I.label(x, y, z, text, {dx, dy, sub, cls, anchor})`; `I.token(pts3, k)`. Design rules: [diagrams.md](diagrams.md#isometric).

## Behaviours

Each wires the figure's controls, caption (`{id}Cap`) and, in code mode, its pane. Captions are HTML.

```js
steps(id, [{ cap, code: ["file", ["range"]], ...yourData }], (i, step) => { s.clear(); … });
choose(id, [{ k, label, cap, code }], (k, option) => { … }, "chip label");
play(id, { key: { label, end, events: [{ t, cap, code }], ...yourData } },
     (T, scenario, key) => { … }, { speed: 16, dwell: 2.6, label: "scenario" });
loop(id, (dt, seconds) => draw(seconds));   // continuous motion while visible; off under reduced motion
INFO[id] = { "label": ["note html", "mono spec line"] };  // hover notes for s.hit / box tip
```

- `play` pauses at each event for `dwell` seconds, offers ◀ event / event ▶ / pause / replay, and under reduced motion turns play into "next event". `draw(T)` must compute the whole picture from `T` alone.
- With one scenario, `play` hides the chips.
- `steps` and `play` disable their buttons at the ends; `check.mjs` relies on that to walk them.

## Helpers

`$`, `el`, `f`, `clamp`, `lerp`, `ease`, `pp(pts, close)`, `polyLen`, `polyCut`, `along(pts, k)`, `pad2`, `chips`, `pressed`, `caption(id, html)`, `pane(id)`, `reduce` (true under reduced motion), `ANIM`.

## Classes

Fills: `cap` (box), `side` (store, secondary), `cut` (hatched: separate process or untrusted), `dk` (dotted: shaded iso face), `ok-f`, `bad-f`, `warn-f`; add `cur` for the current element. Lines: `ln` (active), `wire` (inactive), `guide` (dashed: region, ghost, hypothetical), `ln2` (light rule), `ok-l`, `bad-l`. Text: `lbl` (11 px), `lbl-s` (10 px, grey), `lbl-b` (alert), `lbl-g` (ok), `lbl-w` (warn), `mid` (14 px). Marks: `solid`, `ok-s`, `bad-s`.
