/* ============================================================================
   The Prep Toy Shop — the payment screen
   ----------------------------------------------------------------------------
   Two ways to pay, and each is its own sum.

   CASH      the screen becomes a counter. The notes and coins are drawn at
             nearly twice the size they are in the workbook and are dragged
             out of the tray onto it with a finger, because counting money out
             is a thing you do with your hands. Enough has to be on the counter
             AND the change worked out before the shop will take it: handing
             over a fifty and walking away is not the sum this is about.

   PREPCARD  a pretend card with a pretend balance, authorised through a
             pretend gateway. No real money can move here, and NOTHING EVER
             ASKS FOR A CARD NUMBER — a page that trains a child to type
             sixteen digits into a form because it looked official has taught
             them precisely the wrong lesson. The card is already theirs; they
             authorise it, and the sum they are asked is the one that matters
             on a card: what will be left on it afterwards. A card is where
             people stop feeling what they have spent, so this is the page
             that makes them say it out loud.
   ========================================================================== */

import { priceHtml, writeAmount, purse, mountPurse, heldTotal } from "/utils/components/workbook/purse.js";
import { readAmount } from "./shop.js";
import { UI } from "/utils/components/ui-icons.js";

/* What the card has on it, kept between visits. It is play money, and it is
   put back to its starting amount when it runs out, because being stuck with
   an empty card is not a lesson. */
const CARD_KEY = "ts-card";
const CARD_START = 25000; /* 250.00, in prepcoins */

export function cardBalance() {
  try {
    const v = Number(localStorage.getItem(CARD_KEY));
    return Number.isFinite(v) && v > 0 ? v : CARD_START;
  } catch {
    return CARD_START;
  }
}

export function setCardBalance(v) {
  const left = Math.max(0, Math.round(v));
  try { localStorage.setItem(CARD_KEY, String(left || CARD_START)); } catch { /* not kept */ }
}

/* ── the card itself ──────────────────────────────────────────────────────*/

/** The PrepCard, drawn: a chip, a contactless mark, a masked number. */
export function cardSvg(balance) {
  return `
    <svg viewBox="0 0 340 214" class="ts-card3" role="img" aria-label="Your PrepCard">
      <defs>
        <linearGradient id="tsc-face" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#3f6f9e"/><stop offset="0.52" stop-color="#2f5880"/>
          <stop offset="1" stop-color="#23415f"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="340" height="214" fill="url(#tsc-face)"/>
      <path d="M0 150c90-16 150-54 340-40v104H0z" fill="#ffffff" opacity="0.06"/>
      <path d="M0 40C110 10 210 70 340 26V0H0z" fill="#ffffff" opacity="0.05"/>

      <text x="24" y="40" font-family="Unbounded, sans-serif" font-size="19" font-weight="700" fill="#fff">PrepCard</text>
      <text x="316" y="38" text-anchor="end" font-family="JetBrains Mono, monospace"
            font-size="9" letter-spacing="2" fill="#bcd4e8">PLAY MONEY</text>

      <rect x="26" y="66" width="42" height="32" rx="4" fill="#f0cf86"/>
      <path d="M26 78h42M26 88h42M40 66v32M54 66v32" stroke="#b99a56" stroke-width="1.6"/>
      <g fill="none" stroke="#bcd4e8" stroke-width="2.2" stroke-linecap="round" opacity="0.9">
        <path d="M86 74a12 12 0 0 1 0 16"/><path d="M93 68a21 21 0 0 1 0 28"/>
        <path d="M100 62a30 30 0 0 1 0 40"/>
      </g>

      <text x="24" y="134" font-family="JetBrains Mono, monospace" font-size="19"
            letter-spacing="2.6" fill="#eaf2f9">•••• •••• •••• 4042</text>

      <text x="24" y="160" font-family="JetBrains Mono, monospace" font-size="8"
            letter-spacing="1.6" fill="#9dbad3">ON THE CARD</text>
      <text x="24" y="183" font-family="JetBrains Mono, monospace" font-size="21"
            font-weight="700" fill="#fff">${writeAmount(balance)}</text>

      <text x="316" y="183" text-anchor="end" font-family="JetBrains Mono, monospace"
            font-size="10" letter-spacing="1.4" fill="#bcd4e8">PREP PORTAL</text>
    </svg>`;
}

/* ── the screen ───────────────────────────────────────────────────────────*/

/** The whole payment screen, for a bill of `total` prepcoins. */
export function payHtml(total) {
  return `
    <div class="ts-payscreen">
      <div class="ts-choose">
        <label class="pp-sticky pp-sticky--tape sticky-choice pp-sticky--c1">
          <input type="radio" name="ts-how" value="cash" checked><span>Cash</span></label>
        <label class="pp-sticky pp-sticky--tape sticky-choice pp-sticky--c3">
          <input type="radio" name="ts-how" value="card"><span>PrepCard</span></label>
      </div>

      <section class="ts-cash" data-way="cash">
        <div class="ts-counter" data-counter></div>
        <div class="ts-cash__say pp-receipt">
          <div class="pp-receipt__paper ts-cash__paper">
            <p class="ts-cash__title">The counter</p>
            <dl class="ts-cash__sums">
              <div class="ts-ask is-flat"><dt>To pay</dt><dd><b>${priceHtml(total)}</b></dd></div>
              <div class="ts-ask is-flat"><dt>On the counter</dt><dd data-held>—</dd></div>
              <div class="ts-ask is-pay"><dt>Change back</dt>
                <dd><input class="ts-box" type="text" inputmode="decimal" autocomplete="off"
                           data-change aria-label="The change you should get back" placeholder="?"></dd></div>
            </dl>
            <p class="ts-cash__note" data-note>Drag notes and coins out of the tray onto the counter.</p>
          </div>
        </div>
      </section>

      <section class="ts-cardpay" data-way="card" hidden>
        <div class="ts-cardpay__card" data-cardart></div>
        <div class="ts-gate pp-receipt">
          <div class="pp-receipt__paper ts-gate__paper">
            <p class="ts-gate__brand">${UI.lock(15)}<span>PrepPay</span></p>
            <p class="ts-gate__sub">Pretend gateway · play money only</p>
            <dl class="ts-gate__rows">
              <div class="ts-ask is-flat"><dt>Shop</dt><dd>The Prep Toy Shop</dd></div>
              <div class="ts-ask is-flat"><dt>Amount</dt><dd><b>${priceHtml(total)}</b></dd></div>
              <div class="ts-ask is-flat"><dt>Card</dt><dd>•••• 4042</dd></div>
            </dl>
            <div class="ts-gate__step" data-step></div>
            <p class="ts-gate__warn">This card is not real and no real money can be paid here.
              Never type a real card number into any page.</p>
          </div>
        </div>
      </section>
    </div>`;
}

