/* ═══════════════════════════════════════════════════════════
   PREP PORTAL — "Solve" scratchpad (Graspable Math)
   ───────────────────────────────────────────────────────────
   A private, interactive algebra canvas the learner can pop open
   while working a science question. It does NOT grade anything —
   it's a manipulable scratchpad for rearranging equations.

   • Shows only on science subjects (maths / physics / chemistry /
     further maths). Visibility is decided per-question by reading
     the subject out of the #q-counter-label the quiz engine sets,
     so it works in every mode (national, competition, static).
   • Graspable Math is loaded lazily the first time the panel opens
     (external script), so it costs nothing on non-science papers
     or until the learner actually wants it.
   Docs: https://github.com/eweitnauer/gm-api  (loadGM / gmath.Canvas)
   ═══════════════════════════════════════════════════════════ */

'use strict';

(function () {
    // Subjects that get the algebra scratchpad. Tweak this one regex to
    // broaden/narrow which subjects show the Solve tool.
    const SCIENCE_RE = /\b(math|maths|mathematics|further\s*math|physics|chemistry)\b/i;
    const GM_SRC = 'https://graspablemath.com/shared/libs/gmath/gm-inject.js';

    // Copied verbatim from utils/components/nav-icons.js → NAV_ICONS.math so the
    // Solve button reads as part of the same nav-icon family (this is a classic
    // script, so we inline the markup rather than importing the ES module).
    const MATH_ICON =
        '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="22" height="22">' +
            '<rect x="5" y="2.5" width="14" height="19" rx="2.6" fill="var(--accent-secondary)"/>' +
            '<rect x="7" y="4.6" width="10" height="3.8" rx="1" fill="#fff"/>' +
            '<rect x="8" y="5.6" width="4.4" height="1.7" rx="0.85" fill="var(--accent-secondary)"/>' +
            '<circle cx="8.6" cy="12" r="1.35" fill="var(--accent-primary)"/>' +
            '<circle cx="12" cy="12" r="1.35" fill="#fff"/>' +
            '<circle cx="15.4" cy="12" r="1.35" fill="var(--accent-danger)"/>' +
            '<circle cx="8.6" cy="16" r="1.35" fill="#fff"/>' +
            '<circle cx="12" cy="16" r="1.35" fill="var(--accent-primary)"/>' +
            '<rect x="14.05" y="14.65" width="2.7" height="5" rx="1.35" fill="var(--accent-warning)"/>' +
        '</svg>';
    // Mirrors the proven canvas config from prep-math/drag (Algebra Lab). The key
    // bits for a blank scratchpad: insert_btn + insert_menu_items (so the learner
    // can add an expression) and reset_btn. No saving/loading/fullscreen here.
    const CANVAS_OPTIONS = {
        auto_resize_on_scroll: false,
        use_toolbar: true, undo_btn: true, redo_btn: true, new_sheet_btn: false,
        font_size_btns: true, formula_btn: true, help_btn: false, help_logo_btn: false,
        fullscreen_toolbar_btn: false, fullscreen_btn: false, transform_btn: false,
        keypad_btn: false, scrub_btn: false, draw_btn: false, erase_btn: false,
        arrange_btn: false, reset_btn: true, save_btn: false, load_btn: false,
        settings_btn: true, insert_btn: true,
        insert_menu_items: { derivation: true, function: true, textbox: true },
        use_hold_menu: false, display_labels: false, btn_size: 'xs',
        ask_confirmation_on_closing: false, vertical_scroll: true,
    };

    let gmLoaded = false, gmLoading = false, canvas = null;
    let pendingLoad = false;   // a "Load question" click that arrived before GM finished loading
    let btn, panel, mountEl;

    let lastLoadedQ = -1;

    function makeCanvas() {
        canvas = new gmath.Canvas('#solve-canvas', CANVAS_OPTIONS);
        try {
            const maxFont = window.innerWidth <= 768 ? 28 : 40;
            canvas.controller && canvas.controller.set_font_size(Math.min(36, maxFont));
        } catch (_) { /* font sizing is best-effort */ }
        return canvas;
    }

    /* ── LaTeX → AsciiMath ────────────────────────────────────────────────
       Graspable Math's createElement('derivation', { eq }) takes AsciiMath-ish
       text (e.g. "2x+1=3", "(3)/(4)", "x^(2)"). Our questions are LaTeX, so we
       convert the common constructs. Anything we can't convert cleanly (sets,
       \text prose, leftover commands) is filtered out by isLoadable() so we
       never dump garbled math onto the canvas. */

    function readBrace(str, i) {           // str[i] must be '{'; returns balanced group
        let depth = 0;
        for (let j = i; j < str.length; j++) {
            if (str[j] === '{') depth++;
            else if (str[j] === '}' && --depth === 0) return { content: str.slice(i + 1, j), end: j };
        }
        return null;
    }

    function stripCmdArg(s, cmdRe) {       // drop "\cmd{...}" entirely (e.g. \text)
        let m;
        while ((m = s.match(cmdRe))) {
            const braceStart = s.indexOf('{', m.index);
            const g = readBrace(s, braceStart);
            if (!g) break;
            s = s.slice(0, m.index) + ' ' + s.slice(g.end + 1);
        }
        return s;
    }

    function replaceFrac(s) {
        let idx;
        while ((idx = s.search(/\\[dt]?frac\s*\{/)) !== -1) {
            const num = readBrace(s, s.indexOf('{', idx));
            if (!num) break;
            let k = num.end + 1;
            while (s[k] === ' ') k++;
            if (s[k] !== '{') break;
            const den = readBrace(s, k);
            if (!den) break;
            s = s.slice(0, idx) + '(' + num.content + ')/(' + den.content + ')' + s.slice(den.end + 1);
        }
        return s;
    }

    function replaceSqrt(s) {
        let idx;
        while ((idx = s.search(/\\sqrt/)) !== -1) {
            let k = idx + 5, n = null;
            if (s[k] === '[') { const c = s.indexOf(']', k); n = s.slice(k + 1, c); k = c + 1; }
            while (s[k] === ' ') k++;
            if (s[k] !== '{') { s = s.slice(0, idx) + 'sqrt' + s.slice(idx + 5); continue; }
            const arg = readBrace(s, k);
            if (!arg) break;
            const repl = n ? 'root(' + n + ')(' + arg.content + ')' : 'sqrt(' + arg.content + ')';
            s = s.slice(0, idx) + repl + s.slice(arg.end + 1);
        }
        return s;
    }

    function replaceScript(s, sym) {       // ^{...} / _{...}  →  ^(...) / _(...)
        const re = sym === '^' ? /\^\s*\{/ : /_\s*\{/;
        let idx;
        while ((idx = s.search(re)) !== -1) {
            const arg = readBrace(s, s.indexOf('{', idx));
            if (!arg) break;
            s = s.slice(0, idx) + sym + '(' + arg.content + ')' + s.slice(arg.end + 1);
        }
        return s;
    }

    function latexToAscii(src) {
        let s = ' ' + src + ' ';
        s = s.replace(/\\left|\\right/g, '')
             .replace(/\\,|\\;|\\!|\\:|\\quad|\\qquad|\\displaystyle/g, ' ');
        s = stripCmdArg(s, /\\text\s*\{/);
        s = replaceFrac(s);
        s = replaceSqrt(s);
        // known functions: drop the backslash even when followed by _ or ^
        s = s.replace(/\\(log|ln|sin|cos|tan|sec|csc|cot|exp|lg)(?![a-zA-Z])/g, '$1');
        s = replaceScript(s, '^');
        s = replaceScript(s, '_');
        s = s.replace(/\\times/g, ' * ').replace(/\\cdot/g, ' * ').replace(/\\div/g, ' / ')
             .replace(/\\pm/g, ' +- ')
             .replace(/\\leq?/g, ' <= ').replace(/\\geq?/g, ' >= ').replace(/\\neq/g, ' != ')
             .replace(/\\pi/g, 'pi').replace(/\\infty/g, 'oo')
             .replace(/\\%/g, '%');
        s = s.replace(/\\\{/g, '{').replace(/\\\}/g, '}');
        return s.replace(/\s+/g, ' ').trim();
    }

    function isLoadable(a) {
        if (!a || a.length > 120) return false;
        if (/\\/.test(a)) return false;              // leftover LaTeX command → too complex
        if (/[{}]/.test(a)) return false;            // leftover braces / set notation
        if (/:/.test(a)) return false;               // set-builder colon
        if (/\b(cap|cup|dots|cdots|mu|in)\b/.test(a)) return false;
        return /[0-9a-zA-Z]/.test(a);                // must contain at least a number/variable
    }

    // Pull every LaTeX math segment out of a raw question string.
    function extractLatex(raw) {
        const out = [];
        const pats = [/\\\[([\s\S]+?)\\\]/g, /\$\$([\s\S]+?)\$\$/g, /\\\(([\s\S]+?)\\\)/g, /\$([^$]+?)\$/g];
        pats.forEach(re => { let m; while ((m = re.exec(raw))) out.push(m[1]); });
        return out;
    }

    function collectLoadable(raw) {
        const seen = new Set(), out = [];
        extractLatex(raw || '').forEach(tex => {
            const ascii = latexToAscii(tex);
            if (isLoadable(ascii) && !seen.has(ascii)) { seen.add(ascii); out.push(ascii); }
        });
        return out;
    }

    function currentQuestion() {
        try {
            const st = window.Quiz && window.Quiz.getState && window.Quiz.getState();
            return st && st.allQuestions ? { q: st.allQuestions[st.currentIndex], idx: st.currentIndex } : null;
        } catch (_) { return null; }
    }

    // Replace the canvas with a fresh one carrying the current question's
    // expressions. Used on first open and by the "Load" button.
    function loadQuestionIntoCanvas() {
        // Clicked before Graspable Math finished loading → remember it and load
        // as soon as the canvas is ready.
        if (!gmLoaded || typeof gmath === 'undefined') { pendingLoad = true; ensureCanvas(); return; }
        pendingLoad = false;
        const cur = currentQuestion();
        mountEl.innerHTML = '';
        makeCanvas();
        lastLoadedQ = cur ? cur.idx : -1;
        const exprs = cur && cur.q ? collectLoadable(cur.q.question).slice(0, 4) : [];
        let y = 60;
        exprs.forEach(eq => {
            try {
                canvas.model.createElement('derivation', { eq, pos: { x: 'center', y }, draggable: true, h_align: 'center' });
                y += 90;
            } catch (e) { console.warn('GM could not load expression:', eq, e.message); }
        });
        return exprs.length;
    }

    // The counter label reads "Q 3 / 40 · Mathematics · OBJECTIVE".
    function subjectFromLabel(label) {
        if (!label) return '';
        const parts = label.split('·').map(s => s.trim());
        return parts.length >= 2 ? parts[1] : label;
    }
    const isScience = (label) => SCIENCE_RE.test(subjectFromLabel(label));

    function injectStyles() {
        const css = `
        /* Soft-UI: surface tiles, subtle hairline borders, soft blurred shadows
           (theme.css tokens) — no hard outlines or offset "sticker" shadows. */
        #solve-fab {
            position: fixed; left: 18px; bottom: 18px; z-index: 9000;
            display: none; align-items: center; gap: .5rem;
            padding: .55rem 1rem .55rem .6rem; cursor: pointer;
            border: var(--border-subtle, 1px solid rgba(42,39,35,.12));
            border-radius: 999px;
            background: var(--surface-primary, #fffdf8); color: var(--ink, #2a2723);
            font-family: var(--font-mono, monospace); font-size: var(--text-mono-sm, .8125rem); font-weight: 600;
            letter-spacing: .01em; box-shadow: var(--shadow-md, 0 4px 11px rgba(42,39,35,.12));
            transition: transform var(--duration-smooth, .2s) var(--ease-default, ease),
                        box-shadow var(--duration-smooth, .2s) var(--ease-default, ease),
                        opacity var(--duration-smooth, .2s) var(--ease-default, ease);
        }
        #solve-fab svg { flex-shrink: 0; }
        #solve-fab:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg, 0 9px 22px rgba(42,39,35,.14)); }
        #solve-fab:active { transform: translateY(0); box-shadow: var(--shadow-sm, 0 2px 5px rgba(42,39,35,.1)); }
        #solve-fab.active { box-shadow: var(--shadow-lg, 0 9px 22px rgba(42,39,35,.14)); }
        #solve-panel {
            position: fixed; left: 18px; bottom: 78px; z-index: 9000;
            width: min(460px, 92vw); height: min(540px, 72vh);
            display: flex; flex-direction: column; overflow: hidden;
            background: var(--surface-primary, #fffdf8);
            border: var(--border-subtle, 1px solid rgba(42,39,35,.12)); border-radius: 22px;
            box-shadow: var(--shadow-xl, 0 18px 40px rgba(42,39,35,.16));
            opacity: 0; transform: translateY(12px) scale(.98);
            pointer-events: none;
            transition: opacity var(--duration-smooth, .2s) var(--ease-default, ease),
                        transform var(--duration-smooth, .2s) var(--ease-smooth, cubic-bezier(.16,1,.3,1));
        }
        #solve-panel.open { opacity: 1; transform: none; pointer-events: auto; }
        .solve-panel__bar {
            display: flex; align-items: center; justify-content: space-between;
            padding: .6rem .8rem;
            border-bottom: var(--border-subtle, 1px solid rgba(42,39,35,.12));
            background: var(--surface-secondary, #f4f0e8);
        }
        .solve-panel__title { font-family: var(--font-mono, monospace); font-size: var(--text-mono-xs, .75rem); font-weight: 600; letter-spacing: .02em; color: var(--ink, #2a2723); }
        .solve-panel__actions { display: flex; gap: .45rem; }
        .solve-panel__btn {
            display: inline-flex; align-items: center; gap: .3rem;
            border: var(--border-subtle, 1px solid rgba(42,39,35,.12));
            background: var(--surface-primary, #fffdf8); color: var(--ink, #2a2723);
            border-radius: 10px; padding: .34rem .6rem; cursor: pointer;
            font-family: var(--font-mono, monospace); font-size: .66rem; font-weight: 600;
            box-shadow: var(--shadow-sm, 0 2px 5px rgba(42,39,35,.1));
            transition: transform var(--duration-fast, .12s) var(--ease-default, ease),
                        box-shadow var(--duration-fast, .12s) var(--ease-default, ease);
        }
        .solve-panel__btn:hover { transform: translateY(-1px); box-shadow: var(--shadow-md, 0 4px 11px rgba(42,39,35,.12)); }
        .solve-panel__btn:active { transform: translateY(0); box-shadow: var(--shadow-sm, 0 2px 5px rgba(42,39,35,.1)); }
        .solve-panel__canvas { flex: 1 1 auto; min-height: 0; background: var(--surface-primary, #fffdf8); }
        .solve-panel__loading {
            display: flex; align-items: center; justify-content: center; height: 100%;
            font-family: var(--font-mono, monospace); font-size: .74rem; color: var(--text-secondary, #6b655c); text-align: center; padding: 1rem;
        }
        .solve-panel__hint {
            margin: 0; padding: .55rem .8rem;
            border-top: var(--border-subtle, 1px solid rgba(42,39,35,.12));
            font-family: var(--font-mono, monospace); font-size: .62rem; line-height: 1.4;
            color: var(--text-secondary, #6b655c);
        }
        /* ── Mobile: full-width bottom sheet, wrapping toolbar, bigger taps ── */
        @media (max-width: 600px) {
            #solve-fab {
                left: 12px;
                bottom: calc(12px + env(safe-area-inset-bottom, 0px));
                padding: .5rem .9rem .5rem .55rem;
                font-size: var(--text-mono-xs, .75rem);
            }
            /* The sheet has its own close button, so get the FAB out of the way. */
            #solve-fab.active { opacity: 0; pointer-events: none; transform: scale(.92); }
            #solve-panel {
                left: 8px; right: 8px; width: auto;
                bottom: calc(8px + env(safe-area-inset-bottom, 0px));
                height: 80vh; height: 80dvh;
                border-radius: 18px;
            }
            .solve-panel__bar { flex-wrap: wrap; gap: .5rem; padding: .55rem .65rem; }
            .solve-panel__actions { width: 100%; justify-content: space-between; gap: .4rem; }
            .solve-panel__btn { padding: .5rem .75rem; font-size: .7rem; }
            .solve-panel__hint { font-size: .6rem; padding: .5rem .65rem; }
        }
        @media print { #solve-fab, #solve-panel { display: none !important; } }`;
        const style = document.createElement('style');
        style.id = 'solve-tool-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    function buildUI() {
        injectStyles();

        btn = document.createElement('button');
        btn.id = 'solve-fab';
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Open the Graspable Math solver');
        // Reuses the site's nav calculator icon (NAV_ICONS.math): multicolour
        // filled shapes on a 24×24 grid via --accent-* tokens + white highlights,
        // no outlines — so it re-tints in light/dark like the rest of the nav set.
        btn.innerHTML = MATH_ICON + '<span>Solve</span>';
        btn.addEventListener('click', togglePanel);
        document.body.appendChild(btn);

        panel = document.createElement('div');
        panel.id = 'solve-panel';
        panel.innerHTML =
            '<div class="solve-panel__bar">' +
                '<span class="solve-panel__title">Graspable Math · Scratchpad</span>' +
                '<div class="solve-panel__actions">' +
                    '<button type="button" id="solve-load" class="solve-panel__btn">Load question</button>' +
                    '<button type="button" id="solve-reset" class="solve-panel__btn">Clear</button>' +
                    '<button type="button" id="solve-close" class="solve-panel__btn" aria-label="Close">' +
                        '<svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" ' +
                        'stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M1 1l10 10M11 1L1 11"/></svg>' +
                    '</button>' +
                '</div>' +
            '</div>' +
            '<div id="solve-canvas" class="solve-panel__canvas"></div>' +
            '<p class="solve-panel__hint">Click <strong>Load question</strong> to bring this question\'s math onto the canvas · use Insert (+) to add your own, or drag terms to rearrange. Private scratchpad — nothing here is graded.</p>';
        document.body.appendChild(panel);

        mountEl = panel.querySelector('#solve-canvas');
        panel.querySelector('#solve-close').addEventListener('click', () => setOpen(false));
        panel.querySelector('#solve-reset').addEventListener('click', resetCanvas);
        panel.querySelector('#solve-load').addEventListener('click', loadQuestionIntoCanvas);
        // Keep the quiz's keyboard shortcuts (arrows = navigate) from firing
        // while the learner is typing/dragging inside the solver.
        panel.addEventListener('keydown', (e) => e.stopPropagation());
    }

    function setOpen(open) {
        if (!panel) return;
        panel.classList.toggle('open', open);
        btn.classList.toggle('active', open);
        if (open) ensureCanvas();   // builds a blank canvas; loading is on the learner ("Load question")
    }
    function togglePanel() { setOpen(!panel.classList.contains('open')); }

    function ensureCanvas() {
        if (gmLoaded || gmLoading) return;
        gmLoading = true;
        mountEl.innerHTML = '<div class="solve-panel__loading">Loading Graspable Math…</div>';

        const fail = () => {
            gmLoading = false;
            mountEl.innerHTML = '<div class="solve-panel__loading">Couldn\'t load the solver. Check your connection and try again.</div>';
        };

        const s = document.createElement('script');
        s.src = GM_SRC;
        s.onload = () => {
            if (typeof loadGM !== 'function') return fail();
            loadGM(() => {
                try {
                    mountEl.innerHTML = '';
                    makeCanvas();               // start blank — the learner loads the question themselves
                    gmLoaded = true; gmLoading = false;
                    if (pendingLoad) loadQuestionIntoCanvas();   // honour a click made during load
                } catch (e) { console.warn('Graspable Math init failed:', e); fail(); }
            }, { version: 'latest' });
        };
        s.onerror = fail;
        document.head.appendChild(s);
    }

    function resetCanvas() {
        if (!gmLoaded || typeof gmath === 'undefined') return;
        try {
            mountEl.innerHTML = '';
            makeCanvas();
        } catch (e) { console.warn('Graspable Math reset failed:', e); }
    }

    function refreshVisibility() {
        if (!btn) return;
        const label = document.getElementById('q-counter-label');
        const show = isScience(label && label.textContent);
        btn.style.display = show ? 'inline-flex' : 'none';
        if (!show) setOpen(false);
    }

    function init() {
        buildUI();
        const label = document.getElementById('q-counter-label');
        if (label) {
            new MutationObserver(refreshVisibility)
                .observe(label, { childList: true, characterData: true, subtree: true });
        }
        refreshVisibility();
        // The first question may render shortly after this script runs; poll briefly.
        let n = 0;
        const t = setInterval(() => { refreshVisibility(); if (++n > 20) clearInterval(t); }, 500);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
