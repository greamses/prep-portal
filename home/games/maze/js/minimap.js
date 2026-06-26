/* ============================================================================
   3D Maze — minimap
   ----------------------------------------------------------------------------
   Top-down 2D canvas overlay: draws the maze walls from the grid, the exit, and
   a live player arrow (position + facing). setMaze() on each new maze; update()
   every frame with the player's world x/z and heading (camera.rotation.y).
   Flat colours only — no gradients.
   ========================================================================== */

export function initMinimap(canvasEl) {
  if (!canvasEl) return null;
  const ctx = canvasEl.getContext("2d");
  const W = canvasEl.width;
  const H = canvasEl.height;
  const pad = 10;

  let grid = null, cell = 4, rows = 0, cols = 0, s = 0, ox = 0, oy = 0;

  function setMaze(g, c) {
    grid = g;
    cell = c;
    rows = g.length;
    cols = g[0].length;
    s = Math.min((W - 2 * pad) / cols, (H - 2 * pad) / rows);
    ox = (W - s * cols) / 2;
    oy = (H - s * rows) / 2;
  }

  function update(px, pz, ry, enemyPts) {
    if (!grid) return;
    ctx.clearRect(0, 0, W, H);

    // faint fill so the CSS glass blur shows through
    ctx.fillStyle = "rgba(12, 15, 22, 0.28)";
    ctx.fillRect(0, 0, W, H);

    // walls
    ctx.strokeStyle = "rgba(236, 231, 216, 0.92)";
    ctx.lineWidth = 1.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = ox + c * s;
        const y = oy + r * s;
        const k = grid[r][c];
        if (k.n) { ctx.moveTo(x, y); ctx.lineTo(x + s, y); }
        if (k.w) { ctx.moveTo(x, y); ctx.lineTo(x, y + s); }
        if (r === rows - 1 && k.s) { ctx.moveTo(x, y + s); ctx.lineTo(x + s, y + s); }
        if (c === cols - 1 && k.e) { ctx.moveTo(x + s, y); ctx.lineTo(x + s, y + s); }
      }
    }
    ctx.stroke();

    // exit marker (far corner)
    const gx = ox + (cols - 1) * s + s / 2;
    const gy = oy + (rows - 1) * s + s / 2;
    ctx.fillStyle = "#7cc47c";
    ctx.beginPath();
    ctx.arc(gx, gy, Math.max(2.5, s * 0.26), 0, Math.PI * 2);
    ctx.fill();

    // enemies (red dots)
    if (enemyPts && enemyPts.length) {
      ctx.fillStyle = "#f04a4a";
      for (const e of enemyPts) {
        const ex = ox + ((e.x + cell / 2) / cell) * s;
        const ey = oy + ((e.z + cell / 2) / cell) * s;
        ctx.beginPath();
        ctx.arc(ex, ey, Math.max(2, s * 0.2), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // tactical corner brackets
    ctx.strokeStyle = "rgba(240, 168, 104, 0.9)";
    ctx.lineWidth = 2;
    const m = 4, L = 14;
    ctx.beginPath();
    ctx.moveTo(m, m + L); ctx.lineTo(m, m); ctx.lineTo(m + L, m);
    ctx.moveTo(W - m - L, m); ctx.lineTo(W - m, m); ctx.lineTo(W - m, m + L);
    ctx.moveTo(W - m, H - m - L); ctx.lineTo(W - m, H - m); ctx.lineTo(W - m - L, H - m);
    ctx.moveTo(m + L, H - m); ctx.lineTo(m, H - m); ctx.lineTo(m, H - m - L);
    ctx.stroke();

    // player arrow (position + facing)
    const pc = (px + cell / 2) / cell;
    const pr = (pz + cell / 2) / cell;
    const cx = ox + pc * s;
    const cy = oy + pr * s;
    const fx = Math.sin(ry), fy = Math.cos(ry); // forward on the map
    const rx = -fy, rzy = fx; // perpendicular
    const size = Math.max(4, s * 0.42);
    ctx.fillStyle = "#f0a868";
    ctx.beginPath();
    ctx.moveTo(cx + fx * size, cy + fy * size);
    ctx.lineTo(cx - fx * size * 0.5 + rx * size * 0.62, cy - fy * size * 0.5 + rzy * size * 0.62);
    ctx.lineTo(cx - fx * size * 0.5 - rx * size * 0.62, cy - fy * size * 0.5 - rzy * size * 0.62);
    ctx.closePath();
    ctx.fill();
  }

  return { setMaze, update };
}
