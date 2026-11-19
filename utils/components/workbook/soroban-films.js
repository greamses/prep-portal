/* ============================================================================
   THE SOROBAN — a full tutorial, in ten films (topic "soroban")
   ----------------------------------------------------------------------------
   In the order the user asked for:
     sor-count    counting on one rod: the beam, five on top, ones below
     sor-place    place value: the ones rod by its dot, reading and setting
     sor-simple   simple adding and taking away (the beads are free)
     sor-fives    adding and taking away with the five bead
     sor-small    small friends (friends of five), both ways
     sor-big      big friends (friends of ten), both ways
     sor-multi    multidigit sums, from the left, friends wherever needed
     sor-anzan    flash anzan: the soroban in your head
     sor-times1   two digits times one digit
     sor-times2   two digits times two digits

   THE PICTURE IS A REAL SOROBAN, drawn in the site's 2D look (the Drills
   soroban and the Manipulatives workbench: orange timber frame, grey rods,
   a beam with a unit dot on every third rod, bicone beads in place colours,
   the heaven bead darker). Its beads SLIDE: a step never swaps one finished
   soroban for another, it moves the beads the words are talking about, in
   the order a hand would move them (five down first, then the friend off).

   Every bead position is set ABSOLUTELY (a rod is told its digit), so a step
   replayed by the film kit lands on the same picture however it is reached;
   a generation counter on the drawing drops any slide still waiting from a
   step that has been left.
   ========================================================================== */

import { film, cueAt } from "./film-kit.js";
import { svgBox, PAPER, PIC_W } from "./cbt-films.js";
/* THE SITE'S OWN 2D SOROBAN (user: "Use the 2D soroban that we have for the video"): the very drawing
   Drills and the practice board use, drawn here at U millimetres to a unit */
import { sorobanGeom, sorobanMarkup, slideRod } from "../soroban-svg.js";

const INK = "#2a2723", RED = "#c0453f", GREEN = "#2f7d4a", BLUE = "#2f6f8f", PURPLE = "#6b4fa0";
const NAMES = ["1", "10", "100", "1 000", "10 000"];

/* BIGGER ("Make the soroban bigger in the videos"): the sheet spans the whole screen (96 of its 100
   width-units, against 60 for the other films) and the soroban is drawn at 4.65mm to a unit, so it
   stands about two thirds of the screen tall. The working line sits to its lower right and the rule
   cards to its lower left, leaving the middle to the soroban. */
const U = 4.65, TOP = 7.5, SHEET = 150, MID = SHEET / 2;
const BIG = 96;
/* THE BEADS KEEP UP WITH THE VOICE: "the voice is faster than the counting". The word clock (cueAt)
   assumes 2.4 words a second; the lesson voice is quicker, so every bead's moment is brought forward. */
const PACE = 0.78;

const isInstant = (H) => H.show === H.grow;
const f = (n) => n.toFixed(2);
const geomOf = (rods) => sorobanGeom(rods, U);

/** The soroban with `rods` rods (the ones rod on the right), every bead away from the beam, with its
    labels (the parts, named with leader lines), the place names, a figure under each rod and a working line. */
function sorobanPic(rods) {
  const g = geomOf(rods), x0 = MID - g.W / 2, cx = (p) => x0 + g.cx(p);
  const READ_Y = TOP + g.H + 1.5, WORK_X = x0 + g.W + 5, WORK_Y = TOP + g.H * 0.86;
  let o = `<g data-k="sor" transform="translate(${f(x0)} ${TOP})">${sorobanMarkup(rods, { U })}</g>`;
  for (let p = 0; p < rods; p++) {
    const x = cx(p), yName = p % 2 ? 2.6 : 5.6;
    o += `<g data-mb="name" data-k="lab${p}"><text x="${f(x)}" y="${yName}" text-anchor="middle" font-family="STIX Two Text, serif" font-size="2.8" fill="${BLUE}">${NAMES[p] || ""}</text></g>`;
    o += `<g data-mb="num" data-k="rd${p}"><rect x="${f(x - 2.8)}" y="${f(READ_Y)}" width="5.6" height="7" fill="#fffdf8" stroke="${INK}" stroke-width="0.4"/>`
      + `<text data-k="rt${p}" x="${f(x)}" y="${f(READ_Y + 5.4)}" text-anchor="middle" font-family="STIX Two Text, serif" font-size="4.6" fill="${INK}">0</text></g>`;
  }
  /* THE LABELS: "Add labels to the soroban". Right side: the five bead, the beam, the one beads;
     left side: the frame and a rod. Each is a word with a leader line to the part. */
  const R = x0 + g.W, Lx = x0, ones = cx(0), last = cx(rods - 1), bw = 0.65 * U;
  const lab = (k, tx, ty, anchor, text, lx1, ly1) => `<g data-mb="name" data-k="${k}">`
    + `<path d="M${f(anchor === "start" ? tx - 0.8 : tx + 0.8)} ${f(ty - 1)} L${f(lx1)} ${f(ly1)}" fill="none" stroke="${PURPLE}" stroke-width="0.3"/>`
    + `<circle cx="${f(lx1)}" cy="${f(ly1)}" r="0.45" fill="${PURPLE}"/>`
    + `<text x="${f(tx)}" y="${f(ty)}" text-anchor="${anchor}" font-family="JetBrains Mono, monospace" font-weight="700" font-size="3" fill="${PURPLE}">${text}</text></g>`;
  o += lab("lbH", R + 4, TOP + g.heavenY + 0.9, "start", "five bead: 5", ones + bw, TOP + g.heavenY);
  o += lab("lbB", R + 4, TOP + g.barY + 0.9, "start", "beam", R - g.timber, TOP + g.barY);
  o += lab("lbE", R + 4, TOP + g.earthY(1) + 3, "start", "one beads: 1 each", ones + bw, TOP + g.earthY(1) + 1);
  o += lab("lbD", R + 4, TOP + g.barY + 5.2, "start", "dot: the ones rod", ones, TOP + g.barY);
  o += lab("lbF", Lx - 4, TOP + 3.2, "end", "frame", Lx + g.timber / 2, TOP + 2.4);
  o += lab("lbR", Lx - 4, TOP + g.H * 0.8, "end", "rod", last, TOP + g.H * 0.8 - 1);
  o += `<g data-mb="num" data-k="work"><text data-k="wt" x="${f(WORK_X)}" y="${f(WORK_Y)}" text-anchor="start" font-family="STIX Two Text, serif" font-size="6.2" fill="${GREEN}"></text></g>`;
  return svgBox(SHEET, READ_Y + 8, o);
}
const LABELS = ["lbF", "lbR", "lbB", "lbH", "lbE", "lbD"];

