/* ============================================================================
   Mental Maths Workbook — CHAPTER 7: TIMES TABLE SECRETS
   ----------------------------------------------------------------------------
   Every times table has a pattern in it that makes it easy to write out and
   hard to forget. One table to a section, its secret first.

     THE NINE TIMES TABLE
       Write the ten sums down the page. Count 0 to 9 going DOWN the page —
       those are the tens. Count 0 to 9 again going UP the page — those are
       the units. 09, 18, 27 … 90: the whole table, with nothing multiplied.

       So for any one of them: the tens digit is ONE LESS than the number
       you multiply by, and the two digits ADD UP TO 9.

         one at a time     9 × 7: one less than 7 is 6; 6 needs 3 to make 9; 63
         the whole table   the two columns, counted down and counted up

     THE EIGHT TIMES TABLE
       The units count DOWN IN TWOS, twice over: 8, 6, 4, 2, 0 and again
       8, 6, 4, 2, 0. The tens count 0, 1, 2, 3, 4 — and then start again
       FROM THE SAME 4: 4, 5, 6, 7, 8. (The 4 comes twice because five eights
       is exactly 40, and the next one, 48, has not left the forties.)

       And for any one of them: 8 is 2 × 2 × 2, so DOUBLE THREE TIMES.

         one at a time     8 × 7: 14, 28, 56
         the whole table   the units in twos, then the tens with the 4 twice

   On PrepBot's TV the secret is acted out: the ten sums, the tens counting
   down the page, the units counting up it, and the two columns closing into
   the answers (`tv: "nines"` — the scene is in explain.js).
   ========================================================================== */

import { want } from "/utils/components/workbook/want.js";
import { ask, big, worked, say, step, steps, strip } from "./common.js";

export const TT_GROUPS = [
  { id: "vm-tables", chapter: "Chapter 7 · Times table secrets", label: "The 9 times table", blurb: "Count down the page, count up the page: 09, 18, 27 …" },
  { id: "vm-tables8", label: "The 8 times table", blurb: "Units in twos — 8, 6, 4, 2, 0 — and the 4 comes twice." },
];

const SECRET =
  "Write the ten sums, 9 × 1 to 9 × 10, down the page. Count from 0 to 9 going DOWN the page: those are the tens. " +
  "Count from 0 to 9 again going UP the page: those are the units. So the tens digit is always ONE LESS than the " +
  "number you multiply by, and the two digits always ADD UP TO 9.";

const nineOne = {
  id: "vm-tt9",
  group: "vm-tables",
  label: "Nines, one at a time",
  blurb: "One less for the tens; what makes 9 for the units.",
  heading: "The 9 times table — one less, and what makes 9",
  instruction: () => SECRET,
  tv: "nines",
  cols: 2,
  defaultCount: 6,
  make: (r) => ({ n: r.int(2, 10) }),
  render: ({ n }) => big(`9 × ${n}`) +
    steps(step(`one less than ${n}:`), step("what goes with it to make 9:"), step("the answer:")),
  worked: () => worked(big("9 × 7") + ask(strip("7 − 1", "9 − 6") + " → " + strip("6", "3") + " = 63") +
    say("One less than 7 is 6: that is the tens. 6 needs 3 to make 9: that is the units. So 9 × 7 is 63.")),
  key: ({ n }) => [want.num(n - 1), want.num(10 - n), want.num(9 * n)],
  answer: ({ n }) => [`${n - 1} and ${10 - n}: 9 × ${n} = ${9 * n}`],
};

const nineAll = {
  id: "vm-tt9-all",
  group: "vm-tables",
  label: "The whole nine times table",
  blurb: "The tens counted down the page, the units counted up.",
  heading: "The 9 times table — count down, count up",
  instruction: () => SECRET + " It is set out as PrepBot sets it out. Fill the FIRST box of every row, counting 0 to 9 down the page; " +
    "then the SECOND box of every row, counting 0 to 9 up from the bottom. On screen the boxes open one at a time, in that order.",
  tv: "nines",
  cols: 1,
  defaultCount: 1,
  /* `n` is only for the drill form of the section: one sum out of the table */
  make: (r) => ({ n: r.int(2, 9) }),
  /* One column of ten, as on the TV. Each box says WHEN it is filled (data-step):
     the tens down the page are steps 0 to 9, the units up the page 10 to 19 —
     and that is the order they open in on screen (data-steps="listed"). */
  render: () => `<p class="vm-tt__key"><span class="is-t">first box: 0 to 9, down the page</span><span class="is-u">second box: 0 to 9, up the page</span></p>` +
    `<div class="vm-tt" data-steps="listed">${Array.from({ length: 10 }, (_, i) =>
      `<p class="wb-ask vm-tt__row"><span class="vm-tt__sum">9 × ${i + 1} =</span> <span class="vm-tt__pair">` +
      `<span class="wb-answer vm-tt__t" data-step="${i}"></span><span class="wb-answer vm-tt__u" data-step="${19 - i}"></span></span></p>`).join("")}</div>`,
  worked: () => worked(ask("9 × 1 = " + strip("0", "9") + " &nbsp; 9 × 2 = " + strip("1", "8") + " &nbsp; 9 × 3 = " + strip("2", "7")) +
    say("Down the page the first digits go 0, 1, 2 … and up the page the second digits go 0, 1, 2 … so the top rows read 09, 18, 27.")),
  key: () => Array.from({ length: 10 }, (_, i) => [want.num(i), want.num(9 - i)]).flat(),
  answer: () => [Array.from({ length: 10 }, (_, i) => `${i}${9 - i}`).join(", ")],
};

