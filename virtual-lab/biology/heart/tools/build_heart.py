#!/usr/bin/env python3
"""
Build an anatomy-inspired, take-apart 3D model of the human heart.

Outputs
  heart.glb        One mesh per part, in "anatomical units" under a node named
                   "heart" whose scale converts units to metres (1 unit = 3 cm,
                   so the heart is about 12 cm from apex to base, near life size).
  heart.meta.json  Labels and descriptions for every part, the explode direction
                   of each part, and the data the viewer needs to build the valves
                   and chordae (annulus centres, axes, radii, papillary tips).

Method
  1. Every part is a signed-distance shape: ventricles, atria, auricles, the aorta
     and its arch branches, the pulmonary trunk and arteries, venae cavae and
     pulmonary veins. Their smooth union is the outside of the heart.
  2. Chambers and vessel lumens are subtracted, so walls have real thickness and a
     cross-section shows the cavities, septum and openings for the valves.
  3. The solid is partitioned between the parts (each point belongs to the part it
     is nearest to), so the pieces interlock exactly when assembled.
  4. A coarse first pass finds where neighbouring parts meet on the surface. Those
     lines become the interventricular and atrioventricular grooves, which are
     carved, filled with fat and used as paths for the coronary vessels.
  5. Each part is polygonised with marching cubes and coloured per vertex: outer
     surface, inner lining (endocardium / lumen), or cut face between parts.

Usage:  python3 build_heart.py ../models/heart.glb ../models/heart.meta.json
Needs:  numpy, scikit-image, trimesh
"""
import json
import sys
import time

import numpy as np
import trimesh
from skimage import measure

OUT_GLB = sys.argv[1] if len(sys.argv) > 1 else "heart.glb"
OUT_META = sys.argv[2] if len(sys.argv) > 2 else "heart.meta.json"
RES = 0.03          # fine grid cell (units)
COARSE = 0.05       # first-pass grid cell used to find the grooves
UNIT_TO_M = 0.03    # 1 unit = 3 cm
LO = np.array([-1.65, -2.25, -2.15])
HI = np.array([1.75, 3.15, 1.80])
F = np.float32
T0 = time.time()


def log(msg):
    print(f"[{time.time() - T0:6.1f}s] {msg}", flush=True)


# ------------------------------------------------------------------ SDF helpers
def v3(a):
    return np.asarray(a, F)


def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0.0, 1.0)
    return b * (1 - h) + a * h - k * h * (1 - h)


def smax(a, b, k):
    return -smin(-a, -b, k)


def sd_sphere(p, c, r):
    return np.linalg.norm(p - v3(c), axis=-1) - F(r)


def sd_capsule(p, a, b, r):
    a, b = v3(a), v3(b)
    ba = b - a
    pa = p - a
    h = np.clip((pa @ ba) / F(ba @ ba), 0.0, 1.0)
    return np.linalg.norm(pa - h[:, None] * ba, axis=-1) - F(r)


def sd_polyline(p, pts, r):
    d = None
    for a, b in zip(pts[:-1], pts[1:]):
        dd = sd_capsule(p, a, b, r)
        d = dd if d is None else np.minimum(d, dd)
    return d


def sd_round_cone(p, a, b, r1, r2):
    """Rounded cone from centre a (radius r1) to centre b (radius r2) - Inigo Quilez."""
    a, b = v3(a), v3(b)
    ba = b - a
    l2 = F(ba @ ba)
    rr = F(r1 - r2)
    a2 = l2 - rr * rr
    il2 = F(1.0) / l2
    pa = p - a
    y = pa @ ba
    z = y - l2
    x = pa * l2 - ba * y[:, None]
    x2 = (x * x).sum(-1)
    y2 = y * y * l2
    z2 = z * z * l2
    k = np.sign(rr) * rr * rr * x2
    d_b = np.sqrt(x2 + z2) * il2 - F(r2)
    d_a = np.sqrt(x2 + y2) * il2 - F(r1)
    d_m = (np.sqrt(np.maximum(x2 * a2 * il2, 0.0)) + y * rr) * il2 - F(r1)
    return np.where(np.sign(z) * a2 * z2 > k, d_b, np.where(np.sign(y) * a2 * y2 < k, d_a, d_m))


def sd_ellipsoid(p, c, r):
    r = v3(r)
    q = (p - v3(c)) / r
    k0 = np.linalg.norm(q, axis=-1)
    k1 = np.linalg.norm(q / r, axis=-1)
    return k0 * (k0 - 1.0) / np.maximum(k1, 1e-6)


def extend(a, b, length):
    a, b = np.asarray(a, float), np.asarray(b, float)
    d = b - a
    return tuple(b + d / np.linalg.norm(d) * length)


def nrm(v):
    v = np.asarray(v, float)
    return v / np.linalg.norm(v)


