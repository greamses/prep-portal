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
  girl: { name: 'Lily', id: 'pFZP5JQG7iQjIQuC4Bku', pitch: 1 },
  boy: { name: 'George', id: 'JBFqnCBsd6RMkjVDRZzb', pitch: 1 },
  // children's voices (chosen by the user, 2026-11-15): the small boy, and two girls
  kidboy: { name: 'Boy (child)', id: 'atemG3csutMIyK7AbS5c', pitch: 1 },
  kidgirl: { name: 'Girl 1 (child)', id: 'IR4Yywb88oVWHqzWLjAs', pitch: 1 },
  kidgirl2: { name: 'Girl 2 (child)', id: 'hpp4J3VqNfWAUOO0d1Us', pitch: 1 },
};
/* Mr. Whitmore, the judge who announces the champion: his lines are recorded once in this voice
   (media/spelling-judge/: champion-is, name-<kid>, you-<kid>). */
export const JUDGE_VOICE = { name: 'Mr. Whitmore', id: 'CwhRBWXzGAHq8TQ4Fs17' };
export const SPELLER_VOICES = { girl: 'af_heart', boy: 'bm_fable' };
/* Children's voices for the ElevenLabs letters: the small boy (Leo, kid "boy") and the girls.
   Recorded with scripts/make-bee-letters.mjs --set <name> into media/spelling-letters/<name>/;
   until a set is on the site, those spellers keep the girl's or boy's set above. Add the
   voice's id to LETTER_VOICES (same name) too, so a letter changed on the ABC chart can be said
   live in it. */
export const KID_LETTER_SET = { boy: 'kidboy', girl: 'kidgirl', girl2: 'kidgirl', girl3: 'kidgirl2' };
