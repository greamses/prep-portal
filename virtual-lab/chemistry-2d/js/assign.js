/* ============================================================================
   CHEMISTRY BENCH — practicals set for a class
   ----------------------------------------------------------------------------
   A TEACHER (a subscribed one: the server decides) sets one practical for
   PrepBot to teach, from the PrepBot sheet. It is one of:
     - a demonstration PrepBot gives, which the student then repeats;
     - a practical from the list, set out by PrepBot, its steps ticking;
     - the teacher's OWN bench, exactly as it stands, with their own steps.
   That makes a link, /virtual-lab/chemistry-2d/?a=CODE.

   A STUDENT who opens the link is shown what has been set and by whom, and
   presses Start. PrepBot teaches it whether or not the student is a premium
   member. What they did (the steps ticked, and what they wrote in their
   notebook) is handed in to the teacher: when the last step is done, or when
   they press Hand in.

   The server is server/routes/bench.js. Everything it sends is put on the page
   as TEXT, never as markup.
   ========================================================================== */

import { onAccount, benchApi } from "./account.js";

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

/**
 * @param {object} o
 * @param {object} o.bench    the bench's own hands and questions (main.js `actor`)
 * @param {object[]} o.lessons PrepBot's demonstrations
 * @param {(lesson: object) => Promise} o.play   PrepBot gives a demonstration, then it is the student's turn
 * @param {(cmds: string[]) => Promise} o.act    PrepBot carries out commands
 * @param {(text: string) => void} o.say         PrepBot says a line
 * @param {object} o.hooks    hooks.lessonDone is called when a student finishes repeating a demonstration
 */
