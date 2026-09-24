// ══════════════════════════════════════════════
//  extension-registry.js
//  Core extension system — generic and reusable.
//  Extensions register themselves separately.
// ══════════════════════════════════════════════

window.ExtensionRegistry = {
  
  extensions: {}, // id → definition
  activeExtensions: new Set(),
  exprGenerators: {}, // blockType → fn(block) → string
  stmtGenerators: {}, // blockType → fn(block, indent) → string
  
  _generatorsInit: {}, // id → bool (prevent double init)
  _refreshLangFn: null, // (lang) => void
  
  // ──────────────────────────────────────────
  //  Public API
  // ──────────────────────────────────────────
  
  /**
   * Register an extension.
   * @param {string} id
   * @param {object} def
   * { name, description, version, targetLanguages, color, shadow, iconSvg,
   * scripts, categories, init }
   */
  register(id, def) {
    this.extensions[id] = { id, ...def };
  },
  
  /**
   * Register code generators contributed by an extension.
   */
  registerGenerators(exprMap, stmtMap) {
    Object.assign(this.exprGenerators, exprMap || {});
    Object.assign(this.stmtGenerators, stmtMap || {});
  },
  
  resolveExpr(block) {
    const gen = this.exprGenerators[block.type];
    return gen ? gen(block) : null;
  },
  
  resolveStmt(block, indent) {
    const gen = this.stmtGenerators[block.type];
    return gen ? gen(block, indent) : null;
  },
  
  setRefreshCallback(fn) {
    this._refreshLangFn = fn;
  },
  
  activate(id) {
    const ext = this.extensions[id];
    if (!ext || this.activeExtensions.has(id)) return;
    
    // Run extension init once (registers generators)
    if (!this._generatorsInit[id] && typeof ext.init === 'function') {
      ext.init();
      this._generatorsInit[id] = true;
    }
    
    // Load external scripts (e.g. Phaser CDN)
    if (ext.scripts) {
      ext.scripts.forEach(src => {
        if (!document.querySelector(`script[src="${src}"]`)) {
          const s = document.createElement('script');
          s.src = src;
          document.head.appendChild(s);
        }
      });
    }
    
    this.activeExtensions.add(id);
    
    if (this._refreshLangFn && ext.targetLanguages) {
      ext.targetLanguages.forEach(lang => this._refreshLangFn(lang));
    }
    this._refreshModal();
  },
  
  deactivate(id) {
    const ext = this.extensions[id];
    if (!ext || !this.activeExtensions.has(id)) return;
    
    this.activeExtensions.delete(id);
    
    if (this._refreshLangFn && ext.targetLanguages) {
      ext.targetLanguages.forEach(lang => this._refreshLangFn(lang));
    }
    this._refreshModal();
  },
  
  // ── Querying ──────────────────────────
  
  getAllExtensions() {
    return Object.values(this.extensions).map(ext => ({
      ...ext,
      active: this.activeExtensions.has(ext.id)
    }));
  },
  
  getActiveExtensions(lang) {
    return Object.values(this.extensions).filter(ext =>
      this.activeExtensions.has(ext.id) && (!lang || (ext.targetLanguages && ext.targetLanguages.includes(lang)))
    );
  },
  
  isActive(id) {
    return this.activeExtensions.has(id);
  },
  
  // ── Modal UI ─────────────────────────
  
  showModal() {
    let modal = document.getElementById('weblock-ext-modal');
    if (!modal) this._createModal();
    modal = document.getElementById('weblock-ext-modal');
    this._refreshModal();
    modal.classList.remove('hidden');
  },
  
  hideModal() {
    document.getElementById('weblock-ext-modal')?.classList.add('hidden');
  },
  
  /** Inject the ＋ button into the language toggler */
  _injectButton() {
    if (document.getElementById('btn-extensions')) return;
    const toggler = document.querySelector('.lang-toggler');
    if (!toggler) return;
    
    const btn = document.createElement('button');
    btn.id = 'btn-extensions';
    btn.className = 'hidden'; // shown only in JS mode by setLangMode
    btn.innerHTML = `<svg viewBox="0 0 22 22" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
  <line x1="12" y1="2" x2="12" y2="22"/>
  <line x1="2" y1="12" x2="22" y2="12"/>
  <circle cx="12" cy="12" r="3" fill="currentColor"/>
</svg>`;
    btn.title = 'Extensions';
    btn.addEventListener('click', () => this.showModal());
    toggler.appendChild(btn);
  },
  
  // ── Internal: Modal creation ─────────
  
  _createModal() {
    const old = document.getElementById('weblock-ext-modal');
    if (old) old.remove();
    
    const pluginSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/></svg>`;
    const closeSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    
    const modal = document.createElement('div');
    modal.id = 'weblock-ext-modal';
    modal.className = 'weblock-ext-modal-overlay hidden';
    modal.innerHTML = `
      <div class="weblock-ext-modal-box">
        <div class="weblock-ext-modal-header">
          <h2>${pluginSvg} Choose an Extension</h2>
          <button class="weblock-ext-close-icon" id="close-ext-modal" aria-label="Close">
            ${closeSvg}
          </button>
        </div>
        <div class="weblock-ext-list" id="weblock-ext-list-content"></div>
      </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('close-ext-modal').onclick = () => this.hideModal();
    
    // Close modal on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hideModal();
      }
    });
  },
  
  _refreshModal() {
    const container = document.getElementById('weblock-ext-list-content');
    if (!container) return;
    
    const allExtensions = this.getAllExtensions();
    const bannerColors = ['#4C97FF', '#9966FF', '#0FBD8C', '#FFAB19', '#FF6680'];
    
    // SVGs for interface
    const gamepadSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"></rect><path d="M6 12h4"></path><path d="M8 10v4"></path><circle cx="15.5" cy="13.5" r="1"></circle><circle cx="18.5" cy="10.5" r="1"></circle></svg>`;
    const boxSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`;
    const wifiSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>`;
    const addSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
    const trashSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
    
    container.innerHTML = allExtensions.map((ext, idx) => {
      const bgColor = bannerColors[idx % bannerColors.length];
      const mainIcon = ext.id.includes('phaser') ? gamepadSvg : boxSvg;
      const isActive = this.isActive(ext.id);
      
      return `
        <div class="weblock-ext-item">
          <div class="weblock-ext-banner" style="background: ${bgColor};">
            <div class="weblock-ext-banner-bg">${mainIcon}</div>
            <div class="weblock-ext-overlap-icon">${mainIcon}</div>
          </div>
          
          <div class="weblock-ext-content">
            <strong>${ext.name}</strong>
            <p>${ext.description}</p>
            
            <div class="weblock-ext-footer">
              <div>
                <div class="ext-info-label">Requires</div>
                <div class="ext-req-icons" title="Requires Internet Connection">${wifiSvg}</div>
              </div>
              <div style="text-align: right;">
                <div class="ext-info-label">Collaboration with</div>
                <div class="ext-collab-name">${ext.author || 'WebBlock Core'}</div>
              </div>
            </div>
  
            <button class="weblock-ext-toggle ${isActive ? 'weblock-ext-active' : ''}" data-id="${ext.id}">
              ${isActive ? `${trashSvg} Remove` : `${addSvg} Add Extension`}
            </button>
          </div>
        </div>`;
    }).join('');
    
    // Attach events
    container.querySelectorAll('.weblock-ext-toggle').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        if (this.isActive(id)) {
          this.deactivate(id);
          showToast(`Removed ${this.extensions[id].name}`);
        } else {
          this.activate(id);
          showToast(`Added ${this.extensions[id].name}`);
        }
        this._refreshModal();
      };
    });
  }
};

// Simple toast wrapper (global)
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }
}