"""Turn a COLOURING OUTLINE into a Vocab figure, coloured by us.

  python -P tools/figure-trace/outline.py tools/figure-trace/skin-outline.json

The outline alone is the source: no coloured picture is read. Its enclosed
white areas are numbered (areas.py shows them), each part is a set of areas
named by rules, and every part is filled with a colour of OUR choosing, with
the outline inked on top. Writes data/vocab/organs/<key>.js in the same RICH
shape trace.py makes (SVG + PARTS with a `shape` each).

Spec:
  src, out, title, (display)
  seal       px the lines are thickened for splitting only (closes hairline gaps)
  cuts       [[x1,y1,x2,y2], ...] lines drawn in where the outline left an
             opening between two parts (a duct opening onto the surface)
  ink        the line colour, "#3e2c26"
  parts      in CLAIM order; each:
    name, grade, hint
    fill     its colour, or "fills": [...] cycled area by area (fat cells,
             skin layers) so a part made of many areas has some life
    seeds    [[x,y]...] the areas at these points
    lasso    polygon (or list): every unclaimed area at least `share` (0.6)
             inside it
    enclose  true: also every area it wraps round
    rest     true: every area still unclaimed inside its lasso (or anywhere)
Lines go to the nearest part, so neighbours meet on the drawn line.
"""
import json, os, re, sys, tempfile
from collections import deque
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import vtracer

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
spec_path = sys.argv[1]
spec = json.load(open(spec_path, encoding="utf-8"))
here = os.path.dirname(os.path.abspath(spec_path))

ln = np.array(Image.open(os.path.join(here, spec["src"])).convert("L")).astype(int)
H, W = ln.shape
ink = ln < spec.get("line_dark", 140)

def poly_mask(poly):
    img = Image.new("L", (W, H), 0)
    for ring in (poly if isinstance(poly[0][0], list) else [poly]):
        ImageDraw.Draw(img).polygon([tuple(p) for p in ring], fill=255)
    return np.array(img) > 127

# ── areas: the white between the lines (lines thickened by `seal`, cuts drawn in)
wall_img = Image.fromarray(np.where(ink, 0, 255).astype(np.uint8))
d = ImageDraw.Draw(wall_img)
for x1, y1, x2, y2 in spec.get("cuts", []):
    d.line([(x1, y1), (x2, y2)], fill=0, width=3)
seal = spec.get("seal", 1)
if seal:
    wall_img = wall_img.filter(ImageFilter.MinFilter(2 * seal + 1))
wall = np.array(wall_img) < 128
cut_ink = (np.array(Image.fromarray(np.where(ink, 0, 255).astype(np.uint8))) < 128)
lab = np.full((H, W), -1, int)
n = 0
for sy, sx in zip(*np.nonzero(~wall)):
    if lab[sy, sx] >= 0: continue
    q = deque([(sy, sx)]); lab[sy, sx] = n
    while q:
        y, x = q.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < H and 0 <= nx < W and lab[ny, nx] < 0 and not wall[ny, nx]:
                lab[ny, nx] = n; q.append((ny, nx))
    n += 1
cnt = np.bincount(lab[lab >= 0], minlength=n)
edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {-1}

