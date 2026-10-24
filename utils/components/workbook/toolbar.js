/* ============================================================================
   THE WORKBOOK'S TOOLS, ON ANY PAGE
   ----------------------------------------------------------------------------
   The workbook's own rail lives inside interactive.js, where it is wired to
   the paper: modes, instruments laid on the sheet at the sheet's scale, the
   scribble layer, the marking. None of that means anything on a page that is
   not a workbook — but the TOOLS do. A child working out a shop bill wants the
   same calculator and the same written boards as a child working out a
   question on paper, and there is no reason for the site to own two of each.

   So this is the small rail: a key per tool, each opening the real component
   in the real panel (panels.js), with what it was showing kept between visits.
   It takes no paper and no modes, so any page can hang it on the body.

     mountTools(document.body, { tools: ["calculator", "column"] })

   The default set is the working-out tools, which is what a page that is not a
   workbook is going to want.
   ========================================================================== */

import { openPanel, needCss } from "./panels.js";
import { TOOL_ICONS } from "./instruments.js";
import { mountTooltips } from "../tooltip.js";
import { dropPin, restorePins } from "./pins.js";

/* Each tool says only how to open itself. The components are imported when a
   key is first pressed, not before: a shop page should not pay for a long
   division board nobody opens. */
/** One written board, opened in a panel — the same component the workbook uses. */
const board = (id, label) => ({
  [id]: {
    label,
    size: { w: 460, h: 430 },
    async open(body) {
      needCss("/utils/components/boards.css");
      const { mountBoard } = await import("/utils/components/boards/sheet.js");
      /* the mounted board is left on its own element: a board knows the sum it
         is working and what figure comes next, and a tutor demonstrating on it
         needs to be able to ask (toy-shop/js/guide.js) */
      const board = mountBoard(body, { variant: id, base: 10 });
      if (board?.el) board.el.__board = board;
    },
  },
});

