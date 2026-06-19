/* ═══════════════════════════════════════════════════════════
   PREP PORTAL — "Solve" scratchpad (Graspable Math)
   ───────────────────────────────────────────────────────────
   Full-viewport algebra canvas. Auto-loads the current
   question's math as a multiline vertical stack.
   Insert menu: Math Expression, Function, Text, Graph
   (GeoGebra), Geometry, 3D, Image, YouTube Video.
   Docs: https://github.com/eweitnauer/gm-api
   ═══════════════════════════════════════════════════════════ */

'use strict';

(function () {
    const GM_SRC = 'https://graspablemath.com/shared/libs/gmath/gm-inject.js';

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

    const CANVAS_OPTIONS = {
        auto_resize_on_scroll: false,
        use_toolbar: true, undo_btn: true, redo_btn: true, new_sheet_btn: false,
        font_size_btns: true, formula_btn: true, help_btn: false, help_logo_btn: false,
        fullscreen_toolbar_btn: false, fullscreen_btn: false, transform_btn: false,
        keypad_btn: false, scrub_btn: false, draw_btn: false, erase_btn: false,
        arrange_btn: false, reset_btn: true, save_btn: false, load_btn: false,
        settings_btn: true, insert_btn: true,
        insert_menu_items: {
            derivation: true,   // Math Expression
            function: true,     // Function
            textbox: true,      // Text
            ggb_graphing: true, // Graph (GeoGebra)
            ggb_geometry: true, // Geometry
            ggb_3d: true,       // 3D
            image: true,        // Image
            video: true,        // YouTube Video
        },
        use_hold_menu: false, display_labels: false, btn_size: 'sm',
        ask_confirmation_on_closing: false, vertical_scroll: true,
    };

    // ── GM state ──────────────────────────────────────────────────────────────
    let gmLoaded = false, gmLoading = false, canvas = null;
    let pendingExprs = null;   // expressions queued to load once GM finishes booting
    let lastLoadedQ = -1;

    // ── DOM refs ──────────────────────────────────────────────────────────────
    let btn, panel, mountEl;

    /* ── LaTeX → AsciiMath ─────────────────────────────────────────────────── */

    function readBrace(str, i) {
        let depth = 0;
        for (let j = i; j < str.length; j++) {
            if (str[j] === '{') depth++;
            else if (str[j] === '}' && --depth === 0) return { content: str.slice(i + 1, j), end: j };
        }
        return null;
    }

    function stripCmdArg(s, cmdRe) {
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

    function replaceScript(s, sym) {
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
        if (/\\/.test(a)) return false;
        if (/[{}]/.test(a)) return false;
        if (/:/.test(a)) return false;
        if (/\b(cap|cup|dots|cdots|mu|in)\b/.test(a)) return false;
        return /[0-9a-zA-Z]/.test(a);
    }

    function extractLatex(raw) {
        const out = [];
        const pats = [/\\\[([\s\S]+?)\\\]/g, /\$\$([\s\S]+?)\$\$/g, /\\\(([\s\S]+?)\\\)/g, /\$([^$]+?)\$/g];
        pats.forEach(re => { let m; while ((m = re.exec(raw))) out.push(m[1]); });
        return out;
    }

    function collectLoadable(raw, opts) {
        const seen = new Set(), out = [];
        const sources = [raw || ''];
        if (opts && Array.isArray(opts)) {
            opts.forEach(o => sources.push(typeof o === 'string' ? o : String(o)));
        }
        sources.forEach(src => {
            extractLatex(src).forEach(tex => {
                const ascii = latexToAscii(tex);
                if (isLoadable(ascii) && !seen.has(ascii)) { seen.add(ascii); out.push(ascii); }
            });
        });
        return out;
    }

    // ── Quiz integration ──────────────────────────────────────────────────────
    function currentQuestion() {
        try {
            const st = window.Quiz && window.Quiz.getState && window.Quiz.getState();
            return st && st.allQuestions ? { q: st.allQuestions[st.currentIndex], idx: st.currentIndex } : null;
        } catch (_) { return null; }
    }

    // The GM scratchpad is for working out maths — only offer it on science /
    // stats / maths subjects for now. For competitions the per-question subject
    // is the competition key, so fall back to the section chosen in the URL.
    const SOLVER_SUBJECTS = /(math|further\s*math|add(?:itional)?\s*math|physics|chem|bio|stat|science|quantitative|numeracy)/i;
    function effectiveSubject(q) {
        const subj = (q && q.subject) || '';
        const cfg = (typeof PAGE_CONFIG !== 'undefined' && PAGE_CONFIG) || {};
        if (cfg.comp && subj === cfg.comp) return cfg.section || subj;   // competition → section
        return subj;
    }
    function solverAllowedFor(q) { return SOLVER_SUBJECTS.test(effectiveSubject(q)); }

    // Show the FAB only when the current question is a solver-eligible subject
    // (and the page hasn't explicitly disabled the solver).
    function updateFabVisibility() {
        if (!btn) return;
        const cur = currentQuestion();
        const allowed = window.__solverEnabled !== false && !!(cur && cur.q && solverAllowedFor(cur.q));
        btn.style.display = allowed ? 'inline-flex' : 'none';
        if (!allowed && panel && panel.classList.contains('open')) setOpen(false);
    }

    // ── Canvas helpers ────────────────────────────────────────────────────────
    function makeCanvas() {
        canvas = new gmath.Canvas('#solve-canvas', CANVAS_OPTIONS);
        try {
            const maxFont = window.innerWidth <= 768 ? 28 : 40;
            canvas.controller && canvas.controller.set_font_size(Math.min(36, maxFont));
        } catch (_) {}
    }

    // Place a set of expressions on a fresh canvas. Queues if GM isn't ready yet.
    function loadExpressions(exprs) {
        if (!gmLoaded || typeof gmath === 'undefined') { pendingExprs = exprs || []; ensureGM(); return; }
        pendingExprs = null;
        const cur = currentQuestion();
        mountEl.innerHTML = '';
        makeCanvas();
        lastLoadedQ = cur ? cur.idx : -1;
        let y = 50;
        (exprs || []).forEach(eq => {
            try {
                canvas.model.createElement('derivation', { eq, pos: { x: 40, y }, draggable: true });
                y += 100;
            } catch (e) { console.warn('GM load:', eq, e.message); }
        });
    }

    async function isAdminUser() {
        try { return !!(window.SolutionSteps && await window.SolutionSteps.isAdmin()); }
        catch (_) { return false; }
    }
    async function savedExpressionFor(q) {
        try { return (window.SolutionSteps && await window.SolutionSteps.getExpression(q)) || null; }
        catch (_) { return null; }
    }

    function flashLoadBtn(msg) {
        const b = document.getElementById('solve-load');
        if (!b) return;
        const orig = b.dataset.label || b.textContent;
        b.dataset.label = orig;
        b.textContent = msg;
        setTimeout(() => { b.textContent = b.dataset.label || orig; }, 1800);
    }

    // "Load Q": load the admin-saved expression if one exists. If none is saved,
    // an admin is prompted to enter + save it; a learner gets NOTHING loaded and
    // simply types their own working on the canvas.
    async function loadForCurrentQuestion() {
        const cur = currentQuestion();
        if (!cur || !cur.q) return;
        const saved = await savedExpressionFor(cur.q);
        if (saved && saved.length) { hideEditor(); loadExpressions(saved); return; }
        if (await isAdminUser()) { showEditor(); return; }
        flashLoadBtn('None saved — type your own');
    }

    // On open we do NOT auto-load. If the signed-in user is an admin and nothing
    // has been saved for this question yet, prompt them to enter + save it. Each
    // question is curated on its own (keyed by question|answer).
    async function maybePromptAdmin() {
        const cur = currentQuestion();
        if (!cur || !cur.q) { hideEditor(); return; }
        const saved = await savedExpressionFor(cur.q);
        if (saved && saved.length) { hideEditor(); return; }
        if (await isAdminUser()) showEditor();
        else hideEditor();
    }

    // Admin "Edit exp": open the editor prefilled with the saved expression so it
    // can be revised and re-saved (overwrites the stored one). Blank if none yet.
    async function onEditClicked() {
        const cur = currentQuestion();
        if (!cur || !cur.q) return;
        const saved = await savedExpressionFor(cur.q);
        showEditor(saved || []);
    }

    // Show the admin-only "Edit exp" button only to admins.
    async function updateAdminControls() {
        const eb = document.getElementById('solve-edit');
        if (!eb) return;
        eb.style.display = (await isAdminUser()) ? '' : 'none';
    }

    // ── Admin expression editor ───────────────────────────────────────────────
    function showEditor(prefill) {
        const ed = document.getElementById('solve-expr-editor');
        const ta = document.getElementById('solve-expr-input');
        if (!ed || !ta) return;
        ta.value = (prefill || []).join('\n');
        ed.hidden = false;
    }
    function hideEditor() {
        const ed = document.getElementById('solve-expr-editor');
        if (ed) ed.hidden = true;
    }
    async function onSaveExpr() {
        const cur = currentQuestion();
        if (!cur || !cur.q) return;
        const exprs = (document.getElementById('solve-expr-input').value || '')
            .split('\n').map(s => s.trim()).filter(Boolean);
        const saveBtn = document.getElementById('solve-expr-save');
        if (!exprs.length) { return; }
        saveBtn.disabled = true; saveBtn.textContent = 'Saving…';
        try {
            await window.SolutionSteps.saveExpression(cur.q, exprs);
            hideEditor();
            loadExpressions(exprs);
        } catch (e) {
            console.warn('saveExpression:', e.message);
            saveBtn.textContent = 'Save failed';
            setTimeout(() => { saveBtn.disabled = false; saveBtn.textContent = 'Save & load'; }, 1600);
            return;
        }
        saveBtn.disabled = false; saveBtn.textContent = 'Save & load';
    }

    function resetCanvas() {
        if (!gmLoaded || typeof gmath === 'undefined') return;
        try { mountEl.innerHTML = ''; makeCanvas(); lastLoadedQ = -1; }
        catch (e) { console.warn('GM reset:', e); }
    }

    // ── GM lazy loader ────────────────────────────────────────────────────────
    function ensureGM() {
        if (gmLoaded || gmLoading) return;
        gmLoading = true;
        mountEl.innerHTML = '<div class="solve-panel__loading">Loading Graspable Math…</div>';

        const fail = () => {
            gmLoading = false;
            mountEl.innerHTML =
                '<div class="solve-panel__loading">Couldn\'t load the solver.<br>Check your connection and try again.</div>';
        };

        const s = document.createElement('script');
        s.src = GM_SRC;
        s.onload = () => {
            if (typeof loadGM !== 'function') return fail();
            loadGM(() => {
                try {
                    mountEl.innerHTML = '';
                    makeCanvas();
                    gmLoaded = true; gmLoading = false;
                    // Don't auto-load the question — only flush an explicitly
                    // requested (queued) load that arrived before GM was ready.
                    if (pendingExprs) loadExpressions(pendingExprs);
                } catch (e) { console.warn('GM init failed:', e); fail(); }
            }, { version: 'latest' });
        };
        s.onerror = fail;
        document.head.appendChild(s);
    }

    // ── Styles ────────────────────────────────────────────────────────────────
    function injectStyles() {
        const css = `
        #solve-fab {
            position: fixed; left: 18px; bottom: 18px; z-index: 9000;
            display: none; align-items: center; gap: .5rem;
            padding: .55rem 1rem .55rem .6rem; cursor: pointer;
            border: var(--border-subtle, 1px solid rgba(42,39,35,.12));
            border-radius: 999px;
            background: var(--surface-primary, #fffdf8); color: var(--ink, #2a2723);
            font-family: var(--font-mono, monospace); font-size: var(--text-mono-sm, .8125rem); font-weight: 600;
            letter-spacing: .01em; box-shadow: var(--shadow-md, 0 4px 11px rgba(42,39,35,.12));
            transition: transform .2s ease, box-shadow .2s ease, opacity .2s ease;
        }
        #solve-fab svg { flex-shrink: 0; }
        #solve-fab:hover  { transform: translateY(-2px); box-shadow: var(--shadow-lg, 0 9px 22px rgba(42,39,35,.14)); }
        #solve-fab:active { transform: translateY(0);    box-shadow: var(--shadow-sm, 0 2px 5px rgba(42,39,35,.1)); }
        #solve-fab.active { opacity: 0; pointer-events: none; transform: scale(.92); }

        #solve-panel {
            position: fixed; inset: 8px; width: auto; height: auto;
            display: flex; flex-direction: column; overflow: hidden;
            background: var(--surface-primary, #fffdf8);
            border: var(--border-subtle, 1px solid rgba(42,39,35,.12));
            border-radius: 16px;
            box-shadow: var(--shadow-xl, 0 18px 40px rgba(42,39,35,.18));
            opacity: 0; transform: translateY(12px) scale(.98); pointer-events: none;
            transition: opacity .2s ease, transform .2s cubic-bezier(.16,1,.3,1);
            z-index: 9000;
        }
        #solve-panel.open { opacity: 1; transform: none; pointer-events: auto; }

        .solve-panel__bar {
            display: flex; align-items: center; justify-content: space-between;
            padding: .55rem .7rem;
            border-bottom: var(--border-subtle, 1px solid rgba(42,39,35,.12));
            background: var(--surface-secondary, #f4f0e8);
            flex-shrink: 0;
        }
        .solve-panel__title {
            font-family: var(--font-mono, monospace); font-size: .78rem; font-weight: 600;
            color: var(--ink, #2a2723); letter-spacing: .01em;
        }
        .solve-panel__actions { display: flex; align-items: center; gap: .4rem; }
        .solve-panel__btn {
            display: inline-flex; align-items: center; gap: .3rem;
            border: var(--border-subtle, 1px solid rgba(42,39,35,.12));
            background: var(--surface-primary, #fffdf8); color: var(--ink, #2a2723);
            border-radius: 10px; padding: .32rem .6rem; cursor: pointer;
            font-family: var(--font-mono, monospace); font-size: .66rem; font-weight: 600;
            box-shadow: var(--shadow-sm, 0 2px 5px rgba(42,39,35,.1));
            transition: transform .12s ease, box-shadow .12s ease;
        }
        .solve-panel__btn:hover  { transform: translateY(-1px); box-shadow: var(--shadow-md, 0 4px 11px rgba(42,39,35,.12)); }
        .solve-panel__btn:active { transform: translateY(0);    box-shadow: var(--shadow-sm); }
        #solve-canvas {
            flex: 1 1 auto; min-height: 0;
            background: var(--surface-primary, #fffdf8);
        }
        .solve-panel__loading {
            display: flex; align-items: center; justify-content: center; height: 100%;
            font-family: var(--font-mono, monospace); font-size: .74rem;
            color: var(--text-secondary, #6b655c); text-align: center; padding: 1rem;
        }
        .solve-panel__hint {
            margin: 0; padding: .4rem .85rem;
            border-top: var(--border-subtle, 1px solid rgba(42,39,35,.12));
            font-family: var(--font-mono, monospace); font-size: .6rem; line-height: 1.4;
            color: var(--text-secondary, #6b655c); flex-shrink: 0;
        }
        [data-theme="dark"] #solve-canvas { filter: invert(1) hue-rotate(180deg); }

        /* ── Question overlay (floats over the canvas, draggable) ── */
        #solve-q-overlay {
            position: absolute; top: 54px; right: 14px; left: auto;
            width: min(360px, 60%); max-height: calc(100% - 132px);
            display: flex; flex-direction: column; overflow: hidden;
            background: var(--surface-primary, #fffdf8);
            border: var(--border-subtle, 1px solid rgba(42,39,35,.12));
            border-radius: 14px;
            box-shadow: var(--shadow-lg, 0 9px 22px rgba(42,39,35,.14));
            z-index: 5;
        }
        #solve-q-overlay.hidden { display: none; }
        .solve-q__head {
            display: flex; align-items: center; justify-content: space-between; gap: .5rem;
            padding: .4rem .4rem .4rem .65rem; cursor: grab; touch-action: none;
            background: var(--surface-secondary, #f4f0e8);
            border-bottom: var(--border-subtle, 1px solid rgba(42,39,35,.12));
            flex-shrink: 0;
        }
        .solve-q__head:active { cursor: grabbing; }
        .solve-q__title {
            display: inline-flex; align-items: center; gap: .4rem;
            font-family: var(--font-mono, monospace); font-size: .64rem; font-weight: 700;
            letter-spacing: .04em; text-transform: uppercase; color: var(--ink, #2a2723);
        }
        .solve-q__title svg { width: 13px; height: 13px; flex-shrink: 0; }
        .solve-q__head-btns { display: inline-flex; gap: .25rem; flex-shrink: 0; }
        .solve-q__icon {
            display: inline-flex; align-items: center; justify-content: center;
            width: 22px; height: 22px; border-radius: 7px; cursor: pointer;
            border: var(--border-subtle, 1px solid rgba(42,39,35,.12));
            background: var(--surface-primary, #fffdf8); color: var(--ink, #2a2723);
        }
        .solve-q__icon:hover { background: var(--surface-secondary, #f4f0e8); }
        .solve-q__icon svg { width: 11px; height: 11px; }
        #solve-q-overlay.min .solve-q__min svg { transform: rotate(180deg); }
        .solve-q__body {
            padding: .7rem .85rem; overflow: auto; min-height: 0;
            font-family: var(--font-mono, monospace); font-size: .8rem; line-height: 1.55;
            color: var(--ink, #2a2723);
        }
        #solve-q-overlay.min .solve-q__body { display: none; }
        .solve-q__img { margin: .55rem 0; display: flex; justify-content: center; }
        .solve-q__img svg, .solve-q__img img { max-width: 100%; max-height: 190px; height: auto; }
        .solve-q__opts { margin-top: .55rem; }
        .solve-q__opts .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .35rem; }
        .solve-q__opts .option-btn {
            padding: .35rem .5rem; font-size: .68rem; box-shadow: none !important;
            transform: none !important; cursor: pointer;
        }
        .solve-q__opts .hint-row, .solve-q__opts .hint-lbl, .solve-q__opts .hint-body { display: none !important; }

        /* Admin expression editor — a curation strip above the canvas. */
        #solve-expr-editor {
            position: absolute; top: 50px; left: 14px; right: 14px; z-index: 6;
            display: flex; flex-direction: column; gap: .5rem;
            padding: .7rem .8rem; border-radius: 12px;
            background: var(--surface-primary, #fffdf8);
            border: var(--border-subtle, 1px solid rgba(42,39,35,.12));
            box-shadow: var(--shadow-lg, 0 9px 22px rgba(42,39,35,.14));
        }
        #solve-expr-editor[hidden] { display: none; }
        .solve-expr__head {
            font-family: var(--font-mono, monospace); font-size: .64rem; font-weight: 700;
            color: var(--ink, #2a2723); display: flex; align-items: center; gap: .5rem;
        }
        .solve-expr__tag {
            font-size: .54rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
            padding: .1rem .4rem; border-radius: 999px;
            background: var(--accent-success, #6db58f); color: var(--text-on-accent, #fff);
        }
        .solve-expr__input {
            width: 100%; resize: vertical; font-family: var(--font-mono, monospace); font-size: .8rem;
            line-height: 1.5; padding: .5rem .6rem; border-radius: 9px;
            border: var(--border-subtle, 1px solid rgba(42,39,35,.12));
            background: var(--surface-secondary, #f4f0e8); color: var(--ink, #2a2723);
        }
        .solve-expr__btns { display: flex; gap: .4rem; justify-content: flex-end; }

        @media (max-width: 600px) {
            #solve-panel { inset: 4px; border-radius: 12px; }
            #solve-q-overlay { width: calc(100% - 28px); max-height: 46%; }
        }
        @media print { #solve-fab, #solve-panel { display: none !important; } }`;

        const style = document.createElement('style');
        style.id = 'solve-tool-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ── Build DOM ─────────────────────────────────────────────────────────────
    function buildUI() {
        injectStyles();

        btn = document.createElement('button');
        btn.id = 'solve-fab';
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Open the Graspable Math solver');
        btn.innerHTML = MATH_ICON + '<span>Solve</span>';
        btn.addEventListener('click', togglePanel);
        document.body.appendChild(btn);

        panel = document.createElement('div');
        panel.id = 'solve-panel';

        const closeSVG =
            '<svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" ' +
            'stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
            '<path d="M1 1l10 10M11 1L1 11"/></svg>';
        const docSVG =
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>';
        const chevSVG =
            '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" ' +
            'stroke-linecap="round" aria-hidden="true"><path d="M2 8l4-4 4 4"/></svg>';
        const prevSVG =
            '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" ' +
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.5 2L3.5 6l4 4"/></svg>';
        const nextSVG =
            '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" ' +
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 2l4 4-4 4"/></svg>';

        panel.innerHTML =
            '<div class="solve-panel__bar">' +
                '<span class="solve-panel__title">Graspable Math · Scratchpad</span>' +
                '<div class="solve-panel__actions">' +
                    '<button type="button" id="solve-q-toggle" class="solve-panel__btn">Question</button>' +
                    '<button type="button" id="solve-load"  class="solve-panel__btn">Load Q</button>' +
                    '<button type="button" id="solve-edit" class="solve-panel__btn" style="display:none">Edit exp</button>' +
                    '<button type="button" id="solve-reset" class="solve-panel__btn">Clear</button>' +
                    '<button type="button" id="solve-close" class="solve-panel__btn" aria-label="Close">' + closeSVG + '</button>' +
                '</div>' +
            '</div>' +
            '<div id="solve-canvas"></div>' +
            '<div id="solve-expr-editor" class="solve-expr" hidden>' +
                '<div class="solve-expr__head">Enter the expression(s) to save for this question <span class="solve-expr__tag">admin</span></div>' +
                '<textarea id="solve-expr-input" class="solve-expr__input" rows="3" spellcheck="false" placeholder="One per line, e.g.\n3x + 5 = 20"></textarea>' +
                '<div class="solve-expr__btns">' +
                    '<button type="button" id="solve-expr-save" class="solve-panel__btn">Save & load</button>' +
                    '<button type="button" id="solve-expr-cancel" class="solve-panel__btn">Cancel</button>' +
                '</div>' +
            '</div>' +
            '<div id="solve-q-overlay">' +
                '<div class="solve-q__head" id="solve-q-head">' +
                    '<span class="solve-q__title">' + docSVG + '<span id="solve-q-count">Question</span></span>' +
                    '<span class="solve-q__head-btns">' +
                        '<button type="button" id="solve-q-prev" class="solve-q__icon" aria-label="Previous question">' + prevSVG + '</button>' +
                        '<button type="button" id="solve-q-next" class="solve-q__icon" aria-label="Next question">' + nextSVG + '</button>' +
                        '<button type="button" id="solve-q-min"  class="solve-q__icon" aria-label="Minimize question">' + chevSVG + '</button>' +
                        '<button type="button" id="solve-q-hide" class="solve-q__icon" aria-label="Hide question">' + closeSVG + '</button>' +
                    '</span>' +
                '</div>' +
                '<div class="solve-q__body" id="solve-q-body"></div>' +
            '</div>' +
            '<p class="solve-panel__hint">' +
                'The question floats on the canvas — drag its header to move it · ' +
                '<strong>Load Q</strong> refreshes · <strong>Insert (+)</strong> adds expressions, graphs, images, or video.' +
            '</p>';

        document.body.appendChild(panel);
        mountEl = panel.querySelector('#solve-canvas');

        panel.querySelector('#solve-close').addEventListener('click', () => setOpen(false));
        panel.querySelector('#solve-load').addEventListener('click', () => {
            renderQuestionOverlay();
            loadForCurrentQuestion();
        });
        panel.querySelector('#solve-reset').addEventListener('click', resetCanvas);
        panel.querySelector('#solve-edit').addEventListener('click', onEditClicked);
        panel.querySelector('#solve-expr-save').addEventListener('click', onSaveExpr);
        panel.querySelector('#solve-expr-cancel').addEventListener('click', hideEditor);
        panel.addEventListener('keydown', e => e.stopPropagation());

        const overlay = panel.querySelector('#solve-q-overlay');
        panel.querySelector('#solve-q-toggle').addEventListener('click', () => overlay.classList.toggle('hidden'));
        panel.querySelector('#solve-q-min').addEventListener('click', (e) => { e.stopPropagation(); overlay.classList.toggle('min'); });
        panel.querySelector('#solve-q-hide').addEventListener('click', (e) => { e.stopPropagation(); overlay.classList.add('hidden'); });
        panel.querySelector('#solve-q-prev').addEventListener('click', (e) => { e.stopPropagation(); gotoQuestion(-1); });
        panel.querySelector('#solve-q-next').addEventListener('click', (e) => { e.stopPropagation(); gotoQuestion(1); });
        makeDraggable(overlay, panel.querySelector('#solve-q-head'));
    }

    // Mirror the current question (prompt + figure + options) into the overlay,
    // reusing the quiz's already-rendered DOM so the math stays typeset.
    function renderQuestionOverlay() {
        const body = document.getElementById('solve-q-body');
        const countEl = document.getElementById('solve-q-count');
        if (!body) return;
        const cur = currentQuestion();
        if (!cur || !cur.q) { body.innerHTML = '<em style="opacity:.6">No question loaded.</em>'; return; }

        try {
            const st = window.Quiz.getState();
            if (countEl) countEl.textContent = `Q ${cur.idx + 1} / ${st.allQuestions.length}`;
        } catch (_) { if (countEl) countEl.textContent = 'Question'; }

        body.innerHTML = '';
        const grab = (id, cls) => {
            const src = document.getElementById(id);
            if (!src || !src.innerHTML.trim()) return;
            const el = document.createElement('div');
            el.className = cls;
            el.innerHTML = src.innerHTML;
            body.appendChild(el);
        };
        grab('q-text', 'solve-q__text');
        grab('q-image-wrap', 'solve-q__img');
        grab('q-options', 'solve-q__opts');

        // Make the mirrored options answerable: a click drives the matching real
        // quiz option (so the quiz's own selectOption handles state + locking +
        // immediate-mode reveal), then we re-mirror the updated styling.
        const optsEl = body.querySelector('.solve-q__opts');
        if (optsEl) optsEl.addEventListener('click', onOverlayOptionClick);

        // Only typeset if the copy still holds raw delimiters (not yet rendered).
        if (/\\\(|\\\)|\$\$/.test(body.textContent) && window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([body]).catch(() => {});
        }
    }

    // A click on a mirrored option → click the real quiz option at the same
    // index (disabled/locked ones are skipped by the real button), then re-mirror.
    function onOverlayOptionClick(e) {
        const hit = e.target.closest('.option-btn');
        if (!hit) return;
        const i = Array.from(e.currentTarget.querySelectorAll('.option-btn')).indexOf(hit);
        if (i < 0) return;
        const real = document.querySelectorAll('#q-options .option-btn')[i];
        if (real && !real.disabled) {
            real.click();
            setTimeout(renderQuestionOverlay, 0);   // reflect selected / locked state
        }
    }

    // Drag a panel element by a handle, clamped inside #solve-panel.
    function makeDraggable(el, handle) {
        if (!el || !handle) return;
        let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;
        handle.addEventListener('pointerdown', (e) => {
            if (e.target.closest('button')) return;
            dragging = true;
            try { handle.setPointerCapture(e.pointerId); } catch (_) {}
            const r = el.getBoundingClientRect();
            const pr = panel.getBoundingClientRect();
            ox = r.left - pr.left; oy = r.top - pr.top;
            sx = e.clientX; sy = e.clientY;
            el.style.right = 'auto';
        });
        handle.addEventListener('pointermove', (e) => {
            if (!dragging) return;
            const pr = panel.getBoundingClientRect();
            let nx = ox + (e.clientX - sx);
            let ny = oy + (e.clientY - sy);
            nx = Math.max(0, Math.min(nx, pr.width - el.offsetWidth));
            ny = Math.max(0, Math.min(ny, pr.height - el.offsetHeight));
            el.style.left = nx + 'px'; el.style.top = ny + 'px';
        });
        const end = (e) => { dragging = false; try { handle.releasePointerCapture(e.pointerId); } catch (_) {} };
        handle.addEventListener('pointerup', end);
        handle.addEventListener('pointercancel', end);
    }

    // Navigate the quiz from inside the solver (quiz keyboard is suspended while
    // the panel is open, so these arrows are how you move between questions).
    function gotoQuestion(delta) {
        const q = window.Quiz;
        if (q && typeof q.navigate === 'function') q.navigate(delta);
    }

    // ── Panel state ───────────────────────────────────────────────────────────
    function setOpen(open) {
        if (!panel) return;
        panel.classList.toggle('open', open);
        btn.classList.toggle('active', open);
        if (open) {
            ensureGM();
            renderQuestionOverlay();
            hideEditor();
            updateAdminControls();
            // Don't auto-load. If admin + nothing saved, prompt them to curate.
            maybePromptAdmin();
        }
    }

    function togglePanel() { setOpen(!panel.classList.contains('open')); }

    // ── Entry point ───────────────────────────────────────────────────────────
    function onQuestionRendered() {
        updateFabVisibility();
        if (panel && panel.classList.contains('open')) {
            renderQuestionOverlay();
            updateAdminControls();
            maybePromptAdmin();
        }
    }
    function init() {
        buildUI();
        updateFabVisibility();
        // Re-evaluate whenever the quiz renders a (possibly different-subject)
        // question: refresh the overlay and FAB visibility as the learner moves.
        window.addEventListener('quiz:questionRendered', onQuestionRendered);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
