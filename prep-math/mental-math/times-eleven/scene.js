/* ═══════════════════════════════════════════════════════════
   × 11 TRICK — animated scene
   ───────────────────────────────────────────────────────────
   Works for any 2- to 4-digit number. The trick generalizes to: write
   each digit down, add every adjacent pair, and carry left whenever a
   sum doesn't fit in one digit — carries can cascade across several
   positions (e.g. 999 × 11 = 10989, where the carry ripples all the way
   into a brand-new leading digit).

   One GSAP timeline (via the shared Scrubber) drives sticky-note digit
   tiles on the TV screen in lockstep with a MathJax steps panel. Steps:
   split → sum → resolve (the full carry cascade, however long it is) →
   answer — always exactly 4 scrubbable steps regardless of digit count.
═══════════════════════════════════════════════════════════ */

import { Scrubber } from "../shared/scrub-engine.js";
import { ICON_PLAY, ICON_PAUSE, ICON_FULLSCREEN } from "../shared/icons.js";
import { PrepbotTeacher } from "../shared/prepbot-teacher.js";
import { heroPaint } from "/utils/components/nav-icons.js";
import { auth } from "/firebase-init.js";

const stage = document.getElementById("mmStage");
const stepsPanel = document.getElementById("mmSteps");
const progressEl = document.getElementById("mmProgress");
const playBtn = document.getElementById("mmPlayBtn");
const playIcon = document.getElementById("mmPlayIcon");
const prevBtn = document.getElementById("mmPrevBtn");
const nextBtn = document.getElementById("mmNextBtn");
const examplesWrap = document.getElementById("mmExamples");
const titleEl = document.getElementById("mmTitle");
const subEl = document.getElementById("mmSub");

// ── The 4 strict variants of this trick ─────────────────────────────
// The Mental Math hub shows one card per variant (2-digit vs 3-plus-digit,
// each split by whether a regroup/carry happens), linking here with
// ?case=<key>. This page is locked to whichever variant it was opened
// with — the pills rendered below are just alternate example numbers
// that all strictly belong to that SAME case, not a switcher to the
// other 3. practice.js separately reads ?case= so its endless-practice
// problems stay aligned with it. No ?case (e.g. an old bookmark) falls
// back to the first variant.
const CASE_INFO = {
  "2-no-regroup": {
    examples: [11, 23, 34, 45],
    title: "× 11 Trick — 2-digit, no regrouping",
    sub: "Split a 2-digit number into its digits and add them — the sum drops straight into the middle, no carrying yet.",
  },
  "2-regroup": {
    examples: [29, 48, 57, 84],
    title: "× 11 Trick — 2-digit, with regrouping",
    sub: "Same split-and-add idea, but the digits add past 9 — carry the extra 1 into the tens place.",
  },
  "3plus-no-regroup": {
    examples: [122, 213, 1022, 2103],
    title: "× 11 Trick — 3+ digit, no regrouping",
    sub: "The same trick scales to any length: add every adjacent pair of digits, still no carrying.",
  },
  "3plus-regroup": {
    examples: [786, 999, 4999, 9999],
    title: "× 11 Trick — 3+ digit, with regrouping",
    sub: "The full challenge — carries can cascade all the way down the line, even creating a new leading digit.",
  },
};
const DEFAULT_CASE = "2-no-regroup";
const caseParam = new URLSearchParams(location.search).get("case");
const activeCase = CASE_INFO[caseParam] ? caseParam : DEFAULT_CASE;

function applyCase() {
  const info = CASE_INFO[activeCase];
  document.title = `${info.title} — Mental Math — PrepPortal`;
  if (titleEl) titleEl.textContent = info.title;
  if (subEl) subEl.textContent = info.sub;
}

function setActiveExample(n) {
  examplesWrap.querySelectorAll(".mm-example-pill").forEach((p) => {
    p.classList.toggle("active", Number(p.dataset.n) === n);
  });
}

