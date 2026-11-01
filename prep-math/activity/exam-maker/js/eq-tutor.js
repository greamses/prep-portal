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
.eqt-ex .eqt-row { font-size: 17px; }
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


  /* THE FULL LESSON (from the booklet's card): after the first sum, worked examples of each kind of maths a paper asks for. Each one is
     typed on a fresh line the way it is said, shown set underneath while it is typed, and put in with Enter. The card keeps the last
     three lines so it never overflows. */
  const example = (label, typedText, say) => ({
    say,
    async show(stage, opts) {
      const { gsap, instant } = opts;
      const ex = stage.querySelector('[data-e="ex"]'), pv = stage.querySelector('[data-e="preview"]');
      const row = document.createElement("div");
      row.className = "eqt-row";
      row.innerHTML = `<span class="eqt-words">${esc(label)}</span><span class="eqt-slot"><span class="eqt-box"></span></span>`;
      ex.appendChild(row);
      while (ex.children.length > 3) ex.firstElementChild.remove();
      const box = row.querySelector(".eqt-box");
      row.after(pv);
      const paint = (txt) => { box.textContent = txt; pv.hidden = !txt; try { pv.replaceChildren(set(toTeX(txt))); } catch { pv.textContent = txt; } };
      if (!instant && gsap) {
        gsap.from(row, { opacity: 0, y: 8, duration: 0.4, ease: "expo.out" });
        await new Promise((r) => setTimeout(r, 900));
        for (let i = 1; i <= typedText.length; i++) { paint(typedText.slice(0, i)); await new Promise((r) => setTimeout(r, 170)); }
        await new Promise((r) => setTimeout(r, 1400));
        await press(stage, ["enter"], opts);
      }
      row.querySelector(".eqt-slot").replaceChildren(set(toTeX(typedText)));
      pv.hidden = true;
    },
  });
  const LESSON = [
    example("Fraction: ", "(x + 1)/2",
      "Now a trap with fractions. Look at the new line. I want x plus one, ALL over two. If I type x plus one slash two, the slash takes only what came since the last plus sign, so I would get x plus a half. That is a different answer. The cure is brackets. Put brackets round the whole top, then the slash, then the bottom. Watch: the brackets tell the box where the top starts and stops, and they disappear once it is set, because a fraction line does the same job."),
    example("Mixed number: ", "2 1/3 + 1 1/2",
      "Mixed numbers next, the ones with a whole number and a fraction together, like two and a third. Here is how you say it: two, then a space, then one slash three. The space is the important part. Look at the preview as I type. Without the space, two followed by one slash three would read as twenty-one thirds, which is nowhere near two and a third. So whole number, space, fraction. Then plus one and a half, the same way."),
        example("Power: ", "x^2 + 3x",
      "On to powers. A power is written small and high, like the two in x squared. To type it, use the little hat, the key above the six, and then the power. So x, hat, two. That hat means lift what comes next up into the power. Look at the preview: the two has jumped up. Then I carry on with plus three x on the ordinary line, because the power only lifts the ONE thing straight after the hat."),
    example("Power: ", "2^(n + 1) = 10^(-3)",
      "So what if the power is more than one character, like n plus one, or minus three? This is where everybody slips. If you type two, hat, n plus one, only the n goes up, and the plus one stays on the line. So put the whole power in brackets: two, hat, open bracket, n plus one, close bracket. Same for a negative power: ten, hat, bracket, minus three, bracket. The brackets vanish once it is set; they only told the box how much to lift."),
    example("Base: ", "1011_2 = 11_10",
      "Number bases next, which papers love to ask about. A base is written small and LOW, after the number, like the little two in one zero one one base two. For low, use the underscore, the line beside the zero key. So one zero one one, underscore, two. Then equals eleven, underscore, ten, which means eleven in base ten, our everyday counting. If the base has two digits, like ten, it still drops down whole, because a number counts as one piece."),
    example("Base: ", "45_b = 37_10",
      "And when the base is unknown, the question uses a letter, like b. You write it exactly the same way: forty-five, underscore, b. That says forty-five counted in some base b, and the rest of your working finds b. Here is a tip for your working lines: write the base on EVERY line where it matters. A marker cannot tell forty-five in base b from forty-five in base ten unless the little letter is there, and that small slip costs marks."),
        example("Division: ", "12 div 4 = 3",
      "Now division. Sometimes you want the division sign itself, the line with a dot above and a dot below, not a fraction. For that, type the word d i v between the numbers. So twelve, div, four, equals three. Watch the preview turn the word into the sign. Keep the slash for fractions and div for the division sign, and your working will look exactly like the working in your textbook, which is what the marker is used to reading."),
    example("Dividing fractions: ", "3/4 div 1/2 = 3/2",
      "Last example, dividing one fraction by another. Three quarters divided by one half. Type three slash four, then div, then one slash two. The div ends the first fraction, the same way a plus would, so each fraction stays in its own place. Equals three slash two, which is one and a half. If you ever see the preview put a fraction somewhere you did not mean, press backspace and add brackets: the preview is there so you catch it before Enter."),
    {
      say: "Let us put it all together. Alt and equals opens the box. Slash makes a fraction, with brackets round a top or bottom that has more than one piece. A space separates the whole number from the fraction in a mixed number. The hat lifts a power, and the underscore drops a base, with brackets when either is longer than one character. Div gives the division sign. Check the picture underneath, press Enter, and double-click a formula if you need to change it.",
      show(stage, { gsap, instant }) {
        const note = stage.querySelector('[data-e="note"]');
        note.textContent = "/  fraction   ·   space  mixed number   ·   ^  power   ·   _  base   ·   div  ÷";
        if (!instant && gsap) gsap.from(note, { opacity: 0, y: 6, duration: 0.5, ease: "expo.out" });
      },
    },
  ];

  await openTv({
    title: own ? "Writing your correct line" : "Writing maths in an answer",
    build(stage) {
      stage.innerHTML = `<div class="eqt"><div class="eqt-card">
        <div class="eqt-head">Your answer page</div>
        ${own ? `<div class="eqt-row eqt-row--wrong" data-e="wrong" style="opacity:0"><s>${esc(line)}</s><span class="eqt-x" aria-label="crossed out"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M4.3 4.5C8 7.9 14 14.3 19.7 19.8c.5.5-.1 1-.6.6C13.2 15.7 8.3 10.7 3.9 5.7c-.4-.5 0-1.5.4-1.2Z"/><path fill="currentColor" d="M19.5 4.4c-4.2 4.2-9.7 9.8-13.3 15.3-.3.5-.8.2-.5-.3C8.6 14 13.6 8.3 18.9 3.9c.5-.3 1 .2.6.5Z"/></svg></span></div>` : ""}
        <div class="eqt-row" data-e="line"><span class="eqt-words">${words}</span><span class="eqt-slot" data-e="slot"></span><span class="eqt-caret" data-e="caret"></span></div>
        <div class="eqt-ex" data-e="ex"></div>
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
    ].concat(own ? [] : LESSON),
  });
}
