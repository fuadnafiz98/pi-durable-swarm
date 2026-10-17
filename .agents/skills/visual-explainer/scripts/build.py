#!/usr/bin/env python3
"""Builds one self-contained explainer page from a page folder.

    python3 build.py PAGE_DIR [-o OUT.html] [--code]

PAGE_DIR holds:
  page.json    {"title", "dek", "description", "lang"?, "fonts"?}
  body.html    sections; figure placeholders <figure data-fig=… data-h=… data-nav=… data-title=…>…</figure>;
               <!-- toc --> for the contents list; {{fig:ID}} for a figure's number in prose
  figures.js   the page's drawings, written against assets/kit.js
  code.json    only read with --code: which source files and line ranges the code panes show

Standard library only. Fails loudly on a missing anchor, a duplicate figure id or a figure without a drawing.
"""

import argparse
import ast
import base64
import html
import json
import re
import sys
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
ASSETS = SKILL / "assets"
NAVS = {"steps", "choose", "play", "none"}
FIGURE = re.compile(r"<figure\s+([^>]*\bdata-fig=\"[^\"]+\"[^>]*)>(.*?)</figure>", re.S)
ATTR = re.compile(r'([\w-]+)="([^"]*)"')
H2 = re.compile(r'<h2 id="([^"]+)">\s*(?:<span class="n">(.*?)</span>)?(.*?)</h2>', re.S)


def fail(msg):
    sys.exit(f"build.py: {msg}")


def font_face(name, path, weight="400", style="normal"):
    data = base64.b64encode(Path(path).read_bytes()).decode()
    return (f'@font-face{{font-family:"{name}";src:url(data:font/woff2;base64,{data}) format("woff2");'
            f"font-weight:{weight};font-style:{style};font-display:swap}}")


def fonts(page, page_dir):
    # Every font is inlined, so a page makes no outside request. All three families are OFL or MIT (assets/fonts).
    faces = [font_face("Paper Mono", ASSETS / "fonts/PaperMono.woff2", "100 800"),
             font_face("Departure Mono", ASSETS / "fonts/DepartureMono.woff2")]
    serif = (page.get("fonts") or {}).get("serif")
    extra = ""
    if serif:  # a licensed serif of the page's own in place of Libron
        for spec in serif["files"]:
            faces.append(font_face(serif["name"], page_dir / spec["path"], str(spec.get("weight", 400)), spec.get("style", "normal")))
        extra = f':root{{--serif:"{serif["name"]}",ui-serif,Georgia,serif}}'
    else:
        faces += [font_face("Libron", ASSETS / f"fonts/Libron-{name}.woff2", weight, style)
                  for name, weight, style in (("Regular", "400", "normal"), ("Italic", "400", "italic"), ("Bold", "700", "normal"))]
    return "\n".join(faces) + "\n" + extra


def figure_html(attrs, inner, num, with_code):
    fid, nav = attrs["data-fig"], attrs.get("data-nav", "steps")
    if nav not in NAVS:
        fail(f"figure {fid}: data-nav must be one of {sorted(NAVS)}")
    if "data-h" not in attrs or "data-title" not in attrs or "aria-label" not in attrs:
        fail(f"figure {fid}: needs data-h, data-title and aria-label")
    act_label = html.escape(attrs.get("data-act", "show"))
    if nav == "steps":
        ctl = (f'<div class="chips"><button type="button" id="{fid}Prev">prev</button>'
               f'<button type="button" id="{fid}Next">next</button><span class="lab" id="{fid}Step"></span></div>')
    elif nav == "choose":
        ctl = f'<div class="chips" id="{fid}Act" role="group" aria-label="{act_label}"></div>'
    elif nav == "play":
        ctl = (f'<div class="chips" id="{fid}Act" role="group" aria-label="{act_label}"></div>'
               f'<div class="chips"><button type="button" id="{fid}Play">pause</button>'
               f'<button type="button" id="{fid}Prev">◀ event</button><button type="button" id="{fid}Next">event ▶</button>'
               f'<span class="lab" id="{fid}Step"></span></div>')
    else:
        ctl = ""
    pane = with_code and nav != "none" and attrs.get("data-code") != "off"
    controls = f'\n    <div class="ff">{ctl}</div>' if ctl else ""
    cap = f'\n    <div class="ff"><p class="cap-t" id="{fid}Cap">{inner.strip()}</p></div>' if (nav != "none" or inner.strip()) else ""
    code = f'\n  <pre class="code" id="{fid}Code" aria-label="Source code"></pre>' if pane else ""
    return f"""<figure{' class="split"' if pane else ''}>
  <div class="fl">
    <div class="fh"><b>FIG_{num:02d}</b><span>[ {attrs['data-title']} ]</span></div>
    <div class="stage flatwrap"><svg id="{fid}" class="flat" viewBox="0 0 960 {attrs['data-h']}" width="960" role="img" aria-label="{attrs['aria-label']}"></svg></div>{controls}{cap}
  </div>{code}
</figure>"""


