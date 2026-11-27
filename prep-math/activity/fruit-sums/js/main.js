/* ============================================================================
   FRUIT SUMS — the page
   ----------------------------------------------------------------------------
   Picture sums in the solvemoji style, made by the algebra generator in
   gen.js. Every line is an equation; a fruit is an unknown; two or three of a
   fruit side by side is 2a or 3a. The Letters switch draws the same puzzle as
   algebra, so a child can see the fruit sum IS the equation.

   Above every term is a box for working: what that term is worth (two apples
   at 7 each → 14). The key on the side is the answer — what each fruit is
   worth — and the last line asks for one more total using them.
   ========================================================================== */

import { UI } from "/utils/components/ui-icons.js";
import { mountTooltips, setTip } from "/utils/components/tooltip.js";
import { FRUITS, fruitSvg } from "/utils/components/fruits.js";
import { LEVELS, levelOf, makePuzzle, termValue } from "./gen.js";

const $ = (sel, root = document) => root.querySelector(sel);
const KEEP = "prep-portal:fruit-sums";
const FRUIT_IDS = FRUITS.map((f) => f.id);

const S = {
  level: LEVELS[0].id,
  letters: false,
  work: true,          // the working boxes above the terms
  p: null,
  done: false,
};

function remember() {
  try { localStorage.setItem(KEEP, JSON.stringify({ level: S.level, letters: S.letters, work: S.work })); } catch { /* fine */ }
}
function recall() {
  try {
    const was = JSON.parse(localStorage.getItem(KEEP) || "null");
    if (!was) return;
    if (LEVELS.some((l) => l.id === was.level)) S.level = was.level;
    S.letters = !!was.letters;
    if (typeof was.work === "boolean") S.work = was.work;
  } catch { /* fine */ }
}

const nameOf = (id) => FRUITS.find((f) => f.id === id).name;

/* ── drawing a term ───────────────────────────────────────────────────── */

/* One unknown drawn: k fruits side by side, or "ka" in letters. */
function picture(v, k) {
  const p = S.p;
  if (S.letters) {
    return `<span class="fs-alg">${k > 1 ? `<b>${k}</b>` : ""}<i>${p.letters[v]}</i></span>`;
  }
  const one = `<span class="fs-fruit">${fruitSvg(p.fruits[v])}</span>`;
  return `<span class="fs-group fs-group--${k}">${one.repeat(k)}</span>`;
}

/* The words a screen reader hears for a term: "two mangoes". */
function spoken(t) {
  const p = S.p;
  const word = (v) => (S.letters ? p.letters[v] : nameOf(p.fruits[v]).toLowerCase());
  const lead = t.k > 1 ? `${t.k} ` : "";
  return t.times != null ? `${lead}${word(t.v)} times ${word(t.times)}` : `${lead}${word(t.v)}`;
}

function termHtml(t, row, col) {
  const pic = t.times != null
    ? `${picture(t.v, t.k)}<span class="fs-op fs-op--in">×</span>${picture(t.times, 1)}`
    : picture(t.v, t.k);
  return `<div class="fs-term">
      <input class="fs-box" type="text" inputmode="numeric" autocomplete="off"
             data-row="${row}" data-col="${col}" aria-label="What ${spoken(t)} is worth">
      <div class="fs-pic">${pic}</div>
    </div>`;
}

function lineHtml(terms, row, right) {
  let h = "";
  terms.forEach((t, i) => {
    if (i > 0) h += `<span class="fs-op">${t.s < 0 ? "−" : "+"}</span>`;
    else if (t.s < 0) h += `<span class="fs-op">−</span>`;
    h += termHtml(t, row, i);
  });
  return `<div class="fs-eq" data-row="${row}">${h}<span class="fs-op fs-op--eq">=</span>${right}</div>`;
}

/* ── the board ────────────────────────────────────────────────────────── */

