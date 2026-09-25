// Writes utils/components/buttons.css — the catch-all that makes every button
// on the site a sticky note. Generated, because the one long selector (what
// counts as a button, minus what is already a note) has to be repeated on
// every rule, and the site does not use CSS nesting (older phone browsers
// drop it). Edit the lists here, then: node scripts/build-buttons-css.mjs
import { writeFileSync } from "node:fs";

const BUTTONS = [
  "button",
  'input[type="button"]',
  'input[type="submit"]',
  'input[type="reset"]',
  '[role="button"]',
  'a[class*="btn"]',
  'a[class*="-cta"]',
];

// Not buttons, or must not be paper. `.pp-plain` is the opt-out.
const SKIP = [".pp-plain", ".pp-select-trigger", ".pp-receipt", "svg *", '[class*="blockly"]'];

// Already notes, each with its own `transform` tilt and tape — a second tilt
// would double it. A new note class that tilts itself belongs here.
const NOTE_ALREADY = `
  .pp-note .pp-sticky .pp-note-btn .pp-btn .btn .btn-primary .btn-yellow .btn-ink
  .btn-blue .option-btn .hero-btn .hero-stat .section-cta .pricing-cta
  .pricing-toggle-btn .footer-social-btn .autogen-all-btn .topic-chip
  .topic-refresh .topic-share .topic-assign .cards-tab .grade-btn
  .sp-billing-btn .sp-kindtab .pt-copy .paper-video-btn .db-action .db-pill
  .db-child-tab .db-calendar-nav-btn .brutal-btn-flat .nav-main-label
  .anim-mode-btn .builder-assign .builder-cta .builder-share .builder-tab
  .cat-tab .custom-chip .drill-again-btn .drill-cancel-btn .drill-start-btn
  .geo-again-btn .geo-cancel-btn .geo-start-btn .grammar-again-btn
  .grammar-cancel-btn .grammar-start-btn .puzzle-again-btn .puzzle-cancel-btn
  .puzzle-start-btn .vocab-again-btn .vocab-cancel-btn .vocab-start-btn
  .pp-again-btn .pp-cancel-btn .pp-start-btn .pp-studio-fs
  .fs-canvas-toggle-btn .fs-dismiss-btn .fs-new-btn .fs-wp-btn
  .wp-modal-solved-btn
`.trim().split(/\s+/);

const CHOSEN = `.active .is-active .is-on .on .selected .is-selected .checked .is-checked
  .current .is-current [aria-pressed="true"] [aria-selected="true"]
  [aria-checked="true"] [aria-current="page"] [class*="--active"] [class*="--selected"] [aria-expanded="true"]`.trim().split(/\s+/);
const RIGHT = `.correct .correct-ans .is-correct .right .is-right .matched .is-matched
  .solved .is-solved .success`.trim().split(/\s+/);
const WRONG = `.wrong .wrong-ans .is-wrong .incorrect .is-incorrect .error .is-error`
  .trim().split(/\s+/);
const DANGER = [".danger", ".is-danger", ".btn-danger", '[class*="--danger"]'];

const wrap = (list, n = 6) => {
  const lines = [];
  for (let i = 0; i < list.length; i += n) lines.push("  " + list.slice(i, i + n).join(", "));
  return lines.join(",\n");
};

// id-level weight: `:not(#pp-plain)` matches everything and counts as an id,
// so the paper beats a page's `.ctrl-btn { background: #333 }`.
const B = `:is(\n${wrap(BUTTONS, 4)}\n):not(\n${wrap([...SKIP, ...NOTE_ALREADY])}\n):not(#pp-plain)`;
const sel = (suffix) => B + suffix;
const is = (list) => `:is(${list.join(", ")})`;

