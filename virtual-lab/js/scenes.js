/* ============================================================================
   VIRTUAL LAB — the three bench scenes, drawn once
   ----------------------------------------------------------------------------
   These drawings used to sit inline in the lab hub's HTML, which meant the
   front page could not show them without copying them. They are the labs' own
   pictures, so they live here and the hub fills its cards from this module —
   and anyone else who wants to show a lab (home/js/showcase.js) shows THIS,
   not a second drawing of the same bench.

   Every colour is a theme token, so a scene re-tints with light and dark.
   ========================================================================== */

const chemistry = () => `
<svg viewBox="0 0 320 170" xmlns="http://www.w3.org/2000/svg" fill="none" role="img" aria-label="A chemistry bench: flask, beaker, test tube and burner">
  <ellipse cx="160" cy="158" rx="135" ry="9" fill="var(--ink)" opacity="0.07"/>
  <rect x="30" y="130" width="260" height="14" rx="7" fill="var(--accent-warning)" opacity="0.35"/>
  <!-- Erlenmeyer flask -->
  <path d="M125 38h30v46l34 54h-98l34-54z" fill="var(--bg)" opacity="0.9"/>
  <path d="M113 118l6-10h62l6 10 6 12h-86z" fill="var(--accent-success)" opacity="0.7"/>
  <path d="M125 38h30v46l34 54h-98l34-54z" stroke="var(--accent-secondary)" stroke-width="1.5" opacity="0.25"/>
  <rect x="122" y="33" width="36" height="7" rx="3" fill="var(--accent-secondary)" opacity="0.55"/>
  <circle cx="143" cy="108" r="3.5" fill="var(--accent-secondary)" opacity="0.5"/>
  <circle cx="150" cy="94" r="2.5" fill="var(--accent-secondary)" opacity="0.4"/>
  <circle cx="141" cy="80" r="2" fill="var(--accent-secondary)" opacity="0.35"/>
  <circle cx="147" cy="67" r="1.8" fill="var(--accent-secondary)" opacity="0.3"/>
  <!-- Beaker -->
  <rect x="200" y="68" width="52" height="62" rx="3" fill="var(--bg)" opacity="0.9"/>
  <rect x="199" y="62" width="54" height="9" rx="3" fill="var(--accent-secondary)" opacity="0.45"/>
  <rect x="202" y="108" width="48" height="22" rx="2" fill="var(--accent-danger)" opacity="0.6"/>
  <circle cx="216" cy="114" r="4" fill="#fff" opacity="0.65"/>
  <circle cx="234" cy="118" r="3" fill="#fff" opacity="0.55"/>
  <!-- Test tube -->
  <rect x="58" y="52" width="20" height="68" rx="10" fill="var(--accent-primary)" opacity="0.65"/>
  <path d="M58 105h20a10 10 0 0 1-20 0z" fill="var(--accent-warning)" opacity="0.85"/>
  <rect x="52" y="46" width="32" height="8" rx="3" fill="var(--accent-secondary)" opacity="0.4"/>
  <!-- Bunsen burner -->
  <rect x="270" y="112" width="24" height="18" rx="4" fill="var(--text-secondary)" opacity="0.35"/>
  <ellipse cx="282" cy="111" rx="11" ry="4" fill="var(--text-secondary)" opacity="0.45"/>
  <rect x="278" y="84" width="8" height="28" rx="4" fill="var(--text-secondary)" opacity="0.4"/>
  <path d="M282 72c-6 9 6 11 0 22" stroke="var(--accent-danger)" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.8"/>
  <path d="M279 79c-3 5 3 6 0 12" stroke="var(--accent-warning)" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.7"/>
  <!-- Sparkles -->
  <path d="M38 28l3.5 7 7.5 1-5.5 5 1.5 7.5-7-3.5-7 3.5 1.5-7.5-5.5-5 7.5-1z" fill="var(--accent-primary)"/>
  <path d="M288 38v-10m0 10h-10m10 0h10m-10 0v10" stroke="var(--accent-secondary)" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
</svg>`;

const physics = () => `
<svg viewBox="0 0 320 170" xmlns="http://www.w3.org/2000/svg" fill="none" role="img" aria-label="A physics bench: pendulum, spring, ramp and ball">
  <ellipse cx="160" cy="158" rx="135" ry="9" fill="var(--ink)" opacity="0.07"/>
  <!-- Pendulum bar -->
  <rect x="90" y="18" width="130" height="8" rx="4" fill="var(--accent-warning)"/>
  <rect x="88" y="14" width="8" height="44" rx="3" fill="var(--accent-warning)" opacity="0.5"/>
  <rect x="220" y="14" width="8" height="44" rx="3" fill="var(--accent-warning)" opacity="0.5"/>
  <!-- String -->
  <line x1="155" y1="26" x2="118" y2="110" stroke="var(--ink)" stroke-width="1.8" stroke-linecap="round" opacity="0.5"/>
  <!-- Bob -->
  <circle cx="118" cy="118" r="18" fill="var(--accent-secondary)"/>
  <circle cx="118" cy="118" r="7" fill="#fff" opacity="0.45"/>
  <!-- Arc -->
  <path d="M98 62Q155 96 212 62" stroke="var(--accent-danger)" stroke-width="1.5" fill="none" opacity="0.5" stroke-dasharray="5 3" stroke-linecap="round"/>
  <!-- Gravity arrow -->
  <path d="M118 136v28m0 0l-5-7m5 7l5-7" stroke="var(--accent-danger)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>
  <!-- Spring -->
  <line x1="256" y1="20" x2="256" y2="36" stroke="var(--ink)" stroke-width="2" opacity="0.45"/>
  <path d="M256 36Q264 43 256 51Q248 58 256 65Q264 72 256 79Q248 86 256 93Q264 100 256 107" stroke="var(--accent-success)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <rect x="240" y="107" width="32" height="20" rx="5" fill="var(--accent-primary)" opacity="0.85"/>
  <!-- Ramp -->
  <path d="M28 145L28 72L88 145Z" fill="var(--accent-secondary)" opacity="0.2"/>
  <line x1="28" y1="72" x2="88" y2="145" stroke="var(--accent-secondary)" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="80" cy="138" r="13" fill="var(--accent-danger)" opacity="0.75"/>
  <circle cx="76" cy="134" r="4" fill="#fff" opacity="0.5"/>
  <path d="M72 126L54 110m0 0l9 0m-9 0l0 9" stroke="var(--accent-warning)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.75"/>
  <!-- Sparkle -->
  <path d="M290 35l2.5 5 5 .5-3.5 3.5.8 5-4.3-2.3-4.3 2.3.8-5-3.5-3.5 5-.5z" fill="var(--accent-primary)" opacity="0.8"/>
</svg>`;

