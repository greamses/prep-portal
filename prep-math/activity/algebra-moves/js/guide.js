/* ═══════════════════════════════════════════════════════════════════════════
   THE GUIDE — how to set Algebra Moves up and how to use its gestures.

   A panel on the side rail, beside the formula book. Everything it says is
   something the page really does: a tap, Shift/Ctrl/⌘ + tap or a hold, a
   double tap, a drag, the wheel, Ctrl+Z. Each gesture is a row: what you do on
   the left, what happens on the right.
   ═══════════════════════════════════════════════════════════════════════════ */

const SECTIONS = [
  {
    title: "Setting up",
    rows: [
      ["Open the keypad", "It opens with the page. Tabs along the top: 123 for numbers and the big operations, ABC for letters (the arrow key makes capitals), αβγ for Greek (its arrow key switches to Γ Δ Θ Λ Ξ Π Φ Ψ Ω), f(x) for functions, in three groups: Trig, Lists, More."],
      ["Type a problem", "The keys make boxes: a fraction is two boxes, a power has a raised box. Fill the box the caret is in, press → to leave it. Backspace takes out a whole box when it is empty."],
      ["Put it on the canvas", "Press Enter. A line with = is an equation to solve. A line with < > ≤ ≥ is an inequality. A line with neither is an expression to tidy up."],
      ["The side rail", "Formula book (formulas to fill in, and the rule book with a worked example for every rule), pin a sticky note, calculator, graph, digit-shift card, note pad."],
    ],
  },
  {
    title: "Making a move",
    rows: [
      ["Tap a number, letter, sign or bracket", "A menu shows only the moves that fit that one thing: the 3 of 3x offers ÷3, a + between terms offers to swap them, a bracket offers to open or take out."],
      ["Tap the =", "Moves for the whole line: turn it round, change every sign, do something to both sides, solve an inequality by testing stretches, take the log of both sides."],
      ["Tap a fraction bar, a root, an absolute value bar", "Moves for that shape: split it, cancel, rationalise, write it as a division, split ± into two cards."],
    ],
  },
  {
    title: "Picking more than one",
    rows: [
      ["Shift + tap, Ctrl + tap or ⌘ + tap", "Adds a glyph to what is picked. Tap it again to take it out."],
      ["Hold (touch screens)", "Press and hold a glyph for about half a second to add it. Your device buzzes."],
      ["Pick 3x and 5, then tap the =", "Both cross to the other side together. A single tap on the = after a pick is the destination."],
      ["Pick several terms", "Swap them, put like terms together, collect them, take out a common factor, or differentiate or integrate just those."],
      ["Pick several signs", "A swap for the two terms either side of each sign."],
      ["Pick one bracket from each term", "Take the common bracket out: 2(x + 5y) − 3(x + 5y) = (2 − 3)(x + 5y). Pick one bracket and a single tap does every term that has it."],
      ["Pick the brackets of a product", "Tap the first bracket to multiply it into the second, the second to multiply it into the first. Only that far."],
      ["Pick the factors of one term", "Pick P and T in PRT/100 to divide both sides by PT together; or swap the factors, or multiply just the numbers you picked."],
    ],
  },
  {
    title: "Writing it yourself",
    rows: [
      ["Double-tap a letter", "Put a number in for that letter, everywhere it is written."],
      ["Double-tap a number", "Write it another way: 9 as 3², 0.5 as 1/2. The same number is checked before it is kept."],
      ["Double-tap the =", "Write the whole next line your own way. It stays if it says the same thing."],
    ],
  },
  {
    title: "Moving around",
    rows: [
      ["Drag a card by its grip", "Move the card about the canvas."],
      ["Drag the bare paper", "Pan the canvas."],
      ["Scroll the wheel", "Zoom in and out, keeping what is under the pointer where it is."],
      ["Tap bare paper", "Puts the menu away."],
      ["Ctrl/⌘ + Z, and Ctrl/⌘ + Y", "A step back, and a step forward again, on the card you are working. The card's own arrows do the same."],
      ["Esc", "Puts the menu and the keypad away."],
    ],
  },
  {
    title: "On each line",
    rows: [
      ["The marks at the left of a line", "Fold the line down to a stub, tick it, change its size or colour. Ticked lines can be copied or cut into a new card."],
      ["The margin note", "The small writing at the right of a line says what was done to both sides: −3, ÷2."],
    ],
  },
];

export function mountGuide(host) {
  host.classList.add("am-guide");
  const intro = document.createElement("p");
  intro.className = "am-guide__intro";
  intro.textContent = "You name the move; the page checks it. Tap what you want to change and choose from what fits.";
  host.appendChild(intro);
  for (const section of SECTIONS) {
    const h = document.createElement("h3");
    h.className = "am-guide__h";
    h.textContent = section.title;
    host.appendChild(h);
    const list = document.createElement("dl");
    list.className = "am-guide__list";
    for (const [what, says] of section.rows) {
      const dt = document.createElement("dt");
      dt.textContent = what;
      const dd = document.createElement("dd");
      dd.textContent = says;
      list.append(dt, dd);
    }
    host.appendChild(list);
  }
}