const css = `@import url("https://fonts.googleapis.com/css2?family=Shantell+Sans:wght@500;600;700&display=swap");

/* =========================================================================
   EVERY BUTTON IS A STICKY NOTE        GENERATED — edit
                                        scripts/build-buttons-css.mjs
   -------------------------------------------------------------------------
   The catch-all. sticky-ui.css (which imports this sheet) dresses the named
   button classes one by one; this dresses every OTHER button on the site —
   tool rails, icon buttons, keypads, grid cells, pills, game controls — so
   no button is left that is not paper.

   How it stays out of the way of the page it lands on:
   - The tilt and the hover lift use the separate \`rotate\` / \`translate\`
     properties, never \`transform\`, so a FAB centred with translate(-50%)
     or a GSAP tween keeps working.
   - Borders go transparent rather than away, so no grid changes size.
   - \`position\` and \`transition\` sit at zero specificity (:where): a page
     that places a button absolutely, or fades it, still wins.
   - The paper is written at id-level specificity, so it beats a page's own
     button colours without !important. That also flattens a page's state
     colours, so chosen / right / wrong get their own paper below.

   Left alone: classes that are notes already (their own tilt — a second
   would double it), dropdown triggers, receipt cards, SVG hit areas,
   Blockly's chrome, and \`.pp-plain\`, the opt-out.
   ========================================================================= */

:where(${BUTTONS.join(", ")}):where(:not(${SKIP.join(", ")})) {
  position: relative;
  transition:
    rotate var(--duration-smooth, 0.2s) var(--ease-bounce, ease),
    translate var(--duration-smooth, 0.2s) var(--ease-bounce, ease),
    opacity 0.2s ease;
}

/* A note is paper in every theme, so what's drawn ON it must be too. Icons
   and labels inside buttons reach for --ink / --text-secondary / the
   surfaces, which flip to cream in dark mode and vanish on a pastel. Every
   note re-declares the light values for its own contents. Zero weight: it
   only has to beat inheritance from :root. */
:where(${BUTTONS.join(", ")}, ${NOTE_ALREADY.join(", ")}):where(:not(${SKIP.join(", ")})) {
  --ink: #2a2723;
  --text-primary: #2a2723;
  --text-secondary: #6b655c;
  --text-tertiary: #9a948a;
  --surface-primary: #fffdf8;
  --surface-secondary: #f4f0e8;
  --border-color: #2a2723;
  --border-subtle: 1px solid rgba(42, 39, 35, 0.12);
  --shadow-color: 42, 39, 35;
}

${B} {
  --pp-auto-bg: #fff3a8;
  --pp-auto-tilt: -2deg;
  font-family: "Shantell Sans", "Segoe Print", "Bradley Hand", cursive;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: none;
  text-shadow: none;
  color: #14130f;
  background: var(--pp-note-bg, var(--pp-auto-bg));
  border-color: transparent;
  border-radius: 2px;
  outline: 0;
  box-shadow:
    0 1px 1px rgba(20, 19, 15, 0.1),
    5px 8px 12px -4px rgba(20, 19, 15, 0.3);
  rotate: var(--pp-note-tilt, var(--pp-auto-tilt));
  translate: 0 0;
}

/* Sibling buttons take turns through the papers. No green and no red in the
   turn — those two mean right and wrong. */
${sel(":nth-child(4n + 2)")} { --pp-auto-bg: #bfe3ff; --pp-auto-tilt: 1.5deg; }
${sel(":nth-child(4n + 3)")} { --pp-auto-bg: #e8c8ff; --pp-auto-tilt: 1.2deg; }
${sel(":nth-child(4n + 4)")} { --pp-auto-bg: #ffd7a3; --pp-auto-tilt: -1.4deg; }

/* The strip of tape — scaled down on a small button so it never swamps a
   28px icon. */
${sel("::before")} {
  content: "";
  position: absolute;
  top: calc(min(16px, 40%) * -0.55);
  left: 50%;
  width: min(48px, 62%);
  height: min(16px, 40%);
  translate: -50% 0;
  rotate: -3.5deg;
  transform: none;
  background: rgba(255, 255, 255, 0.45);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.14);
  border: 0;
  border-radius: 0;
  pointer-events: none;
}

${sel(":hover:not(:disabled)")} { translate: 0 -2px; }
${sel(":active:not(:disabled)")} { translate: 0 0; }
${sel(":focus-visible")} {
  outline: 2.5px dashed #14130f;
  outline-offset: 2px;
}

/* Chosen — the same paper with an inked outline, never a colour swap, so
   "the one I picked" can't be mistaken for "the right one". */
${sel(is(CHOSEN))} {
  outline: 2.5px solid #14130f;
  outline-offset: -2.5px;
  translate: 0 -2px;
}

/* Marked — right and wrong DO swap paper, so a verdict reads at once. */
${sel(is(RIGHT))} {
  background: #9fe39a;
  outline: 2.5px solid #2f7a3f;
  outline-offset: -2.5px;
}
${sel(is(WRONG))} {
  background: #ffb0b0;
  outline: 2.5px solid #a33;
  outline-offset: -2.5px;
}

/* Destructive — pink paper, dark red ink. */
${sel(is(DANGER))} {
  background: #ffc9c9;
  color: #7a1f1f;
}

${sel(":disabled")},
${sel(".disabled")},
${sel('[aria-disabled="true"]')} {
  /* Faded paper at full opacity, not a see-through note: at half opacity a
     pastel over the dark theme turns to mud. */
  background: #ebe7dc;
  color: #857f73;
  box-shadow: 0 1px 1px rgba(20, 19, 15, 0.1);
  opacity: 1;
  cursor: not-allowed;
}
`;

writeFileSync(new URL("../utils/components/buttons.css", import.meta.url), css);
console.log("wrote utils/components/buttons.css");
