// Records the Drills spelling bank with Kokoro. Run by GitHub Actions
// (.github/workflows/spelling-audio.yml) on GitHub's machines: the clips are kept on the
// repo's `spelling-audio` branch and served to the site by jsDelivr, so they are never on
// anyone's own disk (a local clone is set not to fetch that branch).
//
//   node record.mjs --have <dir> --out <dir> [--sets 1-5] [--kinds w,d,s]
//     --have  the clips already made (the spelling-audio branch's voice folder): skipped
//     --out   where to write the new ones (the workflow commits them to the branch)
//
// A clip already made is never recorded twice, so a stopped run just carries on.
//
// The words are spoken from the list's own IPA, so a rare word sounds as the list says;
// in a sentence the word keeps that IPA and Kokoro reads the words around it.
import { load, speak, linePhonemes, mp3 } from './voice.mjs';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { VOICE } from './voice-name.mjs';

const { SPELLING_SECONDARY: BANK } = await import(new URL('../../data/spelling/secondary.js', import.meta.url));
const arg = (name, dflt) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : dflt; };
const SET = 20, SETS = Math.ceil(BANK.length / SET);
function parseSets(s) {
  const out = new Set();
  for (const part of String(s).split(',')) {
    const [a, b] = part.split('-').map(Number);
    for (let n = a; n <= (b || a); n++) if (n >= 1 && n <= SETS) out.add(n);
  }
  return [...out].sort((x, y) => x - y);
}
const sets = parseSets(arg('sets', `1-${SETS}`));
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
console.log(`Kokoro ${VOICE}; sets ${sets[0]}-${sets.at(-1)}; ${kinds.join(', ')}; ${done.size} clips already made. Loading the model...`);
await load('fp16');
let made = 0, redone = 0, failed = 0;
for (const k of kinds) {
  for (const n of sets) {
    for (let i = (n - 1) * SET; i < Math.min(BANK.length, n * SET); i++) {
      const name = `${pad(i)}-${k}`;
      if (done.has(name)) continue;
      const [word, ipa, def, use] = BANK[i];
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
    }
    console.log(`set ${n} (${k}) done; ${made} new so far; ${((Date.now() - t0) / 60000).toFixed(1)} min`);
  }
}
console.log(`Finished: ${made} new clips (${redone} redone at full precision, ${failed} failed) in ${((Date.now() - t0) / 60000).toFixed(1)} min.`);
if (failed) process.exitCode = 1;
