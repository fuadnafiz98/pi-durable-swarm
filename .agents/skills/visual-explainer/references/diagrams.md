# Designing a diagram for this codebase

A diagram earns its place by showing what prose cannot: where the **boundaries** are, what **moves**, and what **changes** between moments. Design it from the project in front of you; the figure kinds below are ways of seeing, not layouts to fill in.

## Method

1. **Inventory.** List what this figure is about, with the project's own names: processes, services, modules, tables, queues, files on disk, external systems, people (user, admin, operator), and time. Five to twelve elements; more means two figures.
2. **Boundaries.** Find the lines the reader must not miss: process, network, trust, transaction, deploy unit, ownership (tenant), the boundary of what a PR changed. Draw each as a region — a dashed `guide` rectangle with a small label, or `cut` (hatched) when it is a separate process or untrusted input.
3. **Metaphor.** Pick the space that answers the section's question (table below). Direction carries meaning: requests flow left to right, layers stack bottom up, time runs left to right on its own axis, stores sit at the right or bottom edge, the outside world at the far edge.
4. **What changes.** Write the change list before any code: for each step, option or event — which elements light up (`cur`), appear, fade, which arrow is active, which value moves, and the caption. A step that changes nothing in the picture is a caption, not a step.
5. **Layout on the grid.** The viewBox is 960 wide; choose the height (220–600) from the content. Keep a 24-unit margin and a left label column (x 24–120) for lanes. Budget label width before placing: ≈ 6.2 units per character at 10 px mono (`lbl-s`), ≈ 6.8 at 11 px (`lbl`). A label near the right edge is anchored `end`.
6. **Draw from state.** `draw(i)` (or `draw(T)`) clears and redraws everything from the step's data, so prev, next, jumps and replays always agree. Never mutate the picture incrementally.

## Figure kinds

| Question | Kind | Behaviour | Shape |
| --- | --- | --- | --- |
| What are the parts, what talks to what? | **map** | `none` + hover (`INFO`), optional `loop` token | boxes in regions, arrows labelled with what travels |
| In what order? | **workflow** | `steps` | stations in a row or swimlanes; done stations get a check, current is `ok-f cur`, a token runs into it |
| Who does what, when? | **sequence** | `steps` | lifelines as vertical lines, messages as arrows top to bottom; the step reveals messages so far |
| What is built on what? | **isometric stack** | `choose` or `steps` | slabs bottom up, leader labels at the side |
| What runs where? | **isometric deployment** | `steps` | ground plane = cluster or host, slabs = nodes or namespaces, boxes = processes; arrows between box tops |
| What states, what moves it? | **state machine** | `choose` (pick a state) | states as boxes, transitions labelled with their trigger; the chosen state's outgoing edges are `ln`, the rest `wire` |
| What happens over time or under failure? | **clock timeline** | `play` with scenarios | a time axis, one lane per actor, values that move (a lease bar, a counter), events that pause the clock |
| Which function calls which? | **call stack** | `steps` | frames bottom up, top frame `ok-f cur`, a dashed ghost for the frame that just returned, the return value beside it |
| Which option, what changed? | **comparison** | `choose` | the same picture redrawn per option (before/after, design A/B, healthy/failed) |
| What is in this table, request, file? | **anatomy** | `none` or `choose` | the thing itself drawn as rows or fields, each annotated |

Combine freely: a map whose arrows animate, a deployment whose steps play a request across it, a timeline over a mini map.

## Isometric

Use isometry when depth carries meaning — layers resting on each other, things running inside other things, a request crossing levels — not as decoration. A flat map is clearer for "what talks to what".

```js
const I = s.iso({ ox: 300, oy: 220, u: 1 });          // where world (0,0,0) lands; px per unit
I.grid(0, 0, 400, 300, 50);                             // ground plane, drawn first
I.box(0, 0, 0, 200, 150, 20, { top: "cap", left: "side", right: "dk" });
I.stack(0, 0, 0, 200, 150, [{ h: 20 }, { h: 20, top: "ok-f" }], 22);
I.arrow([[100, 75, 40], [100, 75, 120]], "ln");           // world-space polyline
I.label(200, 75, 10, "kit.js", { dx: 150, dy: -4, sub: "primitives" });
```

- **Axes**: x runs down-right, y down-left, z up. Visible faces are top, front-left (+y) and front-right (+x).
- **Painter's order is yours**: draw far before near (smaller x + y first), low before high.
- **Size it**: drawn width ≈ (w + d)·0.866·u, height ≈ z_top + (w + d)·0.5·u. Check both against the canvas before drawing.
- **Labels stay upright**, attached by leaders (`I.label`) to a point on a face; skewed text on faces is hard to read and stacked layers hide their own tops.
- **Faces mean things**: `cap` top, `side` and `dk` shaded sides; a hatched (`cut`) side marks a separate process, `ok-f`/`bad-f` tops mark current or failed, a `guide` outline is something absent or hypothetical.
- Keep to two or three depth levels and few elements; add a flat overlay (`s.t`, `s.box`) for legends and readouts.

## Motion

Motion shows causality, never decoration.

- **Token on the active path**: `loop(id, (dt, t) => draw(t))` with `s.token(pts, k)` along the arrow of the current step only.
- **Values ease** to their new state (a bar end sliding forward on renewal): interpolate inside `draw(T)` from the previous value over ~1 s of figure time.
- **Pulses mark instants**: an expanding ring on a tick, fading over 2–3 s.
- **Clock players** pause on events (`dwell`), so captions can be read; a jump to an event shows its finished state — put the event time just after its animation ends.
- Under reduced motion the kit stops the loop; every figure must still read correctly as a still per step.

## Pitfalls seen in practice

- A label at x > 850 clipped at the right edge → anchor it `end`.
- Two labels at the same spot from different steps or lanes → move one below its line, or shorten.
- A bar or value beyond the axis end → clamp to the canvas and put the true value in the label.
- A diagram that only lists names → it needs boundaries and arrows that say what travels.
- Steps that redraw an unrelated part of the picture → the reader loses track; change one region per step.
