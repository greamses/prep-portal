#!/usr/bin/env python3
"""
Build an anatomy-inspired 3D model of the human heart and export it as a GLB.

Method
  1. Describe the heart as signed-distance primitives: ventricles, atria, the aorta,
     pulmonary trunk, venae cavae and pulmonary veins, blended with smooth unions.
  2. Carve the atrioventricular and interventricular grooves, add gentle surface
     irregularity so the muscle does not look like a plastic toy.
  3. Polygonise the field with marching cubes and smooth it (Taubin, shrink-free).
  4. Colour every vertex: muscle, arteries (red), veins (blue), epicardial fat in grooves.
  5. Sweep the coronary arteries and the great cardiac vein along the surface.

Units: the model is built in "anatomical units" (about 3 cm each) and exported in
metres, so the heart is roughly 0.12 m tall, close to life size.

Usage:  python3 build_heart.py ../models/heart.glb
Needs:  numpy, scikit-image, trimesh (scipy is pulled in by trimesh.smoothing).
"""
import sys
import numpy as np
import trimesh
from skimage import measure

OUT = sys.argv[1] if len(sys.argv) > 1 else "heart.glb"
RES = 0.028          # grid cell size in anatomical units
UNIT_TO_M = 0.030    # 1 anatomical unit -> metres
SMOOTH_K = 0.22      # smooth-union blend radius


# ---------------------------------------------------------------- SDF helpers
def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0.0, 1.0)
    return b * (1 - h) + a * h - k * h * (1 - h)


def smax(a, b, k):
    return -smin(-a, -b, k)


def sd_sphere(p, c, r):
    return np.linalg.norm(p - np.asarray(c, float), axis=-1) - r


def sd_capsule(p, a, b, r):
    a = np.asarray(a, float)
    b = np.asarray(b, float)
    ba = b - a
    pa = p - a
    h = np.clip((pa @ ba) / (ba @ ba), 0.0, 1.0)
    return np.linalg.norm(pa - h[..., None] * ba, axis=-1) - r


def sd_ellipsoid(p, c, r):
    """Approximate ellipsoid distance (Inigo Quilez)."""
    q = (p - np.asarray(c, float)) / np.asarray(r, float)
    k0 = np.linalg.norm(q, axis=-1)
    k1 = np.linalg.norm(q / np.asarray(r, float), axis=-1)
    return k0 * (k0 - 1.0) / np.maximum(k1, 1e-9)


def sd_round_cone(p, a, b, r1, r2):
    """Rounded cone from centre a (radius r1) to centre b (radius r2) - Inigo Quilez."""
    a = np.asarray(a, float)
    b = np.asarray(b, float)
    ba = b - a
    l2 = ba @ ba
    rr = r1 - r2
    a2 = l2 - rr * rr
    il2 = 1.0 / l2
    pa = p - a
    y = pa @ ba
    z = y - l2
    x = pa * l2 - ba * y[..., None]
    x2 = (x * x).sum(-1)
    y2 = y * y * l2
    z2 = z * z * l2
    k = np.sign(rr) * rr * rr * x2
    d_b = np.sqrt(x2 + z2) * il2 - r2
    d_a = np.sqrt(x2 + y2) * il2 - r1
    d_m = (np.sqrt(np.maximum(x2 * a2 * il2, 0.0)) + y * rr) * il2 - r1
    return np.where(np.sign(z) * a2 * z2 > k, d_b,
                    np.where(np.sign(y) * a2 * y2 < k, d_a, d_m))


