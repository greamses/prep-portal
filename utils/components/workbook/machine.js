/* ============================================================================
   PRINTABLE WORKBOOK — the function machine, as a TRAIN
   ----------------------------------------------------------------------------
   A function is a train: every coach carries one job (+ 3, × 2, − 5, ÷ 4), an
   engine pulls them, and a number that climbs aboard at IN has each coach's job
   done to it, in order, until it steps off at OUT.

   ON PAPER the train is drawn — its jobs written on the coaches, or the coaches
   left empty to be written in, with job cards underneath to copy from.

   ON SCREEN a train to BUILD is the child's own:
     · + and − add a coach or take the last one off (1 to 6 coaches);
     · a job is TYPED into a coach ("+5", "-3", "x4", "÷2" — any of the usual
       ways), or a job card is tapped (or dragged) onto a coach;
     · a number is typed on the IN card, and the card is DRAGGED along the train
       — its number changes as it passes each coach, and at the end it lands on
       OUT. The play button does the same ride for a child who cannot drag.
       Each ride is written in the log underneath, so a train can be tested
       against the table the way you would test a real machine.

   It is marked by what it DOES, not which coaches it has: any train that turns
   every input into its output is right — "+ 2 then × 3" and "× 3 then + 6"
   are the same train, and a three-coach train that does the job is fine too.

   runOps(), parseOp() and machineRight() have no DOM, so the checks run them
   in Node. trainHtml() writes the paper; mountMachine() brings it to life.
   ========================================================================== */

/** A job as it is printed: "*4" → "× 4". */
export const opText = (op) => {
  if (!op) return "";
  const n = String(op.slice(1)).replace("-", "−");
  return { "+": `+ ${n}`, "-": `− ${n}`, "*": `× ${n}`, "/": `÷ ${n}` }[op[0]] || op;
};

/**
 * A job as a child types it — "+5", "- 3", "−3", "x4", "×4", "*4", "÷2",
 * "/2" — to its code ("+5", "-3", "*4", "/2"). "" for nothing typed yet, null
 * for something that is not a job.
 */
