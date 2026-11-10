/* ============================================================================
   Listening — the browser's speech recognition, as one small reusable piece
   ----------------------------------------------------------------------------
   The same settings PrepBot's chat has always used (prepbot.js): Nigerian
   English, continuous, with interim results, and Android Chrome's habit of
   repeating everything said so far in each result handled.

     const ear = createListener({ onText, onFinal, onState });
     ear.start();          // start listening
     ear.stop();           // stop — onFinal(text) follows with what was heard
     ear.cancel();         // stop and throw away what was heard
     ear.supported         // false where the browser cannot listen

   Two ways to finish: the caller stops it (push-to-talk: let go of the key),
   or `quietMs` of silence after the last words stops it by itself.
   ========================================================================== */

const Recognition = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
const ANDROID = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);

export function createListener({
  lang = "en-NG",
  quietMs = 1700,
  onText = () => {},    // (text) the words so far, as they come
  onFinal = () => {},   // (text) listening has stopped; this is what was said ("" if nothing)
  onState = () => {},   // ("listening" | "idle" | "denied" | "error")
  onError = () => {},   // (code) the browser's reason: "no-speech", "audio-capture", "network", …
} = {}) {
  if (!Recognition) {
    return { supported: false, start() { onState("error"); }, stop() {}, cancel() {}, get listening() { return false; } };
  }
  let rec = null;
  let heard = "";
  let quiet = null;
  let listening = false;
  let cancelled = false;

  function build() {
    const r = new Recognition();
    r.lang = lang;
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      let text = "";
      if (ANDROID) {
        // Android repeats everything heard so far in the newest result
        text = e.results[e.results.length - 1][0].transcript;
      } else {
        for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      }
      heard = text.trim();
      onText(heard);
      clearTimeout(quiet);
      if (quietMs) quiet = setTimeout(() => stop(), quietMs);
    };
    r.onerror = (e) => {
      onError(e.error);
      /* a browser without this accent's model: plain English next time */
      if (e.error === "language-not-supported" && lang !== "en-US") { lang = "en-US"; return; }
      if (e.error === "not-allowed" || e.error === "service-not-allowed") onState("denied");
      else if (e.error !== "no-speech" && e.error !== "aborted") onState("error");
    };
    r.onend = () => {
      clearTimeout(quiet);
      const was = listening;
      listening = false;
      onState("idle");
      if (was && !cancelled) onFinal(heard);
      rec = null;
    };
    return r;
  }

  function start() {
    if (listening) return;
    heard = "";
    cancelled = false;
    rec = build();
    try {
      rec.start();
      listening = true;
      onState("listening");
    } catch {
      onState("error");
    }
  }

  function stop() {
    clearTimeout(quiet);
    if (rec && listening) { try { rec.stop(); } catch {} }
  }

  function cancel() {
    cancelled = true;
    clearTimeout(quiet);
    if (rec) { try { rec.abort(); } catch {} }
  }

  return { supported: true, start, stop, cancel, get listening() { return listening; } };
}
