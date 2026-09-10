/* ============================================================================
   Maths Workbook — what makes THIS workbook this workbook
   ----------------------------------------------------------------------------
   The bench, the paper, the pagination and the seed all come from
   /utils/components/workbook/. What is left here is the four dials, and the
   two things that open a section: the blocks key, and the worked example.

   FOUR FAMILIES ON ONE SHEET, and the reason they are one sheet rather than
   four is that a child does not have four workbooks open. Tick a couple of
   place-value questions, a page of adding, and the fractions they are stuck
   on, and it comes out as ONE paper with one code at the foot of it.
   ========================================================================== */

import {
  EXERCISES, GROUPS, LEVELS, HELP, levelOf, helpOf, unavailable, placesFor,
} from "./exercises.js";
import { placeName, placeWorth } from "./numbers.js";
import { blocksKey } from "./blocks.js";
import { ICON } from "./icons.js";
import { CFG, baseWord } from "../../base-blocks/js/config.js";
import { mountBuilder } from "/utils/components/workbook/rail.js";
import { onAdmin } from "/utils/components/workbook/admin.js";

const $ = (id) => document.getElementById(id);

/**
 * A brand-new visitor's first workbook takes one page from each family, in
 * teaching order, so the shape of the whole thing is visible on the first
 * print. Weighted to the front: the paper a child does first should be one
 * they can finish.
 */
const STARTER = {
  "blocks-count": 3,
  "chart-write": 5,
  "add-no-regroup": 2,
  "ring-groups": 3,
  "frac-identify": 6,
  "frac-add-like": 3,
};

/* ── the menus ─────────────────────────────────────────────────────────────*/

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

function fillBases() {
  const base = $("mw-base");
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
  const sel = $("mw-places");
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
  eyebrow: "Mathematics · A workbook to print",
  subtitle: (o) => {
    const L = levelOf(o);
    const H = helpOf(o);
    const help =
      H.id === "show" ? "one done for you" : H.id === "help" ? "no examples" : "nothing named";
    const place =
      o.base === 10
        ? `${o.places} places`
        : `base ${baseWord(o.base)} · ${o.places} places`;
    return `${place} · up to ${L.max} things · ${help}`;
  },
  exercises: EXERCISES,
  unavailable,
  /* Blocks only come in four sizes, so a blocks exercise never sees more places
     than there are blocks for, however wide the chart on the next page is. */
  optionsFor: (ex, o) => ({ ...o, places: placesFor(ex, o) }),
  /**
   * Two things can open a section, and neither opens more than one.
   *
   * The blocks key opens the FIRST blocks section — one strip of pieces per
   * workbook, not one per section. The worked example opens EVERY section that
   * has one, but only at the Show me level: the sections teach different steps,
   * and a child looking for the model they were shown should find it at the top
   * of the page they are on, not eleven pages back.
   */
  sectionHead: (section, o, state) => {
    if (section.ex.group === "blocks" && !state.keyDone && o.blocksKey) {
      state.keyDone = true;
      const names = Array.from({ length: 4 }, (_, p) => placeName(p, o.base));
      const worths = Array.from({ length: 4 }, (_, p) => placeWorth(p, o.base));
      return blocksKey(o.base, names, worths);
    }
    /* The protractor is not an example, it is the instrument the questions
       tell you to cut out — so it prints at every level of help. A page that
       says "cut out the protractor" and has no protractor on it is broken. */
    if (section.ex.alwaysWorked) return section.ex.worked(section.opts);
    if (helpOf(o).id === "show" && section.ex.worked) return section.ex.worked(section.opts);
    return "";
  },
};

/* ── go ────────────────────────────────────────────────────────────────────*/

fillBases();
fillPlaces(10);
fillMenu("mw-level", LEVELS);
fillMenu("mw-help", HELP);

mountBuilder({
  subject: SUBJECT,
  store: "mw-workbook-v1",
  groups: GROUPS,
  glyphs: {
    blocks: ICON.blocks,
    charts: ICON.table,
    numbers: ICON.figures,
    add: ICON.plus,
    sub: ICON.minus,
    group: ICON.ring,
    write: ICON.sentence,
    bridge: ICON.bar,
    bars: ICON.frac,
    "frac-what": ICON.pie,
    "frac-add": ICON.frac,
    fives: ICON.fives,
    time: ICON.clock,
    "angle-name": ICON.angle,
    "angle-measure": ICON.protractor,
  },
  icons: ICON,
  title: "Maths Workbook",
  starter: STARTER,
  extra: {
    read: () => ({
      base: Number($("mw-base").value),
      places: Number($("mw-places").value),
      zeros: Number($("mw-zeros").value),
      blocksKey: $("mw-blockskey").checked,
      level: $("mw-level").value,
      help: $("mw-help").value,
      watermark: $("mw-watermark").checked,
    }),
    write: (saved) => {
      $("mw-base").value = String(saved.base ?? 10);
      fillPlaces(saved.base ?? 10);
      $("mw-places").value = String(saved.places ?? 3);
      $("mw-zeros").value = String(saved.zeros ?? 0.25);
      $("mw-blockskey").checked = saved.blocksKey !== false;
      $("mw-level").value = saved.level ?? "gentle";
      $("mw-help").value = saved.help ?? "show";
      /* On by default and on for everyone. Only the row that TURNS IT OFF is
         held back, and only until the admin is known to be signed in. */
      $("mw-watermark").checked = saved.watermark !== false;
    },
    /* Changing the base renames every place, so the places menu is rewritten
       before the paper is. */
    onInput: (e) => {
      if (e.target.id === "mw-base") fillPlaces(Number(e.target.value));
    },
  },
});

/* The one control that is not everybody's. See workbook/admin.js — this is a
   tidy-up, not a lock. */
onAdmin(() => {
  $("mw-watermark-row").hidden = false;
});
