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
  never a number beside a bar". One or two per step, no more. **Not in a line a
  cloned ElevenLabs voice will say** (the films): it reads a capitalised word
  as shouting or spells it out. Lean on the word with the sentence instead.
- **An aside is allowed and wanted.** "a calculator would just TELL me, and then
  neither of us would know a thing." It is what makes it a person.
- **Vary the openings.** Rotate them off a counter that spans the whole lesson,
  not one board. Twenty figures pass on one Toy Shop bill, and a tutor who says
  "Right" twenty times has stopped being listened to by the third.

## 2b. Talk like the user talks (2026-11-12, the house register)

The user wrote out how a film should SOUND, and this is now the default for
every new narration:

> so um, someone bought a computer set
> later, they sold that same computer set for fifty seven thousand naira
> but hmm, they did not make money o, they actually sold it at a loss
> they lost twenty five percent
> twenty five percent of what they bought it for, you get
> so what they bought it for is the big number we dont know yet, that is the one we are hunting, right
> so picture it like this, eh
> draw one whole bar in your mind, that bar is what they bought it for
> we dont know it yet so lets just put a question mark inside it, just like that
> [...]
> you follow me so far

What makes it work:

- **Short spoken lines, one idea each.** A line is one breath. Build a step's
  `say` from a list of these (`say(...lines)` joined with spaces). Do not
  write paragraphs.
- **NO FILLERS** (2026-11-12, after hearing them: *"remove the fillers and
  leave the breathing space"*). No "um", "hmm", "eh", "o", "sha", "okay so".
  On a synthetic voice they sound put on. What the sample was really asking
  for is the SPACE: short lines with silences between them (`pause`).
- **Check-ins stay** ("you get?", "right?", "you follow me so far?"). They are
  questions, not fillers, and they come before a pause.
- **Plain words for the maths terms.** Say "what they bought it for" before (and
  more often than) "cost price". Say "a quarter" before "twenty five percent".
- **Numbers in words** in the line ("fifty seven thousand"), since that is how
  they are said.
- **"Just" is fine here** when it means "only" or "like this" ("just the three",
  "just like that"). It is still banned in its belittling sense ("you just
  divide").

**Why a voice can sound robotic even when it is the right voice:** every line
is recorded on its own, so each sentence starts and ends flat. The TV sends
each line's neighbours as `previous_text` / `next_text`
(prepbot-tv.js `setLineContext`, server/routes/tts.js `lesson`), so a line is
said as part of the talk. A clone also wants steady settings (stability about
0.5, style low). High style and low stability make it wobble.

The same rules still hold underneath: point at what is drawn, say why, name
the trap, and keep the words in step with the picture. This register replaces
the longer, written-sounding sentences of the older films. The first film in it
is `loss-25` (utils/components/workbook/cbt-films.js).

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

### Timing (2026-11-12: *"The actions dont match the words … No pause, nothing"*)

- **One breath per step.** A step is one or two short lines, and it draws the
  ONE thing those lines talk about. A long step makes its drawing finish
  seconds before the words reach it.
- **Delay a mark to its word.** A stage's delay is when the word that names
  the mark is spoken. Allow about 2.5 words a second, so "That's ONE box" at
  the end of a ten-word line lands at about 3 s.
- **Real silences.** `push(say, { pause })` gives seconds of quiet after the
  words: about 1.5 to 1.8 after a question the child should answer in their
  head, 0.5 to 1 after an ordinary line. The TV fetches the next line's audio
  while this one plays, so the gaps come out even.
- **"..." in a line** gives a small spoken hesitation ("Four times nineteen
  thousand... seventy six thousand").
- **A bar that is cut stays on screen.** Draw the cut lines down through the
  same bar (`b0.cut` in cbt-films.js). Never clear it away and redraw four
  boxes. Only then swap to the drawing with four boxes, which has the same
  geometry, to write in them.

### Screen, sound and maths (2026-11-12: *"Too much information is congested … Use the center. Only use the side for extra calculations"*)

- **Layout:** the question sits small at the top. The CENTRE holds the one thing
  being worked (the drawing, then ONE line of working under it, replaced as it
  moves on). The SIDE holds only margin sums: 25 ÷ 25 = 1, the check, the trap.
  No side column of running notes.
- **Maths in MathJax** (`utils/components/workbook/film-math.js`: `texAt`,
  `mathifyPic` for a bar model's figures, `mathLoad` as the film's `ready`).
  Reduce a fraction where it stands: strike its top and bottom, then write the
  new figures small beside them (cbt-films.js `reduceMarks`).
- **Sound and screen changes** (`film-fx.js`): the drawing hand makes its own
  sounds (pencil for bars and braces, tick for figures, pen for strikes, snip
  for cuts). Use `H.sound("ding" | "warn" …)` for meaning, and
  `push(..., { transition: "wipe" | "fade" | "iris" | "slide" | "page" })` for
  a new scene (a new method).

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
