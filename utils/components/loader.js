(function () {
  const loaderId = "loader";

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
        align-items: center;
        justify-content: center;
        visibility: visible;
        opacity: 1;
      }

      #${loaderId}.done {
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.8s;
        pointer-events: none;
      }

      /* One big logo, swirling like a portal — no words, no progress bar. */
      #${loaderId} .loader-word,
      #${loaderId} .loader-bar { display: none !important; }

      #${loaderId} #loader-wrapper { margin: 0; display: flex; }

      /* Outer layer: a one-shot "swirl in" that hands off to the loop. */
      #${loaderId} .logo-cluster {
        display: flex;
        animation: portalIn 1s cubic-bezier(0.16, 1, 0.3, 1) both;
      }

      /* Inner layer: the continuous portal swirl. */
      #${loaderId} .portal-logo {
        width: clamp(150px, 32vw, 260px);
        height: auto;
        transform-origin: 50% 50%;
        animation: portalSwirl 2.4s cubic-bezier(0.45, 0, 0.55, 1) infinite;
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
      }
    `;
  document.head.appendChild(style);

  // 2. ENHANCE HTML CONTENT
  function init() {
    const loader = document.getElementById(loaderId);
    if (!loader) return;

    // A single large logo (references the generated mark so it always matches).
    const cluster = loader.querySelector(".logo-cluster");
    if (cluster) {
      cluster.innerHTML = `<img class="portal-logo" src="/logo/logo-loading.svg" alt="" />`;
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
