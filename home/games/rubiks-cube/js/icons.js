/* =====================================================================
   All inline SVG icons for the Rubik's Cube game UI.
   Injected into [data-icon] elements at startup by injectIcons().
   ===================================================================== */

export const ICONS = {
  star: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.6 5.35 5.9.85-4.27 4.16 1.01 5.88L12 16.13l-5.24 2.76 1.01-5.88L3.5 8.8l5.9-.85z" fill="var(--accent-primary)"/><circle cx="12" cy="10.4" r="1.9" fill="#fff" opacity="0.85"/></svg>`,

  learn: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4l9 4-9 4-9-4z" fill="var(--ink)"/><path d="M6.5 10.8v3.4c0 1.6 2.5 2.9 5.5 2.9s5.5-1.3 5.5-2.9v-3.4L12 13.2z" fill="var(--accent-secondary)"/><rect x="19.6" y="8.6" width="1.6" height="6" rx="0.8" fill="var(--accent-warning)"/></svg>`,

  practice: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="var(--accent-danger)"/><circle cx="12" cy="12" r="5.4" fill="#fff"/><circle cx="12" cy="12" r="2.4" fill="var(--accent-danger)"/></svg>`,

  camera: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 7l1.6-2.6h3.8L15.5 7z" fill="var(--accent-secondary)"/><rect x="2.5" y="7" width="19" height="13" rx="3" fill="var(--accent-secondary)"/><circle cx="12" cy="13.4" r="4.1" fill="#fff"/><circle cx="12" cy="13.4" r="2.3" fill="var(--accent-primary)"/></svg>`,

  menu: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="13" width="16" height="6.4" rx="2.2" fill="var(--accent-success)"/><rect x="4" y="8.6" width="16" height="6.4" rx="2.2" fill="var(--accent-secondary)"/><rect x="4" y="4.2" width="16" height="6.4" rx="2.2" fill="var(--accent-primary)"/></svg>`,

  close: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="10.8" y="4" width="2.4" height="16" rx="1.2" fill="var(--accent-danger)" transform="rotate(45 12 12)"/><rect x="10.8" y="4" width="2.4" height="16" rx="1.2" fill="var(--accent-warning)" transform="rotate(-45 12 12)"/></svg>`,

  "phase-up": "<svg viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><g transform=\"rotate(270 12 12)\"><path d=\"M9.4 3.9 17 11.1a1.25 1.25 0 0 1 0 1.8L9.4 20.1a1.3 1.3 0 0 1-1.8-1.9L14 12 7.6 5.8a1.3 1.3 0 0 1 1.8-1.9z\" fill=\"var(--accent-secondary)\"/></g></svg>",

  "phase-down": "<svg viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><g transform=\"rotate(90 12 12)\"><path d=\"M9.4 3.9 17 11.1a1.25 1.25 0 0 1 0 1.8L9.4 20.1a1.3 1.3 0 0 1-1.8-1.9L14 12 7.6 5.8a1.3 1.3 0 0 1 1.8-1.9z\" fill=\"var(--accent-secondary)\"/></g></svg>",

  "move-prev": "<svg viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><g transform=\"rotate(180 12 12)\"><path d=\"M9.4 3.9 17 11.1a1.25 1.25 0 0 1 0 1.8L9.4 20.1a1.3 1.3 0 0 1-1.8-1.9L14 12 7.6 5.8a1.3 1.3 0 0 1 1.8-1.9z\" fill=\"var(--accent-secondary)\"/></g></svg>",

  // play + pause live in the same button; CSS toggles them via display
  "play-pause": `<svg class="icon-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l13 8-13 8z" fill="currentColor"/></svg><svg class="icon-pause" viewBox="0 0 24 24" aria-hidden="true" style="display:none"><rect x="6" y="4" width="4" height="16" rx="1.5" fill="currentColor"/><rect x="14" y="4" width="4" height="16" rx="1.5" fill="currentColor"/></svg>`,

  "move-next": "<svg viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><g transform=\"rotate(0 12 12)\"><path d=\"M9.4 3.9 17 11.1a1.25 1.25 0 0 1 0 1.8L9.4 20.1a1.3 1.3 0 0 1-1.8-1.9L14 12 7.6 5.8a1.3 1.3 0 0 1 1.8-1.9z\" fill=\"var(--accent-secondary)\"/></g></svg>",

  // eye + hand live in the same button
  "watch-attempt": "<svg class=\"icon-watch\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><path d=\"M1.8 12S5.6 4.8 12 4.8 22.2 12 22.2 12 18.4 19.2 12 19.2 1.8 12 1.8 12z\" fill=\"var(--accent-secondary)\"/><circle cx=\"12\" cy=\"12\" r=\"4.4\" fill=\"#fff\"/><circle cx=\"12\" cy=\"12\" r=\"2.3\" fill=\"var(--accent-danger)\"/></svg><svg class=\"icon-attempt\" style=\"display:none\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><path d=\"M8.4 11.6V5.9a1.6 1.6 0 0 1 3.2 0v4.6a1.6 1.6 0 0 1 3.1 0v.8a1.6 1.6 0 0 1 3.1 0v3.9a5.8 5.8 0 0 1-5.8 5.8h-.8a5.2 5.2 0 0 1-4.5-2.6l-2.3-3.9a1.6 1.6 0 0 1 2.6-1.8z\" fill=\"var(--accent-secondary)\"/></svg>",

  // crosshair off + on live in the same button
  "focus-toggle": "<svg class=\"icon-focus-off\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"6.4\" fill=\"var(--accent-secondary)\"/><circle cx=\"12\" cy=\"12\" r=\"3.2\" fill=\"#fff\"/><circle cx=\"12\" cy=\"12\" r=\"1.6\" fill=\"var(--accent-danger)\"/><rect x=\"10.8\" y=\"1.6\" width=\"2.4\" height=\"4.4\" rx=\"1.2\" fill=\"var(--accent-danger)\"/><rect x=\"10.8\" y=\"18\" width=\"2.4\" height=\"4.4\" rx=\"1.2\" fill=\"var(--accent-danger)\"/><rect x=\"1.6\" y=\"10.8\" width=\"4.4\" height=\"2.4\" rx=\"1.2\" fill=\"var(--accent-danger)\"/><rect x=\"18\" y=\"10.8\" width=\"4.4\" height=\"2.4\" rx=\"1.2\" fill=\"var(--accent-danger)\"/></svg><svg class=\"icon-focus-on\" style=\"display:none\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"8.6\" fill=\"var(--accent-secondary)\"/><circle cx=\"12\" cy=\"12\" r=\"5.6\" fill=\"#fff\"/><circle cx=\"12\" cy=\"12\" r=\"3.4\" fill=\"var(--accent-danger)\"/></svg>",

  "pad-fab": `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 7.5h9a4.7 4.7 0 0 1 4.6 3.8l.7 3.7A2.5 2.5 0 0 1 17 16.6L15.8 15H8.2L7 16.6A2.5 2.5 0 0 1 2.2 15l.7-3.7A4.7 4.7 0 0 1 7.5 7.5z" fill="var(--accent-secondary)"/><rect x="4.9" y="10.7" width="1.6" height="4" rx="0.8" fill="#fff"/><rect x="3.7" y="11.9" width="4" height="1.6" rx="0.8" fill="#fff"/><circle cx="16.2" cy="11.6" r="1.2" fill="var(--accent-danger)"/><circle cx="18.5" cy="13" r="1.2" fill="var(--accent-primary)"/><circle cx="14.4" cy="13" r="1.2" fill="#fff"/></svg>`,

  scramble: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h4l10 10h3" fill="none" stroke="var(--accent-secondary)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 14l3 3-3 3" fill="none" stroke="var(--accent-secondary)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 17h4l3-3" fill="none" stroke="var(--accent-danger)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 10l3-3h4" fill="none" stroke="var(--accent-danger)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 4l3 3-3 3" fill="none" stroke="var(--accent-danger)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  reset: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.8 12a6.8 6.8 0 1 1-2-4.9" fill="none" stroke="var(--accent-success)" stroke-width="2.6" stroke-linecap="round"/><path d="M20.6 4.7l-.7 4.4-4.4-.7" fill="none" stroke="var(--accent-warning)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  "cam-start": `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="6.5" width="13" height="11" rx="2.5" fill="var(--accent-success)"/><path d="M16.5 10l5-2.8v9.6l-5-2.8z" fill="var(--accent-success)"/></svg>`,

  "cam-manual": `<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="var(--accent-secondary)"><rect x="3" y="3" width="5" height="5" rx="1.2"/><rect x="9.5" y="3" width="5" height="5" rx="1.2"/><rect x="16" y="3" width="5" height="5" rx="1.2"/><rect x="3" y="9.5" width="5" height="5" rx="1.2"/><rect x="9.5" y="9.5" width="5" height="5" rx="1.2"/><rect x="3" y="16" width="5" height="5" rx="1.2"/></g><path d="M13 20.4l6.6-6.6 2.2 2.2-6.6 6.6-2.6.4z" fill="var(--accent-warning)"/></svg>`,

  "cam-template": `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4" fill="var(--accent-primary)"/><circle cx="8.2" cy="8.2" r="1.7" fill="#fff"/><circle cx="15.8" cy="8.2" r="1.7" fill="#fff"/><circle cx="12" cy="12" r="1.7" fill="#fff"/><circle cx="8.2" cy="15.8" r="1.7" fill="#fff"/><circle cx="15.8" cy="15.8" r="1.7" fill="#fff"/></svg>`,

  "manual-close": "<svg viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><rect x=\"10.6\" y=\"3.5999999999999996\" width=\"2.8\" height=\"16.8\" rx=\"1.4\" fill=\"var(--accent-danger)\" transform=\"rotate(45 12 12)\"/><rect x=\"10.6\" y=\"3.5999999999999996\" width=\"2.8\" height=\"16.8\" rx=\"1.4\" fill=\"var(--accent-danger)\" transform=\"rotate(-45 12 12)\"/></svg>",
};

export function injectIcons() {
  document.querySelectorAll("[data-icon]").forEach((el) => {
    const svg = ICONS[el.dataset.icon];
    if (svg) el.insertAdjacentHTML("afterbegin", svg);
  });
}
