/* ============================================================================
   Remainders Workbook — what makes THIS workbook remainders
   ----------------------------------------------------------------------------
   The bench, the paper, the pagination and the seed all come from
   /utils/components/workbook/. What is left here is the two dials — how big
   the numbers are, and how much help the paper gives — and the worked example
   that opens each section at the highest level of help.
   ========================================================================== */

import { EXERCISES, GROUPS, LEVELS, HELP, unavailable, levelOf, helpOf } from "./exercises.js";
import { ICON } from "./icons.js";
import { mountBuilder } from "/utils/components/workbook/rail.js";

const $ = (id) => document.getElementById(id);

/**
 * A brand-new visitor's first workbook walks the whole argument in one sitting:
 * group a pile, write the sentence under it, watch the leftover turn into a
 * fraction, then read the bars. Weighted to the front — the paper a child does
 * first should be one they can finish.
 */
const STARTER = {
  "ring-groups": 4,
  "picture-sentence": 3,
  "leftover-fraction": 3,
  "bars-read": 3,
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

const SUBJECT = {
  eyebrow: "Mathematics · Dividing, and what is left over",
  subtitle: (o) => {
    const L = levelOf(o);
    const H = helpOf(o);
    const help =
      H.id === "show" ? "one done for you" : H.id === "help" ? "no examples" : "no words under the sentence";
    return `up to ${L.max} things · shared into ${L.divisors[0]}s to ${L.divisors[L.divisors.length - 1]}s · ${help}`;
  },
  exercises: EXERCISES,
  unavailable,
  /**
   * The worked example opens its OWN section, and only at the Show me level.
   * Per section and not per paper, because the sections teach different steps
   * and a child looking for the model they were shown should find it at the
   * top of the page they are on.
   */
  sectionHead: (section, o) => {
    if (helpOf(o).id !== "show" || !section.ex.worked) return "";
    return section.ex.worked(section.opts);
  },
};

fillMenu("rw-level", LEVELS);
fillMenu("rw-help", HELP);

mountBuilder({
  subject: SUBJECT,
  store: "rw-workbook-v1",
  groups: GROUPS,
  glyphs: {
    group: ICON.ring,
    write: ICON.sentence,
    bridge: ICON.bar,
    bars: ICON.frac,
  },
  icons: ICON,
  title: "Dividing and Remainders",
  starter: STARTER,
  extra: {
    read: () => ({ level: $("rw-level").value, help: $("rw-help").value }),
    write: (saved) => {
      $("rw-level").value = saved.level ?? "gentle";
      $("rw-help").value = saved.help ?? "show";
    },
  },
});
