/* The Spelling Bee spellers' voices. A girl speaks in the girl's voices, a boy in the boy's.
   The judge keeps the word lists' own voice (tools/spelling-audio/voice-name.mjs).

   LETTER_VOICES: the letters, recorded ONCE with ElevenLabs by scripts/make-bee-letters.mjs
     into media/spelling-letters/<girl|boy>/. `pitch` is how much higher the site plays them,
     for a child (1.15 is about two and a half semitones up; 1 is the voice as it is). Change
     a pitch here and it changes at once; nothing is recorded again.

   SPELLER_VOICES: the WORDS the speller says (before and after spelling), in Kokoro, recorded
     on GitHub (.github/workflows/spelling-audio.yml, the rows with a `voice:`). Change one
     here AND there. Hear the choices at
     https://cdn.jsdelivr.net/gh/greamses/prep-portal@ead02cc80fa3370f735a9dd2ccd8ea5fdaa7cea0/audition/<voice>.mp3 */
export const LETTER_VOICES = {
  girl: { name: 'Lily', id: 'pFZP5JQG7iQjIQuC4Bku', pitch: 1.18 },
  boy: { name: 'George', id: 'JBFqnCBsd6RMkjVDRZzb', pitch: 1.22 },
};
export const SPELLER_VOICES = { girl: 'bf_lily', boy: 'bm_fable' };
