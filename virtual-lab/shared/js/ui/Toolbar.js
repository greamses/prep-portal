/**
 * Toolbar — top bar actions (clear, reset, screenshot).
 * Labs call: new Toolbar('.toolbar', actions)
 *
 * actions = [{ id, label, onClick }]
 */
export class Toolbar {
  constructor(selector, actions = []) {
    this._el = document.querySelector(selector);
    this._render(actions);
  }

  _render(actions) {
    const slot = this._el.querySelector('.toolbar-actions');
    if (!slot) return;

    slot.innerHTML = actions.map(a =>
      `<button class="btn" data-action="${a.id}">${a.label}</button>`
    ).join('');

    slot.addEventListener('click', e => {
      const btn = e.target.closest('.btn[data-action]');
      if (!btn) return;
      const action = actions.find(a => a.id === btn.dataset.action);
      action?.onClick?.();
    });
  }
}
