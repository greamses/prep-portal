/* ============================================================================
   THE BELL
   ----------------------------------------------------------------------------
   A bell in the nav for everyone who is signed in: a student sees the tasks
   their teacher set them and the results that went in; a teacher sees the
   scores their class sent back. The server keeps them (/api/classes/bell).

   It reads on load and again when the tab comes back to the front (at most once
   a minute), never on a timer: a notice is not worth a standing read.
   Opening the bell marks what is in it as read; what was new stays marked until
   it is closed.
   ========================================================================== */

const BASE = location.port === "5500" ? "http://127.0.0.1:5000" : "";
const TTL = 60 * 1000;

const ICON = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`
  + `<path d="M12 2.8a6.2 6.2 0 0 0-6.2 6.2v3.4c0 .9-.4 1.8-1 2.5l-.9 1a1.2 1.2 0 0 0 .9 2h14.4a1.2 1.2 0 0 0 .9-2l-.9-1a3.8 3.8 0 0 1-1-2.5V9A6.2 6.2 0 0 0 12 2.8z" fill="#f4c95d"/>`
  + `<path d="M9.4 19.6a2.6 2.6 0 0 0 5.2 0z" fill="#2a2723"/></svg>`;

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function ago(at) {
  if (!at) return "";
  const s = Math.max(0, Math.round((Date.now() - at) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} d ago`;
  return new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function needCss() {
  if (document.querySelector('link[href*="bell.css"]')) return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = "/utils/components/bell.css";
  document.head.appendChild(l);
}

export function mountBell(host, auth) {
  needCss();
  let items = [];
  let unread = 0;
  let loadedAt = 0;
  let loading = null;
  let open = false;
  let fresh = new Set();

  host.className = "nav-bell";
  host.hidden = true;
  host.innerHTML = `<button type="button" class="nav-theme-toggle nav-bell__btn" aria-label="Notices" aria-haspopup="true" aria-expanded="false">${ICON}<b class="nav-bell__n" hidden></b></button>`
    + `<div class="pp-receipt nav-bell__panel" hidden><div class="pp-receipt__paper nav-bell__paper"></div></div>`;
  const btn = host.querySelector(".nav-bell__btn");
  const badge = host.querySelector(".nav-bell__n");
  const panel = host.querySelector(".nav-bell__panel");
  const paper = host.querySelector(".nav-bell__paper");

  const token = async () => { const u = auth.currentUser; return u ? u.getIdToken() : null; };
  async function call(path, method = "GET") {
    const t = await token();
    if (!t) throw new Error("signed out");
    const r = await fetch(`${BASE}${path}`, { method, headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }, body: method === "GET" ? undefined : "{}" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }

  function paintBadge() {
    badge.hidden = !unread;
    badge.textContent = unread > 9 ? "9+" : String(unread);
    btn.setAttribute("aria-label", unread ? `Notices, ${unread} new` : "Notices");
  }

  function paintPanel() {
    const head = `<div class="nav-bell__head"><b>Notices</b></div>`;
    const list = items.length
      ? items.map((n) => `<a class="nav-bell__item${fresh.has(n.id) ? " is-new" : ""}" href="${esc(n.url || "/dashboard.html")}">`
        + `<span class="nav-bell__kind nav-bell__kind--${esc(n.kind)}">${n.kind === "result" ? "Result" : "Task"}</span>`
        + `<span class="nav-bell__title">${esc(n.title)}</span>`
        + (n.text ? `<span class="nav-bell__text">${esc(n.text)}</span>` : "")
        + `<time class="nav-bell__when">${esc(ago(n.at))}</time></a>`).join("")
      : `<p class="nav-bell__none">Nothing new. A task from your teacher, or a result going in, will show up here.</p>`;
    paper.innerHTML = head + `<div class="nav-bell__list">${list}</div>`;
  }

  async function refresh(force = false) {
    if (!force && Date.now() - loadedAt < TTL) return;
    if (loading) return loading;
    loading = (async () => {
      try {
        const d = await call("/api/classes/bell");
        items = d.items || [];
        unread = d.unread || 0;
        loadedAt = Date.now();
        paintBadge();
        if (open) paintPanel();
      } catch { /* the bell is a convenience: no notices is a fine answer to any failure */ }
      loading = null;
    })();
    return loading;
  }

  function shut() {
    open = false;
    panel.hidden = true;
    btn.setAttribute("aria-expanded", "false");
    fresh = new Set();
  }

  btn.addEventListener("click", async (e) => {
    e.stopPropagation();
    if (open) { shut(); return; }
    await refresh(true);
    fresh = new Set(items.filter((n) => !n.seen).map((n) => n.id));
    open = true;
    paintPanel();
    panel.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    if (unread) {
      unread = 0; paintBadge();
      call("/api/classes/bell/seen", "POST").catch(() => {});
    }
  });
  document.addEventListener("click", (e) => { if (open && !host.contains(e.target)) shut(); });
  document.addEventListener("keydown", (e) => { if (open && e.key === "Escape") shut(); });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && !host.hidden) refresh(false); });

  auth.onAuthStateChanged((user) => {
    host.hidden = !user;
    if (user) refresh(true); else { items = []; unread = 0; paintBadge(); shut(); }
  });
}
