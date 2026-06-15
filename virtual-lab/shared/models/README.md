# Hand model

The lab loads `hand.glb` from this folder and falls back to a procedural hand
if the file is missing.

## Attribution (required)

The hand currently in use is:

> **"Hand"** (https://sketchfab.com/3d-models/hand-793cce8e3ffa4aa393f6ad0143ddffd9)
> by **hotboom** (https://sketchfab.com/hotboom),
> licensed under **CC BY 4.0** (http://creativecommons.org/licenses/by/4.0/).

CC BY 4.0 **requires** that this credit stays visible wherever the model is
used. It's shown to users on the lab's start screen (`.start-credit` in
`virtual-lab/chemistry/index.html`) — keep that line if you swap the texture or
re-export, and update it here if you replace the model with a different author's.

> Confirm the exact license on the model page before shipping — if it's CC BY-NC
> or CC BY-ND, commercial use / modification may be restricted.

## Replacing the model

1. Open the model page on Sketchfab and sign in (free account).
2. **Download 3D Model** → **glTF Binary (.glb)**. If only glTF is offered,
   export a single `.glb` (e.g. Blender → *File → Export → glTF Binary*).
3. Rename to **`hand.glb`** and drop it in this folder.
4. Reload the chemistry lab — the procedural hand is replaced automatically.
5. Update the attribution above **and** the `.start-credit` line in the page.

## Adjusting the model

Models arrive in arbitrary scale/orientation. Tune the `TUNE` block at the top
of `virtual-lab/chemistry/js/lab/Hands.js`:

- `modelLen`   — target hand length in metres (default `0.20`)
- `modelRot`   — `[x, y, z]` radians; orient so fingers point forward (−Z)
- `modelScale` — extra multiplier after the auto-fit

The model is Draco-decoded automatically, so compressed exports work too.
