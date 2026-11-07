/* ============================================================================
   PrepBoard — the voice
   ----------------------------------------------------------------------------
   One sentence at a time. `prepare(text)` starts fetching a sentence's audio
   at once and hands back a CLIP the scheduler can wait on, time the board by,
   and stop the instant the learner cuts in:

     const clip = voice.prepare("A kicked ball does two things at once.");
     await clip.ready;            // true when the audio is loaded (or we know we'll use the browser)
     clip.duration                // seconds — measured, or estimated until it is
     await clip.play();           // resolves when the sentence has been said (or stopped)
     clip.stop();

   ONE VOICE A LESSON. The PrepBot voice (ElevenLabs, through our own server)
   is chosen once Firebase has said who is signed in; a sentence that fails is
   said silently (caption only) rather than in a different voice, and only a
   voice that keeps failing is given up for the browser's own.
   ========================================================================== */

import { sayMaths } from "/utils/speech-maths.js";

const API_BASE = location.port === "5500" ? "http://127.0.0.1:5000" : "";

/** Roughly how long a sentence takes to say, in seconds. */
export const estimate = (text) => 0.5 + String(text || "").split(/\s+/).filter(Boolean).length * 0.36;

/* The voices the board can speak in (ElevenLabs' default voices; the server
   accepts only these). */
export const VOICES = [
  /* Kokoro: free, our own host (server/routes/tts.js /kokoro) */
  { id: "af_heart", kind: "kokoro", label: "Heart: warm, American" },
  { id: "af_bella", kind: "kokoro", label: "Bella: bright, American" },
  { id: "af_nicole", kind: "kokoro", label: "Nicole: soft, American" },
  { id: "af_sarah", kind: "kokoro", label: "Sarah: clear, American" },
  { id: "am_michael", kind: "kokoro", label: "Michael: calm, American" },
  { id: "am_fenrir", kind: "kokoro", label: "Fenrir: deep, American" },
  { id: "am_puck", kind: "kokoro", label: "Puck: lively, American" },
  { id: "bf_emma", kind: "kokoro", label: "Emma: clear, British" },
  { id: "bf_isabella", kind: "kokoro", label: "Isabella: warm, British" },
  { id: "bm_george", kind: "kokoro", label: "George: steady, British" },
  { id: "bm_fable", kind: "kokoro", label: "Fable: storyteller, British" },
  { id: "bm_lewis", kind: "kokoro", label: "Lewis: deep, British" },
  /* the free voice when there is no Kokoro host: MeloTTS on our Cloudflare worker */
  { id: "melo", kind: "melo", label: "Standard: clear, American" },
  /* ElevenLabs: paid, metered */
  { id: "Xb7hH8MSUJpSbSDYk0k2", label: "Alice: clear, British" },
  { id: "XrExE9yKIg1WjnnlVkGX", label: "Matilda: warm, American" },
  { id: "EXAVITQu4vr4xnSDxMaL", label: "Sarah: soft, American" },
  { id: "cgSgspJ2msm6clMCkdW9", label: "Jessica: bright, American" },
  { id: "pFZP5JQG7iQjIQuC4Bku", label: "Lily: gentle, British" },
  { id: "JBFqnCBsd6RMkjVDRZzb", label: "George: warm, British" },
  { id: "nPczCjzI2devNBz1zQrb", label: "Brian: deep, American" },
  { id: "cjVigY5qzO86Huf0OWal", label: "Eric: friendly, American" },
  { id: "IKne3meq5aSn9XLyUdCD", label: "Charlie: easy-going, Australian" },
  { id: "onwK4e9ZLuTAKqWW03F9", label: "Daniel: calm, British" },
];

VOICES.forEach((v) => { v.kind = v.kind || "eleven"; v.label = (v.kind === "eleven" ? "Premium · " : "Free · ") + v.label; });
const kindOf = (id) => VOICES.find((v) => v.id === id)?.kind || "eleven";

