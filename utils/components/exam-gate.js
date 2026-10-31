/* ============================================================================
   Exam mode is for tablets and laptops, held landscape
   ----------------------------------------------------------------------------
   A paper is a sheet of A4 with a rail of tools and an OMR sheet beside it; on a
   phone it can only be squinted at. So the paper is covered, not just advised:
     · a phone (by the device's own screen, not the window) is told it can't sit
       the paper here;
     · anything held upright (taller than wide) is told to turn landscape.
   The cover goes the moment the screen is right, with no reload.

     import { examGate } from "/utils/components/exam-gate.js";
     const gate = examGate();            // always on
     const gate = examGate({ when });    // on only while when() is true; call gate.check() after it changes
   ========================================================================== */

const PHONE_SHORT_SIDE = 600; // CSS px: the shorter side of every phone's screen, less than any tablet's

export const isPhone = () => {
  const shortSide = Math.min(screen.width || 9999, screen.height || 9999);
  return shortSide < PHONE_SHORT_SIDE || /Android.+Mobile|iPhone|iPod/i.test(navigator.userAgent || "");
};
export const isUpright = () => window.innerHeight > window.innerWidth;

/** "ok", "phone" or "rotate": what this screen may do with a paper. */
export const verdict = () => (isPhone() ? "phone" : isUpright() ? "rotate" : "ok");

const TEXT = {
  phone: ["Exam mode is not on phones", "Open this paper on a tablet or a laptop. It needs the whole sheet, the tools and the answer sheet in view, and a phone screen is too small to sit it fairly."],
  rotate: ["Turn your screen sideways", "The paper is set out for a landscape screen. Turn your tablet or laptop window so it is wider than it is tall, and the paper will come back."],
};

export function examGate({ when = () => true } = {}) {
  let cover = null;

  function ensureStyles() {
    if (document.getElementById("pp-exam-gate-css")) return;
    const s = document.createElement("style");
    s.id = "pp-exam-gate-css";
    s.textContent = `
      .pp-exam-gate { position: fixed; inset: 0; z-index: 2147483000; display: grid; place-items: center; padding: 1.2rem; background: #fbf8f1; color: #2a2723; font-family: "JetBrains Mono", ui-monospace, monospace; text-align: center; }
      .pp-exam-gate__card { max-width: 30rem; padding: 1.6rem 1.4rem; border: 2px solid #2a2723; background: #fffdf7; box-shadow: 5px 5px 0 rgba(42, 39, 35, 0.3); }
      .pp-exam-gate h2 { margin: 0.2rem 0 0.7rem; font: 800 1.15rem/1.25 "Unbounded", sans-serif; }
      .pp-exam-gate p { margin: 0; font-size: 0.86rem; line-height: 1.55; }
      .pp-exam-gate svg { width: 4.2rem; height: 4.2rem; }
      .pp-exam-gate--rotate svg { animation: pp-exam-turn 2.4s ease-in-out infinite; }
      @keyframes pp-exam-turn { 0%, 25% { transform: rotate(0); } 60%, 100% { transform: rotate(-90deg); } }
      @media (prefers-reduced-motion: reduce) { .pp-exam-gate--rotate svg { animation: none; transform: rotate(-90deg); } }
      @media print { .pp-exam-gate { display: none !important; } }`;
    document.head.appendChild(s);
  }

  /* a filled tablet, drawn upright (it turns by itself while the screen is wrong) */
  const ICON = `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="9" y="3" width="30" height="42" fill="#7fb6e8" stroke="#2a2723" stroke-width="2.4"/><rect x="13" y="8" width="22" height="30" fill="#fffdf7" stroke="#2a2723" stroke-width="1.6"/><circle cx="24" cy="41.5" r="1.8" fill="#2a2723"/></svg>`;

  function show(kind) {
    ensureStyles();
    if (!cover) {
      cover = document.createElement("div");
      cover.className = "pp-exam-gate";
      cover.setAttribute("role", "alertdialog");
      cover.setAttribute("aria-modal", "true");
      (document.body || document.documentElement).appendChild(cover);
    }
    cover.className = `pp-exam-gate pp-exam-gate--${kind}`;
    cover.innerHTML = `<div class="pp-exam-gate__card">${ICON}<h2>${TEXT[kind][0]}</h2><p>${TEXT[kind][1]}</p></div>`;
    cover.setAttribute("aria-label", TEXT[kind][0]);
  }

  function check() {
    const kind = when() ? verdict() : "ok";
    if (kind === "ok") { if (cover) { cover.remove(); cover = null; } return "ok"; }
    show(kind);
    return kind;
  }

  window.addEventListener("resize", check);
  window.addEventListener("orientationchange", () => setTimeout(check, 150));
  check();
  return { check };
}
