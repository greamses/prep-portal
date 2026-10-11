/* ============================================================================
   The Prep Toy Shop — the till, where the shop tells you NOTHING
   ----------------------------------------------------------------------------
   A real checkout does the arithmetic and shows you a total. This one does the
   arithmetic and keeps it: every figure of the payment summary is a box, and
   the summary only exists once the child has worked it out. The till knows the
   answers — it has to, to mark them — and will not say one.

   WHAT IT ASKS, in the order a bill is built:
     per line    so many at that each                → what the line comes to
                 the sale takes a percentage off it  → what comes off
                                                     → what the line is now
     then        add the lines up                    → the subtotal
                 tax is a percentage of that         → the tax
                 add it on                           → the total to pay
     and paying  lay the money out                   → the change

   A box goes green when it is right and amber when it is not — never red: a
   sum in progress is not a mistake. The PAY key is dead until the total is
   right, which is the whole bargain of the page: you may have the toys when
   you can say what they cost.
   ========================================================================== */

import { priceHtml, markSvg } from "/utils/components/workbook/purse.js";
import { bill, readAmount, percentOf } from "./shop.js";
import { toySvg } from "./art.js";

const box = (want, label, wide = false) =>
  `<input class="ts-box${wide ? " ts-box--wide" : ""}" type="text" inputmode="decimal" autocomplete="off"`
  + ` spellcheck="false" data-want="${want}" aria-label="${label}" placeholder="?">`;

/**
 * Draw the bill as a set of questions.
 *
 * → the element, and `done()` — whether every box on it is right, which is
 *   what unlocks paying.
 */
export function tillHtml(lines, rate) {
  const B = bill(lines, rate);
  /* Every cell carries the column it is under. On a phone the table is too wide
     to be a table at all, so it reflows into one card per toy and these labels
     become the row headings — a bill the width of a hand, rather than a table
     with its right-hand half cut off the screen. */
  const rows = B.rows.map((r) => `
    <tr class="ts-till__row">
      <td class="ts-till__what">${toySvg(r.art, r.slot)}<span>${r.title}</span></td>
      <td class="ts-till__n" data-lab="How many">${r.n}</td>
      <td class="ts-till__each" data-lab="Each">${priceHtml(r.price)}</td>
      <td data-lab="Comes to">${box(r.gross, `What ${r.n} ${r.title} come to`)}</td>
      <td class="ts-till__cut" data-lab="Sale">${r.cut ? `${r.cut}%` : "—"}</td>
      <td data-lab="Off">${r.cut ? box(r.off, `What the sale takes off the ${r.title}`) : "<span class='ts-till__none'>nothing off</span>"}</td>
      <td data-lab="After the sale">${box(r.net, `What the ${r.title} line is after the sale`)}</td>
    </tr>`).join("");

  return `
    <table class="ts-till">
      <caption class="ts-till__cap">Work out what to pay</caption>
      <thead><tr>
        <th>Item</th><th>Qty</th><th>Each</th><th>Comes to</th>
        <th>Sale</th><th>Off</th><th>After the sale</th>
      </tr></thead>
      <tbody>
        ${rows}
        <tr class="ts-till__sum"><td colspan="6">Add the lines up — the subtotal</td>
          <td>${box(B.subtotal, "The subtotal")}</td></tr>
        <tr class="ts-till__sum"><td colspan="6">Tax at <b>${rate}%</b> of the subtotal</td>
          <td>${box(B.tax, "The tax")}</td></tr>
        <tr class="ts-till__sum ts-till__sum--pay"><td colspan="6">So there is this much to pay</td>
          <td>${box(B.total, "The total to pay")}</td></tr>
      </tbody>
    </table>`;
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

/** The line that says what is on the mat, and asks for the change. */
export function payHtml(total) {
  return `
    <div class="ts-pay">
      <p class="ts-pay__ask">To pay: <b>${priceHtml(total)}</b></p>
      <p class="ts-pay__held" data-held>Nothing on the counter yet.</p>
      <label class="ts-pay__change">Change I should get back
        <input class="ts-box ts-box--wide" type="text" inputmode="decimal" autocomplete="off"
               data-change aria-label="The change you should get back" placeholder="?">
      </label>
      <p class="ts-pay__note">Lay out at least ${priceHtml(total)} — then say what comes back.</p>
    </div>`;
}

/**
 * Watch the purse. Paying needs BOTH: enough money on the counter, and the
 * right change worked out — because handing over a fifty and walking away is
 * not the sum this page is about.
 */
export function wirePay(root, total, { onReady = () => {} } = {}) {
  const held = root.querySelector("[data-held]");
  const chg = root.querySelector("[data-change]");
  let laid = 0;
  const look = () => {
    const enough = laid >= total;
    const owed = laid - total;
    const typed = chg.value.trim() !== "";
    const ok = enough && typed && readAmount(chg.value) === owed;
    chg.classList.toggle("is-right", ok);
    chg.classList.toggle("is-trying", typed && !ok);
    held.innerHTML = laid
      ? `On the counter: <b>${priceHtml(laid)}</b>${enough ? "" : " — not enough yet."}`
      : "Nothing on the counter yet.";
    held.classList.toggle("is-enough", enough);
    onReady(ok);
  };
  chg.addEventListener("input", look);
  look();
  return { laid(v) { laid = v; look(); } };
}

export { markSvg };
