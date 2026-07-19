/* ═══════════════════════════════════════════════════════
   ALGEBRA LAB — step flow
   Same one-step-at-a-time setup as the Exam Builder / Drills / Puzzles /
   Geometry pages: the step you're on shows its chips, a finished step
   collapses to its picks as sticky notes (click to reopen), and a Back /
   Skip note-button pair moves you through.

   Deliberately layered ON TOP of ui.js/script.js rather than folded into
   them: those own which chips exist and what gets picked. This file only
   decides what's on screen.
═══════════════════════════════════════════════════════ */

const ARROW_L = `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>`;
const ARROW_R = `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>`;

const STEP_SELECTORS = ['.step-card-1', '.step-card-2'];

const steps = STEP_SELECTORS
  .map((sel) => document.querySelector(sel))
  .filter(Boolean)
  .map((el) => ({ el }));

let active = 0;

// The picks made inside a step, as they'll be shown on its recap.
function picksIn(step) {
  const chosen = [...step.el.querySelectorAll('.custom-chip.checked')];
  if (chosen.length) {
    return chosen.map((c) => ({ label: c.textContent.trim() }));
  }
  return [{ label: 'Not set' }];
}

function render() {
  steps.forEach((step, i) => {
    const done = i < active;
    step.el.classList.add('pp-section');
    step.el.classList.toggle('is-active', i === active);
    step.el.classList.toggle('is-done', done);
    step.el.classList.toggle('is-pending', i > active);

    if (done) {
      step.recap.innerHTML = '';
      picksIn(step).forEach((chip, n) => {
        const note = document.createElement('span');
        note.className = `pp-recap-note pp-sticky pp-sticky--tape pp-sticky--c${n % 6}`;
        note.innerHTML = `<span>${chip.label}</span>`;
        step.recap.appendChild(note);
      });
    }

    // Back is pointless on the first step; Skip is pointless on the last.
    step.back.hidden = i === 0;
    step.next.hidden = i >= steps.length - 1;
    step.nav.hidden = step.back.hidden && step.next.hidden;
  });
}

function goTo(i) {
  active = Math.max(0, Math.min(i, steps.length - 1));
  render();
}

function next() {
  if (active < steps.length - 1) goTo(active + 1);
}

// Build each step's nav row + recap, then wire them.
steps.forEach((step, i) => {
  const nav = document.createElement('div');
  nav.className = 'pp-carousel-nav';

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'pp-sticky pp-sticky--tape pp-note-btn pp-nav-btn pp-nav-btn--back';
  back.innerHTML = `${ARROW_L}<span>Back</span>`;
  back.addEventListener('click', () => goTo(i - 1));

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'pp-sticky pp-sticky--tape pp-note-btn pp-nav-btn pp-nav-btn--next';
  nextBtn.innerHTML = `<span>Skip</span>${ARROW_R}`;
  nextBtn.addEventListener('click', next);

  nav.append(back, nextBtn);
  step.el.appendChild(nav);

  const recap = document.createElement('button');
  recap.type = 'button';
  recap.className = 'pp-section-recap';
  recap.addEventListener('click', () => goTo(i));
  step.el.appendChild(recap);

  Object.assign(step, { nav, back, next: nextBtn, recap });

  // Picking a chip advances — same as the game pages, where choosing an
  // option moves you on. ui.js's own click handler runs first (it renders
  // subtopic chips for step 2), so this waits a tick for that to exist.
  step.el.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-chip')) return;
    if (e.target.closest('.custom-chip').classList.contains('disabled')) return;
    setTimeout(next, 0);
  });
});

render();
