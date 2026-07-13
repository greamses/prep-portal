/* ═══════════════════════════════════════════════════════
   SETUP CAROUSEL — shared step-by-step wizard for the setup screens on
   Drills/Puzzles/Geometry. Each page keeps its own state and matchmaking
   wiring; this module owns "show one step at a time" and the navigation.

   Navigation lives on the CAROUSEL, not inside each slide: a nav row under
   the stage carries a Back arrow (hidden on the first step) and a Skip/Next
   arrow (accepts whatever is currently selected and moves on). Slides
   register their forward action with setAction() — the render helpers below
   do that for you.
═══════════════════════════════════════════════════════ */

let uid = 0;

const ARROW_L = `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>`;
const ARROW_R = `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>`;

export function createCarousel(mountEl) {
  mountEl.classList.add('pp-carousel');
  mountEl.innerHTML = '';

  const crumbEl = document.createElement('div');
  crumbEl.className = 'pp-carousel-crumb';
  mountEl.appendChild(crumbEl);

  const stageEl = document.createElement('div');
  stageEl.className = 'pp-carousel-stage';
  mountEl.appendChild(stageEl);

  const navEl = document.createElement('div');
  navEl.className = 'pp-carousel-nav';
  mountEl.appendChild(navEl);

  const backBtn = document.createElement('button');
  backBtn.type = 'button';
  backBtn.className = 'pp-nav-btn pp-nav-btn--back pp-sticky pp-sticky--tape';
  backBtn.innerHTML = `${ARROW_L}<span>Back</span>`;
  navEl.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'pp-nav-btn pp-nav-btn--next pp-sticky pp-sticky--tape';
  navEl.appendChild(nextBtn);

  const slides = new Map(); // id -> { el, label }
  const actions = new Map(); // id -> { label, onNext }
  const stack = [];

  function render(direction) {
    const currentId = stack[stack.length - 1];
    slides.forEach((s, id) => {
      const active = id === currentId;
      s.el.classList.toggle('is-active', active);
      if (active) {
        s.el.classList.remove('pp-carousel-slide--in-r', 'pp-carousel-slide--in-l');
        void s.el.offsetWidth; // restart the CSS animation
        s.el.classList.add(direction === 'back' ? 'pp-carousel-slide--in-l' : 'pp-carousel-slide--in-r');
      }
    });

    crumbEl.innerHTML = stack
      .map((id, i) => {
        const label = (slides.get(id) || {}).label || '';
        return i === stack.length - 1 ? `<span class="pp-carousel-crumb-cur">${label}</span>` : `<span>${label}</span>`;
      })
      .join(' <span class="pp-carousel-crumb-sep">/</span> ');

    backBtn.hidden = stack.length <= 1;

    const action = actions.get(currentId);
    nextBtn.hidden = !action;
    if (action) nextBtn.innerHTML = `<span>${action.label || 'Next'}</span>${ARROW_R}`;
    navEl.hidden = backBtn.hidden && nextBtn.hidden;
  }

  function addSlide(id, label, buildFn) {
    const el = document.createElement('div');
    el.className = 'pp-carousel-slide';
    stageEl.appendChild(el);
    slides.set(id, { el, label });
    if (buildFn) buildFn(el);
    return el;
  }

  // The forward action for a slide. The nav's Skip/Next arrow runs it, which
  // is how "keep what's selected and move on" works without touching an option.
  function setAction(id, action) {
    if (action) actions.set(id, action);
    else actions.delete(id);
    if (stack[stack.length - 1] === id) render('fwd');
  }

  nextBtn.addEventListener('click', () => {
    const action = actions.get(stack[stack.length - 1]);
    if (action && action.onNext) action.onNext();
  });

  function getEl(id) {
    const s = slides.get(id);
    return s ? s.el : null;
  }

  function goTo(id) {
    if (!slides.has(id) || id === stack[stack.length - 1]) return;
    stack.push(id);
    render('fwd');
  }

  function start(id) {
    stack.length = 0;
    stack.push(id);
    render('fwd');
  }

  function back() {
    if (stack.length <= 1) return;
    stack.pop();
    render('back');
  }
  backBtn.addEventListener('click', back);

  return { addSlide, setAction, getEl, goTo, start, back, current: () => stack[stack.length - 1] };
}

/* Single-select. Picking an option advances immediately; the nav's Skip arrow
   advances with whatever is already selected. */
export function renderChoiceStep(carousel, id, { title, subtitle, name, options, colorOffset = 0, onPick, skipLabel }) {
  const container = carousel.getEl(id);
  container.innerHTML = '';
  addHeading(container, title, subtitle);

  const wrap = document.createElement('div');
  wrap.className = 'pp-carousel-choices sticky-row';
  const groupName = name || `pp-carousel-choice-${++uid}`;

  options.forEach((opt, i) => {
    const disabled = !!opt.disabled;
    const label = document.createElement('label');
    label.className = `pp-sticky pp-sticky--tape sticky-choice pp-sticky--c${(colorOffset + i) % 6}${disabled ? ' is-disabled' : ''}`;
    label.innerHTML = `<input type="radio" name="${groupName}" value="${opt.value}" ${opt.checked ? 'checked' : ''} ${disabled ? 'disabled' : ''} /><span>${opt.label}${opt.note ? ` <em>(${opt.note})</em>` : ''}</span>`;
    if (!disabled) {
      // 'click' on the INPUT — deliberately not 'change' (never fires for an
      // already-checked radio, so a pre-selected default would strand you), and
      // deliberately not on the label (clicking a label ALSO forwards a click to
      // its control, which bubbles back through the label — firing twice).
      label.querySelector('input').addEventListener('click', () => onPick(opt.value));
    }
    wrap.appendChild(label);
  });
  container.appendChild(wrap);

  // Skip = accept the current selection and move on.
  carousel.setAction(id, {
    label: skipLabel || 'Skip',
    onNext: () => {
      const checked = wrap.querySelector('input:checked');
      onPick(checked ? checked.value : options.find((o) => !o.disabled).value);
    },
  });
}

