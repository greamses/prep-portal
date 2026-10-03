/* ============================================================================
   Vedic Maths Workbook — the two dials
   ----------------------------------------------------------------------------
   HOW HARD is about the size of the numbers and whether anything carries,
   never about which trick is taught. At Gentle nothing carries — every part a
   trick produces fits where it goes — so the pattern can be seen bare. Middle
   lets the parts spill over and be carried. Stretch takes the same trick to
   bigger numbers: three digits, a base of 1000, numbers above the base.

   HOW MUCH HELP is the fading scaffold every workbook on this site uses: a
   worked example at the top of each section, then none, then no labels.
   ========================================================================== */

export const LEVELS = {
  gentle: { id: "gentle", label: "Gentle — two-digit numbers, nothing to carry" },
  middle: { id: "middle", label: "Middle — carrying, three digits, numbers near 100" },
  stretch: { id: "stretch", label: "Stretch — bigger numbers, above the base, a base of 1000" },
};

export const levelOf = (o) => LEVELS[o.level] || LEVELS.gentle;

export const HELP = {
  show: { id: "show", label: "Show me — one done for you at the top of every section" },
  help: { id: "help", label: "Help me — no examples, the steps are named" },
  try: { id: "try", label: "Let me try — nothing named" },
};

export const helpOf = (o) => HELP[o.help] || HELP.help;
