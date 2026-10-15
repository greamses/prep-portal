/* ============================================================================
   The Prep Toy Shop — the three screens
   ----------------------------------------------------------------------------
   SHOP → TILL → DELIVERY, and the way through is arithmetic. You may fill a
   basket as freely as in any shop; you may not leave the till until you can
   say what the basket costs, to the prepcoin, tax and all.

   Every listing is a receipt (.pp-receipt, the site's torn-paper card), which
   is what a shop hands you anyway — and it lets the price sit under a dashed
   rule with the toy's photograph above it, the way a till roll is laid out.

   The money is the site's own currency (utils/components/workbook/purse.js) —
   the same prepcoins and prepbills as the Maths Workbook's money chapter, and
   the same purse: you pay by taking real notes and coins out of a tray and
   laying them on the counter.
   ========================================================================== */

import { loadToys, makeBasket, bill } from "./shop.js";
import { tillHtml, wireTill } from "./till.js";
import { payHtml, wirePay } from "./pay.js";
import { priceHtml } from "/utils/components/workbook/purse.js";
import { toyImg } from "./art.js";
import { deliver } from "./van.js";
import { UI } from "/utils/components/ui-icons.js";
import { mountTools } from "/utils/components/workbook/toolbar.js";
import { sayLeft, left as walletLeft, unlimited } from "./wallet.js";

const $ = (id) => document.getElementById(id);
const show = (which) => {
  ["shop", "till", "pay", "done"].forEach((s) => { $(`ts-${s}`).hidden = s !== which; });
  window.scrollTo({ top: 0, behavior: "smooth" });
};

let FEED = null;
let rate = 10;
const basket = makeBasket(() => { paintShelf(); paintBar(); });

/* ── the shelf ─────────────────────────────────────────────────────────────*/

/** The rating, as a shop writes it: four filled stars and the number. */
const stars = (n) => {
  const whole = Math.round(n);
  return `<span class="ts-card__stars" aria-label="rated ${n} out of 5">`
    + [1, 2, 3, 4, 5].map((i) => UI.star(i <= whole)(13)).join("")
    + `<i>${n.toFixed(1)}</i></span>`;
};

function card(p) {
  const got = basket.countOf(p.id);
  const out = got >= p.stock;
  /* nothing in the basket yet → one Add button with the trolley on it; once
     there is one, that button becomes the quantity stepper, the way a shop's
     listing does */
  const buy = got
    ? `<div class="ts-step">
         <button type="button" class="pp-btn ts-step__k" data-take="${p.id}" aria-label="One fewer ${p.title}">−</button>
         <span class="ts-step__n" aria-live="polite">${got}</span>
         <button type="button" class="pp-btn ts-step__k" data-add="${p.id}" aria-label="One more ${p.title}"${out ? " disabled" : ""}>+</button>
       </div>`
    : `<button type="button" class="pp-btn ts-card__add" data-add="${p.id}">${UI.cart(17)}<span>Add</span></button>`;

  return `
    <article class="ts-card pp-receipt${p.cut ? " is-sale" : ""}${got ? " is-in" : ""}" data-id="${p.id}" role="listitem">
      <div class="pp-receipt__paper ts-card__paper">
        ${p.cut ? `<span class="ts-card__flag">−${p.cut}%</span>` : ""}
        <div class="ts-card__shot">${toyImg(p.art, p.title)}</div>
        <h3 class="ts-card__name">${p.title}</h3>
        ${stars(p.rating)}
        <p class="ts-card__blurb">${p.blurb}</p>
        <p class="ts-card__price">
          <b>${priceHtml(p.now)}</b>
          ${p.cut ? `<s>${priceHtml(p.price)}</s>` : ""}
        </p>
        <p class="ts-card__stock">${out ? "that is all of them" : `${p.stock - got} left in the shop`}</p>
        ${buy}
      </div>
    </article>`;
}

function paintShelf() {
  if (!FEED) return;
  $("ts-shelf").innerHTML = FEED.products.map(card).join("");
}

function paintBar() {
  const n = basket.count;
  $("ts-count").innerHTML = `${UI.cart(21)}<span>${n ? `${n} toy${n === 1 ? "" : "s"} in the basket` : "Your basket is empty"}</span>`;
  $("ts-go").disabled = !n;
  paintPurse();
}

/* What there is to spend. A shop where the money never runs out is not a shop
   — it is a button, and a child who can buy everything never looks at a
   price. (wallet.js) */
function paintPurse() {
  const el = $("ts-purse");
  if (!el) return;
  const over = !unlimited() && basket.lines.length
    && bill(basket.lines, rate).total > walletLeft();
  el.innerHTML = `<span class="ts-purse__lab">To spend</span>`
    + `<b class="ts-purse__n">${sayLeft()}</b>`
    + (over ? `<em class="ts-purse__over">that basket costs more than you have</em>` : "");
  el.classList.toggle("is-over", over);
}
/* ── the bill ──────────────────────────────────────────────────────────────*/

