/* Build js/min2phase.js by vendoring cubejs (cube.js + solve.js) as an ESM
   module. One-off; the produced file is committed. Sources expected in /tmp
   (cube.js, min2.js = solve.js) or fetched fresh.
   Run: node home/games/rubiks-cube/scripts/build-min2phase.mjs <cube.js> <solve.js> */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const cubePath = process.argv[2];
const solvePath = process.argv[3];
const cube = readFileSync(cubePath, "utf8");
const solve = readFileSync(solvePath, "utf8");

// Rebind the outermost `).call(this)` of each vendored IIFE to our private ctx.
const fixLast = (s) => {
  const t = ").call(this)";
  const i = s.lastIndexOf(t);
  return s.slice(0, i) + ").call(__ctx)" + s.slice(i + t.length);
};

const header = [
  "/* =====================================================================",
  "   min2phase.js — Kociemba two-phase solver for the Fast (best-algorithm)",
  "   auto-solve. Produces near-optimal ~20-move solutions.",
  "",
  "   Vendored from cubejs@1.3.1 (cube.js + solve.js) by Sebastian Tuellmann,",
  "   MIT licensed. The ONLY change is mechanical: the two CommonJS/global",
  "   IIFEs now bind to a private `__ctx` object instead of the page global,",
  "   and we expose a small ESM helper. Fed the standard URFDLB facelet string",
  "   from cube-state.toFacelets(). Do not hand-edit the vendored bodies —",
  "   regenerate with scripts/build-min2phase.mjs.",
  "   ===================================================================== */",
  "/* eslint-disable */",
  "const __ctx = {};",
  "// Shadow `module` so the vendored cube.js always takes its global-export",
  "// branch (this.Cube = Cube) rather than CommonJS module.exports — keeps",
  "// behaviour identical in the browser and under any Node test harness.",
  "const module = undefined;",
  "",
].join("\n");

const footer = [
  "",
  "const Cube = __ctx.Cube;",
  "let _inited = false;",
  "",
  "// Solve a 54-char URFDLB facelet string; returns a face-turn string",
  '// (e.g. "U R2 F\' ...") or null if the state is invalid / unsolvable.',
  "export function solveFast(facelets, maxDepth = 22) {",
  "  if (!_inited) { Cube.initSolver(); _inited = true; }",
  "  try {",
  "    const sol = Cube.fromString(facelets).solve(maxDepth);",
  '    return sol && sol.trim().length ? sol.trim() : "";',
  "  } catch (e) {",
  "    return null;",
  "  }",
  "}",
  "",
  "export default Cube;",
  "",
].join("\n");

const out = header + fixLast(cube) + "\n" + fixLast(solve) + footer;
writeFileSync(join(here, "..", "js", "min2phase.js"), out);
console.log("wrote js/min2phase.js (" + out.length + " bytes)");
