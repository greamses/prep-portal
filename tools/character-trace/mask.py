"""Make the white paper around a figure transparent, so the tracer never
draws it. Background = light pixels flood-filled from the border (plus any
extra seed points for enclosed gaps), grown by a couple of pixels so the
pale anti-aliased rim around the figure goes too."""
import sys
import numpy as np
from PIL import Image, ImageFilter
from collections import deque

src, out = sys.argv[1], sys.argv[2]
seeds = [tuple(int(v) for v in s.split(",")) for s in sys.argv[3:]]

im = np.array(Image.open(src).convert("RGB")).astype(int)
H, W, _ = im.shape
import os
LIM = int(os.environ.get("LIGHT", 232)); SAT = int(os.environ.get("SAT", 14)); GROW = int(os.environ.get("GROW", 5))
light = im.min(axis=2) >= LIM
# low saturation too, so pale blue hoodie / pale skin are not taken as paper
light &= (im.max(axis=2) - im.min(axis=2)) <= SAT

bg = np.zeros((H, W), bool)
q = deque()
for x in range(W):
    for y in (0, H - 1):
        if light[y, x]: q.append((y, x))
for y in range(H):
    for x in (0, W - 1):
        if light[y, x]: q.append((y, x))
for (x, y) in seeds:
    q.append((y, x))
while q:
    y, x = q.popleft()
    if bg[y, x] or not light[y, x]:
        continue
    bg[y, x] = True
    if y > 0: q.append((y - 1, x))
    if y < H - 1: q.append((y + 1, x))
    if x > 0: q.append((y, x - 1))
    if x < W - 1: q.append((y, x + 1))

# grow the background 2px into the pale rim
m = Image.fromarray((bg * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(GROW))
alpha = 255 - np.array(m)
rgba = np.dstack([im.astype(np.uint8), alpha.astype(np.uint8)])
Image.fromarray(rgba, "RGBA").save(out)
print("background", round(100 * (alpha == 0).mean(), 1), "%")
