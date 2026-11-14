// Writes data/spelling/audio.js, the small file the site reads to know which words,
// definitions and sentences have a recording and where to fetch them.
//
//   node manifest.mjs --dir <the spelling-audio branch's voice folder> --sha <branch commit>
//
// The clips are served by jsDelivr straight from the public repo's spelling-audio branch,
// pinned to that commit, so a URL never changes under anyone's cache and a new recording
// gets a new URL. jsDelivr sends the cross-origin header the boy's mouth needs (the page
// fetches each clip to read its loudness).
import { readdirSync, writeFileSync } from 'node:fs';
import { VOICE } from './voice-name.mjs';

const arg = (name) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : null; };
const dir = arg('dir'), sha = arg('sha');
if (!dir || !sha) { console.error('usage: node manifest.mjs --dir <dir> --sha <commit>'); process.exit(2); }

const REPO = process.env.GITHUB_REPOSITORY || 'greamses/prep-portal';
const have = { w: [], d: [], s: [] };
for (const f of readdirSync(dir)) {
  const m = /^(\d{4})-([wds])\.mp3$/.exec(f);
  if (m) have[m[2]].push(Number(m[1]) - 1);
}
for (const k of 'wds') have[k].sort((a, b) => a - b);

writeFileSync(new URL('../../data/spelling/audio.js', import.meta.url),
  `/* Which Kokoro recordings of the spelling bank exist, and where (written by\n` +
  `   tools/spelling-audio/manifest.mjs on GitHub Actions). The clips are not in this branch:\n` +
  `   they live on the repo's spelling-audio branch and are served by jsDelivr, pinned to a\n` +
  `   commit. w / d / s: bank indexes (0-based) with a word / definition / sentence clip.\n` +
  `   Anything not listed is spoken with the browser's voice. Voice: ${VOICE}. */\n` +
  `export const CLIPS = {\n` +
  `  base: 'https://cdn.jsdelivr.net/gh/${REPO}@${sha}/secondary/${VOICE}/',\n` +
  `  w: new Set(${JSON.stringify(have.w)}),\n` +
  `  d: new Set(${JSON.stringify(have.d)}),\n` +
  `  s: new Set(${JSON.stringify(have.s)}),\n` +
  `};\n`);
console.log(`audio.js: ${have.w.length} words, ${have.d.length} definitions, ${have.s.length} sentences @ ${sha.slice(0, 8)}`);
