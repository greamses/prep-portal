/* ============================================================================
   Cartesian Art — the expression engine behind the graphing panel
   ----------------------------------------------------------------------------
   What a learner types (y = 2x^2 - 3, x^2 + y^2 = 25, r = 1 + cos(theta),
   (cos t, sin t), f(x) = x/2, a = 3) is read here into a tree and compiled
   into plain JS closures. No eval, no DOM — node-testable on its own.

   It reads maths the way the rest of the site types it (math-linear.js), so
   what is drawn is what the typeset preview shows:
     • a `/` takes everything since the last + − = as its numerator, and the
       next run of multiplied factors as its denominator — 2x/3 is (2x)/3 and
       1/2x is 1/(2x);
     • letters side by side multiply (xy, 3ab), unless they spell a function
       or a constant (sin, sqrt, pi, theta);
     • a function written without brackets takes the factors after it, up to
       the next function: sin 2x = sin(2x), sin x cos x = sin(x)·cos(x).
   Restrictions and piecewise use braces: y = x^2 {x > 0}, {x < 0: -x, x}.
   ========================================================================== */

/* ── vocabulary ──────────────────────────────────────────────────────────── */

const gamma = (z) => {
  // Lanczos approximation, good to ~15 digits — for non-integer factorials
  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
};
function factorial(n) {
  if (Number.isInteger(n)) {
    if (n < 0) return NaN;
    if (n > 170) return Infinity;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  }
  return gamma(n + 1);
}

/** Real powers the way a maths class means them: (-8)^(1/3) is -2. */
export function realPow(a, b) {
  const r = Math.pow(a, b);
  if (r === r || a >= 0 || !isFinite(b)) return r;
  // negative base, fractional power: an odd denominator still has a real root
  for (let q = 3; q <= 99; q += 2) {
    const p = Math.round(b * q);
    if (Math.abs(p / q - b) < 1e-9) {
      const m = Math.pow(-a, b);
      return p % 2 === 0 ? m : -m;
    }
  }
  return NaN;
}

const gcd2 = (a, b) => { a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) [a, b] = [b, a % b]; return a; };

/** Built-in functions. `trig` ones read their argument in the chosen angle unit. */
const FN = {
  sin: { f: Math.sin, trig: 1 }, cos: { f: Math.cos, trig: 1 }, tan: { f: Math.tan, trig: 1 },
  sec: { f: (x) => 1 / Math.cos(x), trig: 1 }, csc: { f: (x) => 1 / Math.sin(x), trig: 1 },
  cot: { f: (x) => 1 / Math.tan(x), trig: 1 },
  asin: { f: Math.asin, inv: 1 }, acos: { f: Math.acos, inv: 1 }, atan: { f: Math.atan, inv: 1 },
  arcsin: { f: Math.asin, inv: 1 }, arccos: { f: Math.acos, inv: 1 }, arctan: { f: Math.atan, inv: 1 },
  sinh: { f: Math.sinh }, cosh: { f: Math.cosh }, tanh: { f: Math.tanh },
  asinh: { f: Math.asinh }, acosh: { f: Math.acosh }, atanh: { f: Math.atanh },
  sqrt: { f: Math.sqrt }, cbrt: { f: Math.cbrt }, abs: { f: Math.abs },
  ln: { f: Math.log }, log: { f: Math.log10 }, exp: { f: Math.exp },
  floor: { f: Math.floor }, ceil: { f: Math.ceil }, round: { f: Math.round },
  sign: { f: Math.sign }, sgn: { f: Math.sign },
  min: { f: Math.min, many: 1 }, max: { f: Math.max, many: 1 },
  mod: { f: (a, b) => ((a % b) + b) % b, n: 2 },
  gcd: { f: (...v) => v.reduce(gcd2), many: 1 },
  lcm: { f: (...v) => v.reduce((a, b) => Math.abs(a * b) / gcd2(a, b)), many: 1 },
  nCr: { f: (n, r) => factorial(n) / (factorial(r) * factorial(n - r)), n: 2 },
  nPr: { f: (n, r) => factorial(n) / factorial(n - r), n: 2 },
  root: { f: (n, x) => realPow(x, 1 / n), n: 2 },
  // the Algebra Moves keypad's spellings: logb(base, x), nroot(index, x)
  logb: { f: (b, x) => Math.log(x) / Math.log(b), n: 2 },
  nroot: { f: (n, x) => realPow(x, 1 / n), n: 2 },
};

