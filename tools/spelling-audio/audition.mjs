// Records one short Spelling Bee line in many Kokoro voices, so the user can listen and
// choose the boy's and the girl's voices. Run by .github/workflows/spelling-audition.yml;
// the clips go to the spelling-audio branch under audition/ and are heard through jsDelivr.
//
//   node audition.mjs --out <dir>
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

const i = process.argv.indexOf('--out');
const OUT = i > 0 ? process.argv[i + 1] : 'audition';
mkdirSync(OUT, { recursive: true });
await load('fp32');
const phon = await linePhonemes(LINE);
for (const voice of VOICES) {
  const clip = await speak(phon, { voice, lift: 1, speed: 1 });   // each voice as it is
  writeFileSync(resolve(OUT, `${voice}.mp3`), mp3(clip.audio, clip.rate, 32));
  console.log(`${voice}: ${(clip.audio.length / clip.rate).toFixed(1)} s`);
}
