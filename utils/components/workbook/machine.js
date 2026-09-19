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
       one coach at a time: it STOPS at each coach, the coach's job happens on
       the card (7 → 7 × 4 → 28), and it waits there until it is moved on;
       after the last coach it steps off at OUT. The play button moves it on
       one coach for a child who cannot drag.
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
/* A locomotive, facing forward (right): the cab at the back with its roof
   and window, the boiler with a dome and bands, the smokebox and a flared
   chimney at the front, a lamp and a cowcatcher — and spoked wheels with a
   coupling rod, all standing on the same rail as the coaches' wheels. */
const wheel = (cx, cy, r) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#2a2723"/><circle cx="${cx}" cy="${cy}" r="${r - 0.75}" fill="#6b645a"/>` +
  [0, 60, 120].map((d) => { const a = (d * Math.PI) / 180; const k = r - 0.8; return `<line x1="${(cx - k * Math.cos(a)).toFixed(2)}" y1="${(cy - k * Math.sin(a)).toFixed(2)}" x2="${(cx + k * Math.cos(a)).toFixed(2)}" y2="${(cy + k * Math.sin(a)).toFixed(2)}" stroke="#2a2723" stroke-width="0.45"/>`; }).join("") +
  `<circle cx="${cx}" cy="${cy}" r="0.75" fill="#f4c95d" stroke="#2a2723" stroke-width="0.3"/>`;
const ENGINE = `<svg class="fm-engine" viewBox="0 0 36 20" width="22.5mm" height="12.5mm" aria-hidden="true">` +
  /* cab */
  `<rect x="2" y="4" width="10" height="10.4" rx="0.8" fill="#2f6ea8" stroke="#2a2723" stroke-width="0.5"/>` +
  `<rect x="0.8" y="2.4" width="12.6" height="2.2" rx="0.9" fill="#2a2723"/>` +
  `<rect x="4.4" y="5.8" width="5.2" height="4" rx="0.7" fill="#dcefff" stroke="#2a2723" stroke-width="0.4"/>` +
  /* boiler, bands, dome */
  `<rect x="11.4" y="7.4" width="17" height="7" rx="3.2" fill="#c0453f" stroke="#2a2723" stroke-width="0.5"/>` +
  `<rect x="16.6" y="7.5" width="0.9" height="6.8" fill="#8e2f2a"/><rect x="22.2" y="7.5" width="0.9" height="6.8" fill="#8e2f2a"/>` +
  `<path d="M17.6 7.6a2.4 2.2 0 0 1 4.8 0z" fill="#f4c95d" stroke="#2a2723" stroke-width="0.4"/>` +
  /* smokebox, chimney, lamp */
  `<rect x="27" y="6.8" width="5" height="8.2" rx="1.4" fill="#2a2723"/>` +
  `<path d="M27.8 6.9 28.3 3.2H27.4V1.6H32.6V3.2H31.7L32.2 6.9z" fill="#2a2723"/>` +
  `<circle cx="32.9" cy="8.6" r="1.2" fill="#fff3a8" stroke="#2a2723" stroke-width="0.4"/>` +
  /* footplate, cowcatcher */
  `<rect x="1" y="14.2" width="31.4" height="1.3" rx="0.4" fill="#2a2723"/>` +
  `<path d="M31.4 15.4 35.6 19.4H30.6z" fill="#8a837a" stroke="#2a2723" stroke-width="0.4"/>` +
  /* wheels on the rail (y = 20), a rod coupling the two big ones */
  wheel(7.4, 16.6, 3.4) + wheel(15.4, 16.6, 3.4) + wheel(25, 17.6, 2.4) +
  `<rect x="7.4" y="16.1" width="8" height="1" rx="0.5" fill="#b8b0a3" stroke="#2a2723" stroke-width="0.3"/>` +
  `</svg>`;

