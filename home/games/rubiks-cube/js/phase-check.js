/* =====================================================================
   phase-check.js — sticker-based predicates for attempt mode.

   Each check works in cubeGroup-local space using cubie.quaternion only,
   so whole-cube y/x/z rotations (which change cubeGroup.quaternion) do
   not affect the result. Checks are cumulative: e.g. checkSecondLayer
   implicitly verifies the first layer is done too.
   ===================================================================== */
import * as THREE from "three";
import { cubies } from "./scene.js";
import { WHITE, YELLOW, FACE_COLORS } from "./constants.js";

const GREEN = FACE_COLORS["0,0,1"];
const BLUE = FACE_COLORS["0,0,-1"];

const _v = new THREE.Vector3();

const isEdge   = (c) => c.userData.stickers.length === 2;
const isCorner = (c) => c.userData.stickers.length === 3;
const hasW     = (c) => c.userData.stickers.some((s) => s.color === WHITE);
const hasY     = (c) => c.userData.stickers.some((s) => s.color === YELLOW);

// Direction of a given sticker color in cubeGroup-local space.
function colorDir(c, color) {
  for (const s of c.userData.stickers)
    if (s.color === color)
      return _v.copy(s.dir).applyQuaternion(c.quaternion).clone();
  return null;
}

// Center colors keyed by cubeGroup-local face direction.
function centerColors() {
  const map = {};
  for (const c of cubies)
    if (c.userData.stickers.length === 1) {
      const s = c.userData.stickers[0];
      const d = new THREE.Vector3().copy(s.dir).applyQuaternion(c.quaternion).round();
      map[`${d.x},${d.y},${d.z}`] = s.color;
    }
  return map;
}

// True when every sticker on this piece faces a cell whose center is the same color.
function pieceInPlace(c, cc) {
  return c.userData.stickers.every((s) => {
    const d = new THREE.Vector3().copy(s.dir).applyQuaternion(c.quaternion).round();
    return cc[`${d.x},${d.y},${d.z}`] === s.color;
  });
}

/* ---- individual phase predicates ---- */

// White cross: all 4 white edge pieces have their white sticker facing −y.
export function checkCross() {
  const we = cubies.filter((c) => isEdge(c) && hasW(c));
  return we.length === 4 && we.every((c) => {
    const d = colorDir(c, WHITE);
    return d && Math.round(d.y) === -1;
  });
}

// First layer: cross done + all 4 white corners white-sticker facing −y.
export function checkFirstLayer() {
  if (!checkCross()) return false;
  const wc = cubies.filter((c) => isCorner(c) && hasW(c));
  return wc.length === 4 && wc.every((c) => {
    const d = colorDir(c, WHITE);
    return d && Math.round(d.y) === -1;
  });
}

// Count correctly placed F2L pairs (white corner + partner mid-edge, both in slot).
export function f2lPairsCorrect() {
  const cc = centerColors();
  let count = 0;
  for (const wc of cubies.filter((c) => isCorner(c) && hasW(c))) {
    const wd = colorDir(wc, WHITE);
    if (!wd || Math.round(wd.y) !== -1) continue;
    if (!pieceInPlace(wc, cc)) continue;
    const sideKey = wc.userData.stickers
      .filter((s) => s.color !== WHITE)
      .map((s) => s.color)
      .sort()
      .join(",");
    const midEdge = cubies.find((c) => {
      if (!isEdge(c) || hasW(c) || hasY(c)) return false;
      return c.userData.stickers.map((s) => s.color).sort().join(",") === sideKey;
    });
    if (midEdge && pieceInPlace(midEdge, cc)) count++;
  }
  return count;
}

// Second layer: first layer done + all 4 middle edges in place.
export function checkSecondLayer() {
  if (!checkFirstLayer()) return false;
  const cc = centerColors();
  const me = cubies.filter((c) => isEdge(c) && !hasW(c) && !hasY(c));
  return me.length === 4 && me.every((c) => pieceInPlace(c, cc));
}

