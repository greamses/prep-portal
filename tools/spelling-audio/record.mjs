// Records the Drills spelling bank with Kokoro, on this computer (free: no API, no credits).
//
//   cd tools/spelling-audio && npm install
//   node record.mjs                       every set; words first, then definitions, then sentences
//   node record.mjs --sets 1-5 --kinds w   just the words of sets 1 to 5
//
// Each clip goes to media/spelling/secondary/<NNNN>-<w|d|s>.mp3 (NNNN = the word's place in
// data/spelling/secondary.js, from 0001), and data/spelling/audio.js is rewritten after every
// set, so the drill uses whatever has been recorded so far and speaks the rest with the
// browser's voice. Stop it any time; run it again and it carries on where it stopped
// (a clip already on disk is never recorded twice).
//
// The words are spoken from the list's own IPA, so a rare word sounds as the list says;
// in a sentence the word keeps that IPA and Kokoro reads the words around it.
//
// THE VOICE. Kokoro has no child voices, so a child is made from an adult one: it speaks a
// little slower, then the pitch is raised by LIFT (resampling), which also brings the speed
// back. Change VOICE / LIFT below and delete media/spelling/secondary to re-record.
import { existsSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load, speak, linePhonemes, mp3 } from './voice.mjs';

const VOICE = process.env.VOICE || 'bf_emma';
const LIFT = Number(process.env.LIFT || 1.15);

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const { SPELLING_SECONDARY: BANK } = await import(new URL('../../data/spelling/secondary.js', import.meta.url));
const OUT = resolve(root, 'media/spelling/secondary');
mkdirSync(OUT, { recursive: true });

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
const fileOf = (i, k) => resolve(OUT, `${pad(i)}-${k}.mp3`);

function writeManifest() {
  const have = { w: [], d: [], s: [] };
  for (const f of readdirSync(OUT)) {
    const m = /^(\d{4})-([wds])\.mp3$/.exec(f);
    if (m) have[m[2]].push(Number(m[1]) - 1);
  }
  for (const k of 'wds') have[k].sort((a, b) => a - b);
  writeFileSync(resolve(root, 'data/spelling/audio.js'),
    `/* Which Kokoro recordings of the spelling bank exist (written by tools/spelling-audio).\n` +
    `   dir: the folder under /media/spelling; w / d / s: bank indexes (0-based) that have a\n` +
    `   word / definition / sentence clip. Anything not listed is spoken with the browser's voice.\n` +
    `   Voice: ${VOICE}, raised x${LIFT}. */\n` +
    `export const CLIPS = { dir: 'secondary', w: new Set(${JSON.stringify(have.w)}), d: new Set(${JSON.stringify(have.d)}), s: new Set(${JSON.stringify(have.s)}) };\n`);
  return have;
}

// A clip that came out (almost) silent or far too short is a bad render: fp16 does that now
// and then. It is redone with the full-precision model, which is slower but steady.
const good = (a, rate) => {
  let peak = 0;
  for (const v of a) peak = Math.max(peak, Math.abs(v));
  return peak > 0.05 && a.length > rate * 0.25;
};
let precise = null;

const t0 = Date.now();
console.log(`Kokoro ${VOICE} x${LIFT}; sets ${sets[0]}-${sets.at(-1)}; ${kinds.join(', ')}. Loading the model...`);
await load('fp16');
let made = 0, redone = 0;
for (const k of kinds) {
  for (const n of sets) {
    for (let i = (n - 1) * SET; i < Math.min(BANK.length, n * SET); i++) {
      const file = fileOf(i, k);
      if (existsSync(file)) continue;
      const [word, ipa, def, use] = BANK[i];
      const phon = k === 'w' ? ipa : k === 'd' ? await linePhonemes(def) : await linePhonemes(use, word, ipa);
      const opts = { voice: VOICE, lift: LIFT, speed: k === 'w' ? 0.85 : 0.95 };
      let clip = await speak(phon, opts);
      if (!good(clip.audio, clip.rate)) {
        if (!precise) { const { load: loadAgain, speak: s2 } = await import('./voice.mjs?precise'); await loadAgain('fp32'); precise = s2; }
        clip = await precise(phon, opts);
        redone++;
      }
      if (!good(clip.audio, clip.rate)) { console.warn(`  could not record ${pad(i)}-${k} (${word})`); continue; }
      writeFileSync(file, mp3(clip.audio, clip.rate, k === 'w' ? 32 : 24));
      made++;
    }
    const have = writeManifest();
    const mins = ((Date.now() - t0) / 60000).toFixed(1);
    console.log(`set ${n} (${k}) done: ${have.w.length} words, ${have.d.length} definitions, ${have.s.length} sentences recorded; ${mins} min`);
  }
}
writeManifest();
console.log(`Finished: ${made} new clips (${redone} redone at full precision) in ${((Date.now() - t0) / 60000).toFixed(1)} min.`);
