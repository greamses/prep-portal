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

/** Remove ALL root motion: pin the Hips position to its first key so the clip
 *  has zero translation (animates fully IN PLACE); code drives movement. This
 *  stops the "extra step / backtrack / past the wall" drift. */
function stripRootMotion(group) {
  if (!group) return;
  for (const ta of group.targetedAnimations) {
    const name = (ta.target && ta.target.name) || "";
    if (/hips/i.test(name) && /position/i.test(ta.animation.targetProperty || "")) {
      const keys = ta.animation.getKeys();
      if (keys.length) {
        const v0 = keys[0].value.clone();
        for (const k of keys) k.value = v0.clone();
      }
    }
  }
}

const TARGET_H = 1.7; // desired character height in world units

export async function loadCharacter(scene) {
  // base.glb = the skinned character (mesh + skeleton + its idle clip).
  const res = await B.SceneLoader.ImportMeshAsync("", BASE, "base.glb", scene);

  // Guard: if a mesh-less ("Without Skin") file was supplied, use the placeholder.
  const hasGeo = res.meshes.some((m) => (m.getTotalVertices?.() || 0) > 0);
  if (!hasGeo) {
    res.meshes.forEach((m) => m.dispose());
    res.skeletons?.forEach((s) => s.dispose());
    res.animationGroups?.forEach((g) => g.dispose());
    throw new Error("animation-only GLB (no mesh) — export the character With Skin");
  }

  const root = res.meshes[0]; // __root__ (keeps the loader's RH→LH transform)

  // Mixamo GLBs import at wildly different scales — fit to a sane height.
  res.meshes.forEach((m) => m.computeWorldMatrix(true));
  let b = root.getHierarchyBoundingVectors(true);
  const h = Math.max(0.001, b.max.y - b.min.y);
  root.scaling.scaleInPlace(TARGET_H / h);
  res.meshes.forEach((m) => m.computeWorldMatrix(true));
  b = root.getHierarchyBoundingVectors(true);
  const footOffset = b.min.y - root.position.y; // feet relative to root origin

  // base.glb's built-in clip is just a T-pose — drop it and use the real idle
  // clip (retargeted from the anim-only file), like walk/run.
  res.animationGroups.forEach((g) => { g.stop(); g.dispose(); });

  const groups = {
    idle: await importClip(scene, "idle.glb", "idle"),
    walk: await importClip(scene, "walk.glb", "walk"),
    run: await importClip(scene, "run.glb", "run"),
    strafeL: await importClip(scene, "strafe-left.glb", "strafeL"),
    strafeR: await importClip(scene, "strafe-right.glb", "strafeR"),
  };

  // animate in place (no root drift), then settle on idle
  for (const k in groups) stripRootMotion(groups[k]);
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

/** Low-poly humanoid placeholder (feet at the root origin), used until a real
 *  skinned character GLB is supplied. Built facing +Z (visor marks the front). */
export function placeholderCharacter(scene) {
  const root = new B.TransformNode("playerModel", scene);
  const body = new B.StandardMaterial("pcBody", scene);
  body.diffuseColor = B.Color3.FromHexString("#6fb7e8");
  body.specularColor = new B.Color3(0.12, 0.12, 0.14);
  const dark = new B.StandardMaterial("pcDark", scene);
  dark.diffuseColor = B.Color3.FromHexString("#33405e");
  const skin = new B.StandardMaterial("pcSkin", scene);
  skin.diffuseColor = B.Color3.FromHexString("#e7b48a");

  const part = (mesh, mat, x, y, z) => { mesh.material = mat; mesh.position.set(x, y, z); mesh.parent = root; return mesh; };
  part(B.MeshBuilder.CreateCapsule("t", { height: 0.7, radius: 0.22 }, scene), body, 0, 1.05, 0);   // torso
  part(B.MeshBuilder.CreateSphere("h", { diameter: 0.34 }, scene), skin, 0, 1.55, 0);                // head
  part(B.MeshBuilder.CreateBox("v", { width: 0.2, height: 0.07, depth: 0.06 }, scene), dark, 0, 1.57, 0.16); // visor (front)
  part(B.MeshBuilder.CreateCapsule("aL", { height: 0.6, radius: 0.08 }, scene), body, -0.3, 1.05, 0); // arms
  part(B.MeshBuilder.CreateCapsule("aR", { height: 0.6, radius: 0.08 }, scene), body, 0.3, 1.05, 0);
  part(B.MeshBuilder.CreateCapsule("lL", { height: 0.7, radius: 0.1 }, scene), dark, -0.12, 0.4, 0);  // legs
  part(B.MeshBuilder.CreateCapsule("lR", { height: 0.7, radius: 0.1 }, scene), dark, 0.12, 0.4, 0);
  return { root, groups: {}, play() {}, footOffset: 0, ok: false };
}
