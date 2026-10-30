/* ============================================================================
   Cartesian Art — what each line of the graphing panel MEANS
   ----------------------------------------------------------------------------
   Takes the panel's rows (plain text) and decides, the way Desmos does, what
   each one is:
     a = 3                 a slider (a number the other lines may use)
     b = 2a                a constant worked out from others
     f(x) = x^2 - 1        a function (drawn too, when its variable is x)
     y = 2x + 1, x^2       a curve y = f(x)
     x = y^2               a curve x = g(y)
     r = 2cos(3θ)          a polar curve
     (cos t, 2sin t)       a parametric curve, t from the row's range
     (1, 2), (a, 4)        points
     x^2 + y^2 = 25        an implicit curve
     y < x^2, x^2+y^2 ≤ 9  a shaded region and its boundary
     2^10                  a sum to work out (the answer is shown)
   Pure — no DOM. Plotting lives in graph.js.
   ========================================================================== */

import { parse, compile, freeVars, RESERVED, FN, CONST } from "./expr.js";

const DEF_FN = /^\s*([A-Za-z](?:_[A-Za-z0-9]+)?)\s*\(\s*((?:[A-Za-zθ]+)(?:\s*,\s*[A-Za-zθ]+)*)\s*\)\s*=(?![=<>])/;
const GREEK = { theta: "θ" };

const subset = (set, allowed) => [...set].every((v) => allowed.has(v));
const isVar = (n, name) => n && n.k === "var" && (name ? n.name === name : true);

/** Variables a row may leave free, by kind. */
const XS = new Set(["x"]), YS = new Set(["y"]), XY = new Set(["x", "y"]);
const TH = new Set(["θ"]), TS = new Set(["t"]);

/**
 * Analyse every row. `rows` = [{ id, src, range? }]; `opts.deg` reads trig in
 * degrees. Returns { results: Map(id → result), params: {name: value} }.
 *
 * A result: { kind, error?, missing?, value?, curves?, region?, strict?,
 *             points?, param?, fnName? }
 *   curves: [{ type: "fnx"|"fny", f } | { type: "param", fx, fy, t0, t1 } |
 *            { type: "implicit", F }]
 */
