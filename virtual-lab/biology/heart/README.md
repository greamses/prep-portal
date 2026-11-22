# 3D heart model (biology lab)

An interactive, anatomy-inspired 3D model of the human heart for study.

- `index.html`: the viewer (Three.js r160, same version as the rest of the virtual lab).
  Shows the four chambers, aorta, pulmonary artery, venae cavae, pulmonary veins,
  the grooves with epicardial fat, and the coronary arteries (LAD, LCx, RCA) plus the
  great cardiac vein. Controls: coronary toggle, auto-rotate, wireframe, reset view.
- `models/heart.glb`: the model, ~12 cm tall, in metres (glTF, vertex-coloured).
- `tools/build_heart.py`: the generator that builds `heart.glb`.

## Regenerate the model

```bash
pip install numpy scikit-image trimesh scipy
python3 virtual-lab/biology/heart/tools/build_heart.py virtual-lab/biology/heart/models/heart.glb
```

The shape is built from signed-distance primitives, blended, and polygonised with
marching cubes. Proportions and colours are set in `PARTS`, `colour_body()` and
`build_coronaries()`.

## Limits

This is a simplified, stylised model. It is not a medical-grade or patient-specific
reconstruction and should not be used for clinical purposes. Chambers are solid
(no internal cutaway), and the coronary paths are approximate.

## Licence

Built from scratch for this site. No third-party model or texture was used.