function draw() {
  const p = S.p;
  $("#fs-eqs").innerHTML = p.equations
    .map((e, r) => lineHtml(e.terms, r, `<span class="fs-total">${e.total}</span>`))
    .join("");
  $("#fs-ask").innerHTML = lineHtml(
    p.question.terms,
    "q",
    `<input class="fs-box fs-box--answer" id="fs-answer" type="text" inputmode="numeric" autocomplete="off" aria-label="The answer to the last line">`,
  );
  $("#fs-key").innerHTML = p.fruits
    .map((id, v) => `<label class="fs-key__row">
        <span class="fs-key__pic">${S.letters ? `<span class="fs-alg"><i>${p.letters[v]}</i></span>` : `<span class="fs-fruit">${fruitSvg(id)}</span>`}</span>
        <span class="fs-op">=</span>
        <input class="fs-box fs-box--key" type="text" inputmode="numeric" autocomplete="off"
               data-v="${v}" aria-label="What ${S.letters ? p.letters[v] : nameOf(id).toLowerCase()} is worth">
      </label>`)
    .join("");
  $("#fs-key-label").textContent = S.letters ? "Each letter is worth" : "Each fruit is worth";
  S.done = false;
}

/* Swapping fruits for letters keeps everything the child has typed. */
function redraw() {
  const kept = [...document.querySelectorAll(".fs-box")].map((b) => [b.dataset.row, b.dataset.col, b.dataset.v, b.id, b.value, b.className]);
  draw();
  for (const [row, col, v, id, value, cls] of kept) {
    const sel = id ? `#${id}` : v != null ? `.fs-box--key[data-v="${v}"]` : `.fs-box[data-row="${row}"][data-col="${col}"]`;
    const b = $(sel);
    if (b) { b.value = value; b.className = cls; }
  }
}

function deal() {
  const seed = (Math.floor(Math.random() * 999983) + 1) >>> 0;
  S.p = makePuzzle({ level: S.level, seed, fruits: FRUIT_IDS });
  draw();
  say(S.letters
    ? "Find the value of each letter."
    : "Each fruit stands for a number. Find what each one is worth.");
}

/* ── checking ─────────────────────────────────────────────────────────── */

const read = (b) => {
  const t = b.value.trim();
  return t === "" ? null : Number(t);
};

function mark(b, ok) {
  b.classList.toggle("is-right", ok === true);
  b.classList.toggle("is-wrong", ok === false);
}

function check() {
  const p = S.p;
  let blank = 0;
  let wrong = 0;

  /* the working boxes above the terms: only the ones filled in are marked */
  document.querySelectorAll(".fs-box[data-row]").forEach((b) => {
    if (!S.work) return mark(b, null);
    const n = read(b);
    if (n == null) return mark(b, null);
    const terms = b.dataset.row === "q" ? p.question.terms : p.equations[+b.dataset.row].terms;
    mark(b, n === termValue(terms[+b.dataset.col], p.values));
  });

  document.querySelectorAll(".fs-box--key").forEach((b) => {
    const n = read(b);
    if (n == null) { blank++; return mark(b, null); }
    const ok = n === p.values[+b.dataset.v];
    if (!ok) wrong++;
    mark(b, ok);
  });

  const a = $("#fs-answer");
  const n = read(a);
  if (n == null) { blank++; mark(a, null); }
  else { const ok = n === p.question.answer; if (!ok) wrong++; mark(a, ok); }

  if (!wrong && !blank) {
    S.done = true;
    say("All correct. Every fruit found and the last line answered.", true);
  } else if (wrong) {
    say(wrong === 1 ? "One answer is not right yet. Check it against the lines." : `${wrong} answers are not right yet. Check them against the lines.`);
  } else {
    say("So far so good. Fill in every fruit and the last line.");
  }
}

function say(text, win = false) {
  const el = $("#fs-say");
  el.textContent = text;
  el.classList.toggle("fs-say--win", win);
}

/* ── the bar ──────────────────────────────────────────────────────────── */

function drawLevels() {
  $("#fs-levels").innerHTML = LEVELS.map((l, i) =>
    `<button type="button" role="radio" class="pp-sticky pp-note-btn pp-sticky--c${[0, 2, 4, 1][i]} fs-level" data-level="${l.id}"
             aria-checked="${l.id === S.level}" data-tip="${levelTip(l)}">${l.name}</button>`).join("");
}

