/* ============================================================================
   3D Maze — rigged characters (Mixamo GLB)
   ----------------------------------------------------------------------------
   loadRig() loads a skinned base mesh, retargets the (anim-only) clip files onto
   its skeleton by bone name, strips root motion (animate in place), auto-fits
   the height and reports the foot offset. loadCharacter (Medea) and loadZombie
   (Yaku) are thin wrappers. play(state) switches the active clip.
   ========================================================================== */

const B = window.BABYLON;
const NOSYNC = 3; // SceneLoaderAnimationGroupLoadingMode.NoSync

async function importClip(scene, dir, file, name, converter) {
  await B.SceneLoader.ImportAnimationsAsync(dir, file, scene, false, NOSYNC, converter);
  const g = scene.animationGroups[scene.animationGroups.length - 1];
  if (g) { g.name = name; g.stop(); }
  return g || null;
}

/** Pin the Hips position to its first key → zero translation (animate in place). */
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

async function loadRig(scene, dir, meshFile, clipFiles, targetH) {
  const res = await B.SceneLoader.ImportMeshAsync("", dir, meshFile, scene);

  const hasGeo = res.meshes.some((m) => (m.getTotalVertices?.() || 0) > 0);
  if (!hasGeo) {
    res.meshes.forEach((m) => m.dispose());
    res.skeletons?.forEach((s) => s.dispose());
    res.animationGroups?.forEach((g) => g.dispose());
    throw new Error("animation-only GLB (no mesh)");
  }

  const root = res.meshes[0];
  res.meshes.forEach((m) => m.computeWorldMatrix(true));
  let bb = root.getHierarchyBoundingVectors(true);
  const hgt = Math.max(0.001, bb.max.y - bb.min.y);
  root.scaling.scaleInPlace(targetH / hgt);
  res.meshes.forEach((m) => m.computeWorldMatrix(true));
  bb = root.getHierarchyBoundingVectors(true);
  const footOffset = bb.min.y - root.position.y;

  // drop the base file's built-in clip (often a T-pose), use retargeted clips
  res.animationGroups.forEach((g) => { g.stop(); g.dispose(); });

  // Map the base skeleton's nodes by name so imported clips retarget onto the
  // VISIBLE mesh (without this the clip animates orphan nodes → T-pose / glide).
  const nodeMap = {};
  (res.transformNodes || []).forEach((n) => { if (n && n.name) nodeMap[n.name] = n; });
  const sk = res.skeletons && res.skeletons[0];
  if (sk) sk.bones.forEach((b) => {
    const tn = b.getTransformNode && b.getTransformNode();
    if (tn && tn.name) nodeMap[tn.name] = tn;
  });
  const converter = (target) => (target && nodeMap[target.name]) || target;

  const groups = {};
  for (const name of Object.keys(clipFiles)) {
    groups[name] = await importClip(scene, dir, clipFiles[name], name, converter);
  }
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
  play(Object.keys(clipFiles)[0]);

  return { root, groups, play, footOffset, ok: true };
}

export function loadCharacter(scene) {
  return loadRig(scene, "/home/games/maze/assets/character/", "base.glb", {
    idle: "idle.glb", walk: "walk.glb", run: "run.glb",
    strafeL: "strafe-left.glb", strafeR: "strafe-right.glb",
  }, 1.7);
}

export function loadZombie(scene) {
  return loadRig(scene, "/home/games/maze/assets/zombie/", "zombie.glb", {
    idle: "idle.glb", run: "run.glb",
  }, 1.85);
}

/** Low-poly humanoid placeholder (feet at the root origin), facing +Z. */
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
  part(B.MeshBuilder.CreateCapsule("t", { height: 0.7, radius: 0.22 }, scene), body, 0, 1.05, 0);
  part(B.MeshBuilder.CreateSphere("h", { diameter: 0.34 }, scene), skin, 0, 1.55, 0);
  part(B.MeshBuilder.CreateBox("v", { width: 0.2, height: 0.07, depth: 0.06 }, scene), dark, 0, 1.57, 0.16);
  part(B.MeshBuilder.CreateCapsule("aL", { height: 0.6, radius: 0.08 }, scene), body, -0.3, 1.05, 0);
  part(B.MeshBuilder.CreateCapsule("aR", { height: 0.6, radius: 0.08 }, scene), body, 0.3, 1.05, 0);
  part(B.MeshBuilder.CreateCapsule("lL", { height: 0.7, radius: 0.1 }, scene), dark, -0.12, 0.4, 0);
  part(B.MeshBuilder.CreateCapsule("lR", { height: 0.7, radius: 0.1 }, scene), dark, 0.12, 0.4, 0);
  return { root, groups: {}, play() {}, footOffset: 0, ok: false };
}