function renderExamples() {
  const { examples } = CASE_INFO[activeCase];
  examplesWrap.innerHTML = examples
    .map((n, i) => `<button class="pp-pill mm-example-pill${i === 0 ? " active" : ""}" data-n="${n}" type="button">${n}</button>`)
    .join("");
  examplesWrap.querySelectorAll(".mm-example-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      const n = Number(pill.dataset.n);
      setActiveExample(n);
      loadScene(n);
    });
  });
}
// The narrating mascot — the shared teacher owns the character (voice,
// mouth-sync, idle impulses, menu); this scene owns WHAT it says and when.
// The intro/fullscreen animations below still tween the bot's own elements
// directly, so keep local aliases to them.
const teacher = new PrepbotTeacher({
  root: document.querySelector(".mm-prepbot"),
  boundsEl: document.querySelector(".mm-tv-screen"),
  auth,
  menu: {
    ask: document.getElementById("mmBotAsk"),
    voice: document.getElementById("mmBotVoice"),
    sleep: document.getElementById("mmBotSleep"),
    poke: document.getElementById("mmBotPoke"),
  },
});
const botGroup = teacher.root;
const botBubble = teacher.bubble;
const botText = teacher.text;
const botAvatar = teacher.avatar;
const curtainEl = document.getElementById("mmCurtain");
const curtainLeft = document.querySelector(".mm-tv-curtain-panel--left");
const curtainRight = document.querySelector(".mm-tv-curtain-panel--right");
const introEl = document.getElementById("mmIntro");
const introWord = document.getElementById("mmIntroWord");
const introSmall = document.querySelector(".mm-tv-intro-small");
const fullscreenBtn = document.getElementById("mmFullscreenBtn");
const fullscreenIcon = document.getElementById("mmFullscreenIcon");
fullscreenIcon.innerHTML = ICON_FULLSCREEN;

// Soft multicolour "paint blob" wash behind the tiles — the same heroPaint()
// used for full-page backgrounds site-wide, dropped in as the screen's
// backdrop (kept faint in CSS so digits stay legible over it). Injected as
// the first child of the screen so it sits behind everything else.
const tvScreen = document.querySelector(".mm-tv-screen");
if (tvScreen) {
  const blob = document.createElement("div");
  blob.className = "mm-tv-blob";
  blob.setAttribute("aria-hidden", "true");
  blob.innerHTML = heroPaint();
  tvScreen.prepend(blob);
}

// White theatre curtains, decorated with a faint wash of our multicolour
// paint blob (the same heroPaint() used on the screen) instead of a doodle
// print — CSS gives the panels their white fabric folds; this just lays the
// soft blob over them, kept subtle by CSS opacity.
document.querySelectorAll(".mm-tv-curtain-panel").forEach((p) => {
  const wrap = document.createElement("div");
  wrap.className = "mm-curtain-blob";
  wrap.setAttribute("aria-hidden", "true");
  wrap.innerHTML = heroPaint();
  p.appendChild(wrap);
});

// "Learning" spelled out as individual sticky-note letters, rotating
// through the same pastel palette as the digit tiles.
"Learning".split("").forEach((ch, i) => {
  const el = document.createElement("span");
  el.className = `mm-intro-letter pp-sticky pp-sticky--c${i % 6}`;
  el.textContent = ch;
  introWord.appendChild(el);
});
const introLetters = introWord.querySelectorAll(".mm-intro-letter");

// Sticky-note colour rotation (pp-sticky--c0..c5, see components.css) — one
// colour per original digit (alternating), a shared colour for every
// computed gap/leading tile, and yellow for the final answer.
const ORIG_COLORS = ["pp-sticky--c3", "pp-sticky--c4"];
const GAP_COLOR = "pp-sticky--c2";
const ANSWER_COLOR = "pp-sticky--c0";

let gsap;
let scrubber = null;
let currentNarration = [];
let lastNarratedIndex = -1;
let autoPlaying = false;
let needsIntro = true;
// PrepBot stays completely silent (no bubble, no mouth, no beeps) until the
// curtain is actually pulled open — nothing should "talk" behind the closed
// curtain on page load. Flipped true once playIntro() has run.
let sceneRevealed = false;
// Play is dead until the learner has stepped through the whole thing once
// with Next/Prev — it only unlocks (for replay/autoplay) after that first
// full manual pass. Reset per scene.
let firstPassDone = false;
// Which MathJax panel line to highlight at each scrubber step. Many animation
// micro-steps share one panel line (the ghost-in / plus / etc. steps carry no
// equation of their own), so this maps step index → panel line index.
let hlNodeIndex = [0];
// Ghosts are deliberately see-through copies (the neighbour digits being
// added), so they read as helpers, not real tiles.
const GHOST_OPACITY = 0.5;

function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

function syncPlayIcon() {
  playIcon.innerHTML = autoPlaying ? ICON_PAUSE : ICON_PLAY;
}

