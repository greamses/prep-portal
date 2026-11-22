"""Number the enclosed areas of a colouring outline, to decide which areas make
each part (outline-only tracing, see outline.py).

  python -P tools/figure-trace/areas.py src/skin-line.png out.png [seal] [zoom-box x0,y0,x1,y1]

Writes a picture with every area tinted and its number at its centre, and
`<outline>-areas.npy` (the area-number map) next to the outline.
"""
import sys, os
from collections import deque
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

src, out = sys.argv[1], sys.argv[2]
seal = int(sys.argv[3]) if len(sys.argv) > 3 else 1
box = [int(v) for v in sys.argv[4].split(",")] if len(sys.argv) > 4 else None

def label(path, seal):
    ln = np.array(Image.open(path).convert("L"))
    wall = np.array(Image.fromarray(ln).filter(ImageFilter.MinFilter(2 * seal + 1))) < 140 if seal else ln < 140
    H, W = wall.shape
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
    return ln, lab, n

if __name__ == "__main__":
    ln, lab, n = label(src, seal)
    np.save(os.path.splitext(src)[0] + "-areas.npy", lab)
    H, W = lab.shape
    rng = np.random.default_rng(7)
    pal = rng.integers(120, 250, size=(n, 3))
    img = np.where(lab[..., None] >= 0, pal[np.maximum(lab, 0)], 40).astype(np.uint8)
    pic = Image.fromarray(img)
    if box:
        pic = pic.crop(box)
        z = 3
        pic = pic.resize((pic.width * z, pic.height * z), Image.NEAREST)
    else:
        box, z = [0, 0, W, H], 1
    d = ImageDraw.Draw(pic)
    cnt = np.bincount(lab[lab >= 0], minlength=n)
    ys, xs = np.nonzero(lab >= 0)
    sx = np.bincount(lab[ys, xs], weights=xs, minlength=n) / np.maximum(cnt, 1)
    sy = np.bincount(lab[ys, xs], weights=ys, minlength=n) / np.maximum(cnt, 1)
    for i in range(n):
        if cnt[i] < (15 if z > 1 else 60): continue
        cx, cy = sx[i], sy[i]
        if not (box[0] <= cx < box[2] and box[1] <= cy < box[3]): continue
        # put the number ON the area (its centroid may fall outside a curved one)
        if lab[int(cy), int(cx)] != i:
            yy, xx = np.nonzero(lab == i); k = len(yy) // 2; cx, cy = xx[k], yy[k]
        d.text(((cx - box[0]) * z - 6, (cy - box[1]) * z - 5), str(i), fill=(0, 0, 0))
    pic.save(out)
    print(n, "areas")
