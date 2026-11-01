/* ============================================================================
   PrepBot shows how to fill in the exam number
   ----------------------------------------------------------------------------
   A film on PrepBot's TV: the student's own number on a ticket, then the exam number grid exactly as the paper draws it (a box for each
   digit, a column of bubbles 0 to 9 under it). Each digit is shaded in its column and lands in its box, the way the live paper does it
   (live.js wireExamNo: clicking a bubble writes the digit), then the whole number is checked across, and a wrong bubble is put right.

     openExamNoFilm({ no, n })    no: the student's number (issued by the paper on their first visit), n: digits the paper asks for
   ========================================================================== */

import { openTv } from "/prep-math/mental-math/shared/prepbot-tv.js";

const CSS = `
.ent { position: absolute; inset: 0; display: grid; place-items: center; font-family: "JetBrains Mono", ui-monospace, monospace; color: #1d1b18; }
.ent-card { background: #fffdf7; padding: 20px 26px 18px; box-shadow: 0 10px 28px rgba(29, 27, 24, 0.22); display: grid; grid-template-columns: auto auto; gap: 26px; align-items: start; }
.ent-head { grid-column: 1 / -1; font: 800 11px/1 "JetBrains Mono", monospace; letter-spacing: 0.16em; text-transform: uppercase; color: #3b4cca; }
.ent-ticket { align-self: center; padding: 14px 16px; background: #fff6d6; box-shadow: 0 4px 12px rgba(29, 27, 24, 0.16); transform: rotate(-2deg); max-width: 170px; }
.ent-ticket small { display: block; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #7a6a3a; margin-bottom: 6px; }
.ent-ticket b { display: block; font-size: 22px; letter-spacing: 0.08em; }
.ent-ticket b i { font-style: normal; transition: color 0.2s, background 0.2s; }
.ent-ticket b i.is-now { background: #ffe066; }
.ent-grid { display: flex; gap: 5px; }
.ent-col { display: grid; gap: 3px; justify-items: center; padding: 3px; transition: background 0.2s, transform 0.25s; }
.ent-col.is-now { background: rgba(59, 76, 202, 0.1); }
.ent-col.is-swell { transform: scale(1.12); background: rgba(214, 50, 42, 0.1); }
.ent-box { width: 22px; height: 26px; border: 1.5px solid #6b655c; display: grid; place-items: center; font: 600 16px/1 "Playwrite US Trad", "Segoe Print", cursive; margin-bottom: 3px; background: #fff; }
.ent-col b { width: 18px; height: 18px; border-radius: 50%; border: 1.3px solid #9a9184; display: grid; place-items: center; font-size: 10px; font-weight: 600; color: #6b655c; position: relative; overflow: hidden; }
.ent-col b::after { content: ""; position: absolute; inset: 0; border-radius: 50%; background: radial-gradient(circle at 40% 35%, #8d8a86, #5b5855); opacity: 0; transition: opacity 0.35s; }
.ent-col b.is-on::after { opacity: 0.82; }
.ent-col b.is-on { color: #fff; border-color: #5b5855; }
.ent-tap { position: absolute; width: 30px; height: 30px; margin: -15px 0 0 -15px; border-radius: 50%; border: 3px solid #3b4cca; opacity: 0; pointer-events: none; }
.ent-note { grid-column: 1 / -1; min-height: 20px; font: 600 15px/1.3 "Shantell Sans", "Segoe Print", cursive; color: #1c7a3a; }
`;
const addCss = () => { if (!document.getElementById("ent-css")) document.head.appendChild(Object.assign(document.createElement("style"), { id: "ent-css", textContent: CSS })); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function openExamNoFilm({ no = "", n = 8 } = {}) {
  addCss();
  n = Math.max(4, Math.min(12, Math.round(Number(n)) || 8));
  const own = /^\d+$/.test(String(no)) && String(no).length === n;
  const num = own ? String(no) : "260418739021".slice(0, n);
  const digit = (c) => +num[c];
  /* a wrong digit for the "putting it right" step: one that is not the real one */
  const slip = (digit(2) + 3) % 10;

  const col = (stage, c) => stage.querySelectorAll(".ent-col")[c];
  const bubble = (stage, c, d) => col(stage, c).querySelectorAll("b")[d];
  const tick = (stage, c) => stage.querySelectorAll(".ent-ticket b i").forEach((i, k) => i.classList.toggle("is-now", k === c));
  async function tap(stage, el, { gsap, instant }) {
    if (instant || !gsap) return;
    const t = stage.querySelector(".ent-tap"), card = stage.querySelector(".ent-card");
    const r = el.getBoundingClientRect(), cr = card.getBoundingClientRect();
    t.style.left = `${r.left - cr.left + r.width / 2}px`; t.style.top = `${r.top - cr.top + r.height / 2}px`;
    gsap.fromTo(t, { scale: 1.6, opacity: 0.9 }, { scale: 0.7, opacity: 0, duration: 0.6, ease: "expo.out" });
    await wait(420);
  }
  /* shade digit d in column c: the old bubble in that column clears, the box above gets the digit */
  async function shade(stage, c, d, opts, slow = true) {
    const { instant } = opts;
    stage.querySelectorAll(".ent-col").forEach((k, i) => k.classList.toggle("is-now", i === c && !instant));
    tick(stage, instant ? -1 : c);
    if (!instant && slow) await wait(700);
    await tap(stage, bubble(stage, c, d), opts);
    col(stage, c).querySelectorAll("b").forEach((b, i) => b.classList.toggle("is-on", i === d));
    if (!instant) await wait(slow ? 500 : 150);
    col(stage, c).querySelector(".ent-box").textContent = String(d);
    if (!instant) await wait(slow ? 600 : 250);
  }
  const done = (stage) => { stage.querySelectorAll(".ent-col").forEach((k) => k.classList.remove("is-now", "is-swell")); tick(stage, -1); };

  await openTv({
    title: "Filling in your exam number",
    build(stage) {
      const cols = Array.from({ length: n }, () => `<div class="ent-col"><span class="ent-box"></span>${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<b>${d}</b>`).join("")}</div>`).join("");
      stage.innerHTML = `<div class="ent"><div class="ent-card" style="position:relative">
        <div class="ent-head">The front of your answer sheet</div>
        <div class="ent-ticket"><small>Your exam number</small><b>${[...num].map((d) => `<i>${d}</i>`).join("")}</b></div>
        <div class="ent-grid">${cols}</div>
        <div class="ent-note" data-e="note"></div>
        <span class="ent-tap"></span>
      </div></div>`;
    },
    steps: [
      {
        say: "Before you answer a single question, there is one job on the front of your answer sheet: the exam number. Look at the grid on the right. Every column has a box at the top and the digits nought to nine underneath. Your teacher marks a pile of papers, and names get smudged, misspelt or left off, but a number shaded properly can never be misread. So this little grid is how your paper finds its way back to you.",
        show() {},
      },
      {
        say: `Now look at the yellow ticket on the left. That is YOUR exam number, ${n} digits long. The paper gave it to you the first time you opened the link, and it is yours alone, so nobody else in the exam has the same one. It stays the same every time you come back to this paper. Keep your eye on it while you fill in the grid, because we copy it across one digit at a time, from left to right.`,
        show(stage, { gsap, instant }) {
          const t = stage.querySelector(".ent-ticket");
          if (!instant && gsap) gsap.fromTo(t, { scale: 1 }, { scale: 1.1, duration: 0.4, yoyo: true, repeat: 1, ease: "power2.inOut" });
        },
      },
      {
        say: `Here is the first digit. On the ticket it is ${digit(0)}, so go to the FIRST column and find the ${digit(0)} in it. Click that bubble, and watch what happens: the bubble is shaded, and the digit is written in the box at the top for you. On a printed paper you would write the digit in the box with your pencil and then shade the bubble, but on screen one click does both.`,
        show: (stage, opts) => shade(stage, 0, digit(0), opts),
      },
      {
        say: `Second digit, ${digit(1)}, and it goes in the SECOND column. This is the bit people get wrong: they shade the right digit in the wrong column, so the number comes out shifted along. Count the columns if you need to. One digit, one column, one bubble, in order. Watch the box fill as the ${digit(1)} is shaded.`,
        show: (stage, opts) => shade(stage, 1, digit(1), opts),
      },
      {
        say: `The rest go the same way. Read the next digit off the ticket, move one column to the right, and shade that digit. ${[...num.slice(2)].join(", ")}. Notice I am not rushing ahead of the ticket. If you look up halfway, find where you got to by reading the boxes, because they show every digit you have shaded so far.`,
        async show(stage, opts) {
          for (let c = 2; c < n; c++) await shade(stage, c, digit(c), opts, false);
          done(stage);
        },
      },
      {
        say: `Suppose you slip, and shade a ${slip} in the third column instead of a ${digit(2)}. Look at the third column: the wrong bubble is dark and the box says ${slip}. You do not need a rubber. Click the right bubble in the same column, the ${digit(2)}, and the wrong one clears by itself, because a column can only ever hold ONE shaded bubble.`,
        async show(stage, opts) {
          const { instant } = opts;
          await shade(stage, 2, slip, opts);
          if (!instant) { col(stage, 2).classList.add("is-swell"); await wait(1400); col(stage, 2).classList.remove("is-swell"); }
          await shade(stage, 2, digit(2), opts);
          done(stage);
        },
      },
      {
        say: "Last of all, check it. Read the boxes from left to right and compare them with the ticket, digit for digit. Then run your eye down each column: there should be exactly one dark bubble in every column, and none left empty. When you hand your paper in, it is checked too, and you will be told if any digit is missing or if the number is not the one on your ticket.",
        async show(stage, { gsap, instant }) {
          const note = stage.querySelector('[data-e="note"]');
          note.textContent = `${num}: one bubble in every column`;
          if (!instant && gsap) gsap.from(note, { opacity: 0, y: 6, duration: 0.5, ease: "expo.out" });
        },
      },
    ],
  });
}
