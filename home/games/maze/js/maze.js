/* ============================================================================
   3D Maze — generation + build
   ----------------------------------------------------------------------------
   generateMaze() carves a perfect maze with a recursive-backtracker (DFS),
   returning a grid of cells each knowing which of its 4 walls remain.
   buildMaze() turns that grid into thin box walls in the scene, and reports the
   player start (cell 0,0) and the goal (far corner) positions.

   World layout: column c → +x, row r → +z. Cell (r,c) centre = (c*cell, r*cell).
   ========================================================================== */

import { CFG } from "./config.js";

const B = window.BABYLON;

/** Carve a perfect maze. Returns grid[r][c] = { n,e,s,w } booleans (wall present). */
export function generateMaze(cols, rows) {
  const grid = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({ r, c, n: true, e: true, s: true, w: true, v: false }))
  );

  const opp = { n: "s", e: "w", s: "n", w: "e" };
  const unvisitedNeighbours = (cell) => {
    const { r, c } = cell;
    const out = [];
    if (r > 0 && !grid[r - 1][c].v) out.push(["n", grid[r - 1][c]]);
    if (c < cols - 1 && !grid[r][c + 1].v) out.push(["e", grid[r][c + 1]]);
    if (r < rows - 1 && !grid[r + 1][c].v) out.push(["s", grid[r + 1][c]]);
    if (c > 0 && !grid[r][c - 1].v) out.push(["w", grid[r][c - 1]]);
    return out;
  };

  const stack = [];
  let cur = grid[0][0];
  cur.v = true;
  let visited = 1;
  const total = rows * cols;

  while (visited < total) {
    const ns = unvisitedNeighbours(cur);
    if (ns.length) {
      const [dir, next] = ns[(Math.random() * ns.length) | 0];
      cur[dir] = false;
      next[opp[dir]] = false; // knock the shared wall down on both sides
      stack.push(cur);
      cur = next;
      cur.v = true;
      visited++;
    } else if (stack.length) {
      cur = stack.pop();
    } else {
      break;
    }
  }
  return grid;
}

/** Procedural brick texture drawn onto a canvas (no external image assets). */
function makeBrickTexture(scene) {
  const S = 256;
  const tex = new B.DynamicTexture("bricks", { width: S, height: S }, scene, true);
  const ctx = tex.getContext();

  const base = B.Color3.FromHexString(CFG.colors.wallA);
  const tint = `rgb(${(base.r * 255) | 0}, ${(base.g * 255) | 0}, ${(base.b * 255) | 0})`;
  // mortar
  ctx.fillStyle = "#cdc6b8";
  ctx.fillRect(0, 0, S, S);

  const rows = 6;
  const cols = 3;
  const bh = S / rows;
  const bw = S / cols;
  const gap = 4;
  for (let r = 0; r < rows; r++) {
    const off = r % 2 ? bw / 2 : 0; // running bond
    for (let c = -1; c <= cols; c++) {
      const x = c * bw + off + gap / 2;
      const y = r * bh + gap / 2;
      // slight per-brick shade variation for texture
      const v = 0.82 + Math.random() * 0.3;
      ctx.fillStyle = `rgb(${Math.min(255, base.r * 255 * v) | 0}, ${Math.min(255, base.g * 255 * v) | 0}, ${Math.min(255, base.b * 255 * v) | 0})`;
      ctx.fillRect(x, y, bw - gap, bh - gap);
    }
  }
  // faint top highlight on each course for depth
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  for (let r = 0; r < rows; r++) ctx.fillRect(0, r * bh + gap / 2, S, 2);

  tex.update();
  tex.wrapU = B.Texture.WRAP_ADDRESSMODE;
  tex.wrapV = B.Texture.WRAP_ADDRESSMODE;
  return tex;
}

/** Build wall meshes for a grid. Returns { root, startPos, goalPos }. */
export function buildMaze(scene, grid) {
  const { cell, wallH, wallT } = CFG;
  const rows = grid.length;
  const cols = grid[0].length;
  const root = new B.TransformNode("maze", scene);

  const mat = new B.StandardMaterial("wall", scene);
  mat.diffuseTexture = makeBrickTexture(scene);
  mat.diffuseTexture.uScale = 1.6;
  mat.diffuseTexture.vScale = 1.2;
  mat.specularColor = new B.Color3(0.06, 0.06, 0.08);

  const wall = (x, z, w, d) => {
    const m = B.MeshBuilder.CreateBox("wall", { width: w, height: wallH, depth: d }, scene);
    m.position.set(x, wallH / 2, z);
    m.material = mat;
    m.checkCollisions = true;
    m.parent = root;
    return m;
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = c * cell;
      const cz = r * cell;
      if (grid[r][c].n) wall(cx, cz - cell / 2, cell + wallT, wallT); // north (–z)
      if (grid[r][c].w) wall(cx - cell / 2, cz, wallT, cell + wallT); // west  (–x)
      if (r === rows - 1 && grid[r][c].s) wall(cx, cz + cell / 2, cell + wallT, wallT); // outer south
      if (c === cols - 1 && grid[r][c].e) wall(cx + cell / 2, cz, wallT, cell + wallT); // outer east
    }
  }

  const startPos = new B.Vector3(0, CFG.eyeH, 0);
  const goalPos = new B.Vector3((cols - 1) * cell, 0, (rows - 1) * cell);
  return { root, startPos, goalPos };
}
