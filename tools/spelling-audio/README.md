# Spelling audio (Kokoro)

Records every word, definition and sentence of the Drills spelling bank with
[Kokoro](https://huggingface.co/hexgrad/Kokoro-82M), an open speech model that
runs on this computer. Nothing is paid for and nothing is sent anywhere.

```sh
cd tools/spelling-audio
npm install
node record.mjs                        # everything: words, then definitions, then sentences
node record.mjs --sets 1-5 --kinds w   # only the words of sets 1 to 5
VOICE=bf_lily LIFT=1.12 node record.mjs
```

- Clips go to `media/spelling/secondary/NNNN-w|d|s.mp3` (`NNNN` = the word's place in
  `data/spelling/secondary.js`, from 0001). `data/spelling/audio.js` is rewritten after
  every set, so the drill plays what exists and uses the browser's voice for the rest.
- Stop it any time. Running it again carries on: a clip already on disk is skipped.
  To change the voice, delete `media/spelling/secondary` and record again.
- **Time:** on a 4-core Celeron, a word takes about 7 s and a sentence about 17 s. The
  words alone take about 1.5 hours; everything takes about 8 to 9 hours. Run it
  overnight, words first (the default order).
- **A child's voice:** Kokoro has none, so an adult voice speaks a little slower and is
  then raised in pitch by `LIFT` (1.15 is about 2.4 semitones). That brings the speed
  back to normal and makes the voice sound young.
- **Pronunciation:** a word is spoken from the list's own IPA (espeak style, which is
  what Kokoro's phonemiser makes anyway). In its sentence the word keeps that IPA, and
  Kokoro reads the words around it.
- The fp16 model sometimes returns silence. Every clip is checked, and a bad one is
  redone with the full-precision model.
- MP3s are 24 kHz mono, 32 kbps for words and 24 kbps for the rest. The encoder is fed
  576 samples at a time: 1152-sample chunks come out near-silent at 24 kHz.

The boy's mouth follows each clip's loudness (`exam-archive/national/drills/js/boy.js`),
so the recordings need nothing else to lip-sync.
