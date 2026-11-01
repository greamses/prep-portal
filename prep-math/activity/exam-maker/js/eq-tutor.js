/* ============================================================================
   PrepBot shows how to write maths in an answer
   ----------------------------------------------------------------------------
   A film on PrepBot's TV (prep-math/mental-math/shared/prepbot-tv.js): an answer line on ruled paper, the Alt and = keys pressed, the
   framed box opening, the maths typed the way it is said with the set version showing underneath, Enter putting it in, and a double-click
   opening it again. Exactly what the answer fields do (rich-field.js), using the same pieces (math-linear's toTeX, the notes' mathNode).

     openEquationFilm()                       the general lesson, from the answer booklet's "Writing maths" card
     openEquationFilm({ line, fix })          on a marked script: the student's wrong line, and the correct one (TeX) written for them
   ========================================================================== */

import { openTv } from "/prep-math/mental-math/shared/prepbot-tv.js";
import { toTeX } from "/utils/components/math-linear.js";
import { mathNode, preloadMath } from "/utils/components/sticky-math.js";
import { plainTex } from "./live.js";

const CSS = `
.eqt { position: absolute; inset: 0; display: grid; place-items: center; font-family: "JetBrains Mono", ui-monospace, monospace; color: #1d1b18; }
.eqt-card { width: min(78%, 620px); background: #fffdf7; padding: 26px 30px 24px; box-shadow: 0 10px 28px rgba(29, 27, 24, 0.22); position: relative; }
.eqt-head { font: 800 11px/1 "JetBrains Mono", monospace; letter-spacing: 0.16em; text-transform: uppercase; color: #3b4cca; margin-bottom: 14px; }
.eqt-row { display: flex; align-items: center; gap: 10px; min-height: 42px; border-bottom: 1.5px solid #b9b2a5; font-size: 18px; padding: 4px 2px; }
.eqt-row--wrong { color: #6b655c; }
.eqt-row--wrong .eqt-x { color: #d6322a; font-weight: 900; margin-left: auto; font-size: 20px; }
.eqt-row--wrong s { text-decoration-color: #d6322a; text-decoration-thickness: 2px; }
.eqt-words { white-space: pre; }
.eqt-slot { display: inline-flex; align-items: center; }
.eqt-box { display: inline-block; min-width: 1.6em; min-height: 1.3em; padding: 0 0.45em; border: 1.5px solid rgba(20, 80, 140, 0.6); background: rgba(238, 244, 251, 0.95); font-weight: 600; white-space: pre; }
.eqt-box:empty::before { content: "Type equation here."; color: rgba(20, 80, 140, 0.6); font-style: italic; font-family: "STIX Two Text", Georgia, serif; }
.eqt-caret { display: inline-block; width: 2px; height: 1.2em; background: #1d1b18; margin-left: 1px; animation: eqt-blink 1s steps(1) infinite; vertical-align: middle; }
@keyframes eqt-blink { 50% { opacity: 0; } }
.eqt-preview { margin: 10px 0 0 120px; display: inline-block; padding: 6px 12px; background: #fff; border: 1.5px solid rgba(20, 80, 140, 0.45); box-shadow: 0 6px 16px rgba(20, 19, 15, 0.16); font-size: 20px; min-height: 30px; }
.eqt-preview[hidden] { display: none; }
.eqt-preview .pp-note__eq, .eqt-row .pp-note__eq { display: inline-block; vertical-align: middle; }
.eqt-keys { display: flex; gap: 12px; justify-content: center; margin-top: 22px; }
.eqt-key { min-width: 54px; height: 46px; padding: 0 12px; display: inline-grid; place-items: center; background: #fff8d6; border-radius: 0; font: 800 15px/1 "JetBrains Mono", monospace; box-shadow: 0 5px 0 #d9cf9e, 0 8px 16px rgba(29, 27, 24, 0.18); transition: transform 0.12s, box-shadow 0.12s; }
.eqt-key.is-down { transform: translateY(4px); box-shadow: 0 1px 0 #d9cf9e, 0 3px 6px rgba(29, 27, 24, 0.18); background: #ffe98a; }
.eqt-tap { position: absolute; width: 34px; height: 34px; margin: -17px 0 0 -17px; border-radius: 50%; border: 3px solid #3b4cca; opacity: 0; pointer-events: none; }
.eqt-note { margin-top: 12px; font: 600 15px/1.3 "Shantell Sans", "Segoe Print", cursive; color: #1c7a3a; min-height: 20px; }
`;
const addCss = () => { if (!document.getElementById("eqt-css")) document.head.appendChild(Object.assign(document.createElement("style"), { id: "eqt-css", textContent: CSS })); };
const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const set = (tex) => { const n = mathNode(tex); n.removeAttribute("title"); n.removeAttribute("contenteditable"); return n; };
/* the first formula in a corrected line (between dollar signs), as it is TYPED: "\\frac{3}{4}" is typed 3/4 */
function typedFrom(fix) {
  const m = String(fix || "").match(/\$([^$]+)\$/);
  return m ? plainTex(m[1]).replace(/\s+/g, " ").trim() : "";
}

