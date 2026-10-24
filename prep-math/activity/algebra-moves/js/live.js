/* ═══════════════════════════════════════════════════════════════════════════
   A LIVE CLASSROOM

   The host presses Live, gets a link, and sends it. Everyone who opens it is
   on the same canvas: the same equations, worked a line at a time by whoever
   is allowed to — everyone, or the host alone while the class watches — and
   the host sees who has joined and who is working on which equation.

   It rides the site's one live layer (utils/live): presence says who is here
   and which card they have their hands on; STATE holds the board. The board is
   kept as one entry per thing on it — card_<uid>, note_<id> — so two people
   working on two different equations never write over each other, and an
   equation travels as the text the parser reads back, re-checked on arrival
   like any other line.

   Nothing is diffed by watching every move: once in a while (TICK) the board
   is read as data, and whatever differs from what this tab last saw or sent
   goes out. That catches every kind of change — a move, a drag, a renamed
   equation, a note — without each one having to remember to say so.
   ═══════════════════════════════════════════════════════════════════════════ */

const NS = "am";
const TICK = 700;
const HEARTBEAT = 30000;
const OPEN_FOR = 90000;   // a link stops working this long after the host goes

const newCode = () => Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/**
 * ctx — what the workspace lends:
 *   frame                 the element the panel goes in
 *   items()               { key: data } for everything on the board now
 *   apply(key, data)      put this item on the board (data null: take it off)
 *   activeUid()           the card this tab has its hands on, or null
 *   markWorkers(map)      { cardUid: "Ada, Tunde" } — who else is on each card
 *   setViewOnly(bool)     learners watching, not touching
 *   say(text, tone)
 */