def expand(body, with_code):
    numbers, seen = {}, set()

    def one(m):
        attrs = dict(ATTR.findall(m.group(1)))
        fid = attrs["data-fig"]
        if fid in seen:
            fail(f"duplicate figure id {fid}")
        seen.add(fid)
        numbers[fid] = len(numbers) + 1
        return figure_html(attrs, m.group(2), numbers[fid], with_code)

    body = FIGURE.sub(one, body)
    body = re.sub(r"\{\{fig:([\w-]+)\}\}", lambda m: f"FIG_{numbers[m.group(1)]:02d}" if m.group(1) in numbers else fail(f"{{{{fig:{m.group(1)}}}}}: no such figure"), body)
    toc = "".join(f'<li><a href="#{i}">{re.sub("<[^>]+>", "", n or "").strip()} {re.sub("<[^>]+>", "", t).strip()}</a></li>'
                  for i, n, t in H2.findall(body))
    body = body.replace("<!-- toc -->", f'<ol class="toc" aria-label="Contents">{toc}</ol>')
    return body, numbers


# ---------- code panes ----------

def python_def(text, qualname):
    cls, _, name = qualname.rpartition(".")
    for node in ast.walk(ast.parse(text)):
        if isinstance(node, ast.ClassDef) and cls and node.name == cls:
            for item in node.body:
                if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)) and item.name == name:
                    return [min([item.lineno] + [d.lineno for d in item.decorator_list]), item.end_lineno]
        if not cls and isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)) and node.name == name:
            return [min([node.lineno] + [d.lineno for d in node.decorator_list]), node.end_lineno]
    fail(f"fn {qualname}: not found")


def at(text, snippet, count=1):
    n = text.count(snippet)
    if n != 1:
        fail(f"at {snippet!r}: found {n} times, need exactly 1 (add more context)")
    line = text[: text.index(snippet)].count("\n") + 1
    return [line, line + int(count) - 1]


def span(text, start, end):
    first = at(text, start)[0]
    lines = text.splitlines()
    for i in range(first - 1, len(lines)):
        if end in lines[i]:
            return [first, i + 1]
    fail(f"span {start!r} … {end!r}: end not found")


def code_bundle(page_dir):
    spec_path = page_dir / "code.json"
    if not spec_path.exists():
        fail("--code needs code.json in the page folder")
    spec = json.loads(spec_path.read_text())
    root = (page_dir / spec.get("root", ".")).resolve()
    texts, files = {}, {}
    for key, entry in spec["files"].items():
        rel, excerpt = (entry, None) if isinstance(entry, str) else (entry["path"], entry.get("lines"))
        text = (root / rel).read_text()
        texts[key] = text
        lines = text.splitlines()
        a, b = excerpt or [1, len(lines)]
        files[key] = {"path": rel, "start": a, "lines": lines[a - 1 : b]}
    ranges = {}
    for name, (key, kind, *args) in spec["ranges"].items():
        if key not in texts:
            fail(f"range {name}: unknown file key {key}")
        text = texts[key]
        if kind == "fn":  # Python only; other languages use at, span or lines
            ranges[name] = python_def(text, args[0])
        elif kind == "at":
            ranges[name] = at(text, *args)
        elif kind == "span":
            ranges[name] = span(text, *args)
        elif kind == "lines":
            ranges[name] = [int(args[0]), int(args[1])]
        else:
            fail(f"range {name}: kind must be fn, at, span or lines")
    return {"files": files, "ranges": ranges}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("page_dir", type=Path)
    ap.add_argument("-o", "--out", type=Path)
    ap.add_argument("--code", action="store_true", help="add a synced source pane to every interactive figure")
    a = ap.parse_args()
    page_dir = a.page_dir.resolve()
    page = json.loads((page_dir / "page.json").read_text())
    body, numbers = expand((page_dir / "body.html").read_text(), a.code)
    figures = (page_dir / "figures.js").read_text()
    for fid in numbers:
        if f'"{fid}"' not in figures and f"'{fid}'" not in figures:
            fail(f"figure {fid} has no drawing in figures.js (no \"{fid}\" in it)")
    code = "const __CODE__=" + json.dumps(code_bundle(page_dir)) + ";" if a.code else ""
    out = (ASSETS / "shell.html").read_text()
    for k, v in {
        "LANG": page.get("lang", "en"),
        "TITLE": html.escape(page["title"]),
        "DESCRIPTION": html.escape(page.get("description", page["dek"])),
        "DEK": page["dek"],
        "FONTS": fonts(page, page_dir),
        "STYLE": (ASSETS / "style.css").read_text(),
        "BODY": body,
        "CODE": code,
        "KIT": (ASSETS / "kit.js").read_text(),
        "FIGURES": figures,
    }.items():
        out = out.replace("{{" + k + "}}", v)
    dest = a.out or page_dir / ("page.code.html" if a.code else "page.html")
    dest.write_text(out)
    print(f"{dest}  {len(out.encode()) / 1024:.0f} KiB  figures: {', '.join(f'FIG_{n:02d}={fid}' for fid, n in numbers.items())}")


if __name__ == "__main__":
    main()
