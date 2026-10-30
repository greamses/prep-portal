/* ═══════════════════════════════════════════════════════════════════════════
   TeX → the line the keypad reads

   Equations arrive written as TeX — pasted from a worksheet, copied from a
   chat, set in a note: \frac{3x^2 - 12}{x^2 - x - 2}. The keypad's own line is
   the plain one the page types: (3x^2 - 12)/(x^2 - x - 2). This turns the first
   into the second, for the pieces of TeX a school equation is made of; anything
   it does not know it leaves as it was, and the parser says what it makes of it.
   ═══════════════════════════════════════════════════════════════════════════ */

const GREEK = {
  alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", varepsilon: "ε", zeta: "ζ", eta: "η",
  theta: "θ", vartheta: "θ", iota: "ι", kappa: "κ", lambda: "λ", mu: "μ", nu: "ν", xi: "ξ", pi: "π",
  rho: "ρ", sigma: "σ", tau: "τ", upsilon: "υ", phi: "φ", varphi: "φ", chi: "χ", psi: "ψ", omega: "ω",
};
const SAME = new Set(["sin", "cos", "tan", "ln", "log", "det", "arcsin", "arccos", "arctan", "mean", "median", "mode", "sum"]);
const SPACES = new Set([",", ";", ":", "!", " ", "quad", "qquad"]);

/** The balanced { … } group starting at s[i] === "{": [inner text, index after it]. */
function group(s, i) {
  let depth = 0;
  for (let k = i; k < s.length; k++) {
    if (s[k] === "\\") { k++; continue; }
    if (s[k] === "{") depth++;
    else if (s[k] === "}" && --depth === 0) return [s.slice(i + 1, k), k + 1];
  }
  return [s.slice(i + 1), s.length];                 // a group never shut: take the rest
}

/** Is every { shut? (A piece of TeX that stops mid-group is still being typed.) */
export function balanced(s) {
  let depth = 0;
  for (let k = 0; k < s.length; k++) {
    if (s[k] === "\\") { k++; continue; }
    if (s[k] === "{") depth++;
    else if (s[k] === "}") depth--;
  }
  return depth === 0;
}

/** Does this look like TeX at all? */
export const looksLikeTeX = (s) => /\\[A-Za-z]+|\\[(\[]|\$/.test(String(s));

/** The group or single token after a command or a ^ / _: [linear text, next index]. */
function operand(s, i) {
  while (s[i] === " ") i++;
  if (s[i] === "{") { const [inner, next] = group(s, i); return [`(${convert(inner)})`, next]; }
  if (s[i] === "\\") {
    const m = /^\\([A-Za-z]+)/.exec(s.slice(i));
    if (m) { const [out, next] = command(s, i); return [out, next]; }
    return [s[i + 1] || "", i + 2];
  }
  return [s[i] || "", i + 1];
}

/** One backslash command at s[i]: [its linear text, index after it and its arguments]. */
function command(s, i) {
  const m = /^\\([A-Za-z]+)/.exec(s.slice(i));
  if (!m) {
    const c = s[i + 1] || "";
    if (SPACES.has(c)) return [" ", i + 2];
    if ("{}%&#_$".includes(c)) return [c === "{" || c === "}" ? "" : c, i + 2];
    return [c, i + 2];
  }
  const name = m[1];
  let at = i + m[0].length;
  const arg = () => { const [out, next] = operand(s, at); at = next; return out; };
  const bare = (t) => (t.startsWith("(") && t.endsWith(")") ? t.slice(1, -1) : t);
  switch (name) {
    case "frac": case "dfrac": case "tfrac": { const a = arg(), b = arg(); return [`(${bare(a)})/(${bare(b)})`, at]; }
    case "sqrt": {
      while (s[at] === " ") at++;
      if (s[at] === "[") return [`sqrt(${bare(arg())})`, at];           // an nth root is left for the parser to refuse
      return [`sqrt(${bare(arg())})`, at];
    }
    case "binom": case "dbinom": { const n = arg(), r = arg(); return [`nCr(${bare(n)},${bare(r)})`, at]; }
    case "cdot": case "times": case "ast": return ["*", at];
    case "div": return ["/", at];
    case "pm": return ["±", at];
    case "left": case "right": case "displaystyle": case "textstyle": case "mathrm": case "mathit": case "text": case "operatorname":
      if (name === "mathrm" || name === "mathit" || name === "text" || name === "operatorname") return [bare(arg()), at];
      // \left( and \right) : the bracket that follows is just a bracket
      return ["", at];
    case "ne": case "neq": return ["≠", at];
    case "le": case "leq": case "leqslant": return ["≤", at];
    case "ge": case "geq": case "geqslant": return ["≥", at];
    case "lt": return ["<", at];
    case "gt": return [">", at];
    case "sum": return ["Σ", at];
    case "circ": return ["°", at];
    case "degree": return ["°", at];
    default:
      if (GREEK[name]) return [GREEK[name], at];
      if (SAME.has(name)) return [name, at];
      return [`\\${name}`, at];                                            // unknown: left as it was
  }
}

/** TeX text as the keypad's line. */
export function convert(s) {
  let out = "";
  for (let i = 0; i < s.length;) {
    const c = s[i];
    if (c === "\\") {
      if (s[i + 1] === "(" || s[i + 1] === ")" || s[i + 1] === "[" || s[i + 1] === "]") { i += 2; continue; }   // \( \) \[ \] delimiters
      const [t, next] = command(s, i);
      out += t;
      i = next;
    } else if (c === "$") {
      i++;
    } else if (c === "{") {
      const [inner, next] = group(s, i);
      out += `(${convert(inner)})`;
      i = next;
    } else if (c === "^" || c === "_") {
      out += c;
      const [t, next] = operand(s, i + 1);
      out += t.startsWith("(") || t.length === 1 ? t : `(${t})`;
      i = next;
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

/** The linear form, spaces collapsed. */
export function texToLinear(tex) {
  return convert(String(tex)).replace(/\s+/g, " ").trim();
}
