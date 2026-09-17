/* ============================================================================
   PRINTABLE WORKBOOK — who may print
   ----------------------------------------------------------------------------
   Printing is part of the subscription. It used to be sold per workbook —
   ₦5,000 bought the right to print ONE exact set of questions, for good — and
   that is gone: a subscriber prints every workbook, as many times as they
   like, and nobody is asked for money on this page.

   THE LOCK IS STILL ON THE SERVER. The browser asks /api/workbooks/pass; the
   answer comes from the same subscription test the rest of the site uses
   (server/lib/access.js). Nothing the browser stores can open the printer.

   WHAT THE PAGE DOES WITH THE ANSWER, and what it cannot do. Without a
   subscription the print stylesheet blanks every page — the browser's own
   Print menu, Ctrl+P, Save as PDF and a print from a framed copy all come out
   as one page saying where to subscribe. Right-click, dragging and copying are
   turned off over the paper. With one, every page carries the subscriber's
   name in its footer, so a printed copy that travels says whose it was.

   A browser cannot stop a screenshot, or someone determined with the developer
   tools. What it gets them is a copy of the screen, not a clean printout, and
   the name on every printed page is what makes a copy traceable. That is the
   honest ceiling of a web page, and this goes up to it.
   ========================================================================== */

import { api, currentUser, onUser } from "./account.js";

/* Cosmetic options do not change any answer here any more — a subscriber may
   print anything — but the fingerprint below is still how the interactive
   sheet knows one built workbook from another, so the list stays. */
const COSMETIC = new Set(["title", "paper", "nameLine", "answers", "watermark"]);
const root = document.documentElement;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** The fingerprint of a workbook's CONTENT: SHA-256, hex. */
export async function workbookKey(workbook, o) {
  const content = {};
  Object.keys(o).sort().forEach((k) => { if (!COSMETIC.has(k)) content[k] = o[k]; });
  const bytes = new TextEncoder().encode(`${workbook}|${JSON.stringify(content)}`);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * May this person print this workbook page?
 *
 *   const pass = printPass({ workbook: "geometry-workbook", label: "Geometry Workbook" });
 *   pass.update(options, { pages, sections, code })   after every rebuild
 *   pass.print()                                      the Print button
 *
 * The answer does not depend on what is ON the paper, so it is asked once and
 * again only when somebody signs in or out. `update` is still called after
 * every rebuild — it keeps the receipt's page and section counts honest.
 */
export function printPass({ workbook, label }) {
  let seq = 0;
  let state = { checking: true, allowed: false };
  let info = { pages: 0, sections: 0, code: "" };

  /* the line in the toolbar that says where this person stands */
  const toolbar = document.querySelector(".wb-toolbar");
  const status = document.createElement("span");
  status.className = "wb-pass";
  status.id = "wb-pass";
  toolbar?.querySelector(".wb-toolbar__spacer")?.before(status);

  function apply() {
    const ok = !!state.allowed;
    root.classList.toggle("wb-print-ok", ok);
    root.style.setProperty(
      "--wb-licence",
      ok && state.who ? JSON.stringify(`  ·  Printed for ${state.who}`) : '""'
    );
    let text;
    if (state.checking) text = "Checking…";
    else if (state.signedOut) text = "Sign in to print";
    else if (state.error) text = state.error;
    else if (ok) text = state.admin ? "Admin — prints free" : "Subscribed · print any time";
    else text = "Printing needs a subscription";
    status.textContent = text;
    status.classList.toggle("is-paid", ok);
  }

  async function check() {
    const my = ++seq;
    state = { checking: true, allowed: false };
    apply();
    try {
      const user = await currentUser();
      if (my !== seq) return;
      if (!user) { state = { signedOut: true, allowed: false }; apply(); return; }
      const r = await api("/api/workbooks/pass", { workbook });
      if (my !== seq) return;
      state = { allowed: !!r.allowed, admin: !!r.admin, who: r.who, reason: r.reason };
    } catch (e) {
      if (my !== seq) return;
      state = { allowed: false, error: "Could not check your subscription" };
    }
    apply();
  }

  function update(o, meta = {}) {
    info = { ...info, ...meta };
  }

  function print() {
    if (state.allowed) {
      root.classList.add("wb-print-ok");
      window.print();
      return;
    }
    openGate();
  }

  /* ── what a person without a subscription is told ───────────────────────*/

  function openGate() {
    document.getElementById("wb-pay")?.remove();
    const box = document.createElement("div");
    box.className = "wb-pay";
    box.id = "wb-pay";
    const signedOut = !!state.signedOut;
    box.innerHTML = `
      <div class="wb-pay__card pp-receipt" role="dialog" aria-modal="true" aria-labelledby="wb-pay-title">
        <div class="pp-receipt__paper">
          <p class="wb-pay__eyebrow">Printing</p>
          <h2 class="wb-pay__title" id="wb-pay-title">${signedOut ? "Sign in to print" : "Printing is part of the subscription"}</h2>
          <dl class="wb-pay__lines">
            <div><dt>Workbook</dt><dd>${esc(label)}</dd></div>
            <div><dt>Sections</dt><dd>${info.sections}</dd></div>
            <div><dt>Pages</dt><dd>${info.pages}</dd></div>
            <div><dt>Code</dt><dd>${esc(info.code)}</dd></div>
          </dl>
          <p class="wb-pay__small">
            ${signedOut
              ? "Printing and saving as a PDF need an account with a subscription."
              : esc(state.reason || "A subscription prints every workbook on the site, as often as you need — this one, the others, and the answer key with them.")}
            Building the paper and working it on screen stay free.
          </p>
          <div class="wb-pay__actions">
            <button type="button" class="pp-btn wb-tint-4" id="wb-pay-cancel">Not now</button>
            <a class="pp-btn" href="${signedOut
              ? `/index.html?login=1&next=${encodeURIComponent(location.pathname)}`
              : "/subscribe.html#plans"}">${signedOut ? "Sign in" : "See plans"}</a>
          </div>
        </div>
      </div>`;
    document.body.appendChild(box);
    const close = () => box.remove();
    box.querySelector("#wb-pay-cancel").addEventListener("click", close);
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    document.addEventListener("keydown", function onKey(e) {
      if (e.key === "Escape") { close(); document.removeEventListener("keydown", onKey); }
    });
    box.querySelector("#wb-pay-cancel").focus();
  }

  /* Signing in or out changes the answer. */
  let seen;
  onUser((u) => {
    const uid = u ? u.uid : null;
    if (uid !== seen) { seen = uid; check(); }
  });

  apply();
  return { update, print, allowed: () => !!state.allowed };
}

/**
 * Close the side doors. Ctrl/Cmd+P goes through the check; Ctrl/Cmd+S (save
 * the page) is refused; a print from the browser's own menu reaches
 * beforeprint and, without a subscription, prints the blank page the
 * stylesheet provides. Over the paper itself: no right-click, no dragging
 * figures out, no copying — except inside anything a learner types into.
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
