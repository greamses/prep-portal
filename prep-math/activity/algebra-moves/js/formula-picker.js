/* ═══════════════════════════════════════════════════════════════════════════
   THE FORMULA PICKER

   The other half of the drawer. Typing a line is one way to get a problem onto
   the canvas; the other is to pick a formula and say what you were given.

   The form is the question as it is asked on paper — every letter listed with
   what it stands for, all but one filled in — and the one left blank is what
   you are looking for. That is the whole of the input, and it is enough: the
   card that comes out is an ordinary equation card with a set of values pinned
   to it, and every move after that is the ordinary move set.

   The one thing this does that no other panel does is CHECK ITSELF. Whenever
   the blank moves, it runs the solver over what the form currently says and
   reports whether the moves on offer can actually finish it. Leaving out the r
   in A = (22/7)r² needs a square root, which is not a move here — and telling a
   student that before they start beats letting them find out four lines in.
   ═══════════════════════════════════════════════════════════════════════════ */

import { GROUPS, readValue, exampleGivens } from "./formulas.js";
import { parse } from "./parse.js";
import { buildRow, paintRow } from "./render.js";
import { solve } from "./solve.js";

/** The formula, drawn in the same hand the canvas writes in. */
function drawn(src, size) {
  const holder = document.createElement("div");
  holder.className = "am-fx__ink";
  try {
    holder.appendChild(paintRow(buildRow(parse(src), size), { live: false }));
  } catch {
    holder.textContent = src;
  }
  return holder;
}

export function createFormulaPicker(host, { onSubmit } = {}) {
  let group = GROUPS[0].group;
  let chosen = null;
  const fields = new Map();          // letter -> input

  const tabs = document.createElement("div");
  tabs.className = "am-fx__groups";

  const list = document.createElement("div");
  list.className = "am-fx__list";

  const form = document.createElement("div");
  form.className = "am-fx__form";
  form.hidden = true;

  host.append(tabs, list, form);

  for (const g of GROUPS) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "pp-sticky pp-note-btn am-fx__group";
    chip.textContent = g.group;
    chip.addEventListener("click", () => { group = g.group; paintList(); });
    tabs.appendChild(chip);
  }

  function paintList() {
    for (const chip of tabs.children) {
      chip.classList.toggle("is-on", chip.textContent === group);
    }
    list.textContent = "";
    for (const f of GROUPS.find((g) => g.group === group).items) {
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
      btn.addEventListener("click", () => choose(f));
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
    const example = chosen.example || {};
    for (const [letter, meaning] of Object.entries(chosen.letters)) {
      const row = document.createElement("label");
      row.className = "am-fx__row";
      row.innerHTML = `<b>${letter}</b><span>${meaning}</span>`;
      const input = document.createElement("input");
      input.type = "text";
      input.inputMode = "decimal";
      input.className = "am-fx__value";
      input.placeholder = "?";
      input.value = example[letter] ?? "";
      input.setAttribute("aria-label", `${letter}, ${meaning}`);
      input.addEventListener("input", check);
      row.appendChild(input);
      rows.appendChild(row);
      fields.set(letter, input);
    }
    form.appendChild(rows);

    const say = document.createElement("p");
    say.className = "am-fx__say";
    form.appendChild(say);

    const go = document.createElement("button");
    go.type = "button";
    go.className = "pp-sticky pp-note-btn am-go";
    go.textContent = "Put it on the canvas";
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
    const worked = solve(parse(chosen.eq), { given });
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

  return {
    /** Open on a particular formula, by id. */
    show(id) {
      const f = GROUPS.flatMap((g) => g.items).find((x) => x.id === id);
      if (f) { group = GROUPS.find((g) => g.items.includes(f)).group; choose(f); }
    },
    focus() { form.querySelector("input")?.focus(); },
  };
}

/** Re-exported so main.js has one door into the bank. */
export { exampleGivens };