export function createVoice({ auth = null, muted = false, voiceId = VOICES[0].id, onEngine = null } = {}) {
  let engine = null; // which free voice the server has: "kokoro" | "melo"
  let kokoroDown = false; // the free host is not set up (503) or keeps failing: ElevenLabs, then the browser
  let mode = muted ? "silent" : null;      // "eleven" | "browser" | "silent"
  let fails = 0;
  let deciding = null;

  async function decide() {
    if (mode) return mode;
    if (deciding) return deciding;
    deciding = (async () => {
      try {
        if (auth?.authStateReady) await Promise.race([auth.authStateReady(), new Promise((r) => setTimeout(r, 2500))]);
      } catch {}
      mode = auth?.currentUser ? "eleven" : ("speechSynthesis" in window ? "browser" : "silent");
      return mode;
    })();
    return deciding;
  }

  async function fetchEleven(text, signal) {
    const user = auth?.currentUser;
    if (!user) throw new Error("signed out");
    const token = await user.getIdToken();
    /* the free voice when it is chosen and up; the paid one otherwise */
    const free = kindOf(voiceId) !== "eleven" && !kokoroDown;
    const res = await fetch(`${API_BASE}/api/tts/${free ? "kokoro" : "elevenlabs"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(free ? { text, voice: kindOf(voiceId) === "kokoro" ? voiceId : "melo" } : { text, from: "board", voiceId: kindOf(voiceId) === "eleven" ? voiceId : undefined }),
      signal,
    });
    if (!res.ok) {
      const e = new Error("tts " + res.status); e.status = res.status; e.free = free;
      if (free && (res.status === 503 || res.status === 403)) kokoroDown = true;
      throw e;
    }
    const data = await res.json();
    return data.url || (data.audioContent ? `data:audio/mp3;base64,${data.audioContent}` : null);
  }

  function silentClip(text) {
    let timer = null, done = null;
    return {
      kind: "silent",
      duration: estimate(text),
      ready: Promise.resolve(true),
      play() {
        return new Promise((r) => { done = r; timer = setTimeout(r, this.duration * 1000); });
      },
      stop() { clearTimeout(timer); done?.(); },
    };
  }

  function browserClip(text) {
    const spoken = sayMaths(text);
    let done = null, safety = null;
    const clip = {
      kind: "browser",
      duration: estimate(text),
      ready: Promise.resolve(true),
      play() {
        return new Promise((resolve) => {
          done = () => { clearTimeout(safety); done = null; resolve(); };
          try {
            const u = new SpeechSynthesisUtterance(spoken);
            u.lang = "en-GB";
            u.rate = 1;
            u.onend = () => done?.();
            u.onerror = () => done?.();
            speechSynthesis.cancel();
            speechSynthesis.speak(u);
          } catch { /* no speech: the timer still moves the lesson on */ }
          safety = setTimeout(() => done?.(), (clip.duration * 1.6 + 1.5) * 1000);
        });
      },
      stop() { try { speechSynthesis.cancel(); } catch {} done?.(); },
    };
    return clip;
  }

  function elevenClip(text) {
    const ctrl = new AbortController();
    const audio = new Audio();
    audio.preload = "auto";
    let done = null, stopped = false, failed = false;
    const clip = {
      kind: "eleven",
      duration: estimate(text),
      failed: false,
      ready: null,
      play() {
        if (failed || stopped) return silentClip(text).play();
        return new Promise((resolve) => {
          done = () => { done = null; resolve(); };
          audio.onended = () => done?.();
          audio.onerror = () => done?.();
          audio.play().catch(() => {
            /* autoplay blocked or broken: say it silently, the caption carries it */
            setTimeout(() => done?.(), clip.duration * 1000);
          });
        });
      },
      stop() {
        stopped = true;
        ctrl.abort();
        try { audio.pause(); audio.removeAttribute("src"); audio.load(); } catch {}
        done?.();
      },
    };
    clip.ready = (async () => {
      try {
        const src = await fetchEleven(sayMaths(text), ctrl.signal);
        if (!src || stopped) throw new Error("no audio");
        audio.src = src;
        await new Promise((res, rej) => {
          audio.onloadedmetadata = res;
          audio.onerror = rej;
          setTimeout(res, 4000);
        });
        if (Number.isFinite(audio.duration) && audio.duration > 0) clip.duration = audio.duration;
        fails = 0;
        return true;
      } catch (e) {
        if (stopped) return false;
        failed = clip.failed = true;
        /* the free host is missing: the next sentence asks ElevenLabs instead */
        if (e?.free && kokoroDown) return false;
        /* the voice is not ours to use (403), or keeps failing: give it up */
        if (e?.status === 403 || e?.status === 503 || ++fails >= 3) mode = "speechSynthesis" in window ? "browser" : "silent";
        return false;
      }
    })();
    return clip;
  }

  return {
    get mode() { return mode; },
    decide,
    /** Start getting a sentence ready to say. */
    prepare(text) {
      if (mode === "silent" || !text) return silentClip(text);
      if (mode === "browser") return browserClip(text);
      if (mode === "eleven") return elevenClip(text);
      /* not decided yet: decide, then hand over to the chosen kind */
      let inner = null, stopped = false;
      const proxy = {
        kind: "pending",
        duration: estimate(text),
        ready: decide().then(() => {
          if (stopped) return false;
          inner = mode === "eleven" ? elevenClip(text) : mode === "browser" ? browserClip(text) : silentClip(text);
          proxy.kind = inner.kind;
          return inner.ready.then((ok) => { proxy.duration = inner.duration; return ok; });
        }),
        play() { return inner ? inner.play() : silentClip(text).play(); },
        stop() { stopped = true; inner?.stop(); },
      };
      return proxy;
    },
    mute(on) { mode = on ? "silent" : null; deciding = null; },
    /** Speak in another of the board's voices from the next sentence on. */
    setVoice(id) { if (VOICES.some((v) => v.id === id)) { voiceId = id; if (mode === "browser" && auth?.currentUser) { mode = null; deciding = null; fails = 0; } } },
    get voiceId() { return voiceId; },
    get engine() { return engine; },
    /** The server says today's PrepBot-voice allowance is used: the browser's voice from now on. */
    useBrowser() {
      /* the free voice has no daily allowance: only the paid one is given up */
      if (kindOf(voiceId) !== "eleven" && !kokoroDown) return;
      if (mode !== "silent") mode = "speechSynthesis" in window ? "browser" : "silent";
    },
    /** Wake the free voice's host as the page opens (it may be asleep). */
    async wake() {
      try {
        if (auth?.authStateReady) await Promise.race([auth.authStateReady(), new Promise((r) => setTimeout(r, 4000))]);
        const user = auth?.currentUser;
        if (!user) return;
        const r = await fetch(`${API_BASE}/api/tts/kokoro/wake`, { headers: { Authorization: `Bearer ${await user.getIdToken()}` } });
        const j = await r.json().catch(() => ({}));
        if (j.configured === false) kokoroDown = true;
        engine = j.engine || null;
        onEngine?.(engine);
      } catch {}
    },
  };
}
