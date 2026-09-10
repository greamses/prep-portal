/* ============================================================================
   Geometry Workbook — what makes THIS workbook this workbook
   ----------------------------------------------------------------------------
   The bench, the paper, the pagination, the seed, the byline and the watermark
   all come from /utils/components/workbook/. What is left here is the two
   dials, and what opens each section — the worked example at the Show me
   level, and the protractor to cut out, which prints at every level because
   it is an instrument and not an example.
   ========================================================================== */

import { GROUPS, LEVELS, HELP } from "./exercises.js";
import { SUBJECT, LIVE, WORKBOOK } from "./subject.js";
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

fillMenu("gw-level", LEVELS);
fillMenu("gw-help", HELP);

mountBuilder({
  subject: SUBJECT,
  /* sold per print — see /utils/components/workbook/print-pass.js */
  print: { workbook: WORKBOOK.id, label: WORKBOOK.label },
  interactive: LIVE,
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
    fev: ICON.cube,
    sticks: ICON.sticks,
    surfaces: ICON.cylinder,
    bases: ICON.prismBase,
    "pp-bases": ICON.prismBase,
    "pp-sides": ICON.pyramid,
    nets: ICON.net,
    "fev-rule": ICON.rule,
    sa: ICON.net,
    vol: ICON.cube,
    real: ICON.words,
    open1: ICON.openBox,
    open2: ICON.tube,
    frustum: ICON.frustum,
  },
  icons: ICON,
  title: "Geometry Workbook",
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