const TOOLS = {
  /* a sticky note stuck anywhere on the page (workbook/pins.js); a page with a canvas of its own hands in its own */
  pin: { label: "Pin a sticky note anywhere", act: dropPin },
  /* THE CHEMISTRY BENCH, from any page that hangs the rail: the real bench in a panel
     (it is its own page, in a frame, so it brings its own sign-in and its own saved bench) */
  chembench: {
    label: "Chemistry Bench",
    size: { w: 980, h: 640 },
    icon: `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M9 2.600h6v6.200l5 9.400a2.400 2.400 0 0 1-2.100 3.500H6.100A2.400 2.400 0 0 1 4 18.200l5-9.400z" fill="#6fb7e8"/><path d="M7.400 14.600h9.200l1.900 3.700a1 1 0 0 1-.9 1.500H6.400a1 1 0 0 1-.9-1.500z" fill="#fff"/><circle cx="10.500" cy="16.800" r="1" fill="#6fb7e8"/><circle cx="14" cy="15.600" r="0.8" fill="#6fb7e8"/></svg>`,
    async open(body) {
      body.classList.add("wb-panel__body--bare");
      const f = document.createElement("iframe");
      f.src = "/virtual-lab/chemistry-2d/";
      f.title = "Chemistry Bench";
      f.setAttribute("allow", "fullscreen");
      f.style.cssText = "display:block;width:100%;height:100%;min-height:420px;border:0;background:#272c35";
      body.appendChild(f);
      return () => f.remove();
    },
  },
  calculator: {
    label: "Calculator",
    size: { w: 340, h: 500 },
    async open(body) {
      /* THE SITE'S ONE CALCULATOR — the same machine as the chemistry bench
         (utils/components/calculator.js), in its paper skin. There is no
         second calculator to keep in step with this one. */
      needCss("/utils/components/calculator.css");
      body.classList.add("wb-panel__body--bare", "wb-panel__body--scroll");
      const { mountCalculator } = await import("/utils/components/calculator.js");
      const host = document.createElement("div");
      host.className = "cl-calc cl-calc--inline";
      host.tabIndex = 0;
      body.appendChild(host);
      const { saved, onChange } = kept("wb-calc");
      mountCalculator(host, {
        state: saved && typeof saved === "object" ? saved : undefined,
        onChange,
        brand: "PREP <b>fx-82</b>",
        theme: "paper",
      });
      host.focus({ preventScroll: true });
      return () => host.remove();
    },
  },
  ...board("column", "Column addition"),
  ...board("times", "Column multiplication"),
  ...board("criss", "Criss-cross multiplication"),
  ...board("shortdiv", "Short division"),
  ...board("longdiv", "Long division"),
  shift: {
    label: "Multiply and divide by ten",
    size: { w: 480, h: 440 },
    async open(body) {
      body.classList.add("wb-panel__body--bare");
      const { mountShift } = await import("./shift.js");
      const t = mountShift(body, kept("wb-shift"));
      return () => t.destroy();
    },
  },
  barmodel: {
    label: "Bar model",
    size: { w: 680, h: 520 },
    async open(body) {
      body.classList.add("wb-panel__body--bare");
      const { mountBarModel } = await import("./barmodel.js");
      const host = document.createElement("div");
      host.className = "mb-board wb-barmodel";
      body.appendChild(host);
      const { saved, onChange } = kept("wb-barmodel");
      const live = mountBarModel(host, {
        saved: saved && Array.isArray(saved.bars) ? saved : null,
        onChange,
      });
      return () => live.dispose();
    },
  },
  ...Object.fromEntries(["burger", "mountain", "venn", "roundabout", "oreo", "tchart", "causes", "sequence", "senses", "fishbone", "flow", "table"].map((kind) => [kind, {
    label: kind,
    size: { w: 720, h: 620 },
    async open(body) {
      needCss("/utils/components/sticky-note.css");
      body.classList.add("wb-panel__body--bare", "wb-panel__body--scroll");
      const { mountOrganiser } = await import("./organiser.js");
      const { saved, onChange } = kept(`wb-org:${kind}`);
      const live = mountOrganiser(body, { kind, saved, onChange });
      return () => live.dispose();
    },
  }])),
  linemodel: {
    label: "Number line",
    size: { w: 680, h: 420 },
    async open(body) {
      body.classList.add("wb-panel__body--bare");
      const { mountLineModel } = await import("./linemodel.js");
      const host = document.createElement("div");
      host.className = "lm-host wb-linemodel";
      body.appendChild(host);
      const { saved, onChange } = kept("wb-linemodel");
      const live = mountLineModel(host, { saved: saved && Array.isArray(saved.marks) ? saved : null, onChange });
      return () => live.dispose();
    },
  },
  vennmodel: {
    label: "Venn diagram",
    size: { w: 720, h: 690 },
    async open(body) {
      body.classList.add("wb-panel__body--bare", "wb-panel__body--scroll");
      const { mountVennModel } = await import("./vennmodel.js");
      const host = document.createElement("div");
      host.className = "vn-host wb-vennmodel";
      body.appendChild(host);
      const { saved, onChange } = kept("wb-vennmodel");
      const live = mountVennModel(host, { saved: saved && Array.isArray(saved.sets) ? saved : null, onChange });
      return () => live.dispose();
    },
  },
  nodesmodel: {
    label: "Nodes",
    size: { w: 720, h: 580 },
    async open(body) {
      body.classList.add("wb-panel__body--bare", "wb-panel__body--scroll");
      const { mountNodesModel } = await import("./nodesmodel.js");
      const host = document.createElement("div");
      host.className = "nd-host wb-nodesmodel";
      body.appendChild(host);
      const { saved, onChange } = kept("wb-nodesmodel");
      const live = mountNodesModel(host, { saved: saved && Array.isArray(saved.nodes) ? saved : null, onChange });
      return () => live.dispose();
    },
  },
  flowmodel: {
    label: "Flow chart",
    size: { w: 720, h: 580 },
    async open(body) {
      body.classList.add("wb-panel__body--bare", "wb-panel__body--scroll");
      const { mountFlowModel } = await import("./flowmodel.js");
      const host = document.createElement("div");
      host.className = "fl-host wb-flowmodel";
      body.appendChild(host);
      const { saved, onChange } = kept("wb-flowmodel");
      const live = mountFlowModel(host, { saved: saved && Array.isArray(saved.nodes) ? saved : null, onChange });
      return () => live.dispose();
    },
  },
  note: {
    label: "Notes",
    size: { w: 420, h: 380 },
    async open(body) {
      needCss("/utils/components/sticky-note.css");
      body.classList.add("wb-panel__body--bare");
      const [{ createStickyEditor }, { makeNote }] = await Promise.all([
        import("/utils/components/sticky-note-editor.js"),
        import("/utils/components/sticky-note.js"),
      ]);
      const KEY = `wb-note:${location.pathname}`;
      let saved = null;
      try { saved = JSON.parse(localStorage.getItem(KEY) || "null"); } catch { /* a fresh note */ }
      const note = makeNote(saved && Array.isArray(saved.runs) ? { runs: saved.runs, paper: saved.paper || 0 } : {});
      const keep = (n) => { try { localStorage.setItem(KEY, JSON.stringify({ runs: n.runs, paper: n.paper })); } catch { /* storage full or off */ } };
      let shut = false;
      const pad = createStickyEditor({
        host: body,
        onInput: keep,
        /* a pad stays open until its panel is shut */
        onDone: (n) => { keep(n); if (!shut) setTimeout(() => { if (!shut) pad.open(n); }, 0); },
      });
      pad.el.classList.add("pp-note--pad");
      pad.open(note);
      return () => { shut = true; pad.close(true); pad.destroy(); };
    },
  },
};

/** What a tool was showing last time, and how to keep what it shows now. */
function kept(key) {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(key) || "null"); } catch { /* a fresh one */ }
  return {
    saved,
    onChange: (st) => { try { localStorage.setItem(key, JSON.stringify(st)); } catch { /* not kept */ } },
  };
}

