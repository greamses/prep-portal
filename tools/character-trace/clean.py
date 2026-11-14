"""Tidy a VTracer SVG into a film character.

  * drops the near-white shapes that touch the canvas edge (the background)
  * rounds every number to `prec` decimals
  * crops to the figure with a small margin and writes a viewBox
    (no width/height, so the picture scales to whatever box holds it)
"""
import re, sys

src, out, prec, title = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4]
# extra shapes to drop, by their index in the source (enclosed background gaps, pale rims)
drop_idx = {int(v) for v in sys.argv[5].split(",")} if len(sys.argv) > 5 else set()
svg = open(src, encoding="utf-8").read()
W = float(re.search(r'width="([\d.]+)"', svg).group(1))
H = float(re.search(r'height="([\d.]+)"', svg).group(1))

path_re = re.compile(r'<path d="([^"]*)" fill="#([0-9A-Fa-f]{6})" transform="translate\(([-\d.]+),([-\d.]+)\)"/>')
num = re.compile(r'-?\d+(?:\.\d+)?')

def near_white(hexc, lim=238):
    r, g, b = (int(hexc[i:i + 2], 16) for i in (0, 2, 4))
    return min(r, g, b) >= lim

def fmt(v):
    s = f"{round(v, prec):.{prec}f}" if prec else str(int(round(v)))
    if "." in s:
        s = s.rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s

kept, dropped = [], 0
bx0 = by0 = 1e9
bx1 = by1 = -1e9
for idx, m in enumerate(path_re.finditer(svg)):
    if idx in drop_idx:
        dropped += 1
        continue
    d, fill, tx, ty = m.group(1), m.group(2), float(m.group(3)), float(m.group(4))
    vals = [float(v) for v in num.findall(d)]
    if len(vals) < 6:
        dropped += 1
        continue
    xs = [v + tx for v in vals[0::2]]
    ys = [v + ty for v in vals[1::2]]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    edge = x0 <= 1 or y0 <= 1 or x1 >= W - 1 or y1 >= H - 1
    if near_white(fill) and edge:
        dropped += 1
        continue
    # bake the translate into the coordinates: one less attribute per shape
    it = iter(vals)
    pts = []
    for x in it:
        y = next(it)
        pts.append((x + tx, y + ty))
    kept.append((d, fill.upper(), pts))
    bx0, by0, bx1, by1 = min(bx0, x0), min(by0, y0), max(bx1, x1), max(by1, y1)

total = len(path_re.findall(svg))
assert total == svg.count("<path"), "a path did not match the expected shape"

pad = 0.02 * (by1 - by0)
vx, vy = bx0 - pad, by0 - pad
vw, vh = (bx1 - bx0) + 2 * pad, (by1 - by0) + 2 * pad

body = []
for d, fill, pts in kept:
    cmds = re.findall(r'[A-Za-z]', d)
    # rebuild d with the shifted, rounded points, keeping the command letters
    # Relative commands: same drawing, much shorter numbers. Points are
    # rounded FIRST and the deltas taken between rounded points, so rounding
    # never accumulates along a long outline.
    tokens = re.findall(r'[A-Za-z]|-?\d+(?:\.\d+)?', d)
    q = 10 ** prec
    rp = [(round((x - vx) * q), round((y - vy) * q)) for x, y in pts]
    def n(v):
        return fmt(v / q)
    def pair(a, b):
        s = n(a) + ("" if n(b).startswith("-") else " ") + n(b)
        return s
    out_d, k, cur, start, last = [], 0, (0, 0), (0, 0), None
    cmd, buf = None, []
    for t in tokens:
        if t.isalpha():
            cmd = t.upper()
            if cmd == "Z":
                out_d.append("z"); cur = start; last = "z"
            continue
        buf.append(t)
        need = 6 if cmd == "C" else 2
        if len(buf) * 1 < need:
            continue
        group = rp[k:k + need // 2]; k += need // 2; buf = []
        if cmd == "M":
            x, y = group[0]
            out_d.append("m" + pair(x - cur[0], y - cur[1])); cur = start = (x, y); last = "l"
        else:
            letter = "c" if cmd == "C" else "l"
            parts = [pair(px - cur[0], py - cur[1]) for px, py in group]
            out_d.append(("" if last == letter else letter) + " ".join(parts) if last != letter else " " + " ".join(parts))
            cur = group[-1]; last = letter
    dd = re.sub(r" (-)", r"\1", "".join(out_d))
    body.append(f'<path fill="#{fill}" d="{dd}"/>')

res = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {fmt(vw)} {fmt(vh)}">'
       f'<title>{title}</title>\n' + "\n".join(body) + "\n</svg>\n")
open(out, "w", encoding="utf-8").write(res)
print(f"{out}: kept {len(kept)}/{total} (dropped {dropped} background), "
      f"viewBox {fmt(vw)}x{fmt(vh)}, {len(res)//1024} KB")
