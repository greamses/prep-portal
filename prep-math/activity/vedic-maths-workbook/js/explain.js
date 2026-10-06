/* ============================================================================
   Mental Maths Workbook — PREPBOT EXPLAINS each trick, on its TV
   ----------------------------------------------------------------------------
   Learning with PrepBot (/prep-math/mental-math) is where a trick is TAUGHT:
   PrepBot stands in a TV, and THE NUMBERS MOVE on the screen while it talks.
   PrepBot never explains without its TV, and the TV never shows only words.
   This brings that set onto the workbook: on a Skill development paper every
   section opens with a strip that says "PrepBot explains …"; tapped, the TV
   comes up over the paper, the curtain opens, and the section's own worked
   example is acted out in number tiles —

     a STRIP trick     35²: [3 × 4 | 25] → [12 | 25] = 1225. The sum stands at
     (most of them)    the top; each part of the working flies out of it to
                       its place, turns over into what it comes to, and the
                       parts close up into the answer.
     TRACHTENBERG      the number in a row of digit tiles, the 0 sliding in at
                       the front; then digit by digit from the right — the
                       digit and its neighbour light up, the sum is shown, and
                       the figure to write drops in under its digit.
     the rest          (× 5, roots, ÷ 9, digit sums …) the sum at the top, and
                       under it the sums PrepBot is saying, a line at a time,
                       in tiles.

   IT IS THE SAME SET AND THE SAME PREPBOT: /prep-math/mental-math/shared/
   prepbot-tv.js (the TV, its controls, the stepping) and prepbot-teacher.js
   (the character, its voice, its menu, its Ask button into the real chat).
   Nothing here draws a TV or a bot of its own; this file only says what goes
   on the screen.

   What it SAYS and SHOWS is the section's own — its instruction and its
   "one done for you", read out of the paper's own markup (sceneOf) — so an
   explanation can never drift from its paper. A trick that also has a full
   hand-made lesson links to it (LESSONS).

   Drills papers have no strip: a drill is against the clock.
   ========================================================================== */

import { wSvg } from "./tableart.js";