/* ── the hand on the soroban ──────────────────────────────────────────────── */
const q = (s, k) => (s ? s.querySelector(`[data-k="${k}"]`) : null);
const beadOf = (s, p, part) => (s ? s.querySelector(`[data-bead="${p}${part}"]`) : null);
const digitsOf = (n, rods) => String(Math.max(0, n)).padStart(rods, "0").slice(-rods).split("").map(Number).reverse(); // [ones, tens, …]

/** Slide a rod's beads to show v. */
function setRod(s, p, v, H, delay, gen, rods) {
  const go = () => {
    if (!s || s.__gen !== gen) return;
    slideRod(s, p, v, geomOf(rods), { instant: isInstant(H) });
    /* a figure already showing under this rod follows its beads */
    const rd = q(s, `rd${p}`), rt = q(s, `rt${p}`);
    if (rd && rt && Number(getComputedStyle(rd).opacity) > 0.5) rt.textContent = String(v);
  };
  if (isInstant(H) || delay <= 0.01) go(); else setTimeout(go, delay * 1000);
}

/** Light a mark red for a moment (a bead's body, the beam, a dot). */
function glow(s, n, H, delay, hold = 1.6) {
  if (!n || isInstant(H)) return;
  const gen = s.__gen;
  const marks = n.matches("g") ? [...n.querySelectorAll(".sb-body")] : [n];
  setTimeout(() => {
    if (s.__gen !== gen) return;
    marks.forEach((m) => { m.style.stroke = RED; m.style.strokeWidth = "0.7"; });
    setTimeout(() => marks.forEach((m) => { m.style.stroke = ""; m.style.strokeWidth = ""; }), hold * 1000);
  }, delay * 1000);
}

/** One step's actions, each tied to the words that name it. */
function runner(rods, say, acts) {
  return (s, H) => {
    if (!s) return;
    if (isInstant(H)) s.__gen = (s.__gen || 0) + 1;
    const gen = s.__gen = s.__gen || 1;
    /* a figure changes when its words are said, with its beads, never at the start of the step */
    const later = (at, fn) => { if (isInstant(H) || at <= 0.01) fn(); else setTimeout(() => { if (s.__gen === gen) fn(); }, at * 1000); };
    acts.forEach(([when, kind, a, b]) => {
      const at = isInstant(H) ? 0 : typeof when === "number" ? when : cueAt(say, when) * PACE;
      if (kind === "num") {                                   // the whole soroban shows a number
        const d = digitsOf(a, rods);
        d.forEach((v, p) => setRod(s, p, v, H, at + (b ? 0 : (rods - 1 - p) * 0.08), gen, rods));
        if (!isInstant(H)) H.sound("tick", at);
      } else if (kind === "rod") {                            // one rod to a digit
        setRod(s, a, b, H, at, gen, rods);
        if (!isInstant(H)) H.sound("tick", at);
      } else if (kind === "read") {                           // write the figures under the rods
        const d = digitsOf(a, rods), places = b ?? rods;
        for (let p = 0; p < rods; p++) {
          const g = q(s, `rd${p}`), t = q(s, `rt${p}`);
          if (!g || !t) continue;
          if (p < places) later(at + (places - 1 - p) * 0.3, () => { t.textContent = String(d[p]); H.write(g, 0); });
          else later(at, () => { g.style.opacity = "0"; });
        }
      } else if (kind === "unread") {
        later(at, () => { for (let p = 0; p < rods; p++) { const g = q(s, `rd${p}`); if (g) g.style.opacity = "0"; } });
      } else if (kind === "label") {
        (a || []).forEach((p, i) => H.write(q(s, `lab${p}`), at + i * 0.45));
      } else if (kind === "work") {
        later(at, () => {
          const t = q(s, "wt");
          if (t) {
            /* beside the soroban: two rules set apart by spaces stack one under the other, and a line too
               long for the room left of the sheet's edge is written smaller */
            const parts = String(a).split(/\s{3,}/), x = t.getAttribute("x"), room = 150 - Number(x) - 2;
            const size = Math.min(6.2, room / (0.5 * Math.max(...parts.map((l) => l.length))));
            t.setAttribute("font-size", size.toFixed(2));
            t.innerHTML = parts.map((l, i) => `<tspan x="${x}" dy="${i ? (size * 1.25).toFixed(2) : 0}">${l.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</tspan>`).join("");
          }
          H.write(q(s, "work"), 0);
        });
      } else if (kind === "unwork") {
        later(at, () => { const g = q(s, "work"); if (g) g.style.opacity = "0"; });
      } else if (kind === "glow") {                           // a bead: "h", or "e" for every earth bead in
        if (a === "beam") glow(s, s.querySelector('[data-sk="beam"]'), H, at);
        else if (a === "dot") glow(s, s.querySelector(`[data-sk="dot${b || 0}"]`), H, at, 2.2);
        else if (a === "rod") glow(s, s.querySelector(`[data-sk="rod${b || 0}"]`), H, at, 2.2);
        else if (a === "frame") glow(s, s.querySelector('[data-sk="frame"]'), H, at, 2.2);
        else if (b === "h") glow(s, beadOf(s, a, "h"), H, at);
        else for (let i = 0; i < 4; i++) glow(s, beadOf(s, a, `e${i}`), H, at + i * 0.12);
      } else if (kind === "labels") {                          // name the parts: all of them, or the ones listed
        (a || LABELS).forEach((k, i) => H.write(q(s, k), at + i * (a ? 0.5 : 0.15)));
      } else if (kind === "ding") {
        if (!isInstant(H)) H.sound("ding", at);
      }
    });
  };
}

