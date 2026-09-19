/* ============================================================================
   Statistics Workbook — what makes THIS workbook this workbook
   ----------------------------------------------------------------------------
   The bench, the paper, the pagination, the seed, the byline and the watermark
   all come from /utils/components/workbook/. What is left here is the two
   dials — how hard, and how much help — and the glyph for each section.
   ========================================================================== */

import { GROUPS, LEVELS, HELP } from "./exercises.js";
import { SUBJECT, LIVE, WORKBOOK } from "./subject.js";
import { ICON } from "./icons.js";
import { mountBuilder } from "/utils/components/workbook/rail.js";
import { onAdmin } from "/utils/components/workbook/admin.js";

const $ = (id) => document.getElementById(id);

/* A first visit starts at the beginning: count, tally, read, then build one. */
const STARTER = {
  "pg-tap": 2,
  "pg-tally-read": 6,
  "pg-read-one": 2,
  "pg-build": 2,
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

fillMenu("sw-level", LEVELS);
fillMenu("sw-help", HELP);

mountBuilder({
  subject: SUBJECT,
  /* printing needs a subscription — see /utils/components/workbook/print-pass.js */
  print: { workbook: WORKBOOK.id, label: WORKBOOK.label },
  interactive: LIVE,
  store: "sw-workbook-v1",
  groups: GROUPS,
  glyphs: {
    "pg-sort": ICON.pgSort,
    "pg-tally": ICON.pgTally,
    "pg-read": ICON.pgRead,
    "pg-key": ICON.pgKey,
    "pg-make": ICON.pgMake,
    "pg-solve": ICON.pgSolve,
    "br-blocks": ICON.brBlocks,
    "br-read": ICON.brRead,
    "br-draw": ICON.brDraw,
    "br-compare": ICON.brCompare,
    "br-solve": ICON.brSolve,
  },
  icons: ICON,
  title: "Statistics Workbook",
  starter: STARTER,
  extra: {
    read: () => ({
      level: $("sw-level").value,
      help: $("sw-help").value,
      watermark: $("sw-watermark").checked,
    }),
    write: (saved) => {
      $("sw-level").value = saved.level ?? "gentle";
      $("sw-help").value = saved.help ?? "show";
      /* On for everyone. Only the switch that turns it off is held back, and
         only until the admin is known to be signed in. */
      $("sw-watermark").checked = saved.watermark !== false;
    },
  },
});

onAdmin(() => { $("sw-watermark-row").hidden = false; });