export async function openEquationFilm({ line = "", fix = "" } = {}) {
  addCss();
  preloadMath();
  const own = !!(line && typedFrom(fix));
  const typed = own ? typedFrom(fix) : "1/2 + 1/4 = 3/4";
  const words = own ? "Correct: " : "Answer: ";
  const press = async (stage, keys, { gsap, instant }) => {
    const ks = keys.map((k) => stage.querySelector(`.eqt-key[data-k="${k}"]`));
    if (instant || !gsap) return;
    ks.forEach((k) => k.classList.add("is-down"));
    await new Promise((r) => setTimeout(r, 650));
    ks.forEach((k) => k.classList.remove("is-down"));
  };

  await openTv({
    title: own ? "Writing your correct line" : "Writing maths in an answer",
    build(stage) {
      stage.innerHTML = `<div class="eqt"><div class="eqt-card">
        <div class="eqt-head">Your answer page</div>
        ${own ? `<div class="eqt-row eqt-row--wrong" data-e="wrong" style="opacity:0"><s>${esc(line)}</s><span class="eqt-x" aria-label="crossed out"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M4.3 4.5C8 7.9 14 14.3 19.7 19.8c.5.5-.1 1-.6.6C13.2 15.7 8.3 10.7 3.9 5.7c-.4-.5 0-1.5.4-1.2Z"/><path fill="currentColor" d="M19.5 4.4c-4.2 4.2-9.7 9.8-13.3 15.3-.3.5-.8.2-.5-.3C8.6 14 13.6 8.3 18.9 3.9c.5-.3 1 .2.6.5Z"/></svg></span></div>` : ""}
        <div class="eqt-row" data-e="line"><span class="eqt-words">${words}</span><span class="eqt-slot" data-e="slot"></span><span class="eqt-caret" data-e="caret"></span></div>
        <div class="eqt-preview" data-e="preview" hidden></div>
        <div class="eqt-note" data-e="note"></div>
        <div class="eqt-keys"><span class="eqt-key" data-k="alt">Alt</span><span class="eqt-key" data-k="eq">=</span><span class="eqt-key" data-k="enter">Enter</span></div>
        <span class="eqt-tap" data-e="tap"></span>
      </div></div>`;
    },
    steps: [
      own ? {
        say: "Look at the line at the top of the page. That is the line you wrote, and the marker crossed it out. Underneath it, on the answer line, we are going to write the line the way it should have been. We could write it out in words, but maths reads far better when it LOOKS like maths, with real fractions and powers. So let me show you how to put it on the screen, the same way you will in your next exam.",
        show(stage, { gsap, instant }) {
          const w = stage.querySelector('[data-e="wrong"]');
          if (instant || !gsap) w.style.opacity = "1"; else gsap.to(w, { opacity: 1, duration: 0.6, ease: "expo.out" });
        },
      } : {
        say: "Some answers need maths in them: a fraction, a power, a square root. Look at the answer line in the middle of the page. If you type a fraction with ordinary keys it comes out as a slash and two numbers, and it is easy to misread. So I am going to show you how to make the maths LOOK like maths, set properly, the way it is printed in a textbook. It takes three keys and no special symbols at all.",
        show() {},
      },
      {
        say: "First, click where the maths should go. Then hold down the Alt key and press the equals key, both together. Watch the two keys at the bottom go down. Alt and equals is the shortcut, and it is the same one word processors use, so it is worth remembering. Nothing has been typed yet. All you have done is open a place for the maths.",
        async show(stage, opts) { await press(stage, ["alt", "eq"], opts); },
      },
      {
        say: "See the little framed box that has opened on the line? It says Type equation here. That box is where the maths lives. Anything you type inside it becomes a formula, and anything outside it stays as ordinary words. Here is the part people get wrong: they go hunting for special symbols. You do not need any. You type it the way you would say it out loud.",
        show(stage, { gsap, instant }) {
          const slot = stage.querySelector('[data-e="slot"]');
          if (!slot.querySelector(".eqt-box")) slot.appendChild(Object.assign(document.createElement("span"), { className: "eqt-box" }));
          const box = slot.querySelector(".eqt-box");
          if (!instant && gsap) gsap.from(box, { scale: 0.6, opacity: 0, duration: 0.45, ease: "back.out(2)" });
        },
      },
      {
        say: own
          ? "So I type it as I would say it. A fraction is the top, a slash, then the bottom. A power is the little hat above the six, then the power. A square root is s q r t, with the number in brackets. Keep your eye just under the box while I type. That is how it will look once it is set, so a slip shows up BEFORE you put it in, not after the marker finds it."
          : "So I type it as I would say it. One half is a one, a slash, and a two. Plus. One quarter is a one, a slash, and a four. Equals three quarters. A power would be the little hat above the six, and a square root would be s q r t with the number in brackets. Keep your eye just under the box while I type. That is how it will look once it is set, so a slip shows up BEFORE you put it in.",
        async show(stage, { gsap, instant }) {
          const box = stage.querySelector(".eqt-box"), pv = stage.querySelector('[data-e="preview"]');
          const paint = (txt) => { box.textContent = txt; pv.hidden = !txt; try { pv.replaceChildren(set(toTeX(txt))); } catch { pv.textContent = txt; } };
          if (instant || !gsap) { paint(typed); return; }
          for (let i = 1; i <= typed.length; i++) { paint(typed.slice(0, i)); await new Promise((r) => setTimeout(r, 140)); }
        },
      },
      {
        say: "Happy with what you see underneath? Press Enter. The box closes and the maths sits right there in your line, set properly, exactly like a line in a textbook. And if you change your mind while you are still typing, the Escape key closes the box and leaves your answer as it was. Either way, nothing you wrote is lost.",
        async show(stage, opts) {
          await press(stage, ["enter"], opts);
          const slot = stage.querySelector('[data-e="slot"]'), pv = stage.querySelector('[data-e="preview"]');
          slot.replaceChildren(set(toTeX(typed)));
          pv.hidden = true;
          if (!opts.instant && opts.gsap) opts.gsap.from(slot, { opacity: 0, y: -6, duration: 0.5, ease: "expo.out" });
        },
      },
      {
        say: "Spotted a mistake afterwards? Double-click the formula. It opens again with what you typed, so you mend the one wrong character instead of starting the whole line over. Then Enter puts it back. So, on your next answer: Alt and equals, type it the way you say it, check the picture underneath, and Enter.",
        async show(stage, { gsap, instant }) {
          const slot = stage.querySelector('[data-e="slot"]'), tap = stage.querySelector('[data-e="tap"]'), card = stage.querySelector(".eqt-card");
          const note = stage.querySelector('[data-e="note"]');
          note.textContent = "Double-click to change it";
          if (!instant && gsap) {
            const r = slot.getBoundingClientRect(), c = card.getBoundingClientRect();
            tap.style.left = `${r.left - c.left + r.width / 2}px`; tap.style.top = `${r.top - c.top + r.height / 2}px`;
            await gsap.fromTo(tap, { scale: 0.4, opacity: 0.9 }, { scale: 1.6, opacity: 0, duration: 0.45, repeat: 1, ease: "expo.out" });
          }
          slot.replaceChildren(Object.assign(document.createElement("span"), { className: "eqt-box", textContent: typed }));
        },
      },
    ],
  });
}
