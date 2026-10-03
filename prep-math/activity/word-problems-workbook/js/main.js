/* ============================================================================
   Competition Word Problems — what makes THIS workbook this workbook
   ----------------------------------------------------------------------------
   The bench, the paper, the pagination, the seed, the byline and the watermark
   all come from /utils/components/workbook/. What is left here is the two
   dials — how hard, and whether each section opens with a worked example —
   and the glyph for each chapter.
   ========================================================================== */

import { GROUPS, LEVELS, HELP } from "./exercises.js";
import { SUBJECT, LIVE, WORKBOOK } from "./subject.js";
import { ICON } from "./icons.js";
import { mountBuilder } from "/utils/components/workbook/rail.js";
import { onAdmin } from "/utils/components/workbook/admin.js";

const $ = (id) => document.getElementById(id);

/* A first visit starts with one section from each of the first three chapters. */
const STARTER = {
  "wp-ag-ratio": 3,
  "wp-al-rule": 3,
  "wp-hl-hcf": 3,
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

fillMenu("wp-level", LEVELS);
fillMenu("wp-help", HELP);

mountBuilder({
  subject: SUBJECT,
  /* printing needs a subscription — see /utils/components/workbook/print-pass.js */
  print: { workbook: WORKBOOK.id, label: WORKBOOK.label },
  interactive: LIVE,
  store: "wp-workbook-v1",
  groups: GROUPS,
  glyphs: {
    "wp-ages": ICON.wpAges,
    "wp-mix": ICON.wpMix,
    "wp-hcf": ICON.wpHcf,
    "wp-ratio": ICON.wpRatio,
    "wp-frac": ICON.wpFrac,
    "wp-sys": ICON.wpSys,
    "wp-seq": ICON.wpSeq,
    "wp-arr": ICON.wpArr,
    "wp-prob": ICON.wpProb,
    "wp-pct": ICON.wpPct,
    "wp-rem": ICON.wpRem,
  },
  icons: ICON,
  title: "Competition Word Problems",
  starter: STARTER,
  extra: {
    read: () => ({
      level: $("wp-level").value,
      help: $("wp-help").value,
      watermark: $("wp-watermark").checked,
    }),
    write: (saved) => {
      $("wp-level").value = saved.level ?? "middle";
      $("wp-help").value = saved.help ?? "show";
      /* On for everyone. Only the switch that turns it off is held back, and
         only until the admin is known to be signed in. */
      $("wp-watermark").checked = saved.watermark !== false;
    },
  },
});

onAdmin(() => { $("wp-watermark-row").hidden = false; });
