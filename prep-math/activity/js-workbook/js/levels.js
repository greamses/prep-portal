/* ============================================================================
   JavaScript Workbook — the two dials
   ----------------------------------------------------------------------------
   HOW HARD is about how much of the language is in play, never about how the
   idea is explained. At Gentle there are three kinds of value (string, number,
   boolean) and nothing surprising; at Middle the quoted number, null and
   undefined, and mending a sum with Number(); at Stretch the traps a beginner
   meets in real code — typeof null, "2 + 2" as a string, converting both ways.

   HOW MUCH HELP is the fading scaffold every workbook on this site uses: a
   worked example at the top of each section, then none, then no labels.
   ========================================================================== */

export const LEVELS = {
  gentle: { id: "gentle", label: "Gentle — string, number and boolean, nothing tricky" },
  middle: { id: "middle", label: "Middle — quoted numbers, null and undefined, Number()" },
  stretch: { id: "stretch", label: "Stretch — the traps: typeof null, text that looks like a sum" },
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
