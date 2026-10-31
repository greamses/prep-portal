/* ============================================================================
   Marking up a student's written answer
   ----------------------------------------------------------------------------
   The teacher HIGHLIGHTS words in the student's answer and a small bar appears over them:

     the tick      pins a sticky-note comment to those words
     the marks     the proofreader's marks, as a teacher writes them in the margin of a script:
                   delete, insert, replace, capital letter, lower case, spelling, transpose,
                   new paragraph, put in a space

   Each is kept as { s, e, kind, text }: where it starts and ends in the answer's own text (as the student
   wrote it), what it is, and any words that go with it (the note, the word to put in). The student sees
   the same marks, read only, when the teacher releases the results.
   ========================================================================== */

export const MARKS = [
  { kind: "del", glyph: "δ", name: "Delete these words", ask: false },
  { kind: "ins", glyph: "∧", name: "Insert a word here (after the highlight)", ask: "What to put in", point: true },
  { kind: "rep", glyph: "⇄", name: "Replace these words", ask: "Write the replacement" },
  { kind: "cap", glyph: "≡", name: "Capital letter", ask: false },
  { kind: "lower", glyph: "/", name: "Lower case", ask: false },
  { kind: "sp", glyph: "sp", name: "Spelling mistake", ask: false },
  { kind: "tr", glyph: "⇅", name: "Change the order", ask: false },
  { kind: "par", glyph: "¶", name: "New paragraph here (after the highlight)", ask: false, point: true },
  { kind: "space", glyph: "#", name: "Put a space here (after the highlight)", ask: false, point: true },
];
const NAME = { note: "Note", del: "Delete", ins: "Insert", rep: "Replace", cap: "Capital", lower: "Lower case", sp: "Spelling", tr: "Change order", par: "New paragraph", space: "Space" };
const GLYPH = Object.fromEntries(MARKS.map((m) => [m.kind, m.glyph]));
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const POINT = new Set(["ins", "par", "space"]);

/** The answer as HTML with the marks on it. Only text nodes and empty carets, so a selection's offset is its place in the text. */
export function renderAnnotated(text, notes) {
  const t = String(text ?? "");
  const list = (notes || []).map((n, i) => ({ ...n, i })).filter((n) => n.s >= 0 && n.e <= t.length);
  const numbered = list.filter((n) => n.kind === "note");
  const no = new Map(numbered.map((n, k) => [n.i, k + 1]));
  const cuts = new Set([0, t.length]);
  list.forEach((n) => { cuts.add(n.s); cuts.add(n.e); });
  const pts = [...cuts].sort((a, b) => a - b);
  let out = "";
  const carets = (at) => list.filter((n) => POINT.has(n.kind) && n.s === at && n.e === at)
    .map((n) => `<i class="an-caret an-k-${n.kind}" data-id="${n.i}" data-t="${esc(n.text)}" data-g="${esc(GLYPH[n.kind])}"></i>`).join("");
  for (let k = 0; k < pts.length; k++) {
    const a = pts[k], b = pts[k + 1];
    out += carets(a);
    if (b === undefined || b <= a) continue;
    const on = list.filter((n) => !POINT.has(n.kind) && n.s <= a && n.e >= b && n.e > n.s);
    const piece = esc(t.slice(a, b));
    if (!on.length) { out += piece; continue; }
    const kinds = on.map((n) => `an-k-${n.kind}`).join(" ");
    const ids = on.map((n) => n.i).join(" ");
    const closing = on.filter((n) => n.e === b);
    const badge = closing.filter((n) => n.kind === "note").map((n) => no.get(n.i)).join(",");
    const rep = closing.find((n) => n.kind === "rep");
    out += `<span class="an-seg ${kinds}" data-ids="${ids}"${badge ? ` data-no="${badge}"` : ""}${rep ? ` data-t="${esc(rep.text)}"` : ""}>${piece}</span>`;
  }
  out += carets(t.length);
  return out;
}

/** The comments and marks as a list under the answer. */
function listHtml(notes, editable) {
  const rows = (notes || []).map((n, i) => ({ ...n, i }));
  const notesOnly = rows.filter((n) => n.kind === "note");
  const marks = rows.filter((n) => n.kind !== "note");
  const x = (i) => (editable ? `<button type="button" class="an-x" data-del="${i}" data-tip="Take this off" aria-label="Take this off">&times;</button>` : "");
  return `${notesOnly.length ? `<div class="an-notes">${notesOnly.map((n, k) => `<div class="pp-sticky an-note" data-id="${n.i}"><b>${k + 1}</b><span>${esc(n.text)}</span>${x(n.i)}</div>`).join("")}</div>` : ""}`
    + `${marks.length ? `<div class="an-marks">${marks.map((n) => `<span class="an-mark" data-id="${n.i}"><i>${esc(GLYPH[n.kind] || "")}</i>${esc(NAME[n.kind] || n.kind)}${n.text ? ` <em>${esc(n.text)}</em>` : ""}${x(n.i)}</span>`).join("")}</div>` : ""}`;
}

/** A read-only marked answer (the student's page after the teacher releases the results). */
export function annotatedView(text, notes) {
  const box = document.createElement("div");
  box.className = "an an--read";
  box.innerHTML = `<div class="an-text" aria-label="Your answer, marked by your teacher">${renderAnnotated(text, notes)}</div>${listHtml(notes, false)}`;
  return box;
}

