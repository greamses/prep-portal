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
    const STEP_MS = 1600;   // pause between solution steps

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
        return { kind: 'steps', lines: explanationLines(q) };
    }

    function canAnimate(q) {
        if (!q || !isScience(q.subject)) return false;
        return !!findLinear(q) || explanationLines(q).length > 0;
    }

    // ── Modal ───────────────────────────────────────────────────────────
    let overlay, stage, stepsEl, replayBtn, titleEl, hintEl, built = false;
    let stepTimer = null, currentScene = null;

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
        .mathanim-body { padding: 1rem; overflow: auto; }
        /* The morph stage: equation rows are absolutely stacked & centred so a
           row being replaced and its replacement occupy the same space while
           shared terms slide between them. */
        #mathanim-stage {
            position: relative; min-height: 150px;
            display: flex; align-items: center; justify-content: center;
            border-radius: 14px; background: var(--surface-secondary, #f4f0e8);
            padding: 1.2rem .8rem; font-size: clamp(1.1rem, 4.5vw, 1.7rem);
        }
        #mathanim-stage.hidden { display: none; }
        .eqrow {
            position: absolute; left: 0; right: 0; top: 0; bottom: 0;
            display: flex; align-items: center; justify-content: center; will-change: opacity;
        }
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
            padding: .65rem .9rem; border-top: var(--border-subtle, 1px solid rgba(42,39,35,.12));
        }
        .mathanim-hint { font-family: var(--font-mono, monospace); font-size: .62rem; color: var(--text-secondary, #6b655c); }
        .mathanim-loading {
            display: flex; align-items: center; justify-content: center; width: 100%; min-height: 110px;
            font-family: var(--font-mono, monospace); font-size: .74rem; color: var(--text-secondary, #6b655c);
        }
        .mathanim-replay {
            display: inline-flex; align-items: center; gap: .45rem; cursor: pointer;
            font-family: var(--font-mono, monospace); font-weight: 700; font-size: .76rem;
            padding: .5rem 1rem; border: none; border-radius: 999px;
            background: var(--accent-primary, #f4c95d); color: var(--ink, #2a2723);
            box-shadow: var(--shadow-md, 0 4px 11px rgba(42,39,35,.12));
            transition: transform var(--duration-fast,.12s) ease, box-shadow var(--duration-fast,.12s) ease;
        }
        .mathanim-replay:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg, 0 9px 22px rgba(42,39,35,.14)); }
        .mathanim-replay:active { transform: translateY(0); }
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
        @media print { #mathanim-overlay { display: none !important; } }`;
        const style = document.createElement('style');
        style.id = 'mathanim-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    function build() {
        if (built) return;
        injectStyles();
        overlay = document.createElement('div');
        overlay.id = 'mathanim-overlay';
        overlay.innerHTML =
            '<div id="mathanim-modal" role="dialog" aria-modal="true" aria-label="Animated solution">' +
                '<div class="mathanim-bar">' +
                    '<span class="mathanim-title" id="mathanim-title">Watch · Solution</span>' +
                    '<button type="button" class="mathanim-x" id="mathanim-close" aria-label="Close">' +
                        '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" ' +
                        'stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M1 1l10 10M11 1L1 11"/></svg>' +
                    '</button>' +
                '</div>' +
                '<div class="mathanim-body">' +
                    '<div id="mathanim-stage"></div>' +
                    '<div class="mathanim-steps" id="mathanim-steps"></div>' +
                '</div>' +
                '<div class="mathanim-ftr">' +
                    '<span class="mathanim-hint" id="mathanim-hint"></span>' +
                    '<button type="button" class="mathanim-replay" id="mathanim-replay">' + PLAY_ICON + 'Replay</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(overlay);

        stage = overlay.querySelector('#mathanim-stage');
        stepsEl = overlay.querySelector('#mathanim-steps');
        replayBtn = overlay.querySelector('#mathanim-replay');
        titleEl = overlay.querySelector('#mathanim-title');
        hintEl = overlay.querySelector('#mathanim-hint');

        overlay.querySelector('#mathanim-close').addEventListener('click', close);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
        replayBtn.addEventListener('click', () => currentScene && playScene(currentScene));
        overlay.addEventListener('keydown', (e) => e.stopPropagation());
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.classList.contains('open')) close(); });
        built = true;
    }

    function clearTimer() { if (stepTimer) { clearTimeout(stepTimer); stepTimer = null; } }
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

    // FLIP morph: shared terms (same tag+glyph) slide from their old position to
    // the new one; removed terms fade out, new terms fade/scale in.
    function morphRows(a, b) {
        const A = tokensOf(a), B = tokensOf(b);
        const ar = A.map(t => t.getBoundingClientRect());
        const br = B.map(t => t.getBoundingClientRect());
        const pool = new Map();
        A.forEach((t, i) => {
            const k = t.tagName + '|' + t.textContent;
            (pool.get(k) || pool.set(k, []).get(k)).push(i);
        });
        b.style.opacity = '1';
        B.forEach((t, j) => {
            const k = t.tagName + '|' + t.textContent;
            const q = pool.get(k);
            if (q && q.length) {
                const i = q.shift();
                t.style.transition = 'none';
                t.style.transform = `translate(${ar[i].left - br[j].left}px, ${ar[i].top - br[j].top}px)`;
                t.dataset.role = 'move';
            } else {
                t.style.transition = 'none';
                t.style.opacity = '0';
                t.style.transform = 'scale(.7)';
                t.dataset.role = 'in';
            }
        });
        a.style.transition = 'opacity .35s ease';
        requestAnimationFrame(() => requestAnimationFrame(() => {
            a.style.opacity = '0';
            B.forEach((t) => {
                if (t.dataset.role === 'move') {
                    t.style.transition = 'transform .65s cubic-bezier(.22,1,.3,1)';
                    t.style.transform = 'translate(0, 0)';
                } else {
                    t.style.transition = 'opacity .4s ease .3s, transform .4s ease .3s';
                    t.style.opacity = '1';
                    t.style.transform = 'none';
                }
            });
        }));
        setTimeout(() => { if (a.parentNode) a.remove(); }, 720);
    }

    function playMorph(scene) {
        stage.classList.remove('hidden');
        stepsEl.classList.remove('show');
        hintEl.textContent = 'Watch each term move as the equation is solved.';
        stage.innerHTML = '';
        renderRow(scene.states[0]).then((first) => {
            first.style.opacity = '1';
            let cur = first, i = 1;
            const next = () => {
                if (i >= scene.states.length) return;
                renderRow(scene.states[i]).then((nxt) => {
                    morphRows(cur, nxt);
                    cur = nxt; i++;
                    stepTimer = setTimeout(next, STEP_MS);
                });
            };
            clearTimer();
            stepTimer = setTimeout(next, 1100);
        });
    }

    function playSteps(scene) {
        stage.classList.add('hidden');
        stepsEl.classList.add('show');
        hintEl.textContent = 'Worked solution, step by step.';
        stepsEl.innerHTML = '';
        const nodes = scene.lines.map((line) => {
            const d = document.createElement('div');
            d.className = 'mathanim-step';
            d.innerHTML = line;
            stepsEl.appendChild(d);
            return d;
        });
        typeset(stepsEl).then(() => {
            clearTimer();
            let i = 0;
            const reveal = () => {
                if (i >= nodes.length) return;
                nodes[i].classList.add('in'); i++;
                stepTimer = setTimeout(reveal, 700);
            };
            stepTimer = setTimeout(reveal, 250);
        });
    }

    function playScene(scene) {
        clearTimer();
        currentScene = scene;
        if (scene.kind === 'morph' && scene.states.length >= 2) playMorph(scene);
        else if (scene.kind === 'morph') playSteps({ lines: ['\\(' + scene.states[0] + '\\)'] });
        else playSteps(scene);
    }

    // ── Public API ──────────────────────────────────────────────────────
    function open(q) {
        if (!canAnimate(q)) return;
        build();
        overlay.classList.add('open');
        titleEl.textContent = 'Watch · Solution';
        clearTimer();
        stage.classList.remove('hidden'); stepsEl.classList.remove('show');
        stage.innerHTML = '<div class="mathanim-loading">Preparing animation…</div>';
        hintEl.textContent = '';

        const heuristic = buildScene(q);
        const go = (scene) => {
            titleEl.textContent = scene.kind === 'morph' ? 'Watch · Solving the equation' : 'Watch · Worked solution';
            requestAnimationFrame(() => requestAnimationFrame(() => playScene(scene)));
        };
        // Prefer the structured, animation-ready steps (authored or AI-generated);
        // fall back to the local heuristic (generated linear / explanation) if none.
        if (window.SolutionSteps && window.SolutionSteps.get) {
            window.SolutionSteps.get(q)
                .then((steps) => go(Array.isArray(steps) && steps.length >= 2 ? { kind: 'morph', states: steps } : heuristic))
                .catch(() => go(heuristic));
        } else {
            go(heuristic);
        }
    }
    function close() { clearTimer(); if (overlay) overlay.classList.remove('open'); }
    function mountButton(actionsEl, q) {
        if (!actionsEl || !canAnimate(q)) return;
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'feedback-watch-btn';
        b.innerHTML = PLAY_ICON + '<span>Watch solution</span>';
        b.addEventListener('click', () => open(q));
        actionsEl.appendChild(b);
    }

    window.MathAnimator = { mountButton, canAnimate, open };
})();
