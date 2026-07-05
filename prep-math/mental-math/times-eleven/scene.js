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
import { ICON_PLAY, ICON_PAUSE, ICON_PREPBOT, MOUTH_SHAPES } from "../shared/icons.js";

const stage = document.getElementById("mmStage");
const stepsPanel = document.getElementById("mmSteps");
const progressEl = document.getElementById("mmProgress");
const playBtn = document.getElementById("mmPlayBtn");
const playIcon = document.getElementById("mmPlayIcon");
const prevBtn = document.getElementById("mmPrevBtn");
const nextBtn = document.getElementById("mmNextBtn");
const chipsWrap = document.getElementById("mmChips");
const numInput = document.getElementById("mmNumInput");
const botGroup = document.querySelector(".mm-prepbot");
const botBubble = document.getElementById("mmBotBubble");
const botText = document.getElementById("mmBotText");
const botAvatar = document.getElementById("mmBotAvatar");
botAvatar.innerHTML = ICON_PREPBOT;
const botEyes = botAvatar.querySelectorAll(".mm-bot-eye");
const botMouth = botAvatar.querySelector(".mm-bot-mouth");

// Sticky-note colour rotation (pp-sticky--c0..c5, see components.css) — one
// colour per original digit (alternating), a shared colour for every
// computed gap/leading tile, and yellow for the final answer.
const ORIG_COLORS = ["pp-sticky--c3", "pp-sticky--c4"];
const GAP_COLOR = "pp-sticky--c2";
const ANSWER_COLOR = "pp-sticky--c0";

// Same pastel set as --pp-note-bg (components.css) — the bubble cycles
// through these per step so it reads as "multicoloured" rather than a
// single plain card.
const BUBBLE_COLORS = ["#fff3a8", "#e8c8ff", "#c8f0c0", "#bfe3ff", "#ffd7a3", "#b8ece2"];

let gsap;
let scrubber = null;
let currentNarration = [];
let typeTimer = null;
let lastNarratedIndex = -1;
let isTalking = false;
let idleTimer = null;

// ── Body vs. face are two separate animation systems ────────────────────
// Body (squeeze-bounce / slide / spin) only ever plays between lines, as
// occasional one-shot "impulses" — never a continuous loop, and never
// while talking. Face (eyes + mouth) only ever plays *while* talking, word
// by word. This mirrors how the site's own prefers-reduced-motion rule
// (theme.css) zeroes every CSS animation's duration — driving motion with
// GSAP tweens instead means it isn't silently caught by that rule.

function stopBody() {
  gsap.killTweensOf(botAvatar);
  gsap.killTweensOf(botGroup);
  gsap.set(botAvatar, { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 });
  gsap.set(botGroup, { x: 0 });
}

// "Bounce like a fluffy ball": squash in anticipation, stretch into a big
// jump, squash again on landing, then a couple of smaller settling bounces.
function squeezeBounce() {
  return gsap
    .timeline()
    .to(botAvatar, { scaleX: 1.25, scaleY: 0.72, duration: 0.12, ease: "power1.out" })
    .to(botAvatar, { scaleX: 0.82, scaleY: 1.3, y: -22, duration: 0.18, ease: "power2.out" })
    .to(botAvatar, { scaleX: 1.12, scaleY: 0.9, y: 0, duration: 0.16, ease: "power1.in" })
    .to(botAvatar, { scaleX: 0.95, scaleY: 1.08, y: -8, duration: 0.13, ease: "power2.out" })
    .to(botAvatar, { scaleX: 1, scaleY: 1, y: 0, duration: 0.18, ease: "bounce.out" });
}

// Walks the whole avatar+bubble group from its home corner to the other
// bottom side of the screen and back.
function slideAcross() {
  const screen = document.querySelector(".mm-tv-screen");
  const travel = -(screen.clientWidth - botGroup.offsetWidth - 14);
  if (travel >= 0) return gsap.timeline(); // screen too narrow to bother
  return gsap
    .timeline()
    .to(botGroup, { x: travel, duration: 1.1, ease: "power1.inOut" })
    .to(botGroup, { x: 0, duration: 1.1, ease: "power1.inOut", delay: 0.5 });
}

