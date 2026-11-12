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

import { openPanel, needCss, savedPanels } from "./panels.js";
import { TOOL_ICONS } from "./instruments.js";
import { mountTooltips } from "../tooltip.js";
import { dropPin, restorePins } from "./pins.js";
import { boardTool, boardAllowed } from "/prepbot-board/js/rail-tool.js";
import { toolAccess, adminChooser, dressAccess, studentSees } from "./tool-access.js";

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
  /* THE PREPBOT BOARD: the live whiteboard tutor, in a panel (its own page, in a frame).
     The key is only left on the rail for a learner the board is open to. */
  board: boardTool,
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
  /* ALGEBRA MOVES, from any page that hangs the rail: the real workspace, mounted here
     rather than copied — one canvas, one set of moves, one verifier (as the workbook does). */
  gm: {
    label: "Algebra Moves",
    size: { w: 880, h: 620 },
    async open(body) {
      needCss("/prep-math/activity/algebra-moves/style.css");
      body.classList.add("wb-panel__body--bare");
      const frame = document.createElement("div");
      frame.className = "am-frame am-frame--in";
      body.appendChild(frame);
      const { mountAlgebraMoves } = await import("/prep-math/activity/algebra-moves/js/workspace.js");
      await mountAlgebraMoves(frame, { drawer: false });
    },
  },
  /* THE FORMULA BOOK for Algebra Moves, on the rail beneath it: formulas to fill in and the rule book. It puts
     its formulas on Algebra Moves' own canvas, so it makes sure that panel is open first. */
  formulas: {
    label: "Formula book",
    size: { w: 470, h: 600 },
    async open(body) {
      needCss("/prep-math/activity/algebra-moves/style.css");
      const ensure = new CustomEvent("wb-ensure-tool", { detail: { id: "gm", done: null } });
      document.dispatchEvent(ensure);
      await ensure.detail.done;
      const { mountFormulaBook, algebraMovesReady } = await import("/prep-math/activity/algebra-moves/js/workspace.js");
      for (let i = 0; i < 50 && !algebraMovesReady(); i++) await new Promise((r) => setTimeout(r, 100));
      body.classList.add("am-book");
      mountFormulaBook(body);
    },
  },
  /* GRAPH, from any page that hangs the rail: type equations and see them drawn. It is
     Cartesian Art's own grapher, opened bare in a frame (?embed=graph: no nav, no intro,
     the Graph panel already open), so it brings its own sign-in like the Chemistry Bench. */
  graph: {
    label: "Graph",
    size: { w: 980, h: 640 },
    async open(body) {
      body.classList.add("wb-panel__body--bare");
      const f = document.createElement("iframe");
      f.src = "/prep-math/activity/cartesian-art/?embed=graph";
      f.title = "Graph";
      f.style.cssText = "display:block;width:100%;height:100%;min-height:420px;border:0;background:#fffdf8";
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
    label: ({ burger: "Paragraph burger", mountain: "Story mountain", venn: "Venn diagram organiser", roundabout: "Story merry-go-round",
      oreo: "OREO", tchart: "T-chart", causes: "Cause and effect", sequence: "Sequence chain", senses: "Five senses",
      fishbone: "Fishbone", flow: "Flow chart", table: "Table" })[kind] || kind,
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

/* Families that fold behind one key when two or more of them are on a rail */
const ORGANISER_ICON = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><rect x="2.5" y="3" width="8.5" height="7.5" fill="#6fb7e8"/><rect x="13" y="3" width="8.5" height="7.5" fill="#f4c95d"/><rect x="2.5" y="13.5" width="8.5" height="7.5" fill="#f08a8a"/><rect x="13" y="13.5" width="8.5" height="7.5" fill="#8fd07a"/></svg>`;
const GROUPS = {
  /* the written methods: one sum, worked on the paper that suits it */
  sums: { label: "Written sums", icon: TOOL_ICONS.column || ORGANISER_ICON, members: ["column", "times", "criss", "shortdiv", "longdiv"] },
  /* drawing the problem before any arithmetic */
  models: { label: "Models", icon: TOOL_ICONS.barmodel || ORGANISER_ICON, members: ["barmodel", "linemodel", "vennmodel", "nodesmodel", "flowmodel"] },
  plan: { label: "Organisers", icon: ORGANISER_ICON, members: ["burger", "mountain", "venn", "roundabout", "oreo", "tchart", "causes", "sequence", "senses", "fishbone", "flow", "table"] },
};

/**
 * Hang the rail on `host` (the body, normally).
 *
 *   tools   which ones, in order
 *   at      "left" or "right" — which side of the window it sits against
 * → { el, open(id), destroy() }
 */
export function mountTools(host = document.body, { tools = ["board", "calculator", "graph", "gm", "column", "times", "shortdiv", "pin", "note"], at = "left", extra = {} } = {}) {
  /* the rail fetches its own dress, so a page that wants tools needs one line
     and no stylesheet link of its own */
  needCss("/utils/components/workbook.css");
  /* A page can bring tools of its own (Algebra Moves' formula book): the same
     { label, size, open(body) } a built-in tool is, joining the same rail. */
  const ALL = { ...TOOLS, ...extra };
  /* EVERY RAIL CARRIES EVERY TOOL (the admin decides what students see,
     tool-access.js). The page's own list is only what students see there until
     the admin has chosen for the page. */
  const pageDefault = tools.filter((id) => ALL[id]);
  if (pageDefault.includes("gm") && !pageDefault.includes("formulas") && ALL.formulas) pageDefault.push("formulas");
  const ids = [...new Set([...TOOL_IDS, ...pageDefault])].filter((id) => ALL[id])
    .filter((id) => !(id === "board" && location.pathname.startsWith("/prepbot-board"))); // not PrepBoard inside PrepBoard
  // Algebra Moves on the rail brings its formula book: the icon sits just beneath it
  if (ids.includes("gm") && !ids.includes("formulas") && ALL.formulas) ids.splice(ids.indexOf("gm") + 1, 0, "formulas");
  if (ids.includes("pin") && ALL.pin === TOOLS.pin) restorePins();

  const el = document.createElement("aside");
  el.className = `wb-tools wb-tools--${at}`;
  el.setAttribute("aria-label", "Tools");
  const tipSide = at === "left" ? "right" : "left";
  const keyHtml = (id) => `<button type="button" class="wb-tools__btn" data-wbtool="${id}"`
    + ` aria-pressed="false" aria-label="${ALL[id].label}"`
    + ` data-tip="${ALL[id].label}" data-tip-side="${tipSide}">`
    + `${ALL[id].icon || TOOL_ICONS[id] || TOOL_ICONS.note}</button>`;
  /* A FAMILY UNDER ONE KEY: twelve organisers down the rail were a list, not a
     rail. Two or more of a group on this rail fold behind one key, which opens
     them in a little receipt beside it (on the body: the rail scrolls, and a
     scroller would clip it). */
  const groups = Object.entries(GROUPS)
    .map(([gid, g]) => ({ gid, ...g, members: ids.filter((id) => g.members.includes(id)) }))
    .filter((g) => g.members.length >= 2);
  const inGroup = new Map(groups.flatMap((g) => g.members.map((id) => [id, g])));
  const railHtml = ids.map((id) => {
    const g = inGroup.get(id);
    if (!g) return keyHtml(id);
    if (g.members[0] !== id) return ""; // the group's key stands where its first member would
    return `<button type="button" class="wb-tools__btn wb-tools__group" data-wbgroup="${g.gid}" aria-expanded="false"`
      + ` aria-label="${g.label}" data-tip="${g.label}" data-tip-side="${tipSide}">${g.icon}`
      + `<svg class="wb-tools__corner" viewBox="0 0 8 8" width="7" height="7" aria-hidden="true"><path d="M8 8H2.6L8 2.6Z" fill="currentColor"/></svg></button>`;
  }).join("");
  el.innerHTML = `<div class="wb-tools__paper pp-receipt__paper">`
    + railHtml
    + `</div>`
    /* the tab on the rail's inner edge: slides the whole rail away, and back (like the
       chemistry bench's drawer). Whether it is away is remembered on this machine. */
    + `<button type="button" class="wb-tools__tab" aria-label="Put the tools away" aria-expanded="true" data-tip="Slide the tools away" data-tip-side="${at === "left" ? "right" : "left"}">`
    + `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="${at === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
  /* kept out of sight until it is known which tools this student sees (no flash of all of them) */
  el.style.visibility = "hidden";
  host.appendChild(el);
  /* each group's receipt of keys */
  const flies = new Map(groups.map((g) => {
    const fly = document.createElement("div");
    fly.className = `wb-tools__fly wb-tools__fly--${at} pp-receipt`;
    fly.dataset.wbgroup = g.gid;
    fly.hidden = true;
    fly.setAttribute("role", "group");
    fly.setAttribute("aria-label", g.label);
    fly.innerHTML = `<div class="wb-tools__flypaper pp-receipt__paper"><p class="wb-tools__flyname">${g.label}</p><div class="wb-tools__flykeys">${g.members.map(keyHtml).join("")}</div></div>`;
    document.body.appendChild(fly);
    return [g.gid, fly];
  }));
  const shutFlies = () => {
    flies.forEach((f) => { f.hidden = true; });
    el.querySelectorAll(".wb-tools__group").forEach((k) => k.setAttribute("aria-expanded", "false"));
  };
  const keyFor = (id) => el.querySelector(`[data-wbtool="${id}"]`) || [...flies.values()].map((f) => f.querySelector(`[data-wbtool="${id}"]`)).find(Boolean) || null;
  /* a group's key wears the tick while any tool behind it is open */
  const syncGroups = () => groups.forEach((g) => {
    const k = el.querySelector(`[data-wbgroup="${g.gid}"]`);
    if (k) k.setAttribute("aria-pressed", String(g.members.some((id) => open.has(id))));
  });
  el.addEventListener("click", (e) => {
    const gk = e.target.closest("[data-wbgroup]");
    if (!gk) return;
    const fly = flies.get(gk.dataset.wbgroup);
    const was = !fly.hidden;
    shutFlies();
    if (was) return;
    fly.hidden = false;
    gk.setAttribute("aria-expanded", "true");
    const r = gk.getBoundingClientRect();
    fly.style.top = `${Math.max(8, Math.min(window.innerHeight - fly.offsetHeight - 8, r.top - 12))}px`;
    if (at === "left") fly.style.left = `${r.right + 10}px`; else fly.style.right = `${window.innerWidth - r.left + 10}px`;
  });
  flies.forEach((fly) => fly.addEventListener("click", (e) => {
    const k = e.target.closest("[data-wbtool]");
    if (!k) return;
    shutFlies();
    toggle(k.dataset.wbtool);
  }));
  document.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".wb-tools__fly, .wb-tools__group")) return;
    shutFlies();
  });
  mountTooltips();
  /* WHICH TOOLS STUDENTS SEE (the admin's list, config/tools): a hidden tool's key
     is taken off the rail for a student; the admin keeps it, marked, and gets a
     key of their own to change the list */
  const reveal = () => { el.style.visibility = ""; };
  const fallback = setTimeout(() => {
    /* the list could not be read in time: the page's own tools only */
    [el, ...flies.values()].forEach((root) => root.querySelectorAll("[data-wbtool]").forEach((k) => { if (!pageDefault.includes(k.dataset.wbtool)) k.remove(); }));
    reveal();
  }, 5000);
  toolAccess().then(({ cfg, admin }) => {
    clearTimeout(fallback);
    const mark = () => {
      [el, ...flies.values()].forEach((root) => root.querySelectorAll("[data-wbtool]").forEach((k) => {
        const off = !studentSees(cfg, k.dataset.wbtool, { pageDefault });
        if (admin) k.classList.toggle("is-off-for-students", off);
        else if (off) { open.get(k.dataset.wbtool)?.close(); k.remove(); }
      }));
      if (!admin) flies.forEach((fly, gid) => {
        if (fly.querySelector("[data-wbtool]")) return;
        fly.remove(); flies.delete(gid);
        el.querySelector(`[data-wbgroup="${gid}"]`)?.remove();
      });
    };
    mark();
    reveal();
    if (admin) {
      dressAccess();
      adminChooser(el.querySelector(".wb-tools__paper"), {
        keys: () => [el, ...flies.values()].flatMap((root) => [...root.querySelectorAll("[data-wbtool]")]),
        idOf: (k) => k.dataset.wbtool || null,
        cfg, pageDefault, onChange: mark, side: at === "left" ? "right" : "left",
      });
    }
  });
  /* the board's key stays only for a learner the board is open to */
  if (ids.includes("board")) { // a page's own board key (with "Load question") is PrepBoard too
    boardAllowed().then((ok) => { if (!ok) el.querySelector('[data-wbtool="board"]')?.remove(); });
  }

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

  /* a tool that needs another one open (the formula book needs Algebra Moves) asks for it here */
  document.addEventListener("wb-ensure-tool", (e) => {
    const id = e.detail?.id;
    if (!id || !ids.includes(id) || e.detail.done) return;
    e.detail.done = (async () => { if (!open.has(id)) await toggle(id); })();
  });

  async function toggle(id) {
    const live = open.get(id);
    if (live) { live.close(); return; }
    // A tool that DOES something (drop a pin) rather than open a panel.
    if (ALL[id]?.act) { ALL[id].act(); return; }
    const spec = ALL[id];
    const key = keyFor(id);
    if (!key) return; // not on this rail (or hidden from students)
    key.setAttribute("aria-pressed", "true");
    const panel = openPanel({
      title: spec.label,
      size: spec.size,
      icon: key.querySelector("svg")?.outerHTML || null,
      key: id,
      onClose: () => {
        const was = open.get(id);
        open.delete(id);
        key.setAttribute("aria-pressed", "false");
        syncGroups();
        if (was && was.undo) was.undo();
      },
    });
    open.set(id, panel);
    syncGroups();
    /* the component is imported and mounted after the panel is up, so the
       panel is never a blank rectangle waiting on a network */
    panel.undo = await spec.open(panel.body);
    panel.restoreContents();
  }

  el.addEventListener("click", (e) => {
    const k = e.target.closest("[data-wbtool]");
    if (k) toggle(k.dataset.wbtool);
  });

  /* sheets left open (or folded into tabs) come back after a reload */
  for (const id of savedPanels()) if (ALL[id] && !ALL[id].act) toggle(id);

  return {
    el,
    open: toggle,
    slide,
    isOpen: (id) => open.has(id),
    destroy() {
      document.removeEventListener("fullscreenchange", follow);
      document.removeEventListener("webkitfullscreenchange", follow);
      [...open.values()].forEach((p) => p.close({ keep: true }));
      flies.forEach((f) => f.remove());
      el.remove();
    },
  };
}
