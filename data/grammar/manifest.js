/* GRAMMAR — which themes actually have passages, and how many.
   Hand-maintained (the bank is small enough that a generator would be more
   machinery than it saves). The setup screen offers only what is listed here,
   so a theme can be added to themes.js and filled in later without ever
   offering a round the bank cannot deal.

   Counts are per FILE, not per grade — the grade band still filters them down
   (see index.js's passagePool), which is why availableThemes() below has to
   look at the band as well as the count. */

export const AVAILABLE = {
  diary: 5,
  story: 5,
  letter: 5,
  report: 5,
  science: 4,
  wildlife: 3,
  history: 3,
  discovery: 3,
};
