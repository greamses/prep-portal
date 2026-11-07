/* ═══════════════════════════════════════════════════════
   DRILLS — what the player has typed so far, as TeX.
   "/" becomes a stacked fraction as soon as it is typed: the product just
   before it is the numerator, the product just after it the denominator
   (implicit multiplication binds tighter than "/", the same rule the answer
   checks use). Tolerant of half-typed input: an unclosed "(" shows as "(",
   a trailing "/" shows an empty box under the bar.
═══════════════════════════════════════════════════════ */
/* The caret, when it sits inside the answer (moved by the arrow keys or a
   click): a marker character in the typed string, drawn as a coloured bar. */
export const CARET = '‸';
export const CARET_TEX = '{\\color{#e8574d}{\\vert}}';

const isLetter = (c) => !!c && /[A-Za-z]/.test(c);
const isDigit = (c) => !!c && /[0-9.]/.test(c);

export function typedToTex(src) {
  const s = String(src).replace(/\s+/g, '').replace(/[−–]/g, '-')
    .replace(/sqrt/gi, '√').replace(/cbrt/gi, '∛').replace(/pi/gi, 'π');
  let i = 0;
  const peek = () => s[i];

  function group() { // at "("
    i++;
    const inner = expr();
    const closed = peek() === ')';
    if (closed) i++;
    return { tex: '(' + inner + (closed ? ')' : ''), inner, closed };
  }
  function exponent() {
    if (peek() !== '^') return '';
    i++;
    if (peek() === '(') { const g = group(); return '^{' + g.inner + '}'; }
    let e = '';
    if (peek() === '-') { e += '-'; i++; }
    while (isDigit(peek())) e += s[i++];
    return '^{' + e + '}';
  }
  function atom() {
    const c = peek();
    let tex, grp = null;
    if (c === '(') { const g = group(); tex = g.tex; grp = g.closed ? g.inner : null; }
    else if (c === '√' || c === '∛') {
      i++;
      const inner = peek() === '(' ? group().inner : atom().tex;
      tex = c === '√' ? '\\sqrt{' + inner + '}' : '\\sqrt[3]{' + inner + '}';
    } else if (c === 'π') { i++; tex = '\\pi '; }
    else if (c === CARET) { i++; tex = CARET_TEX; }
    else if (isLetter(c)) { i++; tex = c; }
    else if (isDigit(c)) { let n = ''; while (isDigit(peek())) n += s[i++]; tex = n; }
    else { i++; tex = ''; }
    return { tex: tex + exponent(), grp };
  }
  const startsAtom = (c) => c === CARET || c === '(' || c === '√' || c === '∛' || c === 'π' || isLetter(c) || isDigit(c) || c === '*';
  function product() { // one or more atoms side by side
    let tex = '', n = 0, grp = null;
    while (i < s.length && startsAtom(peek())) {
      if (peek() === '*') { i++; tex += '\\cdot '; continue; }
      const a = atom();
      tex += a.tex; n += 1; grp = n === 1 ? a.grp : null;
    }
    return { tex, grp: n === 1 ? grp : null };
  }
  function term() {
    let sign = '';
    while (peek() === '-' || peek() === '+') sign += s[i++];
    let left = product();
    while (peek() === '/') {
      i++;
      const right = product();
      const num = left.grp != null ? left.grp : left.tex;
      const den = right.grp != null ? right.grp : right.tex;
      left = { tex: '\\dfrac{' + (num || '\\square ') + '}{' + (den || '\\square ') + '}', grp: null };
    }
    return sign + left.tex;
  }
  function expr() {
    let out = term();
    while (peek() === '+' || peek() === '-') {
      const op = s[i++];
      out += op + term();
    }
    return out;
  }

  let out = '';
  while (i < s.length) {
    if (peek() === '=') { i++; out += '='; continue; }
    const before = i;
    out += expr();
    if (i < s.length && peek() !== '=') { if (s[i] === ')') out += ')'; i++; }
    if (i === before) i++; // never stall
  }
  return out;
}
