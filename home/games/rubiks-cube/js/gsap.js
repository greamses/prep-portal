/* =====================================================================
   GSAP, loaded lazily from the same CDN module the nav uses. Importers
   read `gsapRef.current`, which stays null until the module resolves (all
   callers already guard for a missing GSAP and fall back gracefully).
   ===================================================================== */
export const gsapRef = { current: null };

import("https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm")
  .then((m) => (gsapRef.current = m.gsap || m.default || null))
  .catch(() => {});
