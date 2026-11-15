// Records the Drills spelling bank with Kokoro. Run by GitHub Actions
// (.github/workflows/spelling-audio.yml) on GitHub's machines: the clips are kept on the
// repo's `spelling-audio` branch and served to the site by jsDelivr, so they are never on
// anyone's own disk (a local clone is set not to fetch that branch).
//
//   node record.mjs --bank <lower|upper|secondary> --have <dir> --out <dir> [--part 1/3] [--kinds w,d,s,o]
//     --bank  which word list (data/spelling/<file>.js, see LISTS)
//     --part  an even slice of the list, so several machines share it (1/3 = the first third)
//     --have  the clips already made (the spelling-audio branch's list/voice folder): skipped
//     --kinds w word, d definition, s sentence, o the part of speech, origin and root
//     --out   where to write the new ones (the workflow commits them to the branch)
//     --redo  a file of clips to record AGAIN even though they exist ("secondary/0806-w", one
//             a line): how a bad recording is replaced. The workflow empties it afterwards.
//
// A clip already made is never recorded twice, so a stopped run just carries on.
//
// The words are spoken from the list's own IPA, so a rare word sounds as the list says;
// in a sentence the word keeps that IPA and Kokoro reads the words around it.
import { load, speak, linePhonemes, mp3, fromDictionary } from './voice.mjs';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { VOICE } from './voice-name.mjs';
// the 'o' line ("It is a noun, from Greek. The root is ..."), the same words the site falls back to
import { aboutLine } from '../../data/spelling/roots.js';

// The lists. Their IPA comes in two styles: espeak's (stress mark just before the vowel, what
// Kokoro was trained on) and the dictionary's (dots, stress mark at the START of the syllable).
// The primary lists are all dictionary-style, and so is the end of the secondary list, where a
// stress mark before a consonant made Kokoro say "acynical" for "cynical". fromDictionary turns
// either into espeak style (it leaves espeak-style IPA as it is), so every list goes through it.
const LISTS = {
  secondary: { file: 'secondary.js', name: 'SPELLING_SECONDARY', ipa: fromDictionary },
  upper: { file: 'upper-primary.js', name: 'SPELLING_UPPER_PRIMARY', ipa: fromDictionary },
  lower: { file: 'lower-primary.js', name: 'SPELLING_LOWER_PRIMARY', ipa: fromDictionary },
  // the Spelling Bee judge's lines ("Your word is,", "Correct."): text only, so kind d alone
  phrases: { file: 'phrases.js', name: 'SPELLING_PHRASES', ipa: fromDictionary, only: 'd' },
  // the letters by name, for the Spelling Bee's spellers (in their own voices): a letter's
  // name is short, so a clip as short as 0.12 s is a good one
  letters: { file: 'letters.js', name: 'SPELLING_LETTERS', ipa: fromDictionary, only: 'w', min: 0.12 },
};
const arg = (name, dflt) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : dflt; };
const LIST = LISTS[arg('bank', 'secondary')];
if (!LIST) { console.error(`--bank must be one of ${Object.keys(LISTS).join(', ')}`); process.exit(2); }
const BANK = (await import(new URL(`../../data/spelling/${LIST.file}`, import.meta.url)))[LIST.name];
const [pi, pn] = String(arg('part', '1/1')).split('/').map(Number);
const per = Math.ceil(BANK.length / pn);
const FROM = (pi - 1) * per, TO = Math.min(BANK.length, pi * per);
const kinds = arg('kinds', 'w,d,s,o').split(',').filter((k) => (LIST.only || 'wdso').includes(k));
const pad = (i) => String(i + 1).padStart(4, '0');

// A clip that came out (almost) silent or far too short is a bad render: fp16 does that now
// and then. It is redone with the full-precision model, which is slower but steady.
const good = (a, rate) => {
  let peak = 0;
  for (const v of a) peak = Math.max(peak, Math.abs(v));
  return peak > 0.05 && a.length > rate * (LIST.min ?? 0.25);
};
let precise = null;

const HAVE = arg('have', null), OUT = arg('out', null);
if (!OUT) { console.error('--out <dir> is needed'); process.exit(2); }
mkdirSync(OUT, { recursive: true });
const done = new Set(HAVE && existsSync(HAVE) ? readdirSync(HAVE).map((f) => f.replace(/\.mp3$/, '')) : []);
// clips to record again: drop them from "done"
const REDO = arg('redo', null);
if (REDO && existsSync(REDO)) {
  for (const line of readFileSync(REDO, 'utf8').split(/\r?\n/)) {
    const m = /^(\w+)\/(\d{4}-[wdso])$/.exec(line.trim());
    if (m && m[1] === arg('bank', 'secondary')) done.delete(m[2]);
  }
}
const t0 = Date.now();
const todo = [];
for (const k of kinds) for (let i = FROM; i < TO; i++) if (!done.has(`${pad(i)}-${k}`)) todo.push([k, i]);
console.log(`Kokoro ${VOICE}; ${arg('bank', 'secondary')} entries ${FROM + 1}-${TO}; ${kinds.join(', ')}; ${todo.length} to record.`);
if (!todo.length) process.exit(0);             // everything here is already made: no model to load
await load('fp16');
let made = 0, redone = 0, failed = 0;
for (const [k, i] of todo) {
  const name = `${pad(i)}-${k}`;
      const [word, rawIpa, def, use, pos = '', origin = ''] = BANK[i];
      const ipa = LIST.ipa(rawIpa);
      const phon = k === 'w' ? ipa : k === 'd' ? await linePhonemes(def)
        : k === 'o' ? await linePhonemes(aboutLine(word, pos, origin)) : await linePhonemes(use, word, ipa);
      const opts = { voice: VOICE, lift: 1, speed: 1 };   // her own voice and pace: nothing tweaked
      let clip = await speak(phon, opts);
      if (!good(clip.audio, clip.rate)) {
        if (!precise) { const { load: loadAgain, speak: s2 } = await import('./voice.mjs?precise'); await loadAgain('fp32'); precise = s2; }
        clip = await precise(phon, opts);
        redone++;
      }
      if (!good(clip.audio, clip.rate)) { console.warn(`  could not record ${name} (${word})`); failed++; continue; }
      writeFileSync(resolve(OUT, `${name}.mp3`), mp3(clip.audio, clip.rate, k === 'w' ? 32 : 24));
      made++;
      if (made % 25 === 0) console.log(`${made} new clips; ${((Date.now() - t0) / 60000).toFixed(1)} min`);
}
console.log(`Finished: ${made} new clips (${redone} redone at full precision, ${failed} failed) in ${((Date.now() - t0) / 60000).toFixed(1)} min.`);
if (failed) process.exitCode = 1;