function openTill() {
  const lines = basket.lines;
  if (!lines.length) return;

  $("ts-till-body").innerHTML = tillHtml(lines, rate);
  $("ts-topay").disabled = true;

  wireTill($("ts-till-body"), {
    onDone: (all) => {
      $("ts-topay").disabled = !all;
      $("ts-till-say").textContent = all
        ? "That is the bill. Now go and pay it."
        : "Every figure has to be right before the shop will take your money.";
      $("ts-till-say").classList.toggle("is-done", all);
    },
  });
  show("till");
}

/* ── paying, which is a screen of its own ─────────────────────────────────*/

let paying = null;

function openPay() {
  const lines = basket.lines;
  if (!lines.length) return;
  const B = bill(lines, rate);

  if (paying) paying.dispose();
  $("ts-pay-body").innerHTML = payHtml(B.total);
  $("ts-buy").disabled = true;
  paying = wirePay($("ts-pay-body"), B.total, {
    onReady: (ok, how) => {
      $("ts-buy").disabled = !ok;
      $("ts-buy").textContent = how === "card" ? "Pay with the card" : "Hand it over";
    },
  });
  $("ts-buy").onclick = () => {
    const how = paying.settle();
    paying.dispose();
    paying = null;
    buy(B, how);
  };
  show("pay");
}

/* ── and the delivery ─────────────────────────────────────────────────────*/

function buy(B, how) {
  show("done");
  deliver($("ts-done-body"), {
    spent: priceHtml(B.total),
    how,
    onDone: () => {
      $("ts-done-body").querySelector("[data-again]").innerHTML =
        `<button type="button" class="pp-btn" id="ts-again">Buy something else</button>`;
      $("ts-again").onclick = () => { basket.clear(); show("shop"); };
    },
  });
}

/* ── PrepBot, and the walk-through it gives ───────────────────────────────*/

let teacher = null;
let guide = null;

/** The shared teacher (one class, and it always talks rather than floats). */
async function getTeacher() {
  if (teacher) return teacher;
  const [{ PrepbotTeacher }] = await Promise.all([
    import("/prep-math/mental-math/shared/prepbot-teacher.js"),
    import("/utils/components/workbook/panels.js")
      .then(({ needCss }) => needCss("/prep-math/mental-math/shared/prepbot-teacher.css")),
  ]);
  const root = document.createElement("div");
  root.className = "mm-prepbot ts-prepbot";
  root.innerHTML = `
    <div class="mm-prepbot-bubble mm-prepbot-bubble--speech mm-prepbot-bubble--hidden" aria-hidden="true"><p></p></div>
    <div class="mm-prepbot-avatar-wrap">
      <div class="mm-prepbot-menu">
        <button class="mm-prepbot-menu-btn" type="button" data-bot="voice" aria-label="Mute PrepBot, or let it speak"></button>
        <button class="mm-prepbot-menu-btn" type="button" data-bot="sleep" aria-label="Sleep PrepBot"></button>
      </div>
      <div class="mm-prepbot-avatar" aria-hidden="true"></div>
    </div>`;
  document.body.appendChild(root);
  teacher = new PrepbotTeacher({
    root,
    boundsEl: document.body,
    menu: { voice: root.querySelector('[data-bot="voice"]'), sleep: root.querySelector('[data-bot="sleep"]') },
  });
  return teacher;
}

async function runGuide() {
  const t = await getTeacher();
  guide?.stop();
  basket.clear();
  show("shop");
  const { startGuide } = await import("./guide.js");
  const key = $("ts-watch");
  if (key) { key.textContent = "Stop watching"; key.onclick = () => stopGuide(); }
  guide = startGuide({ teacher: t, onDone: stopGuide });
}

function stopGuide() {
  guide?.stop();
  guide = null;
  const key = $("ts-watch");
  if (key) { key.textContent = "Watch PrepBot shop"; key.onclick = () => runGuide(); }
}

/* the learner taking the shop back stops the walk-through mid-sentence */
["pointerdown", "keydown"].forEach((ev) =>
  document.addEventListener(ev, (e) => {
    if (!guide) return;
    if (e.target.closest?.("#ts-watch, .mm-prepbot")) return;
    stopGuide();
  }, true));

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
  $("ts-topay").onclick = openPay;
  $("ts-pay-back").onclick = () => show("till");

  /* The workbook's own tools, on the shop: a calculator to check the bill
     with, the written boards to do it longhand on, and a note to work on.
     A child checking a shop bill is doing exactly what the workbook is for,
     and there is no reason for the site to own two of each tool. */
  mountTools(document.body, { tools: ["calculator", "column", "times", "shortdiv", "note"] });

  /* PREPBOT DOES THE SHOPPING, on this page. Not a film of a shop: it presses
     the real Add buttons, opens the real calculator off the rail, types the
     real sums into the real boxes and pays at the real counter. What a child
     has to learn here is which button and in what ORDER, and the only place
     to teach that is the screen they will be using. (js/guide.js) */
  $("ts-learn").innerHTML =
    `<p class="ts-learn__say">New to this? Let PrepBot do the shopping once.</p>`
    + `<button type="button" class="pp-btn" id="ts-watch">Watch PrepBot shop</button>`;
  $("ts-watch").onclick = () => runGuide();

  paintShelf();
  paintBar();
}

start();
