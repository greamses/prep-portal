// Records short Spelling Bee lines for the user to judge by ear. Run by
// .github/workflows/spelling-audition.yml; the clips go to the spelling-audio branch under
// audition/ and are heard through jsDelivr.
//
//   node audition.mjs --out <dir>            the TAKES below (one letter said several ways)
//   node audition.mjs --out <dir> --voices   "B. I. R. D. Bird." in every candidate voice
import { load, speak, linePhonemes, mp3 } from './voice.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const VOICES = [
  'af_heart', 'af_bella', 'af_nicole', 'af_sky', 'af_nova', 'af_jessica',
  'bf_lily', 'bf_isabella', 'bf_alice',
  'am_puck', 'am_liam', 'am_echo', 'am_adam', 'am_michael',
  'bm_lewis', 'bm_fable', 'bm_daniel', 'bm_george',
];
// what a speller says at the microphone: the letters, then the word
const LINE = 'B. I. R. D. Bird.';

// 2026-11-15: the boy's voice (bm_fable) says the letter E so it sounds like "es". Several
// ways of giving it the same sound "ee", to choose from by ear (audition/e-boy-<n>.mp3).
const TAKES = [
  { name: 'e-boy-1', voice: 'bm_fable', phon: 'ˈiː.' },        // what it is recorded from now
  { name: 'e-boy-2', voice: 'bm_fable', phon: 'ˈiː' },         // no full stop
  { name: 'e-boy-3', voice: 'bm_fable', phon: 'ˈiːː.' },       // the vowel held longer
  { name: 'e-boy-4', voice: 'bm_fable', phon: 'ˈiː!' },        // said brightly
  { name: 'e-boy-5', voice: 'bm_fable', phon: 'ʔˈiː.' },       // a clean start (a glottal stop)
  { name: 'e-boy-6', voice: 'bm_fable', text: 'The letter E.' },// in a phrase, for comparison
];

const i = process.argv.indexOf('--out');
const OUT = i > 0 ? process.argv[i + 1] : 'audition';
mkdirSync(OUT, { recursive: true });
await load('fp32');
if (process.argv.includes('--voices')) {
  const phon = await linePhonemes(LINE);
  for (const voice of VOICES) {
    const clip = await speak(phon, { voice, lift: 1, speed: 1 });   // each voice as it is
    writeFileSync(resolve(OUT, `${voice}.mp3`), mp3(clip.audio, clip.rate, 32));
    console.log(`${voice}: ${(clip.audio.length / clip.rate).toFixed(1)} s`);
  }
} else {
  for (const t of TAKES) {
    const phon = t.phon || await linePhonemes(t.text);
    const clip = await speak(phon, { voice: t.voice, lift: 1, speed: 1 });   // the voice as it is
    writeFileSync(resolve(OUT, `${t.name}.mp3`), mp3(clip.audio, clip.rate, 32));
    console.log(`${t.name} (${phon}): ${(clip.audio.length / clip.rate).toFixed(2)} s`);
  }
}
