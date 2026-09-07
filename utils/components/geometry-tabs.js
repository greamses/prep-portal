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
    );
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => mountGeometryTabs());
} else {
  mountGeometryTabs();
}
