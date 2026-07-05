// tricks-data.js — single source of truth for the Mental Math hub.
//
// Grade key -> array of trick descriptors. This registry scaffolds the full
// per-grade Vedic + Trachtenberg curriculum, but only entries with
// `ready: true` (and a real `href`) have a working page behind them — the
// rest are placeholders documenting what's planned next.

export const MENTAL_MATH = {
  jss1: [
    {
      id: "times-eleven",
      title: "× 11 Trick",
      grade: "jss1",
      system: "trachtenberg", // 'vedic' | 'trachtenberg' | 'blend'
      summary: "Multiply any 2- to 4-digit number by 11 in your head by adding adjacent digits and carrying left.",
      href: "/prep-math/mental-math/times-eleven/index.html",
      ready: true,
    },
    {
      id: "times-five",
      title: "× 5 Trick (halve & shift)",
      grade: "jss1",
      system: "vedic",
      summary: "Multiply by 5 by halving the number and shifting the decimal point.",
      href: null,
      ready: false, // STUB — not built this pass
    },
  ],
  jss2: [
    {
      id: "squares-ending-5",
      title: "Squaring numbers ending in 5",
      grade: "jss2",
      system: "vedic", // Ekadhikena Purvena
      summary: "Square numbers like 25, 35, 45 by multiplying the leading digit by itself+1, then appending 25.",
      href: null,
      ready: false, // STUB — not built this pass
    },
  ],
  jss3: [],
  ss1: [],
  ss2: [],
  ss3: [],
};

export const getTricksForGrade = (grade) => MENTAL_MATH[grade] ?? [];

export const getReadyTricks = () =>
  Object.values(MENTAL_MATH).flat().filter((t) => t.ready);
