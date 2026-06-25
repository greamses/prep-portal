/* ============================================================================
   Cartesian Art — export, print & share
   ----------------------------------------------------------------------------
   Two outputs from one finished picture:
     • A flat PNG — paper + brush canvas + the SVG plane composited together,
       at 2× for a crisp print. Layers (grid / points & labels / mascot) can be
       toggled off so kids can export just the artwork.
     • A share link — the *vector* drawing (points, closed, fill + grid window)
       packed into the URL hash. Brush strokes are bitmap and too big for a URL,
       so a link reproduces the outline + fill; the PNG carries the full paint.
   ========================================================================== */

import { state, subscribe, loadShape, allPoints } from "./state.js";
import { layout } from "./grid.js";
import { getPaintCanvas } from "./paint.js";

const $ = (s) => document.querySelector(s);

/* Computed-style properties worth carrying into a standalone SVG snapshot, so
   the rasterised image matches what's on screen (CSS classes won't apply once
   the SVG is detached and loaded as an <img>). */
const STYLE_PROPS = [
  "fill", "fill-opacity", "stroke", "stroke-width", "stroke-linecap",
  "stroke-linejoin", "stroke-dasharray", "opacity", "font-family",
  "font-size", "font-weight", "text-anchor", "dominant-baseline",
];

/** Resolve a CSS custom property (or any colour) to a concrete value. */
function token(name, fallback) {
  const v = getComputedStyle(document.body).getPropertyValue(name).trim();
  return v || fallback;
}

/** Clone the live SVG, inline computed styles, and drop unwanted layers. */
function snapshotSvg({ grid = true, points = true, mascot = false } = {}) {
  const live = $("#ca-stage svg");
  if (!live) return null;
  const clone = live.cloneNode(true);

  // walk original + clone in lockstep so we read real computed styles
  const src = live.querySelectorAll("*");
  const dst = clone.querySelectorAll("*");
  for (let i = 0; i < src.length; i++) {
    const cs = getComputedStyle(src[i]);
    let css = "";
    for (const p of STYLE_PROPS) {
      const val = cs.getPropertyValue(p);
      if (val) css += `${p}:${val};`;
    }
    dst[i].setAttribute("style", css);
  }

  // remove layers the user switched off
  const drop = [];
  if (!grid) drop.push(".ca-layer--grid", ".ca-layer--axes");
  if (!points) drop.push(".ca-layer--points", ".ca-layer--shape");
  if (!mascot) drop.push(".ca-layer--mascot");
  drop.push(".ca-layer--ghost", ".ca-layer--tfghost", ".ca-layer--anim"); // helpers, never in the art
  drop.forEach((sel) => clone.querySelectorAll(sel).forEach((n) => n.remove()));

  return clone;
}

/** Compose the finished picture onto a 2× canvas. Returns a Promise<canvas>. */
export function composeImage(opts = {}) {
  const scale = opts.scale || 2;
  const w = layout.w || 600;
  const h = layout.h || 600;

  const out = document.createElement("canvas");
  out.width = w * scale;
  out.height = h * scale;
  const ctx = out.getContext("2d");
  ctx.scale(scale, scale);

  // paper background (matches the studio surface)
  ctx.fillStyle = token("--surface-primary", "#fffdf8");
  ctx.fillRect(0, 0, w, h);

  // brush layer sits behind the plane
  const brush = getPaintCanvas?.();

  const svgClone = snapshotSvg(opts);
  if (!svgClone) return Promise.resolve(out);
  svgClone.setAttribute("width", w);
  svgClone.setAttribute("height", h);
  const xml = new XMLSerializer().serializeToString(svgClone);
  const svgUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);

  return new Promise((resolve) => {
    const finishSvg = () => {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, w, h);
        resolve(out);
      };
      img.onerror = () => resolve(out);
      img.src = svgUrl;
    };
    if (brush && brush.width && brush.height) {
      ctx.drawImage(brush, 0, 0, w, h);
    }
    finishSvg();
  });
}

/* ── PNG download ────────────────────────────────────────────────────────── */
function fileStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

export async function downloadPNG(opts) {
  const canvas = await composeImage(opts);
  const name = (state.puzzle?.title || "cartesian-art")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const a = document.createElement("a");
  a.download = `${name || "cartesian-art"}-${fileStamp()}.png`;
  a.href = canvas.toDataURL("image/png");
  a.click();
}

