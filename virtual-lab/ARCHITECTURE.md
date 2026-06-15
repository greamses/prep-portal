# Virtual Lab — folder guide

This document explains what each folder under `virtual-lab/` is for. It's a map,
not a tutorial — open the files for detail.

## Top level

| Path | What it is |
|------|------------|
| `index.html`, `css/hub.css` | The hub / landing page that links out to each subject lab. |
| `shared/` | Code and assets used by every lab. |
| `chemistry/` | The chemistry lab (the only fully built-out subject). |
| `physics/`, `biology/` | Placeholder labs — they mirror the chemistry folder layout but currently contain only an `index.html` + `css/`. Their `js/` subfolders (`objects/`, `simulation/`, `effects/`, `data/`, `ui/`) are empty scaffolds waiting to be filled in the same shape as chemistry. |

## `shared/` — cross-lab building blocks

| Path | What it is |
|------|------------|
| `shared/css/base.css` | Base styles shared across labs. |
| `shared/js/engine/` | Engine primitives. `Scene.js` bootstraps a Three.js scene/camera/renderer; `Lighting.js` adds a standard lab lighting rig; `DragControls.js` is raycast-based mouse dragging for desktop apparatus; `FirstPersonControls.js` is WASD + mouse-look movement with AABB collision; `RoomManager.js` streams rooms in/out through open doorways (portal/cell culling). |
| `shared/js/effects/Particles.js` | Base `ParticleSystem` that lab effects (bubbles, smoke, …) extend. |
| `shared/js/ui/` | Reusable UI. `Sidebar.js` (equipment picker), `Toolbar.js` (top-bar actions), `VirtualJoystick.js` (mobile dual analog sticks + on-screen buttons for the first-person lab). |
| `shared/models/` | Downloaded 3D assets (e.g. `hand.glb`) plus `README.md` with their licence/attribution. |

## `chemistry/js/` — two generations live here

The chemistry lab currently contains **two separate implementations**. They don't
share an entry point; know which one you're editing.

### 1. First-person walkable lab — **active** (loaded by `index.html`)

`index.html` → `main.js`. This is the full-screen, walk-around 3D lab.

| Path | What it is |
|------|------------|
| `chemistry/js/main.js` | Entry point: renderer, post-processing, player rig (`Hands` + `Economy`), the `RoomManager`, input, and the render loop. |
| `chemistry/js/ChemistryRoom.js` | The chemistry room as a self-contained module (implements the `RoomManager` room interface — `group`, `colliders`, `interactables`, `portals`, `bounds`, `build/setActive/update/contains`). |
| `chemistry/js/StorageRoom.js` | The adjoining store room (same interface), reached through the connecting door. Holds the storage cupboards. |
| `chemistry/js/lab/` | The building blocks for the walkable lab: `Room` (shell/walls/lighting; can omit a wall the Boundary owns), `Boundary` (the persistent shared wall + connecting door between the two rooms — owned by neither room so it never disappears), `Furniture` (benches, stools, fume hood, gas cylinder), `Cupboards` (relocatable carcasses + drawers + doors, optionally pickable shelf items), `Drawer`, `CabinetDoor`, `Door` (the swing door used by Boundary), `Equipment` (static bench apparatus: rack, retort + tube/burner/tripod slots), `Pickup` (grabbable glassware — breakable — plus non-breakable metal apparatus like the tripod & wire gauze, which can ride on each other via `addRider`), `Bunsen` (lightable burner with an adjustable flame: `increase`/`decrease`), `Hands` (the GLB hands + held-object holder), `Economy` (glassware budget HUD). |

### 2. Desktop drag-and-drop mixing prototype — **legacy / not wired in**

An earlier mouse-driven "mix two liquids" simulator. `main.js` does **not** import
any of it; it's kept as the basis for an in-lab interactive sim. (Note: these files
import Three.js from a hard-coded CDN URL rather than the `three` import-map
specifier the first-person lab uses, and reference fixed DOM element IDs.)

| Path | What it is |
|------|------------|
| `chemistry/js/objects/` | Single, unit-scale draggable apparatus meshes used with `DragControls`: `Beaker`, `TestTube`, `FlaskErlenmeyer`, `Pipette`, `Burner`. |
| `chemistry/js/simulation/` | Pure JS logic, no Three.js: `ChemistryCore` (look up a reaction for two colours), `Mixer` (track volumes/concentrations across vessels), `pH` (pH↔colour/label helpers). |
| `chemistry/js/data/` | Data tables. `reactions.js` maps sorted colour pairs → product `{ color, pH, temperature, reaction, description }`. Add reactions here; nothing else changes. |
| `chemistry/js/effects/` | Visual effects extending `shared/.../Particles.js`: `Bubbles`, `Smoke`, `Precipitate`. |
| `chemistry/js/ui/` | DOM glue. `ChemPanel.js` writes reaction results into the on-page readout. |

## Quick orientation

- **Adding a room** to the walkable lab → new module like `StorageRoom.js`, register it in `main.js`, link with a `Door` + portal entry. See the comments in `RoomManager.js` and `ChemistryRoom.js`.
- **Adding apparatus you can hold/break** → `lab/Pickup.js` (+ a slot in `lab/Equipment.js`).
- **Adding a reaction** to the mixing prototype → append to `data/reactions.js`.
- **Building out physics/biology** → follow the chemistry `js/` layout; the empty folders already reserve the structure.