owner = np.full(n, -1)          # area -> part
for e in edge: owner[e] = -2    # outside
parts = spec["parts"]
for i, p in enumerate(parts):
    take = set()
    for x, y in p.get("seeds", []):
        a = lab[y, x]
        if a < 0: raise SystemExit(f'{p["name"]}: seed {x},{y} is on a line')
        take.add(int(a))
    if "lasso" in p:
        inside = poly_mask(p["lasso"])
        frac = np.bincount(lab[(lab >= 0) & inside], minlength=n) / np.maximum(cnt, 1)
        take |= set(np.nonzero(frac >= p.get("share", 0.6))[0].tolist())
    if p.get("rest"):
        free = set(np.nonzero(owner == -1)[0].tolist())
        if "lasso" in p:
            inside = poly_mask(p["lasso"])
            frac = np.bincount(lab[(lab >= 0) & inside], minlength=n) / np.maximum(cnt, 1)
            free = {a for a in free if frac[a] > 0}
        take |= free
    taken = {a: int(owner[a]) for a in take if owner[a] >= 0}
    if taken and os.environ.get("OUTLINE_DEBUG"):
        print(f'  {p["name"]}: areas already owned -> ' + ", ".join(f'{a} by {parts[o]["name"]}' for a, o in taken.items()))
    for x, y in p.get("except", []):  # areas this part must NOT take
        take.discard(int(lab[y, x]))
    take = {a for a in take if owner[a] == -1}
    for a in take: owner[a] = i
    if p.get("enclose"):
        m = np.isin(lab, [a for a in range(n) if owner[a] == i])
        # areas fully surrounded by this part (with its lines) join it
        solid = m | ink
        ys, xs = np.nonzero(m)
        if len(ys):
            sub = lab[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
            for a in np.unique(sub):
                if a < 0 or owner[a] != -1: continue
                yy, xx = np.nonzero(lab == a)
                if yy.min() > ys.min() and yy.max() < ys.max() and xx.min() > xs.min() and xx.max() < xs.max():
                    ring = np.zeros_like(m)
                    ring[np.clip(yy - 2, 0, H - 1), xx] = True; ring[np.clip(yy + 2, 0, H - 1), xx] = True
                    ring[yy, np.clip(xx - 2, 0, W - 1)] = True; ring[yy, np.clip(xx + 2, 0, W - 1)] = True
                    ring &= (lab != a)
                    if np.all(solid[ring] | (np.isin(lab[ring], [b for b in range(n) if owner[b] == i]))):
                        owner[a] = i

left = [a for a in range(n) if owner[a] == -1 and cnt[a] >= 30]
if left:
    print(f"  {len(left)} areas unnamed (largest {max(cnt[a] for a in left)} px) — handed to neighbours")

part = np.where(lab >= 0, owner[np.maximum(lab, 0)], -1)
outside = part == -2

# ── open tubes: a vessel branch drawn as two lines with OPEN ends has no area
# of its own (its inside runs into the dermis). A channel too narrow to hold a
# disc of radius `tube_r` is a tube; each tube piece goes to the part (with
# `branches: true`) whose areas its LOWEST point is nearest to — a branch
# belongs to the trunk it rises from.
br = [i for i, p in enumerate(parts) if p.get("branches")]
if br:
    tr = spec.get("tube_r", 4)
    free = (lab >= 0) & ~outside
    big = Image.fromarray(free.astype(np.uint8) * 255)
    opened = np.array(big.filter(ImageFilter.MinFilter(2 * tr + 1)).filter(ImageFilter.MaxFilter(2 * tr + 1))) > 127
    chan = free & ~opened
    # only inside the catch-all part's areas (the dermis): every other narrow
    # area (a layer strip, the band, the follicle's lining) is already named
    rest = [i for i, p in enumerate(parts) if p.get("rest")]
    if rest:
        chan &= np.isin(part, rest)
    if "tube_lasso" in spec: chan &= poly_mask(spec["tube_lasso"])
    for i in br: chan &= part != i          # the trunks themselves stay
    # the trunks' pixels, for the nearest test
    trunk = {i: np.argwhere(part == i) for i in br}
    seen = np.zeros_like(chan)
    for sy, sx in zip(*np.nonzero(chan)):
        if seen[sy, sx]: continue
        comp, q = [], deque([(sy, sx)]); seen[sy, sx] = True
        while q:
            y, x = q.popleft(); comp.append((y, x))
            for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= ny < H and 0 <= nx < W and chan[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True; q.append((ny, nx))
        if len(comp) < spec.get("tube_min", 80): continue
        comp = np.array(comp)
        # a tube is LONG and thin: the pointed tip of a pocket is narrow too,
        # but short — mean width (area / length) must stay under a tube's
        span = max(np.ptp(comp[:, 0]), np.ptp(comp[:, 1])) + 1
        if span < spec.get("tube_len", 30) or len(comp) / span > 2 * tr + 3: continue
        low = comp[comp[:, 0].argmax()]
        best = min(br, key=lambda i: np.min(np.sum((trunk[i] - low) ** 2, axis=1)) if len(trunk[i]) else 1e18)
        part[comp[:, 0], comp[:, 1]] = best
for _ in range(80):  # lines and unnamed slivers -> nearest part
    todo = part == -1
    if not todo.any(): break
    for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        nb = np.full_like(part, -1)
        nb[max(dy, 0):H + min(dy, 0), max(dx, 0):W + min(dx, 0)] = part[max(-dy, 0):H + min(-dy, 0), max(-dx, 0):W + min(-dx, 0)]
        t = todo & (nb >= 0)
        part[t] = nb[t]; todo &= ~t
np.save(os.path.splitext(spec_path)[0] + "-parts.npy", part)

hexrgb = lambda h: [int(h[i:i + 2], 16) for i in (1, 3, 5)]
INK = np.array(hexrgb(spec.get("ink", "#3e2c26")))
art = np.full((H, W, 3), 255.0)
for i, p in enumerate(parts):
    fills = [hexrgb(c) for c in (p.get("fills") or [p["fill"]])]
    areas = [a for a in range(n) if owner[a] == i]
    for k, a in enumerate(areas):
        art[lab == a] = fills[k % len(fills)]
    # the lines handed to this part take its first colour (under the ink)
    # and any pixel carved out for it (an open tube inside another area)
    art[(part == i) & ((lab < 0) | (owner[np.maximum(lab, 0)] != i))] = fills[0]
art[ink] = INK
art[outside & ~ink] = 255
paper = (part < 0)

for i, p in enumerate(parts):
    m = part == i
    print(f'  {p["name"]:<24} {int(m.sum()):>7} px')
    if not m.any(): raise SystemExit(f'{p["name"]}: no areas')

# ── crop, trace the art (2x, nearest: flat colours trace small) and each part
ys, xs = np.nonzero(~paper | (ink & ~outside))
pad = int(0.015 * (ys.max() - ys.min()))
cx0, cy0 = max(xs.min() - pad, 0), max(ys.min() - pad, 0)
cx1, cy1 = min(xs.max() + pad + 1, W), min(ys.max() + pad + 1, H)
VW, VH = cx1 - cx0, cy1 - cy0
tmp = tempfile.mkdtemp()
path_re = re.compile(r'<path d="([^"]*)" fill="#([0-9A-Fa-f]{6})" transform="translate\(([-\d.]+),([-\d.]+)\)"/>')
tok_re = re.compile(r'[A-Za-z]|-?\d+(?:\.\d+)?')

def bake(d, tx, ty):
    toks = tok_re.findall(d); out, cmd, nums = [], None, []
    cur = start = (0, 0); last = [None]
    def flush():
        nonlocal cur, start
        if cmd is None: return
        pts = [(int(round(nums[i] + tx)), int(round(nums[i + 1] + ty))) for i in range(0, len(nums), 2)]
        step = 3 if cmd == "C" else 1
        for k in range(0, len(pts), step):
            grp = pts[k:k + step]
            letter = "m" if (cmd == "M" and k == 0) else ("c" if cmd == "C" else "l")
            base = (0, 0) if (letter == "m" and last[0] is None) else cur
            rel = " ".join(f"{x - base[0]} {y - base[1]}" for x, y in grp)
            if letter == "m" and last[0] is None: letter = "M"
            out.append((" " if letter == last[0] and letter != "m" else letter) + rel)
            last[0] = letter; cur = grp[-1]
            if letter in "mM": start = cur
    for t in toks:
        if t.isalpha():
            flush(); nums = []; cmd = t.upper()
            if cmd == "Z": out.append("z"); cur = start; cmd = None; last[0] = "z"
            continue
        nums.append(float(t))
    flush()
    return "".join(out).replace(" -", "-")

def trace(png, mode):
    o = os.path.join(tmp, "t.svg")
    if mode == "color":
        vtracer.convert_image_to_svg_py(png, o, "color", "stacked", "spline", 6, 6, 16, 60, 4.0, 10, 45, 1)
    else:
        vtracer.convert_image_to_svg_py(png, o, "binary", "stacked", "spline", 4, 6, 16, 60, 4.0, 10, 45, 1)
    return [(m.group(1), m.group(2), float(m.group(3)), float(m.group(4))) for m in path_re.finditer(open(o, encoding="utf-8").read())]

AS = 2
rgba = np.dstack([art.astype(np.uint8), np.where(paper & ~ink, 0, 255).astype(np.uint8)])
rgba[outside & ink, 3] = 255
png = os.path.join(tmp, "art.png")
Image.fromarray(rgba, "RGBA").resize((W * AS, H * AS), Image.NEAREST).save(png)
svg = [f'<g transform="scale({1 / AS})">']
for dd, fill, tx, ty in trace(png, "color"):
    r, g, b = (int(fill[i:i + 2], 16) for i in (0, 2, 4))
    if min(r, g, b) >= 250: continue
    svg.append(f'<path fill="#{fill.lower()}" d="{bake(dd, tx - cx0 * AS, ty - cy0 * AS)}"/>')
svg.append("</g>")

out_parts = []
for i, p in enumerate(parts):
    m = part == i
    mp = os.path.join(tmp, "m.png")
    Image.fromarray(np.where(m, 0, 255).astype(np.uint8)).convert("RGB").save(mp)
    shape = "".join(bake(dd, tx - cx0, ty - cy0) for dd, fill, tx, ty in trace(mp, "binary") if fill.lower() != "ffffff")
    yy, xx = np.nonzero(m)
    if p["name"].lower() in p["hint"].lower(): raise SystemExit(f'clue names itself: {p["name"]}')
    out_parts.append({"name": p["name"], "hint": p["hint"], "grade": p["grade"],
                      "fill": (p.get("fills") or [p["fill"]])[0],
                      "cx": int(round(xx.mean() - cx0)), "cy": int(round(yy.mean() - cy0)), "shape": shape})

rows = ",\n".join("  " + json.dumps(p, ensure_ascii=False) for p in out_parts)
disp = f"export const DISPLAY = {spec['display']};  // drawn at this share of the usual size\n" if spec.get("display") else ""
js = f"""/* ═══════════════════════════════════════════════════════
   {spec["title"].upper()} — cut from a colouring outline ({spec["src"]}) and
   coloured by us, by tools/figure-trace/outline.py ({os.path.basename(spec_path)}
   names the parts and picks their colours). GENERATED — edit the spec and
   re-run, never this file. LAZY-LOADED — never import statically.
═══════════════════════════════════════════════════════ */

export const MAP_W = {VW};
export const MAP_H = {VH};
export const RICH = true;
{disp}export const SVG = {json.dumps("".join(svg))};

export const PARTS = [
{rows},
];

// Shaped like any other topic's words: the part NAME is the word, its
// description the clue, `g` tiers it by grade (topicPool filters on it).
export const GAME_PARTS = PARTS.map((c) => ({{ w: c.name, d: c.hint, g: c.grade, part: c }}));
"""
open(os.path.join(ROOT, spec["out"]), "w", encoding="utf-8", newline="\n").write(js)
print(f'wrote {spec["out"]}: {len(out_parts)} parts, {VW}x{VH}, art {len("".join(svg)) // 1024} KB')