const CONST = { pi: Math.PI, "π": Math.PI, tau: 2 * Math.PI, "τ": 2 * Math.PI, e: Math.E };

/** Greek names typed as words; read as one letter each. */
const GREEK = { theta: "θ", phi: "φ", alpha: "α", beta: "β", gamma: "γ", delta: "δ",
  lambda: "λ", mu: "μ", sigma: "σ", omega: "ω", rho: "ρ" };

/** Letters that are the plane's own variables, never a slider. */
export const RESERVED = new Set(["x", "y", "r", "θ", "t"]);

/* ── tokens ──────────────────────────────────────────────────────────────── */

const SUPS = { "²": "2", "³": "3", "¹": "1", "⁰": "0", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9" };
const isLetter = (c) => /[A-Za-zα-ωΑ-Ω]/.test(c);

class ParseError extends Error {}

/**
 * Text → tokens. `userFns` are the names of functions the learner has defined
 * (f, g …) so `f(x)` reads as a call and not as f times x.
 */
export function tokenize(src, userFns = new Set()) {
  const s = String(src).replace(/−|–/g, "-").replace(/×|·|⋅/g, "*").replace(/÷/g, "/")
    .replace(/≤/g, "<=").replace(/≥/g, ">=");
  const names = [...Object.keys(FN), ...Object.keys(CONST), ...Object.keys(GREEK), ...userFns]
    .filter((n) => n.length > 1)
    .sort((a, b) => b.length - a.length);
  const out = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === " " || c === "\t" || c === "\n") { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9]/.test(s[j])) j++;
      if (s[j] === ".") { j++; while (j < s.length && /[0-9]/.test(s[j])) j++; }
      const txt = s.slice(i, j);
      if (txt === ".") throw new ParseError("A point on its own is not a number");
      out.push({ t: "num", v: parseFloat(txt) });
      i = j;
      continue;
    }
    if (c in SUPS) {
      let j = i, d = "";
      while (j < s.length && s[j] in SUPS) d += SUPS[s[j++]];
      out.push({ t: "op", v: "^" }, { t: "num", v: parseFloat(d) });
      i = j;
      continue;
    }
    if (isLetter(c)) {
      // a run of letters: longest known name first, otherwise one letter
      let j = i;
      while (j < s.length && isLetter(s[j])) j++;
      const run = s.slice(i, j);
      let k = 0;
      while (k < run.length) {
        const rest = run.slice(k);
        const hit = names.find((n) => rest.startsWith(n));
        let name = hit || rest[0];
        k += name.length;
        if (GREEK[name]) name = GREEK[name];
        out.push({ t: "id", v: name });
      }
      i = j;
      // a subscript belongs to the letter before it: a_1, x_0 — and log_2 is a base
      if (s[i] === "_" && /[A-Za-z0-9]/.test(s[i + 1] || "")) {
        let m = i + 1;
        while (m < s.length && /[A-Za-z0-9.]/.test(s[m])) m++;
        const last = out[out.length - 1];
        if (last.v === "log") last.base = s.slice(i + 1, m);
        else last.v += s.slice(i, m);
        i = m;
      }
      continue;
    }
    const two = s.slice(i, i + 2);
    if (two === "<=" || two === ">=") { out.push({ t: "rel", v: two }); i += 2; continue; }
    if (c === "<" || c === ">" || c === "=") { out.push({ t: "rel", v: c }); i++; continue; }
    if (c === "√") { out.push({ t: "id", v: "sqrt" }); i++; continue; }
    if (c === "π") { out.push({ t: "id", v: "π" }); i++; continue; }
    if ("+-*/^(),|{}:![]°".includes(c)) {
      const v = c === "[" ? "(" : c === "]" ? ")" : c;
      out.push({ t: "op", v });
      i++;
      continue;
    }
    throw new ParseError(`I don't know the sign "${c}"`);
  }
  return out;
}

