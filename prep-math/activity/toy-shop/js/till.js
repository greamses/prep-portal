/* ============================================================================
   The Prep Toy Shop — the bill, where the shop tells you NOTHING
   ----------------------------------------------------------------------------
   A real checkout does the arithmetic and shows you a total. This one does the
   arithmetic and keeps it: every figure is a box, and the bill only exists
   once the child has worked it out. The till knows the answers — it has to, to
   mark them — and will not say one.

   EVERY TOY GETS ITS OWN RECEIPT, and the receipts sit in a grid. One long
   column meant a basket of six toys was six screens of scrolling with the
   total somewhere off the bottom; as a wall of small receipts you can see the
   whole shop-full at once, and the totals go on their own receipt underneath,
   which is where a total belongs.

   WHAT IT ASKS, in the order a bill is built:
     a line with no sale   so many at that each  -> what the line comes to
     a line with one       so many at that each  -> what they come to first
                           the sale takes a %    -> what comes off
                                                 -> what the line is now
     then                  add the lines up      -> the subtotal
                           tax is a % of that    -> the tax
                                                 -> the total to pay

   A box goes green when it is right and amber when it is not — never red: a
   sum in progress is not a mistake. Paying is a screen of its own, and it does
   not open until every figure here is right.
   ========================================================================== */

import { priceHtml, writeAmount } from "/utils/components/workbook/purse.js";
import { bill, readAmount, plural, comesTo } from "./shop.js";
import { toyImg } from "./art.js";

/* `sum` is the arithmetic as it would be typed on a calculator. The box does
   not show it — it is there so PrepBot can work the figure out on the real
   calculator in front of the learner (js/guide.js) instead of knowing it. */
const box = (want, label, sum = "") =>
  `<input class="ts-box" type="text" inputmode="decimal" autocomplete="off"`
  + ` spellcheck="false" data-want="${want}"${sum ? ` data-sum="${sum}"` : ""}`
  + ` aria-label="${label}" placeholder="?">`;

/** One question: what it is called, and the box for it. */
const ask = (label, want, aria, cls = "", sum = "") =>
  `<div class="ts-ask${cls ? ` ${cls}` : ""}"><dt>${label}</dt><dd>${box(want, aria, sum)}</dd></div>`;

/**
 * Draw the bill: one receipt per toy in a grid, then the totals on their own.
 *
 * A line with no sale on it is asked once — what it comes to — and that figure
 * IS the line. Asking for it twice, once as "comes to" and again as "after the
 * sale", was busy-work with no sum in it.
 */
export function tillHtml(lines, rate) {
  const B = bill(lines, rate);

  const items = B.rows.map((r) => {
    const each = writeAmount(r.price);
    const sums = r.cut
      ? ask(`${r.n} × ${priceHtml(r.price)}`, r.gross, `What ${r.n} ${plural(r.title, r.n)} ${comesTo(r.n)} before the sale`, "", `${r.n}x${each}`)
        + ask(`less ${r.cut}%`, r.off, `What the sale takes off the ${r.title}`, "is-less", `${writeAmount(r.gross)}x${r.cut}%`)
        + ask("after the sale", r.net, `What the ${r.title} line is after the sale`, "is-net", `${writeAmount(r.gross)}-${writeAmount(r.off)}`)
      : ask(`${r.n} × ${priceHtml(r.price)}`, r.net, `What ${r.n} ${plural(r.title, r.n)} ${comesTo(r.n)}`, "is-net", `${r.n}x${each}`);
    return `
      <article class="ts-item pp-receipt">
        <div class="pp-receipt__paper ts-item__paper">
          ${r.cut ? `<span class="ts-item__sale">-${r.cut}%</span>` : ""}
          <div class="ts-item__shot">${toyImg(r.art, "")}</div>
          <h3 class="ts-item__name">${r.title}</h3>
          <dl class="ts-item__sums">${sums}</dl>
        </div>
      </article>`;
  }).join("");

  const n = B.rows.reduce((t, r) => t + r.n, 0);

  return `
    <div class="ts-bill">
      <div class="ts-bill__grid">${items}</div>

      <div class="ts-sum pp-receipt">
        <div class="pp-receipt__paper ts-sum__paper">
          <p class="ts-sum__shop">The Prep Toy Shop</p>
          <p class="ts-sum__sub">${n} item${n === 1 ? "" : "s"} · ${B.rows.length} line${B.rows.length === 1 ? "" : "s"}</p>
          <dl class="ts-sum__tot">
            ${ask("Add the lines up", B.subtotal, "The subtotal", "", B.rows.map((r) => writeAmount(r.net)).join("+"))}
            ${ask(`Tax at ${rate}%`, B.tax, "The tax", "", `${writeAmount(B.subtotal)}x${rate}%`)}
            ${ask("To pay", B.total, "The total to pay", "is-pay", `${writeAmount(B.subtotal)}+${writeAmount(B.tax)}`)}
          </dl>
          <p class="ts-sum__foot">Every figure here is yours to work out</p>
        </div>
      </div>
    </div>`;
}

/**
 * Mark the boxes as they are typed in. Nothing is revealed — a box says only
 * whether it is right, which is all a till ever tells you anyway.
 */
export function wireTill(root, { onDone = () => {} } = {}) {
  const boxes = () => [...root.querySelectorAll(".ts-box")];
  const right = (b) => readAmount(b.value) === Number(b.dataset.want);
  const check = () => {
    let all = true;
    boxes().forEach((b) => {
      const typed = b.value.trim() !== "";
      const ok = typed && right(b);
      b.classList.toggle("is-right", ok);
      b.classList.toggle("is-trying", typed && !ok);
      if (!ok) all = false;
      /* a receipt whose own figures are all right is marked done, so a wall of
         them shows at a glance what is left to do */
      const card = b.closest(".ts-item, .ts-sum");
      if (card) {
        const kids = [...card.querySelectorAll(".ts-box")];
        card.classList.toggle("is-done", kids.every((k) => k.classList.contains("is-right")));
      }
    });
    onDone(all && boxes().length > 0);
  };
  root.addEventListener("input", (e) => { if (e.target.closest(".ts-box")) check(); });
  check();
  return { check };
}

export { writeAmount };
