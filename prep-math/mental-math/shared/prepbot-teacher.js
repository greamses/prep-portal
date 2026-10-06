/* ============================================================================
   Shared PrepBot teaching mascot
   ----------------------------------------------------------------------------
   The narrating "teacher" character used by scripted lesson pages (Mental
   Math × 11, Cartesian Art, …): an avatar with blinking eyes + a talking
   mouth, a speech/thinking bubble that types out narration, a silent "beep"
   rhythm or a real spoken voice, idle bounce/slide/spin impulses between
   lines, and a small hover/tap menu (ask the real site chat / voice toggle /
   sleep / poke). Each page owns its OWN lesson content — what to say and
   when, and what its steps actually animate — this module only owns the
   character itself.

   Expects the page's markup to already contain the `.mm-prepbot` structure
   (bubble + avatar-wrap + avatar — see prepbot-teacher.css) and to import
   that stylesheet. `gsap` is set as a plain property (not a constructor
   requirement) so a page can build the DOM-only parts of the bot (icon,
   menu, hover reveal) immediately, before its own async GSAP import
   resolves — exactly mirroring how times-eleven's scene.js used to boot.
   ========================================================================== */

import {
  ICON_ASK, ICON_SLEEP, ICON_WAKE, ICON_WIGGLE,
  ICON_TALK_MODE, ICON_BEEP_MODE, ICON_PREPBOT, MOUTH_SHAPES,
} from "./icons.js";

// Same pastel set as --pp-note-bg (components.css) — the bubble cycles
// through these so it reads as "multicoloured" rather than a single card.
const BUBBLE_COLORS = ["#fff3a8", "#e8c8ff", "#c8f0c0", "#bfe3ff", "#ffd7a3", "#b8ece2"];

function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

export class PrepbotTeacher {
  /**
   * @param {object} opts
   * @param {HTMLElement} opts.root - the `.mm-prepbot` container
   * @param {HTMLElement} [opts.boundsEl] - container the idle "slide across" impulse
   *   travels within (defaults to root's offsetParent, else document.body)
   * @param {object} [opts.auth] - Firebase auth, for the premium ElevenLabs voice.
   *   Omit to always use the free Web Speech API / silent beep rhythm.
   * @param {object} [opts.menu] - optional menu button elements: { ask, voice, sleep, poke }.
   *   Omit any of them to skip wiring that button (the page's markup just leaves it out).
   */
  constructor({ root, boundsEl, auth, menu = {} } = {}) {
    this.root = root;
    this.boundsEl = boundsEl || root?.offsetParent || document.body;
    this.auth = auth || null;
    this.gsap = null; // set once the page's own async GSAP import resolves

    this.bubble = root?.querySelector(".mm-prepbot-bubble") || null;
    this.text = this.bubble?.querySelector("p, [data-bot-text]") || null;
    this.avatarWrap = root?.querySelector(".mm-prepbot-avatar-wrap") || null;
    this.avatar = root?.querySelector(".mm-prepbot-avatar") || null;
    if (this.avatar) this.avatar.innerHTML = ICON_PREPBOT;
    this.eyes = this.avatar?.querySelectorAll(".mm-bot-eye") || [];
    this.mouth = this.avatar?.querySelector(".mm-bot-mouth") || null;

    this.voiceMode = "beep"; // 'beep' | 'talk'
    this.asleep = false;
    this.isTalking = false;
    this.idleTimer = null;
    this.audioCtx = null;
    this.elevenLabsAvailable = true;
    this.elevenLabsCache = new Map();
    this.typeTimer = null;
    this.rhythmTimer = null;
    this.boundaryFallbackTimer = null;
    this.talkSafetyTimer = null;
    this.mouthTimer = null;
    this.audioEl = null;      // the spoken line that is playing now: only ever one
    this.lineToken = 0;       // every line said (and every stop) makes a new one; a voice that is not the latest is dumb
    this.impulse = null;      // the idle bounce / slide / spin that is running now
    this.narrationToken = 0;
    this.narrationDone = Promise.resolve();
    this.currentTalkPromise = Promise.resolve();
    this.currentTalkResolve = null;
    this._autoColorTick = 0;

    const unlock = () => this._unlockAudio();
    document.addEventListener("pointerdown", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });

    this._wireMenu(menu);
    this._wireAvatarToggle();
    this._wireKeys(menu);
  }

  /* ── audio ─────────────────────────────────────────────────────────────── */
  _unlockAudio() {
    if (!this.audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.audioCtx = new AC();
    }
    this.audioCtx?.resume?.();
  }

  // A short, chirpy blip — not speech, just a rhythmic "talking" beep in the
  // same spirit as old-school dialogue-box games. Pitch wobbles a little per
  // beep so a run of them doesn't sound like a single held tone.
  _beep() {
    const ctx = this.audioCtx;
    if (!ctx || ctx.state !== "running") return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 480 + Math.random() * 160;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.11);
  }

  /* ── body vs. face: body (squeeze-bounce/slide/spin) only plays between
     lines as one-shot idle impulses; face (eyes+mouth) only plays WHILE
     talking, word by word. ──────────────────────────────────────────────── */
  _stopBody() {
    const { gsap, avatar, root } = this;
    if (!gsap) return;
    this.impulse?.kill();
    this.impulse = null;
    if (this.bubble) gsap.set(this.bubble, { opacity: 1 });
    gsap.killTweensOf(avatar);
    gsap.killTweensOf(root);
    gsap.set(avatar, { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 });
    gsap.set(root, { x: 0 });
  }

  // "Bounce like a fluffy ball": squash in anticipation, stretch into a big
  // jump, squash again on landing, then a couple of smaller settling bounces.
  _squeezeBounce() {
    const { gsap, avatar } = this;
    return gsap
      .timeline()
      .to(avatar, { scaleX: 1.25, scaleY: 0.72, duration: 0.12, ease: "power1.out" })
      .to(avatar, { scaleX: 0.82, scaleY: 1.3, y: -22, duration: 0.18, ease: "power2.out" })
      .to(avatar, { scaleX: 1.12, scaleY: 0.9, y: 0, duration: 0.16, ease: "power1.in" })
      .to(avatar, { scaleX: 0.95, scaleY: 1.08, y: -8, duration: 0.13, ease: "power2.out" })
      .to(avatar, { scaleX: 1, scaleY: 1, y: 0, duration: 0.18, ease: "bounce.out" });
  }

  // Walks the whole avatar+bubble group from its home corner to the other
  // side of its bounding container and back.
  _slideAcross() {
    const { gsap, root, boundsEl } = this;
    const travel = -(boundsEl.clientWidth - root.offsetWidth - 14);
    if (travel >= 0) return gsap.timeline(); // container too narrow to bother
    return gsap
      .timeline()
      .to(root, { x: travel, duration: 1.1, ease: "power1.inOut" })
      .to(root, { x: 0, duration: 1.1, ease: "power1.inOut", delay: 0.5 });
  }

  // A quick cartoon spin-hop, mixed in as a rarer third flavour of impulse.
  _spinHop() {
    const { gsap, avatar } = this;
    return gsap
      .timeline()
      .fromTo(avatar, { rotation: 0 }, { rotation: 360, y: -10, duration: 0.5, ease: "back.out(2)" })
      .to(avatar, { y: 0, duration: 0.25 })
      .set(avatar, { rotation: 0 });
  }

  // The bubble reads oddly floating next to a bouncing/sliding character —
  // fade it out before the impulse plays and back in once it's done.
  _runImpulse(fn) {
    const { gsap, bubble } = this;
    const tl = gsap.timeline();
    if (bubble) tl.to(bubble, { opacity: 0, duration: 0.15 });
    tl.add(fn.call(this));
    if (bubble) tl.to(bubble, { opacity: 1, duration: 0.2 });
    return tl;
  }

  _randomImpulse() {
    const impulses = [this._squeezeBounce, this._squeezeBounce, this._slideAcross, this._spinHop];
    return impulses[Math.floor(Math.random() * impulses.length)];
  }

  // Idle scheduler: waits a random beat, and — only if nobody's talking and
  // PrepBot isn't asleep — fires one random impulse, then schedules the next
  // check. Never loops continuously on its own; each impulse is a one-shot.
  scheduleIdle() {
    if (!this.gsap) return; // no GSAP yet — the page will re-call this once it's loaded
    clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      if (this._mayFidget()) this.impulse = this._runImpulse(this._randomImpulse());
      this.scheduleIdle();
    }, 1800 + Math.random() * 2200);
  }

  // One impulse at a time, and none while the page is out of sight. A hidden
  // tab still runs its timers but not its animation frames, so impulses would
  // pile up unplayed and all go off together on coming back — leaving the
  // head squashed, flipped or turned on its side.
  _mayFidget() {
    return !this.isTalking && !this.asleep && !document.hidden && !this.impulse?.isActive();
  }

  stopIdle() { clearTimeout(this.idleTimer); }

  /** Fire one random idle impulse on demand (the "poke"/"wiggle" action). */
  poke() {
    if (!this.gsap || !this._mayFidget()) return;
    this.impulse = this._runImpulse(this._randomImpulse());
  }

  /** Toggle sleep: stops idle impulses and closes the eyes (or resumes both). */
  sleep(on) {
    this.asleep = on;
    if (!this.gsap) return;
    if (on) {
      clearTimeout(this.idleTimer);
      this.gsap.killTweensOf(this.avatar);
      this.gsap.killTweensOf(this.root);
      this.gsap.set(this.avatar, { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 });
      this.gsap.set(this.root, { x: 0 });
      if (this.eyes.length) this.gsap.set(this.eyes, { scaleY: 0.15 });
    } else {
      if (this.eyes.length) this.gsap.set(this.eyes, { scaleY: 1 });
      this.scheduleIdle();
    }
  }

  // A quick blink every few beats, shared by all three "talking" paths.
  _maybeBlink(counter) {
    if (this.gsap && this.eyes.length && counter % 5 === 0) {
      this.gsap.to(this.eyes, { scaleY: 0.15, duration: 0.06, yoyo: true, repeat: 1 });
    }
  }

  /* ── voice ─────────────────────────────────────────────────────────────── */
  // Tries the premium ElevenLabs voice (server-side proxy, login-gated —
  // see server/routes/tts.js) and returns a data: URL, or null on any
  // failure (no auth wired up, not logged in, key unset, network error,
  // etc.) so the caller falls back to the free Web Speech API.
  async _tryElevenLabs(text) {
    if (!this.elevenLabsAvailable || !this.auth) return null;
    if (this.elevenLabsCache.has(text)) return this.elevenLabsCache.get(text);
    const user = this.auth.currentUser;
    if (!user) return null;
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/tts/elevenlabs", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        this.elevenLabsAvailable = false; // persistent server-side verdict for this session
        return null;
      }
      const data = await res.json();
      const url = data.url
        ? data.url
        : data.audioContent
          ? `data:audio/mp3;base64,${data.audioContent}`
          : null;
      if (url) this.elevenLabsCache.set(text, url); // never re-fetch this line this session
      return url;
    } catch {
      return null; // transient (network) — leave the endpoint enabled to retry
    }
  }

  // "Talk" mode: actually speak the line aloud. Prefers ElevenLabs (nicer
  // voice); falls back to the browser's built-in Web Speech API (audible
  // this time, unlike the silent timing-only use of it in beep mode).
  async _talkAloud(text, finish, { typeTo, typeOver, alive }) {
    const total = text.length;
    const wordCount = Math.max(1, text.trim().split(/\s+/).length);
    const dataUrl = await this._tryElevenLabs(text);
    if (!alive()) return;      // the learner has moved on while the voice was being fetched: say nothing
    if (dataUrl) {
      let shapeCursor = 0;
      let beatCount = 0;
      const audioEl = new Audio(dataUrl);
      this.audioEl = audioEl;
      audioEl.addEventListener("loadedmetadata", () => {
        if (!alive()) return;
        const stepMs = Math.max(90, (audioEl.duration * 1000) / (wordCount * 2));
        this.mouthTimer = setInterval(() => {
          beatCount += 1;
          shapeCursor = 1 + (shapeCursor % (MOUTH_SHAPES.length - 1));
          this.mouth?.setAttribute("d", MOUTH_SHAPES[shapeCursor]);
          this._maybeBlink(beatCount);
        }, stepMs);
        /* the words are written as far as the voice has got */
        clearInterval(this.typeTimer);
        this.typeTimer = setInterval(() => typeTo(total * (audioEl.currentTime / (audioEl.duration || 1)) + 2), 40);
      });
      const done = () => { if (!alive()) return; clearInterval(this.mouthTimer); finish(); };
      audioEl.addEventListener("ended", done);
      audioEl.addEventListener("error", done);
      audioEl.play().catch(done);
      return;
    }

    if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
      const utter = new SpeechSynthesisUtterance(text);
      let shapeCursor = 0;
      let beatCount = 0;
      let gotBoundary = false;
      utter.onboundary = (e) => {
        if (!alive()) return;
        gotBoundary = true;
        beatCount += 1;
        shapeCursor = 1 + (shapeCursor % (MOUTH_SHAPES.length - 1));
        this.mouth?.setAttribute("d", MOUTH_SHAPES[shapeCursor]);
        this._maybeBlink(beatCount);
        /* the word being said is written as it is said */
        const end = text.indexOf(" ", (e.charIndex || 0) + 1);
        typeTo(end < 0 ? total : end);
      };
      utter.onend = finish;
      utter.onerror = finish;
      speechSynthesis.speak(utter);
      /* a voice that reports no word boundaries: write at a reading pace instead */
      this.boundaryFallbackTimer = setTimeout(() => { if (alive() && !gotBoundary) typeOver(wordCount * 380); }, 700);
      this.talkSafetyTimer = setTimeout(finish, wordCount * 500 + 1500);
    } else {
      typeOver(wordCount * 300);
      finish();
    }
  }

  // "Beep" mode (default): the mouth/beep rhythm is timed by *silently*
  // invoking the Web Speech API (volume 0) and reacting to its per-word
  // boundary events — an estimate of how long the line would take to say,
  // without it actually reading out. Falls back to a fixed ~2-beats/word
  // rhythm if boundary events aren't supported (common on some voices).
  _beepRhythm(text, finish, { typeOver }) {
    const wordCount = Math.max(1, text.trim().split(/\s+/).length);
    const estMs = wordCount * 380 + 300;
    typeOver(estMs - 150);      // the words are written at the pace the beeps "say" them
    const startedAt = Date.now();
    let shapeCursor = 0;
    let beatCount = 0;
    const beat = () => {
      beatCount += 1;
      shapeCursor = 1 + (shapeCursor % (MOUTH_SHAPES.length - 1));
      this.mouth?.setAttribute("d", MOUTH_SHAPES[shapeCursor]);
      this._beep();
      this._maybeBlink(beatCount);
    };

    // A muted utterance has no audio to actually render, so some browsers
    // race through it and fire onboundary/onend far faster than a real
    // reading pace would — never let that rush the line along. Treat estMs
    // as a floor as well as a ceiling.
    const finishNoEarlierThanEstimate = () => {
      const remaining = estMs - (Date.now() - startedAt);
      if (remaining > 0) this.talkSafetyTimer = setTimeout(finish, remaining);
      else finish();
    };

    let gotBoundary = false;
    if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
      const utter = new SpeechSynthesisUtterance(text);
      utter.volume = 0; // timing only — beeps are the only audible thing
      utter.onboundary = () => { gotBoundary = true; beat(); };
      utter.onend = finishNoEarlierThanEstimate;
      utter.onerror = finishNoEarlierThanEstimate;
      speechSynthesis.speak(utter);
    }

    this.boundaryFallbackTimer = setTimeout(() => {
      if (gotBoundary) return;
      let count = 0;
      const beats = wordCount * 2;
      this.rhythmTimer = setInterval(() => {
        count += 1;
        beat();
        if (count >= beats) {
          clearInterval(this.rhythmTimer);
          finish();
        }
      }, 195);
    }, 350);

    this.talkSafetyTimer = setTimeout(finish, estMs + 500);
  }

  // One clock: the bubble TEXT is written at the pace the line is SAID —
  // as far as the recorded voice has played, word by word as the browser's
  // voice reports them, or evenly over the beeps. The line counts as "done"
  // once the voice has finished (the text is then all there).
  _speakLine(text) {
    this.isTalking = true;
    this._stopBody();
    this._silence();
    const mine = ++this.lineToken;
    const alive = () => mine === this.lineToken;
    this.currentTalkResolve?.();
    this.currentTalkPromise = new Promise((resolve) => { this.currentTalkResolve = resolve; });

    if (this.text) this.text.textContent = "";
    this.mouth?.setAttribute("d", MOUTH_SHAPES[0]);

    const total = text.length;
    let shown = 0;
    let finished = false;
    const finish = () => {
      if (finished || !alive()) return;
      finished = true;
      clearInterval(this.typeTimer);
      clearInterval(this.rhythmTimer);
      clearInterval(this.mouthTimer);
      clearTimeout(this.boundaryFallbackTimer);
      clearTimeout(this.talkSafetyTimer);
      if (this.text) this.text.textContent = text;
      this.mouth?.setAttribute("d", MOUTH_SHAPES[0]);
      this.isTalking = false;
      this.currentTalkResolve?.();
    };
    /** the text is written as far as its n-th character (never taken back) */
    const typeTo = (n) => {
      if (!alive() || finished) return;
      const to = Math.max(shown, Math.min(total, Math.round(n)));
      if (to === shown) return;
      shown = to;
      if (this.text) this.text.textContent = text.slice(0, to);
    };
    /** the rest of the text is written evenly over `ms` */
    const typeOver = (ms) => {
      clearInterval(this.typeTimer);
      const from = shown, t0 = performance.now();
      this.typeTimer = setInterval(() => typeTo(from + (total - from) * Math.min(1, (performance.now() - t0) / Math.max(1, ms))), 30);
    };

    const tools = { typeTo, typeOver, alive };
    if (this.voiceMode === "talk") this._talkAloud(text, finish, tools);
    else this._beepRhythm(text, finish, tools);
  }

  // Every sound and every clock of the line being said is stopped: the
  // recorded voice (an <audio> the browser would otherwise play to its end,
  // over the top of the next one), the browser's own voice, and the timers.
  _silence() {
    clearInterval(this.typeTimer);
    clearInterval(this.rhythmTimer);
    clearInterval(this.mouthTimer);
    clearTimeout(this.boundaryFallbackTimer);
    clearTimeout(this.talkSafetyTimer);
    if (this.audioEl) { try { this.audioEl.pause(); this.audioEl.removeAttribute("src"); this.audioEl.load?.(); } catch { /* already gone */ } this.audioEl = null; }
    if (window.speechSynthesis) speechSynthesis.cancel();
  }

  _speakLineAsync(text) {
    this._speakLine(text);
    return this.currentTalkPromise;
  }

  /** Narrate one or more bubbles in sequence: a plain string, or an array of
   *  {text, mode} ("speech" | "thinking"). Resolves once every line has
   *  finished. A fresh call supersedes any still-running sequence, so stale
   *  bubbles stop cleanly (e.g. the learner stepped on before PrepBot
   *  finished). `colorSeed` (optional) pins the per-line bubble colour cycle
   *  to a caller-tracked index (e.g. a lesson step number) instead of the
   *  teacher's own running tally. */
  speak(lines, { colorSeed } = {}) {
    const list = Array.isArray(lines) ? lines : [{ text: lines, mode: "speech" }];
    const token = ++this.narrationToken;
    let resolveDone;
    this.narrationDone = new Promise((r) => { resolveDone = r; });
    (async () => {
      for (let j = 0; j < list.length; j++) {
        if (token !== this.narrationToken) break;
        const line = list[j];
        const seed = colorSeed !== undefined ? colorSeed : this._autoColorTick++;
        if (this.bubble) {
          this.bubble.style.setProperty("--bubble-bg", BUBBLE_COLORS[(seed + j) % BUBBLE_COLORS.length]);
          this.bubble.classList.toggle("mm-prepbot-bubble--speech", line.mode !== "thinking");
          this.bubble.classList.toggle("mm-prepbot-bubble--thinking", line.mode === "thinking");
        }
        await this._speakLineAsync(line.text);
        if (token !== this.narrationToken) break;
        if (j < list.length - 1) await delay(220);
      }
      resolveDone();
    })();
    return this.narrationDone;
  }

  /** Cancel any in-flight narration immediately (does not resolve the
   *  in-flight speak() promise — start a fresh speak() call instead). */
  stop() {
    this.narrationToken++;
    this.lineToken++;
    this._silence();
    this.mouth?.setAttribute("d", MOUTH_SHAPES[0]);
    this.isTalking = false;
  }

  show() { this.bubble?.classList.remove("mm-prepbot-bubble--hidden"); }
  hide() { this.bubble?.classList.add("mm-prepbot-bubble--hidden"); }

  /* ── menu ──────────────────────────────────────────────────────────────── */
  // Bare-glyph hover menu: "Ask" opens the site's real, AI-backed PrepBot
  // chat (utils/prepbot/prepbot.js) — the bubble/thinking narration above is
  // scripted and free, only this button ever reaches the model. "Voice"
  // toggles beep vs talk. "Sleep" stops idle impulses. "Poke"/"Wiggle" fires
  // one impulse on demand.
  _wireMenu({ ask, voice, sleep, poke } = {}) {
    if (ask) {
      ask.innerHTML = ICON_ASK;
      ask.addEventListener("click", () => {
        document.getElementById("chat-fab")?.click();
        // The site chat's mic button (utils/prepbot/prepbot.js) already has
        // full speech-recognition → auto-send wiring — no need to duplicate
        // that pipeline here. It stays disabled for a beat after the chat
        // first opens, so poll briefly rather than assuming it's enabled.
        const start = Date.now();
        (function waitForMic() {
          const micBtn = document.getElementById("chat-mic");
          if (micBtn && !micBtn.disabled) { micBtn.click(); return; }
          if (Date.now() - start > 3000) return; // give up quietly — chat is still open either way
          setTimeout(waitForMic, 80);
        })();
      });
    }
    if (voice) {
      voice.innerHTML = ICON_TALK_MODE;
      voice.title = "Switch to talking voice (V)";
      voice.addEventListener("click", () => {
        this.voiceMode = this.voiceMode === "beep" ? "talk" : "beep";
        voice.innerHTML = this.voiceMode === "beep" ? ICON_TALK_MODE : ICON_BEEP_MODE;
        voice.title = `${this.voiceMode === "beep" ? "Switch to talking voice" : "Switch to beeps"} (V)`;
        /* the page says the line again in the new voice, if it knows how; else the old one is cut short */
        if (this.onVoiceChange) this.onVoiceChange(); else if (window.speechSynthesis) speechSynthesis.cancel();
      });
    }
    if (sleep) {
      sleep.innerHTML = ICON_SLEEP;
      sleep.addEventListener("click", () => {
        this.sleep(!this.asleep);
        sleep.title = `${this.asleep ? "Wake" : "Sleep"} (S)`;
        sleep.innerHTML = this.asleep ? ICON_WAKE : ICON_SLEEP;
      });
    }
    if (poke) {
      poke.innerHTML = ICON_WIGGLE;
      poke.addEventListener("click", () => this.poke());
    }
  }

  /* ── keyboard shortcuts for the menu ──────────────────────────────────────
     A ask · V voice · S sleep / wake · W wiggle. Each presses the menu's own
     button, so a key does exactly what a tap does. Only while this PrepBot is
     on the screen, never while something is being typed, and never with Ctrl,
     Alt or the Cmd key held (those belong to the browser). */
  _wireKeys({ ask, voice, sleep, poke } = {}) {
    const KEYS = { a: ask, v: voice, s: sleep, w: poke };
    const NAMES = { a: "A", v: "V", s: "S", w: "W" };
    Object.entries(KEYS).forEach(([k, b]) => {
      if (!b) return;
      if (b.title && !/\([A-Z]\)$/.test(b.title)) b.title = `${b.title} (${NAMES[k]})`;
      b.setAttribute("aria-keyshortcuts", NAMES[k]);
    });
    this._onKey = (e) => {
      if (e.ctrlKey || e.altKey || e.metaKey || e.repeat) return;
      const b = KEYS[(e.key || "").toLowerCase()];
      if (!b || !this.root?.isConnected || !this.root.offsetParent) return;
      const t = e.target;
      if (t?.closest?.("input, textarea, select, [contenteditable=''], [contenteditable='true']")) return;
      e.preventDefault();
      b.click();
    };
    document.addEventListener("keydown", this._onKey);
  }

  // Interacting with PrepBot (hover, or tap on touch) reveals its icon menu —
  // hide the speech bubble while that's showing so the two don't fight for
  // the same corner. A tap toggles the menu "pinned" open (works without hover).
  _wireAvatarToggle() {
    const { avatarWrap, avatar } = this;
    if (!avatarWrap || !avatar) return;
    avatarWrap.addEventListener("mouseenter", () => this.hide());
    avatarWrap.addEventListener("mouseleave", () => {
      if (!avatarWrap.classList.contains("is-menu-open")) this.show();
    });
    avatar.addEventListener("click", () => {
      const open = avatarWrap.classList.toggle("is-menu-open");
      if (open) this.hide(); else this.show();
    });
  }

  destroy() {
    if (this._onKey) document.removeEventListener("keydown", this._onKey);
    this.stop();
    this.stopIdle();
    this._stopBody();
  }
}