/* ── parser ──────────────────────────────────────────────────────────────── */

/**
 * Parse a whole line. Returns { items: [chain…] } where each chain is
 * { exprs: [node…], ops: ["=", "<"…] } — several items when the line is a
 * comma list such as (1,2), (3,4).
 */
export function parse(src, userFns = new Set()) {
  const toks = tokenize(src, userFns);
  let p = 0;
  let absDepth = 0;
  const peek = () => toks[p];
  const isOp = (v) => toks[p] && toks[p].t === "op" && toks[p].v === v;
  const take = (v) => {
    if (!isOp(v)) throw new ParseError(v === ")" ? "A bracket is not closed" : `Expected "${v}"`);
    p++;
  };

  const isFnName = (v) => v in FN || userFns.has(v);

  function chain() {
    const exprs = [sum()], ops = [];
    while (peek() && peek().t === "rel") {
      ops.push(toks[p++].v);
      exprs.push(sum());
    }
    return { exprs, ops };
  }

  function sum() {
    let a = term();
    while (isOp("+") || isOp("-")) {
      const op = toks[p++].v;
      a = { k: "bin", op, a, b: term() };
    }
    return a;
  }

  function term() {
    let a = chunk();
    while (isOp("*")) {
      p++;
      a = { k: "bin", op: "*", a, b: chunk() };
    }
    return a;
  }

  // numerator = the unary run since the last operator; each `/` takes one product
  function chunk() {
    let a = unary();
    while (isOp("/")) {
      p++;
      let b;
      if (isOp("-")) { p++; b = { k: "neg", a: prod() }; } else b = prod();
      a = { k: "bin", op: "/", a, b };
    }
    return a;
  }

  function unary() {
    if (isOp("-")) { p++; return { k: "neg", a: unary() }; }
    if (isOp("+")) { p++; return unary(); }
    return prod();
  }

  const startsAtom = (tk) => tk && (tk.t === "num" || tk.t === "id" ||
    (tk.t === "op" && (tk.v === "(" || tk.v === "{" || (tk.v === "|" && absDepth === 0))));

  // implicit multiplication; `stopAtFn` ends a bare function's argument
  function prod(stopAtFn = false) {
    let a = power();
    while (startsAtom(peek())) {
      if (stopAtFn && peek().t === "id" && isFnName(peek().v)) break;
      a = { k: "bin", op: "*", a, b: power() };
    }
    return a;
  }

  function power() {
    const base = postfix();
    if (isOp("^")) { p++; return { k: "pow", a: base, b: exponent() }; }
    return base;
  }
  function exponent() {
    if (isOp("-")) { p++; return { k: "neg", a: exponent() }; }
    if (isOp("+")) { p++; return exponent(); }
    const b = postfix();
    if (isOp("^")) { p++; return { k: "pow", a: b, b: exponent() }; }
    return b;
  }

  function postfix() {
    let a = atom();
    for (;;) {
      if (isOp("!")) { p++; a = { k: "fact", a }; }
      else if (isOp("°")) { p++; a = { k: "deg", a }; }
      else break;
    }
    return a;
  }

  function atom() {
    const tk = peek();
    if (!tk) throw new ParseError("Something is missing at the end");
    if (tk.t === "num") { p++; return { k: "num", v: tk.v }; }
    if (tk.t === "op" && tk.v === "(") {
      p++;
      const items = [sum()];
      while (isOp(",")) { p++; items.push(sum()); }
      take(")");
      return items.length === 1 ? items[0] : { k: "tuple", items };
    }
    if (tk.t === "op" && tk.v === "|") {
      p++;
      absDepth++;
      const a = sum();
      absDepth--;
      take("|");
      return { k: "call", name: "abs", args: [a] };
    }
    if (tk.t === "op" && tk.v === "{") return piecewise();
    if (tk.t === "id") {
      p++;
      const name = tk.v;
      if (name in CONST && !userFns.has(name)) return { k: "num", v: CONST[name], name };
      if (isFnName(name)) return call(name, tk.base);
      return { k: "var", name };
    }
    if (tk.t === "rel") throw new ParseError(`"${tk.v}" needs something before it`);
    throw new ParseError(tk.v === ")" ? "There is a closing bracket with no opening one" : `"${tk.v}" is in the wrong place`);
  }

  function call(name, base) {
    let powr = null;
    if (isOp("^")) { p++; powr = exponent(); } // sin^2 x
    let args;
    if (isOp("(")) {
      p++;
      args = [sum()];
      while (isOp(",")) { p++; args.push(sum()); }
      take(")");
    } else {
      if (!startsAtom(peek())) throw new ParseError(`${name} needs something to work on`);
      args = [prod(true)];
    }
    // log_2(x) is log(2, x): the base, then the number
    if (base != null) {
      const b = /^[0-9.]+$/.test(base) ? { k: "num", v: parseFloat(base) } : { k: "var", name: base };
      args = [b, ...args];
    }
    let node = { k: "call", name, args };
    if (powr) {
      // sin^-1 x is the inverse, sin^2 x is (sin x)^2
      const inv = { sin: "asin", cos: "acos", tan: "atan" }[name];
      if (powr.k === "neg" && powr.a.k === "num" && powr.a.v === 1 && inv) node = { k: "call", name: inv, args };
      else node = { k: "pow", a: node, b: powr };
    }
    return node;
  }

  function piecewise() {
    take("{");
    const cases = [];
    let otherwise = null;
    for (;;) {
      const c = chain();
      if (isOp(":")) {
        p++;
        if (!c.ops.length) throw new ParseError("A piece needs a condition before the colon");
        cases.push({ cond: c, value: sum() });
      } else if (c.ops.length) {
        cases.push({ cond: c, value: null });
      } else {
        otherwise = c.exprs[0];
      }
      if (isOp(",")) { p++; continue; }
      break;
    }
    take("}");
    return { k: "pw", cases, otherwise };
  }

  if (!toks.length) return { items: [] };
  const items = [chain()];
  while (isOp(",")) { p++; items.push(chain()); }
  if (p < toks.length) {
    const tk = toks[p];
    throw new ParseError(tk.v === ")" ? "There is a closing bracket with no opening one" : `"${tk.v}" is in the wrong place`);
  }
  return { items };
}