# --------------------------------------------------------------- anatomy layout
# Axes: +x = patient's left (viewer's right from the front), +y = up (base),
# -y = apex, +z = anterior (towards the viewer).
LV_B, LV_A = (0.28, 0.20, 0.02), (0.78, -1.80, 0.14)
LVC_B, LVC_A = (0.30, 0.18, 0.02), (0.70, -1.45, 0.12)
RV_B, RV_A = (-0.40, 0.05, 0.55), (0.36, -1.40, 0.50)
RVOT_A, RVOT_B = (-0.30, 0.30, 0.95), (0.10, 0.62, 1.00)
RA_C, LA_C = (-0.92, 0.72, -0.30), (0.10, 0.92, -0.72)
AO_ROOT, AO_TOP = (0.05, 0.55, 0.25), (-0.05, 1.45, 0.10)
ARCH = [AO_TOP, (0.05, 1.95, -0.25), (0.40, 2.08, -0.85), (0.35, 1.70, -1.50)]
DESC = [(0.35, 1.70, -1.50), (0.30, 0.35, -1.68)]
PT = [RVOT_B, (0.40, 1.40, 0.30)]
LPA = [(0.40, 1.40, 0.30), (1.10, 1.48, -0.30)]
RPA = [(0.40, 1.40, 0.30), (0.25, 1.45, -0.35), (-0.30, 1.50, -0.62), (-0.95, 1.45, -0.90)]
SVC = [(-0.92, 1.05, -0.30), (-0.95, 2.05, -0.35)]
IVC = [(-0.88, 0.30, -0.32), (-0.78, -0.95, -0.56)]
BCT = [(0.03, 1.95, -0.25), (-0.38, 2.75, -0.28)]
LCCA = [(0.22, 2.05, -0.55), (0.20, 2.85, -0.58)]
LSA = [(0.40, 2.03, -0.95), (0.62, 2.80, -1.08)]
PV = {
    "pv_left_superior": [(0.40, 1.12, -1.02), (1.02, 1.42, -1.28)],
    "pv_left_inferior": [(0.40, 0.78, -1.05), (1.02, 0.72, -1.38)],
    "pv_right_superior": [(-0.22, 1.12, -1.05), (-0.82, 1.40, -1.32)],
    "pv_right_inferior": [(-0.22, 0.78, -1.05), (-0.82, 0.72, -1.38)],
}
TRI_TARGET = (-0.65, -0.05, 0.65)
# atrioventricular plane: the ventricles are trimmed here and the valves sit on it
AV_P0 = np.array([-0.10, 0.50, 0.00])
AV_N = nrm((-0.10, 1.0, -0.15))


def av_plane(p, offset=0.0):
    return (p - v3(AV_P0)) @ v3(AV_N) - F(offset)


def d_lv(p):
    return smax(sd_round_cone(p, LV_B, LV_A, 1.02, 0.36), av_plane(p), 0.22)


def d_rv_raw(p):
    body = smax(sd_round_cone(p, RV_B, RV_A, 0.88, 0.30), av_plane(p), 0.22)
    return np.minimum(body, sd_capsule(p, RVOT_A, RVOT_B, 0.34))


def poly(pts, r):
    return lambda p: sd_polyline(p, pts, r)


# Outer shape of every part (also used for the smooth union of the outside)
SHAPES = {
    "left_ventricle": d_lv,
    "right_ventricle": d_rv_raw,
    "right_atrium": lambda p: sd_sphere(p, RA_C, 0.62),
    "right_auricle": lambda p: sd_ellipsoid(p, (-0.55, 0.98, 0.42), (0.36, 0.22, 0.30)),
    "left_atrium": lambda p: sd_sphere(p, LA_C, 0.56),
    "left_auricle": lambda p: sd_ellipsoid(p, (0.62, 1.02, -0.12), (0.32, 0.18, 0.32)),
    "ascending_aorta": lambda p: sd_capsule(p, AO_ROOT, AO_TOP, 0.34),
    "aortic_arch": poly(ARCH, 0.32),
    "descending_aorta": poly(DESC, 0.30),
    "brachiocephalic_trunk": poly(BCT, 0.17),
    "left_common_carotid": poly(LCCA, 0.12),
    "left_subclavian": poly(LSA, 0.13),
    "pulmonary_trunk": poly(PT, 0.33),
    "left_pulmonary_artery": poly(LPA, 0.22),
    "right_pulmonary_artery": poly(RPA, 0.22),
    "superior_vena_cava": poly(SVC, 0.28),
    "inferior_vena_cava": poly(IVC, 0.34),
    **{k: poly(v, 0.15) for k, v in PV.items()},
}
NAMES = list(SHAPES.keys())
BASE = lambda p: sd_ellipsoid(p, (-0.05, 0.45, -0.05), (1.10, 0.80, 0.85))


def own_dist(name, p, cache=None):
    """Distance used to decide which part owns a point. The right ventricle wraps
    the left one, so the septum is given to the left ventricle."""
    if name == "right_ventricle":
        dlv = cache["left_ventricle"] if cache is not None else d_lv(p)
        return np.maximum(d_rv_raw(p), -dlv)
    return SHAPES[name](p)


def lumen(p, pts, r, overshoot):
    """Bore along a vessel's own axis, running past its free end so the cut end is open."""
    return sd_polyline(p, pts[:-1] + [extend(pts[-2], pts[-1], overshoot)], r)


