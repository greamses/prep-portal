"""Trace a flat diagram picture into a Vocab "rich figure" module.

  python -P tools/figure-trace/trace.py tools/figure-trace/ear.json

Reads the spec's `src` picture (a flat-coloured diagram on white paper) and
writes `out` (data/vocab/organs/<key>.js) holding:

  * SVG   — the whole picture traced to colour shapes by VTracer (the art)
  * PARTS — every named part as its OWN outline (`shape`), cut from the picture
            by colour + a region, so the game can hide, reveal or lift out the
            real part (the Vocab clue, the Puzzles figure jigsaw).

A part in the spec:
  name, hint, grade         what the game asks
  picks  [[x,y], ...]       points ON the part (source pixels); their colours
                            define it, and only the patches touching them count
  tol                       colour distance to a pick that still counts (40)
  lasso  [[x,y], ...]       optional polygon the part must lie inside (or a
                            list of polygons, for a part in two places)
  walls                     N: ignore colour — flood every pixel whose darkest
                            channel is >= N, so the drawn outline is the wall
  all                       true: every matching pixel in the lasso, not just
                            the patches the picks touch
  open                      px: threads thinner than twice this are cut off (0)
  close                     px of gap (outline strokes) closed inside it (2)
  hole                      enclosed gaps smaller than this many px are filled (900)
  around, width             a band `width` px wide round an EARLIER part (by name)
  region                    true: no colour test — the part is all the picture
                            inside its lasso (with picks: only what they reach
                            without crossing an earlier part — a boundary) (for a part only a drawn line divides)

Parts are claimed in spec order: a pixel taken by an earlier part is never
given to a later one, so list small parts before the big ones around them.
After that every part grows `grow` px (2) into unclaimed picture, taking its
own outline stroke with it.

Needs `python -m pip install vtracer` (plus Pillow and numpy). VTracer options
go in BY POSITION (keywords segfault on Python 3.14) — see character-trace.
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
SCALE = 1  # 1x: the median-cleaned picture traces as clean as 2x, at a third the size

src = Image.open(os.path.join(here, spec["src"])).convert("RGB")
im = np.array(src).astype(int)
H, W, _ = im.shape

# ── paper: light, unsaturated pixels flooded from the border ──────────────
def flood(allowed, seeds):
    out = np.zeros_like(allowed)
    q = deque(s for s in seeds if allowed[s])
    while q:
        y, x = q.popleft()
        if out[y, x] or not allowed[y, x]:
            continue
        out[y, x] = True
        if y > 0: q.append((y - 1, x))
        if y < allowed.shape[0] - 1: q.append((y + 1, x))
        if x > 0: q.append((y, x - 1))
        if x < allowed.shape[1] - 1: q.append((y, x + 1))
    return out

# "paper": {"light": 232, "sat": 14} — a grey or gradient backdrop needs a lower light
PAPER = spec.get("paper", {})
light = (im.min(axis=2) >= PAPER.get("light", 232)) & ((im.max(axis=2) - im.min(axis=2)) <= PAPER.get("sat", 14))
border = [(0, x) for x in range(W)] + [(H - 1, x) for x in range(W)] \
    + [(y, 0) for y in range(H)] + [(y, W - 1) for y in range(H)]
paper = flood(light, border + [(y, x) for x, y in spec.get("paper_seeds", [])])

def grow_mask(m, r):
    if r <= 0: return m
    return np.array(Image.fromarray(m.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(2 * r + 1))) > 127

def shrink_mask(m, r):
    if r <= 0: return m
    return np.array(Image.fromarray(m.astype(np.uint8) * 255).filter(ImageFilter.MinFilter(2 * r + 1))) > 127

def polygon_mask(poly):
    """A lasso: one polygon [[x,y],...], or several [[[x,y],...], ...]."""
    img = Image.new("L", (W, H), 0)
    for ring in (poly if isinstance(poly[0][0], list) else [poly]):
        ImageDraw.Draw(img).polygon([tuple(p) for p in ring], fill=255)
    return np.array(img) > 127

def fill_holes(m, max_area):
    """Fill enclosed gaps (not reachable from the edge of the part's box)."""
    ys, xs = np.nonzero(m)
    if not len(ys): return m
    y0, y1, x0, x1 = max(ys.min() - 1, 0), min(ys.max() + 2, H), max(xs.min() - 1, 0), min(xs.max() + 2, W)
    sub = m[y0:y1, x0:x1]
    h, w = sub.shape
    seen = np.zeros_like(sub)
    out = sub.copy()
    for sy in range(h):
        for sx in range(w):
            if sub[sy, sx] or seen[sy, sx]: continue
            comp, edge, q = [], False, deque([(sy, sx)])
            seen[sy, sx] = True
            while q:
                y, x = q.popleft(); comp.append((y, x))
                if y in (0, h - 1) or x in (0, w - 1): edge = True
                for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                    if 0 <= ny < h and 0 <= nx < w and not sub[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True; q.append((ny, nx))
            if not edge and len(comp) <= max_area:
                for y, x in comp: out[y, x] = True
    m = m.copy(); m[y0:y1, x0:x1] = out
    return m

def drop_specks(m, min_area=40):
    """Keep only patches of at least min_area px."""
    seen = np.zeros_like(m); out = np.zeros_like(m)
    for sy, sx in zip(*np.nonzero(m)):
        if seen[sy, sx]: continue
        comp, q = [], deque([(sy, sx)]); seen[sy, sx] = True
        while q:
            y, x = q.popleft(); comp.append((y, x))
            for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= ny < H and 0 <= nx < W and m[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True; q.append((ny, nx))
        if len(comp) >= min_area:
            for y, x in comp: out[y, x] = True
    return out

# ── parts ─────────────────────────────────────────────────────────────────
claimed = np.zeros((H, W), bool)
masks = []
for p in spec["parts"]:
    if p.get("around"):
        # a band `width` px wide hugging an earlier part (the fold that wraps
        # round the corpus callosum), inside its lasso
        base = masks[[q["name"] for q in spec["parts"]].index(p["around"])]
        m = grow_mask(base, p.get("width", 20)) & ~base & ~claimed & ~paper
        if "lasso" in p: m &= polygon_mask(p["lasso"])
        m = drop_specks(m)
        claimed |= m
        masks.append(m)
        continue
    if p.get("region"):
        # a part with no colour of its own: everything inside its lasso
        m = polygon_mask(p["lasso"]) & ~paper & ~claimed
        if p.get("picks"):
            # only what the picks can reach without crossing an EARLIER part:
            # a layer bounded by another layer (the epidermis stops at the
            # Malpighian layer, however it dips)
            # the earlier parts are thickened by `seal` px while filling, so a
            # hairline gap in the boundary can't let the fill leak through
            seal = p.get("seal", 0)
            free = m & ~grow_mask(claimed, seal) if seal else m
            m = flood(free, [(y, x) for x, y in p["picks"] if free[y, x]])
            if seal:
                m = grow_mask(m, seal) & polygon_mask(p["lasso"]) & ~paper & ~claimed
        claimed |= m
        masks.append(m)
        continue
    cols = np.array([im[y, x] for x, y in p["picks"]])
    dist = np.min(np.linalg.norm(im[:, :, None, :] - cols[None, None, :, :], axis=3), axis=2)
    near = (dist < p.get("tol", 40)) & ~paper
    if "walls" in p:
        # a tube the same colour as what is round it: fill everything LIGHTER
        # than its drawn outline, from the picks out to the outline
        near = (im.min(axis=2) >= p["walls"]) & ~paper
    if "lasso" in p:
        near &= polygon_mask(p["lasso"])
    # `all`: every matching pixel in the lasso (a part drawn as many separate
    # pieces split by lines: the Golgi's sacs, the ER's bands); else only the
    # patches the picks touch
    m = near.copy() if p.get("all") else flood(near, [(y, x) for x, y in p["picks"]])
    for x, y in p["picks"]:
        if not m[y, x]:
            raise SystemExit(f'{p["name"]}: pick {x},{y} is not on the part (colour {im[y, x].tolist()})')
    o = p.get("open", 0)
    if o:  # strip threads thinner than 2*open px (lines touching the part)
        m = grow_mask(shrink_mask(m, o), o)
        m = flood(m, [(y, x) for x, y in p["picks"] if m[y, x]]) if any(m[y, x] for x, y in p["picks"]) else m
    r = p.get("close", 2)
    m = shrink_mask(grow_mask(m, r), r)
    if "lasso" in p:
        m &= polygon_mask(p["lasso"])
    m = fill_holes(m, p.get("hole", 900))
    m &= ~claimed & ~paper
    m = drop_specks(m)
    claimed |= m
    masks.append(m)

# grow each part into the unclaimed picture (its own outline stroke)
for i, p in enumerate(spec["parts"]):
    g = p.get("grow", 2)
    if g:
        extra = grow_mask(masks[i], g) & ~claimed & ~paper
        if "lasso" in p: extra &= polygon_mask(p["lasso"])
        masks[i] |= extra
        claimed |= extra

# ── LINE ART: "lines": "src/<name>-line.png" — the same drawing as a colouring
# outline, aligned with the coloured picture. Every enclosed white area becomes
# a region; the colour pass above only NAMES them (each region joins the part
# that covers most of it), and every line pixel goes to the nearest part, so
# neighbouring parts meet exactly on the drawn line. The art is rebuilt from
# it: each region flat in its own average colour, the outline inked on top.
LINEART = None
if spec.get("lines"):
    lim = Image.open(os.path.join(here, spec["lines"])).convert("L")
    if "lines_at" in spec:
        # the outline framed differently from the coloured picture (the heart's
        # is 1376 wide, the picture 1408): placed at [dx, dy] on a white page
        page = Image.new("L", (W, H), 255)
        page.paste(lim, tuple(spec["lines_at"]))
        lim = page
    ln = np.array(lim).astype(int)
    if ln.shape != (H, W):
        raise SystemExit(f'{spec["lines"]} is {ln.shape[1]}x{ln.shape[0]}, the picture is {W}x{H}')
    ink = ln < spec.get("line_dark", 140)
    # `line_seal`: thicken the lines by this many px for SPLITTING only, so a
    # hairline gap in the outline can't join two areas (the dermis leaked up
    # beside the hair); the drawn lines stay as they are
    r_seal = spec.get("line_seal", 0)
    wall = (np.array(Image.fromarray(ln.astype(np.uint8)).filter(ImageFilter.MinFilter(2 * r_seal + 1)))
            < spec.get("line_dark", 140)) if r_seal else ink
    # label the white areas (4-connected)
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
    # the outside: every area touching the picture's edge
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {-1}
    # which part covers most of each area
    pidx = np.full((H, W), -1, int)
    for i, m in enumerate(masks): pidx[m] = i
    NP = len(masks)
    sel = (lab >= 0) & (pidx >= 0)
    votes = np.bincount(lab[sel] * NP + pidx[sel], minlength=n * NP).reshape(n, NP)
    owner = np.where(votes.max(axis=1) > 0, votes.argmax(axis=1), -1)
    # an area one part clearly owns goes to it whole; a MIXED area (the outline
    # left no line between, say, a gland lobe and the band round it) keeps the
    # colour pass's own split inside it
    share = votes.max(axis=1) / np.maximum(votes.sum(axis=1), 1)
    mixed = share < spec.get("own_share", 0.85)
    owner[mixed] = -3
    # `own_areas`: [[x,y]...] — the WHOLE outline area at each point goes to
    # this part, whatever the colours say (an open sliver the vote gets wrong)
    for i, pp in enumerate(spec["parts"]):
        for x, y in pp.get("own_areas", []):
            if lab[y, x] >= 0: owner[lab[y, x]] = i
            else: raise SystemExit(f'{pp["name"]}: own_areas point {x},{y} is on a line')
    for e in edge: owner[e] = -2
    # an area that is mostly PAPER in the coloured picture is outside too, even
    # when vessels close it off from the edge (the gaps between the heart's
    # vessels) — else its neighbour swallows it
    pap = np.bincount(lab[lab >= 0], weights=paper[lab >= 0].astype(float), minlength=n)
    tot = np.bincount(lab[lab >= 0], minlength=n)
    owner[(pap / np.maximum(tot, 1)) > 0.5] = -2
    part = np.where(lab >= 0, owner[np.maximum(lab, 0)], -1)  # -1: line or unnamed, -2: outside
    mx = part == -3
    part[mx] = pidx[mx]  # -1 where the colour pass named nothing: filled from neighbours below
    # hand the lines (and any unnamed sliver) to the nearest named part
    for _ in range(60):
        todo = part == -1
        if not todo.any(): break
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            nb = np.full_like(part, -1)
            nb[max(dy, 0):H + min(dy, 0), max(dx, 0):W + min(dx, 0)] = part[max(-dy, 0):H + min(-dy, 0), max(-dx, 0):W + min(-dx, 0)]
            take = todo & (nb >= 0)
            part[take] = nb[take]
            todo &= ~take
    # `enclose`: a part owns everything it wraps round (a coiled gland's loops)
    for i, pp in enumerate(spec["parts"]):
        if pp.get("enclose"):
            inside = fill_holes(part == i, pp.get("enclose_max", 60000))
            part[inside] = i
    masks = [part == i for i in range(NP)]
    paper = part < 0
    np.save(os.path.join(here, f'{os.path.splitext(os.path.basename(spec_path))[0]}-parts.npy'), part)
    # the clean art: each area flat in its own average colour, ink blended on
    cnt = np.bincount(lab[lab >= 0], minlength=n).astype(float)
    flat = np.zeros((H, W, 3))
    for c in range(3):
        mean = np.bincount(lab[lab >= 0], weights=im[..., c][lab >= 0], minlength=n) / np.maximum(cnt, 1)
        flat[..., c] = np.where(lab >= 0, mean[np.maximum(lab, 0)], 0)
    # line pixels take the colour of the area they were handed to, then the ink
    near = flat.copy()
    for _ in range(6):
        hole = (lab < 0)
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            sh = np.roll(np.roll(near, dy, 0), dx, 1)
            shl = np.roll(np.roll(lab >= 0, dy, 0), dx, 1)
            near[hole & shl] = sh[hole & shl]
    INK = np.array(spec.get("ink", [62, 44, 38]))
    # solid ink, no anti-aliased blend: flat colours trace to a handful of
    # shapes; the blend made thousands (1 MB of art for the skin)
    LINEART = np.where(ink[..., None], INK, near)
    LINEART[part == -2] = 255
    print(f"  line art: {n} areas, {len(edge)} outside")

for p, m in zip(spec["parts"], masks):
    print(f'  {p["name"]:<22} {int(m.sum()):>7} px')
    if not m.any():
        raise SystemExit(f'{p["name"]}: nothing left for this part (claimed by earlier parts?)')

# ── crop: the picture's own box plus a small margin ──────────────────────
ys, xs = np.nonzero(~paper)
pad = int(0.015 * (ys.max() - ys.min()))
cx0, cy0 = max(xs.min() - pad, 0), max(ys.min() - pad, 0)
cx1, cy1 = min(xs.max() + pad + 1, W), min(ys.max() + pad + 1, H)
VW, VH = (cx1 - cx0) * SCALE, (cy1 - cy0) * SCALE

tmp = tempfile.mkdtemp()
path_re = re.compile(r'<path d="([^"]*)" fill="#([0-9A-Fa-f]{6})" transform="translate\(([-\d.]+),([-\d.]+)\)"/>')
tok_re = re.compile(r'[A-Za-z]|-?\d+(?:\.\d+)?')

def bake(d, tx, ty):
    """Absolute VTracer path (M/L/C/Z) → shifted into the crop, rounded to whole
    units, written RELATIVE (far shorter numbers). Points are rounded first and
    the deltas taken between rounded points, so rounding never accumulates."""
    toks = tok_re.findall(d)
    out, cmd, nums = [], None, []
    cur = start = (0, 0)
    last = [None]
    def flush():
        nonlocal cur, start
        if cmd is None: return
        pts = [(int(round(nums[i] + tx)), int(round(nums[i + 1] + ty))) for i in range(0, len(nums), 2)]
        step = 3 if cmd == "C" else 1
        for k in range(0, len(pts), step):
            grp = pts[k:k + step]
            letter = "m" if (cmd == "M" and k == 0) else ("c" if cmd == "C" else "l")
            # the FIRST move is absolute, so baked paths can be joined end to end
            base = (0, 0) if (letter == "m" and last[0] is None) else cur
            rel = " ".join(f"{x - base[0]} {y - base[1]}" for x, y in grp)
            if letter == "m" and last[0] is None: letter = "M"
            out.append((" " if letter == last[0] and letter != "m" else letter) + rel)
            last[0] = letter
            cur = grp[-1]
            if letter in "mM": start = cur
    for t in toks:
        if t.isalpha():
            flush(); nums = []
            cmd = t.upper()
            if cmd == "Z":
                out.append("z"); cur = start; cmd = None; last[0] = "z"
            continue
        nums.append(float(t))
    flush()
    return "".join(out).replace(" -", "-")

# "art": {"scale": 1, "median": 3, "speckle": 6, "precision": 6, "layer": 24} —
# a picture of fine lines (the skeleton) needs scale 3, median 0 and finer
# colour steps, or its outlines melt away. The art is traced at `scale` and
# shrunk back with one transform, so the parts' coordinates never change.
ART = {"scale": 1, "median": 3, "speckle": 6, "precision": 6, "layer": 24, **spec.get("art", {})}

def trace(png, mode):
    svg_out = os.path.join(tmp, "t.svg")
    if mode == "color":
        vtracer.convert_image_to_svg_py(png, svg_out, "color", "stacked", "spline",
                                        ART["speckle"], ART["precision"], ART["layer"], 60, 4.0, 10, 45, 1)
    else:
        vtracer.convert_image_to_svg_py(png, svg_out, "binary", "stacked", "spline", 4, 6, 16, 60, 4.0, 10, 45, 1)
    return [(m.group(1), m.group(2), float(m.group(3)), float(m.group(4)))
            for m in path_re.finditer(open(svg_out, encoding="utf-8").read())]

big = lambda a, resample: a.resize((W * SCALE, H * SCALE), resample)
off = lambda tx, ty: (tx - cx0 * SCALE, ty - cy0 * SCALE)

# the art: paper made transparent, then a colour trace
alpha = 255 - np.array(Image.fromarray(paper.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(3)))
# a median pass first: JPEG speckle would otherwise trace as hundreds of tiny shapes
# (at scale > 1 the median runs AFTER enlarging, so hairlines survive it)
AS = ART["scale"]
base = Image.fromarray(np.clip(LINEART, 0, 255).astype(np.uint8)) if LINEART is not None else src
rgb = base.resize((W * AS, H * AS), Image.NEAREST if LINEART is not None else Image.LANCZOS) if AS != 1 else base
if ART["median"]:
    rgb = rgb.filter(ImageFilter.MedianFilter(ART["median"]))
a = Image.fromarray(alpha.astype(np.uint8)).resize((W * AS, H * AS), Image.NEAREST) if AS != 1 else Image.fromarray(alpha.astype(np.uint8))
rgba = Image.fromarray(np.dstack([np.array(rgb), np.array(a)]), "RGBA")
art_png = os.path.join(tmp, "art.png")
rgba.save(art_png)
art = []
for d, fill, tx, ty in trace(art_png, "color"):
    r, g, b = (int(fill[i:i + 2], 16) for i in (0, 2, 4))
    if min(r, g, b) >= 238:
        continue  # leftover paper
    art.append(f'<path fill="#{fill.lower()}" d="{bake(d, tx - cx0 * AS, ty - cy0 * AS)}"/>')
if AS != 1:
    art = [f'<g transform="scale({1 / AS:.6g})">'] + art + ['</g>']

# each part: its mask traced to an outline
parts = []
for p, m in zip(spec["parts"], masks):
    png = os.path.join(tmp, "m.png")
    smooth = Image.fromarray(np.where(m, 0, 255).astype(np.uint8))
    big(smooth, Image.BILINEAR).point(lambda v: 0 if v < 128 else 255).convert("RGB").save(png)
    shape = "".join(bake(d, *off(tx, ty)) for d, fill, tx, ty in trace(png, "binary") if fill.lower() != "ffffff")
    yy, xx = np.nonzero(m)
    col = np.median(im[m], axis=0).astype(int)
    parts.append({
        "name": p["name"], "hint": p["hint"], "grade": p["grade"],
        "fill": "#%02x%02x%02x" % tuple(col),
        "cx": int(round((xx.mean() - cx0) * SCALE)), "cy": int(round((yy.mean() - cy0) * SCALE)),
        "shape": shape,
    })
    if p["name"].lower() in p["hint"].lower():
        raise SystemExit(f'clue names itself: {p["name"]}')

# a check sheet: every part's mask tinted over the picture
if spec.get("check"):
    sheet = Image.new("RGB", (W // 2 * 4, H // 2 * ((len(masks) + 3) // 4)), "white")
    for i, m in enumerate(masks):
        t = im.copy().astype(np.uint8) // 2 + 120
        t[m] = [230, 20, 60]
        tile = Image.fromarray(t.astype(np.uint8)).resize((W // 2, H // 2))
        ImageDraw.Draw(tile).text((6, 6), spec["parts"][i]["name"], fill=(0, 0, 0))
        sheet.paste(tile, ((i % 4) * (W // 2), (i // 4) * (H // 2)))
    sheet.save(os.path.join(here, spec["check"]))

credit = spec.get("credit")
rows = ",\n".join("  " + json.dumps(p, ensure_ascii=False) for p in parts)
js = f"""/* ═══════════════════════════════════════════════════════
   {spec["title"].upper()} — a RICH figure traced from {spec["src"]} by
   tools/figure-trace/trace.py ({os.path.basename(spec_path)} is the part list).
   GENERATED — edit the spec and re-run, never this file.

   SVG is the whole picture as colour shapes. Each part also carries its own
   outline (`shape`, same coordinates), so the game can dim everything but the
   real part, and the Puzzles figure jigsaw can lift it out as a piece.
   LAZY-LOADED — never import statically.
═══════════════════════════════════════════════════════ */

export const MAP_W = {VW};
export const MAP_H = {VH};
export const RICH = true;
{f"export const DISPLAY = {spec['display']};  // drawn at this share of the usual size" if spec.get("display") else ""}
{f"export const CREDIT = {json.dumps(credit)};" if credit else ""}
export const SVG = {json.dumps("".join(art))};

export const PARTS = [
{rows},
];

// Shaped like any other topic's words: the part NAME is the word, its
// description the clue, `g` tiers it by grade (topicPool filters on it).
export const GAME_PARTS = PARTS.map((c) => ({{ w: c.name, d: c.hint, g: c.grade, part: c }}));
"""
out = os.path.join(ROOT, spec["out"])
open(out, "w", encoding="utf-8", newline="\n").write(js)
print(f'wrote {spec["out"]}: {len(parts)} parts, {VW}x{VH}, art {len("".join(art)) // 1024} KB, '
      f'shapes {sum(len(p["shape"]) for p in parts) // 1024} KB')
