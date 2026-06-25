/* ============================================================================
   Cartesian Art — tiny drag helper
   ----------------------------------------------------------------------------
   Make an element draggable within the studio by a handle. Position is clamped
   to stay on-screen and (optionally) persisted to localStorage so the rail /
   steering pad stay where the user parked them across reloads + fullscreen flips.
   ========================================================================== */

export function makeDraggable(elm, handle, key = null) {
  const studio = document.querySelector("#ca-studio");
  if (!elm || !handle || !studio) return;

  const place = (x, y) => {
    const sr = studio.getBoundingClientRect();
    const nx = Math.max(0, Math.min(sr.width - elm.offsetWidth, x));
    const ny = Math.max(0, Math.min(sr.height - elm.offsetHeight, y));
    elm.style.left = nx + "px";
    elm.style.top = ny + "px";
    elm.style.right = "auto";
    elm.style.bottom = "auto";
    elm.style.transform = "none"; // drop any centring transform once moved
  };

  // restore a saved position
  if (key) {
    try {
      const s = JSON.parse(localStorage.getItem(key) || "null");
      if (s && s.left != null) place(s.left, s.top);
    } catch {}
  }

  let dragging = false, ox = 0, oy = 0;
  handle.style.touchAction = "none";

  handle.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button, input, textarea, select, a")) return;
    dragging = true;
    elm.classList.add("is-dragging");
    const r = elm.getBoundingClientRect();
    ox = e.clientX - r.left;
    oy = e.clientY - r.top;
    handle.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  });
  handle.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const sr = studio.getBoundingClientRect();
    place(e.clientX - sr.left - ox, e.clientY - sr.top - oy);
  });
  const end = () => {
    if (!dragging) return;
    dragging = false;
    elm.classList.remove("is-dragging");
    if (key) {
      try {
        localStorage.setItem(key, JSON.stringify({
          left: parseFloat(elm.style.left) || 0,
          top: parseFloat(elm.style.top) || 0,
        }));
      } catch {}
    }
  };
  handle.addEventListener("pointerup", end);
  handle.addEventListener("pointercancel", end);
  handle.addEventListener("lostpointercapture", end);

  // keep it on-screen after a resize / fullscreen flip
  window.addEventListener("resize", () => {
    if (!elm.style.left) return;
    place(parseFloat(elm.style.left), parseFloat(elm.style.top));
  });
}
