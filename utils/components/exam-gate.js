/* ============================================================================
   Exam mode is for tablets and laptops, held landscape
   ----------------------------------------------------------------------------
   A paper is a sheet of A4 with a rail of tools and an OMR sheet beside it; on a
   phone it can only be squinted at. So the paper is covered, not just advised:
     · a phone (by the device's own screen, not the window) is told it can't sit
       the paper here;
     · anything held upright (taller than wide) is told to turn landscape.
   The cover goes the moment the screen is right, with no reload.

   The cover is the site's receipt on the paint blob (pp-cover.js), the same as every
   other full-screen message.

     import { examGate } from "/utils/components/exam-gate.js";
     const gate = examGate();            // always on
     const gate = examGate({ when });    // on only while when() is true; call gate.check() after it changes
   ========================================================================== */

import { makeCover } from "/utils/components/pp-cover.js";
import { UI } from "/utils/components/ui-icons.js";

const PHONE_SHORT_SIDE = 600; // CSS px: the shorter side of every phone's screen, less than any tablet's

export const isPhone = () => {
  const shortSide = Math.min(screen.width || 9999, screen.height || 9999);
  return shortSide < PHONE_SHORT_SIDE || /Android.+Mobile|iPhone|iPod/i.test(navigator.userAgent || "");
};
export const isUpright = () => window.innerHeight > window.innerWidth;

/** "ok", "phone" or "rotate": what this screen may do with a paper. */
export const verdict = () => (isPhone() ? "phone" : isUpright() ? "rotate" : "ok");

const TEXT = {
  phone: ["Exam mode is not on phones", "Open this paper on a tablet or a laptop. It needs the whole sheet, the tools and the answer sheet in view, and a phone screen is too small to sit it fairly.", "monitor"],
  rotate: ["Turn your screen sideways", "The paper is set out for a landscape screen. Turn your tablet or laptop window so it is wider than it is tall, and the paper will come back.", "rotateDevice"],
};

const body = (kind) => `<span class="pp-cover__icon" aria-hidden="true">${UI[TEXT[kind][2]](58)}</span>
  <h2 class="pp-cover__title" style="text-align:center">${TEXT[kind][0]}</h2>
  <p class="pp-cover__text" style="text-align:center">${TEXT[kind][1]}</p>`;

/**
 * A closable notice for a link that leads into exam mode, so a phone is told before it leaves the page
 * (the page it opens would only cover itself). Returns true if it stopped the visit: use it as
 *   link.addEventListener("click", (e) => { if (blockPhone()) e.preventDefault(); });
 */
export function blockPhone() {
  if (!isPhone()) return false;
  document.getElementById("pp-exam-notice")?.remove();
  const { root, paper, close } = makeCover({ label: TEXT.phone[0], scrim: true, tag: "Exam mode", colour: 4 });
  root.id = "pp-exam-notice";
  paper.innerHTML = `${body("phone")}<div class="pp-cover__go"><button type="button" class="pp-btn">Understood</button></div>`;
  const done = () => { close(); document.removeEventListener("keydown", onKey); };
  const onKey = (e) => { if (e.key === "Escape") done(); };
  document.addEventListener("keydown", onKey);
  root.addEventListener("pointerdown", (e) => { if (e.target === root) done(); });
  const btn = paper.querySelector("button");
  btn.addEventListener("click", done);
  btn.focus();
  return true;
}

export function examGate({ when = () => true } = {}) {
  let cover = null, shown = "";

  function show(kind) {
    if (cover && shown === kind) return;
    cover?.close();
    cover = makeCover({ label: TEXT[kind][0], tag: "Exam mode", colour: 4 });
    cover.root.classList.add("pp-exam-gate", `pp-exam-gate--${kind}`);
    cover.root.style.zIndex = "2147483000";   // above every other cover: a phone is stopped before anything else is shown
    cover.paper.innerHTML = body(kind);
    shown = kind;
  }

  function check() {
    const kind = when() ? verdict() : "ok";
    if (kind === "ok") { cover?.close(); cover = null; shown = ""; return "ok"; }
    show(kind);
    return kind;
  }

  window.addEventListener("resize", check);
  window.addEventListener("orientationchange", () => setTimeout(check, 150));
  check();
  return { check };
}
