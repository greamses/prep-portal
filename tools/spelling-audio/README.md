# Spelling audio (Kokoro)

Records every word, definition and sentence of the Drills spelling bank, and a line giving
its part of speech, language of origin and root, with
[Kokoro](https://huggingface.co/hexgrad/Kokoro-82M), an open speech model. Nothing is paid
for, and **nothing is stored on anyone's computer**:

- **Recording** runs on GitHub's machines (`.github/workflows/spelling-audio.yml`), eight at
  once, each taking five or six sets of twenty words.
- **The clips** are committed to the repo's `spelling-audio` branch, which holds only audio:
  `<list>/<voice>/NNNN-w|d|s|o.mp3` (word, definition, sentence, origin line; `NNNN` = the
  word's place in its list file, from 0001).
- **The site** plays them through jsDelivr (a free CDN for public GitHub repos), with URLs
  pinned to a commit of that branch, so they are cached for a year and never go stale.
  `data/spelling/audio.js` lists which clips exist; anything missing is spoken by the
  browser.
- **Local clones** are set not to fetch that branch:
  `git config --add remote.origin.fetch '^refs/heads/spelling-audio'`.

## Running it

It runs by itself whenever `data/spelling/secondary.js` or the recorder changes. To run it by
hand, use the Actions tab: "Spelling audio" → Run workflow (choose `w`, `d`, `s`, `o` or all).
A clip already on the branch is skipped, so a re-run only records what is missing. When it
finishes it commits the new `audio.js`, and the site needs deploying (`vercel --prod`).

## The voice

`voice-name.mjs`: Kokoro's British `bf_emma`, as she is, with no pitch change and normal
pace. A raised "child" voice was tried and sounded awkward. Changing the voice records
everything again into a new folder (new URLs, nothing stale).

## How it works

- The `o` line is made by `aboutLine()` in `data/spelling/roots.js` ("It is a noun, from Greek.
  The root is rhythmos, meaning flow, beat."), the same function the site uses when a clip is
  missing. Roots are keyed by word, so a word in two lists has one root. Changing a root
  does not re-record its clip by itself: list the clip in `redo.txt` (`secondary/0005-o`).

- A word is spoken from the list's own IPA (espeak style, which is what Kokoro's phonemiser
  makes anyway), so rare words sound as the list says. In its sentence the word keeps that
  IPA, and Kokoro reads the words around it.
- The fp16 model sometimes returns silence. Every clip is checked, and a bad one is redone
  with the full-precision model.
- MP3s are 24 kHz mono, 32 kbps for words and 24 kbps for the rest. The encoder is fed 576
  samples at a time: 1152-sample chunks come out near-silent at 24 kHz.
- The boy's mouth follows each clip's loudness (`exam-archive/national/drills/js/boy.js`).
  The page fetches the clip to measure it, which is why jsDelivr's
  `Access-Control-Allow-Origin: *` matters.
