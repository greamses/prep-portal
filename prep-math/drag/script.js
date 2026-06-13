/**
 * Prep Portal — Algebra Lab
 * Fully offline: equations, expressions and inequalities via generator.js.
 * Word-problem topics are filtered out of the UI.
 */

import { TOPICS_BY_CLASS }                         from './modules/topics.js';
import { generateOffline }                         from './modules/generator.js';
import { ppAlert, showStatus, renderTopicChips,
         initCustomDropdown }                      from './modules/ui.js';

// ─── App State ────────────────────────────────────────────────

const appState = {
    classId:       null,
    topic:         null,
    subtopic:      null,
    type:          null,
    method:        'transfer',
    solvedCount:   0,
    currentGoal:   null,
    currentType:   null,
    lastData:      null,
    gmCanvas:      null,
    isGMLoaded:    false,
    layoutManager: null,
};

// ─── GM Canvas Settings ───────────────────────────────────────

const CANVAS_SETTINGS = {
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

const DERIVATION_SETTINGS = {
    h_align: 'center', pos: { x: 'center', y: 'center' },
    keep_in_container: false, draggable: true, no_handles: false,
    collapsed_mode: false, show_bg: false,
};

// ─── Responsive Font Helper ───────────────────────────────────

function getResponsiveFontSettings() {
    const w = window.innerWidth;
    const small = w <= 768, tablet = w <= 1024 && w > 768;
    return {
        mayAdjustCanvasHeight: true,
        minCanvasHeight:       small ? 200 : tablet ? 250 : 300,
        mayAdjustFontSize:     true,
        maxFontSize:           small ? 28  : tablet ? 36  : 50,
        verticallyCenterDerivations: true,
        shouldFitVertically:   true,
    };
}

let _resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(() => {
        if (!appState.gmCanvas) return;
        try {
            const s = getResponsiveFontSettings();
            appState.layoutManager?.updateLayout?.();
            if (s.mayAdjustFontSize && appState.gmCanvas.controller) {
                const fs = appState.gmCanvas.controller.get_font_size();
                if (fs > s.maxFontSize) appState.gmCanvas.controller.set_font_size(s.maxFontSize);
            }
            appState.gmCanvas.view?.update();
        } catch (e) { console.warn('[AlgebraLab] Resize error:', e); }
    }, 250);
});

// ─── DOMContentLoaded ─────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    initCustomDropdown((classId, label) => {
        appState.classId = classId;
        const el = document.getElementById('stat-class');
        if (el) el.innerText = label;

        appState.topic = null;
        appState.subtopic = null;
        appState.type = null;

        // Filter out word problems — fully offline only
        const filtered = { [classId]: (TOPICS_BY_CLASS[classId] || []).filter(g => g.type !== 'word') };

        renderTopicChips(classId, filtered, ({ type, topic, subtopic }) => {
            appState.type     = type;
            appState.topic    = topic;
            appState.subtopic = subtopic;

            const st = document.getElementById('stat-topic');
            if (st) st.innerText = subtopic.length > 30 ? subtopic.slice(0, 28) + '…' : subtopic;
        });
    });

    if (typeof loadGM !== 'undefined') {
        loadGM(() => {
            appState.isGMLoaded = true;
        }, { version: 'latest' });
    }
});

// ─── Generate Question ────────────────────────────────────────

window.generateQuestion = () => {
    if (!appState.classId || !appState.topic || !appState.subtopic) {
        ppAlert('Please select a class level, topic, and subtopic first.', 'warn');
        return;
    }
    if (!appState.isGMLoaded) {
        ppAlert('The math canvas is still loading. Try again in a moment.', 'info');
        return;
    }

    const { type, topic, subtopic, classId, method } = appState;
    const genBtn = document.getElementById('gen-btn');
    if (genBtn) { genBtn.classList.add('loading'); genBtn.disabled = true; }

    const typeLabel = type === 'expression' ? 'expression' : type === 'inequality' ? 'inequality' : 'equation';
    showStatus(`Generating ${typeLabel}…`, 'info');

    let data;
    try {
        data = generateOffline(type, topic, subtopic, classId, method);
        showStatus(`${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} ready — ${topic}`, 'info');
    } catch (err) {
        console.error('[AlgebraLab] Generation error:', err);
        showStatus(`Generation failed: ${err.message}`, 'error');
        if (genBtn) { genBtn.classList.remove('loading'); genBtn.disabled = false; }
        return;
    }

    openOverlay(data);
    if (genBtn) { genBtn.classList.remove('loading'); genBtn.disabled = false; }
};

