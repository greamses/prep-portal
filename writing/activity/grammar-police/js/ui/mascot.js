// ════════════════════════════════════════════════════════════════════════
// CARTOON CHARACTERS & SPOT ICONS — flat colour PNG art in the Glencoe /
// McGraw-Hill spirit (a friendly recurring cast + iconography), NOT abstract
// avatars. Sourced from Twemoji (CC-BY 4.0) over jsDelivr so there is nothing
// to host. To use your OWN cartoon PNGs, point NAMED[...] at your file URLs
// (e.g. "/writing/activity/grammar-police/images/detective.png").
// ════════════════════════════════════════════════════════════════════════

const TWEMOJI = "https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/72x72";

// Friendly name → Twemoji codepoint (or a full URL to a local PNG).
const NAMED = {
  detective: "1f575", // 🕵️  cover guide — "Sergeant Sentence"
  police: "1f46e",    // 👮  divider guide
  books: "1f4da",     // 📚  Key Vocabulary
  idea: "1f4a1",      // 💡  Main Idea
  target: "1f3af",    // 🎯  Real-World Link
  pencil: "270f",     // ✏️  Study Tip
  rocket: "1f680",    // 🚀  H.O.T. Problems
  magnifier: "1f50d", // 🔍  checker
  grad: "1f393",      // 🎓
  check: "2705",      // ✅
  speech: "1f4ac",    // 💬
};

let NAME = "Sergeant Sentence";
let HERO = "detective";

export function initMascot(m) {
  if (m?.name) NAME = m.name;
  if (m?.hero) HERO = m.hero;
}

export function mascotName() {
  return NAME;
}

// Resolve a friendly name (or raw hex / URL) to a PNG URL.
export function cartoonUrl(name) {
  const v = NAMED[name] || name || NAMED[HERO];
  return v.startsWith("http") || v.startsWith("/") ? v : `${TWEMOJI}/${v}.png`;
}

// Small inline icon for a callout heading.
export function spotIcon(name, cls = "") {
  return `<img class="gp-ico ${cls}" src="${cartoonUrl(name)}" alt="" aria-hidden="true" loading="lazy">`;
}

// Big cartoon character for the cover / divider. `tag` is a small name plate.
export function heroCharacter(name = HERO, { tag = NAME, cls = "" } = {}) {
  return `
    <figure class="gp-hero-char ${cls}">
      <img class="gp-hero-char__img" src="${cartoonUrl(name)}" alt="${tag}" loading="lazy"
           onerror="this.closest('.gp-hero-char')?.classList.add('gp-hero-char--hidden')">
      ${tag ? `<figcaption class="gp-hero-char__tag">${tag}</figcaption>` : ""}
    </figure>`;
}
