/* ============================================================================
   The Prep Toy Shop — the three screens
   ----------------------------------------------------------------------------
   SHOP → TILL → DELIVERY, and the way through is arithmetic. You may fill a
   basket as freely as in any shop; you may not leave the till until you can
   say what the basket costs, to the prepcoin, tax and all.

   The money is the site's own currency (utils/components/workbook/purse.js) —
   the same prepcoins and prepbills as the Maths Workbook's money chapter, and
   the same purse: you pay by taking real notes and coins out of a tray and
   laying them on the counter.
   ========================================================================== */

import { loadToys, makeBasket, bill, writeAmount } from "./shop.js";
import { tillHtml, wireTill, payHtml, wirePay } from "./till.js";
import { purse, mountPurse, heldTotal, priceHtml } from "/utils/components/workbook/purse.js";
import { toySvg } from "./art.js";
import { deliver } from "./van.js";

const $ = (id) => document.getElementById(id);
const show = (which) => {
  ["shop", "till", "done"].forEach((s) => { $(`ts-${s}`).hidden = s !== which; });
  window.scrollTo({ top: 0, behavior: "smooth" });
};

let FEED = null;
let rate = 10;
const basket = makeBasket(() => { paintShelf(); paintBar(); });

/* ── the shelf ─────────────────────────────────────────────────────────────*/

function card(p) {
  const got = basket.countOf(p.id);
  const out = got >= p.stock;
  return `
    <article class="ts-card${p.cut ? " is-sale" : ""}" data-id="${p.id}">
      ${p.cut ? `<span class="ts-card__flag">${p.cut}% off</span>` : ""}
      <div class="ts-card__shot">${toySvg(p.art, p.slot)}</div>
      <div class="ts-card__body">
        <h3 class="ts-card__name">${p.title}</h3>
        <p class="ts-card__blurb">${p.blurb}</p>
        <p class="ts-card__price">
          ${p.cut ? `<s>${priceHtml(p.price)}</s>` : ""}
          <b>${priceHtml(p.now)}</b>
        </p>
        <p class="ts-card__stock">${p.stock} in the shop</p>
        <div class="ts-card__buy">
          <button type="button" class="pp-btn ts-less" data-take="${p.id}" aria-label="Take one ${p.title} out"${got ? "" : " disabled"}>−</button>
          <span class="ts-card__n" aria-live="polite">${got}</span>
          <button type="button" class="pp-btn ts-more" data-add="${p.id}" aria-label="Put one ${p.title} in"${out ? " disabled" : ""}>+</button>
        </div>
      </div>
    </article>`;
}

function paintShelf() {
  if (!FEED) return;
  $("ts-shelf").innerHTML = FEED.products.map(card).join("");
}

function paintBar() {
  const n = basket.count;
  $("ts-count").textContent = n ? `${n} toy${n === 1 ? "" : "s"} in the basket` : "The basket is empty";
  $("ts-go").disabled = !n;
}

/* ── the till ──────────────────────────────────────────────────────────────*/

function openTill() {
  const lines = basket.lines;
  if (!lines.length) return;
  const B = bill(lines, rate);

  $("ts-till-body").innerHTML = tillHtml(lines, rate);
  $("ts-pay-body").innerHTML = payHtml(B.total) + purse({ say: `pay with at least ${writeAmount(B.total)}`, mm: 38 });
  $("ts-pay-wrap").hidden = true;
  $("ts-buy").disabled = true;

  wireTill($("ts-till-body"), {
    onDone: (all) => {
      $("ts-pay-wrap").hidden = !all;
      $("ts-till-say").textContent = all
        ? "That is the bill. Now pay it."
        : "Every box has to be right before the shop will take your money.";
      $("ts-till-say").classList.toggle("is-done", all);
    },
  });

  const pay = wirePay($("ts-pay-body"), B.total, { onReady: (ok) => { $("ts-buy").disabled = !ok; } });
  const card = mountPurse($("ts-pay-body").querySelector("[data-purse]"), {
    onChange: (now) => pay.laid(heldTotal(now)),
  });
  $("ts-buy").onclick = () => { card.dispose(); buy(B); };
  show("till");
}

/* ── and the delivery that is not one ─────────────────────────────────────*/

function buy(B) {
  show("done");
  deliver($("ts-done-body"), {
    spent: priceHtml(B.total),
    onDone: () => {
      $("ts-done-body").querySelector("[data-again]").innerHTML =
        `<button type="button" class="pp-btn" id="ts-again">Go round again</button>`;
      $("ts-again").onclick = () => { basket.clear(); show("shop"); };
    },
  });
}

/* ── starting up ───────────────────────────────────────────────────────────*/

async function start() {
  try {
    FEED = await loadToys();
  } catch (err) {
    $("ts-shelf").innerHTML = `<p class="ts-oops">The shop did not answer — ${err.message}. `
      + `Try again in a moment.</p>`;
    return;
  }
  /* the tax the government of this shop charges, which the child picks and
     then has to work out */
  $("ts-tax").innerHTML = FEED.taxRates.map((r, i) =>
    `<label class="pp-sticky pp-sticky--tape sticky-choice pp-sticky--c${i + 1}">`
    + `<input type="radio" name="ts-rate" value="${r}"${r === rate ? " checked" : ""}><span>${r}%</span></label>`).join("");
  $("ts-tax").addEventListener("change", (e) => {
    if (!e.target.name) return;
    rate = Number(e.target.value);
    if (!$("ts-till").hidden) openTill();
  });

  $("ts-shelf").addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    const take = e.target.closest("[data-take]");
    if (add) basket.add(FEED.products.find((p) => p.id === Number(add.dataset.add)));
    if (take) basket.take(Number(take.dataset.take));
  });
  $("ts-go").onclick = openTill;
  $("ts-back").onclick = () => show("shop");

  paintShelf();
  paintBar();
}

start();
