(function () {
  const loaderId = "loader";

  /* ── PWA display mode by screen size ──
     Large screens install/open in a normal browser tab (display: browser);
     small screens get the app-like standalone manifest. Swap the manifest link
     before the browser evaluates installability. */
  try {
    const big = window.matchMedia("(min-width: 1024px)").matches;
    const link = document.querySelector('link[rel="manifest"]');
    if (link) link.setAttribute("href", big ? "/manifest-browser.json" : "/manifest.json");
  } catch (e) {}

  /* ── Restore the saved theme before first paint (avoids a flash) ──
     The nav theme toggle persists the choice to localStorage("pp-theme").
     Honour an explicit choice; otherwise fall back to the OS preference. */
  try {
    const saved = localStorage.getItem("pp-theme");
    const theme =
      saved ||
      (window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    document.documentElement.dataset.theme = theme;
  } catch (e) {}

  /* ── seeded amoeba paint (inlined — no module import available here) ── */
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
  function heroPaint() {
    const blobs = [
      [165, 150, 150,  4, "var(--accent-secondary, #6fb7e8)"],
      [850, 120, 175,  9, "var(--accent-primary, #f4c95d)"],
      [840, 470, 160, 13, "var(--accent-success, #7cc47c)"],
      [170, 480, 145, 21, "var(--accent-danger, #f07a7a)"],
      [520,  70,  95, 31, "var(--accent-warning, #f0a868)"],
    ]
      .map(([cx, cy, r, seed, fill]) =>
        `<path d="${amoebaPath(cx, cy, r, seed, 10)}" fill="${fill}"/>`)
      .join("");
    return `<svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${blobs}</svg>`;
  }

  /* ── 1. CSS — injected before first paint ── */
  const style = document.createElement("style");
  style.textContent = `
    @import url("/utils/components/theme.css");
    @import url("/utils/components/components.css");

    #${loaderId} {
      position: fixed !important;
      inset: 0 !important;
      background: var(--bg, #fffdf8) !important;
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

    /* hide the HTML word / bar if present */
    #${loaderId} .loader-word,
    #${loaderId} .loader-bar { display: none !important; }

    /* ── paint blobs (layer 0) ── */
    #${loaderId} .loader-paint {
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      overflow: hidden;
      opacity: 0.45;
    }
    #${loaderId} .loader-paint svg { width: 100%; height: 100%; display: block; }

    /* ── ripple rings (layer 1) ── */
    #${loaderId} .rings-container {
      position: absolute;
      inset: 0;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }
    #${loaderId} .ring {
      position: absolute;
      border-radius: 50%;
      border: 2px solid;
      /* all rings share one max size; scale drives the "small → big" travel */
      width: 580px;
      height: 580px;
      animation: rippleOut 3s ease-out infinite;
    }

    /* five rings, each offset by 0.6 s so a new one appears every 0.6 s */
    #${loaderId} .ring-1 { border-color: var(--accent-secondary, #6fb7e8); animation-delay:  0s;   }
    #${loaderId} .ring-2 { border-color: var(--accent-primary,   #f4c95d); animation-delay: -0.6s; }
    #${loaderId} .ring-3 { border-color: var(--accent-success,   #7cc47c); animation-delay: -1.2s; }
    #${loaderId} .ring-4 { border-color: var(--accent-danger,    #f07a7a); animation-delay: -1.8s; }
    #${loaderId} .ring-5 { border-color: var(--accent-warning,   #f0a868); animation-delay: -2.4s; }

    /* born tiny at center → expand to full size, fading out */
    @keyframes rippleOut {
      0%   { transform: scale(0.04); opacity: 0.9; }
      40%  { opacity: 0.55; }
      100% { transform: scale(1);    opacity: 0;   }
    }

    /* ── logo (layer 2) ── */
    #${loaderId} #loader-wrapper {
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      z-index: 2;
    }
    #${loaderId} .logo-cluster {
      display: flex;
      align-items: center;
      justify-content: center;
      animation: clusterIn 1s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    #${loaderId} .portal-logo {
      width: clamp(130px, 28vw, 220px);
      height: auto;
      animation: portalSpin 3.6s linear infinite;
    }
    @keyframes clusterIn {
      0%   { transform: scale(0.2) rotate(-140deg); opacity: 0; }
      100% { transform: scale(1)   rotate(0deg);    opacity: 1; }
    }
    @keyframes portalSpin {
      to { transform: rotate(360deg); }
    }

    /* ── single sticker bottom-centre (layer 3) ── */
    #${loaderId} .loader-notes {
      position: absolute;
      inset: 0;
      z-index: 3;
      pointer-events: none;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding-bottom: clamp(24px, 5vh, 56px);
    }
    #${loaderId} .loader-type {
      max-width: min(64vw, 280px);
      font-size: clamp(0.72rem, 2.2vw, 0.95rem);
      line-height: 1.45;
      text-align: center;
      word-break: break-word;
      animation: noteDrop 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @keyframes noteDrop {
      0%   { opacity: 0; transform: translateY(10px); }
      100% { opacity: 1; transform: translateY(0);    }
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

    @media (prefers-reduced-motion: reduce) {
      #${loaderId} .logo-cluster { animation: none; }
      #${loaderId} .portal-logo  { animation: portalSpin 10s linear infinite; }
      #${loaderId} .ring         { animation: rippleOut 6s ease-out infinite; }
    }
  `;
  document.head.appendChild(style);

  /* ── word list ── */
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
  function pickWord(prev) {
    let w;
    do { w = LONG_WORDS[Math.floor(Math.random() * LONG_WORDS.length)]; }
    while (LONG_WORDS.length > 1 && w === prev);
    return w;
  }
  function startTyping(loader, el) {
    let word = pickWord(), ci = 0, deleting = false;
    function tick() {
      if (loader.classList.contains("done")) return;
      if (!deleting) {
        el.textContent = word.slice(0, ++ci);
        if (ci >= word.length) { deleting = true; setTimeout(tick, rand(900, 1700)); return; }
        setTimeout(tick, rand(45, 75));
      } else {
        el.textContent = word.slice(0, --ci);
        if (ci <= 0) { deleting = false; word = pickWord(word); setTimeout(tick, rand(220, 520)); return; }
        setTimeout(tick, rand(20, 34));
      }
    }
    setTimeout(tick, rand(0, 400));
  }

  /* ── 2. BUILD DOM ── */
  function init() {
    const loader = document.getElementById(loaderId);
    if (!loader) return;

    /* paint blobs */
    if (!loader.querySelector(".loader-paint")) {
      const paint = document.createElement("div");
      paint.className = "loader-paint";
      paint.setAttribute("aria-hidden", "true");
      paint.innerHTML = heroPaint();
      loader.insertBefore(paint, loader.firstChild);
    }

    /* ripple rings */
    if (!loader.querySelector(".rings-container")) {
      const wrap = document.createElement("div");
      wrap.className = "rings-container";
      wrap.setAttribute("aria-hidden", "true");
      for (let i = 1; i <= 5; i++) {
        const r = document.createElement("div");
        r.className = `ring ring-${i}`;
        wrap.appendChild(r);
      }
      /* insert after paint, before loader-wrapper */
      const lw = loader.querySelector("#loader-wrapper");
      loader.insertBefore(wrap, lw);
    }

    /* spinning logo */
    const cluster = loader.querySelector(".logo-cluster");
    if (cluster && !cluster.querySelector(".portal-logo")) {
      cluster.innerHTML = `<img class="portal-logo" src="/logo/logo-loading.svg" alt="" />`;
    }

    /* single sticker — bottom centre */
    if (!loader.querySelector(".loader-notes")) {
      const notes = document.createElement("div");
      notes.className = "loader-notes";
      notes.setAttribute("aria-hidden", "true");
      const note = document.createElement("div");
      note.className = `loader-type pp-sticky pp-sticky--c${Math.floor(rand(0, 6))}`;
      note.setAttribute("aria-hidden", "true");
      notes.appendChild(note);
      loader.appendChild(notes);
      startTyping(loader, note);
    }

    /* dismiss on page load */
    window.addEventListener("load", () => {
      setTimeout(() => {
        loader.classList.add("done");
        document.body.style.visibility = "visible";
        document.body.classList.add("portal-ready");
      }, 1800);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
