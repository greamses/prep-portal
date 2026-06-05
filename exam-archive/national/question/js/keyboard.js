/* ═══════════════════════════════════════════════════════════
   KEYBOARD CONTROLS for the quiz screen.
     ← / →         previous / next question
     ↑ / ↓         move the highlight up / down through options
     Enter / Space choose the highlighted option
     A–E or 1–5    choose that option directly
     Ctrl/⌘+Enter  submit the paper
   Typing in the theory box (or chat) is never hijacked, except
   the Ctrl/⌘+Enter submit shortcut.
   ═══════════════════════════════════════════════════════════ */
(function () {
  function engine() {
    try {
      if (typeof Quiz !== 'undefined') return Quiz;
    } catch (e) {}
    return window.Quiz || null;
  }

  function onQuizScreen() {
    const quiz = document.getElementById('quiz-screen');
    const results = document.getElementById('results-screen');
    const quizUp = quiz && getComputedStyle(quiz).display !== 'none';
    const resultsUp = results && getComputedStyle(results).display !== 'none';
    return quizUp && !resultsUp;
  }

  function isTyping(el) {
    if (!el) return false;
    return el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.isContentEditable;
  }

  function options() {
    return Array.from(document.querySelectorAll('#q-options .option-btn'));
  }

  function currentIndex() {
    try {
      const s = engine()?.getState?.();
      return s ? s.currentIndex : -1;
    } catch (e) {
      return -1;
    }
  }

  let focusIdx = -1;
  let lastIndex = -1;

  function clearFocus() {
    options().forEach((b) => b.classList.remove('kbd-focus'));
  }

  function applyFocus() {
    const opts = options();
    clearFocus();
    if (focusIdx < 0 || focusIdx >= opts.length) return;
    const el = opts[focusIdx];
    el.classList.add('kbd-focus');
    el.scrollIntoView({ block: 'nearest' });
  }

  // Reset the highlight whenever the question changes.
  function syncQuestion() {
    const ci = currentIndex();
    if (ci !== lastIndex) {
      lastIndex = ci;
      focusIdx = -1;
    }
  }

  function moveFocus(delta) {
    const opts = options();
    if (!opts.length) return;
    if (focusIdx < 0) focusIdx = delta > 0 ? 0 : opts.length - 1;
    else focusIdx = Math.min(opts.length - 1, Math.max(0, focusIdx + delta));
    applyFocus();
  }

  function choose(i) {
    const opts = options();
    if (i >= 0 && i < opts.length && !opts[i].disabled) {
      focusIdx = i;
      applyFocus();
      opts[i].click();
    }
  }

  document.addEventListener('keydown', (e) => {
    // Never interfere with the PrepBot chat panel.
    if (e.target && typeof e.target.closest === 'function' && e.target.closest('#chat-window')) return;
    if (!onQuizScreen()) return;
    const q = engine();
    if (!q) return;

    // Submit shortcut works even while typing a theory answer.
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (typeof q.confirmSubmit === 'function') q.confirmSubmit();
      return;
    }

    // Leave typing (theory box / chat input) alone otherwise.
    if (isTyping(e.target)) return;

    syncQuestion();

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        if (typeof q.navigate === 'function') q.navigate(1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (typeof q.navigate === 'function') q.navigate(-1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        moveFocus(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        moveFocus(-1);
        break;
      case 'Enter':
      case ' ':
        if (focusIdx >= 0) {
          e.preventDefault();
          choose(focusIdx);
        }
        break;
      default: {
        const k = e.key.toLowerCase();
        if (/^[a-e]$/.test(k)) {
          e.preventDefault();
          choose(k.charCodeAt(0) - 97);
        } else if (/^[1-5]$/.test(e.key)) {
          e.preventDefault();
          choose(parseInt(e.key, 10) - 1);
        }
        break;
      }
    }
  });
})();
