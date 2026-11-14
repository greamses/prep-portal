/* ═══════════════════════════════════════════════════════
   Visemes: the mouth SHAPE for each sound, and when each one is made.

   The user: "The mouth is just moving. Not matching syllable or lips
   positioning." Loudness alone only opens and shuts a mouth. Speech is
   shapes: lips pressed together for m, b and p, the bottom lip under the top
   teeth for f and v, teeth nearly together for s and sh, a wide flat mouth
   for "ee", a round one for "oo" and "o", wide open for "a".

   The boy's mouth is one drawing, so a shape is how far it is opened:
   `sy` (1 = the drawing as made, 0.1 = shut, 1.4 = wider open than drawn).
   Its width never changes.

   WHEN. The recording has no timings, but its loudness does: every syllable
   is a swell of sound. So each vowel (a syllable's core) is pinned to one of
   the clip's loudness peaks, in order, and the consonants are spread through
   the gaps between them. A word's sounds come from its IPA; a definition's or
   sentence's from its spelling (rougher, but still syllable by syllable).
═══════════════════════════════════════════════════════ */

export const SHAPES = {
  // Only how OPEN the mouth is changes: a mouth does not slide or squeeze
  // sideways (the user: "Human mouths don't go sideways"), so every shape keeps
  // the drawn width (sx 1). Open sounds open wider than the drawing (sy > 1:
  // "widen the opening"); shut lips stay shut.
  rest: { sx: 1, sy: 0.12 },   // a closed smile
  A: { sx: 1, sy: 1.4 },       // father, cat, cut: wide open
  O: { sx: 1, sy: 1.15 },      // hot, saw, go
  E: { sx: 1, sy: 0.85 },      // bed, the "uh" of about, bird
  U: { sx: 1, sy: 0.6 },       // boot, put, w: lips forward, a small opening
  C: { sx: 1, sy: 0.55 },      // t, d, n, l, k, g, r, h...
  I: { sx: 1, sy: 0.45 },      // see, sit: teeth close, lips apart
  S: { sx: 1, sy: 0.28 },      // s, z, sh, ch, j, th: teeth nearly together
  F: { sx: 1, sy: 0.2 },       // f, v: bottom lip to the top teeth
  M: { sx: 1, sy: 0.1 },       // m, b, p: lips pressed together
};

/* ── Sounds from IPA (either style: espeak's or the dictionary's) ── */
const IPA_VOWEL = [
  // diphthongs first, so "aɪ" is not read as "a" then "ɪ"
  ['aɪ', ['A', 'I']], ['aʊ', ['A', 'U']], ['eɪ', ['E', 'I']], ['əʊ', ['E', 'U']], ['oʊ', ['O', 'U']],
  ['ɔɪ', ['O', 'I']], ['ɪə', ['I', 'E']], ['eə', ['E', 'E']], ['ʊə', ['U', 'E']],
  ['ɑ', ['A']], ['a', ['A']], ['æ', ['A']], ['ʌ', ['A']], ['ɐ', ['A']],
  ['ɛ', ['E']], ['e', ['E']], ['ə', ['E']], ['ɜ', ['E']], ['ɚ', ['E']], ['ɝ', ['E']],
  ['i', ['I']], ['ɪ', ['I']], ['y', ['I']],
  ['ɒ', ['O']], ['ɔ', ['O']], ['o', ['O']],
  ['u', ['U']], ['ʊ', ['U']],
];
const IPA_CONS = [
  ['tʃ', 'S'], ['dʒ', 'S'], ['ʃ', 'S'], ['ʒ', 'S'], ['s', 'S'], ['z', 'S'], ['θ', 'S'], ['ð', 'S'],
  ['m', 'M'], ['b', 'M'], ['p', 'M'], ['f', 'F'], ['v', 'F'], ['w', 'U'],
];

/** IPA -> a list of units: { v: true, shapes: [...] } for a vowel nucleus, { c: shape } for a consonant. */
export function unitsFromIpa(ipa) {
  const s = String(ipa || '').normalize('NFD').replace(/[̀-ͯ/ˈˌ.ːˑ()\s]/g, '');
  const out = [];
  let i = 0;
  outer: while (i < s.length) {
    for (const [k, shapes] of IPA_VOWEL) {
      if (s.startsWith(k, i)) {
        const last = out[out.length - 1];
        if (last && last.v) last.shapes.push(...shapes); else out.push({ v: true, shapes: [...shapes] });
        i += k.length;
        continue outer;
      }
    }
    for (const [k, shape] of IPA_CONS) {
      if (s.startsWith(k, i)) { out.push({ c: shape }); i += k.length; continue outer; }
    }
    out.push({ c: 'C' });
    i += 1;
  }
  return out;
}