// Title-card reveal, played once per newly chosen number the first time
// Play is pressed. Nothing else is visible until this runs: the curtain
// is the only thing on screen (see loadScene). PrepBot steps to centre,
// pulls the curtain open, the "Learning / with PrepBot" card appears,
// then it all slides away to reveal the tiles.
function playIntro() {
  return new Promise((resolve) => {
    const screen = document.querySelector(".mm-tv-screen");
    const centerX = -(screen.clientWidth / 2 - 8 - botGroup.offsetWidth / 2);

    gsap.set(stage, { opacity: 0 });
    gsap.set(progressEl, { opacity: 0 });
    gsap.set(botBubble, { opacity: 0 });
    gsap.set(curtainEl, { opacity: 1 });
    gsap.set([curtainLeft, curtainRight], { x: 0 });
    gsap.set(introLetters, { opacity: 0, y: 14, scale: 0.6 });
    gsap.set(introSmall, { opacity: 0, y: 14 });
    gsap.set(introEl, { opacity: 0 });
    introEl.style.pointerEvents = "auto";
    gsap.set(botGroup, { x: centerX });

    gsap
      .timeline({ onComplete: resolve })
      .to(botAvatar, { scaleX: 1.15, scaleY: 0.9, duration: 0.15 }) // a little "grab" anticipation
      .to(curtainLeft, { x: "-100%", duration: 0.8, ease: "power2.inOut" })
      .to(curtainRight, { x: "100%", duration: 0.8, ease: "power2.inOut" }, "<")
      .to(botAvatar, { scaleX: 1, scaleY: 1, duration: 0.2 }, "<")
      .to(introEl, { opacity: 1, duration: 0.2 }, "<0.2")
      .to(introLetters, { opacity: 1, y: 0, scale: 1, duration: 0.35, stagger: 0.06 }, "<")
      .to(introSmall, { opacity: 1, y: 0, duration: 0.3 }, "-=0.1")
      .to({}, { duration: 1 })
      .to([introLetters, introSmall], { opacity: 0, duration: 0.3 })
      .to(introEl, { opacity: 0, duration: 0.3 }, "<")
      .to(curtainEl, { opacity: 0, duration: 0.3 }, "<")
      .to(botGroup, { x: 0, duration: 0.6, ease: "power2.inOut" }, "<")
      .to(stage, { opacity: 1, duration: 0.3 }, "<")
      .to(progressEl, { opacity: 1, duration: 0.3 }, "<")
      .to(botBubble, { opacity: 1, duration: 0.3 }, "<")
      .call(() => { introEl.style.pointerEvents = "none"; });
  });
}

// Auto-advance that waits for PrepBot to actually finish narrating each
// step before moving to the next one — Pause just stops it from starting
// the *next* step; it always lets the current line finish first.
async function guidedPlay() {
  autoPlaying = true;
  syncPlayIcon();

  if (needsIntro) {
    await playIntro();
    needsIntro = false;
    if (!autoPlaying) return;
  }
  sceneRevealed = true;

  if (scrubber.index >= scrubber.total) scrubber.seek(0);

  // Opening greeting (narration[0]) once the curtain is open and we're at
  // the resting state — the stepping loop below narrates each step itself.
  if (scrubber.index === 0) {
    narrate(0);
    await teacher.narrationDone;
    if (!autoPlaying) { autoPlaying = false; syncPlayIcon(); return; }
  }

  while (autoPlaying && scrubber && scrubber.index < scrubber.total) {
    await scrubber.next();
    if (!autoPlaying) break;
    // Wait for ALL of this step's speech bubbles to finish, not just one.
    await teacher.narrationDone;
    if (!autoPlaying) break;
    // A generous hold before the next step — kids need a moment to
    // actually look at what just happened, not have it bulldozed by the
    // next line starting immediately.
    await delay(900);
  }
  autoPlaying = false;
  syncPlayIcon();
}

function stopGuidedPlay() {
  autoPlaying = false;
  syncPlayIcon();
}

// ── Arithmetic: split into digits, add adjacent pairs, cascade carries ──
function makeScene(n) {
  const digits = String(n).split("").map(Number);
  const k = digits.length;
  const raw = [digits[0]];
  for (let i = 0; i < k - 1; i++) raw.push(digits[i] + digits[i + 1]);
  raw.push(digits[k - 1]);

  const resolved = raw.slice();
  let carry = 0;
  for (let i = raw.length - 2; i >= 0; i--) {
    const v = raw[i] + carry;
    carry = v >= 10 ? 1 : 0;
    resolved[i] = v % 10;
  }
  const leadingDigit = carry;
  const finalDigits = leadingDigit ? [1, ...resolved] : resolved.slice();
  const answer = Number(finalDigits.join(""));
  const hasCarry = leadingDigit === 1 || raw.some((v, i) => i > 0 && i < k && v >= 10);

  return { n, digits, k, raw, resolved, leadingDigit, finalDigits, answer, hasCarry };
}

