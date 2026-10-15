---
name: prepbot-lesson-voice
description: How to write what PrepBot SAYS to a learner — the narration in the TV films (utils/components/workbook/tv-lessons.js, vedic explain.js, divvideo.js, algvideo.js, card-tricks tutor.js) and in the page walkthroughs (toy-shop/js/guide.js). Use whenever writing, rewriting or reviewing a lesson script, a film step's `say`, a tutor's spoken line, or a workbook explanation that is read aloud. Trigger on any task about PrepBot's words, lesson narration, explanations being too thin or too robotic, or adding a new film.
---

# How PrepBot talks

PrepBot is a teacher standing at a board with one child. Not a caption, not a
label, not a manual. Every line below is a rule the user has asked for, in their
own words, after watching a film or a walkthrough and finding it wanting.

> "Humanize the explanation like a classroom teacher."
> "The explanation should be very more detailed, humanize and conversational for
> easy and smooth learning just as teachers do."

So the default is **too much talking rather than too little**. A step that reads
like a caption is wrong even when it is correct.

## 1. The shape of a step

A film step is one `{ say, show }`. The `say` is what a teacher would actually
say while that change happens on the screen. Aim for **three to five sentences,
40–90 spoken words**. One short sentence is a caption; write the lesson.

Each step should do most of these, in roughly this order:

1. **Point at it.** "Look at the second row." "Watch the point while I press it."
   The child does not know where to look until told.
2. **Say the move.** What is happening and what it is called.
3. **Say WHY**, in a cause the child can feel. Not "because the rule says".
4. **Name the trap.** "Here is the bit everybody gets wrong…" A warning given
   before the mistake is worth five corrections after it.
5. **Hand it forward.** What this gives us for the next step.

## 2. The voice

- **Second person, present tense, contractions in the mouth not on the page.**
  "You are going to find out what it is", "we start at the right-hand end".
- **Talk TO the child, about the work.** "Start with the SMALLER one, always."
- **Ask and answer.** "So how many fifths is that? Five." A question makes the
  child answer in their head half a second before PrepBot does.
- **Say the number out loud in words when it is the point.** Twenty per cent is
  "a FIFTH" — the user asked for exactly this: *"20 percent is a fifth. Better
  said that way."* A fraction a child can picture beats a percentage they cannot.
- **CAPITALS for the one word carrying the sentence** — "a total is a BRACE,
  never a number beside a bar". One or two per step, no more.
- **An aside is allowed and wanted.** "a calculator would just TELL me, and then
  neither of us would know a thing." It is what makes it a person.
- **Vary the openings.** Rotate them off a counter that spans the whole lesson,
  not one board. Twenty figures pass on one Toy Shop bill, and a tutor who says
  "Right" twenty times has stopped being listened to by the third.

## 3. Never

- **No emojis.** Site-wide rule, and they are unspeakable anyway.
- **No praise for nothing.** "Well done!" after a step the child only watched.
- **No "simply", "just", "obviously", "as you can see".** Each one tells a stuck
  child that they are the problem.
- **No naming the machinery.** Not "the next step in the algorithm", not "the
  function returns" — say what a person at a board would say.
- **No reading the screen out.** If the picture already says `12 + 36 = 48`,
  the words say why those were the numbers, not what they are.
- **Never lie about what happened.** If a board stopped short, say nothing
  rather than announce a wrong answer. (A real bug: a long division that broke
  at the bring-down had PrepBot read the remainder back as the answer.)

## 4. The words must match the picture, step for step

The `show` and the `say` are one thing. If the words describe a bar being cut
into four, the step must CUT it — not swap in a finished picture of four parts.
Animate the thing being talked about:

- **A bar is drawn, not revealed** — it grows from its left edge, in the time it
  takes to say the sentence about it.
- **A number is written, not displayed** — it lands in its box after the words
  that work it out, one box at a time, in reading order.
- **A brace is drawn after the thing it spans**, because it is a statement about
  what is already there.
- Pause between the action and the number: the picture should be a beat ahead of
  the figure, the way a teacher draws and then labels.

Where the words and the drawing disagree, the child believes the drawing.

## 5. Where the lesson's own content comes from

Prefer the component's own words over words written into the film:

- A written board phrases its next step as a question a child could be asked
  aloud — `kind.ask(thing)` → `{ text, where }`. A tutor reads THAT out and
  answers it. No script per board, and the words cannot drift from what the
  board actually wants, because they are what it wants. See
  `prep-math/activity/toy-shop/js/guide.js`.
- A bar model is drawn by the workbook's own `modelSvg`, so the film cannot
  disagree with the paper — including the brace rule.

## 6. Every lesson ends the same way

The closing step is added centrally in `openTv`
(`prep-math/mental-math/shared/prepbot-tv.js`), so every film gets it and no
scene writes its own: a sentence sending the child to **prepportal.com.ng** to
practise, with the address on the screen. Do not duplicate it per scene.

## 7. Check it by listening

The narration is spoken, so read it aloud or play the film before saying it is
done. Specifically:

- Does any step sound like a label? Rewrite it.
- Does the same opening word appear twice within four steps?
- Is anything said that the picture does not do at that moment?
- Does a number appear before the sentence that works it out?
- Would a stuck child know where on the screen to look?

A harness that captures what is spoken, in order, alongside the screen state is
the honest check — `scratchpad/speakfig.mjs` does this for the Toy Shop by
recording `speechSynthesis.speak`.
