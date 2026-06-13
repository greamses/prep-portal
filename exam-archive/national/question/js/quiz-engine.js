/* ═══════════════════════════════════════════════════════════
   PREP PORTAL — Practice Paper Quiz Engine
   MODULE 3: Quiz Engine - Core quiz functionality with Exam Type Support
   ═══════════════════════════════════════════════════════════ */

'use strict';


const Quiz = (() => {
    
    let allQuestions = [];
    let currentIndex = 0;
    let userAnswers = {};
    let submitted = false;
    let theoryMarks = {};
    
    // ── Helper: Escape HTML ──────────────────────────────────────
    function esc(str) {
        if (!str) return '';
        return String(str).replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) {
            return c;
        });
    }
    
    function typesetEl(el) {
        if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
            MathJax.typesetPromise([el]).catch(e => console.warn('MathJax error:', e));
        }
    }
    
    // ── Answer resolver ──────────────────────────────────────
    function resolveAnswer(q) {
        const opts = q.options || [];
        for (const f of ['correctIndex', 'correct_index', 'answerIndex', 'answer_index']) {
            if (q[f] !== undefined && q[f] !== null) {
                const i = parseInt(q[f], 10);
                if (!isNaN(i) && opts[i] !== undefined) return opts[i];
            }
        }
        const raw = q.answer ?? q.correct ?? q.correctAnswer ??
            q.correctOption ?? q.correct_answer ?? q.key ?? null;
        if (raw === null) return null;
        if (typeof raw === 'number') return opts[raw] ?? null;
        const s = String(raw).trim();
        if (/^[A-Ea-e]$/.test(s)) return opts[s.toUpperCase().charCodeAt(0) - 65] ?? null;
        if (/^\d$/.test(s)) return opts[parseInt(s, 10)] ?? null;
        return s || null;
    }
    
    // ── Gemini API Key Check ──────────────────────────────────────
    function geminiKey() {
        return typeof GEMINI_API_KEY !== 'undefined' && GEMINI_API_KEY;
    }
    
    async function markTheory(question, answer, markScheme) {
        const prompt = `You are an AI examiner for ${PAGE_CONFIG.examType?.toUpperCase() || 'WASSCE'} exams.
Grade this theory/essay answer.
Question: ${question}
Marking Scheme: ${markScheme || 'Standard marking based on accuracy, depth, and clarity.'}
Student Answer: ${answer}

Return JSON: {"score": number (0-10), "outOf": 10, "feedback": "constructive feedback"}`;
        
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.3, responseMimeType: "application/json" }
                })
            });
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{"score":0,"outOf":10,"feedback":"Unable to mark"}';
            return JSON.parse(text);
        } catch (e) {
            return { score: 0, outOf: 10, feedback: `Marking error: ${e.message}` };
        }
    }
    
    // ── Bootstrap ────────────────────────────────────────────
    function init() {
        let subText, metaText, printText;
        if (PAGE_CONFIG.source === 'competition') {
            const comp = (PAGE_CONFIG.comp  || '').replace(/-/g, ' ');
            const div  = (PAGE_CONFIG.div   || '').replace(/-/g, ' ');
            const yr   = PAGE_CONFIG.year   || '';
            const rnd  = (PAGE_CONFIG.round || '').replace(/-/g, ' ');
            subText   = `${comp || 'Competition'} Practice`;
            metaText  = [div, yr, rnd].filter(Boolean).join(' · ');
            printText = `Prep Portal · ${subText} · Results`;
        } else {
            const examTypeName = getExamTypeName(PAGE_CONFIG.examType);
            subText   = `${examTypeName} • ${(PAGE_CONFIG.subjects || []).join(' & ') || 'Practice Paper'}`;
            metaText  = `${PAGE_CONFIG.year || '—'} • ${(PAGE_CONFIG.types || []).join(' & ').toUpperCase()}`;
            printText = `Prep Portal · ${examTypeName} ${PAGE_CONFIG.year || ''} · ${(PAGE_CONFIG.subjects || []).join(', ')} · Results`;
        }

        document.getElementById('display-subject').textContent = subText;
        document.getElementById('display-meta').textContent = metaText;
        document.getElementById('print-header').textContent = printText;
        
        const quitLink = document.getElementById('quit-link');
        if (quitLink) {
            quitLink.addEventListener('click', e => {
                e.preventDefault();
                window.history.back();
            });
        }
        
        // Add summary button listener
        const summaryBtn = document.getElementById('summary-btn');
        if (summaryBtn) {
            summaryBtn.addEventListener('click', () => {
                if (submitted) {
                    showResults();
                } else {
                    confirmSubmit();
                }
            });
        }
        
        loadAndRender();
    }
    
    function getExamTypeName(examTypeId) {
        const names = {
            'waec': 'WASSCE',
            'neco': 'SSCE',
            'jamb': 'UTME'
        };
        return names[examTypeId] || (examTypeId ? examTypeId.toUpperCase() : 'EXAM');
    }

    // ── Load questions from the Firestore-backed /api/questions endpoint ──
    // (ALOC past questions). Maps the API shape onto the engine's question
    // objects (objective items with a resolved `_answer` + `explanation`).
    async function loadFromAloc() {
        const examMap = {
            waec: 'wassce', jamb: 'utme', neco: 'neco',
            utme: 'utme', wassce: 'wassce', 'post-utme': 'post-utme', postutme: 'post-utme'
        };
        // Map the exam-picker's subject names → ALOC subject keys.
        const subjMap = {
            'english language': 'english', english: 'english',
            mathematics: 'mathematics', maths: 'mathematics', math: 'mathematics',
            'further mathematics': 'mathematics',
            physics: 'physics', chemistry: 'chemistry', biology: 'biology',
            economics: 'economics', commerce: 'commerce', government: 'government',
            geography: 'geography', history: 'history',
            'christian religious studies': 'crk', crk: 'crk',
            'islamic religious studies': 'irk',
            'literature in english': 'englishlit',
            'financial accounting': 'accounting',
            'agricultural science': 'agriculturalscience',
            'civic education': 'civiledu', insurance: 'insurance',
            'current affairs': 'currentaffairs'
        };
        const examType = examMap[(PAGE_CONFIG.examType || '').toLowerCase()] || (PAGE_CONFIG.examType || '').toLowerCase();
        const subjects = PAGE_CONFIG.subjects.length ? PAGE_CONFIG.subjects : ['mathematics'];
        const per = PAGE_CONFIG.limit || 20;
        const out = [];

        for (const sub of subjects) {
            const subKey = subjMap[sub.toLowerCase().trim()] || sub.toLowerCase().trim().split(/\s+/)[0];
            const params = new URLSearchParams({ subject: subKey, type: examType, limit: String(per), random: '1' });
            // The endpoint prioritises the chosen year and tops up from other
            // years if that year is sparse (so a paper is never near-empty).
            if (PAGE_CONFIG.year) params.set('year', PAGE_CONFIG.year);
            try {
                const res = await fetch(`${API_BASE}/api/questions?${params}`);
                if (!res.ok) { console.warn('ALOC fetch', sub, '→ HTTP', res.status); continue; }
                const data = await res.json();
                (data.questions || []).forEach(q => {
                    const options = q.options || [];
                    const ai = typeof q.answerIndex === 'number' ? q.answerIndex
                        : (typeof q.correctIndex === 'number' ? q.correctIndex : -1);
                    out.push({
                        question: q.question,
                        options,
                        _answer: (ai >= 0 && options[ai] !== undefined) ? options[ai] : null,
                        explanation: q.explanation || '',
                        image: q.image || '',
                        hint: '',
                        type: 'objective',
                        subject: sub,
                        examType: PAGE_CONFIG.examType,
                        examYear: q.examYear || PAGE_CONFIG.year || ''
                    });
                });
            } catch (e) {
                console.warn('ALOC load failed for', sub, e.message);
            }
        }
        return out;
    }

    async function loadFromCompetition() {
        const comp  = PAGE_CONFIG.comp  || '';
        const div   = PAGE_CONFIG.div   || '';
        const year  = PAGE_CONFIG.year  || '';
        const round = PAGE_CONFIG.round || '';
        if (!comp || !div || !year || !round) return [];

        window.__compQuiz = null;
        const scriptPath = `../../competitions/${comp}/${div}/${year}/${round}/script.js`;
        try {
            await import(scriptPath);
        } catch (e) {
            console.warn('Competition script load failed:', scriptPath, e.message);
            return [];
        }

        const data = window.__compQuiz;
        if (!data?.questions?.length) return [];

        if (data.timeLimit > 0) window.__compTimeLimit = data.timeLimit;

        const imgBase = `../../competitions/${comp}/${div}/${year}/${round}/`;
        return data.questions.map(q => {
            const opts = q.options || [];
            const ci   = typeof q.correctIndex === 'number' ? q.correctIndex
                       : (typeof q.correct_index === 'number' ? q.correct_index : -1);
            return {
                question:    q.question || '',
                options:     opts,
                _answer:     ci >= 0 && opts[ci] !== undefined ? opts[ci] : null,
                explanation: Array.isArray(q.explanation) ? q.explanation.join('\n') : (q.explanation || ''),
                image:       q.image ? (q.image.startsWith('./') ? imgBase + q.image.slice(2) : q.image) : '',
                hint:        q.hint || '',
                type:        'objective',
                subject:     comp,
                examType:    comp,
                examYear:    year
            };
        });
    }

    async function loadAndRender() {
        const loadingEl = document.getElementById('loading-state');
        if (loadingEl) loadingEl.style.display = 'flex';

        allQuestions = [];

        // ALOC / API source → fetch from Firestore-backed endpoint and skip the
        // static per-folder script loading below.
        if (PAGE_CONFIG.source === 'aloc' || PAGE_CONFIG.source === 'api') {
            allQuestions = await loadFromAloc();
            if (loadingEl) loadingEl.style.display = 'none';
            if (allQuestions.length === 0) {
                const card = document.getElementById('question-card');
                if (card) {
                    card.style.display = 'flex';
                    card.innerHTML = `<div style="padding:40px;text-align:center">
                    <strong style="font-family:var(--font-display);font-size:15px">No Questions Found</strong>
                    <p style="font-size:12px;opacity:.6;margin-top:8px">No ${(PAGE_CONFIG.examType||'').toUpperCase()} questions for this selection yet.</p>
                 </div>`;
                }
                return;
            }
            console.log(`Loaded ${allQuestions.length} questions from ALOC (/api/questions)`);
            buildDotMap();
            renderQuestion(0);
            const card = document.getElementById('question-card');
            const nav = document.getElementById('nav-bar');
            if (card) card.style.display = 'flex';
            if (nav) nav.style.display = 'grid';
            return;
        }

        // Competition source → dynamically import the round's script.js.
        // The script calls setupQuiz() which stores data in window.__compQuiz.
        if (PAGE_CONFIG.source === 'competition') {
            allQuestions = await loadFromCompetition();
            if (loadingEl) loadingEl.style.display = 'none';
            if (allQuestions.length === 0) {
                const card = document.getElementById('question-card');
                if (card) {
                    card.style.display = 'flex';
                    card.innerHTML = `<div style="padding:40px;text-align:center">
                    <strong style="font-family:var(--font-display);font-size:15px">No Questions Found</strong>
                    <p style="font-size:12px;opacity:.6;margin-top:8px">Could not load this competition round.</p>
                </div>`;
                }
                return;
            }
            console.log(`Loaded ${allQuestions.length} questions from competition script`);
            buildDotMap();
            renderQuestion(0);
            const card2 = document.getElementById('question-card');
            const nav2  = document.getElementById('nav-bar');
            if (card2) card2.style.display = 'flex';
            if (nav2)  nav2.style.display  = 'grid';
            return;
        }

        const loadedScripts = new Set(); // Track which scripts have been loaded
        const questionMap = new Map(); // Deduplicate by question content

        for (const sub of PAGE_CONFIG.subjects) {
            const subKey = sub.toLowerCase().replace(/\s+/g, '');
            for (const type of PAGE_CONFIG.types) {
                const examFolder = PAGE_CONFIG.examType || 'waec';
                const path = `../${examFolder}/${subKey}/${PAGE_CONFIG.year}/${type}.js`;
                
                // Skip if this exact script path was already loaded
                if (loadedScripts.has(path)) {
                    console.log(`Skipping already loaded: ${path}`);
                    continue;
                }
                
                try {
                    await injectScript(path);
                    loadedScripts.add(path);
                    
                    const vName = `${subKey}${type.charAt(0).toUpperCase() + type.slice(1)}`;
                    let data;
                    try {
                        data = window[vName] || eval(vName);
                    } catch (_) {}
                    
                    if (!data) continue;
                    
                    const items = type === 'objective' ? data : (Array.isArray(data) ? data : Object.values(data));
                    items.forEach(q => {
                        let questionObj;
                        if (type === 'objective') {
                            questionObj = { ...q, subject: sub, type, examType: PAGE_CONFIG.examType };
                            questionObj._answer = resolveAnswer(questionObj);
                        } else {
                            if (typeof q === 'string') {
                                questionObj = { subject: sub, type, examType: PAGE_CONFIG.examType, question: q, _answer: null };
                            } else {
                                questionObj = { ...q, subject: sub, type, examType: PAGE_CONFIG.examType, _answer: null };
                            }
                        }
                        
                        // Create unique key from question text and type
                        const questionText = questionObj.question.trim();
                        const key = `${questionText}|${type}`;
                        
                        // Only add if not already present
                        if (!questionMap.has(key)) {
                            questionMap.set(key, questionObj);
                        } else {
                            console.log(`Duplicate avoided: "${questionText.substring(0, 50)}..."`);
                        }
                    });
                } catch (err) {
                    console.warn('Could not load:', path, err.message);
                }
            }
        }
        
        // Convert Map to array
        allQuestions = Array.from(questionMap.values());
        
        if (loadingEl) loadingEl.style.display = 'none';
        
        if (allQuestions.length === 0) {
            const card = document.getElementById('question-card');
            if (card) {
                card.style.display = 'flex';
                card.innerHTML = `<div style="padding:40px;text-align:center">
                <strong style="font-family:var(--font-display);font-size:15px">No Questions Found</strong>
                <p style="font-size:12px;opacity:.6;margin-top:8px">No data for ${PAGE_CONFIG.examType?.toUpperCase() || 'selected exam'}.</p>
             </div>`;
            }
            return;
        }
        
        console.log(`Loaded ${allQuestions.length} unique questions from ${loadedScripts.size} script(s)`);
        
        buildDotMap();
        renderQuestion(0);
        const card = document.getElementById('question-card');
        const nav = document.getElementById('nav-bar');
        if (card) card.style.display = 'flex';
        if (nav) nav.style.display = 'grid';
    }
    
    function injectScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    // ── Dot map ──────────────────────────────────────────────
    function buildDotMap() {
        const c = document.getElementById('q-dots');
        if (!c) return;
        c.innerHTML = '';
        allQuestions.forEach((_, i) => {
            const d = document.createElement('button');
            d.className = 'q-dot';
            d.title = `Q${i+1}`;
            d.addEventListener('click', () => renderQuestion(i));
            c.appendChild(d);
        });
        updateDots();
    }
    
    function updateDots() {
        document.querySelectorAll('.q-dot').forEach((d, i) => {
            d.classList.remove('answered', 'current', 'correct', 'wrong', 'theory-marked');
            const q = allQuestions[i];
            const chosen = userAnswers[i];
            const ans = q._answer;
            if (submitted) {
                if (q.type !== 'objective') {
                    if (theoryMarks[i]) d.classList.add('theory-marked');
                    else if (chosen) d.classList.add('answered');
                } else if (!chosen) {
                    // unanswered — grey
                } else if (ans === null) {
                    d.classList.add('answered');
                } else if (chosen === ans) {
                    d.classList.add('correct');
                } else {
                    d.classList.add('wrong');
                }
            } else {
                if (i === currentIndex) d.classList.add('current');
                else if (chosen !== undefined) d.classList.add('answered');
            }
        });
    }
    
    // ── Render question ──────────────────────────────────────
    function renderQuestion(idx) {
        currentIndex = idx;
        const q = allQuestions[idx];
        const total = allQuestions.length;
        
        const counterLabel = document.getElementById('q-counter-label');
        const progressFill = document.getElementById('progress-fill');

        // Single counter — lives on the sticky note (the old pill badge is gone).
        if (counterLabel) counterLabel.textContent = `Q ${idx+1} / ${total} · ${q.subject} · ${q.type.toUpperCase()}`;
        if (progressFill) progressFill.style.width = `${((idx+1)/total)*100}%`;
        
        const qTextEl = document.getElementById('q-text');
        if (qTextEl) qTextEl.innerHTML = esc(q.question);
        
        const imgWrap = document.getElementById('q-image-wrap');
        if (imgWrap) {
            imgWrap.innerHTML = '';
            if (q.image) {
                const img = document.createElement('img');
                img.className = 'q-image';
                img.src = q.image;
                img.alt = `Q${idx+1} diagram`;
                imgWrap.appendChild(img);
            }
        }
        
        const optWrap = document.getElementById('q-options');
        if (optWrap) {
            optWrap.innerHTML = '';
            if (q.type === 'objective') {
                renderObjectiveOptions(q, idx, optWrap);
            } else {
                renderTheoryOptions(q, idx, optWrap);
            }
        }
        
        renderFeedback(idx);
        updateNavButtons(idx, total);
        updateDots();
        
        const card = document.getElementById('question-card');
        const strip = document.getElementById('feedback-strip');
        if (card) typesetEl(card);
        if (strip) typesetEl(strip);
    }
    
    function renderObjectiveOptions(q, idx, optWrap) {
        const grid = document.createElement('div');
        grid.className = 'options-grid';
        const letters = ['A', 'B', 'C', 'D', 'E'];
        (q.options || []).forEach((opt, oi) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            if (submitted) {
                btn.disabled = true;
                if (q._answer !== null && opt === q._answer) btn.classList.add('correct-ans');
                else if (userAnswers[idx] === opt) btn.classList.add('wrong-ans');
            } else if (userAnswers[idx] === opt) {
                btn.classList.add('selected');
            }
            btn.innerHTML = `<span class="opt-letter">${letters[oi] || oi+1}</span><span>${esc(opt)}</span>`;
            btn.addEventListener('click', () => selectOption(opt, btn, grid, idx));
            grid.appendChild(btn);
        });
        optWrap.appendChild(grid);
        
        if (!submitted && q.hint) {
            const h = document.createElement('div');
            h.className = 'hint-row';

            const lbl = document.createElement('button');
            lbl.type = 'button';
            lbl.className = 'hint-lbl';
            lbl.textContent = 'Hint';
            lbl.setAttribute('aria-expanded', 'false');

            const body = document.createElement('span');
            body.className = 'hint-body';
            body.innerHTML = esc(q.hint);
            body.hidden = true;

            lbl.addEventListener('click', () => {
                const opening = body.hidden;
                body.hidden = !opening;
                lbl.setAttribute('aria-expanded', String(opening));
                h.classList.toggle('hint-row--open', opening);
            });

            h.appendChild(lbl);
            h.appendChild(body);
            optWrap.appendChild(h);
        }
    }
    
    function renderTheoryOptions(q, idx, optWrap) {
        const ta = document.createElement('textarea');
        ta.className = 'theory-box';
        ta.placeholder = 'Write your answer here…';
        ta.value = userAnswers[idx] || '';
        if (submitted) ta.disabled = true;
        ta.addEventListener('input', () => {
            userAnswers[idx] = ta.value;
            updateDots();
        });
        optWrap.appendChild(ta);
        
        if (submitted && theoryMarks[idx]) {
            const m = theoryMarks[idx];
            const mEl = document.createElement('div');
            mEl.style.cssText = 'margin-top:12px;padding:12px;border:2px solid var(--blue);background:rgba(0,85,255,.05)';
            mEl.innerHTML = `
                <div class="theory-score-badge">AI Mark: ${m.score}/${m.outOf}</div>
                <div class="theory-mark-text">${esc(m.feedback)}</div>`;
            optWrap.appendChild(mEl);
        } else if (submitted && userAnswers[idx]) {
            const sp = document.createElement('div');
            sp.className = 'ai-marking-row';
            sp.innerHTML = `<div class="ai-spin"></div>AI Marking…`;
            optWrap.appendChild(sp);
        }
    }
    
    function updateNavButtons(idx, total) {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const submitBtn = document.getElementById('submit-btn');
        
        if (prevBtn) prevBtn.disabled = (idx === 0);
        const isLast = (idx === total - 1);
        if (nextBtn) nextBtn.style.display = isLast ? 'none' : 'inline-flex';
        if (submitBtn) submitBtn.style.display = isLast ? 'inline-flex' : 'none';
    }
    
    function renderFeedback(idx) {
        const strip = document.getElementById('feedback-strip');
        const label = document.getElementById('feedback-label');
        const expl = document.getElementById('feedback-expl');
        const acts = document.getElementById('feedback-actions');
        const q = allQuestions[idx];
        const ans = q._answer;
        
        if (!strip) return;
        strip.className = 'feedback-strip';
        if (expl) expl.innerHTML = '';
        if (acts) acts.innerHTML = '';
        
        if (!submitted) return;
        
        function buildExpl(raw) {
            if (!raw) return '';
            const lines = Array.isArray(raw) ? raw : [raw];
            return lines.map(l => `<p class="expl-line">${esc(l)}</p>`).join('');
        }
        
        if (q.type !== 'objective') {
            const mark = theoryMarks[idx];
            if (mark) {
                strip.classList.add('neutral');
                if (label) label.textContent = `AI Mark: ${mark.score}/${mark.outOf}`;
                if (expl) expl.innerHTML = `<p class="expl-line">${esc(mark.feedback)}</p>`;
            } else if (userAnswers[idx]) {
                strip.classList.add('neutral');
                if (label) label.textContent = 'Theory — marking with AI…';
            } else {
                strip.classList.add('wrong');
                if (label) label.textContent = 'No answer submitted.';
            }
            return;
        }
        
        const chosen = userAnswers[idx];
        if (!chosen) {
            strip.classList.add('wrong');
            if (label) label.textContent = 'Not answered.';
            if (expl) expl.innerHTML = ans ?
                `<p class="expl-line">Correct answer: <strong>${esc(ans)}</strong></p>` + buildExpl(q.explanation) :
                '<p class="expl-line">No answer key for this question.</p>';
        } else if (ans === null) {
            strip.classList.add('neutral');
            if (label) label.textContent = `You selected: ${chosen}`;
            if (expl) expl.innerHTML = '<p class="expl-line">No answer key — cannot verify.</p>';
        } else if (chosen === ans) {
            strip.classList.add('correct');
            if (label) label.textContent = 'Correct!';
            if (expl) expl.innerHTML = buildExpl(q.explanation);
        } else {
            strip.classList.add('wrong');
            if (label) label.textContent = `Wrong — you chose: ${chosen}`;
            if (expl) expl.innerHTML =
                `<p class="expl-line">Correct answer: <strong>${esc(ans)}</strong></p>` +
                buildExpl(q.explanation);
        }
    }
    
    function selectOption(opt, btn, grid, idx) {
        if (submitted) return;
        grid.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        userAnswers[idx] = opt;
        updateDots();
    }
    
    function navigate(delta) {
        const n = currentIndex + delta;
        if (n < 0 || n >= allQuestions.length) return;
        renderQuestion(n);
    }
    
    function goTo(idx) {
        if (idx < 0 || idx >= allQuestions.length) return;
        renderQuestion(idx);
    }
    
    function confirmSubmit() {
        const answered = Object.keys(userAnswers)
            .filter(k => userAnswers[k] !== undefined && userAnswers[k] !== '').length;
        const total = allQuestions.length;
        const confirmBody = document.getElementById('confirm-body');
        if (confirmBody) {
            confirmBody.textContent = `You have answered ${answered} of ${total} questions.` +
                (answered < total ? ` ${total-answered} unanswered will be skipped.` : ' Ready to submit?');
        }
        const overlay = document.getElementById('pp-confirm-overlay');
        if (overlay) overlay.classList.add('open');
    }
    
    function closeConfirm() {
        const overlay = document.getElementById('pp-confirm-overlay');
        if (overlay) overlay.classList.remove('open');
    }
    
    async function submit() {
        closeConfirm();
        submitted = true;
        renderQuestion(currentIndex);
        const sb = document.getElementById('submit-btn');
        if (sb) {
            sb.disabled = true;
            sb.textContent = 'Submitted';
        }
        await runTheoryMarking();
        showResults();
    }
    
    async function runTheoryMarking() {
        for (let i = 0; i < allQuestions.length; i++) {
            const q = allQuestions[i];
            if (q.type !== 'theory' && q.type !== 'essay') continue;
            const answer = userAnswers[i] || '';
            if (!answer.trim() || !geminiKey()) continue;
            try {
                const result = await markTheory(q.question, answer, q.markScheme || '');
                theoryMarks[i] = result;
                updateDots();
                if (currentIndex === i) renderQuestion(i);
                updateReviewTheoryItem(i, result);
            } catch (e) { console.warn(`Theory marking Q${i+1}:`, e.message); }
        }
    }
    
    function updateReviewTheoryItem(idx, mark) {
        const el = document.getElementById(`review-theory-mark-${idx}`);
        if (!el) return;
        el.innerHTML = `
            <div class="theory-score-badge">AI Mark: ${mark.score}/${mark.outOf}</div>
            <div class="theory-mark-text">${esc(mark.feedback)}</div>`;
        typesetEl(el);
    }
    
    function showResults() {
        const quizScreen = document.getElementById('quiz-screen');
        const resultsScreen = document.getElementById('results-screen');
        if (quizScreen) quizScreen.style.display = 'none';
        if (resultsScreen) resultsScreen.style.display = 'flex';
        
        if (typeof PrepBot !== 'undefined' && PrepBot.hideFAB) PrepBot.hideFAB();
        
        let correct = 0,
            wrong = 0,
            skipped = 0;
        const scorable = allQuestions.filter(q => q.type === 'objective' && q._answer !== null);
        
        allQuestions.forEach((q, i) => {
            if (q.type !== 'objective') return;
            const chosen = userAnswers[i];
            const ans = q._answer;
            if (!chosen) skipped++;
            else if (ans === null) { /* no key */ }
            else if (chosen === ans) correct++;
            else wrong++;
        });
        
        const pct = scorable.length > 0 ? Math.round((correct / scorable.length) * 100) : 0;
        const scoreEl = document.getElementById('res-score');
        const correctEl = document.getElementById('res-correct');
        const wrongEl = document.getElementById('res-wrong');
        const skippedEl = document.getElementById('res-skipped');
        const gradeEl = document.getElementById('res-grade');
        
        if (scoreEl) scoreEl.textContent = scorable.length > 0 ? `${pct}%` : 'N/A';
        if (correctEl) correctEl.textContent = correct;
        if (wrongEl) wrongEl.textContent = wrong;
        if (skippedEl) skippedEl.textContent = skipped;
        
        let grade = 'No answer key.';
        if (scorable.length > 0) {
            if (pct >= 80) grade = 'Distinction — Excellent work!';
            else if (pct >= 65) grade = 'Credit — Well done.';
            else if (pct >= 50) grade = 'Pass — Keep working.';
            else grade = 'Fail — Keep practising.';
        }
        if (gradeEl) gradeEl.textContent = grade;
        
        buildReviewList();
    }
    
    function buildReviewList() {
        const el = document.getElementById('review-list');
        if (!el) return;
        el.innerHTML = '';
        
        allQuestions.forEach((q, i) => {
            const chosen = userAnswers[i];
            const ans = q._answer;
            const item = document.createElement('div');
            item.className = 'review-item';
            
            const numEl = document.createElement('div');
            numEl.className = 'review-q-num';
            numEl.textContent = i + 1;
            
            const body = document.createElement('div');
            body.className = 'review-body';
            
            const qTxt = document.createElement('div');
            qTxt.className = 'review-q-text';
            qTxt.innerHTML = esc(q.question);
            body.appendChild(qTxt);
            
            if (q.image) {
                const img = document.createElement('img');
                img.className = 'review-img';
                img.src = q.image;
                img.alt = `Q${i+1}`;
                body.appendChild(img);
            }
            
            const ansEl = document.createElement('div');
            ansEl.className = 'review-ans';
            
            if (q.type === 'objective') {
                if (!chosen) {
                    numEl.classList.add('rq-skip');
                    ansEl.textContent = ans ? `Not answered — Correct: ${ans}` : 'Not answered';
                } else if (ans === null) {
                    numEl.classList.add('rq-skip');
                    ansEl.textContent = `You: ${chosen}  |  No key`;
                } else if (chosen === ans) {
                    numEl.classList.add('rq-ok');
                    ansEl.classList.add('ok');
                    ansEl.textContent = `Correct: ${chosen}`;
                } else {
                    numEl.classList.add('rq-bad');
                    ansEl.classList.add('bad');
                    ansEl.innerHTML = `You: <strong>${esc(chosen)}</strong>  |  Correct: <strong>${esc(ans)}</strong>`;
                }
                body.appendChild(ansEl);
                
                if (q.explanation) {
                    const explEl = document.createElement('div');
                    explEl.className = 'review-expl';
                    const lines = Array.isArray(q.explanation) ? q.explanation : [q.explanation];
                    explEl.innerHTML = lines.map(l => `<p class="expl-line">${esc(l)}</p>`).join('');
                    body.appendChild(explEl);
                }
            } else {
                numEl.classList.add(chosen ? 'rq-ai' : 'rq-skip');
                ansEl.classList.add('ai');
                if (chosen) {
                    ansEl.textContent = `Answer: ${chosen.length > 120 ? chosen.slice(0,120)+'…' : chosen}`;
                } else {
                    ansEl.textContent = 'Theory — not answered';
                }
                body.appendChild(ansEl);
                
                const markEl = document.createElement('div');
                markEl.id = `review-theory-mark-${i}`;
                if (theoryMarks[i]) {
                    const m = theoryMarks[i];
                    markEl.innerHTML = `
                        <div class="theory-score-badge">AI Mark: ${m.score}/${m.outOf}</div>
                        <div class="theory-mark-text">${esc(m.feedback)}</div>`;
                } else if (chosen) {
                    markEl.innerHTML = `<div class="ai-marking-row"><div class="ai-spin"></div>Marking…</div>`;
                }
                body.appendChild(markEl);
            }
            
            item.appendChild(numEl);
            item.appendChild(body);
            el.appendChild(item);
        });
        
        typesetEl(el);
    }
    
    function printResults() {
        const reviewEl = document.getElementById('review-list');
        if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
            MathJax.typesetClear([reviewEl]);
            MathJax.typesetPromise([reviewEl])
                .then(() => window.print())
                .catch(() => window.print());
        } else {
            window.print();
        }
    }
    
    function retake() {
        userAnswers = {};
        theoryMarks = {};
        currentIndex = 0;
        submitted = false;
        
        const resultsScreen = document.getElementById('results-screen');
        const quizScreen = document.getElementById('quiz-screen');
        if (resultsScreen) resultsScreen.style.display = 'none';
        if (quizScreen) quizScreen.style.display = 'flex';
        
        const sb = document.getElementById('submit-btn');
        if (sb) {
            sb.disabled = false;
            sb.innerHTML = `Submit <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 6h8M7 3l3 3-3 3"/></svg>`;
        }
        
        if (typeof PrepBot !== 'undefined' && PrepBot.showFAB) PrepBot.showFAB();
        
        buildDotMap();
        renderQuestion(0);
    }
    
    function getState() {
        return { allQuestions, currentIndex, userAnswers, submitted };
    }
    
    return {
        init,
        navigate,
        goTo,
        getState,
        confirmSubmit,
        closeConfirm,
        submit,
        retake,
        print: printResults
    };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Quiz.init());
} else {
    Quiz.init();
}