// ── Layout: k+1 evenly spaced "slot" positions (slot 0 = leftmost digit,
// slots 1..k-1 = adjacent-pair sums, slot k = rightmost digit, unchanged),
// plus one further slot to the left of slot 0 for a possible new leading
// digit. Tiles shrink a little as digit count grows so 4-digit numbers
// still fit.
//
// Positions are anchored from the screen's left edge (PADX), not centered on
// it — the screen scrolls (overflow-x: auto) when a scene is wider than the
// visible area, and a browser can only ever reveal content to the RIGHT of
// a container's origin. Centering with negative offsets would put the
// leading-digit slot at an unreachable negative scroll position the moment
// a 4-digit cascade needed more width than the screen.
// Tile geometry is computed PER SCENE from the real screen width so a bigger
// number just uses smaller cards instead of overflowing (or squeezing the
// whole TV). A scene needs k+2 positions: one possible new leading digit,
// then slots 0..k. Solving the total-width budget below for the tile edge
// `t` (with gap = 1.2t and left pad = 0.7t) keeps everything inside the
// screen without a horizontal scrollbar, capped so small numbers still look
// chunky. Recomputed in loadScene(); the helpers just read the result.
let TILE = 56;
let GAP = TILE * 1.45;
let PADX = TILE * 0.7;

function computeLayout(k) {
  const availW = Math.max(240, tvScreen?.clientWidth || 400);
  // availW ≈ PADX + (k+1)·GAP + TILE/2 (half the rightmost tile) + right margin
  //       = t·(0.7 + 1.45·(k+1) + 0.5 + 0.6)
  // The 1.45 gap (was 1.2) leaves room to lay a faint "left + right" pair
  // inside each gap without crowding the real endpoint digits.
  const denom = 0.7 + 1.45 * (k + 1) + 1.1;
  TILE = Math.max(24, Math.min(56, Math.floor(availW / denom)));
  GAP = TILE * 1.45;
  PADX = TILE * 0.7;
}

function slotX(k, i) { return PADX + (i + 1) * GAP; } // i: 0..k
function leadingX() { return PADX; } // one gap further left than slot 0
function origX(k, i) {
  const centerX = (slotX(k, 0) + slotX(k, k)) / 2;
  const clusterWidth = k * TILE;
  return centerX - clusterWidth / 2 + i * TILE + TILE / 2;
}
// Where original digit j sits once the number is "split" apart: evenly spread
// from slot 0 to slot k, so an interior digit lands between the two gaps it
// feeds and its ghosts have a short, sensible distance to travel into either.
function digX(k, j) {
  if (k <= 1) return slotX(k, 0);
  return slotX(k, 0) + (slotX(k, k) - slotX(k, 0)) * (j / (k - 1));
}