export function initAssign({ bench, lessons, play, act, say, hooks }) {
  const practicals = bench.practicals();
  let doing = null;          // the assignment being done: { a, ticks: Set, handed }

  // ══ the teacher ══════════════════════════════════════════════════════════
  const key = $("cl-bot-class"), sheet = $("cl-sheet-class");
  let asked = false;
  onAccount((acct) => {
    if (!acct.user || asked) return;
    asked = true;
    benchApi("GET", "/api/bench/teacher").then((d) => {
      if (!d.teacher) return;
      key.hidden = false;
      key.dataset.ok = d.eligible ? "1" : "";
      key.dataset.why = d.reason || "";
    }).catch(() => { /* not a teacher, or offline: the key stays hidden */ });
    openFromLink();
  });

  const what = $("cl-class-what"), title = $("cl-class-title"), note = $("cl-class-note"), msg = $("cl-class-msg"), own = $("cl-class-own");
  function fillChoices() {
    what.textContent = "";
    const group = (label, rows) => { const g = el("optgroup"); g.label = label; rows.forEach(([v, t]) => { const o = el("option", null, t); o.value = v; g.appendChild(o); }); what.appendChild(g); };
    group("My own experiment", [["own:", "The bench exactly as I have set it out now"]]);
    group("PrepBot demonstrates, then the student repeats it", lessons.map((l) => [`demo:${l.id}`, l.name]));
    group("A practical from the list (PrepBot sets it out)", practicals.map((e) => [`practical:${e.id}`, e.title]));
    const chosen = bench.chosen();
    const now = chosen && practicals.find((e) => e.title === chosen.title);
    what.value = now ? `practical:${now.id}` : bench.isEmptyBench() ? `demo:${lessons[0].id}` : "own:";
    sync(true);
  }
  function sync(retitle) {
    const [kind, id] = what.value.split(":");
    own.hidden = kind !== "own";
    const name = kind === "demo" ? (lessons.find((l) => l.id === id) || {}).name : kind === "practical" ? (practicals.find((e) => e.id === id) || {}).title : "";
    if (retitle || !title.value.trim() || title.dataset.auto === "1") { title.value = name || ""; title.dataset.auto = "1"; }
  }
  what.addEventListener("change", () => sync(false));
  title.addEventListener("input", () => { title.dataset.auto = ""; });

  key.addEventListener("click", () => {
    bench.openSheet("cl-sheet-class");
    msg.textContent = key.dataset.ok ? "" : key.dataset.why || "Setting practicals for a class needs a subscription.";
    $("cl-class-set").disabled = !key.dataset.ok;
    fillChoices();
    listSet();
  });

  $("cl-class-set").addEventListener("click", async () => {
    const [kind, id] = what.value.split(":");
    const body = { title: title.value.trim(), note: note.value.trim() };
    if (!body.title) { msg.textContent = "Give it a title first."; title.focus(); return; }
    if (kind === "demo") body.demo = id;
    else if (kind === "practical") body.practical = id;
    else {
      const snap = bench.snapshot();
      if (!snap.items.length) { msg.textContent = "The bench is empty. Set out the pieces your students should start with, then set it."; return; }
      body.bench = snap;
      body.steps = $("cl-class-steps").value.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 12);
      if (!body.steps.length) { msg.textContent = "Write the steps your students should follow, one on each line."; $("cl-class-steps").focus(); return; }
    }
    const btn = $("cl-class-set");
    btn.disabled = true;
    msg.textContent = "Setting it…";
    try {
      const d = await benchApi("POST", "/api/bench/assign", body);
      const link = `${location.origin}${d.url}`;
      msg.textContent = "";
      const p = el("p", "cl-class__done", `Set. ${d.sent ? `It is on the list of the ${d.sent} student${d.sent === 1 ? "" : "s"} in your class. ` : ""}Give your students this link: `);
      const a = el("a", null, link); a.href = d.url;
      const copy = el("button", "cl-try", "Copy the link"); copy.type = "button";
      copy.addEventListener("click", async () => { try { await navigator.clipboard.writeText(link); copy.textContent = "Copied"; } catch { copy.textContent = "Select the link and copy it"; } });
      p.append(a);
      msg.append(p, copy);
      listSet();
    } catch (e) { msg.textContent = e.message || "It could not be set."; }
    btn.disabled = false;
  });

  /** What this teacher has set, and who has done it. */
  async function listSet() {
    const box = $("cl-class-list");
    box.textContent = "";
    let d;
    try { d = await benchApi("GET", "/api/bench/assigned"); } catch { return; }
    if (!d.assignments.length) { box.appendChild(el("p", "cl-sheet__lead", "Nothing set yet.")); return; }
    for (const a of d.assignments) {
      const li = el("li", "cl-class__item");
      li.appendChild(el("h4", null, a.title));
      const meta = el("p", "cl-class__meta", `${a.own ? "Your own experiment" : a.demo ? "A PrepBot demonstration" : "A practical from the list"} · code ${a.code} · `);
      const link = el("a", null, "open it"); link.href = a.url;
      meta.appendChild(link);
      li.appendChild(meta);
      if (!a.results.length) li.appendChild(el("p", "cl-class__none", "No one has handed it in yet."));
      for (const r of a.results) {
        const row = el("details", "cl-class__row");
        row.appendChild(el("summary", null, `${r.name}: ${r.done} of ${r.total} steps${r.attempts > 1 ? ` (handed in ${r.attempts} times)` : ""}`));
        row.appendChild(el("p", "cl-class__notes", r.notes || "Nothing was written in the notebook."));
        li.appendChild(row);
      }
      if (a.waiting.length) li.appendChild(el("p", "cl-class__none", `Not yet: ${a.waiting.join(", ")}.`));
      box.appendChild(li);
    }
  }

  // ══ the student ══════════════════════════════════════════════════════════
  const card = $("cl-sheet-assign");
  async function openFromLink() {
    const code = (new URLSearchParams(location.search).get("a") || "").toUpperCase();
    if (!/^[A-Z2-9]{6}$/.test(code)) return;
    let a;
    try { a = await benchApi("GET", `/api/bench/a/${code}`); } catch (e) { bench.toast(e.message || "That practical could not be opened."); return; }
    doing = { a, ticks: new Set(), handed: false, started: false };
    bench.assigned(true);
    $("cl-assign-key").hidden = false;
    paintCard();
    bench.openSheet("cl-sheet-assign");
  }
  $("cl-assign-key").addEventListener("click", () => { paintCard(); bench.openSheet("cl-sheet-assign"); });

  const lessonOf = (a) => (a.demo ? lessons.find((l) => l.id === a.demo) : null);
  /** How far the student has got: [done, total]. */
  function progress() {
    const { a } = doing;
    if (a.bench) return [doing.ticks.size, Math.max(1, a.steps.length)];
    if (a.demo) { const l = lessonOf(a); const st = bench.lessonSteps ? bench.lessonSteps() : null; return st ? [st.filter(Boolean).length, st.length] : [doing.finished ? (l ? l.steps.length : 1) : 0, l ? l.steps.length : 1]; }
    const p = bench.progress();
    return p.total ? [p.done, p.total] : [0, 1];
  }
  function paintCard() {
    if (!doing) return;
    const { a } = doing;
    $("cl-assign-title").textContent = a.title;
    $("cl-assign-by").textContent = a.owner ? "You set this for your class. This is what your students see." : `Set by ${a.teacherName || "your teacher"}.`;
    $("cl-assign-note").textContent = a.note || "";
    $("cl-assign-note").hidden = !a.note;
    const l = lessonOf(a);
    $("cl-assign-how").textContent = a.bench ? "Your teacher has set the bench out for you. Follow the steps, and tick each one when you have done it."
      : l ? "PrepBot will show you the experiment first. Then it clears the bench and you do it yourself."
      : "PrepBot will set out everything the practical needs. The guide ticks each step as you do it.";
    const ol = $("cl-assign-steps");
    ol.textContent = "";
    if (a.bench) {
      a.steps.forEach((text, i) => {
        const li = el("li"), lab = el("label"), box = el("input");
        box.type = "checkbox";
        box.checked = doing.ticks.has(i);
        box.disabled = !doing.started;
        box.addEventListener("change", () => { if (box.checked) doing.ticks.add(i); else doing.ticks.delete(i); paintCard(); if (doing.ticks.size === a.steps.length) handIn(true); });
        lab.append(box, document.createTextNode(` ${text}`));
        li.appendChild(lab);
        ol.appendChild(li);
      });
    }
    const [done, total] = progress();
    $("cl-assign-start").textContent = doing.started ? "Start again" : "Start";
    $("cl-assign-hand").hidden = !doing.started;
    $("cl-assign-state").textContent = doing.handed ? `Handed in: ${doing.handed.done} of ${doing.handed.total} steps. You can go on and hand it in again.` : doing.started ? `${done} of ${total} steps done.` : "";
  }

  $("cl-assign-start").addEventListener("click", async () => {
    if (!doing || bench.isBusy()) return;
    const { a } = doing;
    doing.started = true;
    doing.finished = false;
    doing.ticks = new Set();
    bench.closeSheets();
    const l = lessonOf(a);
    if (a.bench) {
      bench.clear();
      bench.loadBench(a.bench.items);
      bench.page(a.title);
      say(`${a.title}. ${a.note ? `${a.note} ` : ""}Your teacher has set the bench out. Open the practical from the clipboard at the top to see the steps, and tick each one as you do it.`);
    } else if (l) await play(l);
    else if (a.practical) await act([`setup ${a.practical}`]);
    paintCard();
  });
  $("cl-assign-hand").addEventListener("click", () => handIn(false));

  async function handIn(auto) {
    if (!doing || !doing.started || doing.a.owner) { if (doing && doing.a.owner && !auto) $("cl-assign-state").textContent = "This is your own practical: there is nothing to hand in."; return; }
    const [done, total] = progress();
    if (auto && doing.handed && doing.handed.done >= done) return;
    try {
      await benchApi("POST", `/api/bench/a/${doing.a.code}/result`, { done, total, notes: bench.recent(24).join("\n") });
      doing.handed = { done, total };
      if (auto) say(`Well done. I have handed it in to ${doing.a.teacherName || "your teacher"}: ${done} of ${total} steps, with what you wrote in your notebook.`);
      else bench.toast(`Handed in to ${doing.a.teacherName || "your teacher"}.`);
    } catch (e) { bench.toast(e.message || "It could not be handed in. Try again."); }
    paintCard();
  }

  // a demonstration repeated to the end, or the last step of a practical ticked: it hands itself in
  hooks.lessonDone = (lesson) => { if (doing && doing.started && doing.a.demo === lesson.id) { doing.finished = true; handIn(true); } };
  bench.onTick = () => {
    if (!doing || !doing.started || !doing.a.practical) return;
    const p = bench.progress();
    if (p.total && p.done === p.total) handIn(true);
    if (!card.hidden) paintCard();
  };
}
