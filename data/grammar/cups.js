/* ═══════════════════════════════════════════════════════
   GRAMMAR — the CUPS registry.

   CUPS is the editing checklist every planted error belongs to:

     C  Capitalisation   sentence starts, names, places, days, months, "I"
     U  Usage            the word is spelled fine and punctuated fine, but it is
                         the WRONG word — their/there, was/were, should of
     P  Punctuation      full stops, commas, apostrophes, question marks
     S  Spelling         the right word, written wrong

   Every error in every passage carries exactly one of these letters, and the
   player has to name it as well as fix it (see game.js) — a child who repairs
   "there → their" without knowing it is a USAGE error has fixed one sentence,
   not learned a rule.

   Kept in its own tiny module because BOTH the setup screen (the focus picker)
   and the study card need it before any passage is loaded.
═══════════════════════════════════════════════════════ */

export const CUPS = [
  {
    key: 'C',
    label: 'Capitalisation',
    short: 'Capitals',
    hint: 'Start of a sentence, names, places, days, months, and the word “I”.',
    examples: [
      ['on monday we left lagos.', 'On Monday we left Lagos.'],
      ['my friend amina and i went.', 'My friend Amina and I went.'],
    ],
  },
  {
    key: 'U',
    label: 'Usage',
    short: 'Usage',
    hint: 'The wrong word, spelled correctly — their/there, was/were, fewer/less.',
    examples: [
      ['They left there bags behind.', 'They left their bags behind.'],
      ['We was late for the bus.', 'We were late for the bus.'],
    ],
  },
  {
    key: 'P',
    label: 'Punctuation',
    short: 'Punctuation',
    hint: 'Full stops, commas, apostrophes, question marks — and where they go.',
    examples: [
      ['Where is the hall', 'Where is the hall?'],
      ['That is Tolus book.', 'That is Tolu’s book.'],
      ['We waited and the bus came.', 'We waited, and the bus came.'],
    ],
    /* THE COMMA RULES this bank is written and marked against. Stated here
       because "where the comma goes" is the one CUPS letter with a genuine
       house style, and a passage that applies it loosely marks a correct
       reader wrong. Shown on the rules card so a player knows the standard
       they are being held to.

       Rule 1 is the one that does the work: two complete sentences joined by
       and/but/or/so take a comma. Two verbs sharing one subject do NOT — that
       is the distinction most often got wrong in both directions. */
    rules: [
      ['Comma before and / but / or / so when it joins two complete sentences.',
       'The pitch was dry, and the ball ran quickly.'],
      ['NO comma when the two verbs share one subject.',
       'He moved the goats and barred the door.'],
      ['Commas in a pair around a name or description that could be lifted out.',
       'Our captain, Emeka, won the toss.'],
      ['Comma before a “which” clause that adds extra information.',
       'The roots take in water, which travels up the stem.'],
      ['Apostrophe for possession and for missing letters.',
       'Amaka’s hat · didn’t · o’clock'],
    ],
  },
  {
    key: 'S',
    label: 'Spelling',
    short: 'Spelling',
    hint: 'The right word, written wrong — recieve, definately, seperate.',
    examples: [
      ['We recieved the letter.', 'We received the letter.'],
      ['It was definately him.', 'It was definitely him.'],
    ],
  },
];

export const CUPS_KEYS = CUPS.map((c) => c.key);
export const CUPS_LABEL = Object.fromEntries(CUPS.map((c) => [c.key, c.label]));
export const CUPS_SHORT = Object.fromEntries(CUPS.map((c) => [c.key, c.short]));

/* ── The focus mask ───────────────────────────────────────────────────────
   A round can drill the whole checklist or just part of it — Punctuation only,
   or Usage + Spelling. The pick travels the seeded-room contract as a compact
   canonical string ('cups', 'ps', 'u'), so two players ticking the same boxes
   land in the same matchmaking bucket no matter what order they ticked them.

   An out-of-focus error is NOT removed from the passage — it is handed to the
   player ALREADY CORRECT and never scored (see index.js's buildPassage). The
   prose stays coherent; only the hunt narrows. */

/** Canonical focus string for a set of CUPS letters. Empty/all → 'cups'. */
export function focusKey(letters) {
  const set = new Set(letters || []);
  const picked = CUPS_KEYS.filter((k) => set.has(k));
  if (!picked.length || picked.length === CUPS_KEYS.length) return 'cups';
  return picked.join('').toLowerCase();
}

/** The letters a focus string covers, as a Set. 'cups' → all four. */
export function focusSet(key) {
  const s = String(key || 'cups').toUpperCase();
  const picked = CUPS_KEYS.filter((k) => s.includes(k));
  return new Set(picked.length ? picked : CUPS_KEYS);
}

/** "Punctuation & Spelling" — for the recap chip and the results card. */
export function focusLabel(key) {
  const set = focusSet(key);
  if (set.size === CUPS_KEYS.length) return 'Full CUPS';
  const names = CUPS.filter((c) => set.has(c.key)).map((c) => c.short);
  return names.length === 1 ? `${names[0]} only` : names.join(' & ');
}
