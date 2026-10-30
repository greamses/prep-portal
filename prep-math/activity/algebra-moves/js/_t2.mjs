import fs from "node:fs";
globalThis.document = { createElement: () => ({ getContext: () => ({ font: "", measureText: (t) => ({ width: t.length * 10 }) }) }) };
const P = await import("./parse.js"); const O = await import("./ops.js"); const A = await import("./ast.js"); const RU = await import("./rules.js"); const L = await import("./layout.js");
const ex = JSON.parse(fs.readFileSync("C:/Users/PC/AppData/Local/Temp/claude/C--Users-PC-Desktop-prep-portal/2ff8850d-1b2f-440e-b7f2-391d5b8bca36/scratchpad/examples.json", "utf8"));
const want = ["r-reorder","r-q-group","r-swap-factors","r-log-own","r-base-expand","r-base-ten","r-base-to","r-tofrac","r-todec","r-topct","r-improper","r-tomixed","r-split"];
const rules = {}; for (const g of RU.RULE_GROUPS) for (const r of g.items) rules[r.id] = r;
for (const id of want) {
  const rule = rules[id]; const eq = P.parse(ex[id]);
  const cands = [];
  A.walk(eq, (n) => { for (const s of ["t", "bar", "lp", "op1", "op2", "eq"]) cands.push([`${n.id}#${s}`, n.kind, s]); });
  let hit = null;
  for (const [key, kind, s] of cands) {
    for (const o of O.everyOffer(eq, [key], {})) {
      if (o.needsInput || !rule.keys.includes(o.key)) continue;
      const res = o.cards ? null : o.run?.();
      if (!o.cards && (!res || res.error)) continue;
      if (!RU.ruleFits(rule, o, res)) continue;
      hit = `${kind}#${s}`; break;
    }
    if (hit) break;
  }
  console.log(id.padEnd(16), ex[id].padEnd(28), "->", hit || "NONE");
}
