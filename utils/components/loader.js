(function () {
  const loaderId = "loader";

  /* ──────────────────────────────────────────────────────────────
     ORGANIC BLOBS — a self-contained copy of the seeded amoeba paint
     used in nav-icons.js (heroPaint). Inlined here because loader.js
     is loaded as a plain <script>, not a module, so it can't import.
     ────────────────────────────────────────────────────────────── */
  const rnd = (s) => {
    const x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  function amoebaPath(cx, cy, r, seed, n = 8) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rr = r * (0.72 + 0.34 * rnd(seed * 7.3 + i));
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    const f = (v) => v.toFixed(1);
    const start = mid(pts[n - 1], pts[0]);
    let d = `M ${f(start[0])} ${f(start[1])} `;
    for (let i = 0; i < n; i++) {
      const cur = pts[i];
      const m = mid(cur, pts[(i + 1) % n]);
      d += `Q ${f(cur[0])} ${f(cur[1])} ${f(m[0])} ${f(m[1])} `;
    }
    return d + "Z";
  }

  // Wide multicolour paint splash — same blobs as the site hero.
  function heroPaint() {
    const blobs = [
      [165, 150, 150, 4, "var(--accent-secondary, #6fb7e8)"],
      [850, 120, 175, 9, "var(--accent-primary, #f4c95d)"],
      [840, 470, 160, 13, "var(--accent-success, #7cc47c)"],
      [170, 480, 145, 21, "var(--accent-danger, #f07a7a)"],
      [520, 70, 95, 31, "var(--accent-warning, #f0a868)"],
    ]
      .map(
        ([cx, cy, r, seed, fill]) =>
          `<path d="${amoebaPath(cx, cy, r, seed, 10)}" fill="${fill}"/>`,
      )
      .join("");
    return `<svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${blobs}</svg>`;
  }

  // 1. INJECT CSS IMMEDIATELY (Prevents Flash)
  const style = document.createElement("style");
  style.textContent = `
  @import url("/utils/components/theme.css");
  @import url("/utils/components/components.css");
      #${loaderId} {
        position: fixed !important;
        inset: 0 !important;
        background: #fffdf8 !important;
        z-index: 999999 !important;
        display: flex;
        align-items: center;
        justify-content: center;
        visibility: visible;
        opacity: 1;
        overflow: hidden;
      }

      #${loaderId}.done {
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.8s;
        pointer-events: none;
      }

      /* Multicolour paint splash behind the portal logo (same blobs as
         the site hero), kept soft so the mark stays the focus. */
      #${loaderId} .loader-paint {
        position: absolute;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        overflow: hidden;
        opacity: 0.5;
      }
      #${loaderId} .loader-paint svg { width: 100%; height: 100%; display: block; }

      /* One big logo, swirling like a portal — no words, no progress bar. */
      #${loaderId} .loader-word,
      #${loaderId} .loader-bar { display: none !important; }

      #${loaderId} #loader-wrapper {
        margin: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
        z-index: 1;
      }

      /* Scattered sticky notes that each type out a random long word.
         The container fills the screen; each .loader-type is a paper note
         (.pp-sticky) dropped at a random position, tilt and colour. */
      #${loaderId} .loader-notes {
        position: absolute;
        inset: 0;
        z-index: 1;
        pointer-events: none;
        overflow: hidden;
      }
      #${loaderId} .loader-type {
        position: absolute;
        min-height: 1.4em;
        max-width: min(64vw, 280px);
        font-size: clamp(0.72rem, 2.2vw, 0.95rem);
        line-height: 1.45;
        text-align: center;
        word-break: break-word;
        animation: noteDrop 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
      }
      @keyframes noteDrop {
        0%   { opacity: 0; }
        100% { opacity: 1; }
      }
      #${loaderId} .loader-type::after {
        content: "";
        display: inline-block;
        width: 0.55ch;
        height: 1.05em;
        margin-left: 2px;
        background: var(--accent-secondary, #6fb7e8);
        vertical-align: -0.16em;
        animation: loaderCaret 0.9s steps(1) infinite;
      }
      @keyframes loaderCaret { 50% { opacity: 0; } }

      /* Outer layer: a one-shot "swirl in" that hands off to the loop. */
      #${loaderId} .logo-cluster {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        animation: portalIn 1s cubic-bezier(0.16, 1, 0.3, 1) both;
      }

      /* Beaming core — a glowing heart of the portal that breathes, with
         rotating light beams fanning out behind the logo. */
      #${loaderId} .portal-core {
        position: absolute;
        left: 50%;
        top: 50%;
        width: clamp(70px, 16vw, 130px);
        height: clamp(70px, 16vw, 130px);
        transform: translate(-50%, -50%);
        z-index: 0;
        pointer-events: none;
      }
      #${loaderId} .portal-core::before {
        content: "";
        position: absolute;
        inset: -55%;
        border-radius: 50%;
        background: conic-gradient(
          from 0deg,
          transparent 0 6%,
          color-mix(in srgb, var(--accent-secondary, #6fb7e8) 75%, transparent) 7% 9%,
          transparent 10% 31%,
          color-mix(in srgb, var(--accent-primary, #f4c95d) 80%, transparent) 32% 34%,
          transparent 35% 56%,
          color-mix(in srgb, var(--accent-success, #7cc47c) 75%, transparent) 57% 59%,
          transparent 60% 81%,
          color-mix(in srgb, var(--accent-danger, #f07a7a) 75%, transparent) 82% 84%,
          transparent 85% 100%
        );
        -webkit-mask: radial-gradient(closest-side, #000 18%, transparent 78%);
        mask: radial-gradient(closest-side, #000 18%, transparent 78%);
        filter: blur(2px);
        animation: portalBeams 6s linear infinite;
      }
      #${loaderId} .portal-core::after {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: radial-gradient(
          circle,
          #fffef9 0%,
          var(--accent-primary, #f4c95d) 34%,
          color-mix(in srgb, var(--accent-secondary, #6fb7e8) 70%, transparent) 62%,
          transparent 74%
        );
        filter: blur(5px);
        animation: portalGlow 2.4s ease-in-out infinite;
      }

      /* Inner layer: the continuous portal swirl. */
      #${loaderId} .portal-logo {
        position: relative;
        z-index: 1;
        width: clamp(150px, 32vw, 260px);
        height: auto;
        transform-origin: 50% 50%;
        animation: portalSwirl 2.4s cubic-bezier(0.45, 0, 0.55, 1) infinite;
      }

      /* Core breathes in sync with the swirl, beams spin the other way. */
      @keyframes portalGlow {
        0%, 100% { transform: scale(0.7);  opacity: 0.55; }
        50%      { transform: scale(1.18); opacity: 1; }
      }
      @keyframes portalBeams {
        0%   { transform: rotate(0deg); }
        100% { transform: rotate(-360deg); }
      }

      @keyframes portalIn {
        0%   { transform: scale(0.15) rotate(-160deg); opacity: 0; }
        100% { transform: scale(1) rotate(0deg); opacity: 1; }
      }

      /* Spin a full turn while gently breathing in and out, so it reads as a
         portal pulling inward rather than a flat spinner. */
      @keyframes portalSwirl {
        0%   { transform: rotate(0deg)   scale(1); }
        50%  { transform: rotate(180deg) scale(0.88); }
        100% { transform: rotate(360deg) scale(1); }
      }

      @media (prefers-reduced-motion: reduce) {
        #${loaderId} .logo-cluster { animation: none; }
        #${loaderId} .portal-logo {
          animation: portalSwirl 6s linear infinite;
        }
        #${loaderId} .portal-core::after { animation: none; opacity: 0.8; transform: scale(1); }
        #${loaderId} .portal-core::before { animation: portalBeams 18s linear infinite; }
      }
    `;
  document.head.appendChild(style);

  /* The longest words in the dictionary (≈20–45 letters). Picked at random. */
  const LONG_WORDS = [
    "pneumonoultramicroscopicsilicovolcanoconiosis",
    "supercalifragilisticexpialidocious",
    "pseudopseudohypoparathyroidism",
    "floccinaucinihilipilification",
    "antidisestablishmentarianism",
    "electroencephalographically",
    "honorificabilitudinitatibus",
    "thyroparathyroidectomized",
    "dichlorodifluoromethane",
    "incomprehensibilities",
    "uncharacteristically",
    "spectrophotometrically",
    "psychophysiotherapeutics",
    "radioimmunoelectrophoresis",
    "hepaticocholangiogastrostomy",
  ];

  const rand = (min, max) => min + Math.random() * (max - min);
  // A random word, optionally different from the one just shown.
  function pickWord(prev) {
    let w;
    do {
      w = LONG_WORDS[Math.floor(Math.random() * LONG_WORDS.length)];
    } while (LONG_WORDS.length > 1 && w === prev);
    return w;
  }

  // Typewriter loop on one note: type a random word, hold, delete, repeat.
  // Runs until the loader is dismissed (the `.done` class stops it).
  function startTyping(loader, el) {
    let word = pickWord();
    let ci = 0;
    let deleting = false;
    function tick() {
      if (loader.classList.contains("done")) return;
      if (!deleting) {
        ci++;
        el.textContent = word.slice(0, ci);
        if (ci >= word.length) {
          deleting = true;
          setTimeout(tick, rand(900, 1700));
          return;
        }
        setTimeout(tick, rand(45, 75));
      } else {
        ci--;
        el.textContent = word.slice(0, ci);
        if (ci <= 0) {
          deleting = false;
          word = pickWord(word);
          setTimeout(tick, rand(220, 520));
          return;
        }
        setTimeout(tick, rand(20, 34));
      }
    }
    // Stagger each note's start so they don't type in lockstep.
    setTimeout(tick, rand(0, 900));
  }

  // 2. ENHANCE HTML CONTENT
  function init() {
    const loader = document.getElementById(loaderId);
    if (!loader) return;

    // Paint-blob background layer (sits behind the centred logo wrapper).
    if (!loader.querySelector(".loader-paint")) {
      const paint = document.createElement("div");
      paint.className = "loader-paint";
      paint.setAttribute("aria-hidden", "true");
      paint.innerHTML = heroPaint();
      loader.insertBefore(paint, loader.firstChild);
    }

    // A single large logo (references the generated mark so it always matches).
    const cluster = loader.querySelector(".logo-cluster");
    if (cluster) {
      cluster.innerHTML = `<div class="portal-core" aria-hidden="true"></div><img class="portal-logo" src="/logo/logo-loading.svg" alt="" />`;
    }

    // Scatter several typing sticky notes at random positions / tilts /
    // colours (injected, so no page markup changes). They are kept toward
    // the edges so the centred swirling logo stays clear.
    if (!loader.querySelector(".loader-notes")) {
      const notes = document.createElement("div");
      notes.className = "loader-notes";
      notes.setAttribute("aria-hidden", "true");
      loader.appendChild(notes);

      // Edge-biased anchor zones (left%, top%) so notes ring the logo.
      const zones = [
        [6, 10], [62, 8], [10, 64], [60, 66],
        [4, 38], [70, 40], [34, 6], [36, 74],
      ];
      // Shuffle and take a random count of them.
      for (let i = zones.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [zones[i], zones[j]] = [zones[j], zones[i]];
      }
      const count = Math.round(rand(4, 6));

      zones.slice(0, count).forEach(([lx, ty]) => {
        const note = document.createElement("div");
        note.className = `loader-type pp-sticky pp-sticky--c${Math.floor(rand(0, 6))}`;
        note.setAttribute("aria-hidden", "true");
        // Jitter the anchor a little and randomise tilt + scale.
        note.style.left = `${(lx + rand(-4, 4)).toFixed(1)}%`;
        note.style.top = `${(ty + rand(-4, 4)).toFixed(1)}%`;
        note.style.setProperty("--pp-note-tilt", `${rand(-8, 8).toFixed(1)}deg`);
        note.style.fontSize = `${rand(0.72, 1).toFixed(2)}rem`;
        notes.appendChild(note);
        startTyping(loader, note);
      });
    }

    // Hide when page is fully loaded
    window.addEventListener("load", () => {
      setTimeout(() => {
        loader.classList.add("done");
        document.body.style.visibility = "visible";
        document.body.classList.add("portal-ready");
      }, 1800);
    });
  }

  // Run as soon as DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
