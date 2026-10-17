# Checking a page

## Run

Once per machine:

```sh
cd SKILL/scripts && npm install          # the Playwright library, no browser download
```

The checker drives a real browser, because only a layout engine knows where each label actually lands. It uses an installed Chrome or Edge; without either, run `npx playwright install chromium` once, or point `CHROMIUM_PATH` at any Chromium binary. Building needs no browser.

Each build:

```sh
python3 SKILL/scripts/build.py PAGE_DIR
node SKILL/scripts/check.mjs PAGE_DIR/page.html /tmp/vx-shots              # 1440 and 390 px
node SKILL/scripts/check.mjs PAGE_DIR/page.html /tmp/vx-shots --only flow  # one figure while iterating
```

For a code build, also check `page.code.html` at 1440 px and at 1920 px.

`check.mjs` opens every figure, walks every step, option and scenario event, screenshots each state (`<fig>-<width>-<state>.png`), and writes `report.json`. It exits 1 on a page or console error, horizontal page scroll, or SVG text outside its viewBox; overlapping labels are warnings.

## Read every screenshot

The script cannot judge meaning. For each screenshot:

- [ ] Every label readable: not on top of a line, a box edge or another label; not cut at an edge.
- [ ] The highlighted element is the one the caption talks about; arrows point at the right box.
- [ ] Nothing from a previous step lingers that should not; nothing appears before its step.
- [ ] The caption states facts that match the code at their `path:line` — re-read the code, not your notes.
- [ ] Numbers (timeouts, limits, counts) match the config file.
- [ ] The picture still makes sense as a still (reduced motion): tokens are extras, not the message.
- [ ] Phone width: the figure scrolls inside its frame, controls wrap, captions fit.
- [ ] Code mode: the highlighted lines are the ones the caption names, and the pane starts at them.

Fix, build, check again until clean. Report anything you could not verify to the user rather than leaving it implied.
