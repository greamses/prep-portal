/* ============================================================================
   Competition Word Problems — the two dials
   ----------------------------------------------------------------------------
   HOW HARD is the size and awkwardness of the numbers, and how many steps a
   problem takes — never which topic is set. Foundation is the standard
   problem of each kind with friendly numbers; Standard is the examination's
   own; Challenge adds a twist, a third quantity or a harder condition.

   HOW MUCH HELP: a fully worked example at the top of every section, or none
   — an examination gives none.
   ========================================================================== */

export const LEVELS = {
  gentle: { id: "gentle", label: "Foundation — the standard problem, friendly numbers" },
  middle: { id: "middle", label: "Standard — examination numbers" },
  stretch: { id: "stretch", label: "Challenge — a twist in every problem" },
};
export const levelOf = (o) => LEVELS[o.level] || LEVELS.gentle;

export const HELP = {
  show: { id: "show", label: "Show me — one worked in full at the top of every section" },
  try: { id: "try", label: "Examination — no worked examples" },
};
export const helpOf = (o) => HELP[o.help] || HELP.show;