// Build the full, granular step plan for a scene: one step per single idea,
// each with its own animation (build), an optional MathJax panel line (tex),
// and SEVERAL kid-friendly speech bubbles. No AI — scripted commentary; the
// "?" badge is the only thing that reaches the real chat.
//
// Per adjacent pair we deliberately break the "add" into four separate,
// individually-animated steps — right ghost in, left ghost in, plus sign,
// then combine — instead of one blended motion, so a child sees each idea
// happen on its own. Carrying is one step per hop. This repeats for every
// pair in a multi-digit number.
function makeStepPlan(s, els) {
  const { originals, gaps, ghosts, plusEls, leading, chip, answer } = els;
  const k = s.k;
  const gx = (i) => slotX(k, i);
  const GH = TILE * 0.62;
  const lift = Math.round(TILE * 0.8);
  const slotDigit = (i) => (i === 0 ? originals[0] : i === k ? originals[k - 1] : gaps[i]);
  const steps = [];

  steps.push({
    id: "split",
    tex: `\\text{Split } ${s.n} \\text{ into } ${s.digits.join(",\\ ")}`,
    bubbles: [
      { text: `To times ${s.n} by eleven, spread its digits apart.`, mode: "speech" },
      { text: "That leaves a gap between each pair to fill in.", mode: "speech" },
    ],
    build: (tl, node) => {
      tl.to(originals[0].el, { x: digX(k, 0), duration: 0.55, ease: "power2.inOut" });
      for (let j = 1; j <= k - 1; j++)
        tl.to(originals[j].el, { x: digX(k, j), duration: 0.55, ease: "power2.inOut" }, "<");
      if (node) tl.to(node, { opacity: 1, y: 0, duration: 0.35 }, "<");
    },
  });

  for (let i = 1; i <= k - 1; i++) {
    const g = ghosts[i];
    const L = s.digits[i - 1], R = s.digits[i], SUM = s.raw[i];

    steps.push({
      id: `ghostR${i}`,
      tex: null,
      bubbles: [
        { text: `Bring a faint copy of the right digit, ${R}, into the gap.`, mode: "thinking" },
        { text: "It's see-through because it's only a helper.", mode: "thinking" },
      ],
      build: (tl) => {
        tl.set(g.right.el, { x: gx(i) + TILE * 1.5, y: 0, opacity: 0 });
        tl.to(g.right.el, { x: gx(i) + GH, opacity: GHOST_OPACITY, duration: 0.5, ease: "power2.out" });
      },
    });

    steps.push({
      id: `ghostL${i}`,
      tex: null,
      bubbles: [
        { text: `Now a faint copy of the left digit, ${L}.`, mode: "thinking" },
        { text: "The two neighbours sit side by side.", mode: "thinking" },
      ],
      build: (tl) => {
        tl.set(g.left.el, { x: gx(i) - TILE * 1.5, y: 0, opacity: 0 });
        tl.to(g.left.el, { x: gx(i) - GH, opacity: GHOST_OPACITY, duration: 0.5, ease: "power2.out" });
      },
    });

    steps.push({
      id: `plus${i}`,
      tex: null,
      bubbles: [
        { text: "Pop a plus sign in between them.", mode: "speech" },
        { text: "We're going to add this pair together.", mode: "speech" },
      ],
      build: (tl) => {
        tl.set(plusEls[i], { x: gx(i), opacity: 0, scale: 0.4 });
        tl.to(plusEls[i], { opacity: 1, scale: 1, duration: 0.32, ease: "back.out(2)" });
      },
    });

    steps.push({
      id: `combine${i}`,
      tex: `${L} + ${R} = ${SUM}`,
      bubbles: [
        { text: `Add them up: ${L} plus ${R}.`, mode: "thinking" },
        { text: `That makes ${SUM}, and it drops into the gap.`, mode: "thinking" },
      ],
      build: (tl, node) => {
        tl.to(g.left.el, { x: gx(i), duration: 0.45, ease: "power1.in" });
        tl.to(g.right.el, { x: gx(i), duration: 0.45, ease: "power1.in" }, "<");
        tl.to(plusEls[i], { opacity: 0, duration: 0.25 }, "<");
        tl.to([g.left.el, g.right.el], { opacity: 0, duration: 0.25 }, "-=0.2");
        tl.call(() => { gaps[i].digit.textContent = SUM; });
        tl.to(gaps[i].el, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.6)" }, "<");
        if (node) tl.to(node, { opacity: 1, y: 0, duration: 0.35 }, "<");
      },
    });
  }

  if (s.hasCarry) {
    let carryIn = 0;
    const hops = [];
    for (let i = k - 1; i >= 0; i--) {
      const val = s.raw[i] + carryIn;
      const carryOut = val >= 10 ? 1 : 0;
      if (carryOut) hops.push({ i, val, digit: val % 10, destVal: i > 0 ? s.raw[i - 1] + 1 : 1 });
      carryIn = carryOut;
    }
    hops.forEach((h) => {
      steps.push({
        id: `carry${h.i}`,
        tex: `${h.val} \\to ${h.digit}\\text{, carry }1`,
        bubbles: [
          { text: `${h.val} is too big for one box.`, mode: "thinking" },
          { text: `Keep the ${h.digit}, and carry the one to the left.`, mode: "thinking" },
        ],
        build: (tl, node) => {
          const fromX = gx(h.i);
          const toX = h.i === 0 ? leadingX() : gx(h.i - 1);
          tl.set(chip, { x: fromX, y: 0, opacity: 0 });
          tl.to(chip, { opacity: 1, duration: 0.15 });
          tl.to(chip, { x: toX, y: -lift, duration: 0.5, ease: "power2.inOut" });
          tl.to({}, { duration: 0.3 });
          tl.call(() => { slotDigit(h.i).digit.textContent = h.digit; });
          if (h.i === 0) {
            tl.call(() => { leading.digit.textContent = "1"; }, [], "<");
            tl.to(leading.el, { opacity: 1, duration: 0.3 }, "<");
          } else {
            tl.call(() => { slotDigit(h.i - 1).digit.textContent = h.destVal; }, [], "<");
            tl.to(slotDigit(h.i - 1).el, { scale: 1.2, duration: 0.12 }, "<");
            tl.to(slotDigit(h.i - 1).el, { scale: 1, duration: 0.16 });
          }
          tl.to(chip, { opacity: 0, duration: 0.2 }, "<");
          if (node) tl.to(node, { opacity: 1, y: 0, duration: 0.35 }, "<");
        },
      });
    });
  } else {
    steps.push({
      id: "nocarry",
      tex: `\\text{Every sum fits — no carrying}`,
      bubbles: [
        { text: "Every sum fits in a single box.", mode: "speech" },
        { text: "So there's nothing to carry this time!", mode: "speech" },
      ],
      build: (tl, node) => {
        if (node) tl.to(node, { opacity: 1, y: 0, duration: 0.35 });
        else tl.to({}, { duration: 0.3 });
      },
    });
  }

  steps.push({
    id: "reveal",
    tex: `\\text{Read the answer off the boxes}`,
    bubbles: [
      { text: "Clear away the faint helper ghosts...", mode: "speech" },
      { text: "and read the answer straight off the boxes!", mode: "speech" },
    ],
    build: (tl, node) => {
      const junk = [];
      for (let i = 1; i <= k - 1; i++) junk.push(ghosts[i].left.el, ghosts[i].right.el, plusEls[i]);
      for (let j = 1; j <= k - 2; j++) junk.push(originals[j].el); // consumed middle digits
      tl.to(junk, { opacity: 0, duration: 0.3 });
      const tiles = [originals[0].el, originals[k - 1].el];
      for (let i = 1; i <= k - 1; i++) tiles.push(gaps[i].el);
      if (s.leadingDigit) tiles.push(leading.el);
      tl.to(tiles, { scale: 1.12, duration: 0.16, stagger: 0.05 }, "<");
      tl.to(tiles, { scale: 1, duration: 0.22, stagger: 0.05 });
      if (node) tl.to(node, { opacity: 1, y: 0, duration: 0.35 }, "<");
    },
  });

  steps.push({
    id: "answer",
    tex: `${s.n} \\times 11 = ${s.answer}`,
    bubbles: [
      { text: `So ${s.n} times eleven is ${s.answer}.`, mode: "speech" },
      { text: "You did it!", mode: "speech" },
    ],
    build: (tl, node) => {
      const answerX = (slotX(k, 0) + slotX(k, k)) / 2;
      const fading = [originals[0].el, originals[k - 1].el, leading.el];
      for (let i = 1; i <= k - 1; i++) fading.push(gaps[i].el);
      tl.to(fading, { opacity: 0, duration: 0.3 });
      const targetScroll = Math.max(0, answerX - stage.clientWidth / 2);
      tl.to(stage, { scrollLeft: targetScroll, duration: 0.5, ease: "power2.inOut" }, "<");
      tl.to(answer.el, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.6)" }, "<+0.1");
      if (node) tl.to(node, { opacity: 1, y: 0, duration: 0.4 }, "<");
    },
  });

  return {
    steps,
    titleTex: `${s.n} \\times 11 = \\,?`,
    greetingBubbles: [
      { text: `Let's multiply ${s.n} by eleven!`, mode: "speech" },
      { text: "Tap the next arrow and follow along with me.", mode: "speech" },
    ],
  };
}

