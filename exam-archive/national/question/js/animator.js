/* ═══════════════════════════════════════════════════════════
   PREP PORTAL — Math Animator ("Watch solution")
   ───────────────────────────────────────────────────────────
   A short animated walkthrough of the question the learner just
   answered — shown in the feedback strip so the teaching happens
   where they are, not on a separate page.

   • Appears as a "Watch solution" button in the feedback actions on
     science questions, once the answer is revealed (immediate mode or
     after submit).
   • TERMS PHYSICALLY MOVE. Each equation state is rendered with
     MathJax, then we FLIP-animate every shared term from its previous
     position to its new one — so a "+3" literally slides across the
     "=" and becomes "-3" (manim's TransformMatchingTex idea, done with
     the page's own MathJax — no external engine, nothing to load).
       – Linear equations  ax + b = c  →  a clean generated step chain.
       – Other questions   →  the chain of equations pulled out of the
         worked explanation, morphed in order.
       – Pure-prose explanations (no equations) → revealed step by step.

   Exposes window.MathAnimator = { mountButton, canAnimate, open }.
   ═══════════════════════════════════════════════════════════ */

'use strict';

(function () {
    const SCIENCE_RE = /\b(math|maths|mathematics|further\s*math|physics|chemistry)\b/i;
    const isScience = (subj) => SCIENCE_RE.test(subj || '');
    const STEP_MS = 2400;   // pause between solution steps (time to read the pen note)
    const SVGNS = 'http://www.w3.org/2000/svg';

    const PLAY_ICON =
        '<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">' +
        '<path d="M2 1.5v9l8-4.5z"/></svg>';

    // ── Detect a pure linear equation ax + b = c ────────────────────────
    function cleanCandidate(s) {
        return (s || '')
            .replace(/\\left|\\right/g, '').replace(/\\[,;!:]/g, '')
            .replace(/\\cdot|\\times/g, '*').replace(/[$]/g, '')
            .replace(/\\\(|\\\)|\\\[|\\\]/g, '').replace(/−/g, '-')
            .replace(/\s+/g, '');
    }
    function findLinear(q) {
        if (!q) return null;
        const texts = [];
        const pats = [/\$([^$]+)\$/g, /\\\(([\s\S]+?)\\\)/g, /\\\[([\s\S]+?)\\\]/g];
        pats.forEach(re => { let m; while ((m = re.exec(q.question || ''))) texts.push(m[1]); });
        for (const t of texts) {
            const c = cleanCandidate(t);
            if (/[\^/]|\\/.test(c)) continue;
            if ((c.match(/x/g) || []).length !== 1) continue;
            const m = c.match(/^([+-]?\d*)x([+-]\d+)?=([+-]?\d+)$/);
            if (!m) continue;
            let a = m[1];
            a = (a === '' || a === '+') ? 1 : (a === '-' ? -1 : parseInt(a, 10));
            const b = m[2] ? parseInt(m[2], 10) : 0;
            const cc = parseInt(m[3], 10);
            if (a && !isNaN(cc)) return { a, b, c: cc };
        }
        return null;
    }
    // Clean LaTeX step chain for ax + b = c.
    function linearStates(a, b, c) {
        const ax = (a === 1 ? '' : a === -1 ? '-' : a) + 'x';
        const sgn = (n) => (n < 0 ? '- ' + Math.abs(n) : '+ ' + n);
        const states = [];
        if (b !== 0) {
            states.push(`${ax} ${sgn(b)} = ${c}`);
            states.push(`${ax} = ${c} ${sgn(-b)}`);
            states.push(`${ax} = ${c - b}`);
        } else {
            states.push(`${ax} = ${c}`);
        }
        if (a !== 1) {
            states.push(`x = \\frac{${c - b}}{${a}}`);
            const v = (c - b) / a;
            states.push(`x = ${Number.isInteger(v) ? v : +v.toFixed(3)}`);
        }
        return states;
    }

    // ── Pull a chain of equations out of a question + its explanation ───
    function mathSegments(str) {
        const out = [];
        const re = /\\\(([\s\S]+?)\\\)|\\\[([\s\S]+?)\\\]|\$([^$\n]+?)\$/g;
        let m;
        while ((m = re.exec(str || ''))) out.push((m[1] || m[2] || m[3]).trim());
        return out;
    }
    function explanationLines(q) {
        if (!q || !q.explanation) return [];
        const arr = Array.isArray(q.explanation) ? q.explanation : String(q.explanation).split('\n');
        return arr.map(s => (s || '').trim()).filter(Boolean);
    }
    // Never put two equations on the same line: when a line carries more than
    // one piece of inline/display math, break it before each math span so each
    // equation (with the text that introduces it) gets its own line.
    function splitEqLines(lines) {
        const reMath = /\$[^$]+\$|\\\([\s\S]+?\\\)|\\\[[\s\S]+?\\\]/g;
        const out = [];
        (lines || []).forEach((line) => {
            const spans = [];
            let m;
            while ((m = reMath.exec(line))) spans.push(m.index);
            if (spans.length <= 1) { out.push(line); return; }
            // Break points: the start of every math span except the first.
            const breaks = [0, ...spans.slice(1), line.length];
            for (let i = 0; i < breaks.length - 1; i++) {
                const seg = line.slice(breaks[i], breaks[i + 1]).trim();
                if (seg) out.push(seg);
            }
        });
        return out;
    }
    function extractEqStates(q) {
        const segs = [];
        mathSegments(q.question || '').forEach(s => segs.push(s));
        explanationLines(q).forEach(l => mathSegments(l).forEach(s => segs.push(s)));
        const eqs = segs.filter(s => /=/.test(s) && s.length <= 90);
        const uniq = [];
        eqs.forEach(s => { if (uniq[uniq.length - 1] !== s) uniq.push(s); });
        return uniq.slice(0, 7);
    }

    function buildScene(q) {
        const lin = findLinear(q);
        if (lin) return { kind: 'morph', states: linearStates(lin.a, lin.b, lin.c) };
        const ex = extractEqStates(q);
        if (ex.length >= 2) return { kind: 'morph', states: ex };
        return { kind: 'steps', lines: splitEqLines(explanationLines(q)) };
    }

    // Available for EVERY exam now (not just science): a question can be
    // "watched" if it ships authored animation steps, resolves to a linear
    // equation, yields a chain of equation states, or has any worked
    // explanation we can reveal line by line.
    function canAnimate(q) {
        if (!q) return false;
        if (Array.isArray(q.steps) && q.steps.length >= 2) return true;
        if (findLinear(q)) return true;
        if (extractEqStates(q).length >= 2) return true;
        return explanationLines(q).length > 0;
    }

    // ── Icons for the transport controls ────────────────────────────────
    const ICON_PREV = '<svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.5 2L3.5 6l4 4"/></svg>';
    const ICON_NEXT = '<svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 2l4 4-4 4"/></svg>';
    const ICON_RESTART = '<svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.2 6a3.8 3.8 0 1 0 1.2-2.75"/><path d="M3 1.4v2.2h2.2"/></svg>';
    const ICON_PAUSE = '<svg width="13" height="13" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M2.5 1.5h2.2v9H2.5zM7.3 1.5h2.2v9H7.3z"/></svg>';
    const ICON_EXPAND = '<svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 1H1v4M9 13h4V9M13 5V1H9M1 9v4h4"/></svg>';
    const ICON_CHAT = '<svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.5 8A1.5 1.5 0 0 1 11 9.5H5L2 12V3.5A1.5 1.5 0 0 1 3.5 2h7A1.5 1.5 0 0 1 12.5 3.5z"/></svg>';

    // ── Modal ───────────────────────────────────────────────────────────
    let overlay, stage, stepsEl, titleEl, hintEl, built = false;
    let autoTimer = null, currentScene = null;
    // Transport state. `mode` is 'morph' (FLIP equation chain) or 'steps'
    // (prose reveal). `cursor` is the index of the last-revealed frame.
    let mode = null, cursor = 0, total = 0, playing = false;
    let rows = [], stepNodes = [];
    let currentQ = null;   // the question currently being watched (for admin curation)
    let btnPrev, btnNext, btnPlay, btnRestart, indicatorEl;
    let adminRow, adminStatus, approveBtn, regenBtn;
    let questionEl, translateEl, expandBtn, discussBtn;   // full-view: question + words→algebra + PrepBot

    // Load the handwriting font + a global "rough" displacement filter once, so
    // pen comments look hand-written and every doodle stroke gets a subtle wobble.
    function injectAssets() {
        if (!document.getElementById('mathanim-font')) {
            const l = document.createElement('link');
            l.id = 'mathanim-font'; l.rel = 'stylesheet';
            l.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap';
            document.head.appendChild(l);
        }
        if (!document.getElementById('mathanim-defs')) {
            const holder = document.createElement('div');
            holder.id = 'mathanim-defs';
            holder.setAttribute('aria-hidden', 'true');
            holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;';
            holder.innerHTML =
                '<svg xmlns="' + SVGNS + '" width="0" height="0"><defs>' +
                '<filter id="anno-rough" x="-20%" y="-20%" width="140%" height="140%">' +
                '<feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="7" result="n"/>' +
                '<feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G"/>' +
                '</filter></defs></svg>';
            document.body.appendChild(holder);
        }
    }

    function injectStyles() {
        const css = `
        #mathanim-overlay {
            position: fixed; inset: 0; z-index: 9500;
            display: flex; align-items: center; justify-content: center;
            padding: 16px; background: rgba(20,18,15,.42);
            -webkit-backdrop-filter: blur(3px); backdrop-filter: blur(3px);
            opacity: 0; pointer-events: none;
            transition: opacity var(--duration-smooth, .2s) var(--ease-default, ease);
        }
        #mathanim-overlay.open { opacity: 1; pointer-events: auto; }
        #mathanim-modal {
            width: min(720px, 96vw); max-height: 90vh; display: flex; flex-direction: column;
            overflow: hidden; background: var(--surface-primary, #fffdf8);
            border: var(--border-subtle, 1px solid rgba(42,39,35,.12)); border-radius: 22px;
            box-shadow: var(--shadow-xl, 0 18px 40px rgba(42,39,35,.16));
            transform: translateY(14px) scale(.98);
            transition: transform var(--duration-smooth, .22s) var(--ease-smooth, cubic-bezier(.16,1,.3,1));
        }
        #mathanim-overlay.open #mathanim-modal { transform: none; }
        .mathanim-bar {
            display: flex; align-items: center; justify-content: space-between; gap: .6rem;
            padding: .7rem .9rem; border-bottom: var(--border-subtle, 1px solid rgba(42,39,35,.12));
            background: var(--surface-secondary, #f4f0e8);
        }
        .mathanim-title { font-family: var(--font-mono, monospace); font-size: var(--text-mono-xs, .75rem); font-weight: 700; letter-spacing: .02em; color: var(--ink, #2a2723); }
        .mathanim-x {
            display: inline-flex; align-items: center; justify-content: center;
            width: 30px; height: 30px; cursor: pointer;
            border: var(--border-subtle, 1px solid rgba(42,39,35,.12)); border-radius: 9px;
            background: var(--surface-primary, #fffdf8); color: var(--ink, #2a2723);
            box-shadow: var(--shadow-sm, 0 2px 5px rgba(42,39,35,.1));
            transition: transform var(--duration-fast,.12s) ease, box-shadow var(--duration-fast,.12s) ease;
        }
        .mathanim-x:hover { transform: translateY(-1px); box-shadow: var(--shadow-md, 0 4px 11px rgba(42,39,35,.12)); }
        .mathanim-bar-actions { display: flex; align-items: center; gap: .4rem; }
        /* "Ask PrepBot" pill in the title bar. */
        .mathanim-pill {
            display: inline-flex; align-items: center; gap: .35rem; cursor: pointer;
            font-family: var(--font-mono, monospace); font-weight: 700; font-size: .64rem;
            padding: .4rem .7rem; border-radius: 999px;
            border: var(--border-subtle, 1px solid rgba(42,39,35,.12));
            background: var(--surface-primary, #fffdf8); color: var(--ink, #2a2723);
            box-shadow: var(--shadow-sm, 0 2px 5px rgba(42,39,35,.1));
            transition: transform var(--duration-fast,.12s) ease, box-shadow var(--duration-fast,.12s) ease;
        }
        .mathanim-pill:hover { transform: translateY(-1px); box-shadow: var(--shadow-md, 0 4px 11px rgba(42,39,35,.12)); }
        .mathanim-body { padding: 1rem; overflow: auto; display: flex; flex-direction: column; gap: .9rem; flex: 1 1 auto; min-height: 0; }
        /* Context column: the question, and (for word problems) the words→algebra map. */
        .mathanim-context { display: flex; flex-direction: column; gap: .7rem; }
        .mathanim-main { display: flex; flex-direction: column; min-width: 0; flex: 1 1 auto; }
        .mathanim-qcard, .mathanim-translate {
            background: var(--surface-secondary, #f4f0e8); border-radius: 12px;
            padding: .7rem .85rem; border: var(--border-subtle, 1px solid rgba(42,39,35,.12));
        }
        .mathanim-qcard { font-size: .92rem; line-height: 1.5; color: var(--ink, #2a2723); }
        .mathanim-qlabel, .mathanim-translate .tr-head {
            display: block; font-family: var(--font-mono, monospace); font-size: .58rem; font-weight: 700;
            letter-spacing: .09em; text-transform: uppercase; color: var(--text-secondary, #6b655c); margin-bottom: .35rem;
        }
        .mathanim-translate { display: flex; flex-direction: column; gap: .4rem; }
        .mathanim-translate[hidden] { display: none; }
        .mathanim-tr-row { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; font-size: .95rem; }
        .mathanim-tr-row .tr-phrase { color: var(--text-secondary, #6b655c); font-style: italic; }
        .mathanim-tr-row .tr-arrow { color: var(--accent-secondary, #e07a5f); font-weight: 700; }
        .mathanim-tr-row .tr-tex { color: var(--ink, #2a2723); }
        .mathanim-tr-row mjx-container { margin: 0 !important; }
        /* Full view: the modal fills the screen and the body becomes two columns. */
        #mathanim-overlay.fullscreen { padding: 0; }
        #mathanim-overlay.fullscreen #mathanim-modal {
            width: 100vw; height: 100vh; max-width: none; max-height: none; border-radius: 0;
        }
        #mathanim-overlay.fullscreen .mathanim-body { flex-direction: row; align-items: stretch; gap: 1.4rem; }
        #mathanim-overlay.fullscreen .mathanim-context { flex: 0 0 38%; max-width: 480px; overflow: auto; }
        #mathanim-overlay.fullscreen #mathanim-stage { max-height: none; height: 100%; }
        @media (max-width: 760px) {
            #mathanim-overlay.fullscreen .mathanim-body { flex-direction: column; }
            #mathanim-overlay.fullscreen .mathanim-context { flex: none; max-width: none; }
        }
        /* The morph stage: a derivation. Each step is its own line, stacked
           top-to-bottom; the next line appears below and its shared terms slide
           down from the line above into place. */
        #mathanim-stage {
            position: relative;
            min-height: 150px; max-height: 48vh;
            display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
            gap: .45rem; overflow-y: auto; scroll-behavior: smooth;
            border-radius: 14px; background: var(--surface-secondary, #f4f0e8);
            padding: 1.2rem .8rem; font-size: clamp(1.05rem, 4.2vw, 1.6rem);
        }
        #mathanim-stage.hidden { display: none; }
        /* Letter-transfer pulse: a token tints to the pen colour as it moves. */
        .eqrow mjx-mi.xfer, .eqrow mjx-mn.xfer, .eqrow mjx-mo.xfer, .eqrow mjx-mtext.xfer {
            animation: xferPulse .85s ease;
        }
        @keyframes xferPulse { 35% { color: var(--accent-secondary, #e07a5f); } }
        /* Pen comment: a handwritten margin note under the line it explains. */
        .pen-note {
            align-self: flex-start;
            display: flex; align-items: flex-start; gap: .3rem;
            margin: -.1rem 0 .15rem 2.1rem; max-width: 92%;
            font-family: 'Caveat', var(--font-display, cursive);
            font-weight: 700; font-size: 1.18rem; line-height: 1.1;
            color: var(--accent-secondary, #e07a5f);
            opacity: 0; transform: translateX(-7px) rotate(-1.5deg);
            animation: penIn .42s cubic-bezier(.16,1,.3,1) forwards;
        }
        @keyframes penIn { to { opacity: 1; transform: rotate(-1.5deg); } }
        .pen-note .pen-doodle { flex: none; margin-top: .12rem; color: var(--accent-secondary, #e07a5f); }
        .pen-note .pen-doodle path { filter: url(#anno-rough); }
        /* The action word — hover/focus shows what the technique means. */
        .pen-term {
            position: relative; cursor: help; outline: none;
            text-decoration: underline dotted currentColor; text-underline-offset: 3px;
        }
        .pen-term::after {
            content: attr(data-def);
            position: absolute; left: 0; bottom: calc(100% + 8px); z-index: 20;
            width: max-content; max-width: 240px;
            font-family: var(--font-mono, monospace); font-weight: 400;
            font-size: .66rem; line-height: 1.4; letter-spacing: 0;
            color: var(--ink, #2a2723); background: var(--surface-primary, #fffdf8);
            border: var(--border-subtle, 1px solid rgba(42,39,35,.12)); border-radius: 10px;
            box-shadow: var(--shadow-lg, 0 9px 22px rgba(42,39,35,.14));
            padding: .5rem .6rem; text-align: left; white-space: normal;
            opacity: 0; transform: translateY(4px); pointer-events: none;
            transition: opacity .14s ease, transform .14s ease;
        }
        .pen-term:hover::after, .pen-term:focus-visible::after, .pen-term:focus::after {
            opacity: 1; transform: translateY(0);
        }
        .eqrow {
            position: relative; display: flex; align-items: center; justify-content: center;
            will-change: opacity; transition: opacity .45s ease;
        }
        .eqrow.settled { opacity: .55; }
        .eqrow mjx-mi, .eqrow mjx-mn, .eqrow mjx-mo, .eqrow mjx-mtext { will-change: transform, opacity; }
        .mathanim-steps { display: none; flex-direction: column; gap: .55rem; font-size: 1.02rem; line-height: 1.55; }
        .mathanim-steps.show { display: flex; }
        .mathanim-step {
            opacity: 0; transform: translateY(8px);
            transition: opacity .4s ease, transform .4s cubic-bezier(.16,1,.3,1);
            padding: .5rem .7rem; border-radius: 10px; background: var(--surface-secondary, #f4f0e8);
        }
        .mathanim-step.in { opacity: 1; transform: none; }
        .mathanim-step mjx-container { margin: 0 !important; }
        .mathanim-ftr {
            display: flex; align-items: center; justify-content: space-between; gap: .6rem;
            flex-wrap: wrap;
            padding: .65rem .9rem; border-top: var(--border-subtle, 1px solid rgba(42,39,35,.12));
        }
        .mathanim-hint { flex: 1 1 140px; font-family: var(--font-mono, monospace); font-size: .62rem; color: var(--text-secondary, #6b655c); }
        /* Transport controls — restart / prev / play-pause / next + indicator. */
        .mathanim-controls { display: flex; align-items: center; gap: .4rem; }
        .mathanim-ctrl {
            display: inline-flex; align-items: center; justify-content: center;
            width: 34px; height: 34px; cursor: pointer;
            border: var(--border-subtle, 1px solid rgba(42,39,35,.12)); border-radius: 10px;
            background: var(--surface-primary, #fffdf8); color: var(--ink, #2a2723);
            box-shadow: var(--shadow-sm, 0 2px 5px rgba(42,39,35,.1));
            transition: transform var(--duration-fast,.12s) ease, box-shadow var(--duration-fast,.12s) ease, opacity var(--duration-fast,.12s) ease;
        }
        .mathanim-ctrl:hover:not(:disabled) { transform: translateY(-1px); box-shadow: var(--shadow-md, 0 4px 11px rgba(42,39,35,.12)); }
        .mathanim-ctrl:active:not(:disabled) { transform: translateY(0); }
        .mathanim-ctrl:disabled { opacity: .38; cursor: default; }
        .mathanim-ctrl--play {
            width: 40px; height: 40px; border: none;
            background: var(--accent-primary, #f4c95d); color: var(--ink, #2a2723);
            box-shadow: var(--shadow-md, 0 4px 11px rgba(42,39,35,.12));
        }
        .mathanim-indicator {
            font-family: var(--font-mono, monospace); font-size: .7rem; font-weight: 700;
            color: var(--text-secondary, #6b655c); min-width: 48px; text-align: center;
            font-variant-numeric: tabular-nums;
        }
        .mathanim-loading {
            display: flex; align-items: center; justify-content: center; width: 100%; min-height: 110px;
            font-family: var(--font-mono, monospace); font-size: .74rem; color: var(--text-secondary, #6b655c);
        }
        .feedback-watch-btn {
            display: inline-flex; align-items: center; gap: .4rem; cursor: pointer;
            font-family: var(--font-mono, monospace); font-weight: 700; font-size: .72rem;
            padding: .42rem .85rem; border-radius: 999px;
            border: var(--border-subtle, 1px solid rgba(42,39,35,.12));
            background: var(--surface-primary, #fffdf8); color: var(--ink, #2a2723);
            box-shadow: var(--shadow-sm, 0 2px 5px rgba(42,39,35,.1));
            transition: transform var(--duration-fast,.12s) ease, box-shadow var(--duration-fast,.12s) ease;
        }
        .feedback-watch-btn:hover { transform: translateY(-1px); box-shadow: var(--shadow-md, 0 4px 11px rgba(42,39,35,.12)); }
        .feedback-watch-btn:active { transform: translateY(0); }
        /* Admin curation row (shown only to the admin). */
        .mathanim-admin {
            display: flex; align-items: center; justify-content: space-between; gap: .6rem;
            flex-wrap: wrap;
            padding: .55rem .9rem; border-top: var(--border-subtle, 1px solid rgba(42,39,35,.12));
            background: var(--surface-secondary, #f4f0e8);
        }
        .mathanim-admin[hidden] { display: none; }
        .mathanim-admin__status { font-family: var(--font-mono, monospace); font-size: .62rem; color: var(--text-secondary, #6b655c); }
        .mathanim-admin__btns { display: flex; gap: .4rem; }
        .mathanim-admin-btn {
            cursor: pointer; font-family: var(--font-mono, monospace); font-weight: 700; font-size: .68rem;
            padding: .42rem .8rem; border-radius: 999px;
            border: var(--border-subtle, 1px solid rgba(42,39,35,.12));
            background: var(--surface-primary, #fffdf8); color: var(--ink, #2a2723);
            box-shadow: var(--shadow-sm, 0 2px 5px rgba(42,39,35,.1));
            transition: transform var(--duration-fast,.12s) ease, box-shadow var(--duration-fast,.12s) ease, opacity .12s ease;
        }
        .mathanim-admin-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: var(--shadow-md, 0 4px 11px rgba(42,39,35,.12)); }
        .mathanim-admin-btn:disabled { opacity: .45; cursor: default; }
        .mathanim-admin-btn--go { background: var(--accent-success, #6db58f); color: var(--text-on-accent, #fff); border: none; }
        @media print { #mathanim-overlay { display: none !important; } }`;
        const style = document.createElement('style');
        style.id = 'mathanim-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    function build() {
        if (built) return;
        injectStyles();
        injectAssets();
        overlay = document.createElement('div');
        overlay.id = 'mathanim-overlay';
        overlay.innerHTML =
            '<div id="mathanim-modal" role="dialog" aria-modal="true" aria-label="Animated solution">' +
                '<div class="mathanim-bar">' +
                    '<span class="mathanim-title" id="mathanim-title">Watch · Solution</span>' +
                    '<div class="mathanim-bar-actions">' +
                        '<button type="button" class="mathanim-pill" id="mathanim-discuss" title="Discuss this with PrepBot">' + ICON_CHAT + '<span>Ask PrepBot</span></button>' +
                        '<button type="button" class="mathanim-x" id="mathanim-expand" title="Full view" aria-label="Expand to full view">' + ICON_EXPAND + '</button>' +
                        '<button type="button" class="mathanim-x" id="mathanim-close" aria-label="Close">' +
                            '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" ' +
                            'stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M1 1l10 10M11 1L1 11"/></svg>' +
                        '</button>' +
                    '</div>' +
                '</div>' +
                '<div class="mathanim-body">' +
                    '<div class="mathanim-context" id="mathanim-context">' +
                        '<div class="mathanim-qcard" id="mathanim-question"></div>' +
                        '<div class="mathanim-translate" id="mathanim-translate" hidden></div>' +
                    '</div>' +
                    '<div class="mathanim-main">' +
                        '<div id="mathanim-stage"></div>' +
                        '<div class="mathanim-steps" id="mathanim-steps"></div>' +
                    '</div>' +
                '</div>' +
                '<div class="mathanim-admin" id="mathanim-admin" hidden>' +
                    '<span class="mathanim-admin__status" id="mathanim-admin-status"></span>' +
                    '<div class="mathanim-admin__btns">' +
                        '<button type="button" class="mathanim-admin-btn" id="mathanim-regen">↻ Regenerate</button>' +
                        '<button type="button" class="mathanim-admin-btn mathanim-admin-btn--go" id="mathanim-approve">✓ Approve &amp; store</button>' +
                    '</div>' +
                '</div>' +
                '<div class="mathanim-ftr">' +
                    '<span class="mathanim-hint" id="mathanim-hint"></span>' +
                    '<div class="mathanim-controls">' +
                        '<button type="button" class="mathanim-ctrl" id="mathanim-restart" title="Restart" aria-label="Restart">' + ICON_RESTART + '</button>' +
                        '<button type="button" class="mathanim-ctrl" id="mathanim-prev" title="Previous step (←)" aria-label="Previous step">' + ICON_PREV + '</button>' +
                        '<span class="mathanim-indicator" id="mathanim-indicator">1 / 1</span>' +
                        '<button type="button" class="mathanim-ctrl mathanim-ctrl--play" id="mathanim-play" title="Play / Pause (space)" aria-label="Play or pause">' + PLAY_ICON + '</button>' +
                        '<button type="button" class="mathanim-ctrl" id="mathanim-next" title="Next step (→)" aria-label="Next step">' + ICON_NEXT + '</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        document.body.appendChild(overlay);

        stage = overlay.querySelector('#mathanim-stage');
        stepsEl = overlay.querySelector('#mathanim-steps');
        titleEl = overlay.querySelector('#mathanim-title');
        hintEl = overlay.querySelector('#mathanim-hint');
        btnPrev = overlay.querySelector('#mathanim-prev');
        btnNext = overlay.querySelector('#mathanim-next');
        btnPlay = overlay.querySelector('#mathanim-play');
        btnRestart = overlay.querySelector('#mathanim-restart');
        indicatorEl = overlay.querySelector('#mathanim-indicator');
        adminRow = overlay.querySelector('#mathanim-admin');
        adminStatus = overlay.querySelector('#mathanim-admin-status');
        approveBtn = overlay.querySelector('#mathanim-approve');
        regenBtn = overlay.querySelector('#mathanim-regen');
        questionEl = overlay.querySelector('#mathanim-question');
        translateEl = overlay.querySelector('#mathanim-translate');
        expandBtn = overlay.querySelector('#mathanim-expand');
        discussBtn = overlay.querySelector('#mathanim-discuss');

        overlay.querySelector('#mathanim-close').addEventListener('click', close);
        expandBtn.addEventListener('click', toggleFullscreen);
        discussBtn.addEventListener('click', discussWithPrepBot);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
        btnPrev.addEventListener('click', () => { pause(); step(-1); });
        btnNext.addEventListener('click', () => { pause(); step(1); });
        btnPlay.addEventListener('click', togglePlay);
        btnRestart.addEventListener('click', restart);
        approveBtn.addEventListener('click', onApprove);
        regenBtn.addEventListener('click', onRegenerate);
        overlay.addEventListener('keydown', (e) => e.stopPropagation());
        // Capture-phase so we intercept arrows/space BEFORE the quiz's own
        // keyboard handler (which would otherwise change questions).
        document.addEventListener('keydown', onKey, true);
        built = true;
    }

    // Keyboard transport. Only active while the modal is open.
    function onKey(e) {
        if (!overlay || !overlay.classList.contains('open')) return;
        switch (e.key) {
            case 'Escape': e.preventDefault(); e.stopPropagation(); close(); break;
            case 'ArrowRight': case 'ArrowDown':
                e.preventDefault(); e.stopPropagation(); pause(); step(1); break;
            case 'ArrowLeft': case 'ArrowUp':
                e.preventDefault(); e.stopPropagation(); pause(); step(-1); break;
            case ' ': case 'Spacebar':
                e.preventDefault(); e.stopPropagation(); togglePlay(); break;
            case 'Home': e.preventDefault(); e.stopPropagation(); restart(); break;
        }
    }

    function clearTimer() { if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; } }
    const typeset = (el) => (window.MathJax && MathJax.typesetPromise) ? MathJax.typesetPromise([el]) : Promise.resolve();
    const tokensOf = (row) => Array.from(row.querySelectorAll('mjx-mi, mjx-mn, mjx-mo, mjx-mtext'));

    function renderRow(latex) {
        const row = document.createElement('div');
        row.className = 'eqrow';
        row.style.opacity = '0';
        row.innerHTML = '\\(' + latex + '\\)';
        stage.appendChild(row);
        return typeset(row).then(() => row);
    }

    // FLIP morph into a stacked derivation: `above` stays put as the previous
    // line; `next` appears below it and each shared term (same tag+glyph) slides
    // from its position in the line above down into place. New terms scale in.
    function morphRows(above, next) {
        const A = tokensOf(above), B = tokensOf(next);
        const ar = A.map(t => t.getBoundingClientRect());
        const br = B.map(t => t.getBoundingClientRect());
        const pool = new Map();
        A.forEach((t, i) => {
            const k = t.tagName + '|' + t.textContent;
            (pool.get(k) || pool.set(k, []).get(k)).push(i);
        });
        // Centre-x of the FIRST "=" in each row, so we can tell which side of
        // the equals a term is on. (Used to detect genuine transpositions.)
        const eqIdxA = A.findIndex(t => t.textContent === '=');
        const eqIdxB = B.findIndex(t => t.textContent === '=');
        const eqAX = eqIdxA >= 0 ? (ar[eqIdxA].left + ar[eqIdxA].right) / 2 : Infinity;
        const eqBX = eqIdxB >= 0 ? (br[eqIdxB].left + br[eqIdxB].right) / 2 : Infinity;

        const moves = [];   // {from, to, el, dx, dy, sideA, sideB}
        next.style.opacity = '1';
        B.forEach((t, j) => {
            const k = t.tagName + '|' + t.textContent;
            const q = pool.get(k);
            if (q && q.length) {
                const i = q.shift();
                const dx = ar[i].left - br[j].left, dy = ar[i].top - br[j].top;
                t.style.transition = 'none';
                t.style.transform = `translate(${dx}px, ${dy}px)`;
                t.dataset.role = 'move';
                moves.push({
                    from: ar[i], to: br[j], el: t, dx, dy,
                    sideA: ar[i].left < eqAX ? 'L' : 'R',
                    sideB: br[j].left < eqBX ? 'L' : 'R',
                });
            } else {
                t.style.transition = 'none';
                t.style.opacity = '0';
                t.style.transform = 'translateY(-6px) scale(.85)';
                t.dataset.role = 'in';
            }
        });

        // Decide which moves earn an arrow. ONLY two cases, so reflow shifts
        // (every token nudging sideways because the line got shorter) don't
        // each sprout an arrow:
        //   1. the term crossed the = sign (transposition), or
        //   2. it was re-ordered among its like terms on the SAME side (CLT).
        ['L', 'R'].forEach((side) => {
            const same = moves.filter(m => m.sideA === side && m.sideB === side);
            if (same.length < 2) return;
            const byFrom = [...same].sort((a, b) => a.from.left - b.from.left);
            const byTo = [...same].sort((a, b) => a.to.left - b.to.left);
            same.forEach((m) => {
                if (byFrom.indexOf(m) !== byTo.indexOf(m) && Math.abs(m.dx) > 24) m._reordered = true;
            });
        });
        moves.forEach((m) => {
            m.isXfer = (m.sideA !== m.sideB) || !!m._reordered;
            if (m.isXfer) { m.el.classList.add('xfer'); m.el._xfer = { dx: m.dx, dy: m.dy }; }
        });
        requestAnimationFrame(() => requestAnimationFrame(() => {
            above.classList.add('settled');   // dim the previous line, keep it visible
            B.forEach((t) => {
                if (t.dataset.role !== 'move') {
                    t.style.transition = 'opacity .4s ease .25s, transform .4s ease .25s';
                    t.style.opacity = '1';
                    t.style.transform = 'none';
                } else if (t._xfer) {
                    // Transfer: arc the term up-and-over so the eye watches it
                    // cross the = , rather than sliding in a flat line.
                    const { dx, dy } = t._xfer;
                    const lift = Math.min(70, Math.hypot(dx, dy) * 0.45) + 16;
                    t._anim = t.animate([
                        { transform: `translate(${dx}px, ${dy}px)` },
                        { transform: `translate(${dx / 2}px, ${dy / 2 - lift}px)`, offset: 0.5 },
                        { transform: 'translate(0, 0)' },
                    ], { duration: 780, delay: 150, easing: 'cubic-bezier(.5,0,.25,1)', fill: 'forwards' });
                    t._anim.onfinish = () => {
                        t.style.transform = 'none';
                        if (t._anim) { try { t._anim.cancel(); } catch (_) {} t._anim = null; }
                    };
                } else {
                    t.style.transition = 'transform .65s cubic-bezier(.22,1,.3,1)';
                    t.style.transform = 'translate(0, 0)';
                }
            });
        }));
        return moves;
    }

    // Strip the inline FLIP styles off a row's tokens so a later forward
    // morph re-measures cleanly (used when stepping backward).
    function resetRowTokens(row) {
        tokensOf(row).forEach((t) => {
            if (t._anim) { try { t._anim.cancel(); } catch (_) {} t._anim = null; }
            t._xfer = null;
            t.style.transition = 'none';
            t.style.transform = 'none';
            t.style.opacity = '1';
            t.classList.remove('xfer');
            delete t.dataset.role;
        });
    }

    // ── Handwritten pen comments ──────────────────────────────────────────
    const PEN_DOODLE =
        '<svg class="pen-doodle" width="22" height="17" viewBox="0 0 22 17" fill="none" aria-hidden="true">' +
        '<path d="M2 2 Q 9 12 17 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M12 13 L17.5 13 L16 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>';

    // Heuristic: classify the algebraic move from state A→B into a short pen
    // comment. Offline, best-effort; returns '' when it can't tell (the caller
    // falls back to a generic word so a note still appears).
    function termsOf(side) {
        if (/[\\{}]/.test(side)) return null;   // has LaTeX structure → skip
        if (!/^[+-]/.test(side)) side = '+' + side;
        return side.match(/[+-][^+-]+/g) || [];
    }
    function describeMove(prev, next) {
        const A = cleanCandidate(prev), B = cleanCandidate(next);
        if (!A || !B || A === B) return '';
        if (/\)\(/.test(B) && !/\)\(/.test(A)) return 'factorise';
        if (/\)\(/.test(A) && !/\)\(/.test(B)) return /=0/.test(B) ? 'set each factor to 0' : 'expand the brackets';
        if (/sqrt/.test(B) && !/sqrt/.test(A)) return 'take the square root';
        const ai = A.indexOf('='), bi = B.indexOf('=');
        if (ai > 0 && bi > 0) {
            const aL = A.slice(0, ai), aR = A.slice(ai + 1);
            const bL = B.slice(0, bi), bR = B.slice(bi + 1);
            // divide both sides by the coefficient:  Nx = M  →  x = …
            const mc = aL.match(/^([+-]?\d+)x$/);
            if (mc && /^x$/.test(bL) && Math.abs(+mc[1]) > 1) return `divide both sides by ${Math.abs(+mc[1])}`;
            // transposition of a constant across the = (sign flips)
            const tA = termsOf(aL), tB = termsOf(bL);
            if (tA && tB) {
                const gone = tA.find(t => /^[+-]\d+$/.test(t) && !tB.includes(t));
                if (gone) {
                    const k = Math.abs(+gone);
                    return gone[0] === '+' ? `subtract ${k} from both sides` : `add ${k} to both sides`;
                }
            }
            // pure arithmetic tidy-up on the right:  11-3 → 8 ,  8/2 → 4
            if (/frac/.test(aR) && /^[+-]?\d+$/.test(bR)) return 'work out the fraction';
            if (/\d[+\-*/]\d/.test(aR) && /^[+-]?\d+(\.\d+)?$/.test(bR)) return 'simplify';
        }
        if (/frac/.test(A) && /^[+-]?\d+(\.\d+)?$/.test(B.replace(/.*=/, ''))) return 'work out the fraction';
        if (/frac/.test(A) && /frac/.test(B)) return 'simplify the fraction';
        return B.length < A.length ? 'simplify' : '';   // generic fallback
    }

    // Canonical "math action" vocabulary. The pen note's action word is made
    // hoverable; the definition here is what shows in the tooltip. (When the AI
    // path is enabled it picks an `action` from these same keys, so hovers stay
    // instant and consistent whether the note is heuristic- or model-authored.)
    const GLOSSARY = {
        simplify: 'Combine like terms or reduce an expression without changing its value.',
        evaluate: 'Work out the numerical value of an expression.',
        substitute: 'Replace a variable with a known value or expression.',
        factorise: 'Rewrite an expression as a product of its factors.',
        expand: 'Multiply out the brackets to remove them.',
        distribute: 'Multiply the term outside the bracket into every term inside.',
        subtract: 'Take the same amount from both sides — the equation stays balanced.',
        add: 'Add the same amount to both sides — the equation stays balanced.',
        divide: 'Divide both sides by the same non-zero number.',
        multiply: 'Multiply both sides by the same number.',
        isolate: 'Get the unknown by itself on one side of the = .',
        'square root': 'Undo a square by taking the root of both sides (remember ±).',
        fraction: 'Reduce or combine the fraction to its simplest form.',
        factor: 'A part of a product; set each one equal to zero to solve.',
    };
    const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    // Wrap the first recognised action word in a hoverable, focusable term.
    function wrapTerms(text) {
        const keys = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);
        for (const k of keys) {
            const re = new RegExp('\\b(' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')\\b', 'i');
            const m = re.exec(text);
            if (m) {
                const def = escAttr(GLOSSARY[k]);
                const span = '<span class="pen-term" tabindex="0" role="note" data-def="' + def +
                    '" title="' + def + '">' + m[0] + '</span>';
                return text.slice(0, m.index) + span + text.slice(m.index + m[0].length);
            }
        }
        return text;
    }

    function addAnno(row, node) { (row._annos || (row._annos = [])).push(node); }
    function clearAnnos(row) {
        if (row && row._annos) { row._annos.forEach(n => n.remove && n.remove()); row._annos = null; }
    }

    // Decorate the transition that just revealed `row`: write the pen comment
    // beneath the new line. (The transferred terms still pulse + arc into place;
    // see morphRows — but we no longer draw arrows, which got too busy.)
    function decorate(row, moves, prevLatex, nextLatex, destIdx) {
        clearAnnos(row);
        const text = (currentScene && currentScene.notes && currentScene.notes[destIdx]) ||
            describeMove(prevLatex, nextLatex);
        if (text) {
            const note = document.createElement('div');
            note.className = 'pen-note';
            // Notes can contain inline math (e.g. "divide by \(2\)"); normalise
            // $...$ to \(...\) and typeset so it renders instead of showing raw.
            const tex = String(text).replace(/\$([^$]+)\$/g, '\\($1\\)');
            note.innerHTML = PEN_DOODLE + '<span>' + wrapTerms(tex) + '</span>';
            stage.insertBefore(note, row.nextSibling);
            addAnno(row, note);
            typeset(note);
        }
    }

    // ── Question + words→algebra context, full view, PrepBot hand-off ─────
    const escHtml = (s) => String(s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Show the question being solved at the top of the view (math typeset).
    function renderQuestion(q) {
        if (!questionEl) return;
        const text = (q && q.question) || '';
        questionEl.innerHTML = '<span class="mathanim-qlabel">Question</span><div class="mathanim-qbody">' + text + '</div>';
        typeset(questionEl);
    }

    // For word problems: render the AI's phrase→algebra translation. Hidden when
    // the scene has no setup (e.g. the question already states the equation).
    function renderTranslation(setup) {
        if (!translateEl) return;
        if (!Array.isArray(setup) || !setup.length) {
            translateEl.hidden = true; translateEl.innerHTML = ''; return;
        }
        let html = '<div class="tr-head">From the words to the maths</div>';
        setup.forEach((s) => {
            const phrase = s.phrase ? '<span class="tr-phrase">' + escHtml(s.phrase) + '</span>' : '';
            const tex = s.tex ? '<span class="tr-tex">\\(' + s.tex + '\\)</span>' : '';
            const arrow = (phrase && tex) ? '<span class="tr-arrow">→</span>' : '';
            html += '<div class="mathanim-tr-row">' + phrase + arrow + tex + '</div>';
        });
        translateEl.innerHTML = html;
        translateEl.hidden = false;
        typeset(translateEl);
    }

    // Grow the modal to a full-screen, two-column view (and back).
    function toggleFullscreen() {
        if (!overlay) return;
        const full = overlay.classList.toggle('fullscreen');
        if (expandBtn) expandBtn.title = full ? 'Exit full view' : 'Full view';
    }

    // Hand the question off to PrepBot for a free-form chat. The current
    // question/answer/explanation are already in PrepBot's system context, so we
    // just open it with a starter prompt tuned to whether it's a word problem.
    function discussWithPrepBot() {
        const pb = window.PrepBot;
        const wordProblem = !!(currentScene && currentScene.setup && currentScene.setup.length);
        const prompt = wordProblem
            ? 'Walk me through how this word problem translates into an equation, then solve it step by step.'
            : 'Walk me through the solution to this question step by step.';
        if (pb && pb.ask) { close(); pb.ask(prompt); }
        else if (pb && pb.open) { close(); pb.open(); }
        else if (discussBtn) {
            discussBtn.disabled = true;
            discussBtn.querySelector('span').textContent = 'PrepBot unavailable';
        }
    }

    // ── Transport engine ─────────────────────────────────────────────────
    // Both modes pre-render every frame, then reveal them one at a time so the
    // learner can drive playback with the buttons or the arrow keys. `cursor`
    // is the highest currently-revealed frame; `step(±1)` moves between frames.
    function prepMorph(states) {
        mode = 'morph';
        stage.classList.remove('hidden');
        stepsEl.classList.remove('show');
        hintEl.textContent = 'Terms slide across the = and the note explains each move — step with ← →.';
        stage.innerHTML = '';
        rows = [];
        // Render all rows (in flow, hidden) so FLIP can measure target slots.
        return states.reduce(
            (p, latex) => p.then(() => renderRow(latex).then((r) => { rows.push(r); })),
            Promise.resolve()
        ).then(() => {
            total = rows.length;
            cursor = 0;
            // Only the first line is in flow; the rest are revealed on demand so
            // there are no blank gaps. They were typeset above, so re-displaying
            // one and measuring it (inside morphRows) gives a valid layout.
            rows.forEach((r, i) => { r.style.display = i === 0 ? '' : 'none'; });
            rows[0].style.opacity = '1';
            updateControls();
        });
    }

    function prepSteps(lines) {
        mode = 'steps';
        stage.classList.add('hidden');
        stepsEl.classList.add('show');
        hintEl.textContent = 'Worked solution — step through with ← →.';
        stepsEl.innerHTML = '';
        stepNodes = lines.map((line) => {
            const d = document.createElement('div');
            d.className = 'mathanim-step';
            d.innerHTML = line;
            stepsEl.appendChild(d);
            return d;
        });
        return typeset(stepsEl).then(() => {
            total = stepNodes.length;
            cursor = 0;
            if (stepNodes[0]) stepNodes[0].classList.add('in');
            updateControls();
        });
    }

    // Reveal the next/previous frame. Returns false at the boundaries.
    function step(dir) {
        if (!total) return false;
        if (dir > 0) {
            if (cursor >= total - 1) return false;
            if (mode === 'morph') {
                const src = cursor, dst = cursor + 1;
                rows[dst].style.display = '';   // back into flow before measuring
                const moves = morphRows(rows[src], rows[dst]);
                // Doodle the transfers + write the pen comment for this move.
                if (currentScene && currentScene.states) {
                    decorate(rows[dst], moves, currentScene.states[src], currentScene.states[dst], dst);
                }
            } else {
                stepNodes[cursor + 1].classList.add('in');
            }
            cursor++;
        } else {
            if (cursor <= 0) return false;
            if (mode === 'morph') {
                clearAnnos(rows[cursor]);   // remove this transition's arrows + note
                rows[cursor].style.opacity = '0';
                rows[cursor].style.display = 'none';
                resetRowTokens(rows[cursor]);
                rows[cursor - 1].classList.remove('settled');
            } else {
                stepNodes[cursor].classList.remove('in');
            }
            cursor--;
        }
        const scroller = mode === 'morph' ? stage : stepsEl;
        scroller.scrollTop = scroller.scrollHeight;
        updateControls();
        return true;
    }

    function restart() {
        pause();
        if (!total) return;
        if (mode === 'morph') {
            rows.forEach((r, i) => {
                clearAnnos(r);
                r.classList.remove('settled');
                r.style.display = i === 0 ? '' : 'none';
                r.style.opacity = i === 0 ? '1' : '0';
                resetRowTokens(r);
            });
        } else {
            stepNodes.forEach((n, i) => n.classList.toggle('in', i === 0));
        }
        cursor = 0;
        const scroller = mode === 'morph' ? stage : stepsEl;
        scroller.scrollTop = 0;
        updateControls();
    }

    function autoTick() {
        if (step(1)) {
            autoTimer = setTimeout(autoTick, STEP_MS);
        } else {
            pause();   // reached the end
        }
    }

    function play() {
        if (cursor >= total - 1) restart();   // replay from the top
        playing = true;
        clearTimer();
        autoTimer = setTimeout(autoTick, 700);
        updateControls();
    }

    function pause() {
        playing = false;
        clearTimer();
        updateControls();
    }

    function togglePlay() { playing ? pause() : play(); }

    function updateControls() {
        if (!indicatorEl) return;
        indicatorEl.textContent = total ? (cursor + 1) + ' / ' + total : '— / —';
        if (btnPrev) btnPrev.disabled = !total || cursor <= 0;
        if (btnNext) btnNext.disabled = !total || cursor >= total - 1;
        if (btnPlay) btnPlay.innerHTML = playing ? ICON_PAUSE : PLAY_ICON;
    }

    // Entry point: prepare the scene, then auto-play it (still fully steppable).
    function playScene(scene) {
        clearTimer();
        playing = false;
        currentScene = scene;
        renderTranslation(scene.setup);   // word→algebra map (no-op when absent)
        let prep;
        if (scene.kind === 'morph' && scene.states.length >= 2) prep = prepMorph(scene.states);
        else if (scene.kind === 'morph') prep = prepSteps(['\\(' + scene.states[0] + '\\)']);
        else prep = prepSteps(scene.lines);
        prep.then(() => { play(); refreshAdmin(); });
    }

    // ── Admin curation: approve the current animation, or regenerate it ───
    // Build the notes array that aligns with currentScene.states (what's shown).
    function collectNotes() {
        const s = (currentScene && currentScene.states) || [];
        const out = [''];
        for (let i = 1; i < s.length; i++) {
            out.push((currentScene.notes && currentScene.notes[i]) || describeMove(s[i - 1], s[i]) || '');
        }
        return out;
    }

    function refreshAdmin() {
        if (!adminRow) return;
        const ss = window.SolutionSteps;
        const morph = mode === 'morph' && total >= 2 && currentScene && currentScene.states;
        if (!ss || !ss.isAdmin || !morph) { adminRow.hidden = true; return; }
        ss.isAdmin().then((ok) => {
            if (!ok || !overlay.classList.contains('open')) { adminRow.hidden = true; return; }
            adminRow.hidden = false;
            const src = (currentScene && currentScene.source) || 'heuristic';
            const authored = src === 'authored';
            const stored = src === 'override';
            approveBtn.style.display = authored ? 'none' : '';
            regenBtn.style.display = authored ? 'none' : '';
            approveBtn.disabled = stored;
            approveBtn.textContent = stored ? '✓ Stored' : '✓ Approve & store';
            regenBtn.disabled = false;
            adminStatus.textContent = 'source: ' + src;
        });
    }

    function onApprove() {
        if (!currentQ || !window.SolutionSteps || !window.SolutionSteps.approve) return;
        approveBtn.disabled = true;
        adminStatus.textContent = 'Storing…';
        window.SolutionSteps.approve(currentQ, currentScene.states, collectNotes(), currentScene.setup || [])
            .then(() => {
                currentScene.source = 'override';
                approveBtn.textContent = '✓ Stored';
                adminStatus.textContent = 'source: override';
            })
            .catch((e) => { approveBtn.disabled = false; adminStatus.textContent = 'Error: ' + e.message; });
    }

    function onRegenerate() {
        if (!currentQ || !window.SolutionSteps || !window.SolutionSteps.regenerate) return;
        regenBtn.disabled = true; approveBtn.disabled = true;
        adminStatus.textContent = 'Regenerating…';
        pause();
        window.SolutionSteps.regenerate(currentQ)
            .then((steps) => {
                if (Array.isArray(steps) && steps.length >= 2) {
                    const scene = { kind: 'morph', states: steps, source: 'ai' };
                    if (steps.notes) scene.notes = steps.notes;
                    if (steps.setup) scene.setup = steps.setup;
                    playScene(scene);   // rebuilds + autoplays + refreshAdmin()
                } else {
                    regenBtn.disabled = false;
                    adminStatus.textContent = 'No steps returned — try again';
                }
            })
            .catch((e) => { regenBtn.disabled = false; adminStatus.textContent = 'Error: ' + e.message; });
    }

    // ── Public API ──────────────────────────────────────────────────────
    function open(q) {
        if (!canAnimate(q)) return;
        build();
        currentQ = q;
        overlay.classList.add('open');
        overlay.classList.remove('fullscreen');   // each open starts compact
        if (expandBtn) expandBtn.title = 'Full view';
        titleEl.textContent = 'Watch · Solution';
        clearTimer();
        playing = false; total = 0; cursor = 0; rows = []; stepNodes = [];
        updateControls();
        if (adminRow) adminRow.hidden = true;
        if (discussBtn) discussBtn.style.display = window.PrepBot ? '' : 'none';
        renderQuestion(q);
        renderTranslation(null);   // cleared until the scene resolves
        stage.classList.remove('hidden'); stepsEl.classList.remove('show');
        stage.innerHTML = '<div class="mathanim-loading">Preparing animation…</div>';
        hintEl.textContent = '';

        const heuristic = buildScene(q);
        heuristic.source = 'heuristic';
        const go = (scene) => {
            titleEl.textContent = scene.kind === 'morph' ? 'Watch · Solving the equation' : 'Watch · Worked solution';
            requestAnimationFrame(() => requestAnimationFrame(() => playScene(scene)));
        };
        // Prefer the structured, animation-ready steps (authored / approved /
        // AI-generated); fall back to the local heuristic if none.
        if (window.SolutionSteps && window.SolutionSteps.get) {
            window.SolutionSteps.get(q)
                .then((steps) => {
                    if (Array.isArray(steps) && steps.length >= 2) {
                        const scene = { kind: 'morph', states: steps, source: steps.source || 'ai' };
                        // Structured steps carry a pen note per state (authored or
                        // AI). They override the offline describeMove() heuristic.
                        if (steps.notes) scene.notes = steps.notes;
                        if (steps.setup) scene.setup = steps.setup;   // word→algebra map
                        go(scene);
                    } else {
                        go(heuristic);
                    }
                })
                .catch(() => go(heuristic));
        } else {
            go(heuristic);
        }
    }
    function close() { playing = false; clearTimer(); if (overlay) overlay.classList.remove('open'); }
    function mountButton(actionsEl, q) {
        if (!actionsEl || !canAnimate(q)) return;
        // Watch-solution is admin-only for now (still being curated). Only mount
        // the button once we've confirmed the signed-in user is an admin. The
        // check is async + cached; the feedback strip may have moved on by the
        // time it resolves, so bail if this actions element is gone.
        const ss = window.SolutionSteps;
        if (!ss || typeof ss.isAdmin !== 'function') return;
        ss.isAdmin().then((ok) => {
            if (!ok || !actionsEl.isConnected) return;
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'feedback-watch-btn';
            b.innerHTML = PLAY_ICON + '<span>Watch solution</span>';
            b.addEventListener('click', () => open(q));
            actionsEl.appendChild(b);
        }).catch(() => {});
    }

    window.MathAnimator = { mountButton, canAnimate, open };
})();
