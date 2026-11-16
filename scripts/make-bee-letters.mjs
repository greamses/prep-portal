// Records the Spelling Bee spellers' letters, ONCE, with ElevenLabs: every letter by name.
//
//   node --env-file=<a file holding ELEVENLABS_API_KEY> scripts/make-bee-letters.mjs
//       every set in data/spelling/speller-voices.js LETTER_VOICES (girl, boy, ...)
//   ELEVENLABS_API_KEY=... node scripts/make-bee-letters.mjs --set kidgirl --voice <id> [--owner <id>] [--say e=Eee.] [--only e] [--force]
//       one set in one voice; --owner first adds a voice from the shared library to the account
//       (it must be in the account to speak); --say changes what is sent for a letter; --only
//       records just those letters; --force records over files already there.
//
// Files: media/spelling-letters/<set>/NNNN.mp3 (NNNN = the letter's place in
// data/spelling/letters.js, from 0001). A file already there is left alone unless --force.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SPELLING_LETTERS } from '../data/spelling/letters.js';
import { LETTER_VOICES } from '../data/spelling/speller-voices.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : null; };
const all = (name) => process.argv.flatMap((a, i) => (a === `--${name}` ? [process.argv[i + 1]] : []));
/* What is sent for each letter. A capital and a full stop is read as the letter's name, but
   a lone vowel is read as a word ("a" as "uh", "I" as "eye" but short), so the vowels and a
   few others are written out as they sound. */
const SAY = { a: 'Ay.', e: 'Ee.', i: 'Eye.', o: 'Oh.', u: 'You.', w: 'Double-you.', y: 'Why.', z: 'Zed.', h: 'Aitch.',
  ' ': 'Space.', '-': 'Hyphen.', "'": 'Apostrophe.' };
for (const s of all('say')) { const [ch, ...t] = s.split('='); if (ch && t.length) SAY[ch.toLowerCase()] = t.join('='); }
const text = (ch) => SAY[ch] || `${ch.toUpperCase()}.`;
const only = new Set(all('only').flatMap((s) => s.toLowerCase().split(',')));
const force = process.argv.includes('--force');

const key = process.env.ELEVENLABS_API_KEY;
if (!key) { console.error('ELEVENLABS_API_KEY is not set.'); process.exit(1); }

const sets = arg('set') ? { [arg('set')]: { id: arg('voice') } } : Object.fromEntries(Object.entries(LETTER_VOICES).map(([k, v]) => [k, { id: v.id }]));
if (arg('set') && !arg('voice')) { console.error('--set needs --voice <voice_id>.'); process.exit(1); }
// a shared-library voice: add it to the account first (once; ElevenLabs says if it is already there)
if (arg('owner')) {
  const r = await fetch(`https://api.elevenlabs.io/v1/voices/add/${arg('owner')}/${arg('voice')}`, {
    method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ new_name: `Spelling Bee ${arg('set')}` }),
  });
  const body = await r.text().catch(() => '');
  if (r.ok) console.log('added to the account:', body.slice(0, 120));
  else console.log('adding the voice:', r.status, body.slice(0, 160), '(already added is fine)');
}

let made = 0, kept = 0;
for (const [set, v] of Object.entries(sets)) {
  const dir = resolve(root, 'media/spelling-letters', set);
  mkdirSync(dir, { recursive: true });
  for (let i = 0; i < SPELLING_LETTERS.length; i++) {
    const ch = SPELLING_LETTERS[i][0];
    if (only.size && !only.has(ch)) continue;
    const file = resolve(dir, `${String(i + 1).padStart(4, '0')}.mp3`);
    if (existsSync(file) && !force) { kept++; continue; }
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${v.id}?output_format=mp3_44100_64`, {
      method: 'POST',
      headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text: text(ch), model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.6, similarity_boost: 0.8 } }),
    });
    if (!r.ok) { console.error('failed', set, JSON.stringify(ch), r.status, (await r.text().catch(() => '')).slice(0, 160)); process.exitCode = 1; continue; }
    const buf = Buffer.from(await r.arrayBuffer());
    writeFileSync(file, buf);
    made++;
    console.log('recorded', set, JSON.stringify(ch), JSON.stringify(text(ch)), `${Math.round(buf.length / 102.4) / 10} KB`);
  }
}
console.log(`${made} recorded, ${kept} already there.`);