// LL cross: second layer done + all 4 yellow edges yellow-sticker facing +y.
export function checkLLCross() {
  if (!checkSecondLayer()) return false;
  const ye = cubies.filter((c) => isEdge(c) && hasY(c));
  return ye.length === 4 && ye.every((c) => {
    const d = colorDir(c, YELLOW);
    return d && Math.round(d.y) === 1;
  });
}

// LL edges in place: LL cross + all yellow edge pieces in their correct slot.
export function checkLLEdges() {
  if (!checkLLCross()) return false;
  const cc = centerColors();
  return cubies.filter((c) => isEdge(c) && hasY(c)).every((c) => pieceInPlace(c, cc));
}

// OLL done: second layer + every yellow-sticker piece has yellow facing +y.
export function checkOLL() {
  if (!checkSecondLayer()) return false;
  return cubies.filter((c) => hasY(c)).every((c) => {
    const d = colorDir(c, YELLOW);
    return d && Math.round(d.y) === 1;
  });
}

// Fully solved: every face in cubeGroup space shows exactly one colour.
export function checkSolved() {
  const faces = {};
  const n = new THREE.Vector3();
  for (const c of cubies)
    for (const s of c.userData.stickers) {
      n.copy(s.dir).applyQuaternion(c.quaternion).round();
      const k = `${n.x},${n.y},${n.z}`;
      (faces[k] || (faces[k] = new Set())).add(s.color);
    }
  return Object.values(faces).every((set) => set.size === 1);
}

// The DF/DB line edges (white-green, white-blue) in place — ZZ EOLine minus
// the EO part, which isn't judgeable leniently from stickers alone.
export function checkLine() {
  const cc = centerColors();
  return cubies
    .filter((c) => {
      if (!isEdge(c) || !hasW(c)) return false;
      const other = c.userData.stickers.find((s) => s.color !== WHITE);
      return other && (other.color === GREEN || other.color === BLUE);
    })
    .every((c) => pieceInPlace(c, cc));
}

// All yellow corners oriented AND in their slots (Roux CMLL — edges ignored)
export function checkCMLL() {
  const cc = centerColors();
  return cubies
    .filter((c) => isCorner(c) && hasY(c))
    .every((c) => {
      const d = colorDir(c, YELLOW);
      return d && Math.round(d.y) === 1 && pieceInPlace(c, cc);
    });
}

// Master dispatcher — returns true when the learner has achieved the goal of
// the given phase. Intentionally lenient: white-facing-down is enough for
// the cross even if the edges are in the wrong columns.
export function phaseComplete(phaseId) {
  switch (phaseId) {
    case "cross":     return checkCross();
    case "corners":   return checkFirstLayer();
    case "middle":    return checkSecondLayer();
    case "f2l1":      return checkCross() && f2lPairsCorrect() >= 1;
    case "f2l2":      return checkCross() && f2lPairsCorrect() >= 2;
    case "f2l3":      return checkCross() && f2lPairsCorrect() >= 3;
    case "f2l4":      return checkSecondLayer();
    case "llcross":   return checkLLCross();
    case "lledges":   return checkLLEdges();
    case "llcorners": return checkSolved();
    case "oll":       return checkOLL();
    case "pll":       return checkSolved();
    // ZZ / Petrus / Roux block stages — lenient pair-count milestones
    case "eoline":    return checkLine();
    case "zzedges":   return checkCross();
    case "zzleft":    return f2lPairsCorrect() >= 2;
    case "zzright":   return checkSecondLayer();
    case "p222":      return f2lPairsCorrect() >= 1;
    case "p223":      return f2lPairsCorrect() >= 2;
    case "pright":    return checkSecondLayer();
    case "fb1":       return f2lPairsCorrect() >= 1;
    case "fb2":       return f2lPairsCorrect() >= 2;
    case "sb1":       return f2lPairsCorrect() >= 3;
    case "sb2":       return f2lPairsCorrect() >= 4;
    case "cmll":      return f2lPairsCorrect() >= 4 && checkCMLL();
    case "lse":       return checkSolved();
    default:          return checkSolved();
  }
}