/** A soroban film: `steps` = [{ say: [lines], acts: [[when, kind, a, b]], card: [title, sub], pause, rule: id-on/off }] */
function sorFilm({ rods, ask, rules = [], steps, taught = false }) {
  const stages = {};
  /* the parts are labelled from the start, except in the lesson that names them one by one */
  if (!taught) steps[0].acts = [[0, "labels"], ...(steps[0].acts || [])];
  steps.forEach((st, i) => { st.text = st.say.join(" "); if (st.acts?.length) stages[`sb.s${i}`] = runner(rods, st.text, st.acts); });
  return film({
    paperMm: PAPER, picW: BIG,
    asks: [{ id: "a1", text: ask }],
    pics: { sb: () => sorobanPic(rods) },
    picAt: { sb: { x: 50 - (SHEET * (BIG / PAPER)) / 2, y: 8.5 } },
    lines: rules.map(([id, sub, text]) => ({ id, receipt: true, sub, text, x: 21, y: 49 })),
    stages,
    steps: ({ push }) => steps.forEach((st, i) => {
      push(st.text, {
        on: i === 0 ? ["a1", "sb", ...(st.on || [])] : st.on || [],
        off: st.off || [],
        add: st.acts?.length ? [`sb.s${i}`] : [],
        ...(st.card ? { transition: { kind: "card", title: st.card[0], sub: st.card[1], hold: 1.6 } } : i === 0 ? { transition: "iris" } : {}),
        pause: st.pause ?? 0.7,
      });
    }),
  });
}
const CLEAR = [0, "num", 0, true];

/* ═══ 1. COUNTING ON A SOROBAN ═════════════════════════════════════════════ */
export const sorCount = () => sorFilm({
  rods: 3, taught: true,
  ask: "How do you count from nought to nine on one rod of a soroban?",
  rules: [["r1", "The one rule", "A bead counts only when it touches the beam"], ["r2", "The top bead", "Worth five"]],
  steps: [
    { say: ["This is a soroban.", "It's a Japanese abacus, and with it you can add and take away faster than you can write.", "Before any sums, let's learn how it counts."], acts: [CLEAR] },
    { card: ["The parts", "Frame, beam, rods and beads"], say: ["The wooden border all round is the frame.", "Look at the long bar across the middle.", "That's the beam.", "Each wire going up and down is a rod.", "On every rod, there's one bead above the beam... and four beads below it."],
      acts: [["the frame", "glow", "frame"], ["the frame", "labels", ["lbF"]], ["the beam", "glow", "beam"], ["the beam", "labels", ["lbB"]], ["is a rod", "glow", "rod", 2], ["is a rod", "labels", ["lbR"]],
        ["one bead above", "glow", 0, "h"], ["one bead above", "labels", ["lbH"]], ["four beads below", "glow", 0, "e"], ["four beads below", "labels", ["lbE"]]] },
    { on: ["r1"], say: ["Now here's the one rule that matters.", "A bead counts only when it touches the beam.", "Right now, nothing is touching it.", "So this rod shows nought."],
      acts: [["shows nought", "read", 0, 1]] },
    { off: ["r1"], card: ["Counting", "One to four"], say: ["The beads below the beam are worth one each.", "Push one up with your thumb... one.", "Another... two.", "Three.", "Four."],
      acts: [["one.", "rod", 0, 1], ["one.", "read", 1, 1], ["two.", "rod", 0, 2], ["two.", "read", 2, 1], ["Three.", "rod", 0, 3], ["Three.", "read", 3, 1], ["Four.", "rod", 0, 4], ["Four.", "read", 4, 1]] },
    { on: ["r2"], say: ["Now we want five.", "But look, there are no more beads below the beam.", "Here's the trick.", "The bead on top is worth five.", "Bring it down to the beam...", "and push the four ones away.", "That's five."],
      acts: [["Bring it down", "rod", 0, 9], ["push the four", "rod", 0, 5], ["That's five", "read", 5, 1]], pause: 1 },
    { off: ["r2"], card: ["Counting", "Six to nine"], say: ["Six is five and one.", "The five stays down, and one bead comes up.", "Seven.", "Eight.", "Nine."],
      acts: [["one bead comes up", "rod", 0, 6], ["one bead comes up", "read", 6, 1], ["Seven.", "rod", 0, 7], ["Seven.", "read", 7, 1], ["Eight.", "rod", 0, 8], ["Eight.", "read", 8, 1], ["Nine.", "rod", 0, 9], ["Nine.", "read", 9, 1]] },
    { say: ["So how do you read a rod?", "Look at the top bead first.", "Is it touching the beam? That's five.", "Then count the beads touching from below, and add them on.", "Five and four... nine.", "You get?"],
      acts: [["Look at the top", "glow", 0, "h"], ["count the beads", "glow", 0, "e"]], pause: 1.2 },
    { card: ["Example 1", "Show seven in one move"], say: ["Let's clear it first.", "Now show seven.", "Seven is five and two.", "So pinch: the five comes down and two ones come up, at the same time."],
      acts: [["clear it", "rod", 0, 0], ["clear it", "read", 0, 1], ["at the same time", "rod", 0, 7], ["at the same time", "read", 7, 1]] },
    { card: ["Example 2", "Show three"], say: ["Clear again, and show three.", "Three is less than five, so the top bead stays away.", "Three ones come up."],
      acts: [["Clear again", "rod", 0, 0], ["Clear again", "read", 0, 1], ["Three ones", "rod", 0, 3], ["Three ones", "read", 3, 1]] },
    { say: ["Here's the mistake everybody makes at first.", "They count every bead they can see.", "Only the beads touching the beam count.", "The rest are resting.", "Clear the rod, and practise counting to nine and back, until your fingers do it without you."],
      acts: [["The rest are resting", "glow", 0, "e"], ["Clear the rod", "rod", 0, 0], ["Clear the rod", "read", 0, 1]] },
  ],
});