# ------------------------------------------------------------ anatomy layout
# Axes: +x = patient's left (viewer's right when facing the front), +y = superior
# (base), -y = apex, +z = anterior (towards the viewer).
PARTS = {
    # ventricles (apex points down and to the patient's left)
    "LV":   lambda p: sd_round_cone(p, (0.28, 0.20, 0.02), (0.78, -1.80, 0.14), 1.02, 0.36),
    "RV":   lambda p: sd_round_cone(p, (-0.30, 0.05, 0.44), (0.36, -1.40, 0.50), 0.88, 0.30),
    # broad base where the ventricles meet the atria
    "BASE": lambda p: sd_ellipsoid(p, (-0.05, 0.45, -0.05), (1.10, 0.80, 0.85)),
    # atria
    "RA":   lambda p: sd_sphere(p, (-0.92, 0.72, -0.30), 0.62),
    "LA":   lambda p: sd_sphere(p, (0.10, 0.92, -0.72), 0.56),
    # great vessels (kept short and thick, as in life)
    "AO":   lambda p: sd_capsule(p, (0.02, 0.48, 0.12), (-0.12, 1.55, -0.18), 0.36),
    "PA":   lambda p: sd_capsule(p, (0.06, 0.42, 0.72), (0.52, 1.38, 0.36), 0.32),
    "SVC":  lambda p: sd_capsule(p, (-0.92, 1.05, -0.30), (-0.98, 1.75, -0.36), 0.30),
    "IVC":  lambda p: sd_capsule(p, (-0.86, -0.18, -0.34), (-0.78, -0.92, -0.56), 0.36),
    "PVL":  lambda p: sd_capsule(p, (0.40, 1.05, -0.92), (0.95, 1.22, -1.06), 0.18),
    "PVR":  lambda p: sd_capsule(p, (-0.20, 1.05, -0.98), (-0.72, 1.28, -1.08), 0.18),
}
VESSELS = {"AO", "PA", "SVC", "IVC", "PVL", "PVR"}


def groove_field(p):
    """Distance to the grooves that will be carved into the surface (fat-filled in life)."""
    ivg = sd_capsule(p, (0.36, 0.55, 1.02), (0.72, -1.50, 0.58), 0.10)   # anterior interventricular
    # atrioventricular (coronary) sulcus: a ring around the base, tilted towards the front
    c = p - np.array([0.0, 0.30, 0.05])
    ring = np.sqrt((np.sqrt(c[..., 0] ** 2 + c[..., 2] ** 2) - 1.00) ** 2 + (c[..., 1] * 1.2) ** 2) - 0.09
    return np.minimum(ivg, ring)


def sdf(p):
    d = None
    for fn in PARTS.values():
        dd = fn(p)
        d = dd if d is None else smin(d, dd, SMOOTH_K)
    # carve grooves
    d = smax(d, -(groove_field(p) - 0.0), 0.05)
    # gentle organic irregularity of the epicardium
    n = (0.010 * np.sin(6.1 * p[..., 0] + 1.3) * np.cos(7.7 * p[..., 1])
         + 0.008 * np.sin(9.3 * p[..., 2] + 0.4 * p[..., 0] - 2.0)
         + 0.004 * np.sin(17.0 * p[..., 1] + 11.0 * p[..., 2]))
    return d + n


# ---------------------------------------------------------- surface sampling
def gradient(p, eps=1e-3):
    g = np.zeros_like(p)
    for i in range(3):
        dp = np.zeros(3)
        dp[i] = eps
        g[..., i] = (sdf(p + dp) - sdf(p - dp)) / (2 * eps)
    return g / np.linalg.norm(g, axis=-1, keepdims=True)


def project_to_surface(p, iters=25):
    p = np.array(p, float)
    for _ in range(iters):
        d = sdf(p)
        p = p - d[..., None] * gradient(p)
    return p, gradient(p)


def catmull_path(ctrl, per_seg=14):
    ctrl = np.asarray(ctrl, float)
    pts = []
    for i in range(len(ctrl) - 1):
        p0 = ctrl[max(i - 1, 0)]
        p1 = ctrl[i]
        p2 = ctrl[i + 1]
        p3 = ctrl[min(i + 2, len(ctrl) - 1)]
        for t in np.linspace(0, 1, per_seg, endpoint=False):
            t2, t3 = t * t, t * t * t
            pts.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2
                              + (-p0 + 3 * p1 - 3 * p2 + p3) * t3))
    pts.append(ctrl[-1])
    return np.array(pts)


