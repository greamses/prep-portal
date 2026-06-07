// renderer.js — Canvas drawing + coordinate helpers + token animation
// No game-flow logic here; safe to import from any module.

import { CELL, OFFSETS }  from './constants.js';
import { state }           from './state.js';
import { getActivePlugin } from './mathPlugins.js';

// ─── Coordinate helpers ────────────────────────────────────────────────────────

export function squareXY(sq) {
  const idx      = sq - 1;
  const boardRow = Math.floor(idx / 8);
  const colIdx   = idx % 8;
  const boardCol = (boardRow % 2 === 0) ? colIdx : (7 - colIdx);
  return { x: boardCol * CELL, y: (7 - boardRow) * CELL };
}

export function squareCenter(sq) {
  const { x, y } = squareXY(sq);
  return { x: x + CELL / 2, y: y + CELL / 2 };
}

export function getCanvasPoint(e) {
  const rect   = state.canvas.getBoundingClientRect();
  const scaleX = state.canvas.width  / rect.width;
  const scaleY = state.canvas.height / rect.height;
  let cx = e.clientX, cy = e.clientY;
  if (e.touches?.length)             { cx = e.touches[0].clientX;        cy = e.touches[0].clientY; }
  else if (e.changedTouches?.length) { cx = e.changedTouches[0].clientX; cy = e.changedTouches[0].clientY; }
  return { x: (cx - rect.left) * scaleX, y: (cy - rect.top) * scaleY };
}

export function getSquareFromPoint(x, y) {
  const col = Math.floor(x / CELL);
  const row = Math.floor(y / CELL);
  if (col < 0 || col > 7 || row < 0 || row > 7) return -1;
  const boardRow = 7 - row;
  return boardRow * 8 + ((boardRow % 2 === 0) ? col : (7 - col)) + 1;
}

// ─── Token helpers ────────────────────────────────────────────────────────────

export function snapToken(pi, targetSq) {
  const c = squareCenter(targetSq);
  state.players[pi].drawX = c.x + OFFSETS[pi].dx;
  state.players[pi].drawY = c.y + OFFSETS[pi].dy;
  drawBoard();
}

export function animateCPUToken(pi, startSq, targetSq, callback) {
  const start  = squareCenter(startSq);
  const end    = squareCenter(targetSq);
  const p      = state.players[pi];
  const startX = start.x + OFFSETS[pi].dx;
  const startY = start.y + OFFSETS[pi].dy;
  const endX   = end.x   + OFFSETS[pi].dx;
  const endY   = end.y   + OFFSETS[pi].dy;
  let t0 = null;
  const DURATION = 600;

  function step(ts) {
    if (!t0) t0 = ts;
    const prog = Math.min((ts - t0) / DURATION, 1);
    const ease = 1 - Math.pow(1 - prog, 3);
    p.drawX = startX + (endX - startX) * ease;
    p.drawY = startY + (endY - startY) * ease;
    drawBoard();
    if (prog < 1) requestAnimationFrame(step);
    else callback();
  }
  requestAnimationFrame(step);
}

// ─── Fraction cell drawing ────────────────────────────────────────────────────

function drawStackedFrac(num, den, cx, cy, size) {
  const { ctx } = state;
  const ns = String(num), ds = String(den);
  ctx.font = `bold ${size}px 'JetBrains Mono', monospace`;
  const lineW = Math.max(ctx.measureText(ns).width, ctx.measureText(ds).width) + 6;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom'; ctx.fillText(ns, cx, cy - 2);
  ctx.textBaseline = 'top';    ctx.fillText(ds, cx, cy + 3);
  ctx.textBaseline = 'alphabetic';
  ctx.fillRect(cx - lineW / 2, cy - 1, lineW, 2.5);
}