export function parseOp(s) {
  const t = String(s ?? "").replace(/\s+/g, "").replace(/[−–—]/g, "-").replace(/[×xX]/g, "*").replace(/÷/g, "/");
  if (!t) return "";
  const m = t.match(/^([+\-*/])(\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const n = Number(m[2]);
  if (m[1] === "/" && n === 0) return null;
  return `${m[1]}${n}`;
}

/** Put x through the jobs in order. */
export function runOps(ops, x) {
  return ops.reduce((v, op) => {
    if (!op) return NaN;
    const n = Number(op.slice(1));
    switch (op[0]) {
      case "+": return v + n;
      case "-": return v - n;
      case "*": return v * n;
      case "/": return v / n;
      default: return NaN;
    }
  }, x);
}

/** Does this train (every coach with a job) turn every input into its output? */
export function machineRight(ops, ins, outs) {
  if (!ops || !ops.length || ops.some((o) => !o)) return false;
  return ins.every((x, i) => Math.abs(runOps(ops, x) - outs[i]) < 1e-9);
}

const show = (v) => (Number.isFinite(v) ? String(Math.round(v * 1000) / 1000).replace("-", "−") : "?");

/* ── the drawing ────────────────────────────────────────────────────────── */

/* The engine, facing forward (right): boiler, cab with its window, chimney,
   the buffer at the front, and its wheels. Fixed hex, like all the paper. */
const ENGINE = `<svg class="fm-engine" viewBox="0 0 26 16" width="17mm" height="10.5mm" aria-hidden="true">` +
  `<rect x="1" y="3" width="9" height="9" rx="1.2" fill="#2f6ea8" stroke="#2a2723" stroke-width="0.6"/>` +
  `<rect x="3" y="4.6" width="5" height="3.4" rx="0.6" fill="#dcefff" stroke="#2a2723" stroke-width="0.4"/>` +
  `<rect x="0.2" y="2" width="10.6" height="1.6" rx="0.6" fill="#2a2723"/>` +
  `<rect x="9.6" y="6" width="12.6" height="6" rx="2.6" fill="#c0453f" stroke="#2a2723" stroke-width="0.6"/>` +
  `<rect x="15.6" y="1.6" width="3" height="4.6" rx="0.6" fill="#2a2723"/>` +
  `<path d="M22 8.4 25.4 12h-3.4z" fill="#8a837a" stroke="#2a2723" stroke-width="0.4"/>` +
  `<circle cx="5" cy="13.2" r="2.2" fill="#2a2723"/><circle cx="12.6" cy="13.4" r="2" fill="#2a2723"/><circle cx="19" cy="13.4" r="2" fill="#2a2723"/>` +
  `<circle cx="5" cy="13.2" r="0.8" fill="#fff3a8"/><circle cx="12.6" cy="13.4" r="0.7" fill="#fff3a8"/><circle cx="19" cy="13.4" r="0.7" fill="#fff3a8"/>` +
  `</svg>`;

const coachHtml = (i, op, given) =>
  `<span class="fm-coach${given ? " fm-coach--given" : ""}"${given ? "" : ` data-slot="${i}"`}>` +
  `<span class="fm-slot">${op ? opText(op) : ""}</span></span>`;

/**
 * A train, drawn.
 *   given   its jobs, written on the coaches — or
 *   slots   how many empty coaches, to BUILD it (on screen: live)
 *   ins     the inputs its log can be checked against (a train to build)
 *   tray    job cards to choose from
 *   inVal, outVal   a number written on the IN / OUT card
 */
export function trainHtml({ given = null, slots = 0, ins = [], tray = [], inVal = null, outVal = null }) {
  const coaches = given ? given.map((op) => coachHtml(0, op, true)) : Array.from({ length: slots }, (_, i) => coachHtml(i, null, false));
  const io = (side, word, v) => `<span class="fm-io fm-io--${side}"><em>${word}</em><b>${v === null ? "" : v}</b></span>`;
  const cards = tray.length
    ? `<div class="fm-tray"><span class="fm-tray__tag">Job cards</span>${tray.map((op) => `<span class="fm-op" data-op="${op}">${opText(op)}</span>`).join("")}</div>`
    : "";
  return `<div class="fm-wrap wb-nomath"${given ? "" : ` data-machine="1" data-ins="${ins.join(",")}" data-slots="${slots}"`}>` +
    `<div class="fm-row">${io("in", "In", inVal)}<span class="fm-train">${coaches.join(`<i class="fm-link"></i>`)}<i class="fm-link"></i>${ENGINE}</span>${io("out", "Out", outVal)}</div>` +
    `${cards}</div>`;
}

/* ── on screen ──────────────────────────────────────────────────────────── */

const MIN = 1;
const MAX = 6;
const ICON = {
  add: `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><rect x="10.5" y="4" width="3" height="16" rx="1.5" fill="var(--accent-success)"/><rect x="4" y="10.5" width="16" height="3" rx="1.5" fill="var(--accent-success)"/></svg>`,
  less: `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><rect x="4" y="10.5" width="16" height="3" rx="1.5" fill="var(--accent-danger)"/></svg>`,
  play: `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M6.6 3.8 20.4 12 6.6 20.2z" fill="var(--accent-success)"/></svg>`,
};

/**
 *   mountMachine(wrap, { saved, onChange })
 *     saved     the job in each coach from before ["+3", null, …], or null
 *   → { ops(), set(list), clear(), dispose() }
 */
export function mountMachine(wrap, { saved = null, onChange = () => {} } = {}) {
  const printed = wrap.innerHTML;
  const start = Number(wrap.dataset.slots) || wrap.querySelectorAll(".fm-coach").length || 1;
  let ops = saved && saved.length ? saved.slice(0, MAX) : Array.from({ length: start }, () => null);
  let typed = ops.map((op) => (op ? opText(op) : ""));   // what is written in each coach, right or not
  let chosen = 0;                                          // the coach a tapped card goes into
  let rides = [];
  wrap.dataset.machineLive = "1";

  const row = wrap.querySelector(".fm-row");
  const train = wrap.querySelector(".fm-train");
  const inCard = wrap.querySelector(".fm-io--in");
  const outCard = wrap.querySelector(".fm-io--out");
  inCard.innerHTML = `<em>In</em><input class="fm-in" type="text" inputmode="decimal" placeholder="?" aria-label="The number to put in" data-tip="Type a number, then drag this card along the train">`;
  inCard.classList.add("fm-io--live");
  inCard.setAttribute("data-tip", "Type a number, then drag this card along the train");
  outCard.querySelector("b").textContent = "";
  const numIn = inCard.querySelector(".fm-in");

  const bar = document.createElement("div");
  bar.className = "fm-controls";
  bar.innerHTML =
    `<button type="button" class="pp-btn wb-tint-4 fm-less" data-tip="Take the last coach off" aria-label="Take the last coach off">${ICON.less}</button>` +
    `<button type="button" class="pp-btn wb-tint-2 fm-add" data-tip="Add a coach" aria-label="Add a coach">${ICON.add}</button>` +
    `<button type="button" class="pp-btn wb-tint-1 fm-go" data-tip="Send the number through the train" aria-label="Send the number through the train">${ICON.play}</button>`;
  row.after(bar);
  const log = document.createElement("div");
  log.className = "fm-run";
  bar.after(log);

  const token = document.createElement("span");
  token.className = "fm-token";
  token.setAttribute("aria-hidden", "true");
  row.appendChild(token);

  const commit = (before) => onChange(ops.slice(), before);

  const paintLog = () => {
    log.innerHTML = rides.length
      ? `<span class="fm-run__tag">Rides</span>` + rides.map(([x, y]) => `<span class="fm-run__one">${show(x)} → <b>${show(y)}</b></span>`).join("")
      : `<span class="fm-run__tag">Type a number on IN and drag it along the train</span>`;
  };

  /* the coaches, drawn afresh whenever their number changes */
  const paintTrain = () => {
    const coaches = typed.map((t, i) =>
      `<span class="fm-coach fm-coach--live${ops[i] === null && t.trim() ? " is-bad" : ""}${i === chosen ? " is-chosen" : ""}" data-slot="${i}">` +
      `<input class="fm-type" type="text" value="${t.replace(/"/g, "&quot;")}" placeholder="job" maxlength="7" aria-label="The job in coach ${i + 1}" spellcheck="false"></span>`);
    train.innerHTML = coaches.join(`<i class="fm-link"></i>`) + `<i class="fm-link"></i>` + ENGINE;
    bar.querySelector(".fm-less").disabled = typed.length <= MIN;
    bar.querySelector(".fm-add").disabled = typed.length >= MAX;
  };

  const setJob = (i, text) => {
    const before = ops.slice();
    typed[i] = text;
    const op = parseOp(text);
    ops[i] = op || null;
    const coach = train.querySelector(`.fm-coach[data-slot="${i}"]`);
    coach?.classList.toggle("is-bad", op === null);
    if (coach) coach.querySelector(".fm-type").value = text;
    commit(before);
  };

  /* ── typing a job, choosing a coach ── */
  const onInput = (e) => {
    const inp = e.target.closest(".fm-type");
    if (!inp) return;
    const i = Number(inp.closest(".fm-coach").dataset.slot);
    typed[i] = inp.value;
    const op = parseOp(inp.value);
    inp.closest(".fm-coach").classList.toggle("is-bad", op === null);
  };
  /* a job is kept (and made one Undo step) when the child leaves the coach */
  const onChangeEvt = (e) => {
    const inp = e.target.closest(".fm-type");
    if (!inp) return;
    const i = Number(inp.closest(".fm-coach").dataset.slot);
    const op = parseOp(inp.value);
    const tidy = op ? opText(op) : inp.value;
    if (op !== ops[i] || tidy !== inp.value) setJob(i, tidy);
  };
  const onFocus = (e) => {
    const coach = e.target.closest?.(".fm-coach--live");
    if (!coach) return;
    chosen = Number(coach.dataset.slot);
    train.querySelectorAll(".fm-coach--live").forEach((c) => c.classList.toggle("is-chosen", c === coach));
  };

  /* ── tapping a job card: into the chosen coach, or the first empty one ── */
  const cardInto = (op, i = null) => {
    const at = i ?? (typed[chosen] === "" ? chosen : Math.max(0, typed.findIndex((t) => !t.trim())));
    const slot = at < 0 ? chosen : at;
    setJob(slot, opText(op));
    chosen = Math.min(slot + 1, typed.length - 1);
    paintTrain();
  };
  const onClick = (e) => {
    if (wrap.__fmSwallow) return;
    const card = e.target.closest(".fm-op");
    if (card) { cardInto(card.dataset.op); return; }
    if (e.target.closest(".fm-add") && typed.length < MAX) {
      const before = ops.slice();
      typed.push(""); ops.push(null); chosen = typed.length - 1;
      paintTrain(); commit(before);
      train.querySelector(`.fm-coach[data-slot="${chosen}"] .fm-type`)?.focus();
      return;
    }
    if (e.target.closest(".fm-less") && typed.length > MIN) {
      const before = ops.slice();
      typed.pop(); ops.pop(); chosen = Math.min(chosen, typed.length - 1);
      paintTrain(); commit(before);
      return;
    }
    if (e.target.closest(".fm-go")) ride(null);
  };
  const onKey = (e) => {
    if (e.key === "Enter" && e.target.closest(".fm-type")) { e.target.blur(); return; }
    if (e.key === "Enter" && e.target.closest(".fm-in")) { ride(null); return; }
    if ((e.key === "Enter" || e.key === " ") && e.target.closest(".fm-op")) { e.preventDefault(); cardInto(e.target.closest(".fm-op").dataset.op); }
  };

  /* ── the ride: the IN card carried along the train ──────────────────── */
  const stops = () => {
    const base = row.getBoundingClientRect();
    const mid = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2 - base.left, y: r.top + r.height / 2 - base.top }; };
    return {
      from: mid(inCard),
      coaches: [...train.querySelectorAll(".fm-coach")].map(mid),
      to: mid(outCard),
    };
  };
  const valueAt = (x, s, n) => {
    let v = n;
    let passed = 0;
    s.coaches.forEach((c, i) => { if (x >= c.x) { v = runOps([ops[i]], v); passed = i + 1; } });
    return { v, passed };
  };
  const place = (x, s, n) => {
    const { v, passed } = valueAt(x, s, n);
    token.style.left = `${x}px`;
    token.style.top = `${s.from.y}px`;
    token.textContent = show(v);
    train.querySelectorAll(".fm-coach").forEach((c, i) => c.classList.toggle("is-passed", i < passed));
    return v;
  };
  const inputNumber = () => {
    const t = String(numIn.value).trim().replace(/[−–—]/g, "-");
    if (!/^-?\d+(\.\d+)?$/.test(t)) {
      inCard.classList.remove("is-wrong"); void inCard.offsetWidth; inCard.classList.add("is-wrong");
      numIn.focus();
      return null;
    }
    return Number(t);
  };
  const arrive = (n, s) => {
    const y = runOps(ops, n);
    outCard.querySelector("b").textContent = show(y);
    outCard.classList.remove("is-new"); void outCard.offsetWidth; outCard.classList.add("is-new");
    rides = [[n, y], ...rides.filter(([a]) => a !== n)].slice(0, 6);
    paintLog();
    token.classList.remove("is-riding");
    setTimeout(() => { token.classList.remove("is-on"); train.querySelectorAll(".fm-coach").forEach((c) => c.classList.remove("is-passed")); }, 350);
    void s;
  };
  let anim = 0;
  /** The play button: the same ride, driven by the clock. */
  function ride() {
    const n = inputNumber();
    if (n === null) return;
    cancelAnimationFrame(anim);
    const s = stops();
    token.classList.add("is-on", "is-riding");
    const t0 = performance.now();
    const T = 500 + 380 * s.coaches.length;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / T);
      place(s.from.x + (s.to.x - s.from.x) * k, s, n);
      if (k < 1) anim = requestAnimationFrame(step); else arrive(n, s);
    };
    anim = requestAnimationFrame(step);
  }

  /* dragging: the IN card itself (not its number box), or a job card */
  let drag = null;
  const onDown = (e) => {
    if (!wrap.dataset.machineLive) return;
    if (e.target.closest(".fm-io--in") && !e.target.closest(".fm-in")) {
      const n = inputNumber();
      if (n === null) return;
      e.preventDefault();
      drag = { kind: "ride", id: e.pointerId, n, s: stops(), x0: e.clientX, moved: false };
      token.classList.add("is-on");
      place(drag.s.from.x, drag.s, n);
      return;
    }
    const card = e.target.closest(".fm-op");
    if (card) drag = { kind: "card", op: card.dataset.op, x: e.clientX, y: e.clientY, ghost: null, id: e.pointerId };
  };
  const onMove = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (drag.kind === "ride") {
      const base = row.getBoundingClientRect();
      const x = Math.max(drag.s.from.x, Math.min(drag.s.to.x, e.clientX - base.left));
      drag.moved = true;
      place(x, drag.s, drag.n);
      return;
    }
    if (!drag.ghost) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
      drag.ghost = document.createElement("span");
      drag.ghost.className = "fm-op fm-ghost";
      drag.ghost.textContent = opText(drag.op);
      document.body.appendChild(drag.ghost);
    }
    drag.ghost.style.left = `${e.clientX}px`;
    drag.ghost.style.top = `${e.clientY}px`;
  };
  const onUp = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    if (d.kind === "ride") {
      const base = row.getBoundingClientRect();
      const x = e.clientX - base.left;
      /* all the way to OUT: it arrives. Let go on the way: it rolls back. */
      if (x >= d.s.to.x - 14) { place(d.s.to.x, d.s, d.n); arrive(d.n, d.s); } else {
        token.classList.remove("is-on");
        train.querySelectorAll(".fm-coach").forEach((c) => c.classList.remove("is-passed"));
      }
      return;
    }
    if (!d.ghost) return;   // a tap: the click handler has it
    d.ghost.remove();
    const coach = document.elementsFromPoint(e.clientX, e.clientY).map((el) => el.closest?.(".fm-coach--live")).find((c) => c && wrap.contains(c));
    if (coach) cardInto(d.op, Number(coach.dataset.slot));
    /* the click that follows a drag must not put the card in a second time */
    wrap.__fmSwallow = true;
    setTimeout(() => { wrap.__fmSwallow = false; }, 0);
  };

  wrap.addEventListener("click", onClick);
  wrap.addEventListener("input", onInput);
  wrap.addEventListener("change", onChangeEvt);
  wrap.addEventListener("focusin", onFocus);
  wrap.addEventListener("keydown", onKey);
  wrap.addEventListener("pointerdown", onDown);
  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", onUp);
  wrap.querySelectorAll(".fm-op").forEach((c) => { c.setAttribute("role", "button"); c.tabIndex = 0; c.setAttribute("data-tip", "Tap to put this job in a coach, or drag it onto one"); });
  paintTrain();
  paintLog();

  const reset = (list) => {
    ops = list.slice(0, MAX).map((o) => o || null);
    if (!ops.length) ops = [null];
    typed = ops.map((op) => (op ? opText(op) : ""));
    chosen = 0;
    paintTrain();
  };

  return {
    ops: () => ops.slice(),
    set(list) { reset(list); },
    clear() { reset(Array.from({ length: start }, () => null)); rides = []; paintLog(); outCard.querySelector("b").textContent = ""; },
    dispose() {
      cancelAnimationFrame(anim);
      delete wrap.dataset.machineLive;
      wrap.removeEventListener("click", onClick);
      wrap.removeEventListener("input", onInput);
      wrap.removeEventListener("change", onChangeEvt);
      wrap.removeEventListener("focusin", onFocus);
      wrap.removeEventListener("keydown", onKey);
      wrap.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      /* back to the paper exactly as it was printed */
      wrap.innerHTML = printed;
    },
  };
}