function levelTip(l) {
  const groups = l.maxK === 3 ? "single, double and triple fruits" : "single and double fruits";
  const minus = l.minus ? ", some taken away" : "";
  return `${l.fruits} fruits, ${groups}${minus}`;
}

function drawLettersButton() {
  const b = $("#fs-letters");
  const word = S.letters ? "Show fruits" : "Show letters";
  b.innerHTML = S.letters
    ? `<span class="fs-fruit fs-fruit--btn" aria-hidden="true">${fruitSvg("apple")}</span>`
    : `<span class="fs-abc" aria-hidden="true">abc</span>`;
  b.setAttribute("aria-label", word);
  b.setAttribute("aria-pressed", String(S.letters));
  setTip(b, word);
  b.dataset.tip = word;
}

/* The working boxes come and go with a switch; what is typed in them stays,
   and a hidden box is never marked. */
function drawWorkButton() {
  const b = $("#fs-work");
  const word = S.work ? "Hide the working boxes" : "Show the working boxes";
  b.innerHTML = WORK_ICON;
  b.classList.toggle("is-off", !S.work);
  b.setAttribute("aria-label", word);
  b.setAttribute("aria-pressed", String(S.work));
  setTip(b, word);
  b.dataset.tip = word;
  document.querySelector(".fs-board").classList.toggle("fs-board--bare", !S.work);
}

/* A box over a fruit: the working box, in our own drawing. */
const WORK_ICON = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`
  + `<rect x="3" y="1.4" width="18" height="9.4" rx="1.4" fill="var(--accent-secondary)"/>`
  + `<rect x="7" y="5" width="10" height="2.4" rx="1.2" fill="#fff"/>`
  + `<circle cx="12" cy="17.4" r="5.4" fill="var(--accent-danger)"/>`
  + `<circle cx="10.2" cy="15.6" r="1.3" fill="#fff" opacity=".7"/></svg>`;

function iconButton(sel, glyph, word) {
  const b = $(sel);
  b.innerHTML = glyph;
  b.setAttribute("aria-label", word);
  setTip(b, word);
}

/* Enter in a box moves on to the next one, the way a written sum is worked. */
function onKey(e) {
  if (e.key !== "Enter" || !e.target.classList.contains("fs-box")) return;
  e.preventDefault();
  const all = [...document.querySelectorAll(".fs-box")].filter((x) => x.offsetParent !== null);
  const next = all[all.indexOf(e.target) + 1];
  if (next) next.focus();
  else check();
}

function init() {
  recall();
  $("#fs-eyebrow-icon").innerHTML = fruitSvg("pineapple");
  drawLevels();
  drawLettersButton();
  drawWorkButton();
  iconButton("#fs-check", UI.check(), "Check my answers");
  iconButton("#fs-new", UI.again(), "New puzzle");
  mountTooltips();

  $("#fs-levels").addEventListener("click", (e) => {
    const b = e.target.closest(".fs-level");
    if (!b) return;
    S.level = b.dataset.level;
    remember();
    document.querySelectorAll(".fs-level").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
    deal();
  });
  $("#fs-letters").addEventListener("click", () => {
    S.letters = !S.letters;
    remember();
    drawLettersButton();
    redraw();
  });
  $("#fs-work").addEventListener("click", () => {
    S.work = !S.work;
    remember();
    drawWorkButton();
  });
  $("#fs-check").addEventListener("click", check);
  $("#fs-new").addEventListener("click", deal);

  /* only digits (and a minus at the front) in a box; typing clears a mark */
  document.addEventListener("input", (e) => {
    const b = e.target;
    if (!b.classList?.contains("fs-box")) return;
    const clean = b.value.replace(/[^\d-]/g, "").replace(/(?!^)-/g, "").slice(0, 5);
    if (clean !== b.value) b.value = clean;
    mark(b, null);
  });
  document.addEventListener("keydown", onKey);

  deal();
}

init();
