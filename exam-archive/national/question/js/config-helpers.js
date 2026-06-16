/* ═══════════════════════════════════════════════════════════
   PREP PORTAL — WASSCE Practice Paper
   MODULE 1: Configuration & Utility Helpers
   ═══════════════════════════════════════════════════════════ */

'use strict';

// ── CONFIG ─────────────────────────────────────────────────────
const GEMINI_MODELS = ['gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-1.5-flash'];

// Backend base URL (same rule PrepBot uses: dev Live-Server → local API server).
const API_BASE = window.location.port === '5500' ? 'http://127.0.0.1:5000' : '';

const urlParams = new URLSearchParams(window.location.search);
const PAGE_CONFIG = {
    examType:  urlParams.get('examType')?.toLowerCase() || 'waec',  // ← ADD THIS
    year:      urlParams.get('year'),
    subjects:  urlParams.get('subjects')?.split(',') || [],
    types:     urlParams.get('types')?.split(',')    || [],
    stream:    urlParams.get('stream') || '',  // Also add stream while you're at it
    // source=aloc → load from the Firestore-backed /api/questions endpoint
    // instead of the static per-folder scripts. `n`/`limit` = questions per subject.
    source:    (urlParams.get('source') || '').toLowerCase(),
    limit:     parseInt(urlParams.get('n') || urlParams.get('limit') || '20', 10) || 20,
    // feedback=on → reveal the correct answer + explanation the instant a
    // learner picks an option (the question then locks), instead of only at submit.
    immediate: (urlParams.get('feedback') || '').toLowerCase() === 'on',
    // SAT (source=sat): which section to pull and an optional difficulty filter.
    difficulty: (urlParams.get('difficulty') || '').toLowerCase(),
    // competition-specific params
    comp:      urlParams.get('comp')    || '',
    div:       urlParams.get('div')     || '',
    round:     urlParams.get('round')   || '',
    section:   urlParams.get('section') || 'all'
};

// Debug log to confirm
console.log('=== PAGE_CONFIG LOADED ===');
console.log('Exam Type:', PAGE_CONFIG.examType);
console.log('Year:', PAGE_CONFIG.year);
console.log('Subjects:', PAGE_CONFIG.subjects);
console.log('Types:', PAGE_CONFIG.types);
console.log('Stream:', PAGE_CONFIG.stream);

// ── HELPERS ────────────────────────────────────────────────────
function esc(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;');
}

function geminiKey() {
    return window.PrepPortalKeys?.gemini || window.state?.GEMINI_KEY || null;
}

function ytKey() {
    return window.PrepPortalKeys?.youtube || window.state?.YT_KEY || null;
}

function typesetEl(el) {
    if (!el || typeof MathJax === 'undefined' || !MathJax.typesetPromise) return Promise.resolve();
    MathJax.typesetClear([el]);
    return MathJax.typesetPromise([el]).catch(() => {});
}

function injectScript(src) {
    return new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = src; s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
    });
}