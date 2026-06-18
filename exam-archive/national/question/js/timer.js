/* ═══════════════════════════════════════════════════════════
   EXAM TIMER — optional countdown with auto-submit.
   Enabled from the main exam page (?timer=on). When on, it
   starts once questions load, shows on the timer sticky note,
   and auto-submits the paper via the global Quiz engine at 0.
   Duration ≈ 1 minute per question (minimum 1 minute).
   ═══════════════════════════════════════════════════════════ */
(function () {
  const disp = document.getElementById('timer-display');
  if (!disp) return;

  const enabled =
    window.__timerEnabled === true ||
    (new URLSearchParams(location.search).get('timer') || '').toLowerCase() === 'on';

  // Timer off → hide the timer sticky note entirely.
  if (!enabled) {
    disp.style.display = 'none';
    return;
  }

  let remaining = 0;
  let intervalId = null;

  // Quiz is a top-level const in quiz-engine.js; reach it safely.
  function engine() {
    try {
      if (typeof Quiz !== 'undefined') return Quiz;
    } catch (e) {}
    return window.Quiz || null;
  }

  function getCount() {
    try {
      return (engine()?.getState?.().allQuestions || []).length;
    } catch (e) {
      return 0;
    }
  }

  function format(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  function isFinished() {
    let submitted = false;
    try {
      submitted = !!engine()?.getState?.().submitted;
    } catch (e) {}
    const results = document.getElementById('results-screen');
    const resultsUp = results && getComputedStyle(results).display !== 'none';
    return submitted || resultsUp;
  }

  function stop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function render() {
    disp.textContent = format(remaining);
    disp.classList.toggle('low', remaining <= 60);
  }

  function tick() {
    if (isFinished()) {
      stop();
      return;
    }
    remaining -= 1;
    if (remaining <= 0) {
      remaining = 0;
      render();
      stop();
      const q = engine();
      if (q && typeof q.submit === 'function') q.submit();
      return;
    }
    render();
  }

  function start() {
    stop();
    remaining = (window.__compTimeLimit > 0)
      ? window.__compTimeLimit
      : Math.max(60, (getCount() || 20) * 60);
    render();
    intervalId = setInterval(tick, 1000);
  }

  // Wait for the questions to load, then begin counting down.
  disp.textContent = '--:--';
  let waited = 0;
  const waiter = setInterval(() => {
    if (getCount() > 0) {
      clearInterval(waiter);
      start();
    } else if ((waited += 250) > 30000) {
      clearInterval(waiter);
      start();
    }
  }, 250);
})();
