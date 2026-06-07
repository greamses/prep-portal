// boardGenerator.js — ES6 Module

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { const t = b; b = a % b; a = t; }
  return a;
}

/**
 * @param {string} difficulty — 'easy' | 'standard' | 'hard'
 * @param {object|null} questionPlugin — a QuestionPlugin from mathPlugins.js
 *   If null, falls back to inline fraction generation (safe default).
 */
export function generateRandomBoard(difficulty = 'standard', questionPlugin = null) {
  let snakeCount, ladderCount;
  switch (difficulty) {
    case 'easy':  snakeCount = 2; ladderCount = 5; break;
    case 'hard':  snakeCount = 6; ladderCount = 3; break;
    default:      snakeCount = 4; ladderCount = 4; break;
  }

  const snakes = {}, snakeColors = {}, ladders = {};
  const used   = new Set([1, 64]);
  const PALETTE= ['#c0392b','#27ae60','#8e44ad','#d35400','#2980b9','#f39c12'];

  for (let count=0,iter=0; count<ladderCount && iter<2000; iter++) {
    const bot = randomInt(3, 53);
    const top = randomInt(bot + 7, Math.min(bot + 26, 63));
    if (!used.has(bot) && !used.has(top)) {
      ladders[bot] = top; used.add(bot); used.add(top); count++;
    }
  }

  for (let count=0,iter=0; count<snakeCount && iter<2000; iter++) {
    const head = randomInt(20, 63);
    const tail = randomInt(2, Math.max(2, head - 12));
    if (!used.has(head) && !used.has(tail)) {
      snakes[head] = tail; snakeColors[head] = PALETTE[count % PALETTE.length];
      used.add(head); used.add(tail); count++;
    }
  }

  // ── Question generation — delegated to active plugin ──────────────────────
  const fractions = { 64: { d: 'W' } };

  if (questionPlugin && typeof questionPlugin.generate === 'function') {
    // Plugin-driven: any math concept
    for (let sq = 2; sq <= 63; sq++) {
      fractions[sq] = questionPlugin.generate(sq);
    }
  } else {
    // Legacy inline fallback (fractions) — kept so boardGenerator can run standalone
    for (let sq = 2; sq <= 63; sq++) {
      if (Math.random() > 0.5) {
        const dn = randomInt(3, 10);
        fractions[sq] = { d: 'M', w: randomInt(1, 8), n: randomInt(1, dn - 1), dn };
      } else {
        const dn = randomInt(2, 9);
        let n, guard = 0;
        do { n = randomInt(dn + 1, dn * 3); guard++; } while (n % dn === 0 && guard < 40);
        if (n % dn === 0) n++;
        fractions[sq] = { d: 'I', n, dn };
      }
    }
  }

  return { snakes, snakeColors, ladders, fractions };
}

export default generateRandomBoard;