export function createLive(ctx) {
  let room = null;
  let me = null;
  let role = null;          // "teacher" (host) | "student"
  let code = null;
  let control = "all";      // who may work on the board: "all" | "host"
  let people = [];
  const known = new Map();  // key → JSON as last seen or sent
  const inRoom = new Set(); // keys the room itself has confirmed holding
  let ticker = null, beat = null;
  let panel = null;

  const canWork = () => role === "teacher" || control === "all";

  async function signedIn() {
    const { currentUser } = await import("/utils/components/workbook/account.js");
    const user = await currentUser().catch(() => null);
    if (!user) throw new Error("Sign in first — a live classroom needs to know who you are.");
    return user;
  }

  async function join(asRole, roomCode) {
    const user = await signedIn();
    const { openRoom, idFor } = await import("/utils/live/index.js");
    role = asRole;
    code = roomCode;
    me = { id: idFor(user.uid), name: user.displayName || (asRole === "teacher" ? "The host" : "A learner") };
    room = await openRoom({ ns: NS, code, role, me });
    room.presence.set({ on: null });
    room.on("presence", (list) => { people = list; paintPanel(); markWorkers(); });
    room.on("state", (s) => receive(s || {}));
    ticker = setInterval(tick, TICK);
    window.addEventListener("pagehide", leave, { once: true });
  }

  /* ── the board, both ways ─────────────────────────────────────────────── */
  function receive(state) {
    if (state.control && state.control !== control) {
      control = state.control;
      ctx.setViewOnly(!canWork());
      paintPanel();
    }
    if (role === "student" && state.ended) {
      ctx.say("The host has ended the live lesson. Your canvas is your own again.", "ok");
      return stop();
    }
    const seen = new Set();
    for (const [key, data] of Object.entries(state)) {
      if (!key.startsWith("card_") && !key.startsWith("note_") && !key.startsWith("link_")) continue;
      seen.add(key);
      inRoom.add(key);
      const json = JSON.stringify(data);
      if (known.get(key) === json) continue;
      known.set(key, json);
      ctx.apply(key, data);
    }
    /* Taken off by someone else — but only what the room had confirmed
       holding: a card made here a moment ago may simply not have arrived yet,
       and must not be taken off for being late. */
    for (const key of [...inRoom]) {
      if (seen.has(key)) continue;
      inRoom.delete(key);
      known.delete(key);
      ctx.apply(key, null);
    }
  }

  function tick() {
    if (!room) return;
    room.presence.set({ on: ctx.activeUid() });
    if (!canWork()) return;
    const now = ctx.items();
    const patch = {};
    let any = false;
    for (const [key, data] of Object.entries(now)) {
      const json = JSON.stringify(data);
      if (known.get(key) === json) continue;
      known.set(key, json);
      patch[key] = data;
      any = true;
    }
    for (const key of [...known.keys()]) {
      if (!(key in now)) { known.delete(key); patch[key] = null; any = true; }
    }
    if (any) room.state.patch(patch);
  }

  /* ── who is where ─────────────────────────────────────────────────────── */
  function markWorkers() {
    const on = {};
    for (const p of people) {
      if (p.id === room?.id || !p.on) continue;
      (on[p.on] ||= []).push(p.name);
    }
    ctx.markWorkers(Object.fromEntries(Object.entries(on).map(([uid, names]) => [uid, names.join(", ")])));
  }

  function cardName(uid) {
    const it = uid && ctx.items()[`card_${uid}`];
    return it ? it.name : null;
  }

  /* ── the panel ────────────────────────────────────────────────────────── */
  function paintPanel() {
    if (!room) return;
    if (!panel) {
      panel = document.createElement("aside");
      panel.className = "am-live";
      panel.setAttribute("aria-label", "Live classroom");
      ctx.frame.appendChild(panel);
      panel.addEventListener("click", onPanelClick);
      panel.addEventListener("pointerdown", (e) => e.stopPropagation());
    }
    const link = `${location.origin}${location.pathname}?live=${code}`;
    const others = people.filter((p) => p.id !== room.id);
    const learners = others.filter((p) => p.role === "student");
    const row = (p) => {
      const where = cardName(p.on);
      return `<li><i class="am-live__dot" aria-hidden="true"></i><b>${esc(p.name)}</b>`
        + `<span>${where ? `working on ${esc(where.replace(/_(\d+)$/, "$1"))}` : role === "teacher" && p.role === "student" ? "watching" : p.role === "teacher" ? "host" : ""}</span></li>`;
    };
    panel.innerHTML = role === "teacher"
      ? `<header><span class="am-live__on">Live</span><code>${esc(code)}</code>
           <button type="button" data-live="copy" title="${esc(link)}">Copy link</button>
           <button type="button" data-live="end">End</button></header>
         <label class="am-live__ctl"><input type="checkbox" data-live="control" ${control === "all" ? "checked" : ""}>
           Learners can work on the board</label>
         <p class="am-live__count">${learners.length ? `${learners.length} joined` : "Nobody has joined yet — send them the link."}</p>
         <ul>${others.map(row).join("")}</ul>`
      : `<header><span class="am-live__on">Live</span><code>${esc(code)}</code>
           <button type="button" data-live="leave">Leave</button></header>
         <p class="am-live__count">${canWork() ? "You can work on the board." : "The host is working — you are watching."}</p>
         <ul>${others.map(row).join("")}</ul>`;
  }

  function onPanelClick(e) {
    const act = e.target.closest("[data-live]")?.dataset.live;
    if (act === "copy") copyLink(e.target);
    if (act === "end") end();
    if (act === "leave") { leave(); ctx.say("You have left the live lesson.", "ok"); }
    if (act === "control") {
      control = e.target.checked ? "all" : "host";
      room.state.patch({ control });
      paintPanel();
    }
  }

  function copyLink(btn) {
    const link = `${location.origin}${location.pathname}?live=${code}`;
    navigator.clipboard?.writeText(link).then(() => {
      if (btn) { btn.textContent = "Link copied"; setTimeout(() => paintPanel(), 1400); }
    }).catch(() => ctx.say(`The link is ${link}`, "ok"));
  }

  /* ── starting, stopping ───────────────────────────────────────────────── */
  function stop() {
    clearInterval(ticker);
    clearInterval(beat);
    ticker = beat = null;
    room?.leave().catch(() => {});
    room = null;
    panel?.remove();
    panel = null;
    known.clear();
    inRoom.clear();
    ctx.setViewOnly(false);
    ctx.markWorkers({});
  }
  function leave() { stop(); }

  function end() {
    room?.state.patch({ ended: true, openUntil: 0 });
    room?.state.flush();
    setTimeout(stop, 300);
    ctx.say("The live lesson has ended. The board stays here as it was.", "ok");
  }

  return {
    get live() { return !!room; },

    /** Host: open a room, publish the board, copy the link. */
    async host() {
      if (room) return paintPanel();
      try {
        await join("teacher", newCode());
      } catch (e) {
        return ctx.say(e.message || "The live lesson could not start.", "no");
      }
      room.state.patch({ control, ended: false, host: me.name, openUntil: Date.now() + OPEN_FOR });
      beat = setInterval(() => room?.state.patch({ openUntil: Date.now() + OPEN_FOR }), HEARTBEAT);
      paintPanel();
      copyLink();
      ctx.say("You are live. The link to join is copied — send it to your class.", "ok");
    },

    /** Learner: join the room the link names. */
    async joinAs(roomCode) {
      try {
        await join("student", roomCode);
      } catch (e) {
        return ctx.say(e.message || "Could not join the live lesson.", "no");
      }
      paintPanel();
      ctx.say("You have joined the live lesson.", "ok");
    },
  };
}