/* ── free variables ──────────────────────────────────────────────────────── */

export function freeVars(node, out = new Set()) {
  if (!node) return out;
  switch (node.k) {
    case "var": out.add(node.name); break;
    case "bin": case "pow": freeVars(node.a, out); freeVars(node.b, out); break;
    case "neg": case "fact": case "deg": freeVars(node.a, out); break;
    case "call": node.args.forEach((a) => freeVars(a, out)); break;
    case "tuple": node.items.forEach((a) => freeVars(a, out)); break;
    case "pw":
      node.cases.forEach((c) => { c.cond.exprs.forEach((e) => freeVars(e, out)); freeVars(c.value, out); });
      freeVars(node.otherwise, out);
      break;
  }
  return out;
}

/** Which user functions a tree calls. */
export function calledFns(node, out = new Set()) {
  if (!node) return out;
  if (node.k === "call" && !(node.name in FN)) out.add(node.name);
  for (const key of ["a", "b", "otherwise", "value"]) if (node[key]) calledFns(node[key], out);
  (node.args || []).forEach((a) => calledFns(a, out));
  (node.items || []).forEach((a) => calledFns(a, out));
  (node.cases || []).forEach((c) => { c.cond.exprs.forEach((e) => calledFns(e, out)); calledFns(c.value, out); });
  return out;
}

/* ── compiler ────────────────────────────────────────────────────────────── */

const cmp = (op, a, b) =>
  op === "<" ? a < b : op === ">" ? a > b : op === "<=" ? a <= b : op === ">=" ? a >= b : Math.abs(a - b) < 1e-9;

/**
 * Compile a tree to `(env) => number`. `env` is a plain object of variable
 * values; `ctx.fns` maps user function names to { params, body } (compiled
 * lazily, so f may call g defined further down); `ctx.deg` reads trig in degrees.
 */