def surface_curve(ctrl, lift):
    """Snap a control polyline to the heart surface, lifted outwards by `lift`."""
    path = catmull_path(ctrl)
    surf, nrm = project_to_surface(path)
    return surf + nrm * lift[..., None] if np.ndim(lift) else surf + nrm * lift, nrm


def sweep_tube(points, radii, color, sides=10):
    """Tube along a polyline with parallel-transport frames and tapered radii."""
    pts = np.asarray(points, float)
    n = len(pts)
    tang = np.gradient(pts, axis=0)
    tang /= np.linalg.norm(tang, axis=1, keepdims=True)
    ref = np.array([0.0, 0.0, 1.0])
    if abs(tang[0] @ ref) > 0.9:
        ref = np.array([1.0, 0.0, 0.0])
    u = np.cross(tang[0], ref)
    u /= np.linalg.norm(u)
    verts = []
    for i in range(n):
        if i > 0:
            u = u - tang[i] * (u @ tang[i])
            u /= np.linalg.norm(u)
        v = np.cross(tang[i], u)
        for s in range(sides):
            a = 2 * np.pi * s / sides
            verts.append(pts[i] + radii[i] * (np.cos(a) * u + np.sin(a) * v))
    verts = np.array(verts)
    faces = []
    for i in range(n - 1):
        for s in range(sides):
            a0 = i * sides + s
            a1 = i * sides + (s + 1) % sides
            b0 = (i + 1) * sides + s
            b1 = (i + 1) * sides + (s + 1) % sides
            faces.append([a0, b0, a1])
            faces.append([a1, b0, b1])
    mesh = trimesh.Trimesh(verts, np.array(faces), process=False)
    mesh.visual.vertex_colors = to_gltf_colors(np.tile(np.asarray(color, float), (len(verts), 1)), len(verts))
    return mesh


# ------------------------------------------------------------ build body mesh
def build_body():
    xs = np.arange(-1.85, 1.95, RES)
    ys = np.arange(-2.25, 2.95, RES)
    zs = np.arange(-1.65, 1.45, RES)
    X, Y, Z = np.meshgrid(xs, ys, zs, indexing="ij")
    field = sdf(np.stack([X, Y, Z], -1).reshape(-1, 3)).reshape(X.shape)
    verts, faces, _, _ = measure.marching_cubes(field, level=0.0, spacing=(RES, RES, RES))
    verts += np.array([xs[0], ys[0], zs[0]])
    mesh = trimesh.Trimesh(verts, faces, process=True)
    trimesh.repair.fix_normals(mesh)
    trimesh.smoothing.filter_taubin(mesh, lamb=0.5, nu=-0.53, iterations=12)
    print(f"body: {len(mesh.faces)} faces, watertight={mesh.is_watertight}")
    return mesh


def to_gltf_colors(rgb, n):
    """glTF vertex colours are linear, so convert the sRGB values we author in."""
    lin = np.clip(rgb, 0, 1) ** 2.2
    return np.c_[lin * 255, np.full(n, 255)].round().astype(np.uint8)


