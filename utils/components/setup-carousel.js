/* ═══════════════════════════════════════════════════════
   SETUP CAROUSEL — shared step-by-step wizard for the setup screens on
   Drills/Puzzles/Geometry. Each page keeps its own state (Sets, category
   variables) and matchmaking wiring; this module only owns the "show one
   step at a time, Back to revisit, auto-advance on single-choice" mechanics
   and a few small option-list renderers built on the existing
   .pp-sticky.sticky-choice look.

   createCarousel(mountEl) — stack-based history (not a fixed-order strip),
   so a branching tree (see Geometry's topic tree) works the same as a
   plain linear sequence (Drills/Puzzles): goTo(id) pushes, back() pops.
═══════════════════════════════════════════════════════ */

let uid = 0;

export function createCarousel(mountEl) {
  mountEl.classList.add('pp-carousel');
  mountEl.innerHTML = '';

  const crumbEl = document.createElement('div');
  crumbEl.className = 'pp-carousel-crumb';
  mountEl.appendChild(crumbEl);

  const stageEl = document.createElement('div');
  stageEl.className = 'pp-carousel-stage';
  mountEl.appendChild(stageEl);

  const backBtn = document.createElement('button');
  backBtn.type = 'button';
  backBtn.className = 'pp-carousel-back';
  backBtn.textContent = '← Back';
  backBtn.hidden = true;
  mountEl.appendChild(backBtn);

  const slides = new Map(); // id -> { el, label }
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
  }

  function addSlide(id, label, buildFn) {
    const el = document.createElement('div');
    el.className = 'pp-carousel-slide';
    stageEl.appendChild(el);
    slides.set(id, { el, label });
    if (buildFn) buildFn(el);
    return el;
  }

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

  return { addSlide, getEl, goTo, start, back, current: () => stack[stack.length - 1] };
}

// Single-select: clicking an option immediately calls onPick(value) — no
// explicit "Next" needed since only one choice makes sense.
export function renderChoiceStep(container, { title, subtitle, name, options, colorOffset = 0, onPick }) {
  container.innerHTML = '';
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
  const wrap = document.createElement('div');
  wrap.className = 'pp-carousel-choices sticky-row';
  const groupName = name || `pp-carousel-choice-${++uid}`;
  options.forEach((opt, i) => {
    const disabled = !!opt.disabled;
    const label = document.createElement('label');
    label.className = `pp-sticky pp-sticky--tape sticky-choice pp-sticky--c${(colorOffset + i) % 6}${disabled ? ' is-disabled' : ''}`;
    label.innerHTML = `<input type="radio" name="${groupName}" value="${opt.value}" ${opt.checked ? 'checked' : ''} ${disabled ? 'disabled' : ''} /><span>${opt.label}${opt.note ? ` <em>(${opt.note})</em>` : ''}</span>`;
    if (!disabled) {
      // A click on the label, not a 'change' listener on the input — a
      // radio that's already checked (e.g. a pre-selected default) fires no
      // 'change' event when clicked again, which would otherwise strand the
      // carousel on a step whose default happens to be the desired answer.
      label.addEventListener('click', () => onPick(opt.value));
    }
    wrap.appendChild(label);
  });
  container.appendChild(wrap);
}

// Multi-select checkboxes. An explicit Next button (when onNext is given)
// since — unlike a single choice — the user may want to tick more than one
// before moving on.
export function renderMultiStep(container, { title, subtitle, options, isChecked, onToggle, colorOffset = 0, grid = false, nextLabel, onNext }) {
  container.innerHTML = '';
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

  if (onNext) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pp-carousel-next-btn';
    btn.textContent = nextLabel || 'Next →';
    btn.addEventListener('click', onNext);
    container.appendChild(btn);
  }
}

export function renderComingSoon(container, { title, message }) {
  container.innerHTML = '';
  if (title) {
    const h = document.createElement('p');
    h.className = 'pp-carousel-title';
    h.textContent = title;
    container.appendChild(h);
  }
  const p = document.createElement('p');
  p.className = 'pp-carousel-comingsoon';
  p.textContent = message || 'Coming soon.';
  container.appendChild(p);
}
