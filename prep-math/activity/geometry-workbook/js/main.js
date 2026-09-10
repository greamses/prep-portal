/* ============================================================================
   Geometry Workbook — what makes THIS workbook this workbook
   ----------------------------------------------------------------------------
   The bench, the paper, the pagination, the seed, the byline and the watermark
   all come from /utils/components/workbook/. What is left here is the two
   dials, and what opens each section — the worked example at the Show me
   level, and the protractor to cut out, which prints at every level because
   it is an instrument and not an example.
   ========================================================================== */

import {
  EXERCISES, GROUPS, LEVELS, HELP, levelOf, helpOf, unavailable, exerciseById, chapterOf,
} from "./exercises.js";
import { ICON } from "./icons.js";
import { mountBuilder } from "/utils/components/workbook/rail.js";
import { onAdmin } from "/utils/components/workbook/admin.js";

const $ = (id) => document.getElementById(id);

/**
 * A brand-new visitor's first workbook walks the chapter's spine: find the
 * 180 with a protractor, cut shapes into triangles, use the 180, then the rule
 * for any shape. Weighted to the front — the paper a child does first should
 * be one they can finish.
 */
const STARTER = {
  "tri-measure": 2,
  "tri-tear": 1,
  "decomp-draw": 4,
  "tri-missing": 6,
  "poly-sum": 4,
};

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

const CHAPTERS = { 1: "Chapter 1: Polygon angles", 2: "Chapter 2: Transversal angles" };

const SUBJECT = {
  /* Names the chapter the paper is from — or both, when it mixes them. */
  eyebrow: (o) => {
    const found = new Set((o.chosen || []).map((c) => exerciseById(c.id)).filter(Boolean).map(chapterOf));
    const which = found.size === 1 ? CHAPTERS[[...found][0]] : "Chapters 1 and 2: Angles";
    return `Mathematics · Geometry · ${which}`;
  },
  subtitle: (o) => {
    const L = levelOf(o);
    const H = helpOf(o);
    const step = L.step === 1 ? "any whole degree" : `whole ${L.step === 10 ? "tens" : "fives"}`;
    const help =
      H.id === "show" ? "one done for you" : H.id === "help" ? "no examples" : "nothing named";
    return `${step} · shapes up to ${L.maxSides} sides · ${help}`;
  },
  exercises: EXERCISES,
  unavailable,
  /* The protractor is not an example, it is the instrument the questions tell
     you to cut out — so it prints at every level. Everything else that has a
     worked example shows it at Show me only, at the head of its own section. */
  sectionHead: (section, o) => {
    if (section.ex.alwaysWorked) return section.ex.worked(section.opts);
    if (helpOf(o).id === "show" && section.ex.worked) return section.ex.worked(section.opts);
    return "";
  },
};

fillMenu("gw-level", LEVELS);
fillMenu("gw-help", HELP);

mountBuilder({
  subject: SUBJECT,
  store: "gw-workbook-v1",
  groups: GROUPS,
  glyphs: {
    "tri-sum": ICON.triangle,
    decomp: ICON.cut,
    "tri-inside": ICON.missing,
    "poly-sum": ICON.polygon,
    "poly-each": ICON.each,
    "geo-words": ICON.words,
    exterior: ICON.exterior,
    parallel: ICON.parallel,
    transversal: ICON.transversal,
    "tr-angles": ICON.trAngles,
    "acute-obtuse": ICON.acuteObtuse,
    "vert-opp": ICON.vertOpp,
    corresponding: ICON.corresponding,
    alternate: ICON.alternate,
    "co-interior": ICON.coInterior,
    "co-exterior": ICON.coExterior,
    "multi-trans": ICON.multiTrans,
    "tri-trans": ICON.triTrans,
  },
  icons: ICON,
  title: "Geometry — Angles",
  starter: STARTER,
  extra: {
    read: () => ({
      level: $("gw-level").value,
      help: $("gw-help").value,
      watermark: $("gw-watermark").checked,
    }),
    write: (saved) => {
      $("gw-level").value = saved.level ?? "gentle";
      $("gw-help").value = saved.help ?? "show";
      /* On for everyone. Only the switch that turns it off is held back, and
         only until the admin is known to be signed in. */
      $("gw-watermark").checked = saved.watermark !== false;
    },
  },
});

/* The one control that is not everybody's. See workbook/admin.js — this is a
   tidy-up, not a lock. */
onAdmin(() => {
  $("gw-watermark-row").hidden = false;
});