/* ═══ 2. PLACE VALUE ═══════════════════════════════════════════════════════ */
export const sorPlace = () => sorFilm({
  rods: 5,
  ask: "How do you read 3,072 and set 805 on a soroban?",
  rules: [["r1", "Find the ones", "The dot on the right marks the ones rod"], ["r2", "The trap", "An empty rod is a nought"]],
  steps: [
    { say: ["One rod counts to nine.", "But real numbers have more than one figure.", "On a soroban, every rod is a place."], acts: [CLEAR] },
    { on: ["r1"], card: ["Finding the ones", "Look for the dot"], say: ["First, find the ones rod.", "See the little dots on the beam?", "Each one marks a ones rod.", "Use the dot on the right, and that rod is your ones."],
      acts: [["little dots", "glow", "dot", 3], ["little dots", "glow", "dot", 0], ["dot on the right", "label", [0]], ["dot on the right", "labels", ["lbD"]]] },
    { say: ["Going left, the next rod is the tens.", "Then the hundreds.", "Then thousands, and ten thousands.", "Same as the places in a number you write."],
      acts: [["next rod is the tens", "label", [1]], ["the hundreds", "label", [2]], ["Then thousands", "label", [3, 4]]] },
    { off: ["r1"], say: ["Every rod counts the same way as before.", "Five on top, ones below.", "But a bead on the tens rod is worth ten, not one.", "And a bead on the hundreds rod is worth a hundred."],
      acts: [["tens rod", "glow", 1, "e"], ["hundreds rod", "glow", 2, "e"]] },
    { card: ["Example 1", "Read it"], say: ["Read this one.", "Ones rod: the five is down, and one more. Six.", "Tens rod: four beads up. Four tens.", "So that's forty six."],
      acts: [[0, "num", 46], ["Ones rod", "glow", 0, "h"], ["Six.", "read", 46, 1], ["Four tens", "read", 46, 2], ["forty six", "ding"]], pause: 1 },
    { card: ["Example 2", "Read 3,072"], say: ["Now a bigger one.", "We read it from the left, the way we say it.", "Thousands: three.", "Hundreds: nothing touching the beam. That's a nought, and it still counts.", "Tens: five and two. Seven.", "Ones: two.", "Three thousand and seventy two."],
      acts: [[0, "unread"], [0, "num", 3072], ["Thousands: three", "read", 3072, 4], ["Three thousand and", "ding"]], pause: 1 },
    { on: ["r2"], say: ["Here's the trap.", "An empty rod in the middle is a nought.", "If you skip it, you'd read three hundred and seventy two.", "That's ten times too small."],
      acts: [["empty rod", "glow", 2, "e"]], pause: 1 },
    { off: ["r2"], card: ["Setting a number", "Set 805"], say: ["Now the other way round. Let's set eight hundred and five.", "Clear the soroban.", "We set from the left, the way we read.", "Hundreds: eight. Five down, three up.", "Tens: nothing.", "Ones: five. The top bead down."],
      acts: [[0, "unread"], ["Clear the soroban", "num", 0, true], ["Five down, three up", "rod", 2, 8], ["The top bead down", "rod", 0, 5], ["The top bead down", "read", 805, 3]] },
    { card: ["Example 4", "Set 2,019"], say: ["One more. Two thousand and nineteen.", "Thousands: two.", "Hundreds: nought, leave it empty.", "Tens: one.", "Ones: nine. Five down, four up.", "Read it back to check: two thousand and nineteen."],
      acts: [[0, "unread"], [0, "num", 0, true], ["Thousands: two", "rod", 3, 2], ["Tens: one", "rod", 1, 1], ["Five down, four up", "rod", 0, 9], ["Read it back", "read", 2019, 4]] },
    { say: ["To clear the soroban, push every bead away from the beam.", "Then you're ready for the next number.", "Find the dot, name the places, read from the left."],
      acts: [[0, "unread"], ["push every bead", "num", 0]] },
  ],
});

/* ═══ 3. SIMPLE ADDING AND TAKING AWAY ═════════════════════════════════════ */
export const sorSimple = () => sorFilm({
  rods: 3,
  ask: "Work out 12 + 31, then 43 − 21, on the soroban.",
  rules: [["r1", "Adding", "Push beads up to the beam"], ["r2", "Taking away", "Pull beads down, off the beam"]],
  steps: [
    { say: ["Adding on a soroban is pushing beads to the beam.", "Taking away is pushing them off.", "In this lesson, the beads we need are always free and waiting."], acts: [CLEAR] },
    { on: ["r1"], card: ["Adding", "Push up"], say: ["Set two.", "Now add one: one more bead up. Three.", "Add one more... four."],
      acts: [["Set two", "rod", 0, 2], ["Three.", "rod", 0, 3], ["Three.", "work", "2 + 1 = 3"], ["four.", "rod", 0, 4], ["four.", "work", "3 + 1 = 4"]] },
    { say: ["That's what simple means.", "The beads you need are right there below the beam, free to push.", "Nothing else has to move."], acts: [["right there", "glow", 0, "e"]] },
    { off: ["r1"], on: ["r2"], card: ["Taking away", "Pull down"], say: ["Four take away three.", "Pull three beads down, away from the beam.", "One left."],
      acts: [["Pull three", "rod", 0, 1], ["One left", "work", "4 − 3 = 1"]], pause: 1 },
    { off: ["r2"], card: ["Example 1", "12 + 31"], say: ["Now bigger numbers: twelve plus thirty one.", "Set twelve first. One ten and two ones."],
      acts: [[0, "unwork"], [0, "num", 0, true], ["One ten and two ones", "num", 12], ["One ten and two ones", "read", 12, 2]] },
    { say: ["We add from the left, the big place first.", "Thirty: three more beads on the tens rod. Four tens.", "One: one more bead on the ones. Three.", "Forty three."],
      acts: [["Four tens", "rod", 1, 4], ["Four tens", "read", 42, 2], ["one more bead", "rod", 0, 3], ["Forty three", "read", 43, 2], ["Forty three", "work", "12 + 31 = 43"], ["Forty three", "ding"]], pause: 1 },
    { say: ["Why from the left?", "Because that's how we say the number.", "And later, when a rod fills up and spills into the next one, the next one is a rod you've already done."] },
    { card: ["Example 2", "43 − 21"], say: ["Forty three take away twenty one.", "Tens first: four take away two. Pull two down. Two tens.", "Ones: three take away one. Two.", "Twenty two."],
      acts: [[0, "unwork"], ["Pull two down", "rod", 1, 2], ["Pull two down", "read", 23, 2], ["Ones: three", "rod", 0, 2], ["Twenty two", "read", 22, 2], ["Twenty two", "work", "43 − 21 = 22"], ["Twenty two", "ding"]], pause: 1 },
    { say: ["One habit to start now.", "Your thumb pushes beads up.", "Your first finger pulls them down.", "Keep to that, and you won't knock a bead by accident."] },
  ],
});

