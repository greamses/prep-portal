const SVG_NS = 'http://www.w3.org/2000/svg';
const svg = document.getElementById('polygon-svg');
const gTransform = document.getElementById('transform-group');

let VW = 500, VH = 500, CX = 250, CY = 250;
let isInitialized = false;

const state = {
  tAngle: 60,
  distance: 160,
  radius: 55,
  
  showNames: true,
  showValues: false,
  showVertices: true,
  showCenter: true,
  grid: true,
  
  animMode: 'none',
  animProgress: 0,
  activeWedge: null,

    protractor: false,
    colors: true,         // off: every angle is plain paper, so position is the only clue
  arcs: true,           // off: no sectors at all — see arcVisible()
  quiz: null            // see startQuiz() — null whenever an activity isn't running
};

/* ── THE NAMED PAIRS ──────────────────────────────────────────────────────
   The six relationships the panel lists, as the actual pairs of angles. Only
   these are ever asked about in "Name the Pair" — two angles on the same line
   (∠1 and ∠2, say) are a linear pair with no name in this set. */
const NAMED_PAIRS = {
  vert_opp:      [[1, 4], [2, 3], [5, 8], [6, 7]],
  corresponding: [[1, 5], [2, 6], [3, 7], [4, 8]],
  alt_int:       [[3, 6], [4, 5]],
  alt_ext:       [[1, 8], [2, 7]],
  cons_int:      [[3, 5], [4, 6]],
  cons_ext:      [[1, 7], [2, 8]],
};
const REL_LABELS = {
  vert_opp: 'vertically opposite',
  corresponding: 'corresponding',
  alt_int: 'alternate interior',
  alt_ext: 'alternate exterior',
  cons_int: 'co-interior (consecutive interior)',
  cons_ext: 'co-exterior (consecutive exterior)',
};
/* Why each one is what it is — the sentence that makes the name stick. */
const REL_WHY = {
  vert_opp: 'they are back-to-back at the same crossing',
  corresponding: 'they sit in matching positions at the two crossings',
  alt_int: 'they are between the parallels, on opposite sides of the transversal',
  alt_ext: 'they are outside the parallels, on opposite sides of the transversal',
  cons_int: 'they are between the parallels, on the SAME side of the transversal',
  cons_ext: 'they are outside the parallels, on the SAME side of the transversal',
};

/* ── THE EIGHT ANGLES, IN TWO FAMILIES ────────────────────────────────────
   Across parallel lines every one of the eight angles is either the acute one
   or the obtuse one — there is no third size. So any two of them are equal
   when they fall in the SAME family and supplementary when they fall in
   different ones, and that single fact is what both activities below test.
   (1, 4, 5, 8 are the acute family; 2, 3, 6, 7 the obtuse one.) */
const ACUTE_FAMILY = [1, 4, 5, 8];
const sameFamily = (a, b) => ACUTE_FAMILY.includes(a) === ACUTE_FAMILY.includes(b);
const QUIZ_MODES = {
  quiz_equal_supp: 'Equal or Supplementary',
  quiz_pick: 'Pick the Correct Angle',
  quiz_identify: 'Name the Pair',
};
const isQuiz = () => Boolean(QUIZ_MODES[state.animMode]);
/* The six animation modes whose names are also the six answers. */
const REL_MODES = ['vert_opp', 'corresponding', 'alt_int', 'alt_ext', 'cons_int', 'cons_ext'];
/* At exactly 90° every angle is a right angle, so a pair is equal AND
   supplementary at once. The activities say so rather than marking one wrong. */
const isRightAngleCase = () => Math.abs(state.tAngle - 90) < 0.5;

let vX = 0, vY = 0, vScale = 1;
let animReq = null;

function updateView() {
  gTransform.setAttribute('transform', `translate(${vX}, ${vY}) scale(${vScale})`);
}

function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }
function rad(deg) { return deg * Math.PI / 180; }
function deg(r) { return r * 180 / Math.PI; }

