// Kokoro, run locally (no credits): phonemes in, a child-pitched MP3 out.
import { KokoroTTS } from 'kokoro-js';
import { phonemize } from 'phonemizer';
import { Mp3Encoder } from '@breezystack/lamejs';

let tts = null;
export async function load(dtype = 'fp32') {
  tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype, device: 'cpu' });
  return tts;
}

// kokoro-js's own touch-ups on espeak output, so hand-made IPA matches what it was trained on.
const tidy = (p) => p.replace(/ʲ/g, 'j').replace(/r/g, 'ɹ').replace(/x/g, 'k').replace(/ɬ/g, 'l').replace(/̃/g, '');

/* The primary lists write IPA dictionary-style: syllables split by dots and the
   stress mark at the START of the stressed syllable (/ˈæk.ni/). espeak, which
   Kokoro was trained on, puts the mark just before the syllable's VOWEL
   (/ˈakni/ -> "akn" with the mark on a), uses ɛ for the "e" of bed, and a for
   the "a" of cat. This rewrites the one into the other. */
const V = 'aeiouæɑɒɔəɜɪʊʌɛɐɚɝ';
export function fromDictionary(ipa) {
  let p = ipa.replace(/[()]/g, '').replace(/\s+/g, ' ').trim();
  p = p.replace(new RegExp(`([ˈˌ])([^${V}.ˈˌ ]*)`, 'g'), (m, mark, cons) => cons + mark);
  p = p.replace(/\./g, '');
  p = p.replace(/æ/g, 'a').replace(/e(?![ɪəʊ])/g, 'ɛ');
  return tidy(p);
}

const PUNCT = /(\s*[;:,.!?¡¿—…"«»“”(){}[\]]+\s*)+/g;
async function textPhonemes(text) {
  const out = [];
  let at = 0;
  for (const m of text.matchAll(PUNCT)) {
    if (m.index > at) out.push((await phonemize(text.slice(at, m.index), 'en')).join(' '));
    out.push(m[0]);
    at = m.index + m[0].length;
  }
  if (at < text.length) out.push((await phonemize(text.slice(at), 'en')).join(' '));
  return tidy(out.join(''));
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Phonemes for a line, with `word` (and any form of it, as "beguiled") spoken from the list's IPA. */
export async function linePhonemes(text, word = null, ipa = null) {
  if (!word) return textPhonemes(text);
  const parts = [];
  let at = 0;
  const re = new RegExp(`${escapeRe(word)}([a-z]*)`, 'gi');
  for (const m of text.matchAll(re)) {
    if (m.index > at) parts.push(await textPhonemes(text.slice(at, m.index)));
    // The headword itself is spoken from the list's IPA; a longer form the
    // sentence uses ("beguiled", "chrysanthemums") is left to espeak whole.
    parts.push(m[1] ? tidy((await phonemize(m[0], 'en')).join(' ')) : tidy(ipa));
    at = m.index + m[0].length;
  }
  if (at < text.length) parts.push(await textPhonemes(text.slice(at)));
  return parts.join(' ').replace(/ +/g, ' ').replace(/ ([,.;:!?])/g, '$1').trim();
}

/** Synthesise phonemes; then raise the pitch by `lift` (1.15 = about +2.4 semitones) by resampling.
 *  Speaking at speed/lift first means the lifted clip ends up at `speed`. */
export async function speak(phonemes, { voice = 'bf_emma', speed = 0.9, lift = 1.15 } = {}) {
  const { input_ids } = tts.tokenizer(phonemes, { truncation: true });
  const raw = await tts.generate_from_ids(input_ids, { voice, speed: speed / lift });
  const src = raw.audio;
  const n = Math.floor(src.length / lift);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = i * lift, k = Math.floor(x), f = x - k;
    out[i] = (src[k] || 0) * (1 - f) + (src[k + 1] || 0) * f;
  }
  return { audio: trim(out, raw.sampling_rate), rate: raw.sampling_rate };
}

// Trim near-silence at both ends (keep 60 ms), so a word plays the instant it is tapped.
function trim(a, rate) {
  const th = 0.01, pad = Math.round(rate * 0.06);
  let s = 0, e = a.length - 1;
  while (s < e && Math.abs(a[s]) < th) s++;
  while (e > s && Math.abs(a[e]) < th) e--;
  return a.slice(Math.max(0, s - pad), Math.min(a.length, e + pad));
}

export function mp3(audio, rate, kbps = 32) {
  const enc = new Mp3Encoder(1, rate, kbps);
  const pcm = new Int16Array(audio.length);
  let peak = 0;
  for (const v of audio) peak = Math.max(peak, Math.abs(v));
  const g = peak > 0 ? Math.min(0.95 / peak, 3) : 1;          // even loudness across clips
  for (let i = 0; i < audio.length; i++) pcm[i] = Math.max(-32768, Math.min(32767, audio[i] * g * 32767));
  const chunks = [];
  // One MPEG-2 frame (576 samples) per call: at 24 kHz, 1152-sample calls come
  // out garbled (near-silent) from this encoder. slice: a copy, not a view.
  for (let i = 0; i < pcm.length; i += 576) {
    const b = enc.encodeBuffer(pcm.slice(i, i + 576));
    if (b.length) chunks.push(Buffer.from(b));
  }
  const end = enc.flush(); if (end.length) chunks.push(Buffer.from(end));
  return Buffer.concat(chunks);
}
