/* ============================================================================
   Vedic Maths Workbook — what makes THIS workbook this workbook
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

/* A first visit starts with the friendliest three: complements, × 11, and
   squares ending in 5. */
const STARTER = {
  "vm-nine": 8,
  "vm-eleven": 6,
  "vm-sq5": 6,
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

fillMenu("vm-level", LEVELS);
fillMenu("vm-help", HELP);

mountBuilder({
  subject: SUBJECT,
  /* printing needs a subscription — see /utils/components/workbook/print-pass.js */
  print: { workbook: WORKBOOK.id, label: WORKBOOK.label },
  interactive: LIVE,
  store: "vm-workbook-v1",
  groups: GROUPS,
  glyphs: {
    "vm-comp": ICON.vmComp,
    "vm-double": ICON.vmDouble,
    "vm-regroup": ICON.vmRegroup,
    "vm-quick": ICON.vmQuick,
    "vm-pattern": ICON.vmPattern,
    "vm-base": ICON.vmBase,
    "vm-squares": ICON.vmSquares,
    "vm-roots": ICON.vmRoots,
    "vm-divide": ICON.vmDivide,
    "vm-check": ICON.vmCheck,
    "vm-trach": ICON.vmTrach,
    "vm-tr-even": ICON.vmTrEven,
    "vm-tr-odd": ICON.vmTrOdd,
    "vm-tr-mix": ICON.vmTrMix,
  },
  icons: ICON,
  title: "Vedic Maths Workbook",
  starter: STARTER,
  extra: {
    read: () => ({
      level: $("vm-level").value,
      help: $("vm-help").value,
      watermark: $("vm-watermark").checked,
    }),
    write: (saved) => {
      $("vm-level").value = saved.level ?? "gentle";
      $("vm-help").value = saved.help ?? "show";
      /* On for everyone. Only the switch that turns it off is held back, and
         only until the admin is known to be signed in. */
      $("vm-watermark").checked = saved.watermark !== false;
    },
  },
});

onAdmin(() => { $("vm-watermark-row").hidden = false; });
