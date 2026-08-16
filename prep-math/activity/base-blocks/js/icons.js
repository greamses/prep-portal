/* ============================================================================
   Base Blocks — our own inline SVG glyphs (no icon fonts, no emoji)
   ========================================================================== */

const line = (d, extra = "") =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${d}</svg>`;

export const ICON = {
  split: line(`<rect x="2.5" y="6" width="7" height="12" rx="1"/><rect x="14.5" y="6" width="7" height="12" rx="1"/><path d="M12 3.5v17" stroke-dasharray="2 2.4"/>`),
  merge: line(`<rect x="2.5" y="6" width="6" height="12" rx="1"/><rect x="15.5" y="6" width="6" height="12" rx="1"/><path d="M10.4 12h3.2M12.4 10.2 14.2 12l-1.8 1.8"/>`),
  regroup: line(`<rect x="2.5" y="14" width="4" height="6.5" rx="0.8"/><rect x="8.2" y="14" width="4" height="6.5" rx="0.8"/><rect x="13.9" y="14" width="4" height="6.5" rx="0.8"/><rect x="6" y="3.5" width="12" height="6.5" rx="0.8"/><path d="M12 12.4v-1.2" stroke-dasharray="1.6 1.6"/>`),
  crumbs: line(`<rect x="3" y="3" width="5" height="5" rx="1"/><rect x="9.5" y="3" width="5" height="5" rx="1"/><rect x="16" y="3" width="5" height="5" rx="1"/><rect x="3" y="9.5" width="5" height="5" rx="1"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><rect x="16" y="9.5" width="5" height="5" rx="1"/><rect x="3" y="16" width="5" height="5" rx="1"/><rect x="9.5" y="16" width="5" height="5" rx="1"/><rect x="16" y="16" width="5" height="5" rx="1"/>`),
  rows: line(`<rect x="3" y="4" width="18" height="4.2" rx="1"/><rect x="3" y="10" width="12" height="4.2" rx="1"/><rect x="3" y="16" width="7" height="4.2" rx="1"/>`),
  trash: line(`<path d="M4 6.5h16M9.5 6.5V4.2h5v2.3M6.5 6.5 7.4 20h9.2l.9-13.5M10.2 10v6.4M13.8 10v6.4"/>`),
  undo: line(`<path d="M4 9.5h9.5a5.5 5.5 0 0 1 0 11H8M4 9.5 8 5.6M4 9.5l4 4"/>`),
  lasso: line(`<rect x="3.5" y="3.5" width="17" height="17" rx="1.5" stroke-dasharray="3 2.6"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/>`),
  match: line(`<rect x="2.5" y="7" width="7.5" height="10" rx="1"/><rect x="14" y="7" width="7.5" height="10" rx="1"/><path d="M11.4 10.4h1.2M11.4 13.6h1.2"/>`),
  plus: line(`<path d="M12 5v14M5 12h14"/>`),
  eraser: line(`<path d="M4 20h16M6.6 16.8 15 8.4a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8l-4 4H8.2z"/>`),
  brush: line(`<path d="M6.5 14.5 14 7a2.6 2.6 0 0 1 3.7 3.7l-7.5 7.5-4.4 1.1z"/><path d="M12.4 8.6l3 3"/>`),
  base: line(`<path d="M4 19V9.5M4 19h16M9.5 19V6M15 19v-8.5M20.5 19V4"/>`),
  ruler: line(`<rect x="2.5" y="8" width="19" height="8" rx="1.2"/><path d="M6.5 8v3M10 8v4.4M13.5 8v3M17 8v4.4"/>`),
  expand: line(`<path d="M4 9V5.2a1 1 0 0 1 1-1H9M20 9V5.2a1 1 0 0 0-1-1H15M4 15v3.8a1 1 0 0 0 1 1H9M20 15v3.8a1 1 0 0 1-1 1H15"/>`),
  fit: line(`<rect x="3.5" y="3.5" width="17" height="17" rx="1.5"/><rect x="8.6" y="8.6" width="6.8" height="6.8" rx="1"/>`),
  zoomIn: line(`<circle cx="10.5" cy="10.5" r="6.6"/><path d="m15.4 15.4 5.1 5.1M7.8 10.5h5.4M10.5 7.8v5.4"/>`),
  zoomOut: line(`<circle cx="10.5" cy="10.5" r="6.6"/><path d="m15.4 15.4 5.1 5.1M7.8 10.5h5.4"/>`),
  hand: line(`<path d="M8.6 11.4V5.9a1.45 1.45 0 0 1 2.9 0v4.7m0-1.1a1.45 1.45 0 0 1 2.9 0v1.1m0-.8a1.45 1.45 0 0 1 2.9 0v4.4a5.4 5.4 0 0 1-5.4 5.4h-.8a4.9 4.9 0 0 1-4.2-2.4l-2.2-3.7a1.45 1.45 0 0 1 2.3-1.7l1 1.2"/>`),
  turn: line(`<path d="M20 5.5v5h-5"/><path d="M19.6 10.5a7.8 7.8 0 1 0-1.2 6"/>`),
  chevron: line(`<path d="m8 5 7 7-7 7"/>`),
  close: line(`<path d="M6 6l12 12M18 6 6 18"/>`),
  info: line(`<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.9"/>`),
  check: line(`<path d="m5 12.5 4.6 4.6L19 7.8"/>`),
  back: line(`<path d="M19 12H5M5 12l6-6M5 12l6 6"/>`),
  flat: line(`<rect x="3.5" y="3.5" width="17" height="17" rx="1.5"/><path d="M9 3.5v17M15 3.5v17M3.5 9h17M3.5 15h17"/>`),
  solid: line(`<path d="M12 3.2 20.5 8v8L12 20.8 3.5 16V8z"/><path d="m3.5 8 8.5 4.6L20.5 8M12 12.6v8.2"/>`),

  /* the three families, for the dock's tabs */
  blocks: line(`<path d="M8 2.8 14.2 6v6.4L8 15.6 1.8 12.4V6z"/><path d="m1.8 6 6.2 3.2L14.2 6M8 9.2v6.4"/><rect x="14" y="14" width="7.5" height="7.5" rx="0.8"/>`),
  abacus: line(`<rect x="2.4" y="3.4" width="19.2" height="17.2" rx="1.4"/><path d="M2.4 8.6h19.2M2.4 15.4h19.2"/><circle cx="7.4" cy="8.6" r="2.5" fill="currentColor" stroke="none"/><circle cx="14" cy="8.6" r="2.5" fill="currentColor" stroke="none"/><circle cx="10.2" cy="15.4" r="2.5" fill="currentColor" stroke="none"/><circle cx="16.8" cy="15.4" r="2.5" fill="currentColor" stroke="none"/>`),
  table: line(`<rect x="2.8" y="3.5" width="18.4" height="17" rx="1.4"/><path d="M2.8 9h18.4M2.8 15h18.4M9 3.5v17M15 3.5v17"/>`),
};
