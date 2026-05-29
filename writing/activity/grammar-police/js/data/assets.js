// ════════════════════════════════════════════════════════════════════════
// MEDIA HELPERS — real photography + video for the editorial redesign.
// The book content stores bare Unsplash photo IDs (e.g. "photo-1503…"); these
// helpers turn them into responsive URLs with a picsum fallback, and resolve
// the featured closing video from the same /api/youtube/featured endpoint the
// homepage magazine uses.
// ════════════════════════════════════════════════════════════════════════

import { API_BASE } from "../services/book-service.js";

// Build an Unsplash CDN URL from a stored photo ID.
export const unsplash = (id, w = 1100) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

// Deterministic placeholder if Unsplash ever fails to load.
export const picsum = (seed, w = 900, h = 700) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;

// <img> markup with a built-in onerror fallback. `id` may be a full URL or a
// bare Unsplash photo id from the book content.
export function photo(id, alt = "", { w = 1100, seed = "gp", cls = "" } = {}) {
  const src = id?.startsWith("http") ? id : unsplash(id, w);
  return `<img class="${cls}" src="${src}" alt="${alt}" loading="lazy"
    onerror="this.onerror=null;this.src='${picsum(seed)}'">`;
}

// Closing-page video. Tries the live featured video, falls back to the id
// baked into the book content. Returns { id, title, thumbnail }.
export async function fetchFeaturedVideo(fallback) {
  const fb = fallback || {};
  try {
    const res = await fetch(`${API_BASE}/api/youtube/featured`);
    if (!res.ok) throw new Error(String(res.status));
    const v = await res.json();
    if (!v?.videoId) throw new Error("no video");
    return {
      id: v.videoId,
      title: v.title || fb.title || "Watch",
      thumbnail:
        v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/maxresdefault.jpg`,
    };
  } catch {
    const id = fb.id || "M7lc1UVf-VE";
    return {
      id,
      title: fb.title || "Watch",
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  }
}