// Re-open overlay with last question (used by the FAB button)
window.openOverlay = () => {
    if (appState.lastData) {
        _mountOverlay(appState.lastData);
    } else {
        window.generateQuestion();
    }
};

// ─── Overlay ─────────────────────────────────────────────────

function openOverlay(data) {
    appState.lastData = data;
    _mountOverlay(data);
}

function _mountOverlay(data) {
    const overlay = document.getElementById('fs-overlay');
    const hintEl  = document.getElementById('fs-hint-text');
    const wpBtn   = document.getElementById('wp-modal-btn');
    const doneBtn = document.getElementById('fs-mark-done-btn');
    const wpText  = document.getElementById('wp-modal-text');
    const canvasEl = document.getElementById('gm-fs-canvas');

    document.querySelector('.site-nav')?.style.setProperty('display', 'none');
    overlay.classList.add('open');
    overlay.style.pointerEvents = 'auto';
    appState.currentType = data.type;

    closeWordProblemModal();
    restoreCanvas();
    canvasEl.innerHTML = '';

    wpBtn.style.display  = data.type === 'word' ? 'inline-flex' : 'none';
    doneBtn.style.display = (data.type === 'expression' || data.type === 'inequality') ? 'inline-flex' : 'none';

    hintEl.innerText = data.hint || '';

    if (data.type === 'word') {
        wpText.textContent = data.problem;
        appState.currentGoal = null;
        openWordProblemModal();
        mountBlankCanvas();
    } else if (data.type === 'expression') {
        appState.currentGoal = null;
        mountExpressionCanvas(data.eq);
    } else if (data.type === 'inequality') {
        appState.currentGoal = null;
        mountInequalityCanvas(data.eq, data.hint, data.fullInequality);
    } else {
        appState.currentGoal = data.goal.replace(/\s/g, '');
        mountEquationCanvas(data.eq, appState.currentGoal);
    }
}

window.closeOverlay = () => {
    const overlay = document.getElementById('fs-overlay');
    overlay.classList.remove('open');
    overlay.style.pointerEvents = 'none';
    document.querySelector('.site-nav')?.style.removeProperty('display');
    closeWordProblemModal();
    restoreCanvas();
};

// ─── Canvas Mounting ──────────────────────────────────────────

function mountBlankCanvas() {
    const rs = getResponsiveFontSettings();
    appState.gmCanvas = new gmath.Canvas('#gm-fs-canvas', CANVAS_SETTINGS);
    if (rs.mayAdjustFontSize) appState.gmCanvas.controller.set_font_size(Math.min(40, rs.maxFontSize));
}

function mountExpressionCanvas(eq) {
    const rs = getResponsiveFontSettings();
    appState.gmCanvas = new gmath.Canvas('#gm-fs-canvas', CANVAS_SETTINGS);
    if (rs.mayAdjustFontSize) appState.gmCanvas.controller.set_font_size(Math.min(40, rs.maxFontSize));
    appState.gmCanvas.model.createElement('derivation', { eq, ...DERIVATION_SETTINGS });
    _applyLayout(rs);
}

function mountEquationCanvas(eq, goalAscii) {
    const rs = getResponsiveFontSettings();
    appState.gmCanvas = new gmath.Canvas('#gm-fs-canvas', CANVAS_SETTINGS);
    if (rs.mayAdjustFontSize) appState.gmCanvas.controller.set_font_size(Math.min(40, rs.maxFontSize));

    const derivation = appState.gmCanvas.model.createElement('derivation', { eq, ...DERIVATION_SETTINGS });
    _applyLayout(rs);

    if (goalAscii) {
        derivation.events.on('change', () => {
            const cur = derivation.getLastModel().to_ascii().replace(/\s/g, '');
            if (cur === goalAscii) handleSuccess();
        });
    }
}

