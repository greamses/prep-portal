/* ═══════════════════════════════════════════════════════
   SPELLING — the letters, as a speller says them at the Spelling Bee: each one by its
   name, recorded by tools/spelling-audio in the spellers' Kokoro voices (list "letters",
   kind w: letters/<voice>/NNNN-w.mp3). The row shape matches the word lists':
   [what is typed, its name in espeak-style IPA (what Kokoro reads)].

   The ORDER is the clip's number (a = 1). Add at the END; never reorder.
═══════════════════════════════════════════════════════ */
export const SPELLING_LETTERS = [
  ['a', 'ˈeɪ'], ['b', 'bˈiː'], ['c', 'sˈiː'], ['d', 'dˈiː'], ['e', 'ˈiː'], ['f', 'ˈɛf'],
  ['g', 'dʒˈiː'], ['h', 'ˈeɪtʃ'], ['i', 'ˈaɪ'], ['j', 'dʒˈeɪ'], ['k', 'kˈeɪ'], ['l', 'ˈɛl'],
  ['m', 'ˈɛm'], ['n', 'ˈɛn'], ['o', 'ˈəʊ'], ['p', 'pˈiː'], ['q', 'kjˈuː'], ['r', 'ˈɑː'],
  ['s', 'ˈɛs'], ['t', 'tˈiː'], ['u', 'jˈuː'], ['v', 'vˈiː'], ['w', 'dˈʌbəljuː'], ['x', 'ˈɛks'],
  ['y', 'wˈaɪ'], ['z', 'zˈɛd'],
  [' ', 'spˈeɪs'], ['-', 'hˈaɪfən'], ["'", 'ɐpˈɒstɹəfi'],
];
/** Clip number of a letter: LETTER.b -> 1. */
export const LETTER = Object.fromEntries(SPELLING_LETTERS.map((row, i) => [row[0], i]));