/**
 * Bring the payment screen to life.
 *
 *   onReady(ok, how)   whether the shop may now be paid, and by what
 * → { settle(), dispose() }
 */
export function wirePay(root, total, { onReady = () => {} } = {}) {
  let how = "cash";
  let cashOk = false;
  let cardOk = false;
  const tell = () => onReady(how === "cash" ? cashOk : cardOk, how);

  root.addEventListener("change", (e) => {
    if (e.target.name !== "ts-how") return;
    how = e.target.value;
    root.querySelectorAll("[data-way]").forEach((s) => { s.hidden = s.dataset.way !== how; });
    tell();
  });

  /* ── cash ─────────────────────────────────────────────────────────────*/

  const counter = root.querySelector("[data-counter]");
  counter.innerHTML = purse({ say: `drag out at least ${writeAmount(total)}`, mm: 74, scale: 1.9 });
  const held = root.querySelector("[data-held]");
  const note = root.querySelector("[data-note]");
  const chg = root.querySelector("[data-change]");
  let laid = 0;

  const lookCash = () => {
    const enough = laid >= total;
    const owed = laid - total;
    const typed = chg.value.trim() !== "";
    cashOk = enough && typed && readAmount(chg.value) === owed;
    chg.classList.toggle("is-right", cashOk);
    chg.classList.toggle("is-trying", typed && !cashOk);
    held.innerHTML = laid ? `<b>${priceHtml(laid)}</b>` : "—";
    held.classList.toggle("is-enough", enough);
    note.textContent = enough
      ? "That is enough on the counter. Now work out what comes back."
      : `Drag notes and coins out of the tray onto the counter — at least ${writeAmount(total)}.`;
    tell();
  };
  chg.addEventListener("input", lookCash);

  const money = mountPurse(counter.querySelector("[data-purse]"), {
    scale: 1.9,
    onChange: (now) => { laid = heldTotal(now); lookCash(); },
  });
  lookCash();

  /* ── the card ─────────────────────────────────────────────────────────*/

  const art = root.querySelector("[data-cardart]");
  const step = root.querySelector("[data-step]");
  art.innerHTML = cardSvg(cardBalance());

  let timer = null;

  const offer = () => {
    const bal = cardBalance();
    if (bal < total) {
      step.innerHTML = `
        <p class="ts-gate__no">Not enough on the card.</p>
        <p class="ts-gate__hint">It has ${writeAmount(bal)} on it and the bill is ${writeAmount(total)}.
          Pay with cash instead, or go back and take something out of the basket.</p>`;
      cardOk = false;
      tell();
      return;
    }
    step.innerHTML = `<button type="button" class="pp-btn ts-gate__go" data-go>Authorise ${writeAmount(total)}</button>`;
  };

  const authorise = () => {
    step.innerHTML = `<p class="ts-gate__busy">Contacting PrepPay<i></i><i></i><i></i></p>`;
    timer = setTimeout(() => {
      const bal = cardBalance();
      step.innerHTML = `
        <p class="ts-gate__ok">${UI.check(15)}<span>Authorised</span></p>
        <div class="ts-ask is-pay"><dt>${writeAmount(bal)} less ${writeAmount(total)} leaves</dt>
          <dd><input class="ts-box" type="text" inputmode="decimal" autocomplete="off"
                     data-left aria-label="What will be left on the card" placeholder="?"></dd></div>
        <p class="ts-gate__hint" data-leftsay>Say what will be left on the card and the payment goes through.</p>`;
      const left = step.querySelector("[data-left]");
      left.addEventListener("input", () => {
        const typed = left.value.trim() !== "";
        cardOk = typed && readAmount(left.value) === bal - total;
        left.classList.toggle("is-right", cardOk);
        left.classList.toggle("is-trying", typed && !cardOk);
        step.querySelector("[data-leftsay]").textContent = cardOk
          ? "That is right. PrepPay will take it."
          : "Say what will be left on the card and the payment goes through.";
        tell();
      });
      left.focus();
    }, 1100);
  };

  step.addEventListener("click", (e) => { if (e.target.closest("[data-go]")) authorise(); });
  offer();

  return {
    /** Called once the shop has actually been paid. → how it was paid. */
    settle() {
      if (how === "card") setCardBalance(cardBalance() - total);
      return how;
    },
    dispose() { clearTimeout(timer); money.dispose(); },
  };
}