export function drawCellFraction(f, cx, cy) {
  if (!f || f.d === 'W') return;
  const { ctx } = state;
  const SIZE = 22;
  ctx.fillStyle = '#1a1a1a';

  if (f.d === 'M') {
    // Mixed number: whole part + stacked fraction
    ctx.font = `bold ${SIZE + 6}px 'JetBrains Mono', monospace`;
    const wStr = String(f.w);
    const ww   = ctx.measureText(wStr).width;
    ctx.font   = `bold ${SIZE}px 'JetBrains Mono', monospace`;
    const fw   = Math.max(ctx.measureText(String(f.n)).width, ctx.measureText(String(f.dn)).width) + 6;
    const sx   = cx - (ww + 6 + fw) / 2;
    ctx.font = `bold ${SIZE + 6}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(wStr, sx, cy + 1);
    ctx.textBaseline = 'alphabetic';
    drawStackedFrac(f.n, f.dn, sx + ww + 6 + fw / 2, cy, SIZE);

  } else if (f.d === 'I') {
    // Improper fraction: stacked n/dn
    drawStackedFrac(f.n, f.dn, cx, cy, SIZE);

  } else {
    // Non-fraction plugin question — ask the active plugin for a compact cell label.
    // Plugin returns { line1, line2? } or null (skip rendering).
    const label = getActivePlugin().cellText?.(f);
    if (!label) return;
    _drawCellLabel(ctx, label, cx, cy);
  }
}

/**
 * Renders a 1- or 2-line text label centred in a board cell.
 * Automatically shrinks font if the text is too wide for the cell.
 */
function _drawCellLabel(ctx, { line1, line2 }, cx, cy) {
  const FONT     = `bold 14px 'JetBrains Mono', monospace`;
  const MAX_W    = CELL - 16;   // leave 8px gutter each side
  ctx.textAlign  = 'center';
  ctx.fillStyle  = '#1a1a1a';

  // Measure and auto-shrink if needed
  let fontSize = 14;
  ctx.font = `bold ${fontSize}px 'JetBrains Mono', monospace`;
  const longest = line2
    ? Math.max(ctx.measureText(line1).width, ctx.measureText(line2).width)
    : ctx.measureText(line1).width;
  if (longest > MAX_W) {
    fontSize = Math.max(9, Math.floor(fontSize * MAX_W / longest));
    ctx.font = `bold ${fontSize}px 'JetBrains Mono', monospace`;
  }

  const lineH = fontSize + 3;
  if (line2) {
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(line1, cx, cy - 2);
    ctx.fillText(line2, cx, cy + lineH);
  } else {
    ctx.textBaseline = 'middle';
    ctx.fillText(line1, cx, cy + lineH / 4);
  }
}

// ─── Ladder ───────────────────────────────────────────────────────────────────

export function drawLadder(bot, top) {
  const { ctx } = state;
  const b = squareCenter(bot), t = squareCenter(top);
  const len = Math.hypot(t.x - b.x, t.y - b.y);
  const ang = Math.atan2(t.y - b.y, t.x - b.x);
  ctx.save();
  ctx.translate(b.x, b.y); ctx.rotate(ang);

  const rW = 16, hS = 22;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, -hS - rW / 2 + 8, len, rW);
  ctx.fillRect(0,  hS - rW / 2 + 8, len, rW);

  const steps = Math.floor(len / 35);
  for (let i = 1; i < steps; i++) {
    const rx = (len / steps) * i;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(rx - 3, -hS + 4, 10, hS * 2);
    const g = ctx.createLinearGradient(rx - 4, 0, rx + 4, 0);
    g.addColorStop(0, '#704523'); g.addColorStop(1, '#4a2f1d');
    ctx.fillStyle = g;
    ctx.fillRect(rx - 4, -hS, 8, hS * 2);
  }

  const rail = (y0, y1) => {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, '#5c3a21'); g.addColorStop(.5, '#8b5a2b'); g.addColorStop(1, '#4a2f1d');
    return g;
  };
  ctx.fillStyle = rail(-hS - rW / 2, -hS + rW / 2); ctx.fillRect(-8, -hS - rW / 2, len + 16, rW);
  ctx.fillStyle = rail( hS - rW / 2,  hS + rW / 2); ctx.fillRect(-8,  hS - rW / 2, len + 16, rW);
  ctx.restore();
}

// ─── Snake ────────────────────────────────────────────────────────────────────

function drawSnakeHead(x, y, ang, color) {
  const { ctx } = state;
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(-18,-18); ctx.quadraticCurveTo(25,-25,30,0);
  ctx.quadraticCurveTo(25,25,-18,18); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f1c40f';
  [[8,-10],[8,10]].forEach(([ex,ey]) => { ctx.beginPath(); ctx.arc(ex,ey,5,0,Math.PI*2); ctx.fill(); });
  ctx.fillStyle = '#1a1a1a';
  [[10,-10],[10,10]].forEach(([ex,ey]) => { ctx.beginPath(); ctx.arc(ex,ey,2.5,0,Math.PI*2); ctx.fill(); });
  ctx.strokeStyle='#e74c3c'; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(30,0); ctx.lineTo(48,0);
  ctx.moveTo(48,0); ctx.lineTo(54,-5); ctx.moveTo(48,0); ctx.lineTo(54,5); ctx.stroke();
  ctx.restore();
}

export function drawSnake(head, tail) {
  const { ctx, SNAKE_COLORS } = state;
  const h = squareCenter(head), t = squareCenter(tail);
  const dist = Math.hypot(h.x-t.x, h.y-t.y), off = dist*0.35;
  const cp1x = h.x+(t.x>h.x?off:-off), cp1y = h.y+off;
  const cp2x = t.x+(t.x>h.x?-off:off), cp2y = t.y-off;
  const col  = SNAKE_COLORS[head] || '#27ae60';

  ctx.save(); ctx.lineCap='round'; ctx.lineJoin='round';
  ctx.shadowColor='rgba(0,0,0,0.4)'; ctx.shadowBlur=12; ctx.shadowOffsetX=6; ctx.shadowOffsetY=6;
  ctx.beginPath(); ctx.moveTo(h.x,h.y); ctx.bezierCurveTo(cp1x,cp1y,cp2x,cp2y,t.x,t.y);
  ctx.lineWidth=30; ctx.strokeStyle=col; ctx.stroke();
  ctx.shadowColor='transparent';

  ctx.beginPath(); ctx.moveTo(h.x,h.y); ctx.bezierCurveTo(cp1x,cp1y,cp2x,cp2y,t.x,t.y);
  ctx.lineWidth=24; ctx.setLineDash([12,12]); ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath(); ctx.moveTo(h.x,h.y); ctx.bezierCurveTo(cp1x,cp1y,cp2x,cp2y,t.x,t.y);
  ctx.lineWidth=6; ctx.strokeStyle='rgba(255,235,100,0.6)'; ctx.stroke();

  drawSnakeHead(h.x, h.y, Math.atan2(cp1y-h.y, cp1x-h.x), col);
  ctx.beginPath(); ctx.arc(t.x,t.y,15,0,Math.PI*2); ctx.fillStyle=col; ctx.fill();
  ctx.restore();
}

// ─── Players ──────────────────────────────────────────────────────────────────

export function drawPlayers() {
  const { ctx, players, dragState } = state;
  players.forEach((p, i) => {
    const dragging = dragState.isDragging && dragState.pi === i;
    const r = dragging ? 28 : 22;
    ctx.save();
    ctx.fillStyle='rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(p.drawX+4, p.drawY+(dragging?20:12), r*0.8, r*0.4, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle=p.color; ctx.strokeStyle='#1a1a1a'; ctx.lineWidth=4;
    ctx.beginPath(); ctx.arc(p.drawX, p.drawY, r, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(p.drawX, p.drawY, r-6, 0, Math.PI*2); ctx.stroke();
    // Label: dark stroke + white fill = legible on every token colour
    ctx.font=`900 ${dragging?18:14}px 'Unbounded', sans-serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.lineWidth=4; ctx.strokeStyle='rgba(0,0,0,0.75)';
    ctx.strokeText(p.name, p.drawX, p.drawY+1);
    ctx.fillStyle='#ffffff'; ctx.fillText(p.name, p.drawX, p.drawY+1);
    ctx.restore();
  });
}

