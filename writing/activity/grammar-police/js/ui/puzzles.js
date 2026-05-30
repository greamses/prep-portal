// ============================================================================
// BRAIN-BREAK PUZZLE PAGES — a crossword and a rebus, placed just before the
// section divider. Self-contained: each builder returns a ready .page element
// with its own (directly-attached) interactivity.
// ============================================================================

function pageEl(innerHTML, density = null) {
  const div = document.createElement("div");
  div.className = "page";
  if (density) div.dataset.density = density;
  div.innerHTML = innerHTML;
  return div;
}

// ── Crossword ────────────────────────────────────────────────────────────────
// Sparse 5x5 grid: THEIR (1-across), THERE (1-down), RIGHT (2-down).
// 8 interlocking grammar/punctuation words. Each is placed on the grid; the
// numbering + clue lists are derived automatically from the placements.
const CROSSWORD = {
  rows: 11,
  cols: 12,
  words: [
    { a: "APOSTROPHE", r: 0, c: 2, dir: "across", clue: "The mark ' that shows letters were dropped or that something belongs to someone" },
    { a: "PUNCTUATION", r: 0, c: 3, dir: "down", clue: "Full stops, commas and question marks are all kinds of this" },
    { a: "PERIOD", r: 0, c: 9, dir: "down", clue: "The full stop at the end of a sentence" },
    { a: "NOUN", r: 2, c: 3, dir: "across", clue: "A naming word: a person, place or thing" },
    { a: "THEIR", r: 4, c: 3, dir: "across", clue: "Belonging to them" },
    { a: "ADVERB", r: 6, c: 3, dir: "across", clue: "Describes a verb; often ends in -ly" },
    { a: "ITS", r: 8, c: 3, dir: "across", clue: "Belonging to it (no apostrophe)" },
    { a: "THEN", r: 10, c: 0, dir: "across", clue: "Next in time: “first this, ___ that”" },
  ],
};

function clueList(title, list, numOf) {
  return `<div class="cw-cluecol"><h3>${title}</h3><ol>${list
    .map((w) => `<li><strong>${numOf(w)}.</strong> ${w.clue} (${w.a.length})</li>`)
    .join("")}</ol></div>`;
}

export function makeCrosswordPage() {
  const { rows, cols, words } = CROSSWORD;

  // Lay the words onto a grid.
  const grid = Array.from({ length: rows }, () => Array(cols).fill(null));
  for (const w of words) {
    for (let i = 0; i < w.a.length; i++) {
      const r = w.dir === "down" ? w.r + i : w.r;
      const c = w.dir === "across" ? w.c + i : w.c;
      grid[r][c] = w.a[i];
    }
  }

  // Number every across/down start (standard crossword numbering).
  const numAt = {};
  let n = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!grid[r][c]) continue;
      const aStart = (c === 0 || !grid[r][c - 1]) && c + 1 < cols && grid[r][c + 1];
      const dStart = (r === 0 || !grid[r - 1][c]) && r + 1 < rows && grid[r + 1][c];
      if (aStart || dStart) numAt[`${r},${c}`] = ++n;
    }
  }
  const numOf = (w) => numAt[`${w.r},${w.c}`];
  const across = words.filter((w) => w.dir === "across").sort((a, b) => numOf(a) - numOf(b));
  const down = words.filter((w) => w.dir === "down").sort((a, b) => numOf(a) - numOf(b));

  let gridHTML = `<div class="cw-grid" style="grid-template-columns:repeat(${cols},1fr)">`;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = grid[r][c];
      if (!ch) { gridHTML += `<div class="cw-cell cw-cell--block"></div>`; continue; }
      const num = numAt[`${r},${c}`];
      gridHTML += `<div class="cw-cell">${num ? `<span class="cw-num">${num}</span>` : ""}<input class="cw-input" maxlength="1" autocomplete="off" spellcheck="false" data-answer="${ch}" aria-label="row ${r + 1} column ${c + 1}"></div>`;
    }
  }
  gridHTML += `</div>`;

  const page = pageEl(
    `<div class="pc gp-puzzle gp-c-blue">
      <span class="gp-tab gp-tab--blue">Brain Break</span>
      <header class="gp-puzzle__head"><span class="gp-kicker">Word Puzzle</span><h2>Grammar Crossword</h2></header>
      <div class="cw-wrap">
        ${gridHTML}
        <div class="cw-clues">${clueList("Across", across, numOf)}${clueList("Down", down, numOf)}</div>
      </div>
      <div class="cw-actions">
        <button class="pc-btn pc-btn--ghost" data-cw-reveal>Reveal</button>
        <button class="pc-btn pc-btn--check" data-cw-check>Check</button>
      </div>
    </div>`
  );

  const root = page.querySelector(".pc");
  const inputs = () => [...root.querySelectorAll(".cw-input")];
  // Auto-advance to the next cell as you type.
  inputs().forEach((inp, i, arr) => {
    inp.addEventListener("input", () => {
      inp.value = inp.value.toUpperCase().slice(0, 1);
      inp.classList.remove("cw-input--correct", "cw-input--wrong");
      if (inp.value && arr[i + 1]) arr[i + 1].focus();
    });
  });
  root.querySelector("[data-cw-check]").addEventListener("click", () => {
    inputs().forEach((inp) => {
      if (!inp.value) { inp.classList.remove("cw-input--correct", "cw-input--wrong"); return; }
      const ok = inp.value.toUpperCase() === inp.dataset.answer.toUpperCase();
      inp.classList.toggle("cw-input--correct", ok);
      inp.classList.toggle("cw-input--wrong", !ok);
    });
  });
  root.querySelector("[data-cw-reveal]").addEventListener("click", () => {
    inputs().forEach((inp) => {
      inp.value = inp.dataset.answer;
      inp.classList.add("cw-input--correct");
      inp.classList.remove("cw-input--wrong");
    });
  });
  return page;
}

