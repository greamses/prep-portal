"""List the light, enclosed regions of a masked RGBA picture (gaps the border
flood could not reach), biggest first, so the paper ones can be seeded."""
import sys
import numpy as np
from PIL import Image
from collections import deque

im = np.array(Image.open(sys.argv[1]))
rgb, a = im[..., :3].astype(int), im[..., 3]
light = (rgb.min(axis=2) >= 232) & ((rgb.max(axis=2) - rgb.min(axis=2)) <= 14) & (a > 0)
step = 2  # sample on a half grid: plenty to find regions of any size worth seeing
L = light[::step, ::step].copy()
H, W = L.shape
seen = np.zeros_like(L)
out = []
for y0, x0 in zip(*np.nonzero(L)):
    if seen[y0, x0]:
        continue
    q = deque([(y0, x0)]); seen[y0, x0] = True
    n = 0; ys = []; xs = []
    while q:
        y, x = q.popleft(); n += 1; ys.append(y); xs.append(x)
        for yy, xx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= yy < H and 0 <= xx < W and L[yy, xx] and not seen[yy, xx]:
                seen[yy, xx] = True; q.append((yy, xx))
    if n * step * step >= 300:
        i = len(ys) // 2
        out.append((n * step * step, min(xs) * step, min(ys) * step, max(xs) * step, max(ys) * step, xs[i] * step, ys[i] * step))
for o in sorted(out, reverse=True)[:40]:
    print("area %7d  box %4d,%4d-%4d,%4d  seed %d,%d" % o)
