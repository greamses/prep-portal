/* ═══════════════════════════════════════════════════════════════════════════
   THE FORMULA PICKER

   The other half of the drawer. Typing a line is one way to get a problem onto
   the canvas; the other is to pick a formula and say what you were given.

   The form is the question as it is asked on paper — every letter listed with
   what it stands for, all but one filled in — and the one left blank is what
   you are looking for. That is the whole of the input, and it is enough: the
   card that comes out is an ordinary equation card with a set of values pinned
   to it, and every move after that is the ordinary move set.

   IT STARTS EMPTY. The numbers are the student's question, not ours; a form
   that arrives already filled in is a worked example, and it reads as though
   the formula only comes with those values. The bank still carries a set (they
   are what the sweep solves every formula with), and there is a button to drop
   them in — but you have to ask for them.

   The one thing this does that no other panel does is CHECK ITSELF. Whenever
   the blank moves, it runs the solver over what the form currently says and
   reports whether the moves on offer can actually finish it. Leaving out the r
   in A = (22/7)r² needs a square root, which is not a move here — and telling a
   student that before they start beats letting them find out four lines in.
   ═══════════════════════════════════════════════════════════════════════════ */

import { RULE_GROUPS } from "./rules.js";
import { GROUPS, readValue, exampleGivens } from "./formulas.js";
import { parse } from "./parse.js";
import { buildRow, paintRow } from "./render.js";
import { solve } from "./solve.js";
import { enhanceSelect } from "/utils/components/pp-select.js";

/* Words that should find each other — searching "circle" ought to turn up the
   sector and the cylinder, "money" the interest and the profit. Kept short:
   everything else is found by the formulas' own names, notes and letters. */
const RELATED = {
  circle: ["radius", "sector", "cylinder", "sphere", "cone", "ellipse", "22/7"],
  round: ["circle", "radius"],
  pi: ["22/7", "π"],
  π: ["22/7"],
  speed: ["velocity", "distance", "time"],
  velocity: ["speed"],
  motion: ["speed", "acceleration", "force", "distance"],
  money: ["interest", "profit", "cost", "price"],
  quadratic: ["roots", "vertex", "discriminant"],
  roots: ["quadratic"],
  solid: ["volume", "surface", "cube", "cuboid", "cylinder", "sphere", "cone", "pyramid"],
  "3d": ["volume", "surface"],
  capacity: ["volume"],
  electricity: ["voltage", "current", "resistance", "ohm"],
  temperature: ["celsius", "fahrenheit"],
  trig: ["trigonometry", "sin", "cos", "tan", "angle", "hypotenuse"],
  angle: ["trigonometry", "sin", "cos", "tan"],
  sine: ["sin", "trigonometry"],
  cosine: ["cos", "trigonometry"],
  calculus: ["gradient", "slope", "area", "d/dx", "∫", "lim"],
  derivative: ["calculus", "gradient", "d/dx"],
  differentiate: ["calculus", "gradient", "d/dx"],
  integral: ["calculus", "area", "∫"],
  integrate: ["calculus", "area", "∫"],
  limit: ["calculus", "first principles", "lim"],
  polygon: ["apothem", "rhombus", "parallelogram", "square", "triangle"],
};
const related = (w) => [w, ...(RELATED[w] || [])];

/** Everything a search can match a formula on, in one lowercase string. */
const haystack = (f, group) => [
  f.name, group, f.eq, f.note || "",
  ...Object.entries(f.letters).flat(),
].join(" ").toLowerCase();

/** The shared dropdown's stylesheet, on whichever page this picker lands —
    its own page and the workbooks' sidebar both mount it. */
