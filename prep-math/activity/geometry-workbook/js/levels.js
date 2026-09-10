/* ============================================================================
   Geometry Workbook — the two dials, and the numbers they allow
   ----------------------------------------------------------------------------
   HOW HARD is about the arithmetic, never the idea. At the gentle level every
   angle is a whole number of tens and no shape has more than six sides, so a
   child working out a missing angle is doing 180 − 110 and not 180 − 117;
   the idea — that the three add up to 180 — is identical at every level.

   HOW MUCH HELP is the same fading scaffold as the maths workbook: a worked
   example at the top of every section, then the organiser empty, then the
   organiser with nothing named. Same words, same three steps, so a child who
   has used one workbook already knows how the other one behaves.
   ========================================================================== */

export const LEVELS = {
  gentle: {
    id: "gentle",
    label: "Gentle — whole tens, shapes up to six sides",
    step: 10, maxSides: 6, minAngle: 30, maxAngle: 110,
  },
  middle: {
    id: "middle",
    label: "Middle — whole fives, shapes up to eight sides",
    step: 5, maxSides: 8, minAngle: 25, maxAngle: 125,
  },
  stretch: {
    id: "stretch",
    label: "Stretch — any whole degree, up to twelve sides",
    step: 1, maxSides: 12, minAngle: 20, maxAngle: 135,
  },
};

export const levelOf = (o) => LEVELS[o.level] || LEVELS.gentle;

export const HELP = {
  show: { id: "show", label: "Show me — one done for you at the top of every section" },
  help: { id: "help", label: "Help me — the organisers are there, and empty" },
  try: { id: "try", label: "Let me try — the steps are there but not named" },
};

export const helpOf = (o) => HELP[o.help] || HELP.help;

/* ── numbers the questions are made of ─────────────────────────────────────*/

/** A multiple of this level's step, between lo and hi inclusive. */
export function stepped(r, o, lo, hi) {
  const s = levelOf(o).step;
  return r.int(Math.ceil(lo / s), Math.floor(hi / s)) * s;
}

/**
 * Three angles that make a triangle a child can draw, measure and read: none
 * narrower than the level's minimum, none wider than its maximum, and all of
 * them multiples of the step — so the third one, 180 minus the other two, is
 * a multiple of the step as well.
 */
export function triangleAngles(r, o) {
  const L = levelOf(o);
  let A;
  let B;
  let C;
  let guard = 0;
  do {
    A = stepped(r, o, L.minAngle, L.maxAngle);
    B = stepped(r, o, L.minAngle, L.maxAngle);
    C = 180 - A - B;
    guard++;
  } while ((C < L.minAngle || C > L.maxAngle) && guard < 80);
  return [A, B, C];
}

/** The polygons this level reaches, from four sides up. */
export function sidesFor(o, { from = 4 } = {}) {
  const out = [];
  for (let n = from; n <= levelOf(o).maxSides; n++) out.push(n);
  return out;
}

/**
 * The regular polygons whose angles are whole numbers. A heptagon's corner is
 * 128.57…°, which is a fine fact and a terrible worksheet question, so the
 * regular-polygon exercises deal only from this list.
 */
export const WHOLE_REGULAR = [3, 4, 5, 6, 8, 9, 10, 12];

export function regularFor(o) {
  return WHOLE_REGULAR.filter((n) => n <= Math.max(levelOf(o).maxSides, 6));
}

/**
 * Dealt, not drawn: a pack of the choices, shuffled once on the first question
 * and then gone round in order, so a page of six is six different shapes and
 * not four hexagons. `make` is always called from index 0 upwards for a given
 * exercise, so this is settled by the seed — which the answer key depends on.
 */
export function dealer() {
  let order = null;
  return (r, list, i = 0) => {
    if (i === 0 || !order || order.length !== list.length) order = r.shuffle(list.slice());
    return order[i % order.length];
  };
}
