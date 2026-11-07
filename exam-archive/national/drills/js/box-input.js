/* ═══════════════════════════════════════════════════════
   DRILLS — the algebra answer, typed into BOXES (Algebra Moves' own editor).

   What the player types for an Algebra or Change-of-Subject answer is held by
   /prep-math/activity/algebra-moves/js/editor.js, exactly as on the Algebra
   Moves keypad: a fraction is a numerator box over a denominator box, a power
   is a small raised box, a root has a box under it. The caret lives in ONE box
   at a time: after x^2 it is up in the power, and → brings it back down to
   the line; ↑ and ↓ go between a numerator and its denominator.

   Only the drawing is ours: the boxes are written out as TeX for MathJax, every
   piece tagged with \class{bx-<box>-<index>}{…} so the caret can be measured
   onto the typeset answer and drawn over it. Moving the caret never
   re-typesets anything. The answer graded is editor.serialize().text, the line
   Algebra Moves' own parser reads.
═══════════════════════════════════════════════════════ */
import { createEditor } from '/prep-math/activity/algebra-moves/js/editor.js';

const esc = (c) => (c === '*' ? '\\cdot ' : c === '%' ? '\\%' : c === 'π' ? '\\pi ' : c === '{' || c === '}' ? '\\' + c : c);

/** The boxes as TeX, each piece tagged with the box it sits in and its index there. */
function texOf(root) {
  const ids = new Map();
  let next = 0;
  const idOf = (b) => { if (!ids.has(b)) ids.set(b, next++); return ids.get(b); };
  const tag = (b, k, tex) => `\\class{bx-${idOf(b)}-${k}}{${tex}}`;

  function blk(b) {
    if (!b.items.length) return tag(b, 'e', '\\square ');
    return b.items.map((it, k) => tag(b, k, item(it, b, k))).join('');
  }
  function item(it, b, k) {
    if (it.t === 'c') return esc(it.c);
    const B = it.blocks;
    switch (it.kind) {
      case 'frac': return `\\dfrac{${blk(B[0])}}{${blk(B[1])}}`;
      case 'pow': {
        const prev = b.items[k - 1];
        return `${prev ? '{}' : '\\square'}^{${blk(B[0])}}`;
      }
      case 'sqrt': return `\\sqrt{${blk(B[0])}}`;
      case 'nroot': return `\\sqrt[${blk(B[0])}]{${blk(B[1])}}`;
      case 'br': return `(${blk(B[0])})`;
      case 'fn': return `\\mathrm{${it.name}}(${blk(B[0])})`;
      case 'base': return `${blk(B[0])}_{${blk(B[1])}}`;
      default: return B.map(blk).join(',');
    }
  }
  return { tex: root.items.length ? blk(root) : '', ids };
}

/**
 * Wire a box editor to the hidden input and the answer stage.
 *   onChange(text)   the answer as the parser reads it, after every edit
 *   draw(el, tex)    typeset `tex` into `el` (the page's MathJax helper)
 */
