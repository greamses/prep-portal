# 3D heart model (biology lab)

An interactive, anatomy-inspired heart you can take apart, cut open and watch beat.

## Files

- `index.html`: the page (shared `theme.css` / `components.css`: sticky-note controls,
  receipt cards, square pills, paint-blob background, light and dark themes).
- `heart.js`: the viewer (Three.js r160, same version as the rest of the virtual lab).
- `models/heart.glb`: one mesh per part, in anatomical units (1 unit = 3 cm) under a
  node named `heart` that scales them to metres. Vertex-coloured, no textures.
- `models/heart.meta.json`: part names and descriptions, explode directions, and the
  data for the valves and chordae (annulus centres, axes, radii, papillary tips).
- `tools/build_heart.py`: generates both model files.

## What it shows

- **Parts (34 meshes):** left and right ventricles, atria and auricles; ascending
  aorta, aortic arch, descending aorta and the three arch branches; pulmonary trunk
  and left/right pulmonary arteries; superior and inferior venae cavae; four
  pulmonary veins; four papillary muscles; coronary arteries (left main, LAD,
  diagonal, circumflex, right coronary, posterior descending) and cardiac veins.
- **Valves and chordae** (built in `heart.js`): mitral, tricuspid, aortic and
  pulmonary valves open and close in time with the cycle; chordae tie the mitral
  and tricuspid leaflets to the papillary muscles.
- **Disassemble / Assemble:** the parts interlock, so they fly apart and back together.
- **Cross-section:** front, top or side cut with a depth slider. Walls are hollow, so
  the cut shows the chambers, septum, valves and papillary muscles.
- **Heartbeat:** atria then ventricles contract, great arteries stretch, valves move,
  with the phase of the cardiac cycle on a sticky note. Rate is adjustable.
- **Tap a part** to see its name and what it does.
- **Dials** for heart rate and cut depth use the shared dial component
  (`utils/components/dial.js` + `dial.css`, the same one the soroban drills use).

Motion starts paused when the visitor's system asks for reduced motion.

## Regenerate the model

```bash
pip install numpy scikit-image trimesh scipy
cd virtual-lab/biology/heart/tools
python3 build_heart.py ../models/heart.glb ../models/heart.meta.json
```

The script prints a leak check; it should report `0 suspicious voxels` (no chamber or
vessel lumen breaks through a wall except at the cut ends of vessels).

If you change the anatomy layout in `build_heart.py`, the beat in `heart.js`
(`BEAT_GLSL` and `applyBeat`) uses a few of the same landmark points: the
left-ventricle axis, atrial centres, and the aortic and pulmonary roots.

## Limits

Simplified and stylised for study: not a medical-grade or patient-specific model.
Proportions are approximate, the chamber linings are smooth (no trabeculae), and
the coronary and venous paths follow the grooves only roughly.

## Licence

Built from scratch for this site. No third-party model or texture was used.
