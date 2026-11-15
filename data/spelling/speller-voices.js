/* The Kokoro voices the Spelling Bee's spellers speak in (letters, and the word when they
   are done). A girl speaks in GIRL, a boy in BOY. The judge keeps the lists' own voice
   (tools/spelling-audio/voice-name.mjs).

   To change one: change it here AND in the matrix of .github/workflows/spelling-audio.yml
   (the rows with a `voice:`), push, and the new voice is recorded beside the old. Hear the
   choices at https://cdn.jsdelivr.net/gh/greamses/prep-portal@ead02cc80fa3370f735a9dd2ccd8ea5fdaa7cea0/audition/<voice>.mp3 */
export const SPELLER_VOICES = { girl: 'bf_lily', boy: 'bm_fable' };