function el(tag, attrs = {}) {
  const e = document.createElementNS(SVG_NS, tag);
  for (const[k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}

function txt(content, attrs = {}) {
  const t = el('text', attrs);
  t.textContent = content;
  return t;
}

function getSectorPath(cx, cy, startDeg, sweepDeg, r) {
  if (sweepDeg <= 0.01) return "";
  let sR = rad(startDeg), eR = rad(startDeg + sweepDeg);
  let x1 = cx + r * Math.cos(sR), y1 = cy + r * Math.sin(sR);
  let x2 = cx + r * Math.cos(eR), y2 = cy + r * Math.sin(eR);
  let largeArc = sweepDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

// Maps OUT all valid bi-directional mappings based on mathematical properties
function getModeConfig(mode, P1, P2, M) {
  if (mode === 'vert_opp') return {
    movers:[
      { w: 1, type: 'rotate', cx: P1.x, cy: P1.y, target: 4, partner: 4 },
      { w: 4, type: 'rotate', cx: P1.x, cy: P1.y, target: 1, partner: 1 },
      { w: 2, type: 'rotate', cx: P1.x, cy: P1.y, target: 3, partner: 3 },
      { w: 3, type: 'rotate', cx: P1.x, cy: P1.y, target: 2, partner: 2 },
      { w: 5, type: 'rotate', cx: P2.x, cy: P2.y, target: 8, partner: 8 },
      { w: 8, type: 'rotate', cx: P2.x, cy: P2.y, target: 5, partner: 5 },
      { w: 6, type: 'rotate', cx: P2.x, cy: P2.y, target: 7, partner: 7 },
      { w: 7, type: 'rotate', cx: P2.x, cy: P2.y, target: 6, partner: 6 }
    ]
  };
  if (mode === 'corresponding') return {
    movers:[
      { w: 1, type: 'translate', dx: P2.x - P1.x, dy: P2.y - P1.y, target: 5, partner: 5 },
      { w: 5, type: 'translate', dx: P1.x - P2.x, dy: P1.y - P2.y, target: 1, partner: 1 },
      { w: 2, type: 'translate', dx: P2.x - P1.x, dy: P2.y - P1.y, target: 6, partner: 6 },
      { w: 6, type: 'translate', dx: P1.x - P2.x, dy: P1.y - P2.y, target: 2, partner: 2 },
      { w: 3, type: 'translate', dx: P2.x - P1.x, dy: P2.y - P1.y, target: 7, partner: 7 },
      { w: 7, type: 'translate', dx: P1.x - P2.x, dy: P1.y - P2.y, target: 3, partner: 3 },
      { w: 4, type: 'translate', dx: P2.x - P1.x, dy: P2.y - P1.y, target: 8, partner: 8 },
      { w: 8, type: 'translate', dx: P1.x - P2.x, dy: P1.y - P2.y, target: 4, partner: 4 }
    ]
  };
  if (mode === 'alt_int') return {
    movers:[
      { w: 3, type: 'rotate', cx: M.x, cy: M.y, target: 6, partner: 6 },
      { w: 6, type: 'rotate', cx: M.x, cy: M.y, target: 3, partner: 3 },
      { w: 4, type: 'rotate', cx: M.x, cy: M.y, target: 5, partner: 5 },
      { w: 5, type: 'rotate', cx: M.x, cy: M.y, target: 4, partner: 4 }
    ]
  };
  if (mode === 'alt_ext') return {
    movers:[
      { w: 1, type: 'rotate', cx: M.x, cy: M.y, target: 8, partner: 8 },
      { w: 8, type: 'rotate', cx: M.x, cy: M.y, target: 1, partner: 1 },
      { w: 2, type: 'rotate', cx: M.x, cy: M.y, target: 7, partner: 7 },
      { w: 7, type: 'rotate', cx: M.x, cy: M.y, target: 2, partner: 2 }
    ]
  };
  if (mode === 'cons_int') return {
    supplementary: true,
    movers:[
      { w: 3, type: 'rotate', cx: M.x, cy: M.y, target: 6, partner: 5 }, // Rotates down to show it makes straight line with 5
      { w: 5, type: 'rotate', cx: M.x, cy: M.y, target: 4, partner: 3 },
      { w: 4, type: 'rotate', cx: M.x, cy: M.y, target: 5, partner: 6 },
      { w: 6, type: 'rotate', cx: M.x, cy: M.y, target: 3, partner: 4 }
    ]
  };
  if (mode === 'cons_ext') return {
    supplementary: true,
    movers:[
      { w: 1, type: 'rotate', cx: M.x, cy: M.y, target: 8, partner: 7 }, // Rotates down to show it makes straight line with 7
      { w: 7, type: 'rotate', cx: M.x, cy: M.y, target: 2, partner: 1 }, // Note: Partner of 7 is 1, forms line when 7 -> 2
      { w: 2, type: 'rotate', cx: M.x, cy: M.y, target: 7, partner: 8 },
      { w: 8, type: 'rotate', cx: M.x, cy: M.y, target: 1, partner: 2 }
    ]
  };
  return null;
}

// Engine driver for the automatic ease-out slider playback
function runAnim(targetVal) {
  if (animReq) cancelAnimationFrame(animReq);
  
  let step = () => {
    let diff = targetVal - state.animProgress;
    if (Math.abs(diff) < 0.005) {
      state.animProgress = targetVal;
      document.getElementById('sl-anim').value = state.animProgress;
      document.getElementById('dv-anim-val').textContent = Math.round(state.animProgress * 100) + '%';
      render();
      return;
    }
    
    state.animProgress += diff * 0.12; 
    document.getElementById('sl-anim').value = state.animProgress;
    document.getElementById('dv-anim-val').textContent = Math.round(state.animProgress * 100) + '%';
    render();
    animReq = requestAnimationFrame(step);
  };
  
  step();
}

/* ── PROTRACTOR ───────────────────────────────────────────────────────────
   A real half-disc protractor laid on one of the two crossings, baseline along
   that horizontal line, so an angle can be read off the figure instead of
   taken from the readout. It carries both scales the plastic ones do — outer
   running left-to-right, inner right-to-left — because reading the correct one
   is most of the skill.

   It sits on whichever crossing the learner is working at: the active or
   reference angle's vertex, else the upper one. */
function buildProtractor(P1, P2, A, r) {
  const atLower = (w) => w >= 5;
  const focus = state.quiz?.reference ? state.quiz.reference
    : state.quiz?.pair ? state.quiz.pair[0]
    : state.activeWedge;
  const C = focus && atLower(focus) ? P2 : P1;
  /* Clear of the wedges: the scale has to be readable ALONGSIDE the angles it
     measures, not printed on top of them. */
  const R = Math.max(r * 2.6, 130);

  const g = el('g', { class: 'protractor', 'pointer-events': 'none' });

  // body: a half disc above the line, plus the flat edge along it
  g.appendChild(el('path', {
    d: `M ${C.x - R} ${C.y} A ${R} ${R} 0 0 1 ${C.x + R} ${C.y} Z`,
    fill: 'var(--surface-primary)', opacity: '0.62',
    stroke: 'var(--ink)', 'stroke-width': '1.2'
  }));
  g.appendChild(el('line', {
    x1: C.x - R, y1: C.y, x2: C.x + R, y2: C.y,
    stroke: 'var(--ink)', 'stroke-width': '1.2', opacity: '0.8'
  }));

  // ticks: every 1 short, every 5 medium, every 10 long with both numbers
  for (let d = 0; d <= 180; d += 1) {
    const a = rad(180 + d);                       // 0 at the RIGHT, sweeping up and over
    const long = d % 10 === 0, mid = d % 5 === 0;
    const inner = R - (long ? 15 : mid ? 10 : 6);
    g.appendChild(el('line', {
      x1: C.x + R * Math.cos(a), y1: C.y + R * Math.sin(a),
      x2: C.x + inner * Math.cos(a), y2: C.y + inner * Math.sin(a),
      stroke: 'var(--ink)', 'stroke-width': long ? '1.2' : '0.7',
      opacity: long ? '0.8' : '0.45'
    }));
    if (d % 30 !== 0) continue;
    const put = (value, radius, size) => {
      const t = txt(String(value), {
        x: C.x + radius * Math.cos(a), y: C.y + radius * Math.sin(a) + 3,
        'text-anchor': 'middle', 'font-family': 'JetBrains Mono,monospace',
        'font-size': String(size), 'font-weight': '700',
        fill: 'var(--ink)', opacity: '0.75'
      });
      g.appendChild(t);
    };
    put(d, R - 26, 9);              // outer scale, 0 on the left
    put(180 - d, R - 44, 8);        // inner scale, 0 on the right
  }

  // centre mark
  g.appendChild(el('circle', {
    cx: C.x, cy: C.y, r: '2.5', fill: 'var(--ink)', opacity: '0.8'
  }));

  /* The transversal's own arm, drawn over the scale, so the number it points
     at is the angle being measured rather than something to estimate. */
  const armLen = R - 4;
  const armA = rad(180 + A);
  g.appendChild(el('line', {
    x1: C.x, y1: C.y,
    x2: C.x + armLen * Math.cos(armA), y2: C.y + armLen * Math.sin(armA),
    stroke: 'var(--accent-danger)', 'stroke-width': '2', opacity: '0.9'
  }));
  return g;
}

/* ── THE TWO ACTIVITIES ───────────────────────────────────────────────────
   Both rest on the same fact (see sameFamily above) and both are answered on
   the figure itself, not from the readout panel.

     Equal or Supplementary — two angles are lit; say which they are.
     Pick the Correct Angle — one angle is lit; tap one that is EQUAL to it,
       then one that is SUPPLEMENTARY to it.
*/
const $quiz = {
  strip: () => document.getElementById('quiz-strip'),
  prompt: () => document.getElementById('quiz-prompt'),
  answers: () => document.getElementById('quiz-answers'),
  score: () => document.getElementById('quiz-score'),
  next: () => document.getElementById('quiz-next'),
};

function randomAngle(exclude = []) {
  const pool = [1, 2, 3, 4, 5, 6, 7, 8].filter((n) => !exclude.includes(n));
  return pool[Math.floor(Math.random() * pool.length)];
}

function startQuiz(mode) {
  const kept = state.quiz ? { asked: state.quiz.asked, right: state.quiz.right } : { asked: 0, right: 0 };
  state.quiz = { mode, ...kept, settled: false, verdict: '' };
  nextQuestion();
}

function nextQuestion() {
  const q = state.quiz;
  if (!q) return;
  q.settled = false;
  q.verdict = '';
  q.picked = null;
  if (q.mode === 'quiz_equal_supp') {
    const a = randomAngle();
    q.pair = [a, randomAngle([a])];
    q.reference = null;
    } else if (q.mode === 'quiz_identify') {
    const rels = Object.keys(NAMED_PAIRS);
    q.rel = rels[Math.floor(Math.random() * rels.length)];
    const options = NAMED_PAIRS[q.rel];
    q.pair = options[Math.floor(Math.random() * options.length)];
    q.reference = null;
  } else {
    q.reference = randomAngle();
    q.pair = null;
        q.want = 'equal';        // first an equal one, then a supplementary one
    q.gotEqual = null;
    q.gotSupp = null;
    q.tried = [];            // every angle chosen this round keeps its arc
  }
  syncQuizUI();
  render();
}

function scoreQuestion(correct) {
  const q = state.quiz;
  q.asked += 1;
  if (correct) q.right += 1;
}

/* Equal-or-Supplementary: the two buttons under the prompt. */
function answerEqualSupp(answer) {
  const q = state.quiz;
  if (!q || q.settled) return;
  const [a, b] = q.pair;
  const equal = sameFamily(a, b);
  const both = isRightAngleCase();
  const correct = both || (answer === 'equal') === equal;

  q.settled = true;
  q.picked = answer;
  scoreQuestion(correct);
  q.verdict = both
    ? `Both — at 90° every angle is a right angle, so ∠${a} and ∠${b} are equal AND add to 180°.`
    : correct
      ? equal
        ? `Right: ∠${a} and ∠${b} are the same size.`
        : `Right: ∠${a} + ∠${b} = 180°.`
      : equal
        ? `Not quite — ∠${a} and ∠${b} are the same size, so they are equal.`
        : `Not quite — ∠${a} and ∠${b} add to 180°, so they are supplementary.`;
  syncQuizUI();
  render();
}

/* Pick the Correct Angle: answered by tapping a wedge on the figure. */
function answerPick(w) {
  const q = state.quiz;
  if (!q || q.settled || w === q.reference) return;
  /* Revealed on being chosen, right or wrong — seeing a wrong pick next to the
     reference is how you find out they were not the same size after all. */
  if (!q.tried.includes(w)) q.tried.push(w);
  const equal = sameFamily(q.reference, w);
  const both = isRightAngleCase();
  const wantEqual = q.want === 'equal';
  const correct = both || equal === wantEqual;

  if (!correct) {
    q.verdict = wantEqual
      ? `∠${w} is supplementary to ∠${q.reference}, not equal to it. Try another.`
      : `∠${w} is equal to ∠${q.reference}, not supplementary. Try another.`;
    syncQuizUI();
    render();
    return;
  }

  if (wantEqual) {
    q.gotEqual = w;
    q.want = 'supplementary';
    q.verdict = both
      ? `At 90° every angle works — ∠${w} it is. Now pick one that is supplementary.`
      : `Yes — ∠${w} = ∠${q.reference}. Now pick one that is supplementary.`;
  } else {
    q.gotSupp = w;
    q.settled = true;
    scoreQuestion(true);
    q.verdict = `Yes — ∠${q.reference} + ∠${w} = 180°. Both found.`;
  }
  syncQuizUI();
  render();
}

/* Name the Pair: the six named relationships, answered from the buttons. */
function answerIdentify(rel) {
  const q = state.quiz;
  if (!q || q.settled) return;
  const [a, b] = q.pair;
  const correct = rel === q.rel;
  q.settled = true;
  q.picked = rel;
  scoreQuestion(correct);
  q.verdict = correct
    ? `Yes — ∠${a} and ∠${b} are ${REL_LABELS[q.rel]}: ${REL_WHY[q.rel]}.`
    : `Not quite. ∠${a} and ∠${b} are ${REL_LABELS[q.rel]} — ${REL_WHY[q.rel]}.`;
  syncQuizUI();
  render();
}

function syncQuizUI() {
  const strip = $quiz.strip();
  if (!strip) return;
  const q = state.quiz;
  strip.hidden = !isQuiz();
  document.querySelector('.anim-slider-row').hidden = isQuiz();
  if (!isQuiz() || !q) return;

    const answers = $quiz.answers();
  answers.hidden = q.mode !== 'quiz_equal_supp';
  answers.querySelectorAll('.quiz-choice').forEach((b) => {
    b.disabled = q.settled;
    b.classList.toggle('is-picked', q.settled && q.picked === b.dataset.answer);
  });

    /* "Name the Pair" is answered on the SIX RELATIONSHIP NOTES ALREADY IN THE
     ROW — they carry those names for the animations, so asking the question on
     a second set of identical buttons would just be the same words twice.
     While the activity is running they answer instead of switching mode, and
     "Normal" steps out of the row because it is not one of the names. */
  const naming = q.mode === 'quiz_identify';
  document.querySelector('.anim-modes').classList.toggle('is-naming', naming);
  document.querySelectorAll('.anim-mode-btn').forEach((b) => {
    const isRel = REL_MODES.includes(b.dataset.mode);
    b.classList.toggle('is-picked', naming && q.settled && q.picked === b.dataset.mode);
    /* Settled, the true one is marked too, so a wrong pick is shown beside the
       right answer rather than on its own. */
    b.classList.toggle('is-answer', naming && q.settled && b.dataset.mode === q.rel);
    b.classList.toggle('is-answering', naming && isRel && !q.settled);
  });

    let prompt;
  if (q.mode === 'quiz_equal_supp') {
    prompt = q.verdict || `Are ∠${q.pair[0]} and ∠${q.pair[1]} equal, or supplementary?`;
  } else if (q.mode === 'quiz_identify') {
    prompt = q.verdict || `What are ∠${q.pair[0]} and ∠${q.pair[1]} to each other?`;
  } else if (q.settled) {
    prompt = q.verdict;
  } else {
    prompt = q.verdict
      || `Tap the angle that is ${q.want === 'equal' ? 'EQUAL to' : 'SUPPLEMENTARY to'} ∠${q.reference}.`;
  }
  $quiz.prompt().textContent = prompt;
  $quiz.prompt().classList.toggle('quiz-prompt--settled', q.settled);
  $quiz.score().textContent = `${q.right} of ${q.asked}`;
  $quiz.next().hidden = !q.settled;
}

/* ── WHEN AN ARC MAY BE DRAWN ─────────────────────────────────────────────
   The sector is a size hint even with the colours off: a wide obtuse wedge and
   a narrow acute one are told apart at a glance, which hands over the answer to
   all three activities. So inside an activity the arc stops being decoration
   and becomes the REVEAL — it is drawn only for the angle being asked about
   and for the ones the learner has actually chosen, which is exactly when
   comparing the two sizes is the point rather than a give-away.

   Where an arc is withheld the sector is still drawn, transparent, so the
   angle stays the same size to tap; a dot on its bisector says which angle it
   is without saying how big. */
function arcVisible(w) {
  if (!state.arcs) return false;          // the settings switch: none, anywhere
  const q = state.quiz;
  if (!isQuiz() || !q) return true;       // exploring — show them all

  if (q.mode === 'quiz_pick') {
    // the question angle, plus everything tried against it
    return w === q.reference || q.tried?.includes(w);
  }
  // the other two ask about a pair, so both arcs arrive together, on answering
  return Boolean(q.settled) && q.pair.includes(w);
}

/* Which angles this activity wants lit, and how brightly. */
function quizOpacity(w) {
  const q = state.quiz;
  if (!q) return null;
    if (q.mode === 'quiz_equal_supp' || q.mode === 'quiz_identify') {
    return q.pair.includes(w) ? 0.9 : 0.12;
  }
  if (w === q.reference) return 0.9;
  if (q.gotEqual === w || q.gotSupp === w) return 0.9;
  return q.settled ? 0.12 : 0.4;   // still choosable until the round is done
}

function render() {
  gTransform.innerHTML = '';
  
  let A = state.tAngle;
  let d = state.distance;
  let r = state.radius;
  
  let M = { x: CX, y: CY };
  let tanA = Math.tan(rad(A));
  let hOffset = Math.abs(tanA) > 0.0001 ? (d / 2) / tanA : 0;
  
  let P1 = { x: CX - hOffset, y: CY - d / 2 };
  let P2 = { x: CX + hOffset, y: CY + d / 2 };
  
  if (state.grid) {
    if (!document.getElementById('grid-def')) {
      const defs = el('defs');
      const pat = el('pattern', { id: 'grid-def', width: '30', height: '30', patternUnits: 'userSpaceOnUse' });
      pat.appendChild(el('circle', { cx: '0', cy: '0', r: '1', fill: '#ccc' }));['30,0', '0,30', '30,30'].forEach(p => pat.appendChild(el('circle', { cx: p.split(',')[0], cy: p.split(',')[1], r: '1', fill: '#ccc' })));
      defs.appendChild(pat);
      svg.appendChild(defs);
    }
    gTransform.appendChild(el('rect', { x: '-50000', y: '-50000', width: '100000', height: '100000', fill: 'url(#grid-def)' }));
  }
  
  const gBase = el('g');
  
  gBase.appendChild(el('line', { x1: -5000, y1: P1.y, x2: 5000, y2: P1.y, stroke: '#0a0a0a', 'stroke-width': '2.5' }));
  gBase.appendChild(el('line', { x1: -5000, y1: P2.y, x2: 5000, y2: P2.y, stroke: '#0a0a0a', 'stroke-width': '2.5' }));
  
  let tx = Math.cos(rad(A)), ty = Math.sin(rad(A));
  gBase.appendChild(el('line', {
    x1: M.x - tx * 5000, y1: M.y - ty * 5000,
    x2: M.x + tx * 5000, y2: M.y + ty * 5000,
    stroke: '#0a0a0a', 'stroke-width': '2.5'
  }));

  gTransform.appendChild(gBase);

  if (state.protractor) gTransform.appendChild(buildProtractor(P1, P2, A, r));

  let wedges =[
    { w: 1, cx: P1.x, cy: P1.y, start: 180, sweep: A, color: '#ffe500', textFill: '#0a0a0a' },
    { w: 2, cx: P1.x, cy: P1.y, start: 180 + A, sweep: 180 - A, color: '#0055ff', textFill: '#ffffff' },
    { w: 3, cx: P1.x, cy: P1.y, start: A, sweep: 180 - A, color: '#0055ff', textFill: '#ffffff' },
    { w: 4, cx: P1.x, cy: P1.y, start: 0, sweep: A, color: '#ffe500', textFill: '#0a0a0a' },
    { w: 5, cx: P2.x, cy: P2.y, start: 180, sweep: A, color: '#ffe500', textFill: '#0a0a0a' },
    { w: 6, cx: P2.x, cy: P2.y, start: 180 + A, sweep: 180 - A, color: '#0055ff', textFill: '#ffffff' },
    { w: 7, cx: P2.x, cy: P2.y, start: A, sweep: 180 - A, color: '#0055ff', textFill: '#ffffff' },
    { w: 8, cx: P2.x, cy: P2.y, start: 0, sweep: A, color: '#ffe500', textFill: '#0a0a0a' }
  ];

  let modeCfg = getModeConfig(state.animMode, P1, P2, M);
  let t = state.animProgress;

  // Base Wedges Backgrounds
  wedges.forEach(wdg => {
    let isMover = modeCfg && modeCfg.movers.some(m => m.w === wdg.w);
    let isActiveMover = state.activeWedge === wdg.w;
    
    let mActive = modeCfg && state.activeWedge ? modeCfg.movers.find(m => m.w === state.activeWedge) : null;
    let targetForActive = mActive ? mActive.target : null;
    let partnerForActive = mActive ? mActive.partner : targetForActive;
    
    let isTarget = wdg.w === targetForActive;
    let isPartner = wdg.w === partnerForActive;

        let opacity = 0.85;
    let strokeDash = '';
    let strokeColor = '#0a0a0a';

    const quizOp = isQuiz() ? quizOpacity(wdg.w) : null;
    if (quizOp !== null) {
      opacity = quizOp;
    } else if (modeCfg) {
      if (state.activeWedge) {
        if (isActiveMover) opacity = 0.85;
        else if (modeCfg.supplementary && isPartner) opacity = 0.85; // Visually group supplementary partner
        else if (isTarget) { opacity = 0.25; strokeDash = '4,4'; } // Make target bed visible
        else { opacity = 0.04; strokeColor = 'rgba(10,10,10,0.2)'; }
      } else {
        if (isMover) opacity = 0.55; 
        else { opacity = 0.04; strokeColor = 'rgba(10,10,10,0.2)'; }
      }
    }

        /* In "Pick the Correct Angle" every angle but the reference is a valid
       tap, so they carry the same affordance class the animations use. */
    const quizPickable = state.animMode === 'quiz_pick'
      && state.quiz && !state.quiz.settled && wdg.w !== state.quiz.reference;

    let gWdg = el('g', {
       class: (isMover || quizPickable) ? 'sector-wedge valid-mover' : 'sector-wedge',
       'data-w': wdg.w
    });

        /* With colours off every angle is the same plain paper, so nothing about
       the fill says which family it is in — the activities then have to be
       reasoned out from position, which is the point of the switch. */
        const fill = state.colors ? wdg.color : 'var(--surface-secondary)';
    const showArc = arcVisible(wdg.w);

    /* Withheld: the same sector, painted transparent. It keeps its full hit
       area — an angle has to stay as easy to tap as it looks — while showing
       nothing of its size. `transparent` rather than `none` on purpose: `none`
       is unpainted, and an unpainted fill takes no pointer events. */
    gWdg.appendChild(el('path', {
      d: getSectorPath(wdg.cx, wdg.cy, wdg.start, wdg.sweep, r),
      fill: showArc ? fill : 'transparent',
      stroke: showArc ? strokeColor : 'none', 'stroke-width': '1.5',
      'stroke-dasharray': strokeDash, opacity: showArc ? opacity : 1
    }));

    /* A dot on the bisector marks the angle when its arc is withheld: it says
       WHICH angle without saying how big. */
    if (!showArc && opacity > 0.1) {
      const midDot = rad(wdg.start + wdg.sweep / 2);
      gWdg.appendChild(el('circle', {
        cx: wdg.cx + r * 0.5 * Math.cos(midDot),
        cy: wdg.cy + r * 0.5 * Math.sin(midDot),
        r: '3.5', fill: 'var(--ink)', opacity: opacity
      }));
    }

    let labelStr = '';
    if (state.showNames) labelStr += '∠' + wdg.w;
    if (state.showNames && state.showValues) labelStr += ': ';
    if (state.showValues) labelStr += Math.round(wdg.sweep) + '°';

    if (labelStr && opacity > 0.1) {
      let midA = rad(wdg.start + wdg.sweep / 2);
      let lx = wdg.cx + (r * 0.65) * Math.cos(midA);
      let ly = wdg.cy + (r * 0.65) * Math.sin(midA);
      
      gWdg.appendChild(txt(labelStr, {
        x: lx, y: ly + 3,
        'text-anchor': 'middle', 'dominant-baseline': 'middle',
        'font-family': 'JetBrains Mono,monospace', 'font-size': '11',
                        'font-weight': '700',
        fill: showArc && state.colors ? wdg.textFill : 'var(--ink)',
        opacity: opacity > 0.5 ? 1 : 0.7
      }));
    }
    gTransform.appendChild(gWdg);
  });

  // Animated Overlays for selected active Wedge
  if (modeCfg && t > 0 && state.activeWedge) {
    let m = modeCfg.movers.find(m => m.w === state.activeWedge);
    
    if (m) {
      let wdg = wedges.find(w => w.w === m.w);
      let gAnim = el('g');

      if (m.type === 'translate') {
        gAnim.setAttribute('transform', `translate(${m.dx * t}, ${m.dy * t})`);
      } else if (m.type === 'rotate') {
        gAnim.setAttribute('transform', `rotate(${180 * t}, ${m.cx}, ${m.cy})`);
      }

      gAnim.appendChild(el('path', {
        d: getSectorPath(wdg.cx, wdg.cy, wdg.start, wdg.sweep, r),
        fill: wdg.color, stroke: '#0a0a0a', 'stroke-width': '1.5',
        opacity: 0.95
      }));

      let labelStr = '';
      if (state.showNames) labelStr += '∠' + wdg.w;
      if (state.showNames && state.showValues) labelStr += ': ';
      if (state.showValues) labelStr += Math.round(wdg.sweep) + '°';

      if (labelStr) {
        let midA = rad(wdg.start + wdg.sweep / 2);
        let lx = wdg.cx + (r * 0.65) * Math.cos(midA);
        let ly = wdg.cy + (r * 0.65) * Math.sin(midA);
        
        let txtEl = txt(labelStr, {
          x: lx, y: ly + 3,
          'text-anchor': 'middle', 'dominant-baseline': 'middle',
          'font-family': 'JetBrains Mono,monospace', 'font-size': '11',
          'font-weight': '700', fill: wdg.textFill
        });
        
        // Counter-rotate the text label so it never flips upside down!
        if (m.type === 'rotate') {
           txtEl.setAttribute('transform', `rotate(${-180 * t}, ${lx}, ${ly + 3})`);
        }
        
        gAnim.appendChild(txtEl);
      }

      gTransform.appendChild(gAnim);
    }
  }

  // Draw OVERLAY details (Vertices and Center)
  if (state.showCenter) {
    gTransform.appendChild(el('circle', { cx: M.x, cy: M.y, r: '4', fill: '#0a0a0a' }));
  }

  if (state.showVertices) {
    gTransform.appendChild(el('circle', {
      cx: P1.x, cy: P1.y, r: '8', class: 'vert-handle', 'data-idx': '1', fill: '#fff'
    }));
    gTransform.appendChild(el('circle', {
      cx: P2.x, cy: P2.y, r: '8', class: 'vert-handle', 'data-idx': '2', fill: '#fff'
    }));
  }

  // Update DOM readouts
  let acute = Math.min(A, 180 - A);
  let obtuse = Math.max(A, 180 - A);
    document.getElementById('s-family-a').textContent = state.colors ? 'Yellow family' : 'Acute family';
  document.getElementById('s-family-b').textContent = state.colors ? 'Blue family' : 'Obtuse family';
  document.getElementById('s-angle-alpha').textContent = acute.toFixed(1) + '°';
  document.getElementById('s-angle-beta').textContent = obtuse.toFixed(1) + '°';

  const modeNames = {
    none: 'Angles Explorer',
        quiz_equal_supp: 'Equal or Supplementary',
        quiz_pick: 'Pick the Correct Angle',
    quiz_identify: 'Name the Pair',
    vert_opp: 'Vertically Opposite',
    corresponding: 'Corresponding',
    alt_int: 'Alternate Interior',
    alt_ext: 'Alternate Exterior',
    cons_int: 'Consecutive Interior',
    cons_ext: 'Consecutive Exterior'
  };
  
  document.getElementById('poly-badge').textContent = modeNames[state.animMode];
  document.getElementById('s-mode-name').textContent = modeNames[state.animMode];

    let relStr = 'Supp: α + β = 180°';
  if (isQuiz()) {
    const q = state.quiz;
    relStr = q ? `Score ${q.right} of ${q.asked}` : 'Activity';
  } else if (state.animMode !== 'none') {
    if(!state.activeWedge) {
       relStr = 'Tap a sector to animate!';
    } else {
       relStr = modeCfg.supplementary ? 'Supplementary (Sum = 180°)' : 'Equal pairs (α=α, β=β)';
    }
  }
  document.getElementById('s-relationship').textContent = relStr;
}

const resizeObserver = new ResizeObserver(entries => {
  for (let entry of entries) {
    const { width, height } = entry.contentRect;
    if (width > 0 && height > 0) {
      if (Math.abs(VW - width) > 2 || Math.abs(VH - height) > 2) {
        VW = width; VH = height; CX = VW / 2; CY = VH / 2;
        svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
        if (isInitialized) render();
      }
    }
  }
});
resizeObserver.observe(document.querySelector('.canvas-frame'));

function wire(id, key, transform, displayId, displayFmt) {
  const elem = document.getElementById(id), dv = displayId ? document.getElementById(displayId) : null;
  elem.addEventListener('input', () => {
    state[key] = transform(elem.value);
    if (dv) dv.textContent = displayFmt ? displayFmt(state[key]) : state[key];
    render();
  });
}

function wireToggle(id, key) {
  document.getElementById(id).addEventListener('change', (e) => {
    state[key] = e.target.checked; render();
  });
}

wire('sl-angle', 'tAngle', parseInt, 'dv-angle', v => v + '°');
wire('sl-dist', 'distance', parseInt, 'dv-dist', null);
wire('sl-radius', 'radius', parseInt, 'dv-radius', null);

wire('sl-anim', 'animProgress', parseFloat, 'dv-anim-val', v => {
  if (animReq) cancelAnimationFrame(animReq); // halt automation if user grabs it
  return Math.round(v * 100) + '%';
});

wireToggle('t-values', 'showValues');
wireToggle('t-names', 'showNames');
wireToggle('t-vertices', 'showVertices');
wireToggle('t-center', 'showCenter');
wireToggle('t-grid', 'grid');
wireToggle('t-protractor', 'protractor');
wireToggle('t-colors', 'colors');
wireToggle('t-arcs', 'arcs');

// Animation Mode Selector
document.querySelectorAll('.anim-mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    /* Mid-question in "Name the Pair", these six notes are the answer sheet,
       not the mode switcher. The three activity notes still switch. */
    if (state.animMode === 'quiz_identify' && REL_MODES.includes(btn.dataset.mode)) {
      answerIdentify(btn.dataset.mode);
      return;
    }
    document.querySelectorAll('.anim-mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.animMode = btn.dataset.mode;
    
    // Purge old states and configurations
    if (animReq) cancelAnimationFrame(animReq);
    state.activeWedge = null;
    state.animProgress = 0;
    
    let sl = document.getElementById('sl-anim');
    sl.disabled = true; // Stays disabled until a sector is tapped
    sl.value = 0;
    
        document.getElementById('dv-anim-val').textContent = '0%';

    /* Leaving an activity clears the score; entering one deals a question.
       Moving between the two activities keeps the running total, since it is
       the same skill either way. */
        if (isQuiz()) startQuiz(state.animMode);
    else {
      state.quiz = null;
      document.querySelector('.anim-modes').classList.remove('is-naming');
      document.querySelectorAll('.anim-mode-btn').forEach((b) =>
        b.classList.remove('is-picked', 'is-answer', 'is-answering'));
      syncQuizUI();
    }
    render();
  });
});

document.querySelectorAll('.quiz-choice').forEach((btn) => {
  btn.addEventListener('click', () => answerEqualSupp(btn.dataset.answer));
});

document.getElementById('quiz-next').addEventListener('click', nextQuestion);

/* Changing the figure mid-question would change the answer under the learner,
   so a fresh question is dealt whenever the angle moves. */
document.getElementById('sl-angle').addEventListener('change', () => {
  if (isQuiz() && state.quiz && !state.quiz.settled) nextQuestion();
});

function applyZoom(zoomFactor, svgMx = VW / 2, svgMy = VH / 2) {
  let newScale = Math.max(0.2, Math.min(vScale * zoomFactor, 20));
  vX = svgMx - (svgMx - vX) * (newScale / vScale);
  vY = svgMy - (svgMy - vY) * (newScale / vScale);
  vScale = newScale;
  updateView();
}

document.getElementById('btn-zoom-in').onclick = () => applyZoom(1.25);
document.getElementById('btn-zoom-out').onclick = () => applyZoom(0.8);
document.getElementById('btn-zoom-reset').onclick = () => { vX = 0; vY = 0; vScale = 1; updateView(); };

let isDragging = false;
let startX, startY, startVx, startVy;
let dragVertIdx = null, startVertPos = null;

svg.addEventListener('wheel', e => {
  e.preventDefault();
  const rect = svg.getBoundingClientRect();
  applyZoom(e.deltaY < 0 ? 1.15 : 0.85, (e.clientX - rect.left) * (VW / rect.width), (e.clientY - rect.top) * (VW / rect.width));
}, { passive: false });

svg.addEventListener('pointerdown', e => {
  if (e.target.closest('.anim-panel') || e.target.closest('.zoom-controls')) return;
  
  // -- NEW INTERACTION LAYER --
    const wedgeNode = e.target.closest('.valid-mover');
  if (wedgeNode) {
    let wId = parseInt(wedgeNode.getAttribute('data-w'));
    if (state.animMode === 'quiz_pick') {
      answerPick(wId);
      e.stopPropagation();
      return;
    }
    state.activeWedge = wId;
    state.animProgress = 0;
    document.getElementById('sl-anim').disabled = false;
    runAnim(1); // Auto-fire the animation to the pair target!
    e.stopPropagation();
    return;
  }
  
  const handle = e.target.closest('.vert-handle');
  if (handle) {
    dragVertIdx = parseInt(handle.dataset.idx);
    
    let A = state.tAngle, d = state.distance;
    let tanA = Math.tan(rad(A));
    let hOffset = Math.abs(tanA) > 0.0001 ? (d / 2) / tanA : 0;
    
    if (dragVertIdx === 1) startVertPos = { x: CX - hOffset, y: CY - d / 2 };
    else startVertPos = { x: CX + hOffset, y: CY + d / 2 };

    vertDragStart = { x: e.clientX, y: e.clientY };
    svg.setPointerCapture(e.pointerId);
    e.stopPropagation();
    return;
  }
  
  isDragging = true;
  startX = e.clientX; startY = e.clientY;
  startVx = vX; startVy = vY;
  svg.setPointerCapture(e.pointerId);
});

svg.addEventListener('pointermove', e => {
  const rect = svg.getBoundingClientRect();
  const scaleRatio = VW / rect.width;
  
  if (dragVertIdx !== null) {
    let dx = (e.clientX - vertDragStart.x) * scaleRatio / vScale;
    let dy = (e.clientY - vertDragStart.y) * scaleRatio / vScale;
    
    if (dragVertIdx === 1) { // P1 (Top point) Only shifts X to manipulate angle
      let newX = startVertPos.x + dx;
      let newA = deg(Math.atan2(state.distance, 2 * CX - 2 * newX));
      if (newA < 0) newA += 360;
      if (newA > 180) newA -= 180;
      
      state.tAngle = clamp(newA, 10, 170);
      document.getElementById('sl-angle').value = Math.round(state.tAngle);
      document.getElementById('dv-angle').textContent = Math.round(state.tAngle) + '°';
      
    } else if (dragVertIdx === 2) { // P2 (Bottom point) Manipulates Angle AND Distance
      let newX = startVertPos.x + dx;
      let newY = startVertPos.y + dy;
      
      let newD = clamp(2 * (newY - CY), 60, 320);
      state.distance = newD;
      
      let newA = deg(Math.atan2(newD, 2 * newX - 2 * CX));
      if (newA < 0) newA += 360;
      if (newA > 180) newA -= 180;
      
      state.tAngle = clamp(newA, 10, 170);
      document.getElementById('sl-dist').value = Math.round(state.distance);
      document.getElementById('dv-dist').textContent = Math.round(state.distance);
      document.getElementById('sl-angle').value = Math.round(state.tAngle);
      document.getElementById('dv-angle').textContent = Math.round(state.tAngle) + '°';
    }
    render();
    return;
  }
  
  if (!isDragging) return;
  vX = startVx + (e.clientX - startX) * scaleRatio;
  vY = startVy + (e.clientY - startY) * scaleRatio;
  updateView();
});

svg.addEventListener('pointerup', e => {
  dragVertIdx = null; isDragging = false;
  svg.releasePointerCapture(e.pointerId);
});
svg.addEventListener('pointercancel', () => { dragVertIdx = null; isDragging = false; });

let initialPinchDist = null, initialScale = 1;
svg.addEventListener('touchstart', e => {
  if (e.touches.length === 2) {
    isDragging = false; dragVertIdx = null;
    initialPinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    initialScale = vScale;
  }
}, { passive: false });

svg.addEventListener('touchmove', e => {
  if (e.touches.length === 2 && initialPinchDist) {
    e.preventDefault();
    const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    const center = { x: (e.touches[0].clientX + e.touches[1].clientX) / 2, y: (e.touches[0].clientY + e.touches[1].clientY) / 2 };
    const scaleFactor = dist / initialPinchDist;
    const newScale = Math.max(0.2, Math.min(initialScale * scaleFactor, 20));
    const rect = svg.getBoundingClientRect();
    const svgMx = (center.x - rect.left) * (VW / rect.width);
    const svgMy = (center.y - rect.top) * (VW / rect.width);
    vX = svgMx - (svgMx - vX) * (newScale / vScale);
    vY = svgMy - (svgMy - vY) * (newScale / vScale);
    vScale = newScale; initialScale = newScale; initialPinchDist = dist;
    updateView();
  }
}, { passive: false });
svg.addEventListener('touchend', e => { if (e.touches.length < 2) initialPinchDist = null; });

const overlay = document.getElementById('overlay'), fab = document.getElementById('fab'), close = document.getElementById('modal-close');
fab.addEventListener('click', () => overlay.classList.add('open'));
close.addEventListener('click', () => overlay.classList.remove('open'));
overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') overlay.classList.remove('open'); });

isInitialized = true;
render();