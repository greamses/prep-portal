// Records the Spelling Bee spellers' letters, ONCE, with ElevenLabs: every letter by name, in
// a girl's voice and a boy's (data/spelling/speller-voices.js LETTER_VOICES). The site plays
// them pitched up for a child (the same file's `pitch`), so the pitch can be tuned without
// recording again. 29 letters x 2 voices: a few hundred characters of credit.
//
//   node --env-file=<a file holding ELEVENLABS_API_KEY> scripts/make-bee-letters.mjs
//
// Files: media/spelling-letters/<girl|boy>/NNNN.mp3 (NNNN = the letter's place in
// data/spelling/letters.js, from 0001). A file already there is left alone; delete it to
// record it again.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SPELLING_LETTERS } from '../data/spelling/letters.js';
import { LETTER_VOICES } from '../data/spelling/speller-voices.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
/* What is sent for each letter. A capital and a full stop is read as the letter's name, but
   a lone vowel is read as a word ("a" as "uh", "I" as "eye" but short), so the vowels and a
   few others are written out as they sound. */
const SAY = { a: 'Ay.', e: 'Ee.', i: 'Eye.', o: 'Oh.', u: 'You.', w: 'Double-you.', y: 'Why.', z: 'Zed.', h: 'Aitch.',
  ' ': 'Space.', '-': 'Hyphen.', "'": 'Apostrophe.' };
const text = (ch) => SAY[ch] || `${ch.toUpperCase()}.`;

const key = process.env.ELEVENLABS_API_KEY;
if (!key) { console.error('ELEVENLABS_API_KEY is not set.'); process.exit(1); }
let made = 0, kept = 0;
for (const [who, v] of Object.entries(LETTER_VOICES)) {
  const dir = resolve(root, 'media/spelling-letters', who);
  mkdirSync(dir, { recursive: true });
  for (let i = 0; i < SPELLING_LETTERS.length; i++) {
    const ch = SPELLING_LETTERS[i][0];
    const file = resolve(dir, `${String(i + 1).padStart(4, '0')}.mp3`);
    if (existsSync(file)) { kept++; continue; }
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${v.id}?output_format=mp3_44100_64`, {
      method: 'POST',
      headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text: text(ch), model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.6, similarity_boost: 0.8 } }),
    });
    if (!r.ok) { console.error('failed', who, JSON.stringify(ch), r.status, (await r.text().catch(() => '')).slice(0, 160)); process.exitCode = 1; continue; }
    const buf = Buffer.from(await r.arrayBuffer());
    writeFileSync(file, buf);
    made++;
    console.log('recorded', who, JSON.stringify(ch), `${Math.round(buf.length / 102.4) / 10} KB`);
  }
}
console.log(`${made} recorded, ${kept} already there.`);