const biology = () => `
<svg viewBox="0 0 320 170" xmlns="http://www.w3.org/2000/svg" fill="none" role="img" aria-label="A biology bench: microscope, a cell, a petri dish and DNA">
  <ellipse cx="160" cy="158" rx="135" ry="9" fill="var(--ink)" opacity="0.07"/>
  <!-- Microscope -->
  <rect x="108" y="128" width="84" height="16" rx="8" fill="var(--accent-secondary)" opacity="0.55"/>
  <rect x="143" y="52" width="14" height="80" rx="7" fill="var(--accent-secondary)" opacity="0.65"/>
  <rect x="120" y="112" width="60" height="10" rx="4" fill="var(--accent-primary)" opacity="0.7"/>
  <rect x="132" y="26" width="36" height="28" rx="8" fill="var(--accent-secondary)" opacity="0.75"/>
  <rect x="144" y="12" width="20" height="16" rx="5" fill="var(--accent-secondary)" opacity="0.85"/>
  <circle cx="154" cy="120" r="9" fill="var(--accent-success)" opacity="0.7"/>
  <circle cx="154" cy="120" r="4" fill="#fff" opacity="0.5"/>
  <!-- Cell -->
  <ellipse cx="248" cy="88" rx="52" ry="44" fill="var(--accent-success)" opacity="0.12"/>
  <ellipse cx="248" cy="88" rx="52" ry="44" stroke="var(--accent-success)" stroke-width="2" fill="none" opacity="0.45"/>
  <circle cx="248" cy="88" r="18" fill="var(--accent-secondary)" opacity="0.3"/>
  <circle cx="248" cy="88" r="18" stroke="var(--accent-secondary)" stroke-width="1.5" fill="none" opacity="0.55"/>
  <circle cx="244" cy="85" r="6" fill="var(--accent-secondary)" opacity="0.7"/>
  <circle cx="270" cy="72" r="5" fill="var(--accent-danger)" opacity="0.45"/>
  <circle cx="228" cy="104" r="4" fill="var(--accent-danger)" opacity="0.45"/>
  <circle cx="266" cy="106" r="4" fill="var(--accent-primary)" opacity="0.55"/>
  <circle cx="232" cy="74" r="3.5" fill="var(--accent-primary)" opacity="0.55"/>
  <circle cx="260" cy="90" r="3" fill="var(--accent-warning)" opacity="0.5"/>
  <!-- Petri dish -->
  <ellipse cx="58" cy="130" rx="44" ry="12" fill="var(--bg)" stroke="var(--accent-secondary)" stroke-width="2" opacity="0.8"/>
  <ellipse cx="58" cy="128" rx="34" ry="8" fill="var(--accent-success)" opacity="0.15"/>
  <circle cx="46" cy="126" r="6" fill="var(--accent-danger)" opacity="0.4"/>
  <circle cx="66" cy="128" r="5" fill="var(--accent-success)" opacity="0.45"/>
  <circle cx="55" cy="120" r="4" fill="var(--accent-warning)" opacity="0.4"/>
  <!-- DNA hint -->
  <path d="M30 32Q38 42 30 52Q22 62 30 72" stroke="var(--accent-danger)" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.55"/>
  <path d="M40 32Q32 42 40 52Q48 62 40 72" stroke="var(--accent-secondary)" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.55"/>
  <line x1="30" y1="32" x2="40" y2="32" stroke="var(--accent-warning)" stroke-width="1.5" opacity="0.5"/>
  <line x1="28" y1="42" x2="42" y2="42" stroke="var(--accent-warning)" stroke-width="1.5" opacity="0.5"/>
  <line x1="30" y1="52" x2="40" y2="52" stroke="var(--accent-warning)" stroke-width="1.5" opacity="0.5"/>
  <line x1="28" y1="62" x2="42" y2="62" stroke="var(--accent-warning)" stroke-width="1.5" opacity="0.5"/>
  <line x1="30" y1="72" x2="40" y2="72" stroke="var(--accent-warning)" stroke-width="1.5" opacity="0.5"/>
</svg>`;

export const LAB_SCENES = { chemistry, physics, biology };

/** Fill every `[data-scene]` on the page with its bench. */
export function paintScenes(root = document) {
  let n = 0;
  root.querySelectorAll("[data-scene]").forEach((box) => {
    const draw = LAB_SCENES[box.dataset.scene];
    if (!draw) return;
    box.innerHTML = draw();
    n++;
  });
  return n;
}

if (typeof document !== "undefined" && document.currentScript?.dataset.paint !== "no") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => paintScenes());
  else paintScenes();
}
