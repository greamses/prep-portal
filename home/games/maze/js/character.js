/* ============================================================================
   3D Maze — player character (Mixamo GLB)
   ----------------------------------------------------------------------------
   Loads idle.glb as the rigged character, then imports the walk / run / strafe
   clips and retargets them onto the same skeleton (Mixamo bone names match, so
   Babylon's ImportAnimations binds by name). Exposes play(state) to switch the
   active clip. The controller (player.js) owns movement + facing.
   ========================================================================== */

const B = window.BABYLON;
const BASE = "/home/games/maze/assets/character/";
const NOSYNC = 3; // SceneLoaderAnimationGroupLoadingMode.NoSync

async function importClip(scene, file, name) {
  await B.SceneLoader.ImportAnimationsAsync(BASE, file, scene, false, NOSYNC);
  const g = scene.animationGroups[scene.animationGroups.length - 1];
  if (g) { g.name = name; g.stop(); }
  return g || null;
}

const TARGET_H = 1.7; // desired character height in world units

export async function loadCharacter(scene) {
  const res = await B.SceneLoader.ImportMeshAsync("", BASE, "idle.glb", scene);
  const root = res.meshes[0]; // __root__ (keeps the loader's RH→LH transform)

  // Mixamo GLBs import at wildly different scales — fit to a sane height.
  res.meshes.forEach((m) => m.computeWorldMatrix(true));
  let b = root.getHierarchyBoundingVectors(true);
  const h = Math.max(0.001, b.max.y - b.min.y);
  root.scaling.scaleInPlace(TARGET_H / h);
  res.meshes.forEach((m) => m.computeWorldMatrix(true));
  b = root.getHierarchyBoundingVectors(true);
  const footOffset = b.min.y - root.position.y; // feet relative to root origin

  const idle = res.animationGroups[0] || null;
  if (idle) idle.name = "idle";

  const groups = {
    idle,
    walk: await importClip(scene, "walk.glb", "walk"),
    run: await importClip(scene, "run.glb", "run"),
    strafeL: await importClip(scene, "strafe-left.glb", "strafeL"),
    strafeR: await importClip(scene, "strafe-right.glb", "strafeR"),
  };

  // stop everything, then settle on idle
  for (const k in groups) groups[k]?.stop();

  let current = null;
  function play(name) {
    const g = groups[name];
    if (!g || g === current) return;
    for (const k in groups) if (groups[k] && groups[k] !== g) groups[k].stop();
    g.start(true, 1.0, g.from, g.to, false);
    current = g;
  }
  play("idle");

  return { root, groups, play, footOffset, ok: true };
}

/** Fallback placeholder if the GLB fails to load — keeps the game playable. */
export function placeholderCharacter(scene) {
  const root = B.MeshBuilder.CreateCapsule("playerModel", { height: 1.7, radius: 0.35 }, scene);
  const mat = new B.StandardMaterial("playerMat", scene);
  mat.diffuseColor = B.Color3.FromHexString("#6fb7e8");
  root.material = mat;
  return { root, groups: {}, play() {}, footOffset: -0.85, ok: false };
}
