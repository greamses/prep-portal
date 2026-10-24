/* ============================================================================
   CHEMISTRY BENCH — the periodic table, as a tool on the side rail
   ----------------------------------------------------------------------------
   The site's one table (data/vocab/periodic-table.js, all 118) laid on the
   standard grid, coloured by family. Tap an element for its line: number,
   mass, family, what it is used for; where the atoms sheet can draw it
   (element() in atoms.js) a key opens its Lewis structure and configuration.
   ========================================================================== */

import { ELEMENTS, CATEGORY_LABELS, TABLE_COLUMNS, TABLE_ROWS } from "/data/vocab/periodic-table.js";
import { element as drawable } from "./atoms.js";

const FAMILY = {
  alkali: "var(--accent-danger)", alkaline: "var(--accent-warning)", transition: "var(--accent-secondary)", post: "var(--text-tertiary)",
  metalloid: "var(--accent-success)", nonmetal: "var(--accent-primary)", halogen: "#b5562c", noble: "#7d4fb0", lanthanide: "#3b9aa8", actinide: "#a8527c",
};
const cap1 = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function mountPeriodicTable(body, { onOpenAtom }) {
  body.classList.add("wb-panel__body--scroll");
  const cells = ELEMENTS.map((e) => `<button type="button" class="cl-pt__el" data-z="${e.z}" style="grid-column:${e.x};grid-row:${e.y > 7 ? e.y + 1 : e.y};--fam:${FAMILY[e.cat]}" aria-label="${cap1(e.name)}"><i>${e.z}</i><b>${e.sym}</b></button>`).join("");
  const key = Object.entries(CATEGORY_LABELS).map(([k, v]) => `<span><u style="background:${FAMILY[k]}"></u>${v}</span>`).join("");
  body.innerHTML = `<div class="cl-pt"><div class="cl-pt__grid" style="grid-template-columns:repeat(${TABLE_COLUMNS},1fr);grid-template-rows:repeat(${TABLE_ROWS + 1},auto)">${cells}</div>
    <div class="cl-pt__key">${key}</div><div class="cl-pt__line" aria-live="polite">Tap an element.</div></div>`;
  const line = body.querySelector(".cl-pt__line");
  body.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-z]");
    if (b) {
      const e = ELEMENTS.find((x) => x.z === +b.dataset.z);
      body.querySelectorAll(".is-on").forEach((x) => x.classList.remove("is-on"));
      b.classList.add("is-on");
      line.innerHTML = `<b>${cap1(e.name)} (${e.sym})</b> · atomic number ${e.z} · relative atomic mass ${e.mass} · ${CATEGORY_LABELS[e.cat]}${e.group ? `, group ${e.group}` : ""}, period ${e.period}.${e.use ? ` <span>${e.use}</span>` : ""}`
        + (drawable(e.z) ? ` <button type="button" class="cl-act" data-open="${e.z}">Lewis and configuration</button>` : "");
      return;
    }
    const o = ev.target.closest("[data-open]");
    if (o) onOpenAtom(+o.dataset.open);
  });
}
