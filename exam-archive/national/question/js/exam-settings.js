/* ═══════════════════════════════════════════════════════════
   PREP PORTAL — Pre-exam settings modal
   ───────────────────────────────────────────────────────────
   Intercepts Quiz.init() to show a settings overlay before
   any questions load.  Chosen values are written to globals
   window.__timerEnabled / __immediateMode / __solverEnabled /
   __shuffleEnabled / __hintsEnabled / __autoAdvance, and the
   theme attribute is toggled for dark mode.
   Prefs persist via localStorage (key: pp-exam-prefs).
   ═══════════════════════════════════════════════════════════ */

'use strict';

(function () {
    const PREFS_KEY = 'pp-exam-prefs';

    function loadPrefs()      { try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch { return {}; } }
    function savePrefs(p)     { try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); }       catch {} }

    const _url = new URLSearchParams(location.search);

    const TOGGLES = [
        {
            id: 'timed',
            label: 'Timed Exam',
            desc: '~1 min per question · auto-submits at zero',
            icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
                '<circle cx="12" cy="14" r="8" fill="var(--accent-secondary)"/>' +
                '<rect x="9.8" y="2.5" width="4.4" height="2" rx="1" fill="var(--accent-secondary)"/>' +
                '<rect x="10.8" y="7" width="2.4" height="5.5" rx="1.2" fill="#fff"/>' +
                '<rect transform="rotate(-35 12 14)" x="11.5" y="14" width="3.8" height="1.5" rx="0.75" fill="var(--accent-warning)"/>' +
                '<circle cx="12" cy="14" r="1.4" fill="var(--accent-warning)"/>' +
                '</svg>',
            default: _url.get('timer') === 'on',
        },
        {
            id: 'immediate',
            label: 'Immediate Feedback',
            desc: 'Reveals the answer the moment you pick',
            icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
                '<path d="M15 2L5.5 13.5H11L8.5 22l10.5-13H13.5z" fill="var(--accent-warning)"/>' +
                '<path d="M14 7.5L8.5 15H13L11 19.5l6.5-8.5H13.5z" fill="#fff" opacity="0.4"/>' +
                '</svg>',
            default: _url.get('feedback') === 'on',
        },
        {
            id: 'solver',
            label: 'Solver',
            desc: 'Graspable Math scratchpad (GM)',
            icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
                '<rect x="4" y="3" width="16" height="18" rx="2.8" fill="var(--accent-primary)"/>' +
                '<rect x="6.5" y="6" width="11" height="2.2" rx="1.1" fill="#fff"/>' +
                '<rect x="6.5" y="10.5" width="7" height="1.6" rx="0.8" fill="var(--accent-warning)"/>' +
                '<rect x="6.5" y="13.5" width="9" height="1.6" rx="0.8" fill="#fff" opacity="0.55"/>' +
                '<rect x="6.5" y="16.5" width="5.5" height="1.6" rx="0.8" fill="var(--accent-secondary)"/>' +
                '</svg>',
            default: true,
        },
        {
            id: 'shuffle',
            label: 'Shuffle Questions',
            desc: 'Randomise the order each session',
            icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
                '<rect x="2" y="2" width="20" height="20" rx="5" fill="var(--accent-success)"/>' +
                '<path d="M5 8.5h8.5M16.5 5.5l3 3-3 3M5 15.5h8.5M16.5 12.5l3 3-3 3" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
                '</svg>',
            default: false,
        },
        {
            id: 'hints',
            label: 'Show Hints',
            desc: 'Reveal question hints on demand',
            icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
                '<path d="M12 2.5a6.5 6.5 0 013.8 11.7c-.5.4-.7.9-.7 1.5H8.9c0-.6-.2-1.1-.7-1.5A6.5 6.5 0 0112 2.5z" fill="var(--accent-warning)"/>' +
                '<path d="M10.5 6A3.2 3.2 0 0112.8 5.3" stroke="#fff" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.85"/>' +
                '<rect x="9.2" y="16.4" width="5.6" height="1.9" rx="0.95" fill="var(--accent-secondary)"/>' +
                '<path d="M10 18.7h4v.5a1.5 1.5 0 01-1.5 1.5h-1A1.5 1.5 0 0110 19.2z" fill="var(--accent-secondary)"/>' +
                '</svg>',
            default: true,
        },
        {
            id: 'darkmode',
            label: 'Dark Mode',
            desc: 'Switch to dark theme',
            icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
                '<path d="M17.5 13A7.5 7.5 0 019.5 5C6 5.5 3.5 8.8 3.5 12.5a8.5 8.5 0 0016.3 3.2A7.5 7.5 0 0117.5 13z" fill="var(--accent-secondary)"/>' +
                '<circle cx="18" cy="6" r="2.5" fill="var(--accent-warning)"/>' +
                '<circle cx="21.5" cy="10.5" r="1.5" fill="var(--accent-warning)" opacity="0.6"/>' +
                '<circle cx="16.5" cy="3" r="1.2" fill="var(--accent-warning)" opacity="0.5"/>' +
                '</svg>',
            default: document.documentElement.dataset.theme === 'dark',
        },
        {
            id: 'autoadvance',
            label: 'Auto-advance',
            desc: 'Jump to next question after answering',
            icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
                '<path d="M5 4.5l10 7.5-10 7.5V4.5z" fill="var(--accent-primary)"/>' +
                '<rect x="16.5" y="4.5" width="3" height="15" rx="1.5" fill="var(--accent-danger)"/>' +
                '</svg>',
            default: false,
        },
        {
            id: 'botguide',
            label: 'Bot Guide',
            desc: 'PrepBot AI assistant during the exam',
            icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
                '<rect x="4" y="7.5" width="16" height="12.5" rx="3" fill="var(--accent-secondary)"/>' +
                '<rect x="11.2" y="3" width="1.6" height="4.5" rx="0.8" fill="var(--accent-secondary)"/>' +
                '<circle cx="12" cy="2.8" r="1.8" fill="var(--accent-danger)"/>' +
                '<circle cx="8.8" cy="12" r="2.1" fill="#fff"/>' +
                '<circle cx="15.2" cy="12" r="2.1" fill="#fff"/>' +
                '<circle cx="8.8" cy="12" r="1.1" fill="var(--accent-primary)"/>' +
                '<circle cx="15.2" cy="12" r="1.1" fill="var(--accent-primary)"/>' +
                '<rect x="7" y="16.5" width="10" height="1.4" rx="0.7" fill="#fff" opacity="0.45"/>' +
                '</svg>',
            default: true,
        },
    ];

    // ── Resolve defaults (localStorage → URL fallback → hardcoded) ────────────
    function resolveDefaults() {
        const saved = loadPrefs();
        const vals = {};
        TOGGLES.forEach(t => {
            vals[t.id] = (t.id in saved) ? !!saved[t.id] : t.default;
        });
        return vals;
    }

    // ── Apply settings to globals used by other modules ───────────────────────
    function applySettings(vals) {
        window.__timerEnabled   = vals.timed;
        window.__immediateMode  = vals.immediate;
        window.__solverEnabled  = vals.solver;
        window.__shuffleEnabled = vals.shuffle;
        window.__hintsEnabled   = vals.hints;
        window.__autoAdvance    = vals.autoadvance;
        window.__botGuideEnabled = vals.botguide;

        document.documentElement.dataset.theme = vals.darkmode ? 'dark' : 'light';
        // Keep the global nav theme toggle (pp-theme) in sync with this choice.
        try { localStorage.setItem('pp-theme', vals.darkmode ? 'dark' : 'light'); } catch (e) {}

        const pb = document.getElementById('prepbot');
        if (pb) pb.style.display = vals.botguide ? '' : 'none';

        savePrefs(vals);
    }

    // ── Styles ────────────────────────────────────────────────────────────────
    function injectStyles() {
        if (document.getElementById('es-styles')) return;
        const css = `
        #es-overlay {
            position: fixed; inset: 0; z-index: 10000;
            background: rgba(42,39,35,.5);
            backdrop-filter: blur(6px) saturate(1.2);
            display: flex; align-items: center; justify-content: center;
            padding: 16px;
        }
        .es-modal {
            background: var(--surface-primary, #fffdf8);
            border: var(--border-subtle, 1px solid rgba(42,39,35,.12));
            border-radius: 22px;
            box-shadow: var(--shadow-xl, 0 20px 50px rgba(42,39,35,.2));
            width: min(460px, 100%);
            max-height: 90dvh;
            display: flex; flex-direction: column; overflow: hidden;
            animation: es-pop .22s cubic-bezier(.16,1,.3,1) both;
        }
        @keyframes es-pop {
            from { opacity: 0; transform: translateY(18px) scale(.96); }
        }
        .es-head {
            padding: 1.3rem 1.5rem .9rem;
            border-bottom: var(--border-subtle, 1px solid rgba(42,39,35,.1));
            background: var(--surface-secondary, #f4f0e8);
            flex-shrink: 0;
        }
        .es-head-title {
            font-family: var(--font-display, 'Nunito', sans-serif);
            font-size: 1.2rem; font-weight: 800; color: var(--ink, #2a2723);
            letter-spacing: -.01em;
        }
        .es-head-sub {
            font-family: var(--font-mono, monospace);
            font-size: .68rem; color: var(--text-secondary, #6b655c); margin-top: .2rem;
        }
        .es-body {
            flex: 1 1 auto; overflow-y: auto;
            padding: .55rem .45rem;
        }
        .es-row {
            display: flex; align-items: center; justify-content: space-between;
            padding: .72rem 1rem; border-radius: 14px; cursor: pointer;
            gap: .9rem; user-select: none;
            transition: background .12s;
        }
        .es-row:hover { background: var(--surface-secondary, #f4f0e8); }
        .es-row-left { display: flex; align-items: center; gap: .7rem; flex: 1; min-width: 0; }
        .es-icon {
            width: 38px; height: 38px; flex-shrink: 0; border-radius: 11px;
            background: var(--surface-secondary, #f4f0e8);
            display: flex; align-items: center; justify-content: center;
        }
        .es-icon svg { width: 24px; height: 24px; }
        .es-text-wrap { flex: 1; min-width: 0; }
        .es-label {
            font-family: var(--font-mono, monospace); font-size: .82rem; font-weight: 600;
            color: var(--ink, #2a2723); display: block;
        }
        .es-desc {
            font-family: var(--font-mono, monospace); font-size: .64rem;
            color: var(--text-secondary, #6b655c); margin-top: .1rem; display: block;
        }
        .es-track {
            width: 44px; height: 25px; border-radius: 999px; flex-shrink: 0;
            background: var(--surface-tertiary, #ddd8ce);
            border: 1px solid rgba(42,39,35,.12);
            position: relative;
            transition: background .2s, border-color .2s;
        }
        .es-track.on {
            background: var(--accent-primary, #6b8f5e);
            border-color: transparent;
        }
        .es-thumb {
            position: absolute; top: 2.5px; left: 2.5px;
            width: 18px; height: 18px; border-radius: 50%;
            background: #fff;
            box-shadow: 0 1px 4px rgba(42,39,35,.22);
            transition: transform .2s cubic-bezier(.34,1.56,.64,1);
        }
        .es-track.on .es-thumb { transform: translateX(19px); }
        .es-foot {
            display: flex; align-items: center; justify-content: space-between;
            padding: .8rem 1.1rem;
            border-top: var(--border-subtle, 1px solid rgba(42,39,35,.1));
            background: var(--surface-secondary, #f4f0e8);
            gap: .6rem; flex-shrink: 0;
        }
        .es-start-btn {
            display: inline-flex; align-items: center; gap: .4rem;
        }
        .es-start-btn svg { width: 12px; height: 12px; }`;
        const el = document.createElement('style');
        el.id = 'es-styles';
        el.textContent = css;
        document.head.appendChild(el);
    }

    // ── Build & show modal ────────────────────────────────────────────────────
    function show(startCallback) {
        injectStyles();
        const vals = resolveDefaults();

        const overlay = document.createElement('div');
        overlay.id = 'es-overlay';

        const rows = TOGGLES.map(t => `
            <div class="es-row" data-id="${t.id}" role="button" tabindex="0" aria-pressed="${vals[t.id]}">
                <div class="es-row-left">
                    <div class="es-icon">${t.icon}</div>
                    <div class="es-text-wrap">
                        <span class="es-label">${t.label}</span>
                        <span class="es-desc">${t.desc}</span>
                    </div>
                </div>
                <div class="es-track ${vals[t.id] ? 'on' : ''}" aria-hidden="true">
                    <div class="es-thumb"></div>
                </div>
            </div>`).join('');

        overlay.innerHTML = `
            <div class="es-modal" role="dialog" aria-label="Exam settings">
                <div class="es-head">
                    <div class="es-head-title">Exam Settings</div>
                    <div class="es-head-sub">Choose your session options before starting</div>
                </div>
                <div class="es-body">${rows}</div>
                <div class="es-foot">
                    <button type="button" class="btn" id="es-back">← Back</button>
                    <button type="button" class="btn btn-ink es-start-btn" id="es-start">
                        Start Exam
                        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                            <path d="M2 6h8M7 3l3 3-3 3"/>
                        </svg>
                    </button>
                </div>
            </div>`;

        document.body.appendChild(overlay);

        // ── Toggle interactions ────────────────────────────────────────────
        overlay.querySelectorAll('.es-row').forEach(row => {
            const toggle = () => {
                const id = row.dataset.id;
                vals[id] = !vals[id];
                row.setAttribute('aria-pressed', vals[id]);
                row.querySelector('.es-track').classList.toggle('on', vals[id]);
                // Live-preview dark mode
                if (id === 'darkmode') {
                    document.documentElement.dataset.theme = vals.darkmode ? 'dark' : 'light';
                }
            };
            row.addEventListener('click', toggle);
            row.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } });
        });

        overlay.querySelector('#es-back').addEventListener('click', () => window.history.back());

        overlay.querySelector('#es-start').addEventListener('click', () => {
            applySettings(vals);
            // Fade out then remove
            overlay.style.transition = 'opacity .15s';
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.remove();
                startCallback();
            }, 150);
        });
    }

    window.ExamSettings = { show };
})();
