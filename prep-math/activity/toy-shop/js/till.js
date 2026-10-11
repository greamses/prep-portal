/* ============================================================================
   The Prep Toy Shop — the till, where the shop tells you NOTHING
   ----------------------------------------------------------------------------
   A real checkout does the arithmetic and shows you a total. This one does the
   arithmetic and keeps it: every figure of the bill is a box, and the bill only
   exists once the child has worked it out. The till knows the answers — it has
   to, to mark them — and will not say one.

   IT IS SHAPED LIKE A RECEIPT, because that is what a checkout gives you: one
   narrow column of lines on torn paper (.pp-receipt), each line asking for the
   next figure. It used to be a seven-column table, which was wrong twice over
   — it read as a spreadsheet rather than a shop, and seven columns cannot fit
   a phone, so the right-hand half of the bill fell off the screen.

   WHAT IT ASKS, in the order a bill is built:
     a line with no sale    so many at that each  -> what the line comes to
     a line with one        so many at that each  -> what they come to first
                            the sale takes a %    -> what comes off
                                                  -> what the line is now
     then                   add the lines up      -> the subtotal
                            tax is a % of that    -> the tax
                                                  -> the total to pay
     and paying             lay the money out     -> the change

   A box goes green when it is right and amber when it is not — never red: a
   sum in progress is not a mistake. The PAY key is dead until the total is
   right, which is the whole bargain of the page: you may have the toys when
   you can say what they cost.
   ========================================================================== */

import { priceHtml, markSvg, writeAmount } from "/utils/components/workbook/purse.js";
import { bill, readAmount, percentOf } from "./shop.js";
import { toyImg } from "./art.js";

const box = (want, label) =>
  `<input class="ts-box" type="text" inputmode="decimal" autocomplete="off"`
  + ` spellcheck="false" data-want="${want}" aria-label="${label}" placeholder="?">`;

/** One question on the receipt: what it is called, and the box for it. */
const ask = (label, want, aria, cls = "") =>
  `<div class="ts-ask${cls ? ` ${cls}` : ""}"><dt>${label}</dt><dd>${box(want, aria)}</dd></div>`;

/**
 * Draw the bill as a set of questions on a receipt.
 *
 * A line with no sale on it is asked once — what it comes to — and that figure
 * IS the line. Asking for it twice, once as "comes to" and again as "after the
 * sale", was busy-work with no sum in it.
 */
export function tillHtml(lines, rate) {
  const B = bill(lines, rate);
  const n = B.rows.reduce((t, r) => t + r.n, 0);

  const items = B.rows.map((r) => {
    const each = `${r.n} × ${priceHtml(r.price)}`;
    const sums = r.cut
      ? ask(each, r.gross, `What ${r.n} ${r.title} come to before the sale`)
        + ask(`less ${r.cut}%`, r.off, `What the sale takes off the ${r.title}`, "is-less")
        + ask("after the sale", r.net, `What the ${r.title} line is after the sale`, "is-net")
      : ask(each, r.net, `What ${r.n} ${r.title} come to`, "is-net");
    return `
      <li class="ts-line">
        <p class="ts-line__head">${toyImg(r.art, "", "ts-line__pic")}<span>${r.title}</span>
          ${r.cut ? `<em class="ts-line__sale">-${r.cut}%</em>` : ""}</p>
        <dl class="ts-line__sums">${sums}</dl>
      </li>`;
  }).join("");

  return `
    <div class="ts-bill pp-receipt">
      <div class="pp-receipt__paper ts-bill__paper">
        <p class="ts-bill__shop">The Prep Toy Shop</p>
        <p class="ts-bill__sub">${n} item${n === 1 ? "" : "s"} · work every figure out yourself</p>
        <ul class="ts-bill__lines">${items}</ul>
        <dl class="ts-bill__tot">
          ${ask("Subtotal", B.subtotal, "The subtotal")}
          ${ask(`Tax at ${rate}%`, B.tax, "The tax")}
          ${ask("To pay", B.total, "The total to pay", "is-pay")}
        </dl>
        <p class="ts-bill__foot">Thank you for doing the arithmetic</p>
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
    });
    onDone(all && boxes().length > 0);
  };
  root.addEventListener("input", (e) => { if (e.target.closest(".ts-box")) check(); });
  check();
  return { check };
}

/* ── paying ───────────────────────────────────────────────────────────────*/

/** The card that says what is on the mat, and asks for the change. */
export function payHtml(total) {
  return `
    <div class="ts-pay pp-receipt">
      <div class="pp-receipt__paper ts-pay__paper">
        <p class="ts-pay__shop">Payment</p>
        <dl class="ts-pay__sums">
          <div class="ts-ask is-flat"><dt>To pay</dt><dd><b>${priceHtml(total)}</b></dd></div>
          <div class="ts-ask is-flat"><dt>On the counter</dt><dd data-held>—</dd></div>
          <div class="ts-ask is-pay"><dt>Change back</dt>
            <dd><input class="ts-box" type="text" inputmode="decimal" autocomplete="off"
                       data-change aria-label="The change you should get back" placeholder="?"></dd></div>
        </dl>
        <p class="ts-pay__note" data-note>Take at least ${writeAmount(total)} out of the purse, lay it on the
          counter, then say what comes back.</p>
        <div class="ts-pay__purse" data-purse-slot></div>
      </div>
    </div>`;
}

/**
 * Watch the purse. Paying needs BOTH: enough money on the counter, and the
 * right change worked out — because handing over a fifty and walking away is
 * not the sum this page is about.
 */
export function wirePay(root, total, { onReady = () => {} } = {}) {
  const held = root.querySelector("[data-held]");
  const note = root.querySelector("[data-note]");
  const chg = root.querySelector("[data-change]");
  let laid = 0;
  const look = () => {
    const enough = laid >= total;
    const owed = laid - total;
    const typed = chg.value.trim() !== "";
    const ok = enough && typed && readAmount(chg.value) === owed;
    chg.classList.toggle("is-right", ok);
    chg.classList.toggle("is-trying", typed && !ok);
    held.innerHTML = laid ? `<b>${priceHtml(laid)}</b>` : "—";
    held.classList.toggle("is-enough", enough);
    note.textContent = enough
      ? "That is enough. Now say what comes back."
      : `Take at least ${writeAmount(total)} out of the purse, lay it on the counter, then say what comes back.`;
    onReady(ok);
  };
  chg.addEventListener("input", look);
  look();
  return { laid(v) { laid = v; look(); } };
}

export { markSvg };
