/* ============================================================================
   FILM FX — sound effects and screen transitions for PrepBot's films
   ----------------------------------------------------------------------------
     sfx(name, delaySeconds)      play one effect (made by the browser, no files)
     SFX                          the names: pop, tick, draw, strike, snip, flip,
                                  whoosh, ding, warn, chalk
     transition(stage, kind, gsap) a screen change: wipe, slide, fade, iris, page
     TRANSITIONS                  the kinds
     setSfx(on) / sfxOn()         the learner's switch (remembered on this device)

   The hand that draws (film-kit.js `hand`) calls sfx itself, so every film
   built with the kit is heard as it is drawn: a bar growing is a pencil, a
   number landing is a soft pop, a cancel is a pen stroke. A film step asks for
   a screen change with `push(say, { transition: "wipe" })`.

   Every sound is quiet and short: they are there to make the drawing feel
   made by hand, never to talk over PrepBot.
   ========================================================================== */

let ctx = null;
let master = null;
const KEY = "pp-film-sfx";

export function sfxOn() {
  try { return localStorage.getItem(KEY) !== "off"; } catch { return true; }
}
export function setSfx(on) {
  try { localStorage.setItem(KEY, on ? "on" : "off"); } catch { /* private mode */ }
}

function audio() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

/* a short burst of noise, the raw stuff of pencils, pens and whooshes */
let noiseBuf = null;
function noise(a) {
  if (!noiseBuf) {
    noiseBuf = a.createBuffer(1, a.sampleRate * 1.2, a.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const s = a.createBufferSource();
  s.buffer = noiseBuf;
  return s;
}

function env(a, t, peak, attack, release) {
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
  return g;
}

function tone(a, t, { f0, f1 = f0, type = "sine", peak = 0.5, attack = 0.005, release = 0.12 }) {
  const o = a.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + attack + release);
  const g = env(a, t, peak, attack, release);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + attack + release + 0.05);
}

function hiss(a, t, { dur = 0.2, from = 2000, to = from, q = 1.2, peak = 0.4, attack = 0.01, type = "bandpass", wobble = 0 }) {
  const s = noise(a);
  const f = a.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(from, t);
  f.frequency.exponentialRampToValueAtTime(Math.max(40, to), t + dur);
  const g = env(a, t, peak, attack, Math.max(0.02, dur - attack));
  s.connect(f).connect(g);
  if (wobble) {
    /* a pencil does not hiss evenly: it scratches */
    const lfo = a.createOscillator();
    const depth = a.createGain();
    lfo.frequency.value = wobble;
    depth.gain.value = peak * 0.6;
    lfo.connect(depth).connect(g.gain);
    lfo.start(t);
    lfo.stop(t + dur + 0.05);
  }
  g.connect(master);
  s.start(t, Math.random() * 0.5);
  s.stop(t + dur + 0.05);
}

const MAKERS = {
  /* a number or a tile landing */
  pop: (a, t) => tone(a, t, { f0: 520, f1: 880, peak: 0.35, release: 0.09 }),
  /* a figure being written */
  tick: (a, t) => hiss(a, t, { dur: 0.04, from: 4500, type: "highpass", peak: 0.35 }),
  /* a pencil drawing a line or a bar */
  draw: (a, t) => hiss(a, t, { dur: 0.45, from: 2600, to: 3400, q: 0.9, peak: 0.18, wobble: 22 }),
  /* chalk on a board, for a longer stroke */
  chalk: (a, t) => hiss(a, t, { dur: 0.6, from: 1800, to: 2600, q: 0.7, peak: 0.2, wobble: 14 }),
  /* a pen striking a figure out */
  strike: (a, t) => hiss(a, t, { dur: 0.16, from: 3200, to: 1800, q: 1.4, peak: 0.32 }),
  /* a cut through a bar */
  snip: (a, t) => { hiss(a, t, { dur: 0.05, from: 5200, type: "highpass", peak: 0.4 }); hiss(a, t + 0.07, { dur: 0.05, from: 4200, type: "highpass", peak: 0.3 }); },
  /* a figure turning over */
  flip: (a, t) => hiss(a, t, { dur: 0.18, from: 900, to: 2400, q: 0.8, peak: 0.25 }),
  /* the screen changing */
  whoosh: (a, t) => hiss(a, t, { dur: 0.55, from: 300, to: 2600, q: 0.6, peak: 0.3, attack: 0.12 }),
  /* right: the answer checks out */
  ding: (a, t) => { tone(a, t, { f0: 880, peak: 0.3, release: 0.9 }); tone(a, t + 0.09, { f0: 1320, peak: 0.22, release: 0.9 }); },
  /* careful: the trap */
  warn: (a, t) => { tone(a, t, { f0: 196, type: "triangle", peak: 0.3, release: 0.16 }); tone(a, t + 0.2, { f0: 165, type: "triangle", peak: 0.3, release: 0.22 }); },
};
export const SFX = Object.keys(MAKERS);

/** Play one effect, `delay` seconds from now. Quiet, short, and never an error. */
export function sfx(name, delay = 0) {
  if (!sfxOn() || !MAKERS[name]) return;
  try {
    const a = audio();
    if (!a) return;
    MAKERS[name](a, a.currentTime + Math.max(0, delay));
  } catch { /* no sound is better than a broken lesson */ }
}

/* ── screen transitions ───────────────────────────────────────────────────
   The new picture is already on the stage when a step begins; a transition
   is a sheet of the screen's own paper that covers it and then leaves, in
   one of five manners. */
const PAPER = "var(--vm-paper, #fffdf8)";
const SHEET = (stage) => {
  const host = stage.querySelector(".vm-tv") || stage;
  const d = document.createElement("div");
  d.className = "vm-transition";
  d.style.cssText = `position:absolute;inset:0;z-index:50;pointer-events:none;background:${PAPER};`;
  host.appendChild(d);
  return d;
};
const WAYS = {
  wipe: (g, d) => g.fromTo(d, { xPercent: 0 }, { xPercent: 101, duration: 0.7, ease: "power2.inOut" }),
  slide: (g, d) => g.fromTo(d, { yPercent: 0 }, { yPercent: -101, duration: 0.7, ease: "power3.inOut" }),
  fade: (g, d) => g.fromTo(d, { opacity: 1 }, { opacity: 0, duration: 0.6, ease: "power1.out" }),
  iris: (g, d) => {
    d.style.setProperty("--r", "0%");
    d.style.webkitMaskImage = d.style.maskImage = "radial-gradient(circle at 50% 50%, transparent var(--r), #000 calc(var(--r) + 0.5%))";
    return g.fromTo(d, { "--r": "0%" }, { "--r": "75%", duration: 0.8, ease: "power2.in" });
  },
  page: (g, d) => {
    d.parentElement.style.perspective = "1400px";
    d.style.transformOrigin = "0% 50%";
    d.style.boxShadow = "8px 0 18px rgba(0,0,0,.12)";
    return g.fromTo(d, { rotationY: 0 }, { rotationY: -100, duration: 0.85, ease: "power2.in" });
  },
};
export const TRANSITIONS = Object.keys(WAYS);

/** Change the screen in one of the TRANSITIONS. Without gsap (or replaying a step instantly) nothing happens. */
export function transition(stage, kind = "wipe", gsap = null) {
  if (!stage || !gsap || !WAYS[kind]) return;
  const d = SHEET(stage);
  sfx("whoosh", 0.02);
  const tw = WAYS[kind](gsap, d);
  const done = () => d.remove();
  if (tw && typeof tw.eventCallback === "function") tw.eventCallback("onComplete", done);
  else setTimeout(done, 1000);
}