/* Multi-select. There's nothing to auto-advance on, so the nav arrow is the
   only way forward — it doubles as the Skip (keep the ticked defaults). */
export function renderMultiStep(carousel, id, { title, subtitle, options, isChecked, onToggle, colorOffset = 0, grid = false, nextLabel, onNext }) {
  const container = carousel.getEl(id);
  container.innerHTML = '';
  addHeading(container, title, subtitle);

  const wrap = document.createElement('div');
  wrap.className = `pp-carousel-choices ${grid ? 'sticky-grid' : 'sticky-row'}`;
  options.forEach((opt, i) => {
    const disabled = !!opt.disabled;
    const label = document.createElement('label');
    label.className = `pp-sticky pp-sticky--tape sticky-choice pp-sticky--c${(colorOffset + i) % 6}${disabled ? ' is-disabled' : ''}`;
    label.innerHTML = `<input type="checkbox" value="${opt.value}" ${!disabled && isChecked(opt.value) ? 'checked' : ''} ${disabled ? 'disabled' : ''} /><span>${opt.label}${opt.note ? ` <em>(${opt.note})</em>` : ''}</span>`;
    if (!disabled) {
      label.querySelector('input').addEventListener('change', (e) => onToggle(opt.value, e.target.checked));
    }
    wrap.appendChild(label);
  });
  container.appendChild(wrap);

  carousel.setAction(id, onNext ? { label: nextLabel || 'Next', onNext } : null);
}

/* A slide holding arbitrary DOM (the name field, the avatar grid…). */
export function renderCustomStep(carousel, id, { title, subtitle, content, nextLabel, onNext }) {
  const container = carousel.getEl(id);
  container.innerHTML = '';
  addHeading(container, title, subtitle);
  container.appendChild(content);
  carousel.setAction(id, onNext ? { label: nextLabel || 'Next', onNext } : null);
}

export function renderComingSoon(carousel, id, { title, message }) {
  const container = carousel.getEl(id);
  container.innerHTML = '';
  if (title) addHeading(container, title);
  const p = document.createElement('p');
  p.className = 'pp-carousel-comingsoon';
  p.textContent = message || 'Coming soon.';
  container.appendChild(p);
  carousel.setAction(id, null);
}

function addHeading(container, title, subtitle) {
  if (title) {
    const h = document.createElement('p');
    h.className = 'pp-carousel-title';
    h.textContent = title;
    container.appendChild(h);
  }
  if (subtitle) {
    const p = document.createElement('p');
    p.className = 'pp-carousel-subtitle';
    p.textContent = subtitle;
    container.appendChild(p);
  }
}

/* ── SECTION FLOW ────────────────────────────────────────────────────────
   Keeps the setup to ONE selector on screen. Each section still owns its own
   carousel; this only decides which one is showing. A finished section
   collapses to its picks rendered as sticky notes (click to reopen).

   `sections` is [{ el, chips: () => [{ label, avatar? }] }] in order.
   `onChange(activeIndex, isLast)` fires on every move — used to keep the
   Start button hidden until the final step. ─────────────────────────────── */
export function createSectionFlow(sections, { onChange } = {}) {
  let active = 0;

  sections.forEach((s, i) => {
    s.el.classList.add('pp-section');
    const recap = document.createElement('button');
    recap.type = 'button';
    recap.className = 'pp-section-recap';
    recap.addEventListener('click', () => { active = i; render(); });
    s.el.appendChild(recap);
    s.recapEl = recap;
  });

  function render() {
    sections.forEach((s, i) => {
      const done = i < active;
      s.el.classList.toggle('is-active', i === active);
      s.el.classList.toggle('is-done', done);
      s.el.classList.toggle('is-pending', i > active);
      if (!done) return;

      s.recapEl.innerHTML = '';
      (s.chips() || []).forEach((chip, n) => {
        const note = document.createElement('span');
        note.className = `pp-recap-note pp-sticky pp-sticky--tape pp-sticky--c${n % 6}`;
        note.innerHTML = chip.avatar
          ? `<img src="${chip.avatar}" alt="" /><span>${chip.label}</span>`
          : `<span>${chip.label}</span>`;
        s.recapEl.appendChild(note);
      });
    });
    if (onChange) onChange(active, active === sections.length - 1);
  }

  render();

  return {
    next() { if (active < sections.length - 1) { active += 1; render(); } },
    goTo(i) { active = Math.max(0, Math.min(i, sections.length - 1)); render(); },
    refresh: render,
    isLast: () => active === sections.length - 1,
  };
}
