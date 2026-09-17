/* ============================================================================
   GEOMETRY PAGE TABS  —  utils/components/geometry-tabs.js
   ----------------------------------------------------------------------------
   The four prep-math geometry studios used to be four separate nav entries.
   They are one link now, and this is the row of sticky-note tabs that moves
   between them — the same cross-page pattern the exam-archive games use, so
   the markup is a bare placeholder and the list lives in exactly one place:

       <div class="builder-tabs" data-tabs="geometry"></div>

   Add `builder-tabs--compact` for the pages with a fixed-height app shell, or
   `builder-tabs--float` to lay it over a full-bleed canvas. Styling comes from
   utils/components/game-tabs.css, which the page must link (after
   components.css, for .pp-pill).
   ========================================================================== */

export const GEOMETRY_TABS = [
  { text: "Polygon Angles", href: "/prep-math/activity/polygon-angles/index.html" },
  { text: "Transversals",   href: "/prep-math/activity/transversals/index.html" },
  { text: "Pythagoras",     href: "/prep-math/activity/pythagoras/index.html" },
  { text: "Surface Area",   href: "/prep-math/activity/surface-area/index.html" },
];

/* A tab is current when the page sits in its folder, so /pythagoras/ and
   /pythagoras/index.html both light the same note up. */
function isCurrent(href) {
  const dir = href.replace(/index\.html$/, "");
  const here = location.pathname.replace(/index\.html$/, "");
  return here === dir;
}

/* ── FULLSCREEN ────────────────────────────────────────────────────────────
   A studio wants the whole screen, and it should stay that way as you move
   between tabs. A browser drops out of fullscreen on navigation and will only
   let a page back in off a user gesture, so the preference is remembered and
   the page opens in the fullscreen LAYOUT straight away (`html.pp-geo-fs`:
   no site nav, tabs at the top). Real fullscreen is then re-entered on the
   first gesture of the new page, which in practice is the tab click that
   brought you there. */
const FS_KEY = "pp-geo-fullscreen";

const nativeFsElement = () => document.fullscreenElement || document.webkitFullscreenElement;
const wantsFs = () => {
  try { return localStorage.getItem(FS_KEY) === "1"; } catch { return false; }
};
const rememberFs = (on) => {
  try { on ? localStorage.setItem(FS_KEY, "1") : localStorage.removeItem(FS_KEY); } catch { /* private mode */ }
};

const SVG_EXPAND =
  '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M3 9.4V4.6A1.6 1.6 0 0 1 4.6 3h4.8v2.8H5.8v3.6zM21 9.4V4.6A1.6 1.6 0 0 0 19.4 3h-4.8v2.8h3.6v3.6zM3 14.6v4.8A1.6 1.6 0 0 0 4.6 21h4.8v-2.8H5.8v-3.6zM21 14.6v4.8a1.6 1.6 0 0 1-1.6 1.6h-4.8v-2.8h3.6v-3.6z" fill="var(--accent-secondary)"/></svg>';
const SVG_COMPRESS =
  '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9.4 3v4.8A1.6 1.6 0 0 1 7.8 9.4H3V6.6h3.6V3zM14.6 3v4.8a1.6 1.6 0 0 0 1.6 1.6H21V6.6h-3.6V3zM9.4 21v-4.8a1.6 1.6 0 0 0-1.6-1.6H3v2.8h3.6V21zM14.6 21v-4.8a1.6 1.6 0 0 1 1.6-1.6H21v2.8h-3.6V21z" fill="var(--accent-danger)"/></svg>';

/* The layout half — safe to apply without a gesture, and what actually gives
   the studio the screen. Anything measuring the viewport needs telling. */
function setFsLayout(on) {
  document.documentElement.classList.toggle("pp-geo-fs", on);
  document.querySelectorAll(".gt-fs-btn").forEach((b) => {
    b.setAttribute("aria-pressed", String(on));
    b.title = on ? "Leave fullscreen" : "Fullscreen";
    b.innerHTML = on ? SVG_COMPRESS : SVG_EXPAND;
  });
  window.dispatchEvent(new Event("resize"));
}

async function requestNativeFs() {
  const el = document.documentElement;
  const fn = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!fn) return false;
  try { await fn.call(el); return true; } catch { return false; }
}

function exitNativeFs() {
  const fn = document.exitFullscreen || document.webkitExitFullscreen;
  if (nativeFsElement() && fn) fn.call(document).catch(() => {});
}

async function toggleFullscreen() {
  const on = !document.documentElement.classList.contains("pp-geo-fs");
  rememberFs(on);
  setFsLayout(on);
  if (on) await requestNativeFs();
  else exitNativeFs();
}

/* Leaving fullscreen with Escape has to put the nav back — but a browser also
   drops fullscreen when the page is navigated away from, and that fires the
   very same event. Reading THAT as "the reader wants the nav back" would clear
   the preference on the way out of every tab, which is exactly when it needs
   to survive. So once the page is going, stop listening. */
let leavingPage = false;
addEventListener("pagehide", () => { leavingPage = true; });
addEventListener("beforeunload", () => { leavingPage = true; });

for (const ev of ["fullscreenchange", "webkitfullscreenchange"]) {
  document.addEventListener(ev, () => {
    if (leavingPage) return;
    if (!nativeFsElement() && document.documentElement.classList.contains("pp-geo-fs")) {
      rememberFs(false);
      setFsLayout(false);
    }
  });
}

function fsButton() {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "gt-fs-btn";
  b.title = "Fullscreen";
  b.setAttribute("aria-label", "Toggle fullscreen");
  b.setAttribute("aria-pressed", "false");
  b.innerHTML = SVG_EXPAND;
  b.addEventListener("click", toggleFullscreen);
  return b;
}

export function mountGeometryTabs(root = document) {
  root.querySelectorAll('[data-tabs="geometry"]').forEach((host) => {
    host.setAttribute("role", "tablist");
    host.replaceChildren(
      ...GEOMETRY_TABS.map(({ text, href }) => {
        const a = document.createElement("a");
        a.className = "pp-pill builder-tab";
        a.href = href;
        a.textContent = text;
        a.setAttribute("role", "tab");
        if (isCurrent(href)) {
          a.classList.add("is-active");
          a.setAttribute("aria-current", "page");
        }
        return a;
      }),
      /* Not a .builder-tab, so it stays out of the notes' colour rotation. */
      fsButton(),
    );
  });
}

function start() {
  mountGeometryTabs();
  if (!wantsFs()) return;
  setFsLayout(true);
  /* Re-arm real fullscreen at the first chance the browser will give us. */
  const arm = async () => {
    if (nativeFsElement()) return;
    if (await requestNativeFs()) document.removeEventListener("pointerdown", arm, true);
  };
  document.addEventListener("pointerdown", arm, true);
  arm();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
