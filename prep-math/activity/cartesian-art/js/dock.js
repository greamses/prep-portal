/* ============================================================================
   Cartesian Art — floating docks
   ----------------------------------------------------------------------------
   The graph is the canvas; the control clusters float over it as draggable,
   collapsible widgets. Drag by the header, collapse with the chevron. Positions
   and collapsed state persist in localStorage and are re-clamped on resize so a
   dock never ends up stranded off-screen (e.g. after toggling fullscreen).
   ========================================================================== */

const KEY = "ca-dock-state-v1";

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
function save(o) {
  try { localStorage.setItem(KEY, JSON.stringify(o)); } catch {}
}

export function initDocks(scope = document) {
  const studio = scope.querySelector("#ca-studio");
  if (!studio) return;
  const docks = [...scope.querySelectorAll(".ca-dock")];
  const saved = load();

  const persist = () => {
    const o = {};
    for (const d of docks) {
      o[d.dataset.dock] = {
        left: d.style.left ? parseFloat(d.style.left) : null,
        top: d.style.top ? parseFloat(d.style.top) : null,
        collapsed: d.classList.contains("is-collapsed"),
      };
    }
    save(o);
  };

  const place = (d, x, y) => {
    const sr = studio.getBoundingClientRect();
    const nx = Math.max(0, Math.min(sr.width - d.offsetWidth, x));
    const ny = Math.max(0, Math.min(sr.height - d.offsetHeight, y));
    d.style.left = nx + "px";
    d.style.top = ny + "px";
    d.style.right = "auto";
    d.style.bottom = "auto";
  };

  for (const dock of docks) {
    const st = saved[dock.dataset.dock];
    if (st) {
      if (st.collapsed) dock.classList.add("is-collapsed");
      if (st.left != null) {
        dock.style.left = st.left + "px";
        dock.style.top = st.top + "px";
        dock.style.right = "auto";
        dock.style.bottom = "auto";
      }
    }

    dock.querySelector(".ca-dock-toggle")?.addEventListener("click", (e) => {
      e.stopPropagation();
      dock.classList.toggle("is-collapsed");
      persist();
    });

    const head = dock.querySelector(".ca-dock-head");
    let dragging = false, ox = 0, oy = 0;

    head?.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".ca-dock-toggle")) return;
      dragging = true;
      dock.classList.add("is-dragging");
      const r = dock.getBoundingClientRect();
      ox = e.clientX - r.left;
      oy = e.clientY - r.top;
      head.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    });
    head?.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const sr = studio.getBoundingClientRect();
      place(dock, e.clientX - sr.left - ox, e.clientY - sr.top - oy);
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      dock.classList.remove("is-dragging");
      persist();
    };
    head?.addEventListener("pointerup", end);
    head?.addEventListener("pointercancel", end);
    head?.addEventListener("lostpointercapture", end);
  }

  // keep manually-placed docks inside the studio after a resize / fullscreen flip
  window.addEventListener("resize", () => {
    for (const d of docks) {
      if (!d.style.left) continue;
      place(d, parseFloat(d.style.left), parseFloat(d.style.top));
    }
  });
}
