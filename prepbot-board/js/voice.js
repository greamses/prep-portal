/* ============================================================================
   PrepBot Board — the voice
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

export function createVoice({ auth = null, muted = false } = {}) {
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
    const res = await fetch(`${API_BASE}/api/tts/elevenlabs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text, from: "board" }),
      signal,
    });
    if (!res.ok) { const e = new Error("tts " + res.status); e.status = res.status; throw e; }
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
        /* the voice is not ours to use (403), or keeps failing: give it up */
        if (e?.status === 403 || e?.status === 503 || ++fails >= 2) mode = "speechSynthesis" in window ? "browser" : "silent";
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
    /** The server says today's PrepBot-voice allowance is used: the browser's voice from now on. */
    useBrowser() { if (mode !== "silent") mode = "speechSynthesis" in window ? "browser" : "silent"; },
  };
}
