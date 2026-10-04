/* ============================================================================
   Mental Maths Workbook — PREPBOT EXPLAINS each trick
   ----------------------------------------------------------------------------
   Learning with PrepBot (/prep-math/mental-math) is where a trick is TAUGHT:
   PrepBot stands in a TV, and the trick is animated on the screen while it
   talks. PrepBot never explains without its TV. This brings that set onto
   the workbook. On a Skill development paper every section opens with a
   strip that says "PrepBot explains …"; tapped, the TV comes up over the
   paper, the curtain opens, and PrepBot talks the trick through a step at a
   time — first the rule, a line to a card, then the example worked on the
   page, built up on the screen piece by piece as it is explained.

   IT IS THE SAME SET AND THE SAME PREPBOT: /prep-math/mental-math/shared/
   prepbot-tv.js (the TV, its controls, the stepping) and prepbot-teacher.js
   (the character, its voice, its menu, its Ask button into the real chat).
   Nothing here draws a TV or a bot of its own; this file only says what goes
   on the screen.

   What it SAYS and SHOWS is the section's own — its instruction, and the
   "one done for you" taken from the paper itself — so a trick's explanation
   can never drift from its paper. A trick that also has a full animated
   lesson links to it (LESSONS).

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
/** The words of a section's worked example: every "say" paragraph in it. */
function workedLines(html) {
  const out = [];
  String(html || "").replace(/<p class="wb-ask wb-worked__say">([\s\S]*?)<\/p>/g, (_, body) => { out.push(...linesOf(body)); return ""; });
  return out;
}

const FACE = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="11.2" y="1.6" width="1.6" height="3.4" rx="0.8" fill="#2a2723"/><circle cx="12" cy="2" r="1.5" fill="#f0443e"/>` +
  `<rect x="3" y="5" width="18" height="14.6" rx="4.4" fill="#bfe3ff" stroke="#2a2723" stroke-width="1.2"/>` +
  `<circle cx="8.6" cy="11.4" r="2.1" fill="#2a2723"/><circle cx="15.4" cy="11.4" r="2.1" fill="#2a2723"/><circle cx="9.2" cy="10.8" r="0.7" fill="#fff"/><circle cx="16" cy="10.8" r="0.7" fill="#fff"/>` +
  `<path d="M8.6 15.6Q12 17.8 15.4 15.6" fill="none" stroke="#2a2723" stroke-width="1.2" stroke-linecap="round"/></svg>`;
const PLAY = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.4" fill="#2a2723"/><path d="M9.6 7.4v9.2l7.6-4.6z" fill="#fffdf8"/></svg>`;

/** The strip that opens a section: PrepBot, the trick's name, and "watch". */
export function explainStrip(ex, opts) {
  const rule = linesOf(typeof ex.instruction === "function" ? ex.instruction(opts) : ex.instruction);
  const done = ex.worked ? workedLines(ex.worked(opts)) : [];
  const lesson = LESSONS[ex.id];
  return `<div class="vm-video has-video" data-explain="${esc(JSON.stringify({ rule, done }))}" data-title="${esc(ex.label)}" tabindex="0">` +
    `<span class="vm-video__bot">${FACE}</span>` +
    `<span class="vm-video__say"><b>PrepBot explains</b><em>${esc(ex.label)}</em></span>` +
    (lesson ? `<a class="vm-video__more" href="${lesson}" target="_blank" rel="noopener">The full lesson</a>` : "") +
    `<span class="vm-video__go">${PLAY}<i>Watch</i></span></div>`;
}

/* ── what goes on the TV's screen ──────────────────────────────────────── */

/**
 * The worked example as it stands on the paper, taken apart into the PIECES
 * that come onto the screen one after another: each step of a list of steps,
 * each part of a strip, and anything else whole. The words under it are left
 * out — PrepBot says those.
 */