def cavity(p):
    lvc = smax(sd_round_cone(p, LVC_B, LVC_A, 0.62, 0.12), av_plane(p, -0.14), 0.15)
    rvs = smax(sd_round_cone(p, RV_B, RV_A, 0.75, 0.17), av_plane(p, -0.14), 0.15)
    rvc = np.minimum(np.maximum(rvs, -d_lv(p)), sd_capsule(p, RVOT_A, RVOT_B, 0.22))
    parts = [
        lvc, rvc,
        sd_sphere(p, RA_C, 0.50),
        sd_sphere(p, LA_C, 0.45),
        sd_capsule(p, LA_C, LVC_B, 0.26),                 # mitral opening
        sd_capsule(p, RA_C, TRI_TARGET, 0.24),            # tricuspid opening
        sd_capsule(p, (0.24, 0.12, 0.08), AO_ROOT, 0.24),  # left ventricular outflow
        sd_capsule(p, AO_ROOT, AO_TOP, 0.26),
        sd_polyline(p, ARCH, 0.24),
        sd_capsule(p, DESC[0], extend(*DESC, 0.40), 0.22),
        sd_capsule(p, BCT[0], extend(*BCT, 0.30), 0.11),
        sd_capsule(p, LCCA[0], extend(*LCCA, 0.30), 0.075),
        sd_capsule(p, LSA[0], extend(*LSA, 0.30), 0.08),
        sd_capsule(p, *PT, 0.25),
        sd_capsule(p, LPA[0], extend(*LPA, 0.30), 0.15),
        sd_polyline(p, RPA[:-1] + [extend(RPA[-2], RPA[-1], 0.30)], 0.15),
        sd_capsule(p, RA_C, SVC[0], 0.21),
        lumen(p, SVC, 0.21, 0.40),
        sd_capsule(p, RA_C, IVC[0], 0.26),
        lumen(p, IVC, 0.26, 0.40),
    ]
    for pts in PV.values():
        parts.append(sd_capsule(p, LA_C, pts[0], 0.09))
        parts.append(lumen(p, pts, 0.09, 0.30))
    d = parts[0]
    for q in parts[1:]:
        d = np.minimum(d, q)
    return d


def outer_raw(p):
    d = BASE(p)
    for fn in SHAPES.values():
        d = smin(d, fn(p), 0.16)
    return d


GROOVES = []  # filled after the coarse pass: list of (N,3) polylines on the surface


def groove_dist(p):
    if not GROOVES:
        return np.full(len(p), 9.0, F)
    d = None
    for path in GROOVES:
        dd = sd_polyline(p, [tuple(x) for x in path], 0.0)
        d = dd if d is None else np.minimum(d, dd)
    return d


def outer(p):
    d = outer_raw(p)
    if GROOVES:
        d = smax(d, -(groove_dist(p) - F(0.055)), 0.04)
    n = (0.010 * np.sin(6.1 * p[:, 0] + 1.3) * np.cos(7.7 * p[:, 1])
         + 0.008 * np.sin(9.3 * p[:, 2] + 0.4 * p[:, 0] - 2.0)
         + 0.004 * np.sin(17.0 * p[:, 1] + 11.0 * p[:, 2]))
    return d + n.astype(F)


def chunked(fn, P, size=400_000):
    out = [fn(P[i:i + size]) for i in range(0, len(P), size)]
    return np.concatenate(out)


def grid(res):
    xs = np.arange(LO[0], HI[0], res, dtype=F)
    ys = np.arange(LO[1], HI[1], res, dtype=F)
    zs = np.arange(LO[2], HI[2], res, dtype=F)
    X, Y, Z = np.meshgrid(xs, ys, zs, indexing="ij")
    return (xs, ys, zs), np.stack([X, Y, Z], -1).reshape(-1, 3)


# --------------------------------------------------------- surface utilities
def gradient(fn, p, eps=1e-3):
    p = np.asarray(p, F)
    g = np.zeros_like(p)
    for i in range(3):
        dp = np.zeros(3, F)
        dp[i] = eps
        g[:, i] = (fn(p + dp) - fn(p - dp)) / (2 * eps)
    return g / np.maximum(np.linalg.norm(g, axis=-1, keepdims=True), 1e-9)


def project(fn, p, iters=30):
    p = np.asarray(p, F).copy()
    for _ in range(iters):
        p = p - fn(p)[:, None] * gradient(fn, p)
    return p, gradient(fn, p)


def resample(path, n):
    path = np.asarray(path, float)
    seg = np.linalg.norm(np.diff(path, axis=0), axis=1)
    s = np.r_[0, np.cumsum(seg)]
    t = np.linspace(0, s[-1], n)
    return np.stack([np.interp(t, s, path[:, i]) for i in range(3)], -1)


def smooth(path, passes=3):
    path = np.asarray(path, float)
    for _ in range(passes):
        q = path.copy()
        q[1:-1] = 0.25 * path[:-2] + 0.5 * path[1:-1] + 0.25 * path[2:]
        path = q
    return path


def binned(points, key, nbins=14, min_count=3):
    k = key(points)
    edges = np.linspace(k.min(), k.max(), nbins + 1)
    out = []
    for a, b in zip(edges[:-1], edges[1:]):
        m = (k >= a) & (k <= b)
        if m.sum() >= min_count:
            out.append(points[m].mean(0))
    return np.array(out)