// ─── Full board ───────────────────────────────────────────────────────────────

export function drawBoard() {
  const { ctx, canvas, SNAKES, LADDERS, FRAC } = state;
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let sq = 1; sq <= 64; sq++) {
    const { x, y } = squareXY(sq);
    let bg = (Math.floor((sq-1)/8) + (sq-1)) % 2 === 0 ? '#ffffff' : '#f5f0e8';
    if      (sq===64)      bg='#ffe500';
    else if (sq===1)       bg='#e8f5ec';
    else if (sq in SNAKES) bg='#fff2f2';
    else if (sq in LADDERS)bg='#edfff5';

    ctx.fillStyle=bg; ctx.fillRect(x,y,CELL,CELL);
    ctx.strokeStyle='#1a1a1a'; ctx.lineWidth=1.5; ctx.strokeRect(x,y,CELL,CELL);

    ctx.fillStyle='#777'; ctx.font=`700 18px 'JetBrains Mono', monospace`;
    ctx.textAlign='right'; ctx.fillText(sq, x+CELL-8, y+24);

    if (sq===64) {
      ctx.fillStyle='#1a1a1a'; ctx.textAlign='center';
      ctx.font=`900 26px 'Unbounded', sans-serif`; ctx.fillText('WIN', x+CELL/2, y+CELL/2-6);
      ctx.font=`400 15px 'Unbounded', sans-serif`; ctx.fillText('SQUARE 64', x+CELL/2, y+CELL/2+20);
    } else if (sq===1) {
      ctx.fillStyle='#1a1a1a'; ctx.textAlign='center';
      ctx.font=`900 20px 'Unbounded', sans-serif`; ctx.fillText('START', x+CELL/2, y+CELL/2+6);
    } else {
      const f=FRAC[sq]; if (f) drawCellFraction(f, x+CELL/2, y+CELL/2+6);
    }
  }

  for (const [b,t] of Object.entries(LADDERS)) drawLadder(+b,+t);
  for (const [h,t] of Object.entries(SNAKES))  drawSnake(+h,+t);
  drawPlayers();
}
