/* ============================================================================
   PRINTABLE WORKBOOK — the print pass
   ----------------------------------------------------------------------------
   ₦5,000 buys the right to print ONE exact workbook, as often as it is
   needed. "Exact" is a fingerprint of what is ON the paper — the sections and
   their counts, the seed code, the level and help dials — and deliberately
   not of how it is dressed: the title, the paper size, the name line and
   whether the answer key is included can all change without paying again,
   so a teacher can print the questions for the class and the key for
   themselves from one pass.

   THE LOCK IS ON THE SERVER. The browser computes the fingerprint and asks
   /api/workbooks/pass; the answer comes from a Paystack charge the server
   verified itself. Nothing the browser stores can make a workbook paid.

   WHAT THE PAGE DOES WITH THE ANSWER, and what it cannot do. Unpaid, the print
   stylesheet blanks every page — the browser's own Print menu, Ctrl+P, Save
   as PDF and a print from a framed copy all come out as one page saying where
   to buy a pass. The preview carries a PREVIEW mark across every page, and
   right-click, dragging and copying are turned off over the paper. Paid, every
   page carries the buyer's name and order code in its footer, so a printed
   copy that travels says whose it was.

   A browser cannot stop a screenshot, or someone determined with the
   developer tools. The preview mark spoils the first; the second gets them a
   copy of the preview, not a clean printout, and the name on every paid page
   is what makes a paid copy traceable. That is the honest ceiling of a web
   page, and this goes up to it.
   ========================================================================== */

import { api, currentUser, onUser } from "./account.js";

const PAYSTACK_KEY = "pk_live_f4ddce00cea983792c801c129d875e64086d68da";
const PRICE = 5000;
const COSMETIC = new Set(["title", "paper", "nameLine", "answers", "watermark"]);
const root = document.documentElement;

const naira = (n) => `₦${n.toLocaleString("en-NG")}`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** The fingerprint of a workbook's CONTENT: SHA-256, hex. */
export async function workbookKey(workbook, o) {
  const content = {};
  Object.keys(o).sort().forEach((k) => { if (!COSMETIC.has(k)) content[k] = o[k]; });
  const bytes = new TextEncoder().encode(`${workbook}|${JSON.stringify(content)}`);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function loadPaystack() {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) return resolve();
    const s = document.createElement("script");
    s.src = "https://js.paystack.co/v1/inline.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not reach Paystack. Check your connection."));
    document.head.appendChild(s);
  });
}

/**
 * The pass for one workbook page.
 *
 *   const pass = printPass({ workbook: "geometry-workbook", label: "Geometry Workbook" });
 *   pass.update(options, { pages, sections, code })   after every rebuild
 *   pass.print()                                      the Print button
 */