def mesh_from_field(field, origin, res):
    if field.min() >= 0:
        return None
    verts, faces, _, _ = measure.marching_cubes(field, level=0.0, spacing=(res, res, res))
    m = trimesh.Trimesh(verts + origin, faces, process=True)
    trimesh.repair.fix_normals(m)
    return m


# ------------------------------------------------------------- 1. coarse pass
log("coarse pass: finding the grooves between parts")
(cx, cy, cz), PC = grid(COARSE)
fc = chunked(outer_raw, PC).reshape(len(cx), len(cy), len(cz))
coarse = mesh_from_field(fc, np.array([cx[0], cy[0], cz[0]]), COARSE)
V = np.asarray(coarse.vertices, F)
N = np.asarray(coarse.vertex_normals)
D = np.stack([SHAPES[k](V) for k in NAMES], -1)
D[:, NAMES.index("right_ventricle")] = np.maximum(D[:, NAMES.index("right_ventricle")], -D[:, NAMES.index("left_ventricle")])
order = np.argsort(D, axis=1)
first, second = order[:, 0], order[:, 1]
gap = np.take_along_axis(D, order[:, 1:2], 1)[:, 0] - np.take_along_axis(D, order[:, :1], 1)[:, 0]
I = {k: i for i, k in enumerate(NAMES)}


def boundary(a_set, b_set, extra=None):
    a_idx = [I[a] for a in a_set]
    b_idx = [I[b] for b in b_set]
    m = (((np.isin(first, a_idx) & np.isin(second, b_idx)) | (np.isin(first, b_idx) & np.isin(second, a_idx)))
         & (gap < 0.06))
    if extra is not None:
        m &= extra
    return V[m]


ant = boundary(["left_ventricle"], ["right_ventricle"], (N[:, 2] > 0.25) & (V[:, 1] < 0.45))
post = boundary(["left_ventricle"], ["right_ventricle"], (N[:, 2] < 0.10) & (V[:, 1] < 0.35))
r_av = boundary(["right_ventricle"], ["right_atrium", "right_auricle", "inferior_vena_cava"])
l_av = boundary(["left_ventricle"], ["left_atrium", "left_auricle", "pv_left_inferior"])
log(f"groove points: anterior {len(ant)}, posterior {len(post)}, right AV {len(r_av)}, left AV {len(l_av)}")

paths = {}
if len(ant) > 10:
    paths["ant"] = smooth(binned(ant, lambda q: -q[:, 1]))
if len(post) > 10:
    paths["post"] = smooth(binned(post, lambda q: -q[:, 1]))
if len(r_av) > 10:
    paths["rav"] = smooth(binned(r_av, lambda q: np.arctan2(-(q[:, 0] + 0.2), q[:, 2])))
if len(l_av) > 10:
    paths["lav"] = smooth(binned(l_av, lambda q: np.arctan2(q[:, 0] + 0.2, q[:, 2])))
# bin averages of a curved line can sit inside the wall: snap them back onto the surface
for key in paths:
    paths[key] = project(outer_raw, resample(paths[key], 40))[0].astype(float)
GROOVES = [resample(p, 40) for p in paths.values()]
log("grooves: " + ", ".join(f"{k}={len(v)}" for k, v in paths.items()))

# --------------------------------------------------------------- 2. fine pass
log("fine pass: sampling the heart")
(xs, ys, zs), P = grid(RES)
shape3 = (len(xs), len(ys), len(zs))
origin = np.array([xs[0], ys[0], zs[0]])
OUT = chunked(outer, P)
CAV = chunked(cavity, P)
SOLID = np.maximum(OUT, -CAV)

# leak check: the lining of a cavity must not touch the outside, except at the
# open ends of the cut vessels
OPEN_ENDS = [extend(*DESC, 0.0), extend(*BCT, 0.0), extend(*LCCA, 0.0), extend(*LSA, 0.0),
             extend(*LPA, 0.0), RPA[-1], extend(*SVC, 0.0), extend(*IVC, 0.0)] + [v[-1] for v in PV.values()]
near_end = np.zeros(len(P), bool)
for e in OPEN_ENDS:
    near_end |= np.linalg.norm(P - v3(e), axis=1) < 0.7
