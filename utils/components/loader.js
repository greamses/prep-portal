(function () {
  const loaderId = "loader";
  const accentColor = "#ffe500";

  // 1. INJECT CSS IMMEDIATELY (Prevents Flash)
  const style = document.createElement("style");
  style.textContent = `
  @import url("/utils/components/theme.css");
      #${loaderId} {
        position: fixed !important;
        inset: 0 !important;
        background: #0a0a0a !important;
        z-index: 999999 !important;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        font-family: 'Unbounded', sans-serif;
        visibility: visible;
        opacity: 1;
      }

      #${loaderId}.done { 
        opacity: 0; 
        visibility: hidden; 
        transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.8s;
        pointer-events: none; 
      }

      #loader-wrapper { display: flex; flex-direction: column; align-items: center; margin-bottom: 20px; }
      .logo-cluster { display: flex; gap: 12px; }
      
      .pulse-logo { width: 32px; height: auto; opacity: 0; animation: logoWave 1.6s infinite; }
      .pulse-logo:nth-child(2) { animation-delay: 0.15s; }
      .pulse-logo:nth-child(3) { animation-delay: 0.3s; }

      @keyframes logoWave {
        0%, 100% { transform: scale(0.92); opacity: 0.2; filter: grayscale(100%) brightness(0.4); }
        50% { transform: scale(1.05); opacity: 1; filter: grayscale(0%) brightness(1.1); }
      }

      .loader-word { overflow: hidden; height: clamp(30px, 6vw, 60px); line-height: 1.1; }
      .loader-word span {
        display: block; font-weight: 900; font-size: clamp(28px, 6vw, 56px);
        color: #ffffff; text-transform: uppercase; letter-spacing: -0.01em;
        transform: translateY(110%); animation: loaderWordIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }

      /* Highlight last word with your color */
      .loader-word:last-of-type span { color: ${accentColor}; }

      @keyframes loaderWordIn { to { transform: translateY(0); } }

      .loader-bar {
        width: 0px; height: 2px; background: ${accentColor};
        margin-top: 20px; animation: lb 1.5s cubic-bezier(0.16, 1, 0.3, 1) 0.6s forwards;
      }
      @keyframes lb { to { width: 140px; } }
    `;
  document.head.appendChild(style);

  // 2. ENHANCE HTML CONTENT
  function init() {
    const loader = document.getElementById(loaderId);
    if (!loader) return;

    // Inject Triple logos (references the generated mark so it always matches).
    const cluster = loader.querySelector(".logo-cluster");
    if (cluster) {
      const img = `<img class="pulse-logo" src="/logo/logo-loading.svg" alt="" />`;
      cluster.innerHTML = img + img + img;
    }

    // Stagger word entry
    const words = loader.querySelectorAll(".loader-word span");
    words.forEach((span, i) => {
      span.style.animationDelay = `${0.4 + i * 0.15}s`;
    });

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
