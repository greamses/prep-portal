/* ============================================================================
   The exam's spoken warnings
   ----------------------------------------------------------------------------
   Eight fixed warnings, recorded ONCE with ElevenLabs (scripts/make-exam-warnings.mjs) and saved as static
   files in /tts-cache. This only plays those files. ElevenLabs is never called while a student sits an exam,
   so a hundred students and a thousand warnings cost nothing after the one recording.

       const voice = createVoice();
       voice.preload();               // when the exam begins: eight small files, so a warning never waits on the network
       voice.say("no_face");          // plays that recording (or, if it is not there, says the same words in the browser's voice)

   A warning is never repeated within 15 seconds, and never talks over another one.
   ========================================================================== */

import { WARNINGS } from "/data/exam-warnings.js";

const SAME_KEY_MS = 15000;     // the same warning is not repeated inside this
const ANY_KEY_MS = 3500;       // and no two warnings run into each other

export function createVoice({ warnings = WARNINGS } = {}) {
  const clips = new Map();     // key -> { audio, broken }
  const last = new Map();      // key -> when it was last said
  let lastAny = 0;
  let playing = null;

  function clip(key) {
    if (clips.has(key)) return clips.get(key);
    const w = warnings[key];
    if (!w || typeof Audio === "undefined") { const c = { audio: null, broken: true }; clips.set(key, c); return c; }
    const c = { audio: new Audio(), broken: false };
    c.audio.preload = "auto";
    c.audio.addEventListener("error", () => { c.broken = true; });     // not recorded yet: the browser's voice says it instead
    c.audio.src = w.url;
    clips.set(key, c);
    return c;
  }

  /** The browser's own voice, for a warning whose recording is not there (yet). */
  function speak(text) {
    try {
      if (!("speechSynthesis" in window)) return false;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en"; u.rate = 0.95;
      speechSynthesis.speak(u);
      return true;
    } catch { return false; }
  }

  return {
    /** Fetch every recording now. */
    preload() { Object.keys(warnings).forEach(clip); },
    /**
     * Say a warning. → "recording", "browser", "throttled" or "none" (so callers and tests can tell).
     * `force` skips the repeat guard (a test run, or a warning that must always be heard).
     */
    say(key, { force = false } = {}) {
      const w = warnings[key];
      if (!w) return "none";
      const now = Date.now();
      if (!force && (now - (last.get(key) || 0) < SAME_KEY_MS || now - lastAny < ANY_KEY_MS)) return "throttled";
      last.set(key, now); lastAny = now;
      try { speechSynthesis.cancel(); } catch { /* none to stop */ }
      if (playing) { try { playing.pause(); } catch { /* already stopped */ } playing = null; }
      const c = clip(key);
      if (c.audio && !c.broken) {
        try {
          c.audio.currentTime = 0;
          const p = c.audio.play();
          playing = c.audio;
          if (p && p.catch) p.catch(() => { c.broken = true; speak(w.text); });
          return "recording";
        } catch { c.broken = true; }
      }
      return speak(w.text) ? "browser" : "none";
    },
    keys: () => Object.keys(warnings),
  };
}

/** Which warning to give for the nth time a student has left the exam page: a plain one, then a second, then the final. */
export const leaveWarning = (n) => (n <= 1 ? "left_page" : n === 2 ? "second_warning" : "final_warning");