/* Tricks with a full animated lesson in Learning with PrepBot. */
const LESSONS = {
  "vm-eleven": "/prep-math/mental-math/times-eleven/index.html",
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const plain = (html) => String(html || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
/** Text as the lines PrepBot says: a sentence each, a long one broken at its dash or semicolon. */
function linesOf(text) {
  return plain(text)
    .split(/(?<=[.!?])\s+(?=[A-Z0-9“"(])/)
    .flatMap((s) => (s.length > 150 ? s.split(/\s+—\s+|;\s+/) : [s]))
    .map((s) => s.trim())
    .filter((s) => s.length > 1);
}

/**
 * The worked example, read out of the paper's own markup: the sum, the two
 * strips of its working, the answer — or the Trachtenberg steps — and the
 * words under it.
 */
function sceneOf(html) {
  const doc = new DOMParser().parseFromString(`<div>${html || ""}</div>`, "text/html");
  const text = (n) => (n ? n.textContent.replace(/\s+/g, " ").trim() : "");
  const done = [...doc.querySelectorAll(".wb-worked__say")].flatMap((n) => linesOf(n.innerHTML));
  const q = text(doc.querySelector(".vm-q"));
  const list = doc.querySelector(".vm-trlist");
  if (list) {
    const steps = [...list.querySelectorAll("li")].map((li) => { const [calc, write = ""] = text(li).split("→"); return { calc: calc.trim(), write: write.replace(/write/i, "").trim() }; });
    return { kind: "trach", q, steps, done };
  }
  const strips = [...doc.querySelectorAll(".vm-strip")];
  if (strips.length >= 2) {
    /* the working and what it comes to are the last two strips of one line */
    const line = strips[strips.length - 1].parentElement;
    const mine = strips.filter((s) => s.parentElement === line);
    const [a, b] = mine.length >= 2 ? mine.slice(-2) : strips.slice(0, 2);
    const parts = (s) => [...s.querySelectorAll(".vm-strip__part")].map(text);
    const tail = text(b.parentElement).split(text(b)).pop() || "";
    const answer = (/=\s*([\d ,.]+)/.exec(tail) || [])[1] || "";
    const kids = [...a.parentElement.childNodes];
    const lead = kids.slice(0, kids.indexOf(mine.length >= 2 ? mine[0] : a)).map((n) => n.textContent).join(" ").replace(/\s+/g, " ").trim();
    /* with no sum of its own in large type, the words in front of the strips ARE the sum ("1000 − 368:") */
    if (!q) return { kind: "strip", q: lead.replace(/[:;,.\s]+$/, ""), expr: parts(a), res: parts(b), answer: answer.trim(), lead: "", done };
    return { kind: "strip", q, expr: parts(a), res: parts(b), answer: answer.trim(), lead: lead.length > 3 && lead.length < 60 ? lead : "", done };
  }
  return { kind: "text", q, done };
}

const FACE = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="11.2" y="1.6" width="1.6" height="3.4" rx="0.8" fill="#2a2723"/><circle cx="12" cy="2" r="1.5" fill="#f0443e"/>` +
  `<rect x="3" y="5" width="18" height="14.6" rx="4.4" fill="#bfe3ff" stroke="#2a2723" stroke-width="1.2"/>` +
  `<circle cx="8.6" cy="11.4" r="2.1" fill="#2a2723"/><circle cx="15.4" cy="11.4" r="2.1" fill="#2a2723"/><circle cx="9.2" cy="10.8" r="0.7" fill="#fff"/><circle cx="16" cy="10.8" r="0.7" fill="#fff"/>` +
  `<path d="M8.6 15.6Q12 17.8 15.4 15.6" fill="none" stroke="#2a2723" stroke-width="1.2" stroke-linecap="round"/></svg>`;
const PLAY = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.4" fill="#2a2723"/><path d="M9.6 7.4v9.2l7.6-4.6z" fill="#fffdf8"/></svg>`;

/** The strip that opens a section: PrepBot, the trick's name, and "watch". */
export function explainStrip(ex, opts) {
  const rule = linesOf(typeof ex.instruction === "function" ? ex.instruction(opts) : ex.instruction);
  /* a section may name a scene of its own (`tv`): then that is what the TV shows */
  const scene = ex.tv ? { kind: ex.tv } : sceneOf(ex.worked ? ex.worked(opts) : "");
  const lesson = LESSONS[ex.id];
  return `<div class="vm-video has-video" data-explain="${esc(JSON.stringify({ rule, scene }))}" data-title="${esc(ex.label)}" tabindex="0">` +
    `<span class="vm-video__bot">${FACE}</span>` +
    `<span class="vm-video__say"><b>PrepBot explains</b><em>${esc(ex.label)}</em></span>` +
    (lesson ? `<a class="vm-video__more" href="${lesson}" target="_blank" rel="noopener">The full lesson</a>` : "") +
    `<span class="vm-video__go">${PLAY}<i>Watch</i></span></div>`;
}

/* ── number tiles on the TV's screen ───────────────────────────────────────
   A tile is a NUMBER (or a sum) standing on the screen by itself — no paper
   behind it: it is told from its neighbours by its COLOUR (`c`, one of six
   inks), placed by its middle at (x, y) in hundredths of the screen. The outer box holds the
   place; the inner note is what pops, turns over and pulses. Every move has
   an INSTANT form, because going back a step rebuilds the screen and replays
   what came before at once (prepbot-tv.js). */

function tile(stage, id, text, x, y, { c = 0, size = "m", bare = false } = {}) {
  const box = document.createElement("div");
  box.className = `vm-t vm-t--${size}`;
  box.dataset.t = id;
  box.style.left = `${x}%`;
  box.style.top = `${y}%`;
  box.innerHTML = `<span class="vm-t__in ${bare ? "vm-t__in--bare" : `vm-t__in--c${c % 6}`}"></span>`;
  box.firstChild.textContent = text;
  box.firstChild.style.opacity = "0";
  stage.querySelector(".vm-tv").appendChild(box);
  return box;
}

/* what a counting stick is painted: plain wood, the tens' blue, the units' orange */
const TONES = { plain: ["#e9cf9c", "#2a2723"], tens: ["#bfe3ff", "#2f6ea8"], units: ["#ffd7a3", "#d9632b"] };

function acts(stage, gsap, instant) {
  const box = (id) => stage.querySelector(`[data-t="${id}"]`);
  const inn = (id) => box(id)?.firstChild;
  const quick = instant || !gsap;
  return {
    /** A tile comes on. */
    pop(id, delay = 0) {
      const n = inn(id); if (!n) return;
      if (quick) { n.style.opacity = "1"; return; }
      gsap.fromTo(n, { opacity: 0, scale: 0.4, rotation: -8 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.45, delay, ease: "back.out(1.8)" });
    },
    /** A tile comes on by flying from somewhere else to its own place. */
    fly(id, fx, fy, delay = 0) {
      const b = box(id), n = inn(id); if (!b) return;
      if (quick) { n.style.opacity = "1"; return; }
      const home = { left: b.style.left, top: b.style.top };
      gsap.fromTo(b, { left: `${fx}%`, top: `${fy}%` }, { ...home, duration: 0.7, delay, ease: "power2.inOut" });
      gsap.fromTo(n, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.5, delay, ease: "power1.out" });
    },
    /** A tile goes somewhere else. */
    move(id, x, y, delay = 0) {
      const b = box(id); if (!b) return;
      if (quick) { b.style.left = `${x}%`; b.style.top = `${y}%`; return; }
      gsap.to(b, { left: `${x}%`, top: `${y}%`, duration: 0.6, delay, ease: "power2.inOut" });
    },
    /** A tile turns over and says something else. */
    flip(id, text, c, delay = 0) {
      const n = inn(id); if (!n) return;
      const set = () => { n.textContent = text; if (c != null) n.className = `vm-t__in vm-t__in--c${c % 6}`; };
      if (quick) { set(); n.style.opacity = "1"; return; }
      gsap.timeline({ delay }).to(n, { scaleY: 0, duration: 0.18, ease: "power1.in" }).add(set).set(n, { opacity: 1 }).to(n, { scaleY: 1, duration: 0.3, ease: "back.out(2)" });
    },
    /** A tile goes off. */
    hide(id, delay = 0) {
      const n = inn(id); if (!n) return;
      if (quick) { n.style.opacity = "0"; return; }
      gsap.to(n, { opacity: 0, scale: 0.7, duration: 0.3, delay });
    },
    /** A tile is dimmed, or brought back. */
    dim(id, to = 0.35, delay = 0) {
      const n = inn(id); if (!n) return;
      if (quick) { n.style.opacity = String(to); return; }
      gsap.to(n, { opacity: to, duration: 0.3, delay });
    },
    /** A tile is PUT as it must stand when a step begins — at once, whatever it was in the middle of. */
    put(id, { on = 1, x, y, tone, text } = {}) {
      const b = box(id), n = inn(id); if (!b) return;
      if (gsap) { gsap.killTweensOf(n); gsap.killTweensOf(b); gsap.set(n, { scale: 1, scaleY: 1, rotation: 0 }); }
      n.style.opacity = String(on);
      if (x != null) { b.style.left = `${x}%`; b.style.top = `${y}%`; }
      if (tone) { n.style.backgroundColor = TONES[tone][0]; n.style.borderColor = TONES[tone][1]; }
      if (text != null) n.textContent = text;
    },
    /** A stick takes a colour. */
    paint(id, tone, delay = 0) {
      const n = inn(id); if (!n) return;
      const [backgroundColor, borderColor] = TONES[tone];
      if (quick) { n.style.backgroundColor = backgroundColor; n.style.borderColor = borderColor; return; }
      gsap.to(n, { backgroundColor, borderColor, duration: 0.25, delay });
      gsap.fromTo(n, { scale: 1 }, { scale: 1.15, duration: 0.18, delay, yoyo: true, repeat: 1, immediateRender: false });
    },
    /** A tile is pointed at: a little jump. */
    pulse(id, delay = 0) {
      const n = inn(id); if (!n || quick) return;
      gsap.fromTo(n, { scale: 1 }, { scale: 1.22, duration: 0.2, delay, yoyo: true, repeat: 1, ease: "power1.inOut" });
    },
  };
}

/** n places in a row, centred on cx, `gap` apart. */
const row = (n, cx, gap) => Array.from({ length: n }, (_, i) => cx + (i - (n - 1) / 2) * gap);
/** Which line of `lines` an action out of `count` belongs to: spread evenly, in order. */
const lineFor = (k, count, lines) => Math.min(lines - 1, Math.floor((k * lines) / count));

/* ── a STRIP trick: the working flies out of the sum, turns over, closes up ── */
function stripSteps({ rule, scene }) {
  const { q, expr, res, answer, lead, done } = scene;
  const n = expr.length;
  const gap = Math.min(27, 62 / n);
  const xs = row(n, 43, gap);
  const tight = row(n, 43, Math.min(gap, 9 + 2.2 * Math.max(...res.map((r) => r.length), 1)));
  const build = (stage) => {
    stage.innerHTML = `<div class="vm-tv"></div>`;
    tile(stage, "q", q, 43, 17, { c: 0, size: "l" });
    if (lead) tile(stage, "lead", lead, 43, 33, { bare: true, size: "s" });
    expr.forEach((t, i) => tile(stage, `p${i}`, t, xs[i], 50, { c: i + 1 }));
    if (answer) { tile(stage, "eq", "=", 24, 76, { bare: true, size: "l" }); tile(stage, "a", answer, 43, 76, { c: 2, size: "l" }); }
  };
  /* what happens, in order: each part flies out; each turns over; they close up into the answer */
  const actions = [
    ...expr.map((_, i) => (S) => { if (i === 0 && lead) S.pop("lead"); S.fly(`p${i}`, 43, 17); }),
    ...res.map((t, i) => (S) => S.flip(`p${i}`, t, i + 3)),
    (S) => { xs.forEach((_, i) => S.move(`p${i}`, tight[i], 50)); if (answer) { S.pop("eq", 0.5); S.pop("a", 0.6); } },
  ];
  const says = done.length ? done : ["Here is one done for you."];
  const steps = [
    ...rule.map((say, k) => ({ say, show(stage, { gsap, instant }) { const S = acts(stage, gsap, instant); if (k === 0) S.pop("q"); else S.pulse("q"); } })),
    ...says.map((say, j) => ({
      say,
      show(stage, { gsap, instant }) {
        const S = acts(stage, gsap, instant);
        if (!rule.length && j === 0) S.pop("q");
        const mine = actions.filter((_, k) => lineFor(k, actions.length, says.length) === j);
        mine.forEach((act, k) => { if (instant || !gsap) act(S); else gsap.delayedCall(k * 0.6, () => { if (stage.isConnected) act(acts(stage, gsap, false)); }); });
        if (!mine.length) S.pulse(answer ? "a" : "q");
      },
    })),
  ];
  return { build, steps };
}

/* ── TRACHTENBERG: digit by digit from the right ──────────────────────────── */
function trachSteps({ rule, scene }) {
  const { q, steps: work, done } = scene;
  const [num, times = ""] = q.split("×").map((s) => s.trim());
  const digits = ["0", ...num.split("")];
  const xs = row(digits.length, 38, 11);
  const build = (stage) => {
    stage.innerHTML = `<div class="vm-tv"></div>`;
    digits.forEach((d, i) => tile(stage, `d${i}`, d, xs[i], 20, { c: i === 0 ? 5 : 0, size: "l" }));
    tile(stage, "x", `× ${times}`, xs[xs.length - 1] + 15, 20, { bare: true, size: "l" });
    tile(stage, "calc", "", 38, 45, { c: 3 });
    digits.forEach((_, i) => tile(stage, `w${i}`, work[digits.length - 1 - i]?.write || "", xs[i], 70, { c: 2, size: "l" }));
  };
  const lead = rule.length ? rule : ["Write a 0 in front of the number."];
  const steps = [
    ...lead.map((say, k) => ({
      say,
      show(stage, { gsap, instant }) {
        const S = acts(stage, gsap, instant);
        if (k === 0) { digits.forEach((_, i) => { if (i) S.pop(`d${i}`, i * 0.12); }); S.pop("x", 0.5); S.fly("d0", xs[0] - 22, 20, 0.8); } else S.pulse(`d${digits.length - 1}`);
      },
    })),
    /* one step for each digit, from the right */
    ...work.map((w, j) => {
      const i = digits.length - 1 - j;
      return {
        say: `${w.calc}. Write ${w.write}.`,
        show(stage, { gsap, instant }) {
          const S = acts(stage, gsap, instant);
          digits.forEach((_, k) => S.dim(`d${k}`, k === i || k === i + 1 ? 1 : 0.35));
          S.pulse(`d${i}`, 0.3);
          if (i + 1 < digits.length) S.pulse(`d${i + 1}`, 0.55);
          S.flip("calc", w.calc, 3 + (j % 3), 0.5);
          S.fly(`w${i}`, 38, 45, 1.3);
        },
      };
    }),
    ...(done.length ? done : ["Read the written digits from left to right."]).map((say, k) => ({
      say,
      show(stage, { gsap, instant }) {
        const S = acts(stage, gsap, instant);
        if (k === 0) { S.hide("calc"); digits.forEach((_, i) => { S.dim(`d${i}`, 1); S.pulse(`w${i}`, 0.3 + i * 0.12); }); } else S.pulse(`w${digits.length - 1}`);
      },
    })),
  ];
  return { build, steps };
}

/* ── the rest: the sums PrepBot is saying, a line at a time, in tiles ──────── */
const SUM = /\d[\d ,.]*\s*[²³]?(?:\s*[×÷+−–]\s*\(?\s*\d[\d ,.]*[²³]?\s*\)?)*\s*=\s*\d[\d ,.]*\d|\d[\d ,.]*\s*[²³]?(?:\s*[×÷+−–]\s*\d[\d ,.]*[²³]?)+|[√∛]\s*\d+|\d+\s*[²³]|\d[\d ,]*\d|\d/g;
function textSteps({ rule, scene }) {
  const { q, done } = scene;
  const says = done.length ? done : rule;
  const lead = done.length ? rule : [];
  /* up to three sums out of each line that is said */
  const bits = says.map((s) => (s.match(SUM) || []).map((t) => t.replace(/[ ,.]+$/, "").trim()).filter(Boolean).slice(0, 3));
  const ROWS = [38, 55, 72];
  const build = (stage) => {
    stage.innerHTML = `<div class="vm-tv"></div>`;
    if (q) tile(stage, "q", q, 43, 17, { c: 0, size: "l" });
    bits.forEach((list, j) => { const xs = row(list.length, 43, Math.min(28, 64 / Math.max(1, list.length))); list.forEach((t, i) => tile(stage, `b${j}_${i}`, t, xs[i], ROWS[j % 3], { c: j + i + 1 })); });
  };
  const steps = [
    ...lead.map((say, k) => ({ say, show(stage, { gsap, instant }) { const S = acts(stage, gsap, instant); if (k === 0) S.pop("q"); else S.pulse("q"); } })),
    ...says.map((say, j) => ({
      say,
      show(stage, { gsap, instant }) {
        const S = acts(stage, gsap, instant);
        if (!lead.length && j === 0) S.pop("q");
        /* a row is used again every third line: what stood there goes off first */
        if (j >= 3) bits[j - 3].forEach((_, i) => S.hide(`b${j - 3}_${i}`));
        if (j >= 1) bits[j - 1].forEach((_, i) => S.dim(`b${j - 1}_${i}`, 0.55));
        bits[j].forEach((_, i) => S.pop(`b${j}_${i}`, 0.25 + i * 0.35));
        if (!bits[j].length) S.pulse("q");
      },
    })),
  ];
  return { build, steps };
}

/* ── A TIMES TABLE ON THE SCREEN ───────────────────────────────────────────
   Ten sums in a column, the tens in one colour and the units in another, and
   a LINE ruled across wherever the pattern repeats (`cuts`: the rows it goes
   under). What comes on when is each table's own script. */
function tableStage(n, cuts = []) {
  const ROWS = 10;
  const y = (i) => 9.5 + i * 8.6;
  const X = { sum: 27, tens: 43, units: 47.5, eq: 37.5 };
  const build = (stage) => {
    stage.innerHTML = `<div class="vm-tv"></div>`;
    for (let i = 0; i < ROWS; i++) {
      const v = n * (i + 1);
      tile(stage, `s${i}`, `${n} × ${i + 1}`, X.sum, y(i), { bare: true, size: "s" });
      tile(stage, `e${i}`, "=", X.eq, y(i), { bare: true, size: "s" });
      tile(stage, `t${i}`, String(Math.floor(v / 10)), X.tens, y(i), { c: 3 });
      tile(stage, `u${i}`, String(v % 10), X.units, y(i), { c: 4 });
    }
    cuts.forEach((i) => {
      const box = tile(stage, `k${i}`, "", 38, y(i) + 4.3, { bare: true });
      box.firstChild.className = "vm-t__in vm-t__line";
      box.firstChild.style.width = "calc(var(--u) * 36)";
    });
  };
  const all = (fn) => { for (let i = 0; i < ROWS; i++) fn(i); };
  /** a picture to stand beside the table: put on the stage hidden, and brought on like any number */
  const art = (stage, id, html) => {
    const box = tile(stage, id, "", 76, 36, { bare: true });
    box.firstChild.className = "vm-t__in vm-t__art";
    box.firstChild.innerHTML = html;
  };
  /** every row dimmed but these */
  const only = (S, rows) => all((i) => { const d = rows.includes(i) ? 1 : 0.3; S.dim(`s${i}`, d); S.dim(`e${i}`, d); S.dim(`t${i}`, d); S.dim(`u${i}`, d); });
  /** the ten sums come on */
  const sums = (S) => all((i) => { S.pop(`s${i}`, i * 0.12); S.pop(`e${i}`, i * 0.12); });
  /** the pairs close up and are read across */
  const read = (S) => all((i) => { S.move(`u${i}`, X.units - 1.6, y(i), i * 0.1); S.pulse(`t${i}`, 0.9 + i * 0.3); S.pulse(`u${i}`, 0.9 + i * 0.3); });
  const step = (say, fn) => ({ say, show(stage, how) { fn(acts(stage, how.gsap, how.instant)); } });
  return { build, step, sums, read, only, art };
}

/* ── THE NINE TIMES TABLE: count down the page, count up the page — and then
   TEN COUNTING STICKS beside it, with which everything is COUNTED OUT:
     the sticks method   9 is 10 − 1: take away the stick at the number; the
                         sticks left of the gap are the tens, right the units
     the digit sum       nine sticks are always left, so the digits make 9
     one fact            count n sticks, take one away (the tens), and count
                         on to 9 (the units)
   Every stick is its own tile, so each is counted, coloured and taken away
   by itself. A step first PUTS the sticks as they must stand (`lay`), so it
   plays the same whether it is reached by going on, going back or skipping. */
function ninesSteps() {
  const T = tableStage(9, []);
  const sx = (i) => 59.5 + i * 3.6;
  const SY = 40, NY = 25.5, CY = 55.5, DOWN = 6;
  const ten = (fn) => { for (let i = 0; i < 10; i++) fn(i); };
  const build = (stage) => {
    T.build(stage);
    ten((i) => {
      tile(stage, `st${i}`, "", sx(i), SY, { bare: true }).firstChild.className = "vm-t__in vm-t__stick";
      tile(stage, `n${i}`, String(i + 1), sx(i), NY, { bare: true, size: "s" });
      tile(stage, `c${i}`, "", sx(i), CY, { c: 0, size: "s" });
    });
  };
  /** The sticks as a step begins. `on(i)` is whether stick i is out, `gone` the stick taken away,
      `tone(i)` its colour, `count(i)` the [number, ink] counted under it, `nums(i)` whether its own number shows. */
  const lay = (S, { on = () => true, gone = -1, tone = () => "plain", count = () => null, nums = on } = {}) => ten((i) => {
    S.put(`st${i}`, { on: !on(i) ? 0 : i === gone ? 0.2 : 1, x: sx(i), y: i === gone ? SY + DOWN : SY, tone: i === gone ? "plain" : tone(i) });
    S.put(`n${i}`, { on: !nums(i) ? 0 : i === gone ? 0.3 : 1 });
    const k = i === gone ? null : count(i);
    S.put(`c${i}`, { on: 0 });
    if (k) S.flip(`c${i}`, k[0], k[1]);
  });
  /** stick i is taken away */
  const take = (S, i, at) => { S.pulse(`st${i}`, Math.max(0, at - 0.6)); S.move(`st${i}`, sx(i), SY + DOWN, at); S.dim(`st${i}`, 0.2, at); S.dim(`n${i}`, 0.3, at); };
  /** the sticks in `list` are counted, one at a time: each takes its colour and its number */
  const tally = (S, list, tone, ink, at, from = 1, gap = 0.48) => list.forEach((i, k) => {
    if (tone) S.paint(`st${i}`, tone, at + k * gap); else S.pulse(`st${i}`, at + k * gap);
    S.flip(`c${i}`, String(from + k), ink, at + k * gap);
  });
  const left = (g) => Array.from({ length: g }, (_, i) => i);
  const right = (g) => Array.from({ length: 9 - g }, (_, i) => g + 1 + i);
  const sides = (g) => (i) => (i < g ? "tens" : "units");
  /* the digit sum of one row: the stick is already away, and the nine that are left are counted straight across */
  const sumStep = (say, g, at) => T.step(say, (S) => {
    T.only(S, [g]);
    lay(S, { gone: g, tone: sides(g) });
    tally(S, [...left(g), ...right(g)], null, 0, at);
    S.pulse(`t${g}`, at + 4.6); S.pulse(`u${g}`, at + 4.9);
  });
  const steps = [
    T.step("Here is the secret of the nine times table. First, write the ten sums down the page.", (S) => { lay(S, { on: () => false }); T.sums(S); }),
    T.step("Now count from 0 to 9, going DOWN the page. 0, 1, 2, 3, 4, 5, 6, 7, 8, 9.",
      (S) => { for (let i = 0; i < 10; i++) S.pop(`t${i}`, 0.3 + i * 0.42); }),
    T.step("Count from 0 to 9 again, but this time going UP the page. 0, 1, 2, 3, 4, 5, 6, 7, 8, 9.",
      (S) => { for (let i = 0; i < 10; i++) S.pop(`u${9 - i}`, 0.3 + i * 0.42); }),
    T.step("Read across. 9, 18, 27, 36, 45, 54, 63, 72, 81, 90. That is the whole nine times table, and nothing was multiplied.", (S) => T.read(S)),

    /* the counting sticks */
    T.step("Why does it work? 9 is 10 take away 1. So lay out ten counting sticks, and count them. 1, 2, 3, 4, 5, 6, 7, 8, 9, 10.",
      (S) => { lay(S, { on: () => false }); ten((i) => { S.pop(`st${i}`, 4.6 + i * 0.48); S.pop(`n${i}`, 4.6 + i * 0.48); }); }),
    T.step("For 9 times 7, take away the stick at number 7.",
      (S) => { T.only(S, [6]); lay(S); S.pulse("s6", 0.3); take(S, 6, 1.8); }),
    T.step("Count the sticks on the left of the gap. 1, 2, 3, 4, 5, 6. Six sticks: 6 is the tens.",
      (S) => { T.only(S, [6]); lay(S, { gone: 6 }); tally(S, left(6), "tens", 3, 2.4); S.pulse("t6", 6.2); }),
    T.step("Now count the sticks on the right of the gap. 1, 2, 3. Three sticks: 3 is the units. So 9 times 7 is 63.",
      (S) => {
        T.only(S, [6]);
        lay(S, { gone: 6, tone: (i) => (i < 6 ? "tens" : "plain"), count: (i) => (i < 6 ? [String(i + 1), 3] : null) });
        tally(S, right(6), "units", 4, 2.6); S.pulse("u6", 5); S.pulse("t6", 7.2); S.pulse("u6", 7.5);
      }),
    T.step("Try another. For 9 times 4, take away the stick at number 4. On the left: 1, 2, 3. On the right: 1, 2, 3, 4, 5, 6. So 9 times 4 is 36.",
      (S) => {
        T.only(S, [3]); lay(S); S.pulse("s3", 0.3); take(S, 3, 2.6);
        tally(S, left(3), "tens", 3, 5.2); tally(S, right(3), "units", 4, 7.6);
        S.pulse("t3", 11.4); S.pulse("u3", 11.7);
      }),

    /* the digit sum, counted */
    T.step("Look what the sticks show. One stick of the ten is always taken away, so nine sticks are always left. That is why the two digits always add up to 9.",
      (S) => { T.only(S, [3]); lay(S, { gone: 3, tone: sides(3) }); [...left(3), ...right(3)].forEach((i, k) => S.pulse(`st${i}`, 3.4 + k * 0.2)); }),
    sumStep("Take 18. 1 stick for the tens, and 8 sticks for the units. Count them all. 1, 2, 3, 4, 5, 6, 7, 8, 9.", 1, 5.2),
    sumStep("Take 27. 2 sticks and 7 sticks. Count them all. 1, 2, 3, 4, 5, 6, 7, 8, 9.", 2, 3.8),
    sumStep("Take 54. 5 sticks and 4 sticks. Count them all. 1, 2, 3, 4, 5, 6, 7, 8, 9. Always 9.", 5, 3.8),

    /* one fact, with no table */
    T.step("So you can get just one fact, with no table. For 9 times 7, count out 7 sticks. 1, 2, 3, 4, 5, 6, 7.",
      (S) => { T.only(S, [6]); lay(S, { on: () => false }); S.pulse("s6", 2.6); for (let i = 0; i < 7; i++) { S.pop(`st${i}`, 5 + i * 0.48); S.pop(`n${i}`, 5 + i * 0.48); } }),
    T.step("Take one away, because 9 is one less than 10. Count what is left. 1, 2, 3, 4, 5, 6. One less than 7 is 6: that is the tens.",
      (S) => { T.only(S, [6]); lay(S, { on: (i) => i < 7 }); take(S, 6, 0.9); tally(S, left(6), "tens", 3, 4.4); S.pulse("t6", 8.6); }),
    T.step("Now count on from 6 until you reach 9. 7, 8, 9. That took 3 more sticks: 3 is the units. So 9 times 7 is 63.",
      (S) => {
        T.only(S, [6]);
        lay(S, { on: (i) => i < 7, gone: 6, tone: (i) => (i < 6 ? "tens" : "units"), count: (i) => (i < 6 ? [String(i + 1), 3] : null) });
        [7, 8, 9].forEach((i, k) => { S.pop(`st${i}`, 3.2 + k * 0.55); S.flip(`c${i}`, String(7 + k), 4, 3.2 + k * 0.55); S.flip(`c${i}`, String(k + 1), 4, 6 + k * 0.4); });
        S.pulse("u6", 7.6); S.pulse("t6", 9.6); S.pulse("u6", 9.9);
      }),
  ];
  return { build, steps };
}

/* ── THE EIGHT TIMES TABLE: a line under 8 × 5, where it repeats ─────────── */
function eightsSteps() {
  const T = tableStage(8, [4]);
  const steps = [
    T.step("Here is the secret of the eight times table. First, write the ten sums down the page.", (S) => T.sums(S)),
    T.step("Start with the tens. Count from 0 down the first five rows. 0, 1, 2, 3, 4.",
      (S) => { for (let i = 0; i < 5; i++) S.pop(`t${i}`, 0.9 + i * 0.6); }),
    T.step("Rule a line. Below the line, start again from the same 4. 4, 5, 6, 7, 8.",
      (S) => { S.pop("k4", 0.2); for (let i = 5; i < 10; i++) S.pop(`t${i}`, 1.4 + (i - 5) * 0.6); S.pulse("t4", 1.2); }),
    T.step("Now the units. Count UP the page, in twos, starting from the bottom. 0, 2, 4, 6, 8.",
      (S) => { for (let i = 9; i >= 5; i--) S.pop(`u${i}`, 1.2 + (9 - i) * 0.6); }),
    T.step("At the line the count starts again. 0, 2, 4, 6, 8.",
      (S) => { S.pulse("k4", 0.2); for (let i = 4; i >= 0; i--) S.pop(`u${i}`, 0.9 + (4 - i) * 0.6); }),
    T.step("Read across. 8, 16, 24, 32, 40, 48, 56, 64, 72, 80. That is the whole eight times table.", (S) => T.read(S)),
    T.step("The line is where the pattern repeats. Five eights are exactly 40, so the next one, 48, is still in the forties.",
      (S) => { T.only(S, [4, 5]); S.pulse("t4", 0.6); S.pulse("t5", 1.4); }),
    T.step("And for just one of them, remember that 8 is 2 times 2 times 2. Double three times. For 8 times 7: 14, 28, 56.",
      (S) => { T.only(S, [6]); S.pulse("s6", 0.4); S.pulse("t6", 2.6); S.pulse("u6", 2.6); }),
  ];
  return { build: T.build, steps };
}

/* ── THE SEVEN TIMES TABLE: three at a time, a line after each three ─────── */
function sevensSteps() {
  const T = tableStage(7, [2, 5, 8]);
  const steps = [
    T.step("Here is the secret of the seven times table. First, write the ten sums down the page.", (S) => T.sums(S)),
    T.step("The tens go three at a time. 0, 1, 2.",
      (S) => { for (let i = 0; i < 3; i++) S.pop(`t${i}`, 0.8 + i * 0.6); }),
    T.step("Rule a line, and say the last number again. 2, 3, 4.",
      (S) => { S.pop("k2", 0.2); S.pulse("t2", 1); for (let i = 3; i < 6; i++) S.pop(`t${i}`, 1.5 + (i - 3) * 0.6); }),
    T.step("Another line, and the last number again. 4, 5, 6. One more line, and 7 for the last row.",
      (S) => { S.pop("k5", 0.2); S.pulse("t5", 1); for (let i = 6; i < 9; i++) S.pop(`t${i}`, 1.5 + (i - 6) * 0.6); S.pop("k8", 3.6); S.pop("t9", 4.4); }),
    /* the units are counted from the smallest to the biggest: the last sum, then the last
       row of each three, then the second rows, then the first rows */
    T.step("Now the units. Count from 0 to 9, smallest to biggest. 0 goes in the last sum.", (S) => S.pop("u9", 2.4)),
    T.step("1, 2, 3 go in the LAST row of each three.",
      (S) => { [2, 5, 8].forEach((i, k) => S.pop(`u${i}`, 0.8 + k * 0.7)); }),
    T.step("4, 5, 6 go in the SECOND rows.",
      (S) => { [1, 4, 7].forEach((i, k) => S.pop(`u${i}`, 0.8 + k * 0.7)); }),
    T.step("And 7, 8, 9 go in the FIRST rows.",
      (S) => { [0, 3, 6].forEach((i, k) => S.pop(`u${i}`, 0.8 + k * 0.7)); }),
    T.step("Read across. 7, 14, 21, 28, 35, 42, 49, 56, 63, 70. That is the whole seven times table.", (S) => T.read(S)),
    T.step("And for just one of them, remember that 7 is 5 and 2. For 7 times 6: five sixes are 30, two sixes are 12, and that makes 42.",
      (S) => { T.only(S, [5]); S.pulse("s5", 0.4); S.pulse("t5", 3); S.pulse("u5", 3); }),
  ];
  return { build: T.build, steps };
}

/* ── THE SIX TIMES TABLE: a line under 6 × 5; the units up the page in fours ── */
function sixesSteps() {
  const T = tableStage(6, [4]);
  const steps = [
    T.step("Here is the secret of the six times table. First, write the ten sums down the page.", (S) => T.sums(S)),
    T.step("Start with the tens, down the first five rows. 0, 1, 1, 2, 3. The 1 comes twice.",
      (S) => { for (let i = 0; i < 5; i++) S.pop(`t${i}`, 0.9 + i * 0.6); S.pulse("t1", 4.4); S.pulse("t2", 4.7); }),
    T.step("Rule a line. Below it, start from the same 3. 3, 4, 4, 5, 6. This time the 4 comes twice.",
      (S) => { S.pop("k4", 0.2); S.pulse("t4", 1.2); for (let i = 5; i < 10; i++) S.pop(`t${i}`, 1.6 + (i - 5) * 0.6); S.pulse("t6", 5.2); S.pulse("t7", 5.5); }),
    /* the units are the even numbers, written in order — 2 4 6 8 0 — each beside its own sum */
    T.step("Now the units. They are the even numbers, and they are written in order: 2, 4, 6, 8, 0. 2 goes beside 6 times 2, and 4 beside 6 times 4.",
      (S) => { S.pop("u1", 4.2); S.pop("u3", 6.4); }),
    T.step("6 goes at the top, beside 6 times 1. 8 goes beside 6 times 3. And 0 beside 6 times 5.",
      (S) => { S.pop("u0", 1.2); S.pop("u2", 3.2); S.pop("u4", 5); }),
    T.step("Below the line it is the same again. 2, 4, 6, 8, 0.",
      (S) => { S.pulse("k4", 0.2); [6, 8, 5, 7, 9].forEach((i, k) => S.pop(`u${i}`, 1.4 + k * 0.6)); }),
    T.step("Read across. 6, 12, 18, 24, 30, 36, 42, 48, 54, 60. That is the whole six times table.", (S) => T.read(S)),
    T.step("The line is where the pattern repeats. Five sixes are exactly 30, so everything below the line is 30 more than the row above it.",
      (S) => { T.only(S, [0, 5]); S.pulse("t0", 0.6); S.pulse("u0", 0.6); S.pulse("t5", 1.6); S.pulse("u5", 1.6); }),
    T.step("And for just one of them, remember that 6 is 5 and 1. For 6 times 7: five sevens are 35, and one more seven makes 42.",
      (S) => { T.only(S, [6]); S.pulse("s6", 0.4); S.pulse("t6", 3); S.pulse("u6", 3); }),
  ];
  return { build: T.build, steps };
}

/* ── THE FOUR TIMES TABLE: a line under 4 × 5 ────────────────────────────── */
function foursSteps() {
  const T = tableStage(4, [4]);
  const steps = [
    T.step("Here is the secret of the four times table. First, write the ten sums down the page.", (S) => T.sums(S)),
    T.step("Start with the tens. Down the first five rows they go 0, 0, 1, 1, 2.",
      (S) => { for (let i = 0; i < 5; i++) S.pop(`t${i}`, 3.4 + i * 0.6); }),
    T.step("Rule a line. Below the line, start again from the same 2. 2, 2, 3, 3, 4.",
      (S) => { S.pop("k4", 0.2); S.pulse("t4", 1.2); for (let i = 5; i < 10; i++) S.pop(`t${i}`, 3.6 + (i - 5) * 0.6); }),
    T.step("Now the units. Count in fours, and write only the last figure. 4, 8, 12, 16, 20. So 4, 8, 2, 6, 0.",
      (S) => { for (let i = 0; i < 5; i++) S.pop(`u${i}`, 4.2 + i * 0.75); }),
    T.step("Below the line it is the same again. 4, 8, 2, 6, 0.",
      (S) => { S.pulse("k4", 0.2); for (let i = 5; i < 10; i++) S.pop(`u${i}`, 2.4 + (i - 5) * 0.6); }),
    T.step("Read across. 4, 8, 12, 16, 20, 24, 28, 32, 36, 40. That is the whole four times table.", (S) => T.read(S)),
  ];
  return { build: T.build, steps };
}

/* ── THE FOURS' SECOND TRICK: TWO W's, and 40 by itself ────────────────────
   No table here: only the two W's. Twos are counted ALONG each W for the
   units; then the tens are written in front — 0 0 0 across the first W's
   top, 1 1 across its bottom, 2 2 2 and 3 3 on the second — and the numbers
   are read off, top then bottom, into a row beneath.
   A W is drawn afresh for every number written on it (states 0 to 10: bare,
   five units, three top tens, two bottom tens) and the states are swapped. */
function fourwSteps() {
  const ALONG = ["0", "2", "4", "6", "8"];
  const TOPS = [0, 2, 4], BOTS = [1, 3];
  const WX = [27, 73], WY = 33, RY = 74;
  const state = (w, k) => {
    const tens = ["", "", "", "", ""];
    TOPS.forEach((pt, j) => { if (k >= 6 + j) tens[pt] = String(2 * w); });
    BOTS.forEach((pt, j) => { if (k >= 9 + j) tens[pt] = String(2 * w + 1); });
    return wSvg({ labels: ALONG.map((d, i) => (i < k ? d : "")), tens });
  };
  /* the row the W's are read into: top then bottom, W by W */
  const READ = [0, 4, 8, 12, 16, 20, 24, 28, 32, 36];
  const rx = (i) => WX[i < 5 ? 0 : 1] + ((i % 5) - 2) * 7.2;
  const build = (stage) => {
    stage.innerHTML = `<div class="vm-tv"></div>`;
    [0, 1].forEach((w) => { for (let k = 0; k <= 10; k++) {
      const box = tile(stage, `w${w}_${k}`, "", WX[w], WY, { bare: true });
      box.firstChild.className = "vm-t__in vm-t__art";
      box.firstChild.style.width = "calc(var(--u) * 36)";
      box.firstChild.innerHTML = state(w, k);
    } });
    READ.forEach((v, i) => tile(stage, `r${i}`, String(v), rx(i), RY, { c: i < 5 ? 3 : 1 }));
    tile(stage, "r10", "40", 50, 91, { c: 2, size: "l" });
  };
  /** both W's as a step begins: each in its own state (−1 = not drawn yet), `read` numbers of the row out */
  const lay = (S, a, b2, read = 0, forty = false) => {
    [a, b2].forEach((k, w) => { for (let j = 0; j <= 10; j++) S.put(`w${w}_${j}`, { on: j === k ? 1 : 0 }); });
    READ.forEach((_, i) => S.put(`r${i}`, { on: i < read ? 1 : 0 }));
    S.put("r10", { on: forty ? 1 : 0 });
  };
  /** W number w goes from state `from` on to state `to`, one number at a time */
  const write = (S, w, from, to, at, gap = 0.6) => { for (let k = from + 1; k <= to; k++) { S.dim(`w${w}_${k - 1}`, 0, at + (k - from - 1) * gap); S.dim(`w${w}_${k}`, 1, at + (k - from - 1) * gap); } };
  const step = (say, fn) => ({ say, show(stage, how) { fn(acts(stage, how.gsap, how.instant)); } });
  const steps = [
    step("Here is a second trick for the four times table: the W. Draw two big W's.",
      (S) => { lay(S, -1, -1); S.pop("w0_0", 3.6); S.pop("w1_0", 4.4); }),
    step("Remember how to count in twos? Write that along the first W. 0, 2, 4, 6, 8.",
      (S) => { lay(S, 0, 0); write(S, 0, 0, 5, 4.4); }),
    step("And again along the second W. 0, 2, 4, 6, 8. Those are the units.",
      (S) => { lay(S, 5, 0); write(S, 1, 0, 5, 2.6); }),
    step("Now the tens. Go across the top of the first W, and write 0, 0, 0.",
      (S) => { lay(S, 5, 5); write(S, 0, 5, 8, 4.4, 0.7); }),
    step("Then across the bottom of it, and write 1, 1.",
      (S) => { lay(S, 8, 5); write(S, 0, 8, 10, 2.8, 0.7); }),
    step("On to the second W. Across the top, 2, 2, 2.",
      (S) => { lay(S, 10, 5); write(S, 1, 5, 8, 2.8, 0.7); }),
    step("And across the bottom, 3, 3.",
      (S) => { lay(S, 10, 8); write(S, 1, 8, 10, 1.8, 0.7); }),
    step("Now read the first W: across the top, then the bottom. 0, 4, 8, 12, 16.",
      (S) => { lay(S, 10, 10); for (let i = 0; i < 5; i++) S.pop(`r${i}`, 4.6 + i * 0.6); }),
    step("And the second W the same way. 20, 24, 28, 32, 36.",
      (S) => { lay(S, 10, 10, 5); for (let i = 5; i < 10; i++) S.pop(`r${i}`, 2.6 + (i - 5) * 0.6); }),
    step("One more stands by itself, to finish the table. 40.",
      (S) => { lay(S, 10, 10, 10); S.pop("r10", 3.2); }),
  ];
  return { build, steps };
}

/* ── THE SIXES' SECOND TRICK: THE DIAGONALS, and 60 by itself ──────────────
   Twos are counted stepping down a diagonal — 0, 2, 4 — then from the top
   again down a second — 6, 8. Twice. Read row by row (0 6 / 2 8 / 4) those
   are the units; the tens go in front the same way, 0 0 1 1 2 and 3 3 4 4 5;
   and the numbers are read off into a row beneath. No table is on screen. */
function sixdSteps() {
  const WRITE = [0, 2, 4, 6, 8], READ = [0, 6, 2, 8, 4];
  const OFF = { 0: [0, 0], 2: [7, 11], 4: [14, 22], 6: [14, 0], 8: [21, 11] };
  const ORG = [[14, 13], [54, 29]];
  const at = (w, u) => [ORG[w][0] + OFF[u][0], ORG[w][1] + OFF[u][1]];
  const rx = (i) => 9 + i * 8.6;
  const build = (stage) => {
    stage.innerHTML = `<div class="vm-tv"></div>`;
    [0, 1].forEach((w) => WRITE.forEach((u) => {
      const [x, y] = at(w, u);
      tile(stage, `u${w}_${u}`, String(u), x, y, { c: 4, size: "l" });
      tile(stage, `t${w}_${u}`, String(Math.floor((30 * w + 6 * READ.indexOf(u)) / 10)), x - 3.7, y, { c: 3, size: "l" });
    }));
    for (let i = 0; i < 10; i++) tile(stage, `r${i}`, String(6 * i), rx(i), 77, { c: i < 5 ? 3 : 1 });
    tile(stage, "r10", "60", 50, 91, { c: 2, size: "l" });
  };
  const step = (say, fn) => ({ say, show(stage, how) { fn(acts(stage, how.gsap, how.instant)); } });
  const units = (S, w, list, at0, gap = 0.65) => list.forEach((u, k) => S.pop(`u${w}_${u}`, at0 + k * gap));
  const tens = (S, w, at0) => READ.forEach((u, k) => { S.pop(`t${w}_${u}`, at0 + k * 0.7); S.pulse(`u${w}_${u}`, at0 + k * 0.7); });
  const steps = [
    step("Here is a second trick for the six times table: the diagonals. Start with 0.", (S) => S.pop("u0_0", 3.8)),
    step("Count in twos, stepping down a diagonal. 0, 2, 4.", (S) => { S.pulse("u0_0", 2.8); units(S, 0, [2, 4], 3.4); }),
    step("Go back to the top, beside the 0, and carry on down a second diagonal. 6, 8.", (S) => units(S, 0, [6, 8], 5)),
    step("Now do it all again, for a second set. 0, 2, 4. 6, 8.", (S) => units(S, 1, WRITE, 3.4)),
    step("Those are the units. Read them row by row. 0, 6. 2, 8. 4.",
      (S) => READ.forEach((u, k) => { S.pulse(`u0_${u}`, 3.6 + k * 0.7); S.pulse(`u1_${u}`, 3.6 + k * 0.7); })),
    step("Now the tens, going the same way, row by row. In the first set: 0, 0. 1, 1. 2.", (S) => tens(S, 0, 5.2)),
    step("In the second set: 3, 3. 4, 4. 5.", (S) => tens(S, 1, 1.8)),
    step("Read the first set, row by row. 0, 6, 12, 18, 24.", (S) => { for (let i = 0; i < 5; i++) { S.pulse(`u0_${READ[i]}`, 3 + i * 0.6); S.pop(`r${i}`, 3 + i * 0.6); } }),
    step("And the second set the same way. 30, 36, 42, 48, 54.", (S) => { for (let i = 0; i < 5; i++) { S.pulse(`u1_${READ[i]}`, 2.6 + i * 0.6); S.pop(`r${5 + i}`, 2.6 + i * 0.6); } }),
    step("One more stands by itself, to finish the table. 60.", (S) => S.pop("r10", 3.2)),
  ];
  return { build, steps };
}

/* ── ONE FACT ON COUNTING STICKS: the sixes, the sevens, the fours ─────────
   k × n with n sticks. They are counted UP IN FIVES (5, 10, 15 …), and then
   the SAME sticks are counted again, carrying on from there: in ones for the
   sixes (6 = 5 + 1), in twos for the sevens (7 = 5 + 2), and going BACK in
   ones for the fours (4 = 5 − 1). No table is on the screen: only the sum,
   the sticks, and the two counts written under them. */
function countSticksSteps(k) {
  const d = k - 5;                                   // what each stick adds the second time round: 1, 2 or −1
  const [N1, N2] = k === 7 ? [6, 3] : [7, 4];        // the two sums that are counted out
  const how = d === 1 ? "carrying on in ones" : d === 2 ? "carrying on in twos" : "going back in ones";
  const why = d === 1 ? "6 is 5 and 1" : d === 2 ? "7 is 5 and 2" : "4 is 5 take away 1";
  const sx = (i, n) => 50 + (i - (n - 1) / 2) * 7.5;
  const SY = 42, NY = 27, AY = 60, BY = 72;
  const ten = (fn) => { for (let i = 0; i < 10; i++) fn(i); };
  const list = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join(", ");
  const build = (stage) => {
    stage.innerHTML = `<div class="vm-tv"></div>`;
    tile(stage, "q", "", 50, 11, { c: 0, size: "l" });
    ten((i) => {
      tile(stage, `st${i}`, "", 50, SY, { bare: true }).firstChild.className = "vm-t__in vm-t__stick";
      tile(stage, `n${i}`, String(i + 1), 50, NY, { bare: true, size: "s" });
      tile(stage, `a${i}`, "", 50, AY, { c: 3 });
      tile(stage, `b${i}`, "", 50, BY, { c: 4 });
    });
    tile(stage, "ans", "", 50, 88, { c: 2, size: "l" });
  };
  /** The screen as a step begins: the sum k × n, `out` of its n sticks laid, the first `fives` counted in
      fives and the first `more` counted the second time, and the answer written or not. */
  const lay = (S, n, { out = n, fives = 0, more = 0, ans = false, q = true } = {}) => {
    S.put("q", { on: q ? 1 : 0, text: `${k} × ${n}` });
    S.put("ans", { on: ans ? 1 : 0, text: `= ${k * n}` });
    ten((i) => {
      const x = sx(i, n);
      S.put(`st${i}`, { on: i < out ? 1 : 0, x, y: SY, tone: i < more ? "units" : i < fives ? "tens" : "plain" });
      S.put(`n${i}`, { on: i < out ? 1 : 0, x, y: NY });
      S.put(`a${i}`, { on: i < fives ? 1 : 0, x, y: AY, text: String(5 * (i + 1)) });
      S.put(`b${i}`, { on: i < more ? 1 : 0, x, y: BY, text: String(5 * n + d * (i + 1)) });
    });
  };
  const sticks = (S, n, at) => { for (let i = 0; i < n; i++) { S.pop(`st${i}`, at + i * 0.48); S.pop(`n${i}`, at + i * 0.48); } };
  const fives = (S, n, at) => { for (let i = 0; i < n; i++) { S.paint(`st${i}`, "tens", at + i * 0.55); S.pop(`a${i}`, at + i * 0.55); } };
  const more = (S, n, at) => { for (let i = 0; i < n; i++) { S.paint(`st${i}`, "units", at + i * 0.6); S.pop(`b${i}`, at + i * 0.6); } };
  const step = (say, fn) => ({ say, show(stage, how2) { fn(acts(stage, how2.gsap, how2.instant)); } });
  const steps = [
    step(`Here is how to get one fact of the ${k} times table with counting sticks. ${why}.`,
      (S) => { lay(S, N1, { out: 0, q: false }); S.pop("q", 0.5); }),
    step(`For ${k} times ${N1}, lay out ${N1} sticks. ${list(N1, (i) => i + 1)}.`,
      (S) => { lay(S, N1, { out: 0 }); sticks(S, N1, 3.6); }),
    step(`Count the sticks up in fives. ${list(N1, (i) => 5 * (i + 1))}.`,
      (S) => { lay(S, N1); fives(S, N1, 2.6); }),
    step(`Now count the same sticks again, ${how}. ${list(N1, (i) => 5 * N1 + d * (i + 1))}.`,
      (S) => { lay(S, N1, { fives: N1 }); more(S, N1, 3.8); }),
    step(`So ${k} times ${N1} is ${k * N1}.`,
      (S) => { lay(S, N1, { fives: N1, more: N1 }); S.pulse(`b${N1 - 1}`, 0.4); S.pop("ans", 1.2); }),
    step(`Try another. For ${k} times ${N2}, lay out ${N2} sticks, and count them up in fives. ${list(N2, (i) => 5 * (i + 1))}.`,
      (S) => { lay(S, N2, { out: 0 }); sticks(S, N2, 2.4); fives(S, N2, 7.2); }),
    step(`Then the same sticks again, ${how}. ${list(N2, (i) => 5 * N2 + d * (i + 1))}. So ${k} times ${N2} is ${k * N2}.`,
      (S) => { lay(S, N2, { fives: N2 }); more(S, N2, 3.6); S.pop("ans", 3.6 + N2 * 0.6 + 1.6); }),
  ];
  return { build, steps };
}

/* ── THE FIVE TIMES TABLE: two at a time, a line after each two ──────────── */
function fivesSteps() {
  const T = tableStage(5, [1, 3, 5, 7]);
  const pair = (S, k, at) => { S.pop(`t${2 * k}`, at); S.pop(`t${2 * k + 1}`, at + 0.6); };
  const steps = [
    T.step("Here is the secret of the five times table. First, write the ten sums down the page.", (S) => T.sums(S)),
    T.step("The tens go two at a time. 0, 1.", (S) => pair(S, 0, 0.8)),
    T.step("Rule a line, and say the last number again. 1, 2.", (S) => { S.pop("k1", 0.2); S.pulse("t1", 0.9); pair(S, 1, 1.5); }),
    T.step("Another line, and the last number again. 2, 3. Then 3, 4. Then 4, 5.",
      (S) => { S.pop("k3", 0.2); pair(S, 2, 0.8); S.pop("k5", 2.2); pair(S, 3, 2.8); S.pop("k7", 4.2); pair(S, 4, 4.8); }),
    T.step("Now the units. There are only two of them, 0 and 5. The smaller first: 0 goes in the SECOND row of every two.",
      (S) => { [1, 3, 5, 7, 9].forEach((i, k) => S.pop(`u${i}`, 2.6 + k * 0.5)); }),
    T.step("And 5 goes in the FIRST row of every two.",
      (S) => { [0, 2, 4, 6, 8].forEach((i, k) => S.pop(`u${i}`, 0.8 + k * 0.5)); }),
    T.step("Read across. 5, 10, 15, 20, 25, 30, 35, 40, 45, 50. That is the whole five times table.", (S) => T.read(S)),
    T.step("And for just one of them, remember that 5 is half of 10. For 5 times 7: ten sevens are 70, and half of 70 is 35.",
      (S) => { T.only(S, [6]); S.pulse("s6", 0.4); S.pulse("t6", 3); S.pulse("u6", 3); }),
  ];
  return { build: T.build, steps };
}

let tvOpen = false;

async function explain(strip) {
  if (tvOpen) return;
  let data = null;
  try { data = JSON.parse(strip.dataset.explain); } catch { /* nothing to show */ }
  if (!data || !data.scene) return;
  const made = data.scene.kind === "nines" ? ninesSteps()
    : data.scene.kind === "eights" ? eightsSteps()
    : data.scene.kind === "sevens" ? sevensSteps()
    : data.scene.kind === "sixes" ? sixesSteps()
    : data.scene.kind === "fives" ? fivesSteps()
    : data.scene.kind === "fours" ? foursSteps()
    : data.scene.kind === "fourw" ? fourwSteps()
    : data.scene.kind === "sixd" ? sixdSteps()
    : /^sticks[467]$/.test(data.scene.kind) ? countSticksSteps(Number(data.scene.kind.slice(-1)))
    : data.scene.kind === "trach" && data.scene.steps.length ? trachSteps(data)
    : data.scene.kind === "strip" && data.scene.expr.length && data.scene.expr.length === data.scene.res.length ? stripSteps(data)
      : textSteps(data);
  if (!made.steps.length) return;
  /* the tiles are sized by the screen: one hundredth of its width is their unit */
  const sized = (stage) => { made.build(stage); stage.querySelector(".vm-tv").style.setProperty("--u", `${stage.clientWidth / 100}px`); };

  tvOpen = true;
  strip.classList.add("is-playing");
  try {
    const { openTv } = await import("/prep-math/mental-math/shared/prepbot-tv.js");
    await openTv({ title: strip.dataset.title || "", build: sized, steps: made.steps });
    const refit = () => { const st = document.querySelector(".mm-tv-overlay [data-tv='stage'] .vm-tv"); if (st) st.style.setProperty("--u", `${st.parentElement.clientWidth / 100}px`); };
    window.addEventListener("resize", refit);
    document.addEventListener("fullscreenchange", refit);
    /* the strip is free again when the set is switched off */
    const watch = new MutationObserver(() => {
      if (document.querySelector(".mm-tv-overlay")) return;
      watch.disconnect();
      window.removeEventListener("resize", refit);
      document.removeEventListener("fullscreenchange", refit);
      tvOpen = false;
      strip.classList.remove("is-playing");
    });
    watch.observe(document.body, { childList: true });
  } catch (err) {
    tvOpen = false;
    strip.classList.remove("is-playing");
    console.error("PrepBot's TV could not be opened", err);
  }
}

if (typeof document !== "undefined" && !document.__vmExplain) {
  document.__vmExplain = true;
  const open = (e) => {
    if (e.target.closest?.(".vm-video__more")) return;      // the link to the full lesson
    const strip = e.target.closest?.(".vm-video[data-explain]");
    if (!strip) return;
    if (e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    explain(strip);
  };
  document.addEventListener("click", open);
  document.addEventListener("keydown", open);
}