/* ═══ 4. WITH THE FIVE BEAD ════════════════════════════════════════════════ */
export const sorFives = () => sorFilm({
  rods: 3,
  ask: "Work out 3 + 5, 2 + 6, 23 + 65 and 87 − 61 on the soroban.",
  rules: [["r1", "Adding 6 to 9", "Five down and the rest up, in one pinch"]],
  steps: [
    { say: ["Now the top bead joins in.", "Adding five is the easiest move on the whole soroban."], acts: [CLEAR] },
    { card: ["Adding five", "Bring the top bead down"], say: ["Set three.", "Add five: bring the top bead down to the beam.", "Three and five... eight."],
      acts: [["Set three", "rod", 0, 3], ["bring the top bead", "rod", 0, 8], ["eight.", "work", "3 + 5 = 8"]], pause: 1 },
    { on: ["r1"], card: ["Adding six to nine", "Five and some ones"], say: ["Two plus six.", "Six is five and one.", "So in one pinch, the top bead comes down and one bead comes up.", "Eight."],
      acts: [[0, "unwork"], [0, "rod", 0, 2], ["in one pinch", "rod", 0, 8], ["Eight.", "work", "2 + 6 = 8"]], pause: 1 },
    { say: ["Seven is five and two.", "Eight is five and three.", "Nine is five and four.", "Always the top bead, and the ones that are left over."] },
    { off: ["r1"], say: ["Try this one: one plus seven.", "Five down, two up...", "eight."],
      acts: [[0, "unwork"], [0, "rod", 0, 1], ["Five down", "rod", 0, 8], ["eight.", "work", "1 + 7 = 8"]], pause: 1.2 },
    { card: ["Taking away five", "The top bead goes back up"], say: ["Taking away five is the top bead going back up.", "Eight take away five: three."],
      acts: [[0, "unwork"], ["Eight take away", "rod", 0, 3], ["three.", "work", "8 − 5 = 3"]] },
    { say: ["Nine take away six.", "Top bead up, and one bead down, together.", "Three."],
      acts: [[0, "unwork"], [0, "rod", 0, 9], ["together", "rod", 0, 3], ["Three.", "work", "9 − 6 = 3"]], pause: 1 },
    { card: ["Example", "23 + 65"], say: ["Twenty three plus sixty five.", "Tens first: two plus six. Five down and one up. Eight tens.", "Ones: three plus five. Top bead down. Eight.", "Eighty eight."],
      acts: [[0, "unwork"], [0, "num", 23, true], [0, "read", 23, 2], ["Eight tens", "rod", 1, 8], ["Eight tens", "read", 83, 2], ["Top bead down", "rod", 0, 8], ["Eighty eight", "read", 88, 2], ["Eighty eight", "work", "23 + 65 = 88"], ["Eighty eight", "ding"]], pause: 1 },
    { card: ["Example", "87 − 61"], say: ["Eighty seven take away sixty one.", "Tens: eight take away six. Top bead up, one down. Two.", "Ones: seven take away one. Six.", "Twenty six."],
      acts: [[0, "unwork"], [0, "num", 87, true], [0, "read", 87, 2], ["Top bead up", "rod", 1, 2], ["Top bead up", "read", 27, 2], ["Ones: seven", "rod", 0, 6], ["Twenty six", "read", 26, 2], ["Twenty six", "work", "87 − 61 = 26"], ["Twenty six", "ding"]], pause: 1 },
    { say: ["One check before you move.", "To add five, the top bead must be free.", "If it's already down, you can't add five this way.", "That's where friends come in, in the next lesson."] },
  ],
});

