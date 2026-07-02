/* ============================================================================
   Bearing Courier — mission / drop pads
   ----------------------------------------------------------------------------
   The delivery loop: pick up a carton at BASE, fly the quoted bearing + distance
   to a drop pad hidden among the houses, drop it, then fly BACK to base for the
   next one. The pad is deliberately low-profile (no beacon) and does NOT appear
   on the radar — the pilot must fly the bearing/distance to find it.

   spawn(fromBase) drops a new pad at a random bearing + distance from base,
   nudged into a gap between houses, and remembers the required bearing.
   status(dronePos) reports live distance + whether a drop is possible now.
   dropCarton() leaves a carton on the ground where it was delivered.
   ========================================================================== */

import { CFG } from "./config.js";
import { bearingFromTo, planarDist } from "./bearing.js";

const B = window.BABYLON;

export function createMission(scene) {
  const houses = (scene.metadata && scene.metadata.houses) || [];

  // low landing marker: a flat ring + a corner-cross, sits on the ground and is
  // only easy to spot once you're close / overhead (houses hide it from afar)
  const pad = B.MeshBuilder.CreateTorus("pad", { diameter: CFG.padRadius * 2, thickness: 0.8, tessellation: 28 }, scene);
  pad.rotation.x = Math.PI / 2;
  const pmat = new B.StandardMaterial("padMat", scene);
  pmat.diffuseColor = B.Color3.FromHexString(CFG.pad);
  pmat.emissiveColor = B.Color3.FromHexString(CFG.pad).scale(0.5);
  pmat.specularColor = new B.Color3(0, 0, 0);
  pad.material = pmat;

  const marker = B.MeshBuilder.CreateCylinder("padDot", { diameter: 2.2, height: 0.5, tessellation: 20 }, scene);
  marker.material = pmat;
  marker.parent = pad;
  marker.position.set(0, 0, 0);
  marker.rotation.x = -Math.PI / 2;

  let targetNumber = 0;

  /** Pick a numbered house in the distance band from base and drop the pad in
      its front yard (offset toward base so the drone lands beside, not on, it).
      The house's door-number is the clue; the pad marks the exact spot. */
  function spawn(fromBase) {
    const inBand = houses.filter((h) => {
      const d = planarDist(fromBase.x, fromBase.z, h.x, h.z);
      return d >= CFG.padMinDist && d <= CFG.padMaxDist;
    });
    const pool = inBand.length ? inBand : houses;
    const house = pool[(Math.random() * pool.length) | 0];

    // offset the pad from the house centre toward base → lands in the yard
    const toBase = Math.atan2(fromBase.x - house.x, fromBase.z - house.z);
    const off = house.r + CFG.padRadius + 1;
    const x = house.x + Math.sin(toBase) * off;
    const z = house.z + Math.cos(toBase) * off;

    pad.position.set(x, 0.4, z);
    targetNumber = house.number;
    const requiredBearing = bearingFromTo(fromBase.x, fromBase.z, x, z);
    const distanceM = Math.round(planarDist(fromBase.x, fromBase.z, x, z) * CFG.metresPerUnit);
    return { requiredBearing, distanceM, houseNumber: house.number };
  }

  /** Live state relative to the drone; also whether a drop is possible now. */
  function status(dronePos) {
    const d = planarDist(dronePos.x, dronePos.z, pad.position.x, pad.position.z);
    const overPad = d <= CFG.padRadius;
    const lowEnough = dronePos.y <= CFG.landAlt;
    return {
      distanceM: Math.round(d * CFG.metresPerUnit),
      overPad,
      delivered: overPad && lowEnough,
    };
  }

  /** Leave a carton on the ground at the current pad (a delivered marker). */
  function dropCarton() {
    const c = B.MeshBuilder.CreateBox("dropped", { width: 2.4, height: 1.8, depth: 2.4 }, scene);
    c.position.set(pad.position.x, 0.9, pad.position.z);
    c.rotation.y = Math.random() * 0.6 - 0.3;
    c.material = cartonMat(scene);
  }

  function pulse(t) {
    const g = 0.35 + 0.25 * (0.5 + 0.5 * Math.sin(t * 0.005));
    pmat.emissiveColor = B.Color3.FromHexString(CFG.pad).scale(g);
    pad.rotation.y += 0.01;
  }

  return {
    pad,
    spawn,
    status,
    dropCarton,
    pulse,
    get targetNumber() { return targetNumber; },
  };
}

/** Shared kraft-brown carton material (taped look via emissive tint). */
export function cartonMat(scene) {
  const m = new B.StandardMaterial("carton", scene);
  m.diffuseColor = B.Color3.FromHexString("#b7844e");
  m.emissiveColor = B.Color3.FromHexString("#7a5a34").scale(0.25);
  m.specularColor = new B.Color3(0, 0, 0);
  return m;
}