/* ── print ───────────────────────────────────────────────────────────────── */
export async function printArt(opts) {
  const canvas = await composeImage(opts);
  const url = canvas.toDataURL("image/png");
  const title = state.puzzle?.title || "Cartesian Art";
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(
    `<!doctype html><html><head><title>${title}</title>` +
      `<style>@page{margin:14mm}body{margin:0;display:flex;align-items:center;` +
      `justify-content:center;min-height:100vh;font-family:system-ui,sans-serif}` +
      `figure{margin:0;text-align:center}img{max-width:100%;height:auto}` +
      `figcaption{margin-top:10px;font-size:14px;color:#555}</style></head>` +
      `<body><figure><img src="${url}" alt="${title}"/>` +
      `<figcaption>${title} · Prep Portal · Cartesian Art</figcaption></figure>` +
      `<script>window.onload=function(){setTimeout(function(){window.print()},120)}<\/script>` +
      `</body></html>`
  );
  w.document.close();
}

/* ── share link (vector outline only) ─────────────────────────────────────── */
function b64encode(str) {
  return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64decode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  return decodeURIComponent(escape(atob(str)));
}

/** Pack the current drawing (every shape) into a compact, URL-safe token. */
export function serializeArt() {
  const g = state.grid;
  const payload = {
    s: state.shapes
      .filter((sh) => sh.points.length)
      .map((sh) => ({
        p: sh.points.map((pt) => [pt.x, pt.y]),
        c: sh.closed ? 1 : 0,
        f: sh.fillColor || null,
        k: sh.strokeColor || null,
      })),
    g: [g.xMin, g.xMax, g.yMin, g.yMax],
  };
  return b64encode(JSON.stringify(payload));
}

/** Build a full share URL for the current drawing. */
export function shareUrl() {
  const base = location.origin + location.pathname;
  return `${base}#art=${serializeArt()}`;
}

/** If the URL carries an ?#art= token, load that drawing into the studio. */
export function loadFromUrl() {
  const m = location.hash.match(/art=([^&]+)/);
  if (!m) return false;
  try {
    const data = JSON.parse(b64decode(m[1]));
    const grid = data.g
      ? { xMin: data.g[0], xMax: data.g[1], yMin: data.g[2], yMax: data.g[3] }
      : null;
    if (Array.isArray(data.s)) {
      // new multi-shape format
      const shapes = data.s.map((sh) => ({
        points: (sh.p || []).map(([x, y]) => ({ x, y })),
        closed: !!sh.c,
        fillColor: sh.f || null,
        strokeColor: sh.k || null,
      }));
      loadShape({ shapes, grid });
      return true;
    }
    if (Array.isArray(data.p)) {
      // legacy single-shape format
      loadShape({
        shapes: [{
          points: data.p.map(([x, y]) => ({ x, y })),
          closed: !!data.c,
          fillColor: data.f || null,
        }],
        grid,
      });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/* ── wiring ──────────────────────────────────────────────────────────────── */
export function initExport() {
  const openBtn = $("#ca-export-btn");
  const overlay = $("#ca-export");
  if (!openBtn || !overlay) return;

  const preview = $("#export-preview");
  const optGrid = $("#export-grid");
  const optPoints = $("#export-points");
  const linkField = $("#export-link");
  const copyBtn = $("#export-copy");

  const readOpts = () => ({
    grid: !!optGrid?.checked,
    points: !!optPoints?.checked,
    mascot: false,
    scale: 2,
  });

  let previewToken = 0;
  async function refreshPreview() {
    if (!preview) return;
    const mine = ++previewToken;
    const canvas = await composeImage({ ...readOpts(), scale: 1 });
    if (mine !== previewToken) return; // a newer refresh won
    preview.src = canvas.toDataURL("image/png");
  }

  const open = () => {
    if (!allPoints().length) return;
    if (linkField) linkField.value = shareUrl();
    overlay.classList.add("is-open");
    refreshPreview();
  };
  const close = () => overlay.classList.remove("is-open");

  openBtn.addEventListener("click", open);
  $("#export-close")?.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  optGrid?.addEventListener("change", refreshPreview);
  optPoints?.addEventListener("change", refreshPreview);

  $("#export-download")?.addEventListener("click", () => downloadPNG(readOpts()));
  $("#export-print")?.addEventListener("click", () => printArt(readOpts()));

  copyBtn?.addEventListener("click", async () => {
    const url = shareUrl();
    if (linkField) linkField.value = url;
    try {
      await navigator.clipboard.writeText(url);
      const label = copyBtn.querySelector(".ca-copy-label");
      if (label) {
        const prev = label.textContent;
        label.textContent = "Copied!";
        setTimeout(() => (label.textContent = prev), 1400);
      }
    } catch {
      linkField?.select();
    }
  });

  // gate the export FAB: only meaningful once something is drawn
  const sync = () => {
    openBtn.disabled = allPoints().length === 0;
  };
  subscribe(sync);
  sync();
}
