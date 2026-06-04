// ============================================================================
// COVER COMPONENT - the front cover, section divider, and back cover share ONE
// look: a full-bleed PHOTO under a dark overlay, the Prep Portal logo top-left,
// and a rounded spine wrapping the left edge. Only the spine colour shade
// changes per face (via the .gp-cover--teal / --purple classes).
//
// Everything sizes in container-query units (see cover.css) so the SAME markup
// renders full-size in the flipbook AND shrunk on the bookshelf.
// ============================================================================

import { state } from "../utils/state.js";

const LOGO = "/icon.svg";

// Defaults mirror server/content/grammarBook.js MEDIA, so the shelf thumbnail
// (rendered before the book is fetched) still shows a real photo.
const DEFAULT_COVER = "photo-1503676260728-1c00da094a0b";
const DEFAULT_HERO = "photo-1456513080510-7bf3a84b82f8";

// Build a responsive Unsplash URL from a stored photo id (same convention as
// js/data/assets.js), with a deterministic picsum fallback if it fails to load.
function coverImg(id, seed) {
  const src = id?.startsWith("http")
    ? id
    : `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;
  const fallback = `https://picsum.photos/seed/${encodeURIComponent(
    seed || id || "gp",
  )}/900/1200`;
  return { src, fallback };
}

function coverInner(imgId, seed) {
  const img = coverImg(imgId, seed);
  return `
    <div class="gp-cover__art">
      <img class="gp-cover__photo" src="${img.src}" alt=""
           onerror="this.onerror=null;this.src='${img.fallback}'">
    </div>
    <div class="gp-cover__overlay" aria-hidden="true"></div>
    <div class="gp-cover__spine" aria-hidden="true"></div>
    <img class="gp-cover__logo-tl" src="${LOGO}" alt="Prep Portal logo">`;
}

const media = () => (state.book && state.book.media) || {};

export function frontCoverInner(book = {}) {
  const m = (book && book.media) || media();
  return coverInner(m.cover || DEFAULT_COVER, "gp-cover");
}

export function dividerInner() {
  const m = media();
  return coverInner(m.hero || m.cover || DEFAULT_HERO, "gp-divider");
}

export function backCoverInner(book = {}) {
  const m = (book && book.media) || media();
  return coverInner(m.hero || m.cover || DEFAULT_HERO, "gp-back");
}