function figureOf(worked) {
  if (!worked) return null;
  const fig = worked.cloneNode(true);
  fig.classList.remove("is-explaining");
  fig.querySelectorAll(".wb-worked__tag, .wb-worked__say, .wb-drawbar").forEach((n) => n.remove());
  const pieces = [];
  /* A line with strips in it — "8 is 2 below 10. [8 − 3 | 2 × 3] → [5 | 6] = 56" — comes on in
     turns: the words before a strip, then each strip (with the arrow or sign in front of it),
     then what follows. Each turn is wrapped so that it can be brought on by itself. */
  const inTurns = (line) => {
    const turns = [];
    let run = [];
    const flush = (extra) => {
      const nodes = extra ? [...run, extra] : run;
      run = [];
      if (!nodes.some((n) => n.nodeType === 1 || n.textContent.trim())) return;
      const wrap = line.ownerDocument.createElement("span");
      wrap.className = "vm-tv__turn";
      nodes[0].parentNode.insertBefore(wrap, nodes[0]);
      nodes.forEach((n) => wrap.appendChild(n));
      turns.push(wrap);
    };
    for (const n of [...line.childNodes]) {
      if (n.nodeType === 1 && n.matches(".vm-strip")) {
        const lead = run.map((x) => x.textContent).join("").trim();
        if (lead.length > 3) { flush(); flush(n); } else flush(n);      // a short lead (an arrow, a sign) rides in with its strip
      } else run.push(n);
    }
    flush();
    return turns;
  };
  const walk = (el, depth) => {
    for (const child of [...el.children]) {
      if (child.querySelector(":scope > .vm-strip")) { pieces.push(...inTurns(child)); continue; }
      const split = depth < 3 && child.children.length > 1 &&
        (child.matches(".vm-steps, .wb-side, .gw-side, .sw-side") || ![...child.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
      if (split && !child.matches("svg, table, mjx-container, .wb-m, .vm-strip")) walk(child, depth + 1);
      else pieces.push(child);
    }
  };
  walk(fig, 0);
  if (!pieces.length) return null;
  pieces.forEach((n, i) => { n.classList.add("vm-tv__piece"); n.dataset.piece = String(i); });
  return { html: fig.innerHTML, count: pieces.length };
}

/** Size the figure to the screen: as big as fits above PrepBot. */
function fit(stage) {
  const fig = stage.querySelector(".vm-tv__fig");
  if (!fig) return;
  fig.style.transform = "none";
  const w = fig.offsetWidth, h = fig.offsetHeight;
  if (!w || !h) return;
  const k = Math.min((stage.clientWidth * 0.92) / w, (stage.clientHeight * 0.66) / h, 2.4);
  fig.style.transform = `translateX(-50%) scale(${k.toFixed(3)})`;
}

let tvOpen = false;

async function explain(strip) {
  if (tvOpen) return;
  let rule = [], done = [];
  try { ({ rule = [], done = [] } = JSON.parse(strip.dataset.explain)); } catch { /* nothing to say */ }
  if (!rule.length && !done.length) return;
  const next = strip.nextElementSibling;
  const figure = figureOf(next && next.classList.contains("wb-worked") ? next : null);

  const build = (stage) => {
    stage.innerHTML = `<div class="vm-tv"><div class="vm-tv__card pp-sticky pp-sticky--c1" hidden></div>` +
      (figure ? `<div class="wb-sheet vm-tv__paper" hidden><div class="vm-tv__fig">${figure.html}</div></div>` : "") + `</div>`;
    fit(stage);
  };
  const card = (stage) => stage.querySelector(".vm-tv__card");
  const paper = (stage) => stage.querySelector(".vm-tv__paper");

  const steps = [
    /* the rule, a line to a card */
    ...rule.map((say, i) => ({
      say,
      show(stage, { gsap, instant }) {
        const c = card(stage);
        c.hidden = false;
        if (paper(stage)) paper(stage).hidden = true;
        c.className = `vm-tv__card pp-sticky pp-sticky--c${i % 6}`;
        c.textContent = say;
        if (!instant && gsap) gsap.fromTo(c, { scale: 0.7, opacity: 0, rotation: -4 }, { scale: 1, opacity: 1, rotation: i % 2 ? 1.2 : -1.2, duration: 0.45, ease: "back.out(1.6)" });
      },
    })),
    /* the one done for you, built up piece by piece — or, with no picture, a card again */
    ...done.map((say, j) => ({
      say,
      show(stage, { gsap, instant }) {
        const c = card(stage), pp = paper(stage);
        if (!pp) {
          c.hidden = false;
          c.className = `vm-tv__card pp-sticky pp-sticky--c${(rule.length + j) % 6}`;
          c.textContent = say;
          if (!instant && gsap) gsap.fromTo(c, { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(1.6)" });
          return;
        }
        c.hidden = true;
        pp.hidden = false;
        fit(stage);
        const upto = Math.ceil(((j + 1) * figure.count) / done.length);
        const fresh = [...pp.querySelectorAll(".vm-tv__piece:not(.is-on)")].filter((n) => Number(n.dataset.piece) < upto);
        fresh.forEach((n) => n.classList.add("is-on"));
        if (!instant && gsap && fresh.length) gsap.fromTo(fresh, { opacity: 0, y: 14, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.5)", stagger: 0.18 });
      },
    })),
  ];
  if (figure && !done.length && steps.length) {
    /* a picture with nothing said under it: it comes up whole with the last line of the rule */
    const last = steps[steps.length - 1], before = last.show;
    last.show = (stage, how) => { before(stage, how); paper(stage).hidden = false; paper(stage).querySelectorAll(".vm-tv__piece").forEach((n) => n.classList.add("is-on")); card(stage).classList.add("is-small"); fit(stage); };
  }

  tvOpen = true;
  strip.classList.add("is-playing");
  try {
    const { openTv } = await import("/prep-math/mental-math/shared/prepbot-tv.js");
    const tv = await openTv({ title: strip.dataset.title || "", build, steps });
    const refit = () => { const st = document.querySelector(".mm-tv-overlay [data-tv='stage']"); if (st) fit(st); };
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
    void tv;
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
