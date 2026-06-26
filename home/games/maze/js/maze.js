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

  // Carve a doorway in the north boundary of the start cell (0,0).
  grid[0][0].n = false;

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

  // ── entrance: a straight approach corridor outside the doorway + a door ────
  const h = cell / 2;
  const doorZ = -h;               // doorway sits on the north boundary
  const approachLen = cell * 2;   // straight path length
  const backZ = doorZ - approachLen;
  const midZ = (doorZ + backZ) / 2;
  wall(-h, midZ, wallT, approachLen); // left corridor wall
  wall(h, midZ, wallT, approachLen);  // right corridor wall
  wall(0, backZ, cell + wallT, wallT); // back wall (closed end)

  const door = B.MeshBuilder.CreateBox("door", { width: cell - 0.1, height: wallH, depth: wallT * 1.3 }, scene);
  door.position.set(0, wallH / 2, doorZ);
  const dmat = new B.StandardMaterial("doorMat", scene);
  dmat.diffuseColor = B.Color3.FromHexString("#6b4a2b"); // wood
  dmat.specularColor = new B.Color3(0.08, 0.08, 0.08);
  door.material = dmat;
  door.parent = root;

  const startPos = new B.Vector3(0, CFG.eyeH, backZ + cell * 0.7); // outside, facing the door
  const goalPos = new B.Vector3((cols - 1) * cell, 0, (rows - 1) * cell);
  const gates = placeGates(scene, grid, root, cell, wallH, wallT);
  return { root, startPos, goalPos, door, gates, entrance: { doorZ, backZ, halfX: h } };
}

/* ── riddle gates: block 3 passages along the unique solution path ──────────── */
function setWall(grid, [ar, ac], [br, bc], closed) {
  if (bc === ac + 1) { grid[ar][ac].e = closed; grid[br][bc].w = closed; }
  else if (bc === ac - 1) { grid[ar][ac].w = closed; grid[br][bc].e = closed; }
  else if (br === ar + 1) { grid[ar][ac].s = closed; grid[br][bc].n = closed; }
  else if (br === ar - 1) { grid[ar][ac].n = closed; grid[br][bc].s = closed; }
}

function solutionPath(grid) {
  const rows = grid.length, cols = grid[0].length;
  const open = (r, c, nr, nc) =>
    nr === r - 1 ? !grid[r][c].n : nr === r + 1 ? !grid[r][c].s
      : nc === c + 1 ? !grid[r][c].e : !grid[r][c].w;
  const prev = Array.from({ length: rows }, () => Array(cols).fill(null));
  const seen = Array.from({ length: rows }, () => Array(cols).fill(false));
  const q = [[0, 0]];
  seen[0][0] = true;
  const dirs = [[-1, 0], [1, 0], [0, 1], [0, -1]];
  while (q.length) {
    const [r, c] = q.shift();
    if (r === rows - 1 && c === cols - 1) break;
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || seen[nr][nc] || !open(r, c, nr, nc)) continue;
      seen[nr][nc] = true; prev[nr][nc] = [r, c]; q.push([nr, nc]);
    }
  }
  if (!seen[rows - 1][cols - 1]) return [];
  const path = [];
  let cur = [rows - 1, cols - 1];
  while (cur) { path.push(cur); cur = prev[cur[0]][cur[1]]; }
  return path.reverse();
}

function placeGates(scene, grid, root, cell, wallH, wallT) {
  const path = solutionPath(grid);
  const edges = path.length - 1;
  if (edges < 3) return [];

  const mat = new B.StandardMaterial("gateMat", scene);
  mat.diffuseColor = B.Color3.FromHexString("#6fd0c0");
  mat.emissiveColor = new B.Color3(0.08, 0.22, 0.2);
  mat.specularColor = new B.Color3(0.2, 0.2, 0.2);

  const fracs = [0.3, 0.55, 0.8];
  const gates = [];
  for (const f of fracs) {
    const i = Math.max(1, Math.min(edges - 1, Math.round(edges * f)));
    const A = path[i], B2 = path[i + 1];
    if (!A || !B2) continue;
    setWall(grid, A, B2, true); // block the passage

    const sameRow = A[0] === B2[0];
    const mx = ((A[1] + B2[1]) / 2) * cell;
    const mz = ((A[0] + B2[0]) / 2) * cell;
    const mesh = B.MeshBuilder.CreateBox("gate", {
      width: sameRow ? wallT * 1.6 : cell,
      height: wallH,
      depth: sameRow ? cell : wallT * 1.6,
    }, scene);
    mesh.position.set(mx, wallH / 2, mz);
    mesh.material = mat;
    mesh.parent = root;

    const gate = {
      pos: { x: mx, z: mz },
      solved: false,
      active: false,
      mesh,
      open() {
        setWall(grid, A, B2, false); // carve the passage
        this.solved = true;
        B.Animation.CreateAndStartAnimation("gateUp", mesh, "position.y", 60, 55, mesh.position.y, mesh.position.y + wallH * 1.3, 0);
      },
    };
    gates.push(gate);
  }
  return gates;
}
