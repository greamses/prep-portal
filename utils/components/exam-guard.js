/* ============================================================================
   Leaving the exam page is not allowed
   ----------------------------------------------------------------------------
   Once an exam has started and until the paper is checked, the student stays on the page. A web page cannot
   truly stop someone opening another tab, so this does what a page can:

     · closing or reloading the page asks the browser to confirm first (the browser words that question);
     · the back button does nothing: it is turned back, with a warning;
     · going to another tab or window is noticed (exam-watch.js), noted for the teacher, and on the student's
       return they are told out loud (exam-voice.js) and shown the warning below, which counts: a first, a
       second and a final warning.

   All of it applies only while `active()` is true: not to the teacher, and not once the paper is checked.
   ========================================================================== */

import { makeCover } from "/utils/components/pp-cover.js";

/**
 * @param active     () → true while the exam is being sat
 * @param onAttempt  (why) → called when closing ("unload") or going back ("back") was tried
 * → { stop }
 */
export function startGuard({ active, onAttempt = () => {} }) {
  const beforeUnload = (e) => {
    if (!active()) return;
    e.preventDefault();
    e.returnValue = "";          // the browser shows its own "leave this page?" question
    onAttempt("unload");
  };
  addEventListener("beforeunload", beforeUnload);

  /* one entry of history is put in front of the page, so Back lands on the same page again */
  try { history.pushState({ examGuard: 1 }, "", location.href); } catch { /* an unusual page: the other guards still hold */ }
  const popState = () => {
    if (!active()) return;
    try { history.pushState({ examGuard: 1 }, "", location.href); } catch { /* as above */ }
    onAttempt("back");
  };
  addEventListener("popstate", popState);

  return { stop() { removeEventListener("beforeunload", beforeUnload); removeEventListener("popstate", popState); } };
}

const TAGS = { 1: "Warning", 2: "Second warning", 3: "Final warning" };
let open = null;

/**
 * The warning, as the site's receipt over the exam. It stays until the student presses the key, so it cannot be missed.
 *   count   which warning this is (1, 2, 3+); omit for a plain notice
 *   away    seconds the page was left for
 *   title/text   to say something else (the back button)
 */
export function showLeaveWarning({ count = 0, away = 0, title = "", text = "" } = {}) {
  open?.close();
  const n = Math.min(3, count || 0);
  const { root, paper, close } = makeCover({ label: title || "You left the exam page", scrim: true, tag: n ? TAGS[n] : "Warning", colour: 4 });
  root.style.zIndex = "2147483100";      // over every other cover, the instructions page included
  const lines = text
    ? [text]
    : [
      "Leaving the exam page is not allowed once the exam has started.",
      away ? `You were away for ${away} second${away === 1 ? "" : "s"}.` : "",
      n >= 3 ? "This is your final warning. Your teacher will be told." : "This has been recorded, and your teacher will be told.",
    ].filter(Boolean);
  paper.innerHTML = `<h2 class="pp-cover__title">${title || "You left the exam page"}</h2>
    ${lines.map((l) => `<p class="pp-cover__text">${l.replace(/[<>&]/g, "")}</p>`).join("")}
    <div class="pp-cover__go"><button type="button" class="pp-btn">Back to my exam</button></div>`;
  const btn = paper.querySelector("button");
  btn.focus({ preventScroll: true });
  const done = () => { close(); if (open && open.root === root) open = null; };
  btn.addEventListener("click", done);
  open = { root, close: done };
  return open;
}
