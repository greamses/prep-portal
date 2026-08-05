/* ═══════════════════════════════════════════════════════
   FALLBACK PASSAGES — what the Summary family reads when the generator
   cannot be reached.

   Every other form falls back to a one-line prompt (js/forms.js `fallbacks`).
   A summary cannot: the task IS the passage, so there has to be a real one
   sitting on disk for the day the AI is down, the key is missing or the
   student is offline.

   Every passage here obeys the same rules the generator is given:
     • FIVE paragraphs minimum — the organiser needs one box per paragraph.
     • Each paragraph carries exactly ONE point worth summarising. A paragraph
       with two equal points makes the "one sentence for this box" instruction
       a lie.
     • Culture-neutral. No country, currency, institution or public figure —
       the same rule the prompt generator follows, for the same reason.
═══════════════════════════════════════════════════════ */

export const FALLBACK_PASSAGES = {
  'summary-informational': [
    {
      title: 'Why Sleep Is Not Wasted Time',
      paragraphs: [
        'Sleep looks like the hours in which nothing happens. The body lies still, the eyes are shut, and for a long time doctors assumed the brain simply switched off along with everything else. In fact the opposite is true: some parts of the brain are busier while a person sleeps than while they are awake, and the work they do at night cannot be done at any other time.',
        'Most of that work is filing. During the day the brain takes in far more than it can hold, and at night it sorts what it has collected, strengthening the connections that carry useful memories and letting the useless ones fade. This is why a skill practised in the evening is often easier the following morning, and why revising all night without sleeping is the least efficient way to learn anything.',
        'The brain also cleans itself while it sleeps. Spaces between its cells widen, and fluid is pushed through them to wash out the waste products that build up during waking hours. A brain that never gets this rinse begins to work slowly and inaccurately, which is why a person who has slept badly makes clumsy mistakes on tasks they can normally do without thinking.',
        'The rest of the body is on the same timetable. Growth and repair are concentrated in the deepest stage of sleep: tissue is rebuilt, injuries are mended, and the defences that fight off infection are restocked. Someone who is short of sleep for several nights in a row catches colds more easily and recovers from them more slowly than someone who is not.',
        'None of this can be caught up with later in any complete way. A long lie-in after a week of short nights repairs some of the damage, but not all of it, and the memories that were never filed properly are not recovered at all. Sleep is not the reward for a finished day. It is the part of the day in which most of the useful work is finally put away.',
      ],
    },
    {
      title: 'The Gaps in a Bridge',
      paragraphs: [
        'Anyone who has walked across a long bridge has felt the road change under their feet at regular intervals: a metal comb set into the surface, or a narrow gap covered by a plate. These are not faults, and they are not places where the builders ran out of material. They are among the most carefully designed parts of the whole structure.',
        'The reason for them is that materials change size with temperature. Steel and concrete expand when they are warmed and contract when they cool, and although the change is small for any short piece, a bridge deck several hundred metres long can grow by more than the width of a hand between a cold night and a hot afternoon. That movement has to go somewhere.',
        'If the deck were fixed rigidly at both ends, it would have nowhere to go, and the force it produced would be enormous. Something would have to give: the deck would buckle upwards, or the supports at each end would be pushed out of position and cracked. Expansion joints prevent this by leaving a measured gap at intervals, so the deck can lengthen into the space instead of pushing against it.',
        'The same problem is solved in other ways elsewhere. Railway lines were once laid in short sections with visible gaps between them, which is what produced the old rhythmic knock of a train passing over the joints. Long pipelines are laid in deliberate bends so that they can flex rather than stretch, and tall buildings are designed with joints that let one section move slightly against another.',
        'Bridges therefore have to be built for weather as much as for weight. A design that carries traffic perfectly at one temperature but cannot move at another is not a safe design at all, and the small gaps that passengers notice under their wheels are the visible evidence that the engineers allowed the structure room to breathe.',
      ],
    },
  ],

  'summary-narrative': [
    {
      title: 'The Long Way Home',
      paragraphs: [
        'The rain started while we were still in the last lesson of the afternoon, and by the time the bell went it had turned the yard into a shallow brown lake. Nobody moved for a while. We stood under the walkway in a line, watching the water climb the second step, and agreeing with each other that it would stop soon.',
        'It did not stop. At half past four my brother and I decided to walk the two kilometres home rather than wait any longer, and we took off our shoes at the gate because the road had already disappeared under the flood. The water was warm and moving faster than it looked, and twice I put my foot down and found nothing where the kerb should have been.',
        'At the junction we found a queue of people who had got no further. A minibus had stalled across the road, and its driver was standing on the seat, shouting instructions at nobody in particular. An older woman with a basket on her head was explaining to anyone who would listen that the drain under the junction had been blocked since the previous year and that she had said so at the time.',
        'It was my brother who suggested the long way round — up past the school field, along the ridge where the ground was higher, and down again at the far end of our street. It added at least a kilometre and neither of us wanted to walk it. We went anyway, and from the ridge we could see how far the flood had spread, which was much further than either of us had realised while we were standing in it.',
        'We got home an hour later than usual, soaked to the waist and carrying our shoes. Our mother had already heard about the junction, and she did not ask why we were late. What I remember most is not the water but the moment on the ridge, when the sensible thing turned out to be the longest way round, and I understood that I would not have thought of it myself.',
      ],
    },
    {
      title: 'The Borrowed Bicycle',
      paragraphs: [
        'For most of that year the only bicycle on our street belonged to a man everyone called the tailor, though nobody was sure he had ever sewn anything. It leaned against his wall every evening, unlocked, and he lent it to anybody who asked properly, which meant knocking, waiting, and saying where you were going and when you would be back.',
        'I asked for the first time on a Thursday, because my aunt lived on the far side of the market and my mother needed a message taken before dark. The tailor looked at me for what felt like a long time, asked how old I was, and then handed the bicycle over without any of the warnings I had been braced for. He said only that the brake on the left did not work and that I should remember it.',
        'I forgot it within ten minutes. Coming down the slope by the water tank I squeezed the left brake, felt nothing at all, and went into a stack of empty crates outside a shop. The crates went everywhere. The shopkeeper came out, looked at the mess, looked at the bicycle, and told me to pick them up, which I did with my hands shaking so badly that I dropped two of them again.',
        'The front wheel was bent. I walked the bicycle back the whole way, rehearsing what I would say, and when I got to the tailor I said all of it at once — that I had forgotten the brake, that it was my fault, and that I would pay for the wheel although I had no idea how. He listened to the end without interrupting me.',
        'Then he said that the wheel would cost less than I feared and that I could work it off on Saturdays, and he took the bicycle inside. He lent it to me again the following month. It was years before I understood that the second loan, not the first, was the thing he had actually given me.',
      ],
    },
  ],

  'summary-argument': [
    {
      title: 'Homework Should Be Set Less Often',
      paragraphs: [
        'Homework is defended so automatically that the argument for it is rarely made out loud. It is assumed to build discipline, to extend the lesson and to keep parents informed, and a school that set less of it would be suspected of expecting less. Yet the case for setting homework every night, in every subject, is much weaker than its popularity suggests.',
        'The first problem is that most homework is not practice. Genuine practice means repeating a skill you have already been taught until it becomes reliable, and that is useful. A great deal of what is actually set is new work in disguise: reading a chapter nobody has explained, or answering questions on a method that was introduced in the last four minutes of a lesson. A student who did not understand it in class does not understand it any better alone at nine in the evening.',
        'The second problem is that homework is the point at which school stops being fair. In class every student has the same teacher, the same board and the same forty minutes. At home one student has a desk, a quiet room and an adult who studied the subject, and another has none of those things and a younger brother to mind. Work set at home is therefore marked partly on circumstances the student cannot control.',
        'It should be admitted that some homework is genuinely irreplaceable. A language needs daily contact to stick, a long novel cannot be read in lesson time, and a piece of extended writing needs more quiet than a classroom ever offers. Nobody sensible is arguing that students should be sent home with nothing at all.',
        'The argument is about frequency, not existence. Less homework, set only where it does something that lesson time cannot, would be marked more carefully, taken more seriously and completed by more students. The present habit of setting something every night because something is expected produces a great deal of paper and very little learning.',
      ],
    },
    {
      title: 'Everyone Should Learn to Cook',
      paragraphs: [
        'Cooking is treated as a hobby for those who enjoy it and a chore for everybody else, and in most timetables it sits somewhere near the bottom of the list of things worth teaching. This is a strange judgement about a skill that every single person will need, several times a day, for the whole of their adult life.',
        'The clearest argument for it is cost. Food that has been prepared, packaged and delivered ready to eat costs several times what the same ingredients cost raw, and the gap is widest for the cheapest ingredients of all — rice, beans, eggs, vegetables in season. A young adult who can cook is not merely eating better; they are living on noticeably less money than one who cannot.',
        'Health follows from the same fact. Someone who cooks knows exactly how much salt, sugar and oil has gone into a meal, because they put it there. Someone who does not cook is eating quantities decided by a manufacturer whose interest is that the food should be difficult to stop eating. Over years, the difference between those two positions is not small.',
        'There is an argument on the other side worth taking seriously: time. Cooking takes longer than opening a packet, and for a person working long hours that time is real. But the comparison is usually made against the wrong thing. Most everyday cooking is twenty minutes of unskilled work, and the alternative is not zero minutes but a journey, a queue and a wait.',
        'A subject that saves money, improves health and takes a few weeks to teach the basics of should not be an optional extra. Cooking is not a talent that some people happen to have. It is a set of ordinary techniques that anybody can be shown, and the case for showing everybody is much stronger than the case for the subjects it is usually dropped in favour of.',
      ],
    },
  ],

  'summary-discussion': [
    {
      title: 'Phones in School: Two Views',
      paragraphs: [
        'Few school rules are argued about as often as the one governing phones. Some schools collect them at the gate, some allow them in bags but not in hands, and a few have given up enforcing anything at all. The disagreement is not really about the devices; it is about what a school is for, and both sides have arguments worth hearing.',
        'Those who want phones banned point first to attention. A phone in a pocket does not have to be looked at to be distracting: knowing that messages are arriving is enough to pull a student out of a lesson several times an hour. They add that phones have made bullying continuous rather than occasional, since a photograph taken in a corridor can be everywhere in the school before the next lesson begins.',
        'Those who want them allowed argue that a phone is now the ordinary tool for looking something up, translating a word, recording a diagram from the board or telling a parent that a bus has not arrived. Banning it, they say, does not remove the distraction; it removes the chance to teach anybody how to manage it, and students leave school having never been shown how to use the device they will use every day.',
        'Both sides agree on more than they admit. Nobody argues that a student should be scrolling during an explanation, and almost nobody argues that a family should be unable to reach a child in an emergency. The real disagreement is narrower: whether teenagers can be taught to put the phone away themselves, or whether the school should do it for them.',
        'That is why the compromise most schools reach looks the same everywhere — phones off and out of sight in lessons, allowed at break, permitted in class only when a teacher asks for them. It satisfies neither side completely. It survives because it is the only arrangement that treats the problem as a habit to be trained rather than an object to be confiscated.',
      ],
    },
    {
      title: 'The City or the Small Town',
      paragraphs: [
        'Young people leaving school are asked, sooner or later, whether to stay where they grew up or move to a city. It is usually presented as a choice between ambition and comfort, which is unfair to both options, because each one offers something the other genuinely cannot.',
        'The case for the city begins with work. Cities hold more jobs, more kinds of job, and more employers competing for the same people, which means that someone with an unusual skill can find someone who needs it. They also hold the things that follow a large population: hospitals with specialists, colleges, libraries, and enough people interested in any subject to make a group of them worth forming.',
        'The case against the city is the price of standing in it. Housing takes a share of a city wage that would be unthinkable elsewhere, and the journey to work can take two hours out of every day. There is also the peculiar loneliness of a place where nobody knows you: a person can live on a city street for three years without learning the name of anyone on it.',
        'The small town answers exactly those complaints. Space is affordable, distances are short, and a person is known — which means help arrives without being asked for. It answers them at a cost of its own: fewer jobs and a narrower range of them, longer journeys to anything specialised, and the same familiarity working the other way, since a place where everybody knows you is also a place where everybody knows your business.',
        'What the comparison really shows is that the two are strong in opposite directions, and that the right answer depends on which weakness a person can live with. Somebody who needs a particular kind of work will not find it in a town of four thousand people. Somebody who needs to be known will not find that on a city street. Neither has chosen wrongly.',
      ],
    },
  ],
};

/* One passage, chosen at random, for a form that has no generator answer.
   Falls through to the informational set for any id that is not listed, so a
   new summary form can never leave the student with an empty page. */
export function fallbackPassageFor(formId) {
  const set = FALLBACK_PASSAGES[formId] || FALLBACK_PASSAGES['summary-informational'];
  return set[Math.floor(Math.random() * set.length)];
}
