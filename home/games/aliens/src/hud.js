// hud.js — score cards, target panel, current-angle readout, message, loader
export function setupHUD() {
  const el = (id) => document.getElementById(id);
  const scoreEl = el('score'), shotsEl = el('shots'), accEl = el('accuracy');
  const msgEl = el('message');
  const curEl = el('current-angle'), curWrap = el('current-wrap');
  let msgTimer = null;

  return {
    updateStats(st) {
      if (scoreEl) scoreEl.textContent = String(st.score);
      if (shotsEl) shotsEl.textContent = `${st.made} / ${st.attempts}`;
      if (accEl) accEl.textContent = (st.attempts ? Math.round((st.made / st.attempts) * 100) : 0) + '%';
    },
    setCurrent(deg) {
      if (!curWrap) return;
      if (deg == null) { curWrap.classList.remove('show'); return; }
      curWrap.classList.add('show');
      if (curEl) curEl.textContent = `${Math.round(deg)}°`;
    },
    message(text, cls = '', dur = 1500) {
      if (!msgEl) return;
      msgEl.textContent = text;
      msgEl.className = 'message show ' + cls;
      clearTimeout(msgTimer);
      msgTimer = setTimeout(() => msgEl.classList.remove('show'), dur);
    },
    hideLoader() {
      const loader = el('loader');
      if (!loader) return;
      const bar = el('loader-bar'), status = el('loader-status');
      if (bar) bar.style.cssText = 'animation:none;width:100%;transition:width 0.25s ease';
      if (status) { status.textContent = 'TARGETING ONLINE'; status.style.color = 'var(--accent-success, #8ace8a)'; }
      setTimeout(() => {
        loader.classList.add('fade-out');
        loader.addEventListener('transitionend', () => loader.remove(), { once: true });
      }, 320);
    },
  };
}
