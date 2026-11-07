/* ═══════════════════════════════════════════════════════
   DRILLS — what the player has typed so far, as TeX.
   "/" becomes a stacked fraction as soon as it is typed: the product just
   before it is the numerator, the product just after it the denominator
   (implicit multiplication binds tighter than "/", the same rule the answer
   checks use). Tolerant of half-typed input: an unclosed "(" shows as "(",
   a trailing "/" shows an empty box under the bar.

   THE CARET IS NEVER PART OF THE TeX. As in Algebra Moves (keypad.js), the
   drawing is only ever the answer itself; every piece of it is tagged with
   the span of the typed line it came from (\class{dc-FROM-TO}{…}), and the
   page draws the caret on top of the typeset answer by measuring those
   pieces. Moving the caret re-typesets nothing.
═══════════════════════════════════════════════════════ */
const isLetter = (c) => !!c && /[A-Za-z]/.test(c);
const isDigit = (c) => !!c && /[0-9.]/.test(c);

/** Tag a piece of TeX with the span [from, to) of the typed line it is drawn from. */
export const tag = (from, to, tex) => (tex ? `\\class{dc-${from}-${to}}{${tex}}` : tex);

/** Algebra and formulae: the full parser. `src` must already be sanitised (offsets are into it). */
export function typedToTex(src) {
  const s = String(src);
  let i = 0;
  const peek = () => s[i];
  // the spelled-out words are read as their symbols, but keep their offsets
  const word = (w) => s.slice(i, i + w.length).toLowerCase() === w;

  function group() { // at "("
    const open = i;
    i++;
    const inner = expr();
    const closed = peek() === ')';
    if (closed) i++;
    const lp = tag(open, open + 1, '(');
    const rp = closed ? tag(i - 1, i, ')') : '';
    return { tex: lp + inner + rp, inner, closed };
  }
  function exponent() {
    if (peek() !== '^') return '';
    const hat = i;
    i++;
    if (peek() === '(') { const g = group(); return '^{' + tag(hat, hat + 1, '') + g.inner + '}'; }
    const from = i;
    let e = '';
    if (peek() === '-') { e += '-'; i++; }
    while (isDigit(peek())) e += s[i++];
    return '^{' + (e ? tag(from, i, e) : '\\square ') + '}';
  }
  function atom() {
    const c = peek();
    const from = i;
    let tex, grp = null;
    if (c === '(') { const g = group(); tex = g.tex; grp = g.closed ? g.inner : null; }
    else if (c === '√' || c === '∛' || word('sqrt') || word('cbrt')) {
      const cube = c === '∛' || word('cbrt');
      i += c === '√' || c === '∛' ? 1 : 4;
      const inner = peek() === '(' ? group().inner : (i < s.length ? atom().tex : '\\square ');
      tex = tag(from, from + 1, '') + (cube ? '\\sqrt[3]{' + inner + '}' : '\\sqrt{' + inner + '}');
      return { tex: tex + exponent(), grp };
    } else if (c === 'π' || word('pi')) { i += c === 'π' ? 1 : 2; tex = tag(from, i, '\\pi '); }
    else if (isLetter(c)) { i++; tex = tag(from, i, c); }
    else if (isDigit(c)) { let n = ''; while (isDigit(peek())) n += s[i++]; tex = tag(from, i, n); }
    else { i++; tex = ''; }
    return { tex: tex + exponent(), grp };
  }
  const startsAtom = (c) => c === '(' || c === '√' || c === '∛' || c === 'π' || isLetter(c) || isDigit(c) || c === '*';
  function product() { // one or more atoms side by side
    let tex = '', n = 0, grp = null;
    while (i < s.length && startsAtom(peek())) {
      if (peek() === '*') { tex += tag(i, i + 1, '\\cdot '); i++; continue; }
      const a = atom();
      tex += a.tex; n += 1; grp = n === 1 ? a.grp : null;
    }
    return { tex, grp: n === 1 ? grp : null };
  }
  function term() {
    let sign = '';
    while (peek() === '-' || peek() === '+') { sign += tag(i, i + 1, s[i]); i++; }
    let left = product();
    while (peek() === '/') {
      const bar = i;
      i++;
      const right = product();
      const num = left.grp != null ? left.grp : left.tex;
      const den = right.grp != null ? right.grp : right.tex;
      left = { tex: tag(bar, bar + 1, '') + '\\dfrac{' + (num || '\\square ') + '}{' + (den || '\\square ') + '}', grp: null };
    }
    return sign + left.tex;
  }
  function expr() {
    let out = term();
    while (peek() === '+' || peek() === '-') {
      const at = i;
      const op = s[i++];
      out += tag(at, at + 1, op) + term();
    }
    return out;
  }

  let out = '';
  while (i < s.length) {
    if (peek() === '=') { out += tag(i, i + 1, '='); i++; continue; }
    const before = i;
    out += expr();
    if (i < s.length && peek() !== '=') { if (s[i] === ')') out += tag(i, i + 1, ')'); i++; }
    if (i === before) i++; // never stall
  }
  return out;
}

/** A plain answer (digits, a base's figures, a Roman numeral): every character tagged on its own. */
export function plainToTex(src, roman = false) {
  const s = String(src);
  const one = (c, k) => tag(k, k + 1, roman || /[A-Z]/.test(c) ? `\\mathrm{${c}}` : c);
  const m = /^(-?)(\d+)\/(\d*)$/.exec(s);
  if (m) {
    // 3/8 stacks; the bar itself is tagged so the caret can stand at it
    const off = m[1].length;
    const num = [...m[2]].map((c, k) => one(c, off + k)).join('');
    const den = [...m[3]].map((c, k) => one(c, off + m[2].length + 1 + k)).join('');
    return (m[1] ? one('-', 0) : '') + tag(off + m[2].length, off + m[2].length + 1, '') + `\\tfrac{${num}}{${den || '\\square '}}`;
  }
  return [...s].map(one).join('');
}
