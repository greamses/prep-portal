/* =====================================================================
   Algorithm string parsing — tokenises notation into move objects and
   inverts whole algorithms. Used by playback, thumbnails and the solver.
   ===================================================================== */
import { TURN } from "./constants.js";

// Tokenise an algorithm string into { base, turn, prime, double }.
const MOVE_RE = /(Uw|Dw|Lw|Rw|Fw|Bw|[UDLRFBMESxyzudlrfb])(['2]?)/g;

export function parseMoves(str) {
  const out = [];
  MOVE_RE.lastIndex = 0;
  let m;
  while ((m = MOVE_RE.exec(str))) {
    const turn = TURN[m[1]];
    if (!turn) continue;
    out.push({ base: m[1], turn, prime: m[2] === "'", double: m[2] === "2" });
  }
  return out;
}

// Reverse an algorithm: flip order, invert each move (X↔X', X2 stays X2).
export function invertMoves(str) {
  return parseMoves(str)
    .reverse()
    .map((t) => t.base + (t.double ? "2" : t.prime ? "" : "'"))
    .join(" ");
}
