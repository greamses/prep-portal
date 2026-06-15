/**
 * Sidebar — equipment picker panel.
 * Labs call: new Sidebar('.sidebar', equipmentList).onPick(fn)
 *
 * equipmentList = [{ id, label, icon }]
 */
export class Sidebar {
  constructor(selector, items = []) {
    this._el       = document.querySelector(selector);
    this._items    = items;
    this._cb       = null;
    this._active   = null;
    this._render();
  }

  onPick(fn) { this._cb = fn; return this; }

  _render() {
    const grid = this._el.querySelector('.equipment-grid');
    if (!grid) return;

    grid.innerHTML = this._items.map(item => `
      <button class="equip-btn" data-id="${item.id}">
        <span class="equip-icon">${item.icon}</span>
        <span>${item.label}</span>
      </button>
    `).join('');

    grid.addEventListener('click', e => {
      const btn = e.target.closest('.equip-btn');
      if (!btn) return;
      this._setActive(btn.dataset.id);
      this._cb?.(btn.dataset.id);
    });
  }

  _setActive(id) {
    this._active = id;
    this._el.querySelectorAll('.equip-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.id === id);
    });
  }

  setActive(id) { this._setActive(id); }
}