// ── Rebus riddles ────────────────────────────────────────────────────────────
const REBUS = [
  { emoji: "\u{1F41D} + \u{1F343}", answer: "BELIEVE", hint: "bee + leaf" },
  { emoji: "⭐ + \u{1F41F}", answer: "STARFISH", hint: "star + fish" },
  { emoji: "☀️ + \u{1F338}", answer: "SUNFLOWER", hint: "sun + flower" },
  { emoji: "\u{1F327}️ + \u{1F380}", answer: "RAINBOW", hint: "rain + bow" },
];

export function makeRebusPage() {
  const slides = REBUS.map(
    (it, i) => `
    <div class="rb-slide">
      <div class="rb-emoji">${it.emoji}</div>
      <button class="rb-reveal" data-rb="${i}">Reveal</button>
      <div class="rb-answer" id="rb-ans-${i}" hidden><strong>${it.answer}</strong><span>${it.hint}</span></div>
    </div>`
  ).join("");
  const dots = REBUS.map(
    (_, i) => `<button class="rb-dot${i === 0 ? " is-active" : ""}" data-go="${i}" aria-label="Go to riddle ${i + 1}"></button>`
  ).join("");

  const page = pageEl(
    `<div class="pc gp-puzzle gp-c-purple">
      <span class="gp-tab gp-tab--purple">Brain Break</span>
      <header class="gp-puzzle__head"><span class="gp-kicker">Picture Puzzle</span><h2>Rebus Riddles</h2></header>
      <p class="gp-puzzle__intro">Each picture sounds out a word. Say the pictures aloud, then tap Reveal.</p>
      <div class="rb-carousel">
        <div class="rb-viewport"><div class="rb-track">${slides}</div></div>
        <button class="rb-nav rb-nav--prev" data-dir="-1" aria-label="Previous riddle">&lsaquo;</button>
        <button class="rb-nav rb-nav--next" data-dir="1" aria-label="Next riddle">&rsaquo;</button>
      </div>
      <div class="rb-dots">${dots}</div>
    </div>`
  );

  const root = page.querySelector(".pc");
  const track = root.querySelector(".rb-track");
  const dotEls = [...root.querySelectorAll(".rb-dot")];
  const total = REBUS.length;
  let idx = 0;
  const go = (n) => {
    idx = (n + total) % total;
    track.style.transform = `translateX(-${idx * 100}%)`;
    dotEls.forEach((d, i) => d.classList.toggle("is-active", i === idx));
  };
  root.querySelectorAll(".rb-nav").forEach((btn) =>
    btn.addEventListener("click", (e) => { e.stopPropagation(); go(idx + Number(btn.dataset.dir)); })
  );
  dotEls.forEach((d) =>
    d.addEventListener("click", (e) => { e.stopPropagation(); go(Number(d.dataset.go)); })
  );
  root.querySelectorAll("[data-rb]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const ans = root.querySelector(`#rb-ans-${btn.dataset.rb}`);
      const reveal = ans.hasAttribute("hidden");
      ans.toggleAttribute("hidden", !reveal);
      btn.textContent = reveal ? "Hide" : "Reveal";
    });
  });
  return page;
}
