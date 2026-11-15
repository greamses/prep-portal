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
  lists[bank] = `  ${bank}: {\n    base: '${any ? `https://cdn.jsdelivr.net/gh/${REPO}@${sha}/${bank}/${VOICE}/` : ''}',\n` +
    `    w: new Set(${JSON.stringify(have.w)}),\n    d: new Set(${JSON.stringify(have.d)}),\n    s: new Set(${JSON.stringify(have.s)}),\n` +
    `    o: new Set(${JSON.stringify(have.o)}),\n  },\n`;
  console.log(`${bank}: ${have.w.length} words, ${have.d.length} definitions, ${have.s.length} sentences, ${have.o.length} origin lines`);
}

writeFileSync(new URL('../../data/spelling/audio.js', import.meta.url),
  `/* Which Kokoro recordings of each spelling list exist, and where (written by\n` +
  `   tools/spelling-audio/manifest.mjs on GitHub Actions). The clips are not in this branch:\n` +
  `   they live on the repo's spelling-audio branch and are served by jsDelivr, pinned to a\n` +
  `   commit. Per list: w / d / s / o = entry indexes (0-based) with a word / definition /\n` +
  `   sentence / part-of-speech-origin-and-root clip. Anything not listed is spoken with the browser's voice. Voice: ${VOICE}. */\n` +
  `export const CLIPS = {\n${lists.secondary}${lists.upper}${lists.lower}${lists.phrases}};\n`);
console.log(`audio.js written @ ${sha.slice(0, 8)}`);
