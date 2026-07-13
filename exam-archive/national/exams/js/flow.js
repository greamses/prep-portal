/* ═══════════════════════════════════════════════════════
   EXAM BUILDER — step flow
   Turns the builder's step-cards into the same one-step-at-a-time setup the
   Drills/Puzzles/Geometry pages use: the step you're on shows its chips,
   finished steps collapse to their picks as sticky notes (click to reopen),
   later steps stay hidden, and a Back / Skip note-button pair moves you
   through. Start only appears on the last step.

   Deliberately layered ON TOP of data.js rather than folded into it: data.js
   owns which chips exist, which step is revealed next, and the whole
   Class → Subject → Topic → Paper chain. This file only decides what's on
   screen — so the builder's logic keeps working untouched.
═══════════════════════════════════════════════════════ */

const ARROW_L = `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>`;
const ARROW_R = `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>`;

// The four live steps, in order. (Step 5 is hidden by relabelCbtSteps() — the
// CBT bank's papers are fixed-size, so "number of questions" no longer applies.)
const STEP_SELECTORS = ['.step-card-1', '.step-card-2', '#subject-row', '.step-card-4'];

const beginBtn = document.getElementById('begin-btn');
const shareBtn = document.getElementById('share-btn');
const assignBtn = document.getElementById('assign-btn');

const steps = STEP_SELECTORS
  .map((sel) => document.querySelector(sel))
  .filter(Boolean)
  .map((el) => ({ el }));

let active = 0;

// data.js reveals a step by clearing its inline display; a step it hasn't
// revealed yet must not be reachable.
function isRevealed(step) {
  return step.el.style.display !== 'none';
}

// The picks made inside a step, as they'll be shown on its recap.
function picksIn(step) {
  const chosen = [...step.el.querySelectorAll('.custom-chip.checked')];
  if (chosen.length) {
    return chosen.map((c) => ({
      label: (c.querySelector('span') || {}).textContent || c.textContent.trim(),
    }));
  }
  return [{ label: 'Not set' }];
}

function firstUnfinishedFrom(i) {
  for (let n = i; n < steps.length; n++) if (isRevealed(steps[n])) return n;
  return steps.length - 1;
}

function render() {
  steps.forEach((step, i) => {
    const done = i < active;
    step.el.classList.add('pp-section');
    step.el.classList.toggle('is-active', i === active);
    step.el.classList.toggle('is-done', done);
    // Hide steps you haven't reached — and steps data.js hasn't revealed.
    step.el.classList.toggle('is-pending', i > active || !isRevealed(step));

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
    step.next.hidden = i >= steps.length - 1 || !isRevealed(steps[i + 1]);
    step.nav.hidden = step.back.hidden && step.next.hidden;
  });

  // Start belongs at the end of the flow, not floating under every step.
  const onLast = active === steps.length - 1;
  if (beginBtn) beginBtn.hidden = !onLast;
  if (shareBtn) shareBtn.hidden = !onLast;
  // assign-btn manages its own `hidden` (teachers only) — never force it on.
  if (assignBtn && !onLast) assignBtn.hidden = true;
}

function goTo(i) {
  active = Math.max(0, Math.min(i, steps.length - 1));
  render();
}

function next() {
  const target = firstUnfinishedFrom(active + 1);
  if (target > active) goTo(target);
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

  // Picking a chip advances — same as the game pages, where choosing an option
  // moves you on. data.js's own click handler runs first (it renders the next
  // step's chips), so this waits a tick for that step to actually exist.
  step.el.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-chip')) return;
    if (e.target.closest('.custom-chip').classList.contains('disabled')) return;
    setTimeout(next, 0);
  });
});

// data.js reveals later steps by flipping inline display, which no event fires
// for — watch the cards so the nav's Skip appears the moment the next step
// becomes reachable.
const mo = new MutationObserver(() => render());
steps.forEach((s) => mo.observe(s.el, { attributes: true, attributeFilter: ['style'] }));

// Re-running the builder (switching category) rebuilds the chips and hides the
// later cards — go back to the top so the flow matches.
document.querySelectorAll('.cat-tab').forEach((tab) => {
  tab.addEventListener('click', () => setTimeout(() => goTo(0), 0));
});

render();
