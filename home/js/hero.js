/* =========================================================================
   HERO — paint background
   -------------------------------------------------------------------------
   Injects the multicolour "paint" splash (organic amoeba blobs from the
   shared icon module) behind the centred hero copy. Pure decoration; opacity
   + sizing live in main.css (.hero-paint).
========================================================================= */
import { heroPaint } from "/utils/components/nav-icons.js";

const host = document.querySelector(".hero-paint");
if (host) host.innerHTML = heroPaint();

/* =========================================================================
   Typewriter — cycle tutor synonyms in the highlighted headline word.
========================================================================= */
const typeEl = document.querySelector(".hero-type");
if (typeEl) {
  const words = ["Tutors", "Mentors", "Coaches", "Guides"];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduce) {
    typeEl.textContent = words[0];
    document.querySelector(".hero-caret")?.remove();
  } else {
    let wi = 0;
    let ci = words[0].length; // first word is already in the markup
    let deleting = false;

    const tick = () => {
      const word = words[wi];
      if (deleting) {
        ci -= 1;
        typeEl.textContent = word.slice(0, ci);
        if (ci === 0) {
          deleting = false;
          wi = (wi + 1) % words.length;
          setTimeout(tick, 320);
          return;
        }
        setTimeout(tick, 45);
      } else {
        ci += 1;
        typeEl.textContent = word.slice(0, ci);
        if (ci === word.length) {
          deleting = true;
          setTimeout(tick, 1500); // hold the full word
          return;
        }
        setTimeout(tick, 95);
      }
    };

    // Show the first word briefly, then start cycling.
    setTimeout(() => {
      deleting = true;
      tick();
    }, 1500);
  }
}