export function analyze(rows, opts = {}) {
  const results = new Map();

  // 1 — the names of functions being defined, so f(x) reads as a call
  const userFns = new Set();
  for (const r of rows) {
    const m = DEF_FN.exec(r.src || "");
    if (!m) continue;
    const name = m[1];
    if (name in FN || name in CONST || RESERVED.has(name)) continue;
    userFns.add(name);
  }

  // 2 — parse everything
  const parsed = rows.map((r) => {
    const src = (r.src || "").trim();
    if (!src) return { r, empty: true };
    try { return { r, tree: parse(src, userFns) }; } catch (e) { return { r, error: e.message || "I can't read this" }; }
  });

  // 3 — definitions: functions and named numbers
  const fns = {};
  const paramRows = [];
  for (const p of parsed) {
    if (!p.tree) continue;
    const items = p.tree.items;
    if (items.length !== 1) continue;
    const { exprs, ops } = items[0];
    if (ops.length !== 1 || ops[0] !== "=") continue;
    const [lhs, rhs] = exprs;
    if (lhs.k === "call" && userFns.has(lhs.name) && lhs.args.every((a) => isVar(a))) {
      const params = lhs.args.map((a) => GREEK[a.name] || a.name);
      if (fns[lhs.name]) { p.error = `${lhs.name} is defined twice`; continue; }
      fns[lhs.name] = { params, body: rhs };
      p.fnDef = { name: lhs.name, params, body: rhs };
    } else if (isVar(lhs) && !RESERVED.has(lhs.name)) {
      p.paramDef = { name: lhs.name, rhs };
      paramRows.push(p);
    }
  }

  // named numbers, worked out in whatever order they can be
  const params = {};
  const seen = new Set();
  for (const p of paramRows) {
    if (seen.has(p.paramDef.name)) p.error = `${p.paramDef.name} is defined twice`;
    seen.add(p.paramDef.name);
  }
  let pending = paramRows.filter((p) => !p.error);
  for (let pass = 0; pass < pending.length + 1 && pending.length; pass++) {
    const next = [];
    for (const p of pending) {
      const free = freeVars(p.paramDef.rhs);
      if (subset(free, new Set(Object.keys(params)))) {
        try {
          const v = compile(p.paramDef.rhs, { fns, deg: opts.deg })({ ...params });
          params[p.paramDef.name] = v;
          p.value = v;
        } catch (e) { p.error = e.message; }
      } else next.push(p);
    }
    if (next.length === pending.length) {
      for (const p of next) {
        const miss = [...freeVars(p.paramDef.rhs)].filter((v) => !(v in params) && !seen.has(v));
        if (miss.some((v) => RESERVED.has(v))) p.error = `${p.paramDef.name} can't depend on ${miss.find((v) => RESERVED.has(v))}`;
        else if (miss.length) { p.error = `Define ${miss.join(", ")}`; p.missing = miss; }
        else p.error = `${p.paramDef.name} is defined in terms of itself`;
      }
      break;
    }
    pending = next;
  }

  const known = new Set(Object.keys(params));
  const allowed = (extra) => new Set([...known, ...extra]);
  const ctx = { fns, deg: opts.deg };

  // a compiled function of one plane variable, reading the named numbers
  const fn1 = (node, v) => {
    const f = compile(node, ctx);
    const env = { ...params };
    return (a) => { env[v] = a; return f(env); };
  };
  const fn2 = (node) => {
    const f = compile(node, ctx);
    const env = { ...params };
    return (x, y) => { env.x = x; env.y = y; return f(env); };
  };
  const missingOf = (nodes, extra) => {
    const ok = allowed(extra);
    const miss = new Set();
    for (const n of nodes) for (const v of freeVars(n)) if (!ok.has(v)) miss.add(v);
    return [...miss];
  };
  const fail = (miss) => {
    const plain = miss.filter((v) => !RESERVED.has(v));
    return plain.length
      ? { kind: "error", error: `Define ${plain.join(", ")}`, missing: plain }
      : { kind: "error", error: `This uses ${miss.join(" and ")}, which can't go together here` };
  };

  // 4 — everything that is drawn or worked out
  for (const p of parsed) {
    const id = p.r.id;
    if (p.empty) { results.set(id, { kind: "empty" }); continue; }
    if (p.error) { results.set(id, { kind: "error", error: p.error, missing: p.missing }); continue; }
    try {
      results.set(id, classify(p));
    } catch (e) {
      results.set(id, { kind: "error", error: e.message || "I can't read this" });
    }
  }

  function classify(p) {
    if (p.paramDef) {
      const slider = p.paramDef.rhs.k === "num" ||
        (p.paramDef.rhs.k === "neg" && p.paramDef.rhs.a.k === "num");
      return { kind: slider ? "slider" : "constant", param: p.paramDef.name, value: p.value };
    }
    if (p.fnDef) {
      const { params: ps, body, name } = p.fnDef;
      const miss = missingOf([body], ps);
      if (miss.length) return fail(miss);
      if (ps.length === 1 && ps[0] === "x") {
        return { kind: "curve", fnName: name, curves: [{ type: "fnx", f: fn1(body, "x") }] };
      }
      return { kind: "function", fnName: name };
    }

    const items = p.tree.items;
    const lone = items.every((it) => it.ops.length === 0);

    // points and parametric curves
    if (lone && items.every((it) => it.exprs[0].k === "tuple")) {
      for (const it of items) if (it.exprs[0].items.length !== 2) throw new Error("A point needs exactly two numbers");
      const nodes = items.flatMap((it) => it.exprs[0].items);
      const free = new Set(nodes.flatMap((n) => [...freeVars(n)]));
      if (free.has("t")) {
        if (items.length > 1) throw new Error("Write one parametric curve per line");
        const miss = missingOf(nodes, TS);
        if (miss.length) return fail(miss);
        const [a, b] = items[0].exprs[0].items;
        const rg = rangeOf(p.r, ctx, params);
        return { kind: "curve", param: "t", curves: [{ type: "param", fx: fn1(a, "t"), fy: fn1(b, "t"), t0: rg[0], t1: rg[1] }] };
      }
      const miss = missingOf(nodes, []);
      if (miss.length) return fail(miss);
      const points = items.map((it) => {
        const [a, b] = it.exprs[0].items;
        return { x: compile(a, ctx)({ ...params }), y: compile(b, ctx)({ ...params }) };
      });
      return { kind: "points", points };
    }

    if (items.length !== 1) throw new Error("Use a new line for each equation");
    const { exprs, ops } = items[0];

    // a bare expression: a sum to work out, or y = that expression
    if (!ops.length) {
      const e = exprs[0];
      const free = freeVars(e);
      const miss = missingOf([e], XS);
      if (!free.size || subset(free, known)) {
        return { kind: "value", value: compile(e, ctx)({ ...params }) };
      }
      if (miss.length) return fail(miss);
      return { kind: "curve", curves: [{ type: "fnx", f: fn1(e, "x") }] };
    }

    const inequality = ops.some((o) => o !== "=");
    if (inequality && ops.includes("=")) throw new Error("Use either = or an inequality, not both");
    if (!inequality && ops.length > 1) throw new Error("Use only one = sign");

    // which plane variables does the line use?
    const all = new Set(exprs.flatMap((e) => [...freeVars(e)]));
    const plane = new Set([...all].filter((v) => !known.has(v)));

    // polar: r = f(θ)
    if (!inequality && ops.length === 1) {
      const [L, R] = exprs;
      const polar = (isVar(L, "r") && subset(freeVars(R), allowed(TH))) ? R
        : (isVar(R, "r") && subset(freeVars(L), allowed(TH))) ? L : null;
      if (polar && !freeVars(polar).has("r")) {
        const f = fn1(polar, "θ");
        const rg = rangeOf(p.r, ctx, params);
        return {
          kind: "curve", param: "θ",
          curves: [{ type: "param", fx: (t) => f(t) * Math.cos(t), fy: (t) => f(t) * Math.sin(t), t0: rg[0], t1: rg[1] }],
        };
      }
    }

    const miss = missingOf(exprs, XY);
    if (miss.length) return fail(miss);
    if (!plane.size) {
      // nothing to draw: say whether it is true
      const vals = exprs.map((e) => compile(e, ctx)({ ...params }));
      let ok = true;
      for (let i = 0; i < ops.length; i++) {
        const a = vals[i], b = vals[i + 1];
        const o = ops[i];
        ok = ok && (o === "<" ? a < b : o === ">" ? a > b : o === "<=" ? a <= b : o === ">=" ? a >= b : Math.abs(a - b) < 1e-9);
      }
      return { kind: "truth", value: ok };
    }

    // one boundary per relation sign
    const curves = [];
    const tests = [];
    for (let i = 0; i < ops.length; i++) {
      const L = exprs[i], R = exprs[i + 1];
      curves.push(boundary(L, R));
      if (inequality) {
        const F = fn2({ k: "bin", op: "-", a: L, b: R });
        const o = ops[i];
        tests.push((x, y) => {
          const v = F(x, y);
          return o === "<" ? v < 0 : o === ">" ? v > 0 : o === "<=" ? v <= 0 : v >= 0;
        });
      }
    }
    if (!inequality) return { kind: "curve", curves };
    return {
      kind: "region",
      curves,
      strict: ops.every((o) => o === "<" || o === ">"),
      region: (x, y) => tests.every((t) => t(x, y)),
    };
  }

  // y = f(x) and x = g(y) are drawn exactly; anything else is implicit
  function boundary(L, R) {
    const fl = freeVars(L), fr = freeVars(R);
    if (isVar(L, "y") && !fr.has("y")) return { type: "fnx", f: fn1(R, "x") };
    if (isVar(R, "y") && !fl.has("y")) return { type: "fnx", f: fn1(L, "x") };
    if (isVar(L, "x") && !fr.has("x")) return { type: "fny", f: fn1(R, "y") };
    if (isVar(R, "x") && !fl.has("x")) return { type: "fny", f: fn1(L, "y") };
    return { type: "implicit", F: fn2({ k: "bin", op: "-", a: L, b: R }) };
  }

  return { results, params };
}

/** A row's parameter range (t or θ): its own typed bounds, else 0 … 2π. */
function rangeOf(row, ctx, params) {
  const read = (s, d) => {
    if (s == null || String(s).trim() === "") return d;
    try {
      const t = parse(String(s));
      const v = compile(t.items[0].exprs[0], ctx)({ ...params });
      return isFinite(v) ? v : d;
    } catch { return d; }
  };
  const rg = row.range || {};
  return [read(rg.min, 0), read(rg.max, 2 * Math.PI)];
}

/** Format a number for the panel: trimmed, no float noise. */
export function fmtNum(v) {
  if (v === true) return "true";
  if (v === false) return "false";
  if (typeof v !== "number" || Number.isNaN(v)) return "undefined";
  if (!isFinite(v)) return v > 0 ? "∞" : "−∞";
  const a = Math.abs(v);
  if (a !== 0 && (a >= 1e10 || a < 1e-6)) return v.toExponential(4).replace(/\.?0+e/, "e");
  return String(Number(v.toPrecision(10))).replace("-", "−");
}
