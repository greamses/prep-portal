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
    /^(on|1|true)$/i.test(new URLSearchParams(location.search).get('timer') || '');

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

  /* ON: the sticky note shows, and once the questions are in the countdown starts.
     OFF: it is hidden and stops. The Timed Exam switch in the exam settings can
     turn it on (or off) DURING the paper — it used to be read only once, at load,
     so switching it on mid-paper did nothing. */
  let waiter = null;
  function turnOn() {
    disp.style.display = '';
    if (intervalId || waiter) return;
    disp.textContent = '--:--';
    let waited = 0;
    waiter = setInterval(() => {
      if (getCount() > 0 || (waited += 250) > 30000) {
        clearInterval(waiter);
        waiter = null;
        if (!isFinished()) start();
      }
    }, 250);
  }
  function turnOff() {
    if (waiter) { clearInterval(waiter); waiter = null; }
    stop();
    disp.style.display = 'none';
  }

  if (enabled) turnOn(); else turnOff();
  window.addEventListener('exam-settings', (e) => {
    if (e.detail?.timed) turnOn(); else turnOff();
  });
})();