/* ═══ THE EIGHTS ══════════════════════════════════════════════════════════*/

const SECRET8 =
  "Write the ten sums, 8 × 1 to 8 × 10, down the page. The UNITS count down in twos, twice over: 8, 6, 4, 2, 0 and " +
  "again 8, 6, 4, 2, 0. The TENS count 0, 1, 2, 3, 4 and then start again from the same 4: 4, 5, 6, 7, 8 — the 4 " +
  "comes twice, for 40 and 48.";

const eightOne = {
  id: "vm-tt8",
  group: "vm-tables8",
  label: "Eights, one at a time",
  blurb: "8 is 2 × 2 × 2: double, double, double.",
  heading: "The 8 times table — double three times",
  instruction: () => "8 is 2 × 2 × 2, so multiplying by 8 is DOUBLING THREE TIMES. Double the number, double the answer, " +
    "and double once more.",
  tv: "eights",
  cols: 2,
  defaultCount: 6,
  make: (r) => ({ n: r.int(2, 10) }),
  render: ({ n }) => big(`8 × ${n}`) +
    steps(step(`double ${n}:`), step("double that:"), step("double once more — the answer:")),
  worked: () => worked(big("8 × 7") + ask(strip("7 × 2", "× 2", "× 2") + " → " + strip("14", "28", "56") + " = 56") +
    say("Double 7 is 14. Double 14 is 28. Double 28 is 56. So 8 × 7 is 56.")),
  key: ({ n }) => [want.num(2 * n), want.num(4 * n), want.num(8 * n)],
  answer: ({ n }) => [`${2 * n}, ${4 * n}, ${8 * n}: 8 × ${n} = ${8 * n}`],
};

const eightAll = {
  id: "vm-tt8-all",
  group: "vm-tables8",
  label: "The whole eight times table",
  blurb: "The units in twos, then the tens with the 4 twice.",
  heading: "The 8 times table — count down in twos",
  instruction: () => SECRET8 + " It is set out as PrepBot sets it out. Fill the SECOND box of every row first, counting " +
    "8, 6, 4, 2, 0 down the page twice; then the FIRST box of every row, 0 to 4 and 4 to 8. On screen the boxes open " +
    "one at a time, in that order.",
  tv: "eights",
  cols: 1,
  defaultCount: 1,
  make: (r) => ({ n: r.int(2, 9) }),
  /* the units go in first here, down the page (steps 0 to 9); then the tens, down the page (10 to 19) */
  render: () => `<p class="vm-tt__key"><span class="is-u">second box first: 8, 6, 4, 2, 0 — twice</span><span class="is-t">then the first box: 0 to 4, and 4 to 8</span></p>` +
    `<div class="vm-tt" data-steps="listed">${Array.from({ length: 10 }, (_, i) =>
      `<p class="wb-ask vm-tt__row"><span class="vm-tt__sum">8 × ${i + 1} =</span> <span class="vm-tt__pair">` +
      `<span class="wb-answer vm-tt__t" data-step="${10 + i}"></span><span class="wb-answer vm-tt__u" data-step="${i}"></span></span></p>`).join("")}</div>`,
  worked: () => worked(ask("8 × 1 = " + strip("0", "8") + " &nbsp; 8 × 2 = " + strip("1", "6") + " &nbsp; 8 × 3 = " + strip("2", "4")) +
    say("The second digits go 8, 6, 4 … down in twos, and the first digits go 0, 1, 2 … so the top rows read 08, 16, 24.")),
  key: () => Array.from({ length: 10 }, (_, i) => [want.num(Math.floor((8 * (i + 1)) / 10)), want.num((8 * (i + 1)) % 10)]).flat(),
  answer: () => [Array.from({ length: 10 }, (_, i) => String(8 * (i + 1)).padStart(2, "0")).join(", ")],
};

export const TT_EXERCISES = [nineOne, nineAll, eightOne, eightAll];

/* ── one digit to a box, and on to the next ──────────────────────────────────
   On screen the table's boxes open one at a time (the engine's data-steps).
   Each holds ONE digit, so the moment it has one the pencil moves to the box
   that has just opened — tens down the page, then units up it — and the table
   is filled by typing 0 1 2 … 9, 0 1 2 … 9, exactly as it is counted on the TV. */
if (typeof document !== "undefined" && !document.__vmTableDigits) {
  document.__vmTableDigits = true;
  document.addEventListener("input", (e) => {
    const input = e.target;
    const box = input.closest?.(".vm-tt .wb-answer");
    if (!box) return;
    if (input.value.length > 1) {
      /* a second figure typed into a full box replaces the first; said again so the page keeps the one figure */
      input.value = input.value.slice(-1);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }
    if (!input.value.trim()) return;
    const mine = Number(box.dataset.step);
    setTimeout(() => {
      const next = [...box.closest(".vm-tt").querySelectorAll(".wb-answer")]
        .filter((b) => Number(b.dataset.step) > mine && !b.classList.contains("is-waiting"))
        .sort((x, y) => Number(x.dataset.step) - Number(y.dataset.step))
        .find((b) => !b.querySelector("input")?.value.trim());
      next?.querySelector("input")?.focus();
    }, 40);
  });
}
