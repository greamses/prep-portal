// Writes data/spelling/audio.js, the small file the site reads to know which words,
// definitions and sentences of each list have a recording, and where to fetch them.
//
//   node manifest.mjs --root <the spelling-audio branch's checkout> --sha <its commit>
//
// The clips are served by jsDelivr straight from the public repo's spelling-audio branch
// (<list>/<voice>/NNNN-w|d|s.mp3), pinned to that commit, so a URL never changes under
// anyone's cache and a new recording gets a new URL. jsDelivr sends the cross-origin header
// the boy's mouth needs (the page fetches each clip to read its loudness).
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { VOICE } from './voice-name.mjs';

const arg = (name) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : null; };
const root = arg('root'), sha = arg('sha');
if (!root || !sha) { console.error('usage: node manifest.mjs --root <dir> --sha <commit>'); process.exit(2); }
const REPO = process.env.GITHUB_REPOSITORY || 'greamses/prep-portal';

const lists = {};
for (const bank of ['secondary', 'upper', 'lower', 'phrases']) {
  const dir = join(root, bank, VOICE);
  const have = { w: [], d: [], s: [], o: [] };
  if (existsSync(dir)) {
    for (const f of readdirSync(dir)) {
      const m = /^(\d{4})-([wdso])\.mp3$/.exec(f);
      if (m) have[m[2]].push(Number(m[1]) - 1);
    }
  }
  for (const k of 'wdso') have[k].sort((a, b) => a - b);
  const any = have.w.length + have.d.length + have.s.length + have.o.length;
  lists[bank] = `  ${bank}: {\n    base: '${any ? `https://raw.githubusercontent.com/${REPO}/${sha}/${bank}/${VOICE}/` : ''}',\n` +
    `    w: new Set(${JSON.stringify(have.w)}),\n    d: new Set(${JSON.stringify(have.d)}),\n    s: new Set(${JSON.stringify(have.s)}),\n` +
    `    o: new Set(${JSON.stringify(have.o)}),\n  },\n`;
  console.log(`${bank}: ${have.w.length} words, ${have.d.length} definitions, ${have.s.length} sentences, ${have.o.length} origin lines`);
}

// Served straight from GitHub (raw.githubusercontent.com: audio/mpeg, Access-Control-Allow-
// Origin *, pinned to the commit), NOT jsDelivr: jsDelivr refuses any file of a repo version
// over 50 MB, and the spelling-audio branch passed that with the spellers' 3,418 clips.
// The Spelling Bee's spellers: in each speller voice, which words (w) of each list, and
// which letters, are recorded.
const { SPELLER_VOICES } = await import(new URL('../../data/spelling/speller-voices.js', import.meta.url));
let spellers = '';
// every voice with recorded letters (the spellers' and the judge's), so the hall's settings can
// offer any of them
const lettered = existsSync(join(root, 'letters')) ? readdirSync(join(root, 'letters')) : [];
for (const voice of [...new Set([...Object.values(SPELLER_VOICES), ...lettered])]) {
  let banks = '';
  for (const bank of ['secondary', 'upper', 'lower', 'letters']) {
    const dir = join(root, bank, voice);
    const w = existsSync(dir) ? readdirSync(dir).map((f) => /^(\d{4})-w\.mp3$/.exec(f)).filter(Boolean).map((m) => Number(m[1]) - 1).sort((a, b) => a - b) : [];
    banks += `    ${bank}: { base: '${w.length ? `https://raw.githubusercontent.com/${REPO}/${sha}/${bank}/${voice}/` : ''}', w: new Set(${JSON.stringify(w)}) },\n`;
    console.log(`speller ${voice} ${bank}: ${w.length}`);
  }
  spellers += `  ${voice}: {\n${banks}  },\n`;
}

writeFileSync(new URL('../../data/spelling/audio.js', import.meta.url),
  `/* Which Kokoro recordings of each spelling list exist, and where (written by\n` +
  `   tools/spelling-audio/manifest.mjs on GitHub Actions). The clips are not in this branch:\n` +
  `   they live on the repo's spelling-audio branch and are served by jsDelivr, pinned to a\n` +
  `   commit. Per list: w / d / s / o = entry indexes (0-based) with a word / definition /\n` +
  `   sentence / part-of-speech-origin-and-root clip. Anything not listed is spoken with the browser's voice. Voice: ${VOICE}. */\n` +
  `export const CLIPS = {\n${lists.secondary}${lists.upper}${lists.lower}${lists.phrases}};\n` +
  `/* The Spelling Bee's spellers, by voice (data/spelling/speller-voices.js): per list, the\n` +
  `   words recorded (w); and the letters by name (data/spelling/letters.js). */\n` +
  `export const SPELLER_CLIPS = {\n${spellers}};\n`);
console.log(`audio.js written @ ${sha.slice(0, 8)}`);
