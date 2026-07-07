// tricks-data.js — single source of truth for the Mental Math hub.
//
// Grade key -> array of trick descriptors. This registry scaffolds the full
// per-grade Vedic + Trachtenberg curriculum, but only entries with
// `ready: true` (and a real `href`) have a working page behind them — the
// rest are placeholders documenting what's planned next.

export const MENTAL_MATH = {
  jss1: [
    {
      id: "times-eleven-2-no-regroup",
      title: "× 11 Trick — 2-digit, no regrouping",
      grade: "jss1",
      system: "trachtenberg", // 'vedic' | 'trachtenberg' | 'blend'
      summary: "Start simple: split a 2-digit number and add its digits — the sum drops straight in, no carrying yet.",
      href: "/prep-math/mental-math/times-eleven/index.html?case=2-no-regroup",
      ready: true,
    },
    {
      id: "times-eleven-2-regroup",
      title: "× 11 Trick — 2-digit, with regrouping",
      grade: "jss1",
      system: "trachtenberg",
      summary: "Same trick, but the digits add past 9 — practice carrying the extra 1 into the tens place.",
      href: "/prep-math/mental-math/times-eleven/index.html?case=2-regroup",
      ready: true,
    },
    {
      id: "times-eleven-3plus-no-regroup",
      title: "× 11 Trick — 3+ digit, no regrouping",
      grade: "jss1",
      system: "trachtenberg",
      summary: "Scale the same idea up to three or four digits — add every adjacent pair, still no carrying.",
      href: "/prep-math/mental-math/times-eleven/index.html?case=3plus-no-regroup",
      ready: true,
    },
    {
      id: "times-eleven-3plus-regroup",
      title: "× 11 Trick — 3+ digit, with regrouping",
      grade: "jss1",
      system: "trachtenberg",
      summary: "The full challenge: carries can cascade all the way down the line, even creating a new leading digit.",
      href: "/prep-math/mental-math/times-eleven/index.html?case=3plus-regroup",
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