/* ═══ 5. SMALL FRIENDS ═════════════════════════════════════════════════════ */
export const sorSmall = () => sorFilm({
  rods: 3,
  ask: "How do you add 4 to 3, when only one bead is free below the beam?",
  rules: [["r1", "Small friends", "1 and 4, 2 and 3: they make five"], ["r2", "Adding", "+4 = +5 − 1"], ["r3", "Taking away", "−4 = −5 + 1"]],
  steps: [
    { say: ["Set three.", "Now add four.", "Look below the beam: only one bead is free.", "We can't push four.", "So we call a friend."], acts: [CLEAR, ["Set three", "rod", 0, 3], ["only one bead", "glow", 0, "e"]], pause: 0.9 },
    { on: ["r1"], card: ["Small friends", "Friends of five"], say: ["Small friends are two numbers that make five.", "One and four.", "Two and three.", "That's all of them."], acts: [["One and four", "work", "1 + 4 = 5    2 + 3 = 5"]] },
    { off: ["r1"], on: ["r2"], say: ["To add four, add five, then take away four's friend, one.", "Adding five and giving one back is the same as adding four, right?"], acts: [["give", "work", "+4 = +5 − 1"]], pause: 1.2 },
    { say: ["Watch.", "Top bead down...", "and one bead off.", "Seven."], acts: [["Top bead down", "rod", 0, 8], ["one bead off", "rod", 0, 7], ["Seven.", "work", "3 + 4 = 7"], ["Seven.", "ding"]], pause: 1 },
    { card: ["Example 2", "4 + 3"], say: ["Four plus three.", "No free beads below at all.", "Three's friend is two.", "So add five, and take away two.", "Seven."],
      acts: [[0, "unwork"], [0, "rod", 0, 4], ["add five", "rod", 0, 9], ["take away two", "rod", 0, 7], ["Seven.", "work", "4 + 3 = 7"]], pause: 1 },
    { off: ["r2"], on: ["r3"], card: ["Taking away", "The friend comes back"], say: ["Now seven take away four.", "Only two beads are touching from below.", "So take away five, and give back four's friend, one.", "Three."],
      acts: [[0, "unwork"], [0, "rod", 0, 7], ["Only two beads", "glow", 0, "e"], ["take away five", "rod", 0, 2], ["give back", "rod", 0, 3], ["Three.", "work", "7 − 4 = 3"]], pause: 1 },
    { card: ["Example 4", "6 − 3"], say: ["Six take away three.", "Only one bead below the beam.", "Take five away... and give back three's friend, two.", "That leaves three."],
      acts: [[0, "unwork"], [0, "rod", 0, 6], ["Take five away", "rod", 0, 1], ["give back", "rod", 0, 3], ["That leaves", "work", "6 − 3 = 3"]], pause: 1 },
    { off: ["r3"], say: ["So, adding: five down, then the friend off.", "Taking away: five up, then the friend back on.", "Here's the trap: the order.", "If you take the friend off first, there's nothing there to take."],
      acts: [[0, "unwork"], ["adding", "work", "+n = +5 − friend    −n = −5 + friend"]] },
    { card: ["Example 5", "13 + 14"], say: ["One with two rods. Thirteen plus fourteen.", "Tens: one plus one, two. Simple.", "Ones: three plus four. Small friend: five down, one off. Seven.", "Twenty seven."],
      acts: [[0, "unwork"], [0, "num", 13, true], ["one plus one", "rod", 1, 2], ["five down", "rod", 0, 8], ["one off", "rod", 0, 7], ["Twenty seven", "read", 27, 2], ["Twenty seven", "work", "13 + 14 = 27"], ["Twenty seven", "ding"]], pause: 1 },
  ],
});

/* ═══ 6. BIG FRIENDS ═══════════════════════════════════════════════════════ */
export const sorBig = () => sorFilm({
  rods: 3,
  ask: "How do you add 3 to 9, when the rod is already full?",
  rules: [["r1", "Big friends", "1 & 9, 2 & 8, 3 & 7, 4 & 6, 5 & 5"], ["r2", "Adding", "+3 = −7 + 10"], ["r3", "Taking away", "−5 = −10 + 5"]],
  steps: [
    { say: ["Nine on the ones rod.", "Every bead is touching the beam.", "Add three... there's nowhere to go."], acts: [CLEAR, [0, "rod", 0, 9], ["Every bead", "glow", 0, "e"], ["Every bead", "glow", 0, "h"]], pause: 0.9 },
    { on: ["r1"], card: ["Big friends", "Friends of ten"], say: ["Big friends are two numbers that make ten.", "One and nine.", "Two and eight.", "Three and seven.", "Four and six.", "Five and five."] },
    { off: ["r1"], on: ["r2"], say: ["To add three, take away its big friend, seven.", "Then add one ten on the next rod.", "Taking seven away and adding ten... that's adding three, right?"], acts: [["take away its big friend", "work", "+3 = −7 + 10"]], pause: 1.2 },
    { say: ["Watch.", "Seven off the ones: two left.", "One bead up on the tens.", "Twelve."], acts: [["Seven off", "rod", 0, 2], ["One bead up", "rod", 1, 1], ["Twelve.", "read", 12, 2], ["Twelve.", "work", "9 + 3 = 12"], ["Twelve.", "ding"]], pause: 1 },
    { card: ["Example 2", "8 + 5"], say: ["Eight plus five.", "Five's big friend is five.", "Take five away: three.", "Add one ten.", "Thirteen."],
      acts: [[0, "unwork"], [0, "unread"], [0, "num", 8, true], ["Take five away", "rod", 0, 3], ["Add one ten", "rod", 1, 1], ["Thirteen.", "read", 13, 2], ["Thirteen.", "work", "8 + 5 = 13"]], pause: 1 },
    { off: ["r2"], on: ["r3"], card: ["Taking away", "Borrow a ten"], say: ["Twelve take away five.", "Only two on the ones rod.", "So take one ten away...", "and give back five's big friend, five, on the ones.", "Seven."],
      acts: [[0, "unwork"], [0, "unread"], [0, "num", 12, true], ["take one ten", "rod", 1, 0], ["give back", "rod", 0, 7], ["Seven.", "read", 7, 1], ["Seven.", "work", "12 − 5 = 7"]], pause: 1 },
    { off: ["r3"], card: ["Example 4", "15 − 8"], say: ["Fifteen take away eight.", "Take one ten away.", "Give back eight's friend, two: five and two, seven."],
      acts: [[0, "unwork"], [0, "unread"], [0, "num", 15, true], ["Take one ten", "rod", 1, 0], ["Give back", "rod", 0, 7], ["seven.", "work", "15 − 8 = 7"], ["seven.", "ding"]], pause: 1 },
    { say: ["So, adding: the friend off first, then the ten.", "Taking away: the ten first, then the friend back.", "And here's the trap.", "Before you carry a ten, check the next rod has room for it."],
      acts: [[0, "unwork"], ["adding", "work", "+n = −friend + 10    −n = −10 + friend"]] },
  ],
});

