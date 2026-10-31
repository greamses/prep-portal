/* ============================================================================
   Geometry studios that remember
   ----------------------------------------------------------------------------
   A studio (Polygon Angles, Transversals, Pythagoras, Surface Area) keeps what was done in it, on this machine, so that a
   reload, or closing and opening its panel, finds it as it was left: every slider, choice and tick box, and whatever the
   studio itself says it has beyond those (a dragged corner, where the view was moved to).

       geoMemory("transversals", { get: () => ({ ... }), set: (saved) => { ... } })

   `get` returns the studio's own extra state as plain data; `set` puts it back. Controls are found by their id and put back the way
   a person would, by setting the value and sending the same "input" and "change" the control sends, so the studio's own handlers run.
   A classic script, so a studio can use it with one tag.
   ========================================================================== */
(function () {
  window.geoMemory = function geoMemory(name, hooks) {
    const KEY = "geo-mem:" + name;
    const isBox = (el) => el.type === "checkbox" || el.type === "radio";
    const controls = () => [...document.querySelectorAll("input[id], select[id], textarea[id]")]
      .filter((el) => !["file", "button", "submit", "reset"].includes(el.type));
    const read = (el) => (isBox(el) ? !!el.checked : el.value);
    let ready = false;                 // nothing is saved until what was saved has been put back

    function save() {
      if (!ready) return;
      try {
        const o = { c: {} };
        controls().forEach((el) => { o.c[el.id] = read(el); });
        if (hooks && hooks.get) o.x = hooks.get();
        const s = JSON.stringify(o);
        if (s.length < 200000) localStorage.setItem(KEY, s);
      } catch (e) { /* not kept */ }
    }
    let t = 0;
    const later = () => { clearTimeout(t); t = setTimeout(save, 350); };
    ["input", "change", "pointerup", "keyup", "click", "wheel"].forEach((ev) => document.addEventListener(ev, later, { capture: true, passive: true }));

    function restore() {
      try {
        const o = JSON.parse(localStorage.getItem(KEY) || "null");
        if (o && o.c) {
          Object.keys(o.c).forEach((id) => {
            const el = document.getElementById(id);
            if (!el || read(el) === o.c[id]) return;
            if (isBox(el)) el.checked = !!o.c[id]; else el.value = o.c[id];
            el.dispatchEvent(new Event("input", { bubbles: true }));
            el.dispatchEvent(new Event("change", { bubbles: true }));
          });
          if (hooks && hooks.set && o.x) hooks.set(o.x);
        }
      } catch (e) { /* the studio as it opens */ }
      ready = true;
    }
    const go = () => requestAnimationFrame(() => requestAnimationFrame(restore));
    if (document.readyState === "complete") go(); else addEventListener("load", go);
  };
})();
