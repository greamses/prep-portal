# tts-cache — static ElevenLabs audio cache

Stopgap store (until Google Cloud Storage is set up) for PrepBot's narration
audio on `prep-math/mental-math`.

- Files are `<sha1(voiceId|text)>.mp3`, written by `server/routes/tts.js` when
  a line is synthesised on a **writable** filesystem (e.g. running the server
  locally). They are served statically from the repo root at
  `/tts-cache/<hash>.mp3`, and bundled into the API function via
  `vercel.json → functions.includeFiles` so the route can detect a hit and
  return the static URL (no ElevenLabs call, nothing billed).
- **Production is read-only**, so it will not create new files here — generate
  the library by running the server locally in Talk mode (or a script) and
  **commit the `.mp3`s**. Once committed and deployed, those lines are free
  forever.
- Safe to delete any `.mp3` here; it will just be re-synthesised (and billed)
  the next time that exact line is requested.