/* ═══ 7. MULTIDIGIT SUMS ═══════════════════════════════════════════════════ */
export const sorMulti = () => sorFilm({
  rods: 4,
  ask: "Work out 47 + 38, then 132 − 57, on the soroban.",
  steps: [
    { say: ["Now everything together.", "Two figures, three figures, and friends wherever we need them.", "We always work from the left."], acts: [CLEAR] },
    { card: ["Example 1", "47 + 38"], say: ["Set forty seven.", "Tens first: four plus three.", "The tens rod has four, no beads free.", "Three's small friend is two: five down, two off. Seven tens."],
      acts: [["Set forty seven", "num", 47], ["Set forty seven", "read", 47, 2], ["four plus three", "glow", 1, "e"], ["five down", "rod", 1, 9], ["two off", "rod", 1, 7], ["Seven tens", "read", 77, 2]] },
    { say: ["Ones: seven plus eight.", "Not enough room.", "Eight's big friend is two. Take two away: five.", "Carry one ten to the tens rod: eight tens.", "Eighty five."],
      acts: [["Take two away", "rod", 0, 5], ["Carry one ten", "rod", 1, 8], ["Eighty five", "read", 85, 2], ["Eighty five", "work", "47 + 38 = 85"], ["Eighty five", "ding"]], pause: 1 },
    { say: ["See why we went left first?", "The ten we carried landed on a rod we'd already finished, and there was room for it.", "You check one rod, you move on."] },
    { card: ["Example 2", "132 − 57"], say: ["Set a hundred and thirty two.", "Hundreds: nothing to take away.", "Tens: three take away five.", "Not enough. So borrow: one hundred off, and give back five's friend, five. Eight tens."],
      acts: [[0, "unwork"], ["Set a hundred", "num", 132], ["Set a hundred", "read", 132, 3], ["one hundred off", "rod", 2, 0], ["give back", "rod", 1, 8], ["Eight tens", "read", 82, 3]] },
    { say: ["Ones: two take away seven.", "Not enough again. Borrow a ten: eight tens become seven.", "Give back seven's friend, three: two and three, five.", "Seventy five."],
      acts: [["Borrow a ten", "rod", 1, 7], ["Give back", "rod", 0, 5], ["Seventy five", "read", 75, 3], ["Seventy five", "work", "132 − 57 = 75"], ["Seventy five", "ding"]], pause: 1 },
    { say: ["Notice what happened on the ones.", "Two and three made five, so the top bead came down.", "Sometimes a big friend needs a small friend inside it.", "Do them one at a time, and you'll never get lost."] },
    { card: ["Example 3", "268 + 157"], say: ["One more, all three rods.", "Hundreds: two plus one, three.", "Tens: six plus five. Big friend of five is five: take five off, one, carry a hundred: four hundreds.", "Ones: eight plus seven. Big friend of seven is three: take three, five, carry a ten: two tens.", "Four hundred and twenty five."],
      acts: [[0, "unwork"], [0, "unread"], [0, "num", 268, true], ["two plus one", "rod", 2, 3], ["take five off", "rod", 1, 1], ["carry a hundred", "rod", 2, 4], ["take three", "rod", 0, 5], ["carry a ten", "rod", 1, 2], ["Four hundred and", "read", 425, 3], ["Four hundred and", "work", "268 + 157 = 425"], ["Four hundred and", "ding"]], pause: 1 },
    { say: ["Keep your eyes on the rod you're working on.", "When you carry or borrow, the rod next door changes too.", "Look at it, move it, then come straight back."] },
  ],
});

/* ═══ 8. FLASH ANZAN ═══════════════════════════════════════════════════════ */
export const sorAnzan = () => sorFilm({
  rods: 3,
  ask: "Numbers flash up one after another: 4, 3, 8, 2. How do you add them in your head?",
  rules: [["r1", "The secret", "Move beads in your picture, not figures"]],
  steps: [
    { say: ["Flash anzan means adding numbers you only see for a moment.", "No soroban in your hands.", "The secret is a soroban in your head."], acts: [CLEAR] },
    { on: ["r1"], card: ["See the beads", "A soroban in your head"], say: ["Look hard at this soroban.", "Close your eyes, and picture it.", "When a number flashes, you don't hold on to the figure.", "You move the beads in your picture."] },
    { off: ["r1"], card: ["Example", "4, 3, 8, 2"], say: ["Here we go.", "Four: four beads up.", "Three: no room, small friend. Five down, two off. Seven."],
      acts: [["Four:", "work", "4"], ["four beads up", "rod", 0, 4], ["Three:", "work", "3"], ["Five down", "rod", 0, 9], ["two off", "rod", 0, 7]] },
    { say: ["Eight: big friend is two. Two off, carry a ten. Fifteen.", "Two: two beads up. Seventeen.", "The last one's gone. Read the picture: seventeen."],
      acts: [["Eight:", "work", "8"], ["Two off", "rod", 0, 5], ["carry a ten", "rod", 1, 1], ["Two:", "work", "2"], ["two beads up", "rod", 0, 7], ["Read the picture", "read", 17, 2], ["Read the picture", "work", "4 + 3 + 8 + 2 = 17"], ["Read the picture", "ding"]], pause: 1 },
    { say: ["Don't say the numbers in words in your head.", "Words are slow.", "Moving beads is quick, because your fingers already know the moves."] },
    { card: ["Tips", "How the fast ones do it"], say: ["Keep your hands moving.", "Lots of good players flick their fingers in the air, as if the soroban were right there.", "It helps the picture stay put."] },
    { say: ["If you miss a number, don't stop.", "Keep the picture you have, and add the next one.", "One slip is one wrong figure. Stopping loses them all."] },
    { say: ["Start slow: one digit, a long gap.", "When you get them right, make it faster.", "Then two digits.", "The Soroban tournament in Drills flashes sums on a big screen, so you can race other players."] },
  ],
});

