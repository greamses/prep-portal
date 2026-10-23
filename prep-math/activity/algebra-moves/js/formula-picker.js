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
  // A working copy: admin-added formulas (see formula-admin.js) join it at
  // runtime, either into a group already here or a new one of their own —
  // the static bank itself is never mutated.
  const allGroups = GROUPS.map((g) => ({ group: g.group, items: [...g.items] }));

  let group = allGroups[0].group;
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

  function buildTabs() {
    tabs.textContent = "";
    for (const g of allGroups) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "pp-sticky pp-note-btn am-fx__group";
      chip.textContent = g.group;
      chip.classList.toggle("is-on", chip.textContent === group);
      chip.addEventListener("click", () => { group = g.group; paintList(); });
      tabs.appendChild(chip);
    }
  }
  buildTabs();

  function paintList() {
    for (const chip of tabs.children) {
      chip.classList.toggle("is-on", chip.textContent === group);
    }
    list.textContent = "";
    for (const f of allGroups.find((g) => g.group === group).items) {
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
      if (f) { group = allGroups.find((g) => g.items.includes(f)).group; choose(f); }
    },
    focus() { form.querySelector("input")?.focus(); },
  };
}

/** Re-exported so main.js has one door into the bank. */
export { exampleGivens };