/* two wheels under every coach, standing on the rail */
const WHEELS = `<i class="fm-wheel fm-wheel--a"></i><i class="fm-wheel fm-wheel--b"></i>`;
const coachHtml = (i, op, given) =>
  `<span class="fm-coach${given ? " fm-coach--given" : ""}"${given ? "" : ` data-slot="${i}"`}>` +
  `<span class="fm-slot">${op ? opText(op) : ""}</span>${WHEELS}</span>`;

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
    `<button type="button" class="pp-btn wb-tint-1 fm-go" data-tip="Move the card on to the next coach" aria-label="Move the card on to the next coach">${ICON.play}</button>`;
  row.after(bar);
  const log = document.createElement("div");
  log.className = "fm-run";
  bar.after(log);

  const token = document.createElement("span");
  token.className = "fm-token";
  token.setAttribute("aria-hidden", "true");
  row.appendChild(token);

  const commit = (before) => { halt(); onChange(ops.slice(), before); };

  const paintLog = () => {
    log.innerHTML = rides.length
      ? `<span class="fm-run__tag">Rides</span>` + rides.map(([x, y]) => `<span class="fm-run__one">${show(x)} → <b>${show(y)}</b></span>`).join("")
      : `<span class="fm-run__tag">Type a number on IN and drag it along the train</span>`;
  };

  /* the coaches, drawn afresh whenever their number changes */
  const paintTrain = () => {
    const coaches = typed.map((t, i) =>
      `<span class="fm-coach fm-coach--live${ops[i] === null && t.trim() ? " is-bad" : ""}${i === chosen ? " is-chosen" : ""}" data-slot="${i}">` +
      `<input class="fm-type" type="text" value="${t.replace(/"/g, "&quot;")}" placeholder="job" maxlength="7" aria-label="The job in coach ${i + 1}" spellcheck="false">${WHEELS}</span>`);
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
    if (e.target.closest(".fm-in")) { halt(); return; }
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
    if (e.target.closest(".fm-go")) forward();
  };
  const onKey = (e) => {
    if (e.key === "Enter" && e.target.closest(".fm-type")) { e.target.blur(); return; }
    if (e.key === "Enter" && e.target.closest(".fm-in")) { halt(); forward(); return; }
    if ((e.key === "Enter" || e.key === " ") && e.target.closest(".fm-op")) { e.preventDefault(); cardInto(e.target.closest(".fm-op").dataset.op); }
  };

  /* ── the ride: the IN card, one coach at a time ─────────────────────────
     The card is dragged (or sent with the play button) to the NEXT coach
     only. There it stops, and the coach's job happens ON the card — "7" becomes
     "7 × 4", then "28" — and it waits until it is moved on again. After the
     last coach it steps off at OUT. */
  let trip = null;     // { n, j (the station: 0 IN, 1… coaches, last OUT), v }
  let timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const stations = () => {
    const base = row.getBoundingClientRect();
    const mid = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2 - base.left, y: r.top + r.height / 2 - base.top }; };
    return [mid(inCard), ...[...train.querySelectorAll(".fm-coach")].map(mid), mid(outCard)];
  };
  const face = (small, big) => { token.innerHTML = `${small ? `<small>${small}</small>` : ""}<b>${big}</b>`; };
  const put = (x) => {
    const s = stations();
    token.style.left = `${x}px`;
    token.style.top = `${s[0].y}px`;
  };
  const lightUp = () => train.querySelectorAll(".fm-coach").forEach((c, i) => {
    c.classList.toggle("is-passed", !!trip && i < trip.j - 1);
    c.classList.toggle("is-here", !!trip && i === trip.j - 1);
  });
  /** Stop the ride: a job changed, a coach came or went, a new number. */
  const halt = () => {
    timers.forEach(clearTimeout); timers = [];
    trip = null;
    token.classList.remove("is-on", "is-moving", "is-working");
    lightUp();
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
  /** A new ride from IN, with the number on the card. */
  const board = () => {
    const n = inputNumber();
    if (n === null) return false;
    halt();
    trip = { n, j: 0, v: n };
    token.classList.add("is-on");
    face("", show(n));
    put(stations()[0].x);
    return true;
  };
  /** The card has reached station j: do the job there, on the card. */
  const reach = (j) => {
    const s = stations();
    trip.j = j;
    put(s[j].x);
    lightUp();
    if (j === s.length - 1) {
      /* off at OUT */
      const { n, v } = trip;
      outCard.querySelector("b").textContent = show(v);
      outCard.classList.remove("is-new"); void outCard.offsetWidth; outCard.classList.add("is-new");
      rides = [[n, v], ...rides.filter(([a]) => a !== n)].slice(0, 6);
      paintLog();
      later(() => { token.classList.remove("is-on"); trip = null; lightUp(); }, 700);
      return;
    }
    const op = ops[j - 1];
    const before = trip.v;
    token.classList.add("is-working");
    face(show(before), op ? opText(op) : "?");
    later(() => {
      if (!trip) return;
      trip.v = op ? runOps([op], before) : NaN;
      face(`${show(before)} ${op ? opText(op) : "?"} =`, show(trip.v));
      token.classList.remove("is-working");
      token.classList.remove("is-pop"); void token.offsetWidth; token.classList.add("is-pop");
    }, 520);
  };
  /** Glide the card from where it is to the next station. */
  const glide = (fromX) => {
    const s = stations();
    const to = trip.j + 1;
    const a = fromX ?? s[trip.j].x; const b = s[to].x;
    token.classList.add("is-moving");
    face("", show(trip.v));
    const t0 = performance.now(); const T = 420;
    const step = (t) => {
      if (!trip) return;
      const k = Math.min(1, (t - t0) / T);
      put(a + (b - a) * (1 - (1 - k) * (1 - k)));
      if (k < 1) requestAnimationFrame(step); else { token.classList.remove("is-moving"); reach(to); }
    };
    requestAnimationFrame(step);
  };
  /** The play button, or Enter: on to the next coach (boarding first if need be). */
  const forward = () => {
    if (token.classList.contains("is-moving") || token.classList.contains("is-working")) return;
    if (!trip && !board()) return;
    glide(null);
  };

  /* dragging: the IN card (not its number box) boards a new ride; the riding
     card itself goes on from where it stopped — but only as far as the NEXT
     coach. Let go more than half-way and it goes on there; less, it rolls back. */
  let drag = null;
  const onDown = (e) => {
    if (!wrap.dataset.machineLive) return;
    const fromIn = e.target.closest(".fm-io--in") && !e.target.closest(".fm-in");
    const onCard = e.target.closest(".fm-token");
    if (fromIn || onCard) {
      if (token.classList.contains("is-moving") || token.classList.contains("is-working")) return;
      if (fromIn && !board()) return;
      if (!trip) return;
      e.preventDefault();
      drag = { kind: "ride", id: e.pointerId, s: stations(), x: stations()[trip.j].x, dx: 0, x0: e.clientX };
      face("", show(trip.v));
      return;
    }
    const card = e.target.closest(".fm-op");
    if (card) drag = { kind: "card", op: card.dataset.op, x: e.clientX, y: e.clientY, ghost: null, id: e.pointerId };
  };
  const onMove = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (drag.kind === "ride") {
      const s = drag.s;
      const lo = s[trip.j].x; const hi = s[trip.j + 1].x;
      drag.x = Math.max(lo, Math.min(hi, lo + (e.clientX - drag.x0)));
      put(drag.x);
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
      if (!trip) return;
      const lo = d.s[trip.j].x; const hi = d.s[trip.j + 1].x;
      if (d.x - lo >= (hi - lo) * 0.5) glide(d.x);
      else put(lo);   // not far enough: back where it stopped
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
    halt();
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
      halt();
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
