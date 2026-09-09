/* ============================================================================
   Remainder Theorem Workbook — what makes THIS workbook the remainder theorem
   ----------------------------------------------------------------------------
   The bench, the paper, the pagination and the seed all come from
   /utils/components/workbook/. What is left here is the two dials this
   workbook has that no other does — how hard the numbers are, and how much of
   the organiser is already filled in — and the worked example that opens each
   section at the highest level of help.
   ========================================================================== */

import { EXERCISES, GROUPS, unavailable } from "./exercises.js";
import { LEVELS, levelOf } from "./poly.js";
import { HELP, helpOf } from "./organiser.js";
import { ICON } from "./icons.js";
import { mountBuilder } from "/utils/components/workbook/rail.js";

const $ = (id) => document.getElementById(id);

/**
 * A brand-new visitor's first workbook runs the whole ladder of the method in
 * one sitting: find the zero, swap, then both together in the frame, then say
 * the rule back. Weighted towards the early sections on purpose — the paper a
 * child does first should be one they can finish.
 */
const STARTER = {
  "zero-find": 8,
  "zero-match": 5,
  "swap-ladder": 3,
  frame: 3,
  "rule-fill": 4,
};

/* ── the two menus ─────────────────────────────────────────────────────────*/

function fillMenu(id, table) {
  const sel = $(id);
  sel.innerHTML = "";
  Object.values(table).forEach((v) => {
    const o = document.createElement("option");
    o.value = v.id;
    o.textContent = v.label;
    sel.appendChild(o);
  });
}

/* ── the subject ───────────────────────────────────────────────────────────*/

const SUBJECT = {
  eyebrow: "Mathematics · The remainder theorem",
  subtitle: (o) => {
    const L = levelOf(o);
    const H = helpOf(o);
    const shape = L.degree === 2 ? "squares" : "cubes";
    const brackets = L.roots.some((a) => a < 0) ? "brackets both ways" : "positive brackets";
    return `${shape} · ${brackets} · ${H.id === "show" ? "one done for you" : H.id === "help" ? "the organiser, empty" : "no labels"}`;
  },
  exercises: EXERCISES,
  unavailable,
  /**
   * The worked example opens its OWN section rather than the workbook, and only
   * at the Show me level.
   *
   * Per section and not per paper, because the sections teach different steps:
   * an example of finding a zero does not help with the swap ladder three
   * pages later, and a child looking for the model they were shown should find
   * it at the top of the page they are on.
   */
  sectionHead: (section, o) => {
    if (helpOf(o).id !== "show" || !section.ex.worked) return "";
    return section.ex.worked(section.opts);
  },
};

/* ── go ────────────────────────────────────────────────────────────────────*/

fillMenu("rt-level", LEVELS);
fillMenu("rt-help", HELP);

mountBuilder({
  subject: SUBJECT,
  store: "rt-workbook-v1",
  groups: GROUPS,
  glyphs: {
    zero: ICON.bracket,
    swap: ICON.swap,
    theorem: ICON.frame,
    say: ICON.said,
  },
  icons: ICON,
  title: "The Remainder Theorem",
  starter: STARTER,
  extra: {
    read: () => ({
      level: $("rt-level").value,
      help: $("rt-help").value,
    }),
    write: (saved) => {
      $("rt-level").value = saved.level ?? "gentle";
      $("rt-help").value = saved.help ?? "show";
    },
  },
});
