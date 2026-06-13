/**
 * modules/ui.js
 * Shared UI utilities: alert modal, status bar, two-level topic chips,
 * custom dropdown, method selector.
 */

// ─── Alert Modal ─────────────────────────────────────────────

const MODAL_META = {
    info: { icon: 'ℹ', title: 'Note' },
    warn: { icon: '⚠', title: 'Heads up' },
    error: { icon: '✕', title: 'Error' },
    success: { icon: '✓', title: 'Correct!' },
};

function ensureAlertModal() {
    if (document.getElementById('pp-modal-overlay')) return;
    document.body.insertAdjacentHTML('beforeend', `
<div id="pp-modal-overlay" class="pp-modal-overlay" role="dialog" aria-modal="true"
     aria-labelledby="pp-modal-title" style="display:none">
    <div class="pp-modal-box" id="pp-modal-box">
        <div class="pp-modal-hd">
            <span id="pp-modal-icon" class="pp-modal-icon" aria-hidden="true"></span>
            <strong id="pp-modal-title" class="pp-modal-title"></strong>
        </div>
        <p id="pp-modal-body" class="pp-modal-body"></p>
        <div class="pp-modal-ftr">
            <button id="pp-modal-ok" class="btn btn-yellow pp-modal-ok-btn">OK</button>
        </div>
    </div>
</div>
<style>
.pp-modal-overlay{position:fixed;inset:0;z-index:9999;background:rgba(42,39,35,.38);display:flex;align-items:center;justify-content:center;padding:16px;}
.pp-modal-box{background:var(--surface-primary,#fff);border:1.5px solid color-mix(in srgb,var(--ink,#2a2723) 12%,transparent);border-radius:20px;box-shadow:0 16px 48px rgba(42,39,35,.18);max-width:420px;width:100%;padding:0;font-family:var(--font-mono,'JetBrains Mono',monospace);overflow:hidden;}
.pp-modal-hd{display:flex;align-items:center;gap:10px;background:var(--surface-secondary,#f4f0e8);padding:14px 20px;border-bottom:1.5px solid color-mix(in srgb,var(--ink,#2a2723) 10%,transparent);}
.pp-modal-icon{font-size:18px;line-height:1;flex-shrink:0;}
.pp-modal-title{font-family:var(--font-display,'Unbounded',sans-serif);font-size:11px;font-weight:900;letter-spacing:.05em;text-transform:uppercase;color:var(--ink,#2a2723);}
.pp-modal-body{font-size:13px;line-height:1.65;color:var(--ink,#2a2723);margin:0;padding:18px 20px 16px;word-break:break-word;}
.pp-modal-ftr{display:flex;justify-content:flex-end;padding:0 20px 18px;}
.pp-modal-ok-btn{font-family:var(--font-display,'Unbounded',sans-serif);font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:9px 22px;cursor:pointer;background:var(--accent-primary,#f4c95d);border:1.5px solid color-mix(in srgb,var(--ink,#2a2723) 12%,transparent);border-radius:999px;color:var(--ink,#2a2723);transition:transform .15s,box-shadow .15s;box-shadow:0 2px 6px rgba(42,39,35,.1);}
.pp-modal-ok-btn:hover{transform:translateY(-2px);box-shadow:0 5px 14px rgba(42,39,35,.14);}
.pp-modal-box.type-warn  .pp-modal-hd{border-bottom-color:color-mix(in srgb,var(--accent-primary,#f4c95d) 60%,transparent);}
.pp-modal-box.type-error .pp-modal-hd{border-bottom-color:color-mix(in srgb,var(--accent-danger,#f07a7a) 60%,transparent);}
.pp-modal-box.type-error .pp-modal-ok-btn{background:var(--accent-danger,#f07a7a);color:#fff;}
.pp-modal-box.type-success .pp-modal-hd{border-bottom-color:color-mix(in srgb,var(--accent-success,#7fc8a9) 60%,transparent);}
.pp-modal-box.type-success .pp-modal-ok-btn{background:var(--accent-success,#7fc8a9);color:var(--ink,#2a2723);}
</style>`);
    document.getElementById('pp-modal-ok').addEventListener('click', closeAlertModal);
    document.getElementById('pp-modal-overlay').addEventListener('click', e => {
        if (e.target === document.getElementById('pp-modal-overlay')) closeAlertModal();
    });
}