export function printPass({ workbook, label }) {
  const cache = new Map();          // key -> server answer, for paid keys
  let key = null;
  let seq = 0;
  let state = { checking: true, paid: false };
  let info = { pages: 0, sections: 0, code: "" };

  /* the line in the toolbar that says where this workbook stands */
  const toolbar = document.querySelector(".wb-toolbar");
  const status = document.createElement("span");
  status.className = "wb-pass";
  status.id = "wb-pass";
  toolbar?.querySelector(".wb-toolbar__spacer")?.before(status);
  const btnLabel = () => document.querySelector("#wb-print .wb-print__label");

  function apply() {
    const ok = !!state.paid;
    root.classList.toggle("wb-print-ok", ok);
    /* No PREVIEW wash over the pages any more — see workbook.css. The print
       stylesheet still blanks an unpaid workbook, which is the gate that
       matters; this only ever made the thing unpleasant to look at while it
       was being built. */
    root.style.setProperty(
      "--wb-licence",
      ok && !state.admin ? JSON.stringify(`  ·  Printed for ${state.buyer}  ·  ${state.order}`) : '""'
    );
    let text;
    if (state.checking) text = "Checking print pass…";
    else if (state.signedOut) text = "Sign in to print";
    else if (state.error) text = state.error;
    else if (ok) text = state.admin ? "Admin — prints free" : `Paid · ${state.order} · print any time`;
    else text = `Printing this workbook: ${naira(PRICE)}`;
    status.textContent = text;
    status.classList.toggle("is-paid", ok);
    const l = btnLabel();
    if (l) l.textContent = ok || state.checking ? "Print" : `Print · ${naira(PRICE)}`;
  }

  async function check() {
    const my = ++seq;
    if (cache.has(key)) { state = cache.get(key); apply(); return; }
    state = { checking: true, paid: false };
    apply();
    try {
      const user = await currentUser();
      if (my !== seq) return;
      if (!user) { state = { signedOut: true, paid: false }; apply(); return; }
      const r = await api("/api/workbooks/pass", { workbook, key });
      if (my !== seq) return;
      state = { paid: !!r.paid, admin: !!r.admin, buyer: r.buyer, order: r.order };
      if (state.paid) cache.set(key, state);
    } catch (e) {
      if (my !== seq) return;
      state = { paid: false, error: "Could not check the print pass" };
    }
    apply();
  }

  let pending = 0;
  async function update(o, meta = {}) {
    info = { ...info, ...meta };
    const k = await workbookKey(workbook, o);
    if (k === key && !state.error) return;
    key = k;
    /* Straight away, not after the debounce: the moment the content changes
       the old pass stops applying. */
    if (!cache.has(key)) { state = { checking: true, paid: false }; apply(); }
    clearTimeout(pending);
    pending = setTimeout(check, 250);
  }

  function print() {
    if (state.paid) {
      root.classList.add("wb-print-ok");
      window.print();
      return;
    }
    openCheckout();
  }

  /* ── the checkout, on a receipt ─────────────────────────────────────────*/

  function openCheckout() {
    document.getElementById("wb-pay")?.remove();
    const box = document.createElement("div");
    box.className = "wb-pay";
    box.id = "wb-pay";
    box.innerHTML = `
      <div class="wb-pay__card pp-receipt" role="dialog" aria-modal="true" aria-labelledby="wb-pay-title">
        <div class="pp-receipt__paper">
          <p class="wb-pay__eyebrow">Print pass</p>
          <h2 class="wb-pay__title" id="wb-pay-title">Print this workbook</h2>
          <dl class="wb-pay__lines">
            <div><dt>Workbook</dt><dd>${esc(label)}</dd></div>
            <div><dt>Sections</dt><dd>${info.sections}</dd></div>
            <div><dt>Pages</dt><dd>${info.pages}</dd></div>
            <div><dt>Code</dt><dd>${esc(info.code)}</dd></div>
            <div class="wb-pay__total"><dt>Total</dt><dd>${naira(PRICE)}</dd></div>
          </dl>
          <p class="wb-pay__small">
            Print it, or save it as a PDF, as often as you need — this exact
            workbook, for good. Changing the sections, the level or the code
            makes a different workbook. The title, paper size and answer key
            can change freely. Every printed page carries your name and order
            code.
          </p>
          <p class="wb-pay__msg" id="wb-pay-msg" role="status"></p>
          <div class="wb-pay__actions">
            <button type="button" class="pp-btn wb-tint-4" id="wb-pay-cancel">Not now</button>
            <button type="button" class="pp-btn" id="wb-pay-go">Pay ${naira(PRICE)}</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(box);
    const msg = box.querySelector("#wb-pay-msg");
    const go = box.querySelector("#wb-pay-go");
    const close = () => box.remove();
    box.querySelector("#wb-pay-cancel").addEventListener("click", close);
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    document.addEventListener("keydown", function onKey(e) {
      if (e.key === "Escape") { close(); document.removeEventListener("keydown", onKey); }
    });
    go.focus();

    go.addEventListener("click", async () => {
      go.disabled = true;
      msg.textContent = "Opening payment…";
      try {
        const user = await currentUser();
        if (!user) throw new Error("Please sign in first.");
        const payKey = key;
        const order = await api("/api/workbooks/checkout", {
          workbook, key: payKey,
          summary: `${label} · ${info.sections} sections · ${info.pages} pages · code ${info.code}`,
        });
        await loadPaystack();
        const handler = window.PaystackPop.setup({
          key: PAYSTACK_KEY,
          email: order.email || user.email,
          amount: order.amountKobo,
          currency: "NGN",
          ref: order.reference,
          metadata: {
            kind: order.kind, uid: user.uid, workbook, key: payKey,
            custom_fields: [
              { display_name: "For", variable_name: "for", value: `${label} print pass` },
              { display_name: "Code", variable_name: "code", value: info.code },
            ],
          },
          callback: (res) => {
            msg.textContent = "Payment received — confirming…";
            api("/api/workbooks/verify", { reference: res.reference })
              .then((r) => {
                const paid = { paid: true, buyer: r.buyer, order: r.order };
                cache.set(r.key || payKey, paid);
                if ((r.key || payKey) === key) { state = paid; apply(); }
                close();
                print();
              })
              .catch((e) => {
                msg.textContent = `${e.message} Your payment is safe — refresh in a minute, or quote ${res.reference} to support.`;
                go.disabled = false;
              });
          },
          onClose: () => {
            if (!msg.textContent.startsWith("Payment received")) { msg.textContent = ""; go.disabled = false; }
          },
        });
        handler.openIframe();
      } catch (e) {
        msg.textContent = e.message;
        go.disabled = false;
      }
    });
  }

  /* Signing in or out changes the answer for the same workbook. */
  let seen;
  onUser((u) => {
    const uid = u ? u.uid : null;
    if (seen !== undefined && uid !== seen) { cache.clear(); if (key) check(); }
    seen = uid;
  });

  apply();
  return { update, print, allowed: () => !!state.paid };
}

/**
 * Close the side doors. Ctrl/Cmd+P goes through the pass; Ctrl/Cmd+S (save
 * the page) is refused; a print from the browser's own menu reaches
 * beforeprint and, unpaid, prints the blank page the stylesheet provides.
 * Over the paper itself: no right-click, no dragging figures out, no copying
 * — except inside anything a learner types into.
 */
export function guardPrinting(pass) {
  document.addEventListener("keydown", (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    const k = e.key.toLowerCase();
    if (k === "p" || k === "s") {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (k === "p") pass.print();
    }
  }, true);

  window.addEventListener("beforeprint", () => {
    if (!pass.allowed()) root.classList.remove("wb-print-ok");
  });

  const paper = document.getElementById("wb-viewport");
  const typing = (t) => t.closest && t.closest("input, textarea, select, [contenteditable]");
  ["contextmenu", "dragstart", "copy", "cut", "selectstart"].forEach((type) => {
    paper?.addEventListener(type, (e) => { if (!typing(e.target)) e.preventDefault(); });
  });
}
