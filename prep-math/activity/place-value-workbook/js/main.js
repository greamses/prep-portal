/* ============================================================================
   Place Value Workbook — what makes THIS workbook place value
   ----------------------------------------------------------------------------
   The bench, the paper, the pagination and the seed all come from
   /utils/components/workbook/. What is left here is only the four things that
   are true of a place-value workbook and no other: the base and how many
   places, how often a zero falls inside a number, the blocks key that opens the
   first blocks section, and the sentence under the title.
   ========================================================================== */

import { EXERCISES, GROUPS, unavailable, placesFor } from "./exercises.js";
import { placeName, placeWorth } from "./numbers.js";
import { blocksKey } from "./blocks.js";
import { ICON } from "./icons.js";
import { CFG, baseWord } from "../../base-blocks/js/config.js";
import { mountBuilder } from "/utils/components/workbook/rail.js";

const $ = (id) => document.getElementById(id);

/* Which exercises a brand-new visitor gets: one from each stage, so the first
   workbook anyone prints already runs blocks → chart → number. */
const STARTER = {
  "blocks-count": 4,
  "blocks-chart": 3,
  "chart-write": 5,
  "chart-value": 6,
  expanded: 6,
  compare: 6,
};

/* ── the two menus that depend on each other's wording ─────────────────────*/

function fillBases() {
  const base = $("pv-base");
  base.innerHTML = "";
  for (let b = CFG.minBase; b <= CFG.maxBase; b++) {
    const o = document.createElement("option");
    o.value = String(b);
    o.textContent = b === 10 ? "Ten (ordinary numbers)" : `${b} — base ${baseWord(b)}`;
    base.appendChild(o);
  }
  base.value = "10";
}

/** The places menu names its options, because "5" alone means nothing. */
function fillPlaces(b) {
  const sel = $("pv-places");
  const keep = sel.value;
  sel.innerHTML = "";
  for (let p = 2; p <= 7; p++) {
    const o = document.createElement("option");
    o.value = String(p);
    o.textContent = `${p} — up to ${placeName(p - 1, b).toLowerCase()}`;
    sel.appendChild(o);
  }
  sel.value = keep && keep >= 2 && keep <= 7 ? keep : "3";
}

/* ── the subject ───────────────────────────────────────────────────────────*/

const SUBJECT = {
  eyebrow: "Mathematics · Place value",
  subtitle: (o) =>
    o.base === 10
      ? `${o.places} places · ${placeName(o.places - 1, 10).toLowerCase()} to ones`
      : `base ${baseWord(o.base)} · ${o.places} places · ${placeWorth(o.places - 1, o.base)} to 1`,
  exercises: EXERCISES,
  unavailable,
  /* Blocks only come in four sizes, so a blocks exercise never sees more than
     four places however wide the chart on the next page is. */
  optionsFor: (ex, o) => ({ ...o, places: placesFor(ex, o) }),
  /* The key opens the FIRST blocks section and no other — one strip of pieces
     per workbook, not one per section. */
  sectionHead: (section, o, state) => {
    if (section.ex.group !== "blocks" || state.keyDone || !o.blocksKey) return "";
    state.keyDone = true;
    const names = Array.from({ length: 4 }, (_, p) => placeName(p, o.base));
    const worths = Array.from({ length: 4 }, (_, p) => placeWorth(p, o.base));
    return blocksKey(o.base, names, worths);
  },
};

/* ── go ────────────────────────────────────────────────────────────────────*/

fillBases();
fillPlaces(10);

mountBuilder({
  subject: SUBJECT,
  store: "pv-workbook-v1",
  groups: GROUPS,
  glyphs: { blocks: ICON.blocks, charts: ICON.table, numbers: ICON.figures },
  icons: ICON,
  title: "Place Value",
  starter: STARTER,
  extra: {
    read: () => ({
      base: Number($("pv-base").value),
      places: Number($("pv-places").value),
      zeros: Number($("pv-zeros").value),
      blocksKey: $("pv-blockskey").checked,
    }),
    write: (saved) => {
      $("pv-base").value = String(saved.base ?? 10);
      fillPlaces(saved.base ?? 10);
      $("pv-places").value = String(saved.places ?? 3);
      $("pv-zeros").value = String(saved.zeros ?? 0.25);
      $("pv-blockskey").checked = saved.blocksKey !== false;
    },
    /* Changing the base renames every place, so the places menu is rewritten
       before the paper is. */
    onInput: (e) => {
      if (e.target.id === "pv-base") fillPlaces(Number(e.target.value));
    },
  },
});
