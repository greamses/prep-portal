/* ============================================================================
   Base Blocks — the place-value board
   ----------------------------------------------------------------------------
   Reads the mat back as a number: how many of each place are lying there, what
   that comes to in units, and how the same total is written in the working base.
   When a column holds `base` or more it says so — that is the cue to trade.
   ========================================================================== */

import { PLACES, TAGS, placeOf, placeDims, toBase, baseWord } from "./config.js";
import { ICON } from "./icons.js";

const SUP = { 0: "⁰", 1: "¹", 2: "²", 3: "³" };

export function census(store) {
  const counts = { unit: 0, rod: 0, flat: 0, cube: 0 };
  const custom = [];
  for (const b of store.blocks) {
    const p = placeOf(b, store.base);
    if (p) counts[p]++;
    else custom.push(b);
  }
  const total = store.blocks.reduce((n, b) => n + b.l * b.w * b.h, 0);
  return { counts, custom, total };
}

export function renderBoard(el, store) {
  const base = store.base;
  const { counts, custom, total } = census(store);
  const rows = [...PLACES].reverse(); // cube first

  const board = rows
    .map((p) => {
      const d = placeDims(p.id, base);
      const value = d.l * d.w * d.h;
      const n = counts[p.id];
      const canTrade = n >= base && p.power < 3;
      return `
        <tr class="${n ? "" : "is-empty"}${canTrade ? " can-trade" : ""}">
          <th scope="row"><span class="bb-swatch bb-swatch--${p.id}"></span>${p.plural}</th>
          <td class="bb-cols__val">${value}<span class="bb-cols__pow">${base}${SUP[p.power]}</span></td>
          <td class="bb-cols__n">${n}</td>
          <td class="bb-cols__sub">${n ? n * value : ""}</td>
        </tr>`;
    })
    .join("");

  const customUnits = custom.reduce((n, b) => n + b.l * b.w * b.h, 0);
  const customRow = custom.length
    ? `<tr class="bb-cols__custom">
         <th scope="row"><span class="bb-swatch bb-swatch--custom"></span>Own blocks</th>
         <td class="bb-cols__val">—</td>
         <td class="bb-cols__n">${custom.length}</td>
         <td class="bb-cols__sub">${customUnits}</td>
       </tr>`
    : "";

  const expandedParts = rows
    .filter((p) => counts[p.id])
    .map((p) => `${counts[p.id]} × ${base}${SUP[p.power]}`);
  if (custom.length) expandedParts.push(`own blocks (${customUnits})`);
  const expanded = expandedParts.join(" + ");

  const tradeable = rows.find((p) => counts[p.id] >= base && p.power < 3);
  const nudge = tradeable
    ? `<p class="bb-nudge">${ICON.info} You have ${counts[tradeable.id]} ${tradeable.plural.toLowerCase()} —
       pick ${base} alike and merge them into one ${PLACES[tradeable.power + 1].label.toLowerCase()}.</p>`
    : "";

  const tagsUsed = TAGS.map((t) => {
    const mine = store.blocks.filter((b) => b.tag === t.id);
    if (!mine.length) return null;
    return {
      t,
      n: mine.length,
      units: mine.reduce((n, b) => n + b.l * b.w * b.h, 0),
    };
  }).filter(Boolean);

  const groups = tagsUsed.length
    ? `<div class="bb-groups">
         <span class="bb-eyebrow">Highlighted groups</span>
         ${tagsUsed
           .map(
             (g) => `<div class="bb-group">
               <span class="bb-group__dot" style="background:${g.t.hex}"></span>
               <span class="bb-group__name">${g.t.name}</span>
               <span class="bb-group__n">${g.n} block${g.n === 1 ? "" : "s"}</span>
               <b class="bb-group__units">${g.units}</b>
             </div>`
           )
           .join("")}
       </div>`
    : "";

  el.innerHTML = `
    <div class="bb-board__total">
      <b>${total}</b>
      <span>unit${total === 1 ? "" : "s"} on the mat</span>
    </div>
    <p class="bb-board__base">
      In base ${baseWord(base)} that is
      <b>${toBase(total, base)}</b><sub>${base}</sub>
    </p>
    <table class="bb-cols">
      <thead>
        <tr><th scope="col">Place</th><th scope="col">Worth</th><th scope="col">How many</th><th scope="col">Units</th></tr>
      </thead>
      <tbody>${board}${customRow}</tbody>
    </table>
    ${expanded ? `<p class="bb-expand">${expanded}</p>` : ""}
    ${nudge}
    ${groups}
  `;
}
