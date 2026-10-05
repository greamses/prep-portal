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
    dim(id, to = 0.35) {
      const n = inn(id); if (!n) return;
      if (quick) { n.style.opacity = String(to); return; }
      gsap.to(n, { opacity: to, duration: 0.3 });
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

/* ── THE NINE TIMES TABLE: count down the page, count up the page ──────────
   The ten sums in a column. The tens come on one at a time from the TOP,
   0 to 9; the units come on one at a time from the BOTTOM, 0 to 9. Then each
   pair closes up into its answer: 09, 18, 27 … 90. */
function ninesSteps() {
  const ROWS = 10;
  const y = (i) => 9.5 + i * 8.6;
  const X = { sum: 27, tens: 43, units: 47.5, eq: 37.5 };
  const build = (stage) => {
    stage.innerHTML = `<div class="vm-tv"></div>`;
    for (let i = 0; i < ROWS; i++) {
      tile(stage, `s${i}`, `9 × ${i + 1}`, X.sum, y(i), { bare: true, size: "s" });
      tile(stage, `e${i}`, "=", X.eq, y(i), { bare: true, size: "s" });
      /* the numbers counted DOWN the page in one colour, the numbers counted UP it in another */
      tile(stage, `t${i}`, String(i), X.tens, y(i), { c: 3 });
      tile(stage, `u${i}`, String(9 - i), X.units, y(i), { c: 4 });
    }
    tile(stage, "down", "0 to 9, down", X.tens - 9, 96.5, { c: 3, size: "s" });
    tile(stage, "up", "0 to 9, up", X.units + 9, 96.5, { c: 4, size: "s" });
  };
  const all = (fn) => { for (let i = 0; i < ROWS; i++) fn(i); };
  const steps = [
    { say: "Here is the secret of the nine times table. First, write the ten sums down the page.",
      show(stage, how) { const S = acts(stage, how.gsap, how.instant); all((i) => { S.pop(`s${i}`, i * 0.12); S.pop(`e${i}`, i * 0.12); }); } },
    { say: "Now count from 0 to 9, going DOWN the page. 0, 1, 2, 3, 4, 5, 6, 7, 8, 9.",
      show(stage, how) { const S = acts(stage, how.gsap, how.instant); all((i) => S.pop(`t${i}`, 0.3 + i * 0.42)); S.pop("down", 0.2); } },
    { say: "Count from 0 to 9 again, but this time going UP the page. 0, 1, 2, 3, 4, 5, 6, 7, 8, 9.",
      show(stage, how) { const S = acts(stage, how.gsap, how.instant); all((i) => S.pop(`u${ROWS - 1 - i}`, 0.3 + i * 0.42)); S.pop("up", 0.2); } },
    { say: "Read across. 9, 18, 27, 36, 45, 54, 63, 72, 81, 90. That is the whole nine times table, and nothing was multiplied.",
      show(stage, how) {
        const S = acts(stage, how.gsap, how.instant);
        S.hide("down"); S.hide("up");
        all((i) => { S.move(`u${i}`, X.units - 1.6, y(i), i * 0.1); S.pulse(`t${i}`, 0.9 + i * 0.3); S.pulse(`u${i}`, 0.9 + i * 0.3); });
      } },
    { say: "Look at the two digits of any answer. They always add up to 9. 1 and 8. 2 and 7. 3 and 6.",
      show(stage, how) { const S = acts(stage, how.gsap, how.instant); [1, 2, 3].forEach((i, k) => { S.pulse(`t${i}`, 0.4 + k * 0.9); S.pulse(`u${i}`, 0.7 + k * 0.9); }); } },
    { say: "And the first digit is always one less than the number you multiply by. 9 times 7 starts with 6, and 6 needs 3 to make 9. So 9 times 7 is 63.",
      show(stage, how) {
        const S = acts(stage, how.gsap, how.instant);
        all((i) => { const dim = i === 6 ? 1 : 0.3; S.dim(`s${i}`, dim); S.dim(`e${i}`, dim); S.dim(`t${i}`, dim); S.dim(`u${i}`, dim); });
        S.pulse("s6", 0.4); S.pulse("t6", 1.2); S.pulse("u6", 2);
      } },
  ];
  return { build, steps };
}

let tvOpen = false;

async function explain(strip) {
  if (tvOpen) return;
  let data = null;
  try { data = JSON.parse(strip.dataset.explain); } catch { /* nothing to show */ }
  if (!data || !data.scene) return;
  const made = data.scene.kind === "nines" ? ninesSteps()
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