function closeAlertModal() {
    const el = document.getElementById('pp-modal-overlay');
    if (el) el.style.display = 'none';
}

export function ppAlert(message, type = 'info') {
    ensureAlertModal();
    const meta = MODAL_META[type] || MODAL_META.info;
    document.getElementById('pp-modal-box').className = `pp-modal-box type-${type}`;
    document.getElementById('pp-modal-icon').textContent = meta.icon;
    document.getElementById('pp-modal-title').textContent = meta.title;
    document.getElementById('pp-modal-body').textContent = message;
    document.getElementById('pp-modal-overlay').style.display = 'flex';
    document.getElementById('pp-modal-ok').focus();
}

// ─── Status Bar ───────────────────────────────────────────────

export function showStatus(msg, type = 'info') {
    const bar = document.getElementById('status-bar');
    if (!bar) return;
    bar.textContent = msg;
    bar.className = `status-bar status-${type} visible`;
    clearTimeout(bar._timer);
    bar._timer = setTimeout(() => bar.classList.remove('visible'), 6000);
}

// ─── Two-level Topic Chips ────────────────────────────────────
/**
 * Render topic group chips for a class, then when one is selected
 * expand its subtopics. Calls onSelect({ type, topic, subtopic }).
 *
 * @param {string}   classId   - e.g. 'jss1'
 * @param {object}   topicsMap - TOPICS_BY_CLASS
 * @param {Function} onSelect  - called with { type, topic, subtopic }
 */