// A quick cartoon spin-hop, mixed in as a rarer third flavour of impulse.
function spinHop() {
  return gsap
    .timeline()
    .to(botAvatar, { rotation: "+=360", y: -10, duration: 0.5, ease: "back.out(2)" })
    .to(botAvatar, { y: 0, duration: 0.25 });
}

const BODY_IMPULSES = [squeezeBounce, squeezeBounce, slideAcross, spinHop];

// Idle scheduler: waits a random beat, and — only if nobody's talking —
// fires one random impulse, then schedules the next check. Never loops
// continuously on its own; each impulse is a short one-shot.
function scheduleIdle() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (!isTalking) {
      const fn = BODY_IMPULSES[Math.floor(Math.random() * BODY_IMPULSES.length)];
      fn();
    }
    scheduleIdle();
  }, 1800 + Math.random() * 2200);
}

// Reveals `text` letter by letter (the visible "typing"); at each word
// boundary, morphs the mouth to a new shape and gives the eyes a quick
// blink — so the face only ever animates in sync with actual words.
function speakLine(text) {
  isTalking = true;
  stopBody();
  clearInterval(typeTimer);
  botText.textContent = "";
  botMouth?.setAttribute("d", MOUTH_SHAPES[0]);

  const wordEnds = [];
  for (let idx = 0; idx < text.length; idx++) if (text[idx] === " ") wordEnds.push(idx);
  wordEnds.push(text.length);

  let i = 0;
  let wordCursor = 0;
  let shapeCursor = 0;
  typeTimer = setInterval(() => {
    i += 1;
    botText.textContent = text.slice(0, i);
    if (wordCursor < wordEnds.length && i >= wordEnds[wordCursor]) {
      wordCursor += 1;
      shapeCursor = 1 + (shapeCursor % (MOUTH_SHAPES.length - 1));
      botMouth?.setAttribute("d", MOUTH_SHAPES[shapeCursor]);
      if (botEyes.length && wordCursor % 3 === 0) {
        gsap.to(botEyes, { scaleY: 0.15, duration: 0.06, yoyo: true, repeat: 1 });
      }
    }
    if (i >= text.length) {
      clearInterval(typeTimer);
      botMouth?.setAttribute("d", MOUTH_SHAPES[0]);
      isTalking = false;
    }
  }, 26);
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
// Positions are anchored from the screen's left edge (PAD), not centered on
// it — the screen scrolls (overflow-x: auto) when a scene is wider than the
// visible area, and a browser can only ever reveal content to the RIGHT of
// a container's origin. Centering with negative offsets would put the
// leading-digit slot at an unreachable negative scroll position the moment
// a 4-digit cascade needed more width than the screen.
function tileSize(k) { return k <= 2 ? 56 : k === 3 ? 50 : 44; }
function sizeClass(k) { return k === 3 ? "mm-tile--md" : k === 4 ? "mm-tile--sm" : ""; }
function gapFor(k) { return tileSize(k) + 12; }
const PAD = 32; // >= largest tileSize()/2 + a small margin
function slotX(k, i) { return PAD + (i + 1) * gapFor(k); } // i: 0..k
function leadingX(k) { return PAD; } // one gap further left than slot 0
function origX(k, i) {
  const centerX = (slotX(k, 0) + slotX(k, k)) / 2;
  const clusterWidth = k * tileSize(k);
  return centerX - clusterWidth / 2 + i * tileSize(k) + tileSize(k) / 2;
}

function buildStepTexts(s) {
  const texts = [`${s.n} \\times 11 = \\,?`];
  texts.push(`\\text{Split } ${s.n} \\text{ into its digits: } ${s.digits.join(",\\ ")}`);
  const pairs = [];
  for (let i = 1; i < s.k; i++) pairs.push(`${s.digits[i - 1]}+${s.digits[i]}=${s.raw[i]}`);
  texts.push(`\\text{Add each adjacent pair: } ${pairs.join(",\\ \\ ")}`);
  texts.push(
    s.hasCarry
      ? `\\text{Carry left whenever a sum} \\ge 10`
      : `\\text{Every sum already fits in one digit}`
  );
  texts.push(`${s.n} \\times 11 = ${s.answer}`);
  return texts;
}

// PrepBot's scripted narration — plain-English lines authored per step, one
// per the same index buildStepTexts uses. No AI call: this is the "free"
// running commentary; the "?" badge is the only thing that opens the real,
// AI-backed chat, and only when a student actually wants to ask something.
function buildNarration(s) {
  return [
    { text: `Let's multiply ${s.n} by 11!`, mode: "speech" },
    { text: `First, I split ${s.n} into its digits.`, mode: "speech" },
    { text: "Now I'm adding each neighbouring pair...", mode: "thinking" },
    {
      text: s.hasCarry
        ? "Some of these are too big for one digit — carrying left!"
        : "Everything already fits neatly, no carrying needed.",
      mode: "thinking",
    },
    { text: `Ta-da! ${s.n} × 11 = ${s.answer}`, mode: "speech" },
  ];
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
  playIcon.innerHTML = scrubber.isPlaying ? ICON_PAUSE : ICON_PLAY;
  stepsPanel.querySelectorAll(".mm-step").forEach((el, i) => el.classList.toggle("is-current", i === index));

  const line = currentNarration[index];
  if (line && index !== lastNarratedIndex) {
    lastNarratedIndex = index;
    botBubble.style.setProperty("--bubble-bg", BUBBLE_COLORS[index % BUBBLE_COLORS.length]);
    botBubble.classList.toggle("mm-prepbot-bubble--speech", line.mode === "speech");
    botBubble.classList.toggle("mm-prepbot-bubble--thinking", line.mode === "thinking");
    speakLine(line.text);
  }
}

// ── Build the sticky-note tiles for one scene, fresh each time ──────────
function makeTile(colorClass, sizeCls, extraClass) {
  const el = document.createElement("div");
  el.className = `mm-tile pp-sticky ${colorClass} ${sizeCls} ${extraClass || ""}`.trim();
  const digit = document.createElement("span");
  digit.className = "mm-tile-digit";
  el.appendChild(digit);
  stage.appendChild(el);
  return { el, digit };
}

function buildStageDOM(s) {
  stage.innerHTML = "";
  const sizeCls = sizeClass(s.k);

  const originals = s.digits.map((_, i) => makeTile(ORIG_COLORS[i % 2], sizeCls));
  const gaps = {};
  const ghosts = {};
  const plusEls = {};
  for (let i = 1; i <= s.k - 1; i++) {
    gaps[i] = makeTile(GAP_COLOR, sizeCls, "mm-tile--gap");
    ghosts[i] = {
      left: makeTile(ORIG_COLORS[(i - 1) % 2], sizeCls, "mm-tile--ghost"),
      right: makeTile(ORIG_COLORS[i % 2], sizeCls, "mm-tile--ghost"),
    };
    const plus = document.createElement("div");
    plus.className = "mm-plus-sign";
    plus.textContent = "+";
    stage.appendChild(plus);
    plusEls[i] = plus;
  }

  const leading = makeTile(GAP_COLOR, sizeCls, "mm-tile--leading");

  const chip = document.createElement("div");
  chip.className = "mm-carry-badge";
  chip.textContent = "+1";
  stage.appendChild(chip);

  const answer = makeTile(ANSWER_COLOR, "", "mm-answer-pill pp-sticky--tape");

  return { originals, gaps, ghosts, plusEls, leading, chip, answer };
}

async function loadScene(n) {
  const s = makeScene(n);
  if (scrubber) scrubber.destroy();
  clearInterval(typeTimer);
  isTalking = false;
  currentNarration = buildNarration(s);
  botText.textContent = "";
  lastNarratedIndex = -1;

  const els = buildStageDOM(s);
  const { originals, gaps, ghosts, plusEls, leading, chip, answer } = els;
  stage.scrollLeft = 0;

  // slotEls[0..k]: slot 0/slot k are the endpoint original tiles themselves;
  // slots 1..k-1 are the gap tiles.
  const slotEls = {};
  slotEls[0] = originals[0];
  slotEls[s.k] = originals[s.k - 1];
  for (let i = 1; i <= s.k - 1; i++) slotEls[i] = gaps[i];

  originals.forEach((t, i) => {
    t.digit.textContent = s.digits[i];
    gsap.set(t.el, { x: origX(s.k, i), y: 0, scale: 1, rotation: i % 2 === 0 ? -3 : 3, opacity: 1 });
  });
  for (let i = 1; i <= s.k - 1; i++) {
    gaps[i].digit.textContent = "";
    gsap.set(gaps[i].el, { x: slotX(s.k, i), y: 0, scale: 0.6, opacity: 0, rotation: 2 });
    ghosts[i].left.digit.textContent = s.digits[i - 1];
    ghosts[i].right.digit.textContent = s.digits[i];
    gsap.set(ghosts[i].left.el, { x: origX(s.k, i - 1), y: 0, opacity: 0, rotation: 0 });
    gsap.set(ghosts[i].right.el, { x: origX(s.k, i), y: 0, opacity: 0, rotation: 0 });
    gsap.set(plusEls[i], { x: slotX(s.k, i), y: 0, opacity: 0 });
  }
  leading.digit.textContent = "1";
  gsap.set(leading.el, { x: leadingX(s.k), y: 0, scale: 0.6, opacity: 0, rotation: -2 });
  gsap.set(chip, { x: 0, y: 0, opacity: 0 });
  answer.digit.textContent = s.answer;
  const answerX = (slotX(s.k, 0) + slotX(s.k, s.k)) / 2;
  gsap.set(answer.el, { xPercent: -50, yPercent: -50, x: answerX, y: 0, opacity: 0, scale: 0.8 });

  const texts = buildStepTexts(s);
  const nodes = await renderSteps(texts);
  gsap.set(nodes[0], { opacity: 1, y: 0 });
  gsap.set(nodes.slice(1), { opacity: 0, y: 10 });

  const steps = [
    {
      id: "split",
      build: (tl) => {
        tl.to(originals[0].el, { x: slotX(s.k, 0), duration: 0.6, ease: "power2.inOut" });
        tl.to(originals[s.k - 1].el, { x: slotX(s.k, s.k), duration: 0.6, ease: "power2.inOut" }, "<");
        tl.to(nodes[1], { opacity: 1, y: 0, duration: 0.35 }, "<");
      },
    },
    {
      id: "sum",
      build: (tl) => {
        for (let i = 1; i <= s.k - 1; i++) {
          const g = ghosts[i];
          tl.set([g.left.el, g.right.el], { opacity: 1 }, "<");
          tl.to(plusEls[i], { opacity: 1, duration: 0.2 }, "<");
          tl.to(g.left.el, { x: slotX(s.k, i), duration: 0.5, ease: "power1.in" }, "<");
          tl.to(g.right.el, { x: slotX(s.k, i), duration: 0.5, ease: "power1.in" }, "<");
          tl.to([g.left.el, g.right.el], { opacity: 0, duration: 0.2 }, "-=0.2");
          tl.to(plusEls[i], { opacity: 0, duration: 0.2 }, "<");
          tl.call(() => { gaps[i].digit.textContent = s.raw[i]; });
          tl.to(gaps[i].el, { opacity: 1, scale: 1, duration: 0.4 }, "<");
        }
        // Middle original tiles (feeding two gaps) are fully absorbed —
        // fade them out once their ghosts have launched. Endpoint tiles
        // (index 0 and k-1) stay put: they ARE slot 0 / slot k.
        if (s.k > 2) {
          const middles = originals.slice(1, -1).map((t) => t.el);
          tl.to(middles, { opacity: 0, duration: 0.3 }, "<");
        }
        tl.to(nodes[2], { opacity: 1, y: 0, duration: 0.35 }, "<");
      },
    },
    {
      id: "resolve",
      build: (tl) => {
        let carryIn = 0;
        for (let i = s.k - 1; i >= 0; i--) {
          const val = s.raw[i] + carryIn;
          const digit = val % 10;
          const carryOut = val >= 10 ? 1 : 0;

          if (carryOut) {
            const fromX = slotX(s.k, i);
            const toX = i === 0 ? leadingX(s.k) : slotX(s.k, i - 1);
            tl.set(chip, { x: fromX, y: 0, opacity: 0 });
            tl.to(chip, { opacity: 1, duration: 0.15 });
            tl.call(() => { slotEls[i].digit.textContent = digit; });
            tl.to(chip, { x: toX, y: -40, duration: 0.5, ease: "power2.inOut" }, "<");
            if (i === 0) {
              tl.call(() => { leading.digit.textContent = "1"; });
              tl.to(leading.el, { opacity: 1, duration: 0.3 }, "<+0.1");
            }
            tl.to(chip, { opacity: 0, duration: 0.2 }, "+=0.05");
          } else {
            tl.call(() => { slotEls[i].digit.textContent = digit; });
          }

          if (carryIn) {
            tl.to(slotEls[i].el, { scale: 1.2, duration: 0.12 }, "<");
            tl.to(slotEls[i].el, { scale: 1, duration: 0.16 });
          }
          carryIn = carryOut;
        }
        tl.to(nodes[3], { opacity: 1, y: 0, duration: 0.35 }, "<");
      },
    },
    {
      id: "answer",
      build: (tl) => {
        const fading = [originals[0].el, originals[s.k - 1].el, leading.el];
        for (let i = 1; i <= s.k - 1; i++) fading.push(gaps[i].el);
        tl.to(fading, { opacity: 0, duration: 0.3 });
        // The final answer is the whole point — make sure it's actually in
        // view even if the scene is wider than the screen (a 4-digit number
        // with a leading carry can be), instead of leaving it scrolled off.
        const targetScroll = Math.max(0, answerX - stage.clientWidth / 2);
        tl.to(stage, { scrollLeft: targetScroll, duration: 0.5, ease: "power2.inOut" }, "<");
        tl.to(answer.el, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.6)" }, "<+0.1");
        tl.to(nodes[4], { opacity: 1, y: 0, duration: 0.4 }, "<");
      },
    },
  ];

  scrubber = new Scrubber(gsap, { steps, onIndexChange: updateControls });
  updateControls(0);
}

function setActiveChip(chip) {
  chipsWrap.querySelectorAll(".mm-chip").forEach((c) => c.classList.toggle("active", c === chip));
}

// Only this button ever reaches the model — it opens the site's real,
// AI-backed PrepBot chat (utils/prepbot/prepbot.js). The bubble/thinking
// narration above is scripted and free.
document.getElementById("mmBotAsk").addEventListener("click", () => {
  document.getElementById("chat-fab")?.click();
});

chipsWrap.querySelectorAll(".mm-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    setActiveChip(chip);
    numInput.value = "";
    loadScene(parseInt(chip.dataset.n, 10));
  });
});

numInput.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  const n = parseInt(numInput.value, 10);
  if (!Number.isInteger(n) || n < 10 || n > 9999) {
    numInput.style.borderColor = "var(--accent-danger)";
    return;
  }
  numInput.style.borderColor = "";
  setActiveChip(null);
  loadScene(n);
});

playBtn.addEventListener("click", () => {
  scrubber?.togglePlay();
  updateControls(scrubber.index);
});
prevBtn.addEventListener("click", () => scrubber?.prev());
nextBtn.addEventListener("click", () => scrubber?.next());

document.addEventListener("keydown", (e) => {
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;
  if (!scrubber) return;
  if (e.key === "ArrowRight") scrubber.next();
  else if (e.key === "ArrowLeft") scrubber.prev();
  else if (e.key === " ") {
    e.preventDefault();
    scrubber.togglePlay();
    updateControls(scrubber.index);
  }
});

async function boot() {
  ({ gsap } = await import("https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm"));
  await waitForMathJax();
  scheduleIdle();
  loadScene(23);
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