export const TOOL_IDS = Object.keys(TOOLS);

/**
 * Hang the rail on `host` (the body, normally).
 *
 *   tools   which ones, in order
 *   at      "left" or "right" — which side of the window it sits against
 * → { el, open(id), destroy() }
 */
export function mountTools(host = document.body, { tools = ["calculator", "column", "times", "shortdiv", "pin", "note"], at = "left", extra = {} } = {}) {
  /* the rail fetches its own dress, so a page that wants tools needs one line
     and no stylesheet link of its own */
  needCss("/utils/components/workbook.css");
  /* A page can bring tools of its own (Algebra Moves' formula book): the same
     { label, size, open(body) } a built-in tool is, joining the same rail. */
  const ALL = { ...TOOLS, ...extra };
  const ids = tools.filter((id) => ALL[id]);
  if (ids.includes("pin") && ALL.pin === TOOLS.pin) restorePins();

  const el = document.createElement("aside");
  el.className = `wb-tools wb-tools--${at}`;
  el.setAttribute("aria-label", "Tools");
  el.innerHTML = `<div class="wb-tools__paper pp-receipt__paper">`
    + ids.map((id) => `<button type="button" class="wb-tools__btn" data-wbtool="${id}"`
      + ` aria-pressed="false" aria-label="${ALL[id].label}"`
      + ` data-tip="${ALL[id].label}" data-tip-side="${at === "left" ? "right" : "left"}">`
      + `${ALL[id].icon || TOOL_ICONS[id] || TOOL_ICONS.note}</button>`).join("")
    + `</div>`
    /* the tab on the rail's inner edge: slides the whole rail away, and back (like the
       chemistry bench's drawer). Whether it is away is remembered on this machine. */
    + `<button type="button" class="wb-tools__tab" aria-label="Put the tools away" aria-expanded="true" data-tip="Slide the tools away" data-tip-side="${at === "left" ? "right" : "left"}">`
    + `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="${at === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
  host.appendChild(el);
  mountTooltips();

  /* A page that fills the screen with one element (Algebra Moves' canvas)
     would leave the rail and its panels behind it, out of sight and out of
     reach. So they follow whatever is filling the screen, and come home after. */
  const follow = () => {
    const full = document.fullscreenElement || document.webkitFullscreenElement;
    const into = full && !full.contains(host) ? full : host;
    if (el.parentNode !== into) into.appendChild(el);
    const panelsInto = full || document.body;
    for (const p of document.querySelectorAll(".wb-panel")) if (p.parentNode !== panelsInto) panelsInto.appendChild(p);
  };
  document.addEventListener("fullscreenchange", follow);
  document.addEventListener("webkitfullscreenchange", follow);
  follow();

  const SHUT = "wb-tools-shut";
  function slide(away) {
    el.classList.toggle("is-shut", away);
    const tab = el.querySelector(".wb-tools__tab");
    tab.setAttribute("aria-expanded", String(!away));
    tab.setAttribute("aria-label", away ? "Bring the tools back" : "Put the tools away");
    tab.dataset.tip = away ? "Slide the tools back" : "Slide the tools away";
    try { localStorage.setItem(SHUT, away ? "1" : "0"); } catch { /* not kept */ }
  }
  let was = false;
  try { was = localStorage.getItem(SHUT) === "1"; } catch { /* open */ }
  if (was) slide(true);
  el.querySelector(".wb-tools__tab").addEventListener("click", () => slide(!el.classList.contains("is-shut")));

  /* one panel per tool, and pressing the key again puts it away — the same
     bargain the workbook's rail makes */
  const open = new Map();

  async function toggle(id) {
    const live = open.get(id);
    if (live) { live.close(); return; }
    // A tool that DOES something (drop a pin) rather than open a panel.
    if (ALL[id]?.act) { ALL[id].act(); return; }
    const spec = ALL[id];
    const key = el.querySelector(`[data-wbtool="${id}"]`);
    key.setAttribute("aria-pressed", "true");
    const panel = openPanel({
      title: spec.label,
      size: spec.size,
      onClose: () => {
        const was = open.get(id);
        open.delete(id);
        key.setAttribute("aria-pressed", "false");
        if (was && was.undo) was.undo();
      },
    });
    open.set(id, panel);
    /* the component is imported and mounted after the panel is up, so the
       panel is never a blank rectangle waiting on a network */
    panel.undo = await spec.open(panel.body);
  }

  el.addEventListener("click", (e) => {
    const k = e.target.closest("[data-wbtool]");
    if (k) toggle(k.dataset.wbtool);
  });

  return {
    el,
    open: toggle,
    slide,
    isOpen: (id) => open.has(id),
    destroy() {
      document.removeEventListener("fullscreenchange", follow);
      document.removeEventListener("webkitfullscreenchange", follow);
      [...open.values()].forEach((p) => p.close());
      el.remove();
    },
  };
}