def colour_body(mesh):
    V = mesh.vertices
    names = list(PARTS.keys())
    dists = np.stack([PARTS[k](V) for k in names], -1)
    owner = np.argmin(dists, -1)
    cols = np.zeros((len(V), 3))
    muscle = np.array([0.46, 0.10, 0.12])
    atrium = np.array([0.58, 0.24, 0.23])
    artery = np.array([0.80, 0.22, 0.18])
    vein = np.array([0.24, 0.38, 0.70])
    pulm = np.array([0.30, 0.42, 0.74])
    for i, k in enumerate(names):
        m = owner == i
        if k in ("AO",):
            cols[m] = artery
        elif k in ("PA",):
            cols[m] = pulm
        elif k in ("SVC", "IVC", "PVL", "PVR"):
            cols[m] = vein
        elif k in ("RA", "LA"):
            cols[m] = atrium
        else:
            cols[m] = muscle
    # epicardial fat in the grooves
    g = groove_field(V)
    fat = np.array([0.93, 0.78, 0.42])
    t = np.clip((0.13 - g) / 0.07, 0.0, 1.0)[:, None] * 0.85
    cols = cols * (1 - t) + fat * t
    mesh.visual.vertex_colors = to_gltf_colors(cols, len(V))
    return mesh


def build_coronaries():
    parts = []
    # left anterior descending artery: from the left main down the front to the apex
    lad_ctrl = [(0.20, 0.62, 0.92), (0.36, 0.20, 1.10), (0.50, -0.45, 1.10),
                (0.66, -1.00, 0.92), (0.80, -1.45, 0.62), (0.86, -1.68, 0.30)]
    lad, lad_n = surface_curve(lad_ctrl, 0.0)
    r = np.linspace(0.075, 0.035, len(lad))
    lad = lad + lad_n * (r * 0.55)[:, None]
    parts.append(sweep_tube(lad, r, (0.72, 0.10, 0.10)))

    # left circumflex: around the left atrioventricular groove
    lcx_ctrl = [(0.22, 0.52, 0.85), (0.80, 0.38, 0.62), (1.18, 0.22, 0.02),
                (1.00, 0.02, -0.66), (0.62, 0.02, -0.95)]
    lcx, lcx_n = surface_curve(lcx_ctrl, 0.0)
    r2 = np.linspace(0.060, 0.035, len(lcx))
    lcx = lcx + lcx_n * (r2 * 0.55)[:, None]
    parts.append(sweep_tube(lcx, r2, (0.72, 0.10, 0.10)))

    # right coronary artery: right atrioventricular groove, then down to the back
    rca_ctrl = [(-0.22, 0.60, 0.85), (-0.70, 0.30, 1.02), (-1.12, 0.18, 0.62),
                (-1.10, -0.02, 0.00), (-0.72, -0.48, -0.22), (-0.10, -0.72, -0.50)]
    rca, rca_n = surface_curve(rca_ctrl, 0.0)
    r3 = np.linspace(0.065, 0.035, len(rca))
    rca = rca + rca_n * (r3 * 0.55)[:, None]
    parts.append(sweep_tube(rca, r3, (0.72, 0.10, 0.10)))

    # great cardiac vein: runs alongside the LAD, blue
    gcv_ctrl = [(0.06, 0.40, -0.10), (0.50, 0.05, 0.20), (0.62, -0.60, 0.20),
                (0.74, -1.10, -0.02), (0.82, -1.50, -0.20)]
    gcv, gcv_n = surface_curve(gcv_ctrl, 0.0)
    r4 = np.linspace(0.07, 0.05, len(gcv))
    gcv = gcv + gcv_n * (r4 * 0.35)[:, None]
    parts.append(sweep_tube(gcv, r4, (0.22, 0.34, 0.68)))
    return parts


def main():
    body = colour_body(build_body())
    body.apply_scale(UNIT_TO_M)
    parts = [body]
    for m in build_coronaries():
        m.apply_scale(UNIT_TO_M)
        parts.append(m)

    scene = trimesh.Scene()
    names = ["myocardium_and_vessels", "coronary_artery_LAD", "coronary_artery_LCx",
             "coronary_artery_RCA", "great_cardiac_vein"]
    for name, m in zip(names, parts):
        scene.add_geometry(m, geom_name=name, node_name=name)
    scene.export(OUT)
    print("wrote", OUT, "bounds (m):", np.round(body.bounds, 3).tolist())


if __name__ == "__main__":
    main()
