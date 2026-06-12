/* Isolated, staged check of the beginner last-layer steps. Start solved
   (post-z2), scramble ONLY the last layer with F2L-preserving algs, then run
   each LL step and report which stage first fails.
   Run: node home/games/rubiks-cube/scripts/test-ll.mjs [N]                    */
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const imp = (f) => import(pathToFileURL(join(here, "..", "js", f)));
const { _t } = await imp("solve.js");
const { makeState, turn, alg, isSolvedFaces, llCross, llEdges, llPlaceCorners, llOrientCorners, llCornersPlaced } = _t;

function solvedTargets() {
  const cs = [];
  for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
    if (!x && !y && !z) continue;
    cs.push({ home: [x, y, z], pos: [x, y, z], rot: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] });
  }
  return cs;
}
const LL_SCRAMBLERS = [
  "U", "U'", "U2",
  "F R U R' U' F'",
  "R U' R U R U R U' R' U' R2",
  "R2 U R U R' U' R' U' R' U R'",
  "x R' U R' D2 R U' R' D2 R2 x'",
  "R U R' U R U2 R'",
  "R U2 R' U' R U' R'",
];

const N = +(process.argv[2] || 200);
const fails = { cross: 0, edges: 0, place: 0, orient: 0, final: 0 };
let solved = 0;
for (let i = 0; i < N; i++) {
  const st = makeState(solvedTargets());
  turn(st, "z", "2");
  const k = 4 + ((Math.random() * 8) | 0);
  for (let j = 0; j < k; j++) alg(st, LL_SCRAMBLERS[(Math.random() * LL_SCRAMBLERS.length) | 0]);

  if (!llCross(st)) { fails.cross++; continue; }
  if (!llEdges(st)) { fails.edges++; continue; }
  if (!llPlaceCorners(st)) { fails.place++; continue; }
  if (!llCornersPlaced(st)) { fails.place++; continue; }
  if (!llOrientCorners(st)) { fails.orient++; continue; }
  if (!isSolvedFaces(st)) { fails.final++; continue; }
  solved++;
}
console.log(`${N} scrambles: ${solved} solved`);
console.log(`  fails — cross:${fails.cross} edges:${fails.edges} place:${fails.place} orient:${fails.orient} final:${fails.final}`);
process.exit(solved === N ? 0 : 1);
