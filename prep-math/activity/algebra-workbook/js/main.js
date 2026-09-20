/* ============================================================================
   Algebra Workbook — what makes THIS workbook this workbook
   ----------------------------------------------------------------------------
   The bench, the paper, the pagination, the seed, the byline and the watermark
   all come from /utils/components/workbook/. What is left here is the two
   dials — how hard, and how much help — and the glyph for each section.

   It began as the Remainder Theorem Workbook, a page of its own; that page is
   now chapter 2 here, and its old address redirects to this one (vercel.json).
   ========================================================================== */

import { GROUPS, LEVELS, HELP } from "./exercises.js";
import { SUBJECT, LIVE, WORKBOOK } from "./subject.js";
import { ICON } from "./icons.js";
import { mountBuilder } from "/utils/components/workbook/rail.js";
import { onAdmin } from "/utils/components/workbook/admin.js";

const $ = (id) => document.getElementById(id);

/**
 * A brand-new visitor's first workbook is the words: known and unknown, what
 * varies, the parts of an expression. The remainder theorem stays one tab
 * away, and a returning visitor keeps whatever they last built.
 */
const STARTER = {
  "bc-known-tick": 2,
  "bc-box": 6,
  "bc-world": 2,
  "bc-parts": 4,
  "bc-words": 1,
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

fillMenu("aw-level", LEVELS);
fillMenu("aw-help", HELP);

mountBuilder({
  subject: SUBJECT,
  /* printing needs a subscription — see /utils/components/workbook/print-pass.js */
  print: { workbook: WORKBOOK.id, label: WORKBOOK.label },
  interactive: LIVE,
  store: "aw-workbook-v1",
  groups: GROUPS,
  glyphs: {
    "bc-known": ICON.unknown,
    "bc-vary": ICON.vary,
    "bc-words": ICON.said,
    "bm-read": ICON.bar,
    "bm-solve": ICON.bars,
    "bm-make": ICON.pencilBar,
    "bs-read": ICON.scale,
    "bs-solve": ICON.scaleMove,
    "bs-make": ICON.pencilScale,
    zero: ICON.bracket,
    swap: ICON.swap,
    theorem: ICON.frame,
    say: ICON.said,
    "ap-comm": ICON.apComm,
    "ap-assoc": ICON.apAssoc,
    "ap-dist": ICON.apDist,
    "ap-special": ICON.apZero,
    "ap-ident": ICON.apIdent,
    "fn-machine": ICON.fnMachine,
    "fn-back": ICON.fnBack,
    "fn-rule": ICON.fnRule,
    "fn-write": ICON.fnWrite,
    "fn-map": ICON.fnMap,
    "sq-place": ICON.sqPlace,
    "sq-rule": ICON.sqRule,
    "gr-plot": ICON.grPlot,
    "gr-line": ICON.grLine,
    "gr-read": ICON.grRead,
    "gr-mc": ICON.grMc,
    "gr-solve": ICON.grSolve,
    "gr-curve": ICON.grCurve,
  },
  icons: ICON,
  title: "Algebra Workbook",
  starter: STARTER,
  extra: {
    read: () => ({
      level: $("aw-level").value,
      help: $("aw-help").value,
      watermark: $("aw-watermark").checked,
    }),
    write: (saved) => {
      $("aw-level").value = saved.level ?? "gentle";
      $("aw-help").value = saved.help ?? "show";
      $("aw-watermark").checked = saved.watermark !== false;
    },
  },
});

/* The one control that is not everybody's. See workbook/admin.js. */
onAdmin(() => {
  $("aw-watermark-row").hidden = false;
});
