/* ============================================================================
   PRINTABLE WORKBOOK — a function machine you build
   ----------------------------------------------------------------------------
   A function machine takes a number in, does its jobs to it in order, and
   gives a number out. On paper the child writes a job into each empty box of
   the machine; on screen they pick a job card off the tray and put it in a box
   (tap the card, tap the box — or drag it there), and a row under the machine
   shows at once what THEIR machine gives for each input, so they can test it
   against the table the way you would test a real one.

   It is marked by what it DOES, not by which cards it holds: any machine that
   turns every input into its output is right. "+ 2 then × 3" and "× 3 then
   + 6" are the same machine, and a child who finds the second has found it.

   The workbook writes it:

     div.fm-wrap[data-machine][data-ins="1,2,3"]     one machine to build
       .fm-slot[data-slot]                           an empty box, in order
       .fm-op[data-op="+3"]                          a job card on the tray
       .fm-run                                       where the test row goes

   A job is written "+3", "-2", "*4" or "/2". runOps() and machineRight() have
   no DOM, so the checks run them in Node.
   ========================================================================== */

/** A job as it is printed: "*4" → "× 4". */
export const opText = (op) => {
  const n = op.slice(1);
  return { "+": `+ ${n}`, "-": `− ${n}`, "*": `× ${n}`, "/": `÷ ${n}` }[op[0]] || op;
};

/** Put x through the jobs in order. */
export function runOps(ops, x) {
  return ops.reduce((v, op) => {
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

/** Does this machine (every box filled) turn every input into its output? */
export function machineRight(ops, ins, outs) {
  if (!ops.length || ops.some((o) => !o)) return false;
  return ins.every((x, i) => Math.abs(runOps(ops, x) - outs[i]) < 1e-9);
}

const show = (v) => (Number.isFinite(v) ? String(Math.round(v * 1000) / 1000).replace("-", "−") : "?");

/**
 *   mountMachine(wrap, { saved, onChange })
 *     saved     the job in each box from before, [op | null, …], or null
 *   → { ops(), set(list), clear(), dispose() }
 */
export function mountMachine(wrap, { saved = null, onChange = () => {} } = {}) {
  const slots = [...wrap.querySelectorAll(".fm-slot")];
  const cards = [...wrap.querySelectorAll(".fm-op")];
  const ins = (wrap.dataset.ins || "").split(",").filter((s) => s !== "").map(Number);
  let ops = saved ? saved.slice(0, slots.length) : slots.map(() => null);
  while (ops.length < slots.length) ops.push(null);
  let held = null;
  wrap.dataset.machineLive = "1";

  /* the boxes and cards become real buttons: a tap, or Enter, does the same */
  [...slots, ...cards].forEach((el) => { el.setAttribute("role", "button"); el.tabIndex = 0; });

  let run = wrap.querySelector(".fm-run");
  if (!run) { run = document.createElement("div"); run.className = "fm-run"; wrap.appendChild(run); }

  const paint = () => {
    slots.forEach((s, i) => {
      s.textContent = ops[i] ? opText(ops[i]) : "";
      s.classList.toggle("is-full", !!ops[i]);
      s.setAttribute("aria-label", ops[i] ? `box ${i + 1}: ${opText(ops[i])} — tap to empty it` : `box ${i + 1}: empty`);
    });
    cards.forEach((c) => c.classList.toggle("is-held", c.dataset.op === held));
    wrap.classList.toggle("is-holding", !!held);
    /* the test row: what THIS machine gives, for every input in the table */
    const full = ops.every(Boolean);
    run.innerHTML = `<span class="fm-run__tag">Your machine</span>` + ins.map((x) =>
      `<span class="fm-run__one">${show(x)} → <b>${full ? show(runOps(ops, x)) : "…"}</b></span>`).join("");
  };

  const put = (i, op) => {
    const before = ops.slice();
    ops[i] = op;
    paint();
    onChange(ops.slice(), before);
  };

  const onTap = (e) => {
    if (!wrap.dataset.machineLive) return;
    const card = e.target.closest(".fm-op");
    const slot = e.target.closest(".fm-slot");
    if (card) { held = held === card.dataset.op ? null : card.dataset.op; paint(); return; }
    if (slot) {
      const i = Number(slot.dataset.slot);
      if (held) { const op = held; held = null; put(i, op); } else if (ops[i]) put(i, null);
    }
  };
  const onKey = (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.closest(".fm-op, .fm-slot")) { e.preventDefault(); onTap(e); }
  };

  /* dragging a card onto a box: the box under the finger when it is let go */
  let drag = null;
  const onDown = (e) => {
    const card = e.target.closest(".fm-op");
    if (!card || !wrap.dataset.machineLive) return;
    drag = { op: card.dataset.op, x: e.clientX, y: e.clientY, ghost: null, id: e.pointerId };
  };
  const onMove = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
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
    const { ghost, op } = drag;
    drag = null;
    if (!ghost) return;   // a tap: the click handler has it
    ghost.remove();
    const slot = document.elementsFromPoint(e.clientX, e.clientY).map((el) => el.closest?.(".fm-slot")).find((s) => s && wrap.contains(s));
    if (slot) { held = null; put(Number(slot.dataset.slot), op); }
    /* the click that follows a drag must not pick the card up */
    wrap.__fmSwallow = true;
    setTimeout(() => { wrap.__fmSwallow = false; }, 0);
  };
  const onClick = (e) => { if (wrap.__fmSwallow) return; onTap(e); };

  wrap.addEventListener("click", onClick);
  wrap.addEventListener("keydown", onKey);
  wrap.addEventListener("pointerdown", onDown);
  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", onUp);
  paint();

  return {
    ops: () => ops.slice(),
    set(list) { ops = list.slice(); held = null; paint(); },
    clear() { ops = slots.map(() => null); held = null; paint(); },
    dispose() {
      delete wrap.dataset.machineLive;
      wrap.removeEventListener("click", onClick);
      wrap.removeEventListener("keydown", onKey);
      wrap.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      run.remove();
      slots.forEach((s) => { s.textContent = ""; s.classList.remove("is-full"); s.removeAttribute("role"); s.removeAttribute("tabindex"); });
      cards.forEach((c) => { c.classList.remove("is-held"); c.removeAttribute("role"); c.removeAttribute("tabindex"); });
    },
  };
}