function renderSteps(texts) {
  stepsPanel.innerHTML = "";
  const nodes = texts.map((tex) => {
    const d = document.createElement("div");
    d.className = "mm-step";
    d.innerHTML = `\\(${tex}\\)`;
    stepsPanel.appendChild(d);
    return d;
  });
  const done = (window.MathJax && MathJax.typesetPromise) ? MathJax.typesetPromise([stepsPanel]) : Promise.resolve();
  return done.then(() => nodes);
}

function updateControls(index) {
  const total = scrubber.total;
  progressEl.textContent = index === 0 ? "Ready" : index === total ? "Done" : `Step ${index} of ${total}`;
  prevBtn.disabled = index === 0;
  nextBtn.disabled = index === total;

  // Play stays locked until the learner completes one full manual pass.
  if (total > 0 && index >= total) firstPassDone = true;
  playBtn.disabled = !firstPassDone;
  syncPlayIcon();

  // Many micro-steps share one panel line — highlight the mapped line and
  // keep it in view as the list scrolls.
  const hl = hlNodeIndex[index] ?? 0;
  stepsPanel.querySelectorAll(".mm-step").forEach((el, i) => el.classList.toggle("is-current", i === hl));
  stepsPanel.querySelector(".mm-step.is-current")?.scrollIntoView({ block: "nearest", behavior: "smooth" });

  // Never narrate behind the closed curtain — only once the scene is revealed.
  if (sceneRevealed && currentNarration[index] && index !== lastNarratedIndex) {
    narrate(index);
  }
}

// A step's narration is an ARRAY of bubbles, spoken one after another so a
// child gets a fuller explanation. Split out from updateControls so guided
// play can also fire the opening greeting (index 0) after the curtain opens,
// and so guided play can await the sequence via `teacher.narrationDone`.
// colorSeed pins the bubble-colour cycle to the step index (as before).
function narrate(index) {
  const lines = currentNarration[index];
  if (!lines || !lines.length) return;
  lastNarratedIndex = index;
  teacher.speak(lines, { colorSeed: index });
}

// ── Build the sticky-note tiles for one scene, fresh each time ──────────
// The tile edge (--tw) is set inline from the per-scene computed TILE so
// bigger numbers get proportionally smaller cards (see computeLayout).
function makeTile(colorClass, extraClass) {
  const el = document.createElement("div");
  el.className = `mm-tile pp-sticky ${colorClass} ${extraClass || ""}`.trim();
  el.style.setProperty("--tw", `${TILE}px`);
  const digit = document.createElement("span");
  digit.className = "mm-tile-digit";
  el.appendChild(digit);
  stage.appendChild(el);
  return { el, digit };
}

