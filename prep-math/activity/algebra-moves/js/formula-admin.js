/* ═══════════════════════════════════════════════════════════════════════════
   ADD A FORMULA — ADMIN ONLY

   The formula bank in formulas.js is built-time and static; this is the other
   way one gets added — by hand, from here, while the page is running. It is
   held to exactly the same standard the static bank's own sweep holds it to:
   parsed, checked letter for letter, and SOLVED with the example standing in
   for every letter but the one left blank, before the server will store it.
   Nothing reaches a student that this engine cannot actually finish.

   Hidden entirely unless signed in as the admin — not a security boundary
   (the server checks the same thing with a verified token; see
   server/routes/algebra.js), just no reason to show a form nobody else can
   use.
   ═══════════════════════════════════════════════════════════════════════════ */

import { parse } from "./parse.js";
import { varsIn } from "./ast.js";
import { solve } from "./solve.js";
import { readValue } from "./formulas.js";
import { auth } from "/firebase-init.js";

const ADMIN_EMAIL = "eemadanyel@gmail.com";

export function mountFormulaAdmin(host) {
  const section = document.createElement("section");
  section.className = "pp-receipt am-play am-admin";
  section.hidden = true;

  const paper = document.createElement("div");
  paper.className = "pp-receipt__paper";
  section.appendChild(paper);

  paper.innerHTML = `
    <h2 class="am-h">Add a formula — admin</h2>
    <div class="am-row am-row--type">
      <input class="am-input" id="fa-group" autocomplete="off" spellcheck="false"
             placeholder="Group, e.g. Shapes" aria-label="Which group this joins">
    </div>
    <div class="am-row am-row--type" style="margin-top: 0.5rem">
      <input class="am-input" id="fa-name" autocomplete="off" spellcheck="false"
             placeholder="Name, e.g. Area of a circle" aria-label="The formula's name">
    </div>
    <div class="am-row am-row--type" style="margin-top: 0.5rem">
      <input class="am-input" id="fa-eq" autocomplete="off" spellcheck="false"
             placeholder="Equation, e.g. A = (22/7)r^2" aria-label="The equation">
    </div>
    <div class="am-row am-row--type" style="margin-top: 0.5rem">
      <input class="am-input" id="fa-find" autocomplete="off" spellcheck="false"
             placeholder="Which letter to leave blank, e.g. A" aria-label="The letter to find">
    </div>
    <p class="am-note" style="margin-top: 0.6rem">
      One row appears per letter once the equation parses — what it means,
      and an example value for every letter except the one above.
    </p>
    <div class="am-fx__rows" id="fa-letters"></div>
    <div class="am-row am-row--type" style="margin-top: 0.6rem">
      <input class="am-input" id="fa-note" autocomplete="off" spellcheck="false"
             placeholder="A note, if it needs one (optional)" aria-label="An optional note">
    </div>
    <p class="am-fx__say" id="fa-say"></p>
    <button type="button" class="pp-sticky pp-note-btn am-verb" id="fa-submit" disabled>Add it</button>
  `;

  host.appendChild(section);

  const $ = (sel) => paper.querySelector(sel);
  const group = $("#fa-group"), name = $("#fa-name"), eqInput = $("#fa-eq"), find = $("#fa-find");
  const noteInput = $("#fa-note"), rows = $("#fa-letters"), say = $("#fa-say"), submit = $("#fa-submit");

  const meaning = new Map();  // letter -> its "what it means" input
  const value = new Map();    // letter -> its example-value input (none for `find`)
  let lastLetters = "";

  /** Rebuild the letter rows from whatever the equation currently parses to.
      Kept, across rebuilds, by letter name, so typing in one is not undone by
      a keystroke in another. */
  function syncLetterRows(letters) {
    const now = letters.join("");
    if (now === lastLetters) { paintValueVisibility(); return; }
    lastLetters = now;

    const keptMeaning = new Map(meaning);
    const keptValue = new Map(value);
    meaning.clear();
    value.clear();
    rows.textContent = "";

    for (const letter of letters) {
      const row = document.createElement("label");
      row.className = "am-fx__row";
      row.innerHTML = `<b></b><span></span>`;
      row.querySelector("b").textContent = letter;
      const what = row.querySelector("span");

      const meaningBox = document.createElement("input");
      meaningBox.type = "text";
      meaningBox.className = "am-fx__value";
      meaningBox.style.textAlign = "left";
      meaningBox.placeholder = "what it means";
      meaningBox.value = keptMeaning.get(letter)?.value ?? "";
      meaningBox.setAttribute("aria-label", `What ${letter} means`);
      meaningBox.addEventListener("input", check);
      what.appendChild(meaningBox);
      meaning.set(letter, meaningBox);

      const valueBox = document.createElement("input");
      valueBox.type = "text";
      valueBox.inputMode = "decimal";
      valueBox.className = "am-fx__value";
      valueBox.placeholder = "example";
      valueBox.value = keptValue.get(letter)?.value ?? "";
      valueBox.setAttribute("aria-label", `An example value for ${letter}`);
      valueBox.addEventListener("input", check);
      row.appendChild(valueBox);
      value.set(letter, valueBox);

      rows.appendChild(row);
    }
    paintValueVisibility();
  }

  /** The example value box for `find` is not wanted — that is the one being
      solved for — so it is hidden rather than asked for and then ignored. */
  function paintValueVisibility() {
    const f = find.value.trim();
    for (const [letter, box] of value) box.hidden = letter === f;
  }

  /** Parse, check every letter is accounted for both ways, and solve it with
      the examples standing in for everything but `find`. The same thing the
      server will do with a verified token — this copy exists only so a typo
      is caught before the admin leaves the page, not as the real gate. */
  function check() {
    paintValueVisibility();
    submit.disabled = true;

    const eqSrc = eqInput.value.trim();
    if (!eqSrc) { say.textContent = ""; say.className = "am-fx__say"; rows.textContent = ""; lastLetters = ""; return false; }

    let eq;
    try { eq = parse(eqSrc); } catch (err) {
      say.textContent = err.message;
      say.className = "am-fx__say is-no";
      return false;
    }
    if (eq.kind !== "eq") {
      say.textContent = "A formula needs an equals sign.";
      say.className = "am-fx__say is-no";
      return false;
    }

    syncLetterRows(varsIn(eq).sort());

    const f = find.value.trim();
    if (!f) {
      say.textContent = "Say which letter to leave blank.";
      say.className = "am-fx__say is-no";
      return false;
    }
    if (!meaning.has(f)) {
      say.textContent = `"${f}" is not one of the letters in the equation.`;
      say.className = "am-fx__say is-no";
      return false;
    }

    const blankMeaning = [...meaning].find(([, box]) => !box.value.trim());
    if (blankMeaning) {
      say.textContent = `Say what ${blankMeaning[0]} means.`;
      say.className = "am-fx__say is-no";
      return false;
    }

    const given = {};
    for (const [letter, box] of value) {
      if (letter === f) continue;
      const v = readValue(box.value);
      if (!v) {
        say.textContent = `"${box.value}" is not a number I can use for the example value of ${letter}.`;
        say.className = "am-fx__say is-no";
        return false;
      }
      given[letter] = v;
    }

    if (!group.value.trim() || !name.value.trim()) {
      say.textContent = "Give it a group and a name.";
      say.className = "am-fx__say is-no";
      return false;
    }

    const worked = solve(eq, { given, maxSteps: 24 });
    if (!worked.solved) {
      say.textContent = `Leaving out ${f} needs a move this engine has not got${worked.stuck ? ` — ${worked.stuck}` : ""}.`;
      say.className = "am-fx__say is-no";
      return false;
    }

    say.textContent = "Ready — this can be added.";
    say.className = "am-fx__say is-ok";
    submit.disabled = false;
    return true;
  }

  async function doSubmit() {
    if (!check()) return;
    submit.disabled = true;
    submit.textContent = "Adding…";

    const f = find.value.trim();
    const letters = {};
    const example = {};
    for (const [letter, box] of meaning) letters[letter] = box.value.trim();
    for (const [letter, box] of value) if (letter !== f) example[letter] = box.value.trim();

    try {
      const user = auth.currentUser;
      const token = user && (await user.getIdToken());
      const res = await fetch("/api/algebra/formulas", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          group: group.value.trim(), name: name.value.trim(), eq: eqInput.value.trim(),
          find: f, letters, example, note: noteInput.value.trim() || null,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) throw new Error(body.error || "The server would not take that.");

      say.textContent = `${name.value.trim()} is on the shelf.`;
      say.className = "am-fx__say is-ok";
      for (const input of [group, name, eqInput, find, noteInput]) input.value = "";
      rows.textContent = "";
      meaning.clear();
      value.clear();
      lastLetters = "";
    } catch (err) {
      say.textContent = err.message;
      say.className = "am-fx__say is-no";
    } finally {
      submit.textContent = "Add it";
      submit.disabled = false;
      check();
    }
  }

  for (const el of [group, name, eqInput, find, noteInput]) el.addEventListener("input", check);
  submit.addEventListener("click", doSubmit);

  auth.onAuthStateChanged((user) => {
    section.hidden = !(user && user.email === ADMIN_EMAIL);
  });
}
