/**
 * Glassware economy. Each broken glass costs money, and there's a hard cap on
 * how many you may break in a session — once the budget is spent, glassware
 * stops shattering (it just lands), nudging the player to handle it carefully.
 *
 * Self-contained: injects its own HUD + toast styles so no markup is needed.
 */
export class Economy {
  constructor({ max = 3, cost = 5, currency = '$' } = {}) {
    this.max = max;
    this.cost = cost;
    this.currency = currency;
    this.broken = 0;
    this._inject();
    this._render();
  }

  get depleted() { return this.broken >= this.max; }

  /** Ask whether a glass may break. Returns true and bills it, or false if out. */
  tryBreak() {
    if (this.depleted) {
      this._toast('No budget left — handle the glassware carefully!', true);
      return false;
    }
    this.broken++;
    const left = this.max - this.broken;
    this._toast(`Smashed! −${this.currency}${this.cost} · ${left} replacement${left === 1 ? '' : 's'} left`, left === 0);
    this._render();
    return true;
  }

  // ── HUD ──────────────────────────────────────────────────────────────────────
  _inject() {
    if (!document.getElementById('econ-style')) {
      const s = document.createElement('style');
      s.id = 'econ-style';
      s.textContent = `
        #econ-hud{position:fixed;top:16px;right:18px;z-index:25;display:flex;align-items:center;
          gap:.55rem;padding:.45rem .7rem;border-radius:14px;background:rgba(0,0,0,.45);
          border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(6px);
          font-family:'JetBrains Mono',monospace;color:rgba(255,255,255,.82);font-size:.72rem;}
        #econ-hud .econ-ico{font-size:.95rem;line-height:1;}
        #econ-hud .econ-pips{display:flex;gap:4px;}
        #econ-hud .pip{width:9px;height:9px;border-radius:50%;background:#5fcf7a;
          box-shadow:0 0 6px #5fcf7a80;transition:background .2s,box-shadow .2s;}
        #econ-hud .pip.broken{background:rgba(255,255,255,.18);box-shadow:none;}
        #econ-hud .econ-spent{opacity:.7;font-size:.66rem;}
        #econ-toast{position:fixed;top:58px;right:18px;z-index:25;padding:.5rem .85rem;border-radius:12px;
          background:rgba(20,28,38,.9);border:1px solid rgba(255,255,255,.16);backdrop-filter:blur(6px);
          font-family:'JetBrains Mono',monospace;font-size:.72rem;color:#fff;opacity:0;transform:translateY(-6px);
          transition:opacity .2s,transform .2s;pointer-events:none;white-space:nowrap;}
        #econ-toast.show{opacity:1;transform:translateY(0);}
        #econ-toast.warn{border-color:#f4a35d;color:#ffd9b3;}
        @media (hover:none) and (pointer:coarse){#econ-hud{top:12px;right:12px;}}
      `;
      document.head.appendChild(s);
    }

    this._hud = document.createElement('div');
    this._hud.id = 'econ-hud';
    document.body.appendChild(this._hud);

    this._toastEl = document.createElement('div');
    this._toastEl.id = 'econ-toast';
    document.body.appendChild(this._toastEl);
  }

  _render() {
    const left = this.max - this.broken;
    let pips = '';
    for (let i = 0; i < this.max; i++) pips += `<span class="pip ${i < left ? '' : 'broken'}"></span>`;
    this._hud.innerHTML =
      `<span class="econ-ico">🧪</span>` +
      `<span class="econ-pips">${pips}</span>` +
      `<span class="econ-spent">${this.currency}${this.broken * this.cost}</span>`;
  }

  _toast(msg, warn) {
    const t = this._toastEl;
    t.textContent = msg;
    t.classList.toggle('warn', !!warn);
    t.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }
}