function mountInequalityCanvas(eq, hint, fullInequality) {
    const rs = getResponsiveFontSettings();
    let rawString = fullInequality || eq;
    let safeEq = rawString
        .replace(/≤/g, ' <= ')
        .replace(/≥/g, ' >= ')
        .replace(/\\leq?/gi, ' <= ')
        .replace(/\\geq?/gi, ' >= ')
        .replace(/&le;/gi, ' <= ')
        .replace(/&ge;/gi, ' >= ');

    appState.gmCanvas = new gmath.Canvas('#gm-fs-canvas', CANVAS_SETTINGS);
    if (rs.mayAdjustFontSize) appState.gmCanvas.controller.set_font_size(Math.min(40, rs.maxFontSize));
    appState.gmCanvas.model.createElement('derivation', { eq: safeEq, ...DERIVATION_SETTINGS });
    _applyLayout(rs);

    const hintEl = document.getElementById('fs-hint-text');
    if (hintEl && fullInequality) {
        hintEl.innerHTML = `<strong>Inequality:</strong> ${fullInequality}<br><br>${hint}`;
    }
}

function _applyLayout(rs) {
    try {
        const result = gmath.autoLayout.autoLayoutCanvasForOutlier(appState.gmCanvas, rs);
        appState.layoutManager = result?.updateLayout ? result : { updateLayout: () => appState.gmCanvas?.view?.update() };
    } catch {
        appState.layoutManager = { updateLayout: () => appState.gmCanvas?.view?.update() };
    }
    setTimeout(() => appState.layoutManager?.updateLayout?.() ?? appState.gmCanvas?.view?.update(), 100);
}

function handleSuccess() {
    const wrap = document.getElementById('fs-canvas-wrap');
    wrap.classList.add('solved');
    appState.solvedCount++;
    document.getElementById('stat-count').innerText = appState.solvedCount;
    setTimeout(() => {
        wrap.classList.remove('solved');
        ppAlert(`That's ${appState.solvedCount} solved. Keep going!`, 'success');
    }, 900);
}

function restoreCanvas() {
    const wrap = document.getElementById('fs-canvas-wrap');
    const btn  = document.getElementById('fs-canvas-toggle-btn');
    wrap?.classList.remove('canvas-hidden');
    btn?.classList.remove('canvas-off');
    if (btn) btn.title = 'Hide canvas';
}

window.toggleCanvas = () => {
    const wrap = document.getElementById('fs-canvas-wrap');
    const btn  = document.getElementById('fs-canvas-toggle-btn');
    const hiding = !wrap.classList.contains('canvas-hidden');
    wrap.classList.toggle('canvas-hidden', hiding);
    btn?.classList.toggle('canvas-off', hiding);
    if (btn) btn.title = hiding ? 'Show canvas' : 'Hide canvas';
};

// ─── Word Problem Modal ───────────────────────────────────────

function openWordProblemModal() {
    const modal  = document.getElementById('wp-modal');
    const card   = document.getElementById('wp-modal-card');
    const minBtn = document.getElementById('wp-minimize-btn');
    card?.classList.remove('minimized');
    minBtn?.classList.remove('is-minimized');
    modal?.classList.add('open');
}

window.closeWordProblemModal = () => {
    const modal  = document.getElementById('wp-modal');
    const card   = document.getElementById('wp-modal-card');
    const minBtn = document.getElementById('wp-minimize-btn');
    modal?.classList.remove('open');
    card?.classList.remove('minimized');
    minBtn?.classList.remove('is-minimized');
};

window.toggleWordProblemModal = () => {
    document.getElementById('wp-modal')?.classList.contains('open')
        ? closeWordProblemModal()
        : openWordProblemModal();
};

window.minimizeWordProblemModal = () => {
    const card   = document.getElementById('wp-modal-card');
    const minBtn = document.getElementById('wp-minimize-btn');
    const isMin  = card?.classList.toggle('minimized');
    minBtn?.classList.toggle('is-minimized', isMin);
};

window.markSolvedFromModal = () => { closeWordProblemModal(); handleSuccess(); };
window.markExpressionDone  = () => handleSuccess();
