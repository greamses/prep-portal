/* ============================================================================
   JavaScript Workbook — what makes THIS workbook this workbook
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

/* A first visit starts where the chapter starts: notice the kinds, see what
   quotes do, ask typeof — and then write one program of their own. */
const STARTER = {
  "dt-kind": 2,
  "dt-quotes": 2,
  "dt-typeof": 2,
  "dt-print": 3,
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

fillMenu("jw-level", LEVELS);
fillMenu("jw-help", HELP);

mountBuilder({
  subject: SUBJECT,
  /* printing needs a subscription — see /utils/components/workbook/print-pass.js */
  print: { workbook: WORKBOOK.id, label: WORKBOOK.label },
  interactive: LIVE,
  store: "jw-workbook-v1",
  groups: GROUPS,
  glyphs: {
    "dt-kind": ICON.dtKind,
    "dt-quotes": ICON.dtQuotes,
    "dt-typeof": ICON.dtTypeof,
    "dt-print": ICON.dtPrint,
    "dt-empty": ICON.dtEmpty,
    "dt-join": ICON.dtJoin,
    "dt-vars": ICON.dtVars,
  },
  icons: ICON,
  title: "JavaScript Workbook",
  starter: STARTER,
  extra: {
    read: () => ({
      level: $("jw-level").value,
      help: $("jw-help").value,
      watermark: $("jw-watermark").checked,
    }),
    write: (saved) => {
      $("jw-level").value = saved.level ?? "gentle";
      $("jw-help").value = saved.help ?? "show";
      /* On for everyone. Only the switch that turns it off is held back, and
         only until the admin is known to be signed in. */
      $("jw-watermark").checked = saved.watermark !== false;
    },
  },
});

onAdmin(() => { $("jw-watermark-row").hidden = false; });