# a hole means a cavity reaches outside the body somewhere other than a cut vessel end
leak = (CAV < 0) & (OUT > 0) & ~near_end
log(f"leak check: {int(leak.sum())} suspicious voxels")
if leak.sum():
    lp = P[leak]
    log("  e.g. " + "; ".join(str(np.round(x, 2).tolist()) for x in lp[:: max(1, len(lp) // 6)][:6]))

log("partitioning the solid between parts")
MIN1 = np.full(len(P), np.inf, F)
MIN2 = np.full(len(P), np.inf, F)
ARG = np.zeros(len(P), np.int8)
LVD = chunked(d_lv, P)
for i, k in enumerate(NAMES):
    d = LVD if k == "left_ventricle" else chunked(lambda q, k=k: own_dist(k, q), P)
    better = d < MIN1
    MIN2 = np.where(better, MIN1, np.minimum(MIN2, d))
    MIN1 = np.where(better, d, MIN1)
    ARG = np.where(better, np.int8(i), ARG)

# ----------------------------------------------------------- 3. colours
C = {
    "muscle": (0.46, 0.10, 0.12), "atrium": (0.56, 0.22, 0.22), "auricle": (0.52, 0.17, 0.18),
    "artery": (0.80, 0.22, 0.18), "pv": (0.74, 0.24, 0.22), "pa": (0.30, 0.42, 0.74),
    "vc": (0.24, 0.38, 0.70), "endo": (0.74, 0.40, 0.40), "cut": (0.80, 0.46, 0.44),
    "fat": (0.93, 0.78, 0.42), "papillary": (0.58, 0.18, 0.19),
    "coronary": (0.72, 0.10, 0.10), "cardiac_vein": (0.22, 0.34, 0.68),
}
GROUP = {
    "left_ventricle": "muscle", "right_ventricle": "muscle", "right_atrium": "atrium",
    "left_atrium": "atrium", "right_auricle": "auricle", "left_auricle": "auricle",
    "ascending_aorta": "artery", "aortic_arch": "artery", "descending_aorta": "artery",
    "brachiocephalic_trunk": "artery", "left_common_carotid": "artery", "left_subclavian": "artery",
    "pulmonary_trunk": "pa", "left_pulmonary_artery": "pa", "right_pulmonary_artery": "pa",
    "superior_vena_cava": "vc", "inferior_vena_cava": "vc",
    **{k: "pv" for k in PV},
}


def mix(a, b, t):
    return np.asarray(a) * (1 - t) + np.asarray(b) * t


def to_gltf_colors(rgb):
    """glTF vertex colours are linear; the palette above is authored in sRGB."""
    lin = np.clip(rgb, 0, 1) ** 2.2
    return np.c_[lin * 255, np.full(len(lin), 255)].round().astype(np.uint8)


def colour_piece(mesh, name):
    v = np.asarray(mesh.vertices, F)
    o = outer(v)
    c = -cavity(v)
    cache = {"left_ventricle": d_lv(v)}
    d_self = own_dist(name, v, cache)
    others = np.full(len(v), np.inf, F)
    for k in NAMES:
        if k != name:
            dk = cache["left_ventricle"] if k == "left_ventricle" else own_dist(k, v, cache)
            others = np.minimum(others, dk)
    r = d_self - others
    kind = np.argmax(np.stack([o, c, r], -1), -1)  # which term made this surface
    base = np.asarray(C[GROUP[name]])
    lining = C["endo"] if GROUP[name] in ("muscle", "atrium", "auricle") else mix(base, (1, 1, 1), 0.3)
    cols = np.tile(base, (len(v), 1))
    cols[kind == 1] = lining
    cols[kind == 2] = C["cut"]
    if GROOVES:
        g = groove_dist(v)
        t = (np.clip((0.13 - g) / 0.07, 0, 1) * 0.85 * (kind == 0))[:, None]
        cols = cols * (1 - t) + np.asarray(C["fat"]) * t
    mesh.visual.vertex_colors = to_gltf_colors(cols)
    return mesh


# ---------------------------------------------------------- 4. part meshes
pieces = {}
SOLID3 = SOLID.reshape(shape3)
for i, k in enumerate(NAMES):
    own = (ARG == i)
    if not own.any():
        log(f"  {k}: owns nothing, skipped")
        continue
    d_i = LVD if k == "left_ventricle" else chunked(lambda q, k=k: own_dist(k, q), P)
    r = np.where(own, d_i - MIN2, d_i - MIN1).reshape(shape3)
    field = np.maximum(SOLID3, r)
    idx = np.argwhere(field < 0)
    if len(idx) == 0:
        log(f"  {k}: empty after hollowing, skipped")
        continue
    lo = np.maximum(idx.min(0) - 2, 0)
    hi = np.minimum(idx.max(0) + 3, np.array(shape3))
    sub = np.pad(field[lo[0]:hi[0], lo[1]:hi[1], lo[2]:hi[2]], 1, constant_values=1.0)
    m = mesh_from_field(sub, origin + (lo - 1) * RES, RES)
    pieces[k] = colour_piece(m, k)
    log(f"  {k}: {len(m.faces)} faces")

# --------------------------------------------------------- 5. coronary vessels
def surface_path(points, n=60):
    pts = resample(points, n)
    pts, nm = project(outer, pts)
    return smooth(pts, 2), nm


def tube(points, r0, r1, colour, sides=10):
    pts, nrm_out = surface_path(points)
    radii = np.linspace(r0, r1, len(pts))
    pts = pts + nrm_out * (radii * 0.55)[:, None]
    tang = np.gradient(pts, axis=0)
    tang /= np.linalg.norm(tang, axis=1, keepdims=True)
    ref = np.array([0.0, 1.0, 0.0]) if abs(tang[0][1]) < 0.9 else np.array([1.0, 0.0, 0.0])
    u = nrm(np.cross(tang[0], ref))
    verts = []
    for i in range(len(pts)):
        if i:
            u = nrm(u - tang[i] * (u @ tang[i]))
        w = np.cross(tang[i], u)
        for s in range(sides):
            a = 2 * np.pi * s / sides
            verts.append(pts[i] + radii[i] * (np.cos(a) * u + np.sin(a) * w))
    faces = []
    n = len(pts)
    for i in range(n - 1):
        for s in range(sides):
            a0, a1 = i * sides + s, i * sides + (s + 1) % sides
            b0, b1 = a0 + sides, a1 + sides
            faces += [[a0, b0, a1], [a1, b0, b1]]
    verts.append(pts[0])
    verts.append(pts[-1])
    c0, c1 = len(verts) - 2, len(verts) - 1
    for s in range(sides):
        faces.append([c0, (s + 1) % sides, s])
        faces.append([c1, (n - 1) * sides + s, (n - 1) * sides + (s + 1) % sides])
    m = trimesh.Trimesh(np.array(verts), np.array(faces), process=True)
    trimesh.repair.fix_normals(m)
    m.visual.vertex_colors = to_gltf_colors(np.tile(np.asarray(colour, float), (len(m.vertices), 1)))
    return m


def offset_path(path, delta):
    return np.asarray(path) + np.asarray(delta)


log("coronary vessels")
tubes = {}
ao_left = np.array(AO_ROOT) + np.array([0.30, 0.05, 0.05])
ao_right = np.array(AO_ROOT) + np.array([-0.22, 0.05, 0.22])
if "ant" in paths:
    lad = resample(paths["ant"], 30)
    tubes["left_main_coronary_artery"] = tube([ao_left, (ao_left + lad[0]) / 2, lad[0]], 0.075, 0.07, C["coronary"])
    tubes["left_anterior_descending_artery"] = tube(lad, 0.065, 0.03, C["coronary"])
    k = int(len(lad) * 0.3)
    tubes["diagonal_branch"] = tube([lad[k], lad[k] + np.array([0.25, -0.35, -0.05]), np.array([1.05, -0.75, 0.45])], 0.045, 0.022, C["coronary"])
    tubes["anterior_interventricular_vein"] = tube(offset_path(lad[::-1], (0.11, 0.0, -0.02)), 0.045, 0.06, C["cardiac_vein"])
if "lav" in paths and "ant" in paths:
    lav = resample(paths["lav"], 40)
    start = np.argmin(np.linalg.norm(lav - lad[0], axis=1))
    lcx = np.vstack([lad[:1], lav[start:]])
    tubes["left_circumflex_artery"] = tube(lcx, 0.06, 0.03, C["coronary"])
    cs = offset_path(lav[start:], (0.0, 0.09, 0.0))
    cs = np.vstack([cs, [(-0.45, 0.32, -0.70)]])
    tubes["great_cardiac_vein_and_coronary_sinus"] = tube(cs, 0.06, 0.11, C["cardiac_vein"])
if "rav" in paths:
    rav = resample(paths["rav"], 40)
    rca = np.vstack([[ao_right], rav])
    if "post" in paths:
        tubes["posterior_descending_artery"] = tube(resample(paths["post"], 30), 0.045, 0.025, C["coronary"])
        rca = np.vstack([rca, resample(paths["post"], 30)[:1]])
    tubes["right_coronary_artery"] = tube(rca, 0.07, 0.04, C["coronary"])
if "post" in paths:
    tubes["middle_cardiac_vein"] = tube(offset_path(resample(paths["post"], 30)[::-1], (0.10, 0.0, 0.0)), 0.04, 0.055, C["cardiac_vein"])
for k, m in tubes.items():
    log(f"  {k}: {len(m.faces)} faces")

# ------------------------------------------------------- 6. valves and papillary muscles
def plane_hit(a, b):
    a, b = np.asarray(a, float), np.asarray(b, float)
    t = AV_N @ (AV_P0 - a) / (AV_N @ (b - a))
    return a + t * (b - a)


def wall_point(cav_fn, start, direction, inset=0.08):
    p = np.asarray(start, float)
    d = nrm(direction)
    for _ in range(400):
        if cav_fn(p[None].astype(F))[0] > 0:
            return p + d * inset
        p = p + d * 0.01
    return p


def lv_cav(p):
    return smax(sd_round_cone(p, LVC_B, LVC_A, 0.62, 0.12), av_plane(p, -0.14), 0.15)


def rv_cav(p):
    rvs = smax(sd_round_cone(p, RV_B, RV_A, 0.75, 0.17), av_plane(p, -0.14), 0.15)
    return np.maximum(rvs, -d_lv(p))


mitral_c = plane_hit(LA_C, LVC_B)
tric_c = plane_hit(RA_C, TRI_TARGET)
VALVES = [
    {"name": "mitral_valve", "type": "av", "center": mitral_c, "axis": nrm(np.subtract(LVC_B, LA_C)),
     "radius": 0.25, "ref": np.subtract(AO_ROOT, mitral_c), "sectors": [160, 200], "depth": [1.0, 0.92]},
    {"name": "tricuspid_valve", "type": "av", "center": tric_c, "axis": nrm(np.subtract(TRI_TARGET, RA_C)),
     "radius": 0.23, "ref": (0.0, 0.0, 1.0), "sectors": [130, 110, 120], "depth": [1.0, 0.95, 0.95]},
    {"name": "aortic_valve", "type": "semilunar", "center": np.asarray(AO_ROOT), "axis": nrm(np.subtract(AO_TOP, AO_ROOT)),
     "radius": 0.24, "ref": (0.0, 0.0, 1.0), "sectors": [120, 120, 120], "depth": [1.0, 1.0, 1.0]},
    {"name": "pulmonary_valve", "type": "semilunar", "center": np.asarray(RVOT_B), "axis": nrm(np.subtract(PT[1], RVOT_B)),
     "radius": 0.22, "ref": (0.0, 1.0, 0.0), "sectors": [120, 120, 120], "depth": [1.0, 1.0, 1.0]},
]

lv_mid = np.array([0.54, -0.80, 0.08])
rv_mid = np.array([-0.75, -0.40, 0.75])
PAPS = [
    ("papillary_muscle_anterolateral", "mitral_valve", lv_cav, lv_mid, (0.70, 0.0, 0.70), mitral_c, "left_ventricle"),
    ("papillary_muscle_posteromedial", "mitral_valve", lv_cav, lv_mid, (-0.15, 0.0, -1.0), mitral_c, "left_ventricle"),
    ("papillary_muscle_right_anterior", "tricuspid_valve", rv_cav, rv_mid, (-0.6, -0.3, 0.5), tric_c, "right_ventricle"),
    ("papillary_muscle_right_posterior", "tricuspid_valve", rv_cav, rv_mid + np.array([0.15, 0.1, -0.15]), (-0.5, -0.6, -0.3), tric_c, "right_ventricle"),
]
pap_meta = []
log("papillary muscles")
for name, valve, cav_fn, start, direction, target, host in PAPS:
    base = wall_point(cav_fn, start, direction)
    tip = base + 0.42 * (np.asarray(target) - base)
    lo = np.minimum(base, tip) - 0.25
    hi = np.maximum(base, tip) + 0.25
    gx = np.arange(lo[0], hi[0], RES / 1.5, dtype=F)
    gy = np.arange(lo[1], hi[1], RES / 1.5, dtype=F)
    gz = np.arange(lo[2], hi[2], RES / 1.5, dtype=F)
    G = np.stack(np.meshgrid(gx, gy, gz, indexing="ij"), -1).reshape(-1, 3)
    f = smin(sd_round_cone(G, base, tip, 0.12, 0.05), sd_sphere(G, tip, 0.065), 0.04).reshape(len(gx), len(gy), len(gz))
    m = mesh_from_field(np.pad(f, 1, constant_values=1.0), np.array([gx[0], gy[0], gz[0]]) - RES / 1.5, RES / 1.5)
    m.visual.vertex_colors = to_gltf_colors(np.tile(np.asarray(C["papillary"]), (len(m.vertices), 1)))
    pieces[name] = m
    GROUP[name] = "papillary"
    pap_meta.append({"name": name, "valve": valve, "tip": np.round(tip, 4).tolist(), "host": host})
    log(f"  {name}: {len(m.faces)} faces")

# ------------------------------------------------------------- 7. explode + meta
all_v = np.vstack([m.vertices for m in pieces.values()])
centre = all_v.mean(0)
explode = {}
for k, m in pieces.items():
    if k.startswith("papillary"):
        continue
    d = m.vertices.mean(0) - centre
    explode[k] = nrm(d) * 0.55 + d * 0.55
for pm in pap_meta:
    explode[pm["name"]] = explode[pm["host"]]
for k, m in tubes.items():
    mid = m.vertices.mean(0)
    host = min((n for n in NAMES if n in pieces), key=lambda n: float(own_dist(n, mid[None].astype(F))[0]))
    explode[k] = explode[host] + nrm(mid - pieces[host].vertices.mean(0)) * 0.25

LABELS = {
    "left_ventricle": ("Left ventricle", "Pumps oxygen-rich blood through the aortic valve to the whole body. Its wall is the thickest in the heart."),
    "right_ventricle": ("Right ventricle", "Pumps oxygen-poor blood through the pulmonary valve to the lungs."),
    "right_atrium": ("Right atrium", "Collects oxygen-poor blood from the body through the venae cavae."),
    "right_auricle": ("Right auricle", "A small ear-shaped pouch of the right atrium."),
    "left_atrium": ("Left atrium", "Collects oxygen-rich blood from the lungs through the pulmonary veins."),
    "left_auricle": ("Left auricle", "A small ear-shaped pouch of the left atrium."),
    "ascending_aorta": ("Ascending aorta", "Carries blood up from the left ventricle. The coronary arteries branch from its root."),
    "aortic_arch": ("Aortic arch", "Curves over the pulmonary arteries and sends branches to the head and arms."),
    "descending_aorta": ("Descending aorta", "Carries blood down to the chest and abdomen."),
    "brachiocephalic_trunk": ("Brachiocephalic trunk", "First branch of the arch. Supplies the right arm, head and neck."),
    "left_common_carotid": ("Left common carotid artery", "Supplies the left side of the head and neck."),
    "left_subclavian": ("Left subclavian artery", "Supplies the left arm."),
    "pulmonary_trunk": ("Pulmonary trunk", "Carries oxygen-poor blood from the right ventricle towards the lungs."),
    "left_pulmonary_artery": ("Left pulmonary artery", "Carries oxygen-poor blood to the left lung."),
    "right_pulmonary_artery": ("Right pulmonary artery", "Carries oxygen-poor blood to the right lung, passing behind the aorta."),
    "superior_vena_cava": ("Superior vena cava", "Returns blood from the head, neck and arms to the right atrium."),
    "inferior_vena_cava": ("Inferior vena cava", "Returns blood from the lower body to the right atrium."),
    "pv_left_superior": ("Left superior pulmonary vein", "Brings oxygen-rich blood from the left lung to the left atrium."),
    "pv_left_inferior": ("Left inferior pulmonary vein", "Brings oxygen-rich blood from the left lung to the left atrium."),
    "pv_right_superior": ("Right superior pulmonary vein", "Brings oxygen-rich blood from the right lung to the left atrium."),
    "pv_right_inferior": ("Right inferior pulmonary vein", "Brings oxygen-rich blood from the right lung to the left atrium."),
    "left_main_coronary_artery": ("Left main coronary artery", "Short trunk from the aorta that splits into the anterior descending and circumflex arteries."),
    "left_anterior_descending_artery": ("Left anterior descending artery", "Runs down the front groove. Feeds the front of the heart and most of the septum."),
    "diagonal_branch": ("Diagonal branch", "A branch of the anterior descending artery over the left ventricle."),
    "left_circumflex_artery": ("Left circumflex artery", "Curves round the left side in the groove between atrium and ventricle."),
    "right_coronary_artery": ("Right coronary artery", "Runs round the right side in the groove between atrium and ventricle."),
    "posterior_descending_artery": ("Posterior descending artery", "Runs down the back groove between the ventricles."),
    "anterior_interventricular_vein": ("Anterior interventricular vein", "Drains the front of the heart, beside the anterior descending artery."),
    "great_cardiac_vein_and_coronary_sinus": ("Great cardiac vein and coronary sinus", "Collects blood from the heart muscle and empties it into the right atrium."),
    "middle_cardiac_vein": ("Middle cardiac vein", "Drains the back of the ventricles, beside the posterior descending artery."),
    "papillary_muscle_anterolateral": ("Papillary muscle (anterolateral)", "Pulls on the chordae so the mitral valve does not flip back into the atrium."),
    "papillary_muscle_posteromedial": ("Papillary muscle (posteromedial)", "Pulls on the chordae so the mitral valve does not flip back into the atrium."),
    "papillary_muscle_right_anterior": ("Papillary muscle (right anterior)", "Anchors the tricuspid valve through its chordae."),
    "papillary_muscle_right_posterior": ("Papillary muscle (right posterior)", "Anchors the tricuspid valve through its chordae."),
    "mitral_valve": ("Mitral valve", "Two leaflets between the left atrium and left ventricle. Open while the ventricle fills."),
    "tricuspid_valve": ("Tricuspid valve", "Three leaflets between the right atrium and right ventricle. Open while the ventricle fills."),
    "aortic_valve": ("Aortic valve", "Three cusps at the root of the aorta. Open while the left ventricle pumps."),
    "pulmonary_valve": ("Pulmonary valve", "Three cusps at the root of the pulmonary trunk. Open while the right ventricle pumps."),
    "chordae_tendineae": ("Chordae tendineae", "Heart strings that tie the valve leaflets to the papillary muscles."),
}

meta = {
    "unitToMetre": UNIT_TO_M,
    "parts": {
        k: {"label": LABELS[k][0], "description": LABELS[k][1], "group": GROUP.get(k, "coronary" if "vein" not in k and "sinus" not in k else "cardiac_vein"),
            "explode": np.round(explode[k], 4).tolist()}
        for k in list(pieces) + list(tubes)
    },
    "valves": [
        {"name": v["name"], "label": LABELS[v["name"]][0], "description": LABELS[v["name"]][1], "type": v["type"],
         "center": np.round(v["center"], 4).tolist(), "axis": np.round(v["axis"], 4).tolist(), "radius": v["radius"],
         "ref": np.round(nrm(v["ref"]), 4).tolist(), "sectors": v["sectors"], "depth": v["depth"]}
        for v in VALVES
    ],
    "papillary": pap_meta,
    "chordae": {"label": LABELS["chordae_tendineae"][0], "description": LABELS["chordae_tendineae"][1]},
}

# ------------------------------------------------------------------ 8. export
scene = trimesh.Scene()
scene.graph.update(frame_from=scene.graph.base_frame, frame_to="heart", matrix=np.diag([UNIT_TO_M] * 3 + [1.0]))
for k, m in list(pieces.items()) + list(tubes.items()):
    scene.add_geometry(m, geom_name=k, node_name=k, parent_node_name="heart")
scene.export(OUT_GLB)
with open(OUT_META, "w") as fh:
    json.dump(meta, fh, indent=1)
total = sum(len(m.faces) for m in list(pieces.values()) + list(tubes.values()))
log(f"wrote {OUT_GLB} ({len(pieces)} parts, {len(tubes)} vessels, {total} faces) and {OUT_META}")