/* ── Sounds from spelling (definitions and sentences) ─────────────── */
const TEXT_VOWEL = [
  ['ee', ['I']], ['ea', ['I']], ['ie', ['I']], ['oo', ['U']], ['ou', ['A', 'U']], ['ow', ['O', 'U']],
  ['oa', ['O', 'U']], ['ai', ['E', 'I']], ['ay', ['E', 'I']], ['oi', ['O', 'I']], ['oy', ['O', 'I']],
  ['au', ['O']], ['aw', ['O']], ['a', ['A']], ['e', ['E']], ['i', ['I']], ['o', ['O']], ['u', ['A']], ['y', ['I']],
];
const TEXT_CONS = [
  ['th', 'S'], ['sh', 'S'], ['ch', 'S'], ['ph', 'F'], ['wh', 'U'], ['ck', 'C'], ['ng', 'C'],
  ['s', 'S'], ['z', 'S'], ['j', 'S'], ['x', 'S'], ['c', 'C'],
  ['m', 'M'], ['b', 'M'], ['p', 'M'], ['f', 'F'], ['v', 'F'], ['w', 'U'],
];
export function unitsFromText(text) {
  const out = [];
  for (let word of String(text || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z]+/)) {
    if (!word) continue;
    if (word.length > 3 && word.endsWith('e') && !/[aeiou]e$/.test(word)) word = word.slice(0, -1);   // a silent e
    let i = 0;
    let afterVowel = false;     // two vowel spellings in a row ("io") glide within one syllable
    outer: while (i < word.length) {
      for (const [k, shapes] of TEXT_VOWEL) {
        if (word.startsWith(k, i)) {
          const last = out[out.length - 1];
          if (afterVowel && last && last.v) last.shapes.push(...shapes);
          else out.push({ v: true, shapes: [...shapes] });
          afterVowel = true;
          i += k.length;
          continue outer;
        }
      }
      afterVowel = false;
      for (const [k, shape] of TEXT_CONS) {
        if (word.startsWith(k, i)) { out.push({ c: shape }); i += k.length; continue outer; }
      }
      if (word[i] !== 'h') out.push({ c: 'C' });   // h barely moves the lips
      i += 1;
    }
    out.push({ c: 'rest' });                           // a breath between words
  }
  return out;
}

/* ── When: pin the vowels to the loudness peaks ───────────────────── */
/**
 * env: the clip's loudness, 0..1, `fps` frames a second. units: as above.
 * Returns an array (one entry per frame) of shape names.
 */
export function track(env, units, fps = 60) {
  const n = env.length;
  const out = new Array(n).fill('rest');
  if (!n || !units.length) return out;
  // where there is voice at all
  let a = 0, b = n - 1;
  while (a < n && env[a] < 0.08) a++;
  while (b > a && env[b] < 0.08) b--;
  if (a >= b) return out;
  // smoothed loudness, and its peaks (a syllable each): at least 90 ms apart
  const sm = Array.from(env, (_, i) => (env[i - 1] ?? env[i]) * 0.25 + env[i] * 0.5 + (env[i + 1] ?? env[i]) * 0.25);
  const gap = Math.round(0.09 * fps);
  let peaks = [];
  for (let i = a + 1; i < b; i++) {
    if (sm[i] >= sm[i - 1] && sm[i] > sm[i + 1] && sm[i] > 0.2) {
      if (peaks.length && i - peaks[peaks.length - 1] < gap) { if (sm[i] > sm[peaks[peaks.length - 1]]) peaks[peaks.length - 1] = i; }
      else peaks.push(i);
    }
  }
  const vowels = units.map((u, k) => (u.v ? k : -1)).filter((k) => k >= 0);
  const V = vowels.length;
  if (!peaks.length) peaks = [Math.round((a + b) / 2)];
  // the k-th of V vowels takes the peak at the same place in the run of peaks;
  // if there are fewer peaks than vowels, evenly spaced times fill in
  const at = vowels.map((_, k) => {
    if (V === 1) return peaks.reduce((x, y) => (sm[y] > sm[x] ? y : x), peaks[0]);
    if (peaks.length >= V) return peaks[Math.round((k * (peaks.length - 1)) / (V - 1))];
    return Math.round(a + ((k + 0.5) / V) * (b - a));
  });
  for (let k = 1; k < at.length; k++) if (at[k] <= at[k - 1]) at[k] = at[k - 1] + 1;
  // key moments: each unit gets a time, consonants spread between their vowels
  const keys = [];
  const timeOf = new Array(units.length);
  vowels.forEach((u, k) => { timeOf[u] = at[k]; });
  const anchors = [[-1, a], ...vowels.map((u, k) => [u, at[k]]), [units.length, b]];
  for (let s = 0; s < anchors.length - 1; s++) {
    const [u0, t0] = anchors[s], [u1, t1] = anchors[s + 1];
    const between = u1 - u0 - 1;
    for (let j = 1; j <= between; j++) timeOf[u0 + j] = Math.round(t0 + ((t1 - t0) * j) / (between + 1));
  }
  units.forEach((u, k) => {
    if (u.v) {
      // a diphthong glides: its first shape at the peak, the rest just after
      u.shapes.forEach((sh, j) => keys.push([timeOf[k] + j * Math.round(0.07 * fps), sh]));
    } else keys.push([timeOf[k], u.c]);
  });
  keys.sort((x, y) => x[0] - y[0]);
  // each frame wears the shape of the nearest key moment
  let ki = 0;
  for (let f = a; f <= b; f++) {
    while (ki + 1 < keys.length && Math.abs(keys[ki + 1][0] - f) <= Math.abs(keys[ki][0] - f)) ki++;
    out[f] = keys[ki][1];
  }
  return out;
}
