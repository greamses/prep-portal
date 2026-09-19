/* ============================================================================
   Statistics Workbook — the two dials
   ----------------------------------------------------------------------------
   HOW HARD is about the numbers, never the idea. At Gentle every symbol is
   worth 1 or 2 and there is no half symbol; at Middle a symbol stands for 2,
   5 or 10 and half symbols appear; at Stretch the keys are bigger (4, 20, 50,
   100) and quarter symbols can be read.

   HOW MUCH HELP is the fading scaffold every workbook on this site uses: a
   worked example at the top of each section, then none, then no labels.
   ========================================================================== */

export const LEVELS = {
  gentle: {
    id: "gentle",
    label: "Gentle — small numbers, a symbol stands for 1 or 2, no part symbols",
    keys: [1, 2], parts: [1], most: 8, kinds: 3,
  },
  middle: {
    id: "middle",
    label: "Middle — a symbol stands for 2, 5 or 10, half symbols",
    keys: [2, 5, 10], parts: [1, 0.5], most: 8, kinds: 4,
  },
  stretch: {
    id: "stretch",
    label: "Stretch — keys of 4, 20, 50 and 100, halves and quarters",
    keys: [4, 20, 50, 100], parts: [1, 0.5, 0.25, 0.75], most: 9, kinds: 4,
  },
};

export const levelOf = (o) => LEVELS[o.level] || LEVELS.gentle;

export const HELP = {
  show: { id: "show", label: "Show me — one done for you at the top of every section" },
  help: { id: "help", label: "Help me — no examples, the steps are named" },
  try: { id: "try", label: "Let me try — nothing named" },
};

export const helpOf = (o) => HELP[o.help] || HELP.help;

/** Dealt, not drawn: a shuffled pack gone round in order, so a page varies. */
export function dealer() {
  let order = null;
  return (r, list, i = 0) => {
    if (i === 0 || !order || order.length !== list.length) order = r.shuffle(list.slice());
    return order[i % order.length];
  };
}
