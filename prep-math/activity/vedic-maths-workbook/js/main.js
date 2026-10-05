/* ============================================================================
   Mental Maths Workbook (once "Vedic Maths") — what makes THIS workbook this workbook
   ----------------------------------------------------------------------------
   The bench, the paper, the pagination, the seed, the byline and the watermark
   all come from /utils/components/workbook/. What is left here is the two
   dials — what kind of practice (skill development or drills), and how hard
   — and the glyph for each section.
   ========================================================================== */

import { GROUPS, LEVELS, MODES } from "./exercises.js";
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
fillMenu("vm-mode", MODES);

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
    "vm-tables": ICON.vmTables,
    "vm-tables8": ICON.vmTables8,
    "vm-trach": ICON.vmTrach,
    "vm-tr-even": ICON.vmTrEven,
    "vm-tr-odd": ICON.vmTrOdd,
    "vm-tr-mix": ICON.vmTrMix,
  },
  icons: ICON,
  title: "Mental Maths Workbook",
  starter: STARTER,
  extra: {
    read: () => ({
      level: $("vm-level").value,
      mode: $("vm-mode").value,
      /* the engine's own help dial follows the mode: examples on a skill paper only */
      help: $("vm-mode").value === "drill" ? "try" : "show",
      watermark: $("vm-watermark").checked,
    }),
    write: (saved) => {
      $("vm-level").value = saved.level ?? "gentle";
      $("vm-mode").value = saved.mode === "drill" ? "drill" : "skill";
      /* On for everyone. Only the switch that turns it off is held back, and
         only until the admin is known to be signed in. */
      $("vm-watermark").checked = saved.watermark !== false;
    },
  },
});

onAdmin(() => { $("vm-watermark-row").hidden = false; });

/* The workbook was "Vedic Maths" until 2026-10-03, and that was the title on
   the front of every paper saved before then. A saved title that is still
   that old default follows the new name; one somebody typed is left alone. */
{
  const t = $("wb-title");
  if (t && t.value.trim() === "Vedic Maths") {
    t.value = "Mental Maths";
    t.dispatchEvent(new Event("input", { bubbles: true }));
    t.dispatchEvent(new Event("change", { bubbles: true }));
  }
}