export function createBoxInput({ inputEl, typedEl, stageEl, endCursor, onChange, draw }) {
  const ed = createEditor();
  let on = false;
  let ids = new Map();

  const bar = document.createElement('span');
  bar.className = 'drill-caret-bar';
  bar.hidden = true;
  stageEl.appendChild(bar);

  /* where each box's pieces landed on the page */
  function pieces() {
    const host = stageEl.getBoundingClientRect();
    const byId = new Map();
    for (const [b, id] of ids) byId.set(id, b);
    const out = [];
    typedEl.querySelectorAll('[class*="bx-"]').forEach((el) => {
      const m = /bx-(\d+)-(\d+|e)/.exec(el.getAttribute('class') || '');
      if (!m) return;
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) return;
      out.push({ block: byId.get(+m[1]), k: m[2] === 'e' ? 'e' : +m[2], left: r.left - host.left, right: r.right - host.left, top: r.top - host.top, h: r.height, w: r.width });
    });
    return out;
  }
  /** Every place the caret can stand, with where it is drawn. */
  function spots(ps) {
    // A box's own line: where its plain characters sit. A caret beside a power
    // or a fraction stands on that line, not up in the power (as in Algebra Moves).
    const line = new Map();
    for (const p of ps) {
      const it = p.k === 'e' ? null : p.block.items[p.k];
      if (it && it.t === 'c' && !line.has(p.block)) line.set(p.block, { top: p.top, h: p.h });
    }
    const out = [];
    for (const p of ps) {
      const ln = line.get(p.block) || { top: p.top, h: p.h };
      if (p.k === 'e') { out.push({ block: p.block, i: 0, x: (p.left + p.right) / 2, top: p.top, h: p.h }); continue; }
      if (p.k === 0) out.push({ block: p.block, i: 0, x: p.left, top: ln.top, h: ln.h });
      out.push({ block: p.block, i: p.k + 1, x: p.right, top: ln.top, h: ln.h });
    }
    return out;
  }
  function placeBar() {
    const c = ed.caret;
    const sp = spots(pieces());
    const at = sp.find((s) => s.block === c.block && s.i === c.i);
    if (!at) { bar.hidden = true; if (endCursor) endCursor.style.visibility = ''; return; }
    if (endCursor) endCursor.style.visibility = 'hidden';
    const h = Math.max(at.h, 22);
    bar.style.left = `${at.x - 1.5}px`;
    bar.style.top = `${at.top + at.h / 2 - h / 2}px`;
    bar.style.height = `${h}px`;
    bar.hidden = false;
    bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '';
  }

  let drawn = null;
  function render(changed) {
    const made = texOf(ed.root);
    ids = made.ids;
    if (!made.tex) { typedEl.textContent = ''; drawn = ''; bar.hidden = true; if (endCursor) endCursor.style.visibility = ''; }
    else if (made.tex !== drawn) { draw(typedEl, made.tex, ed.serialize().text); drawn = made.tex; }
    if (made.tex) placeBar();
    if (changed) onChange(ed.serialize().text);
  }

  /* typing: the site's own spellings become the shapes they name */
  function type(ch) {
    const b = ed.caret.block, i = ed.caret.i;
    const before = (n) => b.items.slice(Math.max(0, i - n), i).map((x) => (x.t === 'c' ? x.c : '\u0000')).join('');
    if (ch === '(' && /sqrt$/i.test(before(4))) { for (let n = 0; n < 4; n++) ed.backspace(); ed.template('sqrt'); return; }
    if (ch === '(' && /cbrt$/i.test(before(4))) { for (let n = 0; n < 4; n++) ed.backspace(); ed.template('nroot', { fill: ['3', ''], focus: 1 }); return; }
    if (ch === '√') { ed.template('sqrt'); return; }
    if (ch === '∛') { ed.template('nroot', { fill: ['3', ''], focus: 1 }); return; }
    if (ch === 'i' && before(1) === 'p') { ed.backspace(); ed.insertChar('π'); return; }
    ed.insertChar(ch);
  }

  inputEl.addEventListener('beforeinput', (e) => {
    if (!on) return;
    e.preventDefault();
    if (e.inputType === 'insertText' || e.inputType === 'insertCompositionText' || e.inputType === 'insertReplacementText') {
      for (const ch of e.data || '') type(ch === 'X' ? 'x' : ch);
    } else if (e.inputType === 'deleteContentBackward') ed.backspace();
    else if (e.inputType === 'deleteContentForward') ed.del();
    else return;
    render(true);
  });
  const MOVES = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', Home: 'home', End: 'end' };
  inputEl.addEventListener('keydown', (e) => {
    if (!on) return;
    if (MOVES[e.key]) { e.preventDefault(); ed.move(MOVES[e.key]); render(false); }
  });
  // a click puts the caret at the nearest place it can stand, measured on the
  // piece's own line first (a tap in a numerator stays in the numerator)
  stageEl.addEventListener('click', (e) => {
    if (!on) return;
    const host = stageEl.getBoundingClientRect();
    const x = e.clientX - host.left, y = e.clientY - host.top;
    let best = null;
    for (const s of spots(pieces())) {
      const dy = Math.max(0, s.top - y, y - (s.top + s.h));
      const d = Math.hypot(s.x - x, dy * 2.2);
      if (!best || d < best.d) best = { d, s };
    }
    inputEl.focus({ preventScroll: true });
    if (!best) return;
    const { spots: line } = ed.serialize();
    const hit = line.find((p) => p.block === best.s.block && p.i === best.s.i);
    if (hit) ed.setCaretAtOffset(hit.off);
    render(false);
  });

  return {
    /** Turn the box editor on (an algebra answer) or off (any other), empty. */
    reset(enable) {
      on = !!enable;
      ed.clear();
      drawn = null;
      bar.hidden = true;
      if (on) { inputEl.value = ''; typedEl.textContent = ''; }
    },
    get on() { return on; },
  };
}