/* ═══ 9. TWO DIGITS TIMES ONE DIGIT ════════════════════════════════════════ */
export const sorTimes1 = () => sorFilm({
  rods: 4,
  ask: "Work out 23 × 4, then 47 × 6, on the soroban.",
  rules: [["r1", "The idea", "Split into tens and ones, add each answer"]],
  steps: [
    { say: ["Multiplying on a soroban is adding, done in a clever order.", "You split the bigger number into tens and ones.", "Then you add each little answer onto the soroban."], acts: [CLEAR] },
    { on: ["r1"], card: ["Example 1", "23 × 4"], say: ["Twenty three is twenty and three.", "First, two times four is eight.", "But that's two tens times four, so it's eight tens: eighty.", "Set eight on the tens rod."],
      acts: [["eight tens", "work", "20 × 4 = 80"], ["Set eight", "rod", 1, 8], ["Set eight", "read", 80, 2]] },
    { say: ["Next, three times four is twelve.", "Add twelve: one ten and two ones.", "Tens: eight plus one, nine.", "Ones: two.", "Ninety two."],
      acts: [["is twelve", "work", "80 + 12"], ["eight plus one", "rod", 1, 9], ["Ones: two", "rod", 0, 2], ["Ninety two", "read", 92, 2], ["Ninety two", "work", "23 × 4 = 92"], ["Ninety two", "ding"]], pause: 1 },
    { off: ["r1"], card: ["Example 2", "47 × 6"], say: ["Forty seven times six.", "Four times six is twenty four.", "Tens times ones, so it's twenty four tens: two hundred and forty.", "Two on the hundreds, four on the tens."],
      acts: [[0, "unread"], [0, "unwork"], [0, "num", 0, true], ["twenty four tens", "work", "40 × 6 = 240"], ["Two on the hundreds", "rod", 2, 2], ["four on the tens", "rod", 1, 4], ["four on the tens", "read", 240, 3]] },
    { say: ["Seven times six is forty two.", "Add forty two. Tens first: four plus four.", "The tens rod has four and nothing free: small friend. Five down, one off. Eight.", "Ones: two.", "Two hundred and eighty two."],
      acts: [["forty two.", "work", "240 + 42"], ["Five down", "rod", 1, 9], ["one off", "rod", 1, 8], ["Ones: two", "rod", 0, 2], ["Two hundred and eighty", "read", 282, 3], ["Two hundred and eighty", "work", "47 × 6 = 282"], ["Two hundred and eighty", "ding"]], pause: 1 },
    { say: ["So the soroban does the adding.", "You only need your times tables, up to nine times nine."] },
    { say: ["Here's the trap: the place.", "Four times six is twenty four, but the four was forty.", "So the twenty four lands one rod to the left: two hundred and forty, not twenty four."], acts: [["one rod to the left", "glow", 2, "e"]] },
  ],
});

/* ═══ 10. TWO DIGITS TIMES TWO DIGITS ══════════════════════════════════════ */
export const sorTimes2 = () => sorFilm({
  rods: 4,
  ask: "Work out 23 × 14, then 35 × 12, on the soroban.",
  rules: [["r1", "Four little answers", "tens × tens, tens × ones, ones × tens, ones × ones"]],
  steps: [
    { say: ["Two figures times two figures.", "Same idea as before: little times-table answers, added on.", "Only now there are four of them."], acts: [CLEAR] },
    { on: ["r1"], card: ["Example 1", "23 × 14"], say: ["Twenty three is twenty and three.", "Fourteen is ten and four.", "Every part of one meets every part of the other.", "Twenty times ten, twenty times four, three times ten, three times four."], acts: [["Every part", "work", "20×10, 20×4, 3×10, 3×4"]] },
    { off: ["r1"], say: ["First, tens times tens: two times one is two.", "Tens times tens is hundreds, so two hundred.", "Two on the hundreds rod."],
      acts: [["two hundred", "work", "20 × 10 = 200"], ["Two on the hundreds", "rod", 2, 2], ["Two on the hundreds", "read", 200, 3]] },
    { say: ["Next, twenty times four.", "Two times four is eight: eight tens.", "Eight on the tens rod: five down, three up."],
      acts: [["eight tens", "work", "20 × 4 = 80"], ["five down, three up", "rod", 1, 8], ["five down, three up", "read", 280, 3]] },
    { say: ["Then three times ten: three tens.", "Tens has eight, no room. Big friend of three is seven.", "Seven off the tens: one left. Carry a hundred: three hundreds.", "Three hundred and ten."],
      acts: [["three tens", "work", "3 × 10 = 30"], ["Seven off", "rod", 1, 1], ["Carry a hundred", "rod", 2, 3], ["Three hundred and ten", "read", 310, 3]] },
    { say: ["Last, three times four is twelve: one ten, two ones.", "Tens: one and one, two.", "Ones: two.", "Three hundred and twenty two."],
      acts: [["is twelve", "work", "3 × 4 = 12"], ["one and one", "rod", 1, 2], ["Ones: two", "rod", 0, 2], ["Three hundred and twenty", "read", 322, 3], ["Three hundred and twenty", "work", "23 × 14 = 322"], ["Three hundred and twenty", "ding"]], pause: 1 },
    { card: ["Example 2", "35 × 12"], say: ["Thirty five times twelve.", "Thirty times ten: three hundreds.", "Thirty times two: six tens. Five down, one up."],
      acts: [[0, "unread"], [0, "unwork"], [0, "num", 0, true], ["three hundreds", "rod", 2, 3], ["six tens", "rod", 1, 6], ["six tens", "read", 360, 3], ["six tens", "work", "300 + 60 = 360"]] },
    { say: ["Five times ten: five tens.", "Tens has six, the top bead's down. Big friend of five is five.", "Five off: one ten. Carry a hundred: four hundreds.", "Five times two is ten: one more ten. Two tens.", "Four hundred and twenty."],
      acts: [["Five off", "rod", 1, 1], ["Carry a hundred", "rod", 2, 4], ["one more ten", "rod", 1, 2], ["Four hundred and twenty", "read", 420, 3], ["Four hundred and twenty", "work", "35 × 12 = 420"], ["Four hundred and twenty", "ding"]], pause: 1 },
    { say: ["Here's how to keep the places straight.", "Tens times tens lands on the hundreds.", "Tens times ones, or ones times tens, lands on the tens.", "Ones times ones lands on the ones.", "Get the rod right, and the soroban does the rest."] },
  ],
});