export function renderTopicChips(classId, topicsMap, onSelect) {
    const container = document.getElementById('topic-container');
    if (!container) return;
    
    const groups = topicsMap[classId];
    if (!groups || groups.length === 0) {
        container.innerHTML = `<div class="topic-placeholder">No topics for this class yet.</div>`;
        return;
    }
    
    const TYPE_ACCENTS = {
        equation:   'var(--accent-secondary, #6fb7e8)',
        expression: 'var(--accent-primary,   #f4c95d)',
        inequality: 'var(--accent-danger,    #f07a7a)',
    };
    
    // Build level-1 group chips - unified text color, colored accents only
    container.innerHTML = `
        <div class="topic-group-chips" id="topic-group-chips">
            ${groups.map((g, i) => `
                <button class="topic-chip topic-group-chip" data-group-index="${i}"
                        title="${g.type}"
                        data-type="${g.type}">
                    <span class="topic-type-dot" style="background:${TYPE_ACCENTS[g.type]}"></span>
                    <span class="topic-type-text">${g.topic}</span>
                </button>
            `).join('')}
        </div>
        <div id="subtopic-container" class="subtopic-container" style="display:none"></div>
    `;
    
    // Inject minimal extra styles if not already present
    if (!document.getElementById('pp-topic-chip-styles')) {
        const s = document.createElement('style');
        s.id = 'pp-topic-chip-styles';
        s.textContent = `
            .topic-type-dot{display:inline-block;width:7px;height:7px;border-radius:50%;flex-shrink:0;}
            .topic-type-text{font-weight:600;color:var(--ink,#2a2723);}
            .topic-group-chips{display:flex;flex-wrap:wrap;gap:0.55rem;margin-bottom:1rem;}
            .topic-group-chip{display:inline-flex;align-items:center;gap:0.45rem;padding:0.5rem 0.85rem;font-family:var(--font-mono,'JetBrains Mono',monospace);font-size:0.72rem;font-weight:600;background:var(--surface-secondary,#f4f0e8);border:2px solid color-mix(in srgb,var(--ink,#2a2723) 15%,transparent);border-radius:999px;cursor:pointer;transition:transform .18s ease,box-shadow .18s ease,background .15s ease;}
            .topic-group-chip:hover{transform:translateY(-2px);box-shadow:0 2px 6px rgba(42,39,35,.1);}
            .topic-group-chip.active{background:var(--ink,#2a2723);border-color:var(--ink,#2a2723);}
            .topic-group-chip.active .topic-type-text{color:var(--accent-primary,#f4c95d);}
            .subtopic-container{margin-top:0.75rem;}
            .subtopic-chips{display:flex;flex-wrap:wrap;gap:0.5rem;padding:0.5rem 0;}
            .subtopic-chip{display:inline-flex;padding:0.45rem 0.8rem;font-family:var(--font-mono,'JetBrains Mono',monospace);font-size:0.68rem;font-weight:600;color:var(--ink,#2a2723);background:var(--surface-secondary,#f4f0e8);border:2px solid color-mix(in srgb,var(--ink,#2a2723) 18%,transparent);border-radius:999px;cursor:pointer;transition:transform .15s ease,box-shadow .15s ease,background .12s ease;}
            .subtopic-chip:hover{transform:translateY(-1px);box-shadow:0 2px 5px rgba(42,39,35,.1);}
            .subtopic-chip.active{background:var(--ink,#2a2723);color:var(--accent-primary,#f4c95d);border-color:var(--ink,#2a2723);}
            .subtopic-group-label{font-family:var(--font-mono,'JetBrains Mono',monospace);font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--text-secondary,#6b655c);padding:0 0 0.5rem;border-bottom:1.5px dashed color-mix(in srgb,var(--ink,#2a2723) 20%,transparent);margin-bottom:0.5rem;}
        `;
        document.head.appendChild(s);
    }
    
    // Level-1 click: expand subtopics below
    container.querySelectorAll('.topic-group-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('.topic-group-chip').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            
            const idx = parseInt(btn.dataset.groupIndex, 10);
            const group = groups[idx];
            const sub = document.getElementById('subtopic-container');
            sub.style.display = 'block';
            sub.innerHTML = `
                <div class="subtopic-group-label" style="border-bottom-color:${TYPE_ACCENTS[group.type]}">
                    ${group.topic} — pick a subtopic
                </div>
                <div class="subtopic-chips">
                    ${group.subtopics.map(st => `
                        <button class="subtopic-chip" data-subtopic="${st.replace(/"/g,'&quot;')}"
                                data-topic="${group.topic.replace(/"/g,'&quot;')}"
                                data-type="${group.type}">
                            ${st}
                        </button>
                    `).join('')}
                </div>
            `;
            
            // Level-2 click
            sub.querySelectorAll('.subtopic-chip').forEach(sc => {
                sc.addEventListener('click', () => {
                    sub.querySelectorAll('.subtopic-chip').forEach(c => c.classList.remove('active'));
                    sc.classList.add('active');
                    onSelect({
                        type: sc.dataset.type,
                        topic: sc.dataset.topic,
                        subtopic: sc.dataset.subtopic,
                    });
                });
            });
        });
    });
}

// ─── Custom Class Dropdown ────────────────────────────────────

export function initCustomDropdown(onSelect) {
    const trigger = document.getElementById('cdd-trigger');
    const panel = document.getElementById('cdd-panel');
    const valueDisplay = document.getElementById('cdd-value');
    if (!trigger) return;
    
    trigger.addEventListener('click', e => {
        e.stopPropagation();
        panel.classList.toggle('open');
        trigger.setAttribute('aria-expanded', panel.classList.contains('open'));
    });
    
    panel.querySelectorAll('.cdd-option').forEach(opt => {
        opt.addEventListener('click', () => {
            valueDisplay.innerText = opt.innerText;
            panel.classList.remove('open');
            trigger.setAttribute('aria-expanded', 'false');
            panel.querySelectorAll('.cdd-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            onSelect(opt.dataset.value, opt.innerText);
        });
    });
    
    document.addEventListener('click', () => {
        panel.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
    });
}

// ─── Method Selector ─────────────────────────────────────────

export function initMethodSelector(onChange) {
    document.querySelectorAll('.method-chip').forEach(chip => {
        chip.addEventListener('click', function() {
            document.querySelectorAll('.method-chip').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            onChange(this.dataset.method);
        });
    });
}