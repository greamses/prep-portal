/* =====================================================================
   Off-screen thumbnail renderers — the little cube previews shown on the
   practice-state cards and on each algorithm card. Each renders a throwaway
   cube into its own WebGL context and returns a PNG data URL.
   ===================================================================== */
import * as THREE from "three";
import { BLACKOUT } from "./constants.js";
import { populateCube } from "./scene.js";
import { applyAlgoInstant } from "./engine.js";
import { invertMoves } from "./moves.js";

/* ---------- practice-state thumbnails ------------------------------- */
export function buildStateThumbs() {
  const r = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  });
  r.setPixelRatio(2);
  r.setSize(184, 184);

  const sc = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  cam.position.set(3.6, 3.9, 5.6);
  cam.lookAt(0, -0.15, 0);
  sc.add(new THREE.AmbientLight(0xffffff, 0.78));
  const dl = new THREE.DirectionalLight(0xffffff, 0.7);
  dl.position.set(5, 9, 6);
  sc.add(dl);

  const shot = (setup, key) => {
    const group = new THREE.Group();
    const arr = [];
    populateCube(group, arr);
    if (setup) applyAlgoInstant(arr, setup);
    if (key)
      arr.forEach((c) =>
        c.children.forEach((s) =>
          s.material.color.setHex(
            c.userData[key] ? s.userData.baseColor : BLACKOUT,
          ),
        ),
      );
    sc.add(group);
    r.render(sc, cam);
    sc.remove(group);
    return r.domElement.toDataURL("image/png");
  };

  const thumbs = {
    full: shot(null, null),
    cross: shot(null, "crossPiece"),
    first: shot(null, "firstLayerPiece"),
    second: shot(null, "secondLayerPiece"),
    oll: shot("R U R' U R U2 R'", "lastLayerPiece"),
    pll: shot("R U R' U' R' F R2 U' R' U' R U R' F'", "lastLayerPiece"),
  };

  r.dispose();
  return thumbs;
}

/* ---------- auto-solve phase thumbnails ----------------------------- *
   One clean stage diagram per solve phase (cross → … → solved), rendered the
   same way as the practice-state cards but with the piece set each phase
   leaves behind, so the auto-solve menu can show the same paper cards. */
export function buildSolveThumbs() {
  const r = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  });
  r.setPixelRatio(2);
  r.setSize(184, 184);

  const sc = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  cam.position.set(3.6, 3.9, 5.6);
  cam.lookAt(0, -0.15, 0);
  sc.add(new THREE.AmbientLight(0xffffff, 0.78));
  const dl = new THREE.DirectionalLight(0xffffff, 0.7);
  dl.position.set(5, 9, 6);
  sc.add(dl);

  // `show(cubie)` decides which pieces stay coloured; the rest go black.
  const shot = (setup, show) => {
    const group = new THREE.Group();
    const arr = [];
    populateCube(group, arr);
    if (setup) applyAlgoInstant(arr, setup);
    if (show)
      arr.forEach((c) =>
        c.children.forEach((s) =>
          s.material.color.setHex(show(c) ? s.userData.baseColor : BLACKOUT),
        ),
      );
    sc.add(group);
    r.render(sc, cam);
    sc.remove(group);
    return r.domElement.toDataURL("image/png");
  };

  const nStk = (c) => c.userData.stickers.length;
  // first two layers + the yellow cross (last-layer centre + edges, no corners)
  const upToCross = (c) =>
    c.userData.secondLayerPiece || (c.userData.lastLayerPiece && nStk(c) <= 2);

  const thumbs = {
    cross: shot(null, (c) => c.userData.crossPiece),
    first: shot(null, (c) => c.userData.firstLayerPiece),
    second: shot(null, (c) => c.userData.secondLayerPiece),
    // yellow cross formed but the edges aren't matched to the centres yet
    llcross: shot("R U' R U R U R U' R' U' R2", upToCross),
    // edges now lined up with their centres
    lledges: shot(null, upToCross),
    oll: shot("R U R' U R U2 R'", (c) => c.userData.lastLayerPiece),
    pll: shot("R U R' U' R' F R2 U' R' U' R U R' F'", (c) => c.userData.lastLayerPiece),
    full: shot(null, null),
  };

  r.dispose();
  return thumbs;
}

/* ---------- algorithm-card thumbnails ------------------------------- */
let _thumbCtx = null;
function thumbContext() {
  if (_thumbCtx) return _thumbCtx;
  const r = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  });
  r.setPixelRatio(2);
  r.setSize(140, 140);
  const sc = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  cam.position.set(3.6, 3.9, 5.6);
  cam.lookAt(0, -0.15, 0);
  sc.add(new THREE.AmbientLight(0xffffff, 0.78));
  const dl = new THREE.DirectionalLight(0xffffff, 0.7);
  dl.position.set(5, 9, 6);
  sc.add(dl);
  _thumbCtx = { r, sc, cam };
  return _thumbCtx;
}

export function renderThumb(algo, isSetup) {
  if (algo.thumb) return algo.thumb;
  const { r, sc, cam } = thumbContext();
  const group = new THREE.Group();
  const arr = [];
  populateCube(group, arr);
  sc.add(group);
  applyAlgoInstant(arr, isSetup ? invertMoves(algo.moves) : algo.moves);
  r.render(sc, cam);
  algo.thumb = r.domElement.toDataURL("image/png");
  sc.remove(group);
  return algo.thumb;
}