function ensureSelectStyles() {
  if (document.querySelector('link[href$="/utils/components/select.css"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/utils/components/select.css";
  document.head.appendChild(link);
}

/** The formula, drawn in the same hand the canvas writes in. A rule stated
    as "this, so that" is drawn a piece at a time with the words between. */
function drawn(src, size) {
  const holder = document.createElement("div");
  holder.className = "am-fx__ink";
  const parts = src.split(/(, so | or )/);
  for (const part of parts) {
    if (part === ", so " || part === " or ") {
      const w = document.createElement("span");
      w.className = "am-fx__word";
      w.textContent = part.replace(",", "").trim();
      holder.appendChild(w);
      continue;
    }
    try {
      holder.appendChild(paintRow(buildRow(parse(part), size), { live: false }));
    } catch {
      const t = document.createElement("span");
      t.textContent = part;
      holder.appendChild(t);
    }
  }
  return holder;
}

export function createFormulaPicker(host, { onSubmit, onRule } = {}) {
  // A working copy: admin-added formulas (see formula-admin.js) join it at
  // runtime, either into a group already here or a new one of their own —
  // the static bank itself is never mutated. The rules (rules.js) are in the
  // same book, after the formulas.
  const allGroups = [...GROUPS, ...(onRule ? RULE_GROUPS : [])].map((g) => ({ group: g.group, items: [...g.items] }));

  let group = allGroups[0].group;    // "" means every group
  let chosen = null;
  const fields = new Map();          // letter -> input

  /* A shelf of fifty formulas will not fit in a row of chips. A dropdown
     picks the group; the search box looks EVERYWHERE — the name, the group,
     the formula, its note, and what every letter stands for — so "radius",
     "money" or "quadratic" all find what they should. */
  ensureSelectStyles();
  const bar = document.createElement("div");
  bar.className = "am-fx__bar";
  const search = document.createElement("input");
  search.type = "search";
  search.className = "am-fx__search";
  search.placeholder = "Search: area, speed, chain rule, indices…";
  search.autocomplete = "off";
  search.spellcheck = false;
  search.setAttribute("aria-label", "Search the formulas");
  const select = document.createElement("select");
  select.className = "am-fx__select";
  select.setAttribute("aria-label", "Which group of formulas");
  bar.append(search, select);

  const count = document.createElement("p");
  count.className = "am-fx__count";

  const list = document.createElement("div");
  list.className = "am-fx__list";

  const form = document.createElement("div");
  form.className = "am-fx__form";
  form.hidden = true;

  host.append(bar, count, list, form);
  enhanceSelect(select, { className: "pp-select--sm" });

  search.addEventListener("input", paintList);
  select.addEventListener("change", () => { group = select.value; paintList(); });

  /** The group dropdown, rebuilt whenever the shelf grows (admin formulas). */
  function buildTabs() {
    const total = allGroups.reduce((n, g) => n + g.items.length, 0);
    select.textContent = "";
    const all = new Option(`Every group (${total})`, "");
    select.add(all);
    for (const g of allGroups) select.add(new Option(`${g.group} (${g.items.length})`, g.group));
    select.value = group;
  }
  buildTabs();

  /** The formulas to show: a search runs across every group; otherwise the
      chosen group, or all of them. */
  function shown() {
    const words = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const pool = allGroups.flatMap((g) => g.items.map((f) => ({ f, g: g.group })));
    if (!words.length) return { items: pool.filter((x) => !group || x.g === group).map((x) => x.f), words };
    const scored = [];
    for (const { f, g } of pool) {
      const hay = haystack(f, g);
      if (!words.every((w) => related(w).some((t) => hay.includes(t)))) continue;
      const name = f.name.toLowerCase();
      scored.push({ f, rank: name.includes(words.join(" ")) ? 0 : words.some((w) => name.includes(w)) ? 1 : 2 });
    }
    scored.sort((a, b) => a.rank - b.rank);
    return { items: scored.map((x) => x.f), words };
  }

  function paintList() {
    const { items, words } = shown();
    count.textContent = words.length
      ? items.length
        ? `${items.length} ${items.length === 1 ? "formula matches" : "formulas match"} "${search.value.trim()}", across every group`
        : `Nothing matches "${search.value.trim()}". Try a shape, what a letter stands for, or a group's name.`
      : `${items.length} ${items.length === 1 ? "formula" : "formulas"}${group ? ` in ${group}` : ""}`;
    count.classList.toggle("is-empty", !items.length);
    list.textContent = "";
    for (const f of items) {
      const btn = document.createElement("button");
      btn.type = "button";
      // Each formula on its own sheet of paper, the colours taken in turn — the
      // same pad the cards on the canvas are torn from.
      btn.className = `pp-sticky am-fx__pick pp-sticky--c${list.children.length % 6}`;
      btn.classList.toggle("is-on", chosen?.id === f.id);
      btn.appendChild(drawn(f.eq, 21));
      const name = document.createElement("em");
      name.textContent = f.name;
      btn.appendChild(name);
      if (f.rule) {
        btn.classList.add("am-fx__pick--rule");
        btn.title = "Apply this rule to what is picked (or anywhere on the line)";
      }
      btn.addEventListener("click", () => (f.rule ? onRule?.(f) : choose(f)));
      list.appendChild(btn);
    }
  }

  function choose(f) {
    chosen = f;
    paintList();
    paintForm();
    form.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function paintForm() {
    form.hidden = !chosen;
    form.textContent = "";
    fields.clear();
    if (!chosen) return;

    const head = document.createElement("div");
    head.className = "am-fx__head";
    head.appendChild(drawn(chosen.eq, 30));
    const cap = document.createElement("p");
    cap.className = "am-fx__cap";
    cap.textContent = chosen.note ? `${chosen.name} — ${chosen.note}` : chosen.name;
    head.appendChild(cap);
    form.appendChild(head);

    const rows = document.createElement("div");
    rows.className = "am-fx__rows";
    for (const [letter, meaning] of Object.entries(chosen.letters)) {
      const row = document.createElement("label");
      row.className = "am-fx__row";
      row.innerHTML = `<b>${letter}</b><span>${meaning}</span>`;
      const input = document.createElement("input");
      input.type = "text";
      input.inputMode = "decimal";
      input.className = "am-fx__value";
      input.placeholder = "?";
      input.setAttribute("aria-label", `${letter}, ${meaning}`);
      input.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });
      input.addEventListener("input", check);
      row.appendChild(input);
      rows.appendChild(row);
      fields.set(letter, input);
    }
    form.appendChild(rows);

    const say = document.createElement("p");
    say.className = "am-fx__say";
    form.appendChild(say);

    // The bank's own numbers, for when you want to see one work rather than
    // ask one of your own.
    if (Object.keys(chosen.example || {}).length) {
      const demo = document.createElement("button");
      demo.type = "button";
      demo.className = "pp-sticky pp-note-btn am-fx__demo";
      demo.textContent = "use an example";
      demo.addEventListener("click", () => {
        for (const [letter, input] of fields) input.value = chosen.example[letter] ?? "";
        check();
      });
      form.appendChild(demo);
    }

    const go = document.createElement("button");
    go.type = "button";
    go.className = "am-go";
    go.textContent = "Enter";
    go.title = "Put it on the canvas";
    go.setAttribute("aria-label", "Put it on the canvas");
    go.addEventListener("click", submit);
    form.appendChild(go);

    check();
  }

  /** What the form currently says: the values in, the letters left out. */
  function reading() {
    const given = {};
    const blank = [];
    const wrong = [];
    for (const [letter, input] of fields) {
      const raw = input.value.trim();
      if (!raw) { blank.push(letter); continue; }
      const v = readValue(raw);
      if (!v) wrong.push(letter);
      else given[letter] = v;
    }
    return { given, blank, wrong };
  }

  function check() {
    const say = form.querySelector(".am-fx__say");
    if (!say || !chosen) return null;
    const { given, blank, wrong } = reading();

    const trouble =
      wrong.length ? `${wrong.join(" and ")} — I cannot read that as a number.`
      : blank.length === 0 ? "Leave the letter you are looking for empty."
      : blank.length > 1 ? `Fill in every letter but the one you are looking for — ${blank.join(", ")} are all empty.`
      : null;

    if (trouble) {
      say.textContent = trouble;
      say.className = "am-fx__say is-no";
      return null;
    }

    // The same solver the "steps left" button runs. If it cannot finish this,
    // neither can the student, and that is worth knowing before they begin.
    let worked;
    try {
      worked = solve(parse(chosen.eq), { given });
    } catch {
      say.textContent = "This one cannot be written out on the canvas — the engine cannot read it.";
      say.className = "am-fx__say is-no";
      return null;
    }
    if (!worked.solved) {
      say.textContent = `Leaving out ${blank[0]} needs a move this tool has not got — try leaving a different letter blank.`;
      say.className = "am-fx__say is-no";
      return null;
    }

    say.textContent = `Ready — find ${blank[0]}.`;
    say.className = "am-fx__say is-ok";
    return { given, find: blank[0] };
  }

  function submit() {
    const ok = check();
    if (!ok || !chosen) return;
    onSubmit?.({
      eq: parse(chosen.eq),
      given: ok.given,
      find: ok.find,
      title: chosen.name,
      source: chosen.eq,
    });
  }

  paintList();

  /* Admin-added formulas (formula-admin.js) do not ship with the page — they
     join the shelf over the same HTTP engine the API explorer talks to, once
     it has answered. Reachable and never required: an empty or unreachable
     answer just leaves the static bank as the whole of the shelf, which was
     already a complete one. */
  (async () => {
    try {
      const res = await fetch("/api/algebra/formulas");
      const body = await res.json();
      if (!body.ok) return;
      const extra = body.formulas.filter((f) => f.custom);
      if (!extra.length) return;
      for (const f of extra) {
        const item = {
          id: f.id, name: f.name, eq: f.formula, find: f.usuallyFinds,
          letters: f.letters, example: f.example, note: f.note || undefined,
        };
        let g = allGroups.find((g) => g.group === f.group);
        if (!g) { g = { group: f.group, items: [] }; allGroups.push(g); }
        g.items.push(item);
      }
      buildTabs();
      paintList();
    } catch {
      // As above: nothing here is required for the shelf to be complete.
    }
  })();

  return {
    /** Open on a particular formula, by id. */
    show(id) {
      const f = allGroups.flatMap((g) => g.items).find((x) => x.id === id);
      if (f) {
        group = allGroups.find((g) => g.items.includes(f)).group;
        search.value = "";
        select.value = group;
        choose(f);
      }
    },
    focus() { form.querySelector("input")?.focus(); },
  };
}

/** Re-exported so main.js has one door into the bank. */
export { exampleGivens };