function buildStageDOM(s) {
  stage.innerHTML = "";

  const originals = s.digits.map((_, i) => makeTile(ORIG_COLORS[i % 2]));
  const gaps = {};
  const ghosts = {};
  const plusEls = {};
  for (let i = 1; i <= s.k - 1; i++) {
    gaps[i] = makeTile(GAP_COLOR, "mm-tile--gap");
    ghosts[i] = {
      left: makeTile(ORIG_COLORS[(i - 1) % 2], "mm-tile--ghost"),
      right: makeTile(ORIG_COLORS[i % 2], "mm-tile--ghost"),
    };
    const plus = document.createElement("div");
    plus.className = "mm-plus-sign";
    plus.textContent = "+";
    stage.appendChild(plus);
    plusEls[i] = plus;
  }

  const leading = makeTile(GAP_COLOR, "mm-tile--leading");

  const chip = document.createElement("div");
  chip.className = "mm-carry-badge";
  chip.textContent = "+1";
  stage.appendChild(chip);

  const answer = makeTile(ANSWER_COLOR, "mm-answer-pill pp-sticky--tape");
  // A wide answer (a 4-digit number × 11 is up to 6 digits) would blow the
  // pill out of a small-card scene — shrink the answer text for big k.
  answer.digit.style.fontSize = s.k >= 4 ? "1.15rem" : s.k === 3 ? "1.4rem" : "1.6rem";

  return { originals, gaps, ghosts, plusEls, leading, chip, answer };
}

async function loadScene(n) {
  const s = makeScene(n);
  if (scrubber) scrubber.destroy();
  teacher.stop();
  stopGuidedPlay();
  needsIntro = true;
  sceneRevealed = false;
  firstPassDone = false;
  botText.textContent = "";
  lastNarratedIndex = -1;

  computeLayout(s.k); // size the cards to fit this many digits on the screen
  const els = buildStageDOM(s);
  const { originals, gaps, ghosts, plusEls, leading, chip, answer } = els;
  stage.scrollLeft = 0;

  // Nothing is visible until PrepBot opens the curtain in playIntro() —
  // needsIntro is always true at this point in loadScene, so this is the
  // resting state for every freshly chosen number.
  gsap.set(stage, { opacity: 0 });
  gsap.set(progressEl, { opacity: 0 });
  gsap.set(botBubble, { opacity: 0 });
  gsap.set(curtainEl, { opacity: 1 });
  gsap.set([curtainLeft, curtainRight], { x: 0 });

  // Resting state: the digits sit clustered together (the number as written),
  // and everything computed (gaps, ghosts, plus signs, carry chip, leading
  // digit, answer) is hidden until its own step brings it in.
  originals.forEach((t, i) => {
    t.digit.textContent = s.digits[i];
    gsap.set(t.el, { x: origX(s.k, i), y: 0, scale: 1, rotation: i % 2 === 0 ? -3 : 3, opacity: 1 });
  });
  for (let i = 1; i <= s.k - 1; i++) {
    gaps[i].digit.textContent = "";
    gsap.set(gaps[i].el, { x: slotX(s.k, i), y: 0, scale: 0.6, opacity: 0, rotation: 2 });
    ghosts[i].left.digit.textContent = s.digits[i - 1];
    ghosts[i].right.digit.textContent = s.digits[i];
    gsap.set(ghosts[i].left.el, { x: digX(s.k, i - 1), y: 0, opacity: 0, rotation: 0, scale: 1 });
    gsap.set(ghosts[i].right.el, { x: digX(s.k, i), y: 0, opacity: 0, rotation: 0, scale: 1 });
    gsap.set(plusEls[i], { x: slotX(s.k, i), y: 0, opacity: 0 });
  }
  leading.digit.textContent = "1";
  gsap.set(leading.el, { x: leadingX(), y: 0, scale: 0.6, opacity: 0, rotation: -2 });
  gsap.set(chip, { x: 0, y: 0, opacity: 0 });
  answer.digit.textContent = s.answer;
  const answerX = (slotX(s.k, 0) + slotX(s.k, s.k)) / 2;
  gsap.set(answer.el, { xPercent: -50, yPercent: -50, x: answerX, y: 0, opacity: 0, scale: 0.8 });

  // Build the granular step plan (animation + panel line + multi-bubble
  // narration) and wire it up.
  const plan = makeStepPlan(s, els);
  const texts = [plan.titleTex, ...plan.steps.filter((p) => p.tex).map((p) => p.tex)];
  const nodes = await renderSteps(texts);
  gsap.set(nodes[0], { opacity: 1, y: 0 });
  gsap.set(nodes.slice(1), { opacity: 0, y: 10 });

  // Map each step to its panel line (steps without a `tex` reveal nothing),
  // and record which line to highlight at every step index — carried forward
  // across the text-less micro-steps (ghost-in, plus, etc.).
  let ni = 1;
  let lastHl = 0;
  hlNodeIndex = [0];
  const steps = plan.steps.map((p) => {
    let node = null;
    if (p.tex) { node = nodes[ni]; lastHl = ni; ni++; }
    hlNodeIndex.push(lastHl);
    return { id: p.id, build: (tl) => p.build(tl, node) };
  });

  // Narration index 0 is the resting-state greeting; index j is plan step j-1.
  currentNarration = [plan.greetingBubbles, ...plan.steps.map((p) => p.bubbles)];

  scrubber = new Scrubber(gsap, { steps, onIndexChange: updateControls });
  updateControls(0);
}

