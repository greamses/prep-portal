// Records the Drills spelling bank with Kokoro. Run by GitHub Actions
// (.github/workflows/spelling-audio.yml) on GitHub's machines: the clips are kept on the
// repo's `spelling-audio` branch and served to the site by jsDelivr, so they are never on
// anyone's own disk (a local clone is set not to fetch that branch).
//
//   node record.mjs --bank <lower|upper|secondary> --have <dir> --out <dir> [--part 1/3] [--kinds w,d,s]
//     --bank  which word list (data/spelling/<file>.js, see LISTS)
//     --part  an even slice of the list, so several machines share it (1/3 = the first third)
//     --have  the clips already made (the spelling-audio branch's list/voice folder): skipped
//     --out   where to write the new ones (the workflow commits them to the branch)
//
// A clip already made is never recorded twice, so a stopped run just carries on.
//
// The words are spoken from the list's own IPA, so a rare word sounds as the list says;
// in a sentence the word keeps that IPA and Kokoro reads the words around it.
import { load, speak, linePhonemes, mp3, fromDictionary } from './voice.mjs';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { VOICE } from './voice-name.mjs';

// The lists, and how each writes its IPA: the secondary list in espeak style (what Kokoro
// reads), the primary lists dictionary-style (converted by fromDictionary).
const LISTS = {
  secondary: { file: 'secondary.js', name: 'SPELLING_SECONDARY', ipa: (p) => p },
  upper: { file: 'upper-primary.js', name: 'SPELLING_UPPER_PRIMARY', ipa: fromDictionary },
  lower: { file: 'lower-primary.js', name: 'SPELLING_LOWER_PRIMARY', ipa: fromDictionary },
};
const arg = (name, dflt) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : dflt; };
const LIST = LISTS[arg('bank', 'secondary')];
if (!LIST) { console.error(`--bank must be one of ${Object.keys(LISTS).join(', ')}`); process.exit(2); }
const BANK = (await import(new URL(`../../data/spelling/${LIST.file}`, import.meta.url)))[LIST.name];
const [pi, pn] = String(arg('part', '1/1')).split('/').map(Number);
const per = Math.ceil(BANK.length / pn);
const FROM = (pi - 1) * per, TO = Math.min(BANK.length, pi * per);
const kinds = arg('kinds', 'w,d,s').split(',').filter((k) => 'wds'.includes(k));
const pad = (i) => String(i + 1).padStart(4, '0');

// A clip that came out (almost) silent or far too short is a bad render: fp16 does that now
// and then. It is redone with the full-precision model, which is slower but steady.
const good = (a, rate) => {
  let peak = 0;
  for (const v of a) peak = Math.max(peak, Math.abs(v));
  return peak > 0.05 && a.length > rate * 0.25;
};
let precise = null;

const HAVE = arg('have', null), OUT = arg('out', null);
if (!OUT) { console.error('--out <dir> is needed'); process.exit(2); }
mkdirSync(OUT, { recursive: true });
const done = new Set(HAVE && existsSync(HAVE) ? readdirSync(HAVE).map((f) => f.replace(/\.mp3$/, '')) : []);
const t0 = Date.now();
const todo = [];
for (const k of kinds) for (let i = FROM; i < TO; i++) if (!done.has(`${pad(i)}-${k}`)) todo.push([k, i]);
console.log(`Kokoro ${VOICE}; ${arg('bank', 'secondary')} entries ${FROM + 1}-${TO}; ${kinds.join(', ')}; ${todo.length} to record.`);
if (!todo.length) process.exit(0);             // everything here is already made: no model to load
await load('fp16');
let made = 0, redone = 0, failed = 0;
for (const [k, i] of todo) {
  const name = `${pad(i)}-${k}`;
      const [word, rawIpa, def, use] = BANK[i];
      const ipa = LIST.ipa(rawIpa);
      const phon = k === 'w' ? ipa : k === 'd' ? await linePhonemes(def) : await linePhonemes(use, word, ipa);
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