export function compile(node, ctx = {}) {
  const deg = !!ctx.deg;
  const toRad = deg ? Math.PI / 180 : 1;
  const fromRad = deg ? 180 / Math.PI : 1;
  const fns = ctx.fns || {};
  let depth = 0;

  function c(n) {
    switch (n.k) {
      case "num": { const v = n.v; return () => v; }
      case "var": {
        const name = n.name;
        return (env) => { const v = env[name]; return v === undefined ? NaN : v; };
      }
      case "neg": { const a = c(n.a); return (env) => -a(env); }
      case "fact": { const a = c(n.a); return (env) => factorial(a(env)); }
      // 30° is an angle whichever unit the trig is reading
      case "deg": { const a = c(n.a), k = deg ? 1 : Math.PI / 180; return (env) => a(env) * k; }
      case "pow": {
        const a = c(n.a), b = c(n.b);
        // the common square stays a multiply: faster, and exact
        if (n.b.k === "num" && n.b.v === 2) return (env) => { const v = a(env); return v * v; };
        return (env) => realPow(a(env), b(env));
      }
      case "bin": {
        const a = c(n.a), b = c(n.b);
        if (n.op === "+") return (env) => a(env) + b(env);
        if (n.op === "-") return (env) => a(env) - b(env);
        if (n.op === "*") return (env) => a(env) * b(env);
        return (env) => a(env) / b(env);
      }
      case "tuple": return () => NaN; // a point inside arithmetic means nothing here
      case "pw": {
        const cases = n.cases.map((k) => ({ cond: condOf(k.cond), value: k.value ? c(k.value) : () => 1 }));
        const other = n.otherwise ? c(n.otherwise) : () => NaN;
        return (env) => {
          for (const k of cases) if (k.cond(env)) return k.value(env);
          return other(env);
        };
      }
      case "call": {
        const args = n.args.map(c);
        const b = FN[n.name];
        if (b) {
          if (b.n && args.length !== b.n) throw new ParseError(`${n.name} takes ${b.n} numbers`);
          if (!b.many && !b.n && args.length !== 1) {
            if (n.name === "atan" || n.name === "arctan") {
              if (args.length === 2) {
                const [y, x] = args;
                return (env) => Math.atan2(y(env), x(env)) * fromRad;
              }
            }
            if (n.name === "log" && args.length === 2) {
              const [base, x] = args;
              return (env) => Math.log(x(env)) / Math.log(base(env));
            }
            throw new ParseError(`${n.name} takes one number`);
          }
          const f = b.f;
          if (b.trig) { const a = args[0]; return (env) => f(a(env) * toRad); }
          if (b.inv) { const a = args[0]; return (env) => f(a(env)) * fromRad; }
          if (args.length === 1) { const a = args[0]; return (env) => f(a(env)); }
          if (args.length === 2) { const [a, bb] = args; return (env) => f(a(env), bb(env)); }
          return (env) => f(...args.map((g) => g(env)));
        }
        const def = fns[n.name];
        if (!def) throw new ParseError(`${n.name} is not defined`);
        if (def.params.length !== args.length) throw new ParseError(`${n.name} takes ${def.params.length} number${def.params.length > 1 ? "s" : ""}`);
        let body = null;
        const params = def.params;
        return (env) => {
          if (!body) {
            if (depth > 30) throw new ParseError(`${n.name} is defined in terms of itself`);
            depth++;
            try { body = c(def.body); } finally { depth--; }
          }
          const local = Object.create(env);
          for (let i = 0; i < params.length; i++) local[params[i]] = args[i](env);
          return body(local);
        };
      }
    }
    throw new ParseError("Unreadable");
  }

  function condOf(chainNode) {
    const ex = chainNode.exprs.map(c);
    const ops = chainNode.ops;
    return (env) => {
      let left = ex[0](env);
      for (let i = 0; i < ops.length; i++) {
        const right = ex[i + 1](env);
        if (!cmp(ops[i], left, right)) return false;
        left = right;
      }
      return true;
    };
  }

  return c(node);
}

export { ParseError, FN, CONST };