// The ask / voice / sleep / poke menu buttons are wired by PrepbotTeacher
// (the ask button opens the site's real, AI-backed chat — the bubble
// narration above is scripted and free; only that button reaches the model).

// The fullscreen screen can be anywhere from ~1.5x to ~5x wider than the
// small-column version depending on monitor size, so a flat CSS scale
// guess either does nothing or overshoots — measure the real width change
// and scale tiles/PrepBot/sticker by that ratio instead.
let preFullscreenWidth = 0;
fullscreenBtn.addEventListener("click", () => {
  const tv = document.querySelector(".mm-tv");
  if (!document.fullscreenElement) {
    preFullscreenWidth = document.querySelector(".mm-tv-screen").clientWidth;
    tv.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
});

document.addEventListener("fullscreenchange", () => {
  if (document.fullscreenElement) {
    // Force landscape in fullscreen on mobile, where the demo is otherwise
    // cramped in portrait — a no-op/rejection on desktop and on browsers
    // without Orientation Lock support (e.g. iOS Safari), which is fine
    // since they don't need it.
    window.screen?.orientation?.lock?.("landscape").catch(() => {});
    // Wait a frame for the fullscreen layout to actually settle before measuring.
    requestAnimationFrame(() => {
      const screenEl = document.querySelector(".mm-tv-screen");
      const ratio = preFullscreenWidth ? screenEl.clientWidth / preFullscreenWidth : 1;
      gsap.set(stage, { scale: ratio, transformOrigin: "left center" });
      gsap.set(botGroup, { scale: ratio, transformOrigin: "bottom right" });
      gsap.set(progressEl, { scale: Math.min(ratio, 2), transformOrigin: "top left" });
    });
  } else {
    window.screen?.orientation?.unlock?.();
    gsap.set(stage, { scale: 1 });
    gsap.set(botGroup, { scale: 1 });
    gsap.set(progressEl, { scale: 1 });
  }
});

// Stepping manually must also open the curtain first (nothing is visible
// behind it) and unmute narration — same reveal the Play button triggers.
async function revealIfNeeded() {
  if (needsIntro) {
    await playIntro();
    needsIntro = false;
  }
  sceneRevealed = true;
}
async function stepManual(dir) {
  stopGuidedPlay();
  await revealIfNeeded();
  if (dir > 0) scrubber?.next();
  else scrubber?.prev();
}

playBtn.addEventListener("click", () => {
  if (!firstPassDone) return; // locked until the first full manual pass
  if (autoPlaying) stopGuidedPlay();
  else guidedPlay();
});
prevBtn.addEventListener("click", () => stepManual(-1));
nextBtn.addEventListener("click", () => stepManual(1));

document.addEventListener("keydown", (e) => {
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;
  if (!scrubber) return;
  if (e.key === "ArrowRight") stepManual(1);
  else if (e.key === "ArrowLeft") stepManual(-1);
  else if (e.key === " ") {
    e.preventDefault();
    // Before the first full pass, Play is locked — Space just steps forward.
    if (!firstPassDone) { stepManual(1); return; }
    if (autoPlaying) stopGuidedPlay();
    else guidedPlay();
  }
});

async function boot() {
  ({ gsap } = await import("https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm"));
  await waitForMathJax();
  teacher.gsap = gsap; // hand the teacher its animation engine, then let it idle
  teacher.scheduleIdle();
  applyCase();
  renderExamples();
  loadScene(CASE_INFO[activeCase].examples[0]);
}

// The MathJax config script only sets up window.MathJax as a plain object;
// `startup.promise` isn't attached until the (async-loaded) tex-svg.js
// library itself finishes initializing, which can land well after this
// module runs — poll instead of guessing a fixed delay.
function waitForMathJax() {
  return new Promise((resolve) => {
    (function check() {
      if (window.MathJax && window.MathJax.typesetPromise) resolve();
      else setTimeout(check, 50);
    })();
  });
}

boot();