/**
 * A marked answer the teacher can mark up.
 *   host      an element to build into
 *   text      the student's answer
 *   notes     the marks so far
 *   onChange  (notes) called after every change, to be saved
 */
export function mountAnnotator(host, { text, notes = [], onChange = () => {} }) {
  let list = notes.map((n) => ({ ...n }));
  host.classList.add("an");
  host.innerHTML = `<div class="an-text" tabindex="0" aria-label="The student's answer. Highlight words to mark them."></div><div class="an-list"></div>`;
  const body = host.querySelector(".an-text"), side = host.querySelector(".an-list");
  const paint = () => { body.innerHTML = renderAnnotated(text, list); side.innerHTML = listHtml(list, true); };
  const change = () => { paint(); onChange(list.map((n) => ({ s: n.s, e: n.e, kind: n.kind, text: n.text || "" }))); };
  paint();

  let bar = null;
  const closeBar = () => { bar && bar.remove(); bar = null; };
  /* where the highlight is, in the answer's own text */
  const picked = () => {
    const sel = getSelection();
    if (!sel.rangeCount || sel.isCollapsed) return null;
    const r = sel.getRangeAt(0);
    if (!body.contains(r.startContainer) || !body.contains(r.endContainer)) return null;
    const pre = document.createRange(); pre.selectNodeContents(body); pre.setEnd(r.startContainer, r.startOffset);
    const s = pre.toString().length, e = s + r.toString().length;
    return e > s ? { s, e, rect: r.getBoundingClientRect() } : null;
  };

  /* a little sticky note to write the words that go with a mark */
  function ask(prompt, place, done) {
    closeBar();
    const pop = document.createElement("div");
    pop.className = "pp-sticky an-ask";
    pop.innerHTML = `<label>${esc(prompt)}<input type="text" maxlength="300" /></label><div class="an-ask__row"><button type="button" class="pp-btn pp-btn--ghost" data-no>Cancel</button><button type="button" class="pp-btn" data-ok>Pin it</button></div>`;
    document.body.appendChild(pop);
    pop.style.left = `${Math.max(8, Math.min(place.left, innerWidth - pop.offsetWidth - 8))}px`;
    pop.style.top = `${Math.min(place.bottom + 8, innerHeight - pop.offsetHeight - 8)}px`;
    const input = pop.querySelector("input");
    const shut = () => pop.remove();
    pop.querySelector("[data-no]").addEventListener("click", shut);
    pop.querySelector("[data-ok]").addEventListener("click", () => { const v = input.value.trim(); shut(); done(v); });
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); const v = input.value.trim(); shut(); done(v); } else if (e.key === "Escape") shut(); });
    input.focus();
  }

  function showBar() {
    closeBar();
    const p = picked();
    if (!p) return;
    bar = document.createElement("div");
    bar.className = "an-bar";
    bar.setAttribute("role", "toolbar");
    bar.innerHTML = `<button type="button" class="an-bar__tick" data-act="note" data-tip="Pin a sticky note to these words" aria-label="Pin a sticky note to these words"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M3.6 13.2c1.8 1.1 3.7 3.2 5.2 6 1.5-5.3 6.2-10.8 11.8-14.8"/></svg></button><span class="an-bar__sep"></span>`
      + MARKS.map((m) => `<button type="button" class="an-bar__mark" data-act="${m.kind}" data-tip="${esc(m.name)}" aria-label="${esc(m.name)}">${esc(m.glyph)}</button>`).join("");
    document.body.appendChild(bar);
    bar.style.left = `${Math.max(8, Math.min(p.rect.left, innerWidth - bar.offsetWidth - 8))}px`;
    bar.style.top = `${Math.max(8, p.rect.top - bar.offsetHeight - 8)}px`;
    bar.dataset.s = p.s; bar.dataset.e = p.e;
    bar._rect = { left: p.rect.left, bottom: p.rect.bottom };
  }
  document.addEventListener("selectionchange", () => { if (!document.contains(host)) return; if (bar && picked()) return; if (!picked()) closeBar(); });
  body.addEventListener("pointerup", () => setTimeout(showBar, 0));
  body.addEventListener("keyup", (e) => { if (e.shiftKey) showBar(); });

  const add = (n) => { list.push(n); change(); getSelection().removeAllRanges(); };
  document.addEventListener("pointerdown", (e) => {
    if (!bar || !bar.contains(e.target)) return;
    e.preventDefault();                      // keep the highlight while a button is pressed
  }, true);
  document.addEventListener("click", (e) => {
    if (!bar || !bar.contains(e.target)) return;
    const b = e.target.closest("[data-act]"); if (!b) return;
    const s = +bar.dataset.s, en = +bar.dataset.e, rect = bar._rect, kind = b.dataset.act;
    if (kind === "note") { ask("Your comment for the student", rect, (v) => { if (v) add({ s, e: en, kind: "note", text: v }); }); return; }
    const m = MARKS.find((x) => x.kind === kind);
    const at = m.point ? { s: en, e: en } : { s, e: en };
    if (m.ask) { ask(m.ask, rect, (v) => { if (v) add({ ...at, kind, text: v }); }); return; }
    closeBar(); add({ ...at, kind, text: "" });
  });
  host.addEventListener("click", (e) => {
    const d = e.target.closest("[data-del]"); if (!d) return;
    list = list.filter((_, i) => i !== +d.dataset.del);
    change();
  });
  return { get notes() { return list; }, destroy() { closeBar(); } };
}
