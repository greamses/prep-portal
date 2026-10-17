/* ============================================================================
   PrepBot's TV — the set a lesson is shown on
   ----------------------------------------------------------------------------
   PrepBot the teacher never explains from thin air: it stands INSIDE a TV,
   and what it is talking about is animated on the screen beside it. This is
   that set, for any page that wants a lesson and has no page of its own to
   put it on (the × 11 lesson page carries the same set in its own markup;
   both are dressed by prepbot-tv.css).

       const tv = await openTv({
         title: "Squares ending in 5",
         build(stage) { … },              // put the lesson's pieces on the screen
         steps: [{ say, show(stage, { gsap, instant }) }, …],
       });

   A STEP is one line PrepBot says and what the screen does while it says it.
   `show` must be repeatable: to go back, the stage is rebuilt and every step
   up to the one wanted is shown again instantly (`instant: true`), then the
   wanted one is animated. So a step only ever ADDS to what the ones before
   it left.

   The set has its own controls — back, play / pause, on, full screen — and a
   close button. Play runs the steps one after another, waiting for PrepBot to
   finish each line. PrepBot is the shared teacher (prepbot-teacher.js); its
   Ask button opens the site's real chat.
   ========================================================================== */

import { PrepbotTeacher } from "./prepbot-teacher.js";
import { ICON_PREPBOT } from "./icons.js";
/* the same mark the games ask to be turned sideways with */
import { SVG_ROTATE } from "/utils/components/game-viewport.js";
import { ICON_PLAY, ICON_PAUSE, ICON_PREV, ICON_NEXT, ICON_FULLSCREEN, ICON_CLOSE } from "./icons.js";
import { UI } from "/utils/components/ui-icons.js";

const css = (href) => {
  if ([...document.styleSheets].some((s) => s.href && s.href.endsWith(href.split("/").pop()))) return;
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
};

let open = null;      // the set that is up now: one at a time

/**
 * HOW EVERY LESSON ENDS — once, here, for every film on the site.
 *
 * A lesson that finishes with "and that is the method" leaves the child
 * nowhere to go. So the last word of every film sends them somewhere to do it
 * themselves, with the address on the screen to read as well as hear. It is
 * added to the steps rather than written into each scene, because there are
 * five modules that open this set and the line should not be copied five
 * times — nor be missing from the sixth.
 *
 * It rides along to the printed sheet too (lesson-sheet.js walks the same
 * steps), which is the one place a child keeps after the TV goes off.
 */
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const SITE = "prepportal.com.ng";
const outroStep = () => ({
  say: "And that is the whole of it. Now, watching me do one is not the same as doing one — "
    + `you know that. So go to ${SITE} and have a go yourself. There are more of these lessons `
    + "there, and the exercises that go with every one of them, so you can practise this until it "
    + "is the easy bit. That is how it stops being something you watched and starts being "
    + "something you can do. And if this one helped: like it, share it with somebody in your "
    + "class who is stuck on the same thing, and subscribe so the next lesson finds you.",
  show(stage) {
    /* the stage is rebuilt for every step, so this simply adds itself again */
    const card = document.createElement("div");
    card.className = "mm-tv-outro";
    card.innerHTML = `<p class="mm-tv-outro__lead">Practise this yourself at</p>`
      + `<p class="mm-tv-outro__url">${SITE}</p>`
      + `<p class="mm-tv-outro__foot">More lessons, and the exercises to go with them</p>`
      /* THE THREE, each arriving on its own. They are asked for out loud in
         the words above, so they are on the screen to be read as well as
         heard — and a child who is going to do one of them is deciding
         while this card is up. */
      + `<ul class="mm-tv-asks">`
      /* the icons are drawn to a size, like every other one on the site */
      + [["like", UI.heartFill(22), "Like it"], ["share", UI.share(22), "Share it"],
        ["sub", UI.starOn(22), "Subscribe"]]
        .map(([k, icon, word], i) => `<li class="mm-tv-ask mm-tv-ask--${k}"`
          + ` style="animation-delay:${(0.5 + i * 0.45).toFixed(2)}s">`
          + `<span class="mm-tv-ask__mark">${icon}</span><span>${word}</span></li>`).join("")
      + `</ul>`;
    stage.appendChild(card);
  },
});

/**
 * THE TITLE CARD, and it is added here for the same reason the outro is.
 *
 * Every one of these films belongs to the same set, and a child who has
 * watched one should know what they are looking at the moment the next one
 * starts. The card names the set and then the lesson, in that order, and the
 * words arrive one after another rather than being there already — the whole
 * set opens the way it teaches.
 *
 * Like the outro, it is added to the steps rather than written into each
 * scene, because six modules open this set and the card should not be copied
 * six times nor be missing from the seventh.
 */
const introStep = (title) => ({
  /* it opens the film and is gone: not replayed under the steps after it */
  once: true,
  say: `Learning with PrepBot.${title ? ` Today: ${title}.` : ""} Have something to write with `
    + "next to you, because the bit at the end is for you to do.",
  show(stage) {
    const card = document.createElement("div");
    card.className = "mm-tv-intro";
    /* EVERY LETTER COMES IN BY ITSELF, which is what makes this an opening
       rather than a slide: the words assemble in front of the child, and
       PrepBot is standing there while they do it. A letter is its own span
       with its own delay — the only way to stagger letters in CSS — and a
       space is kept as a span of its own so the word does not close up. */
    const letters = (word, from, step) => [...word]
      .map((ch, i) => `<span class="mm-tv-intro__ch" style="animation-delay:${(from + i * step).toFixed(2)}s">`
        + `${ch === " " ? "&nbsp;" : esc(ch)}</span>`).join("");
    card.innerHTML = `<span class="mm-tv-intro__bot">${ICON_PREPBOT}</span>`
      + `<p class="mm-tv-intro__lead">${letters("Learning with", 0.5, 0.045)}</p>`
      + `<p class="mm-tv-intro__name">${letters("PrepBot", 1.1, 0.085)}</p>`
      + (title ? `<p class="mm-tv-intro__title">${esc(title)}</p>` : "");
    stage.appendChild(card);
  },
});

export async function openTv({ title = "", build = () => {}, steps: told = [] } = {}) {
  const steps = told.length ? [introStep(title), ...told, outroStep()] : told;
  open?.close();
  css("/prep-math/mental-math/shared/prepbot-teacher.css");
  css("/prep-math/mental-math/shared/prepbot-tv.css");

  const box = document.createElement("div");
  box.className = "mm-tv-overlay";
  /* A FILM IS 16:9 AND IT IS WATCHED SIDEWAYS.
     Asked for in as many words: *"Videos should not be watch is portrait
     mode, users must rotate screen to watch videos, also stick with 16:9."*
     Squeezed into the width of an upright phone the stage is 16:9 of very
     little — the bars come out a few millimetres deep and the working beside
     them is unreadable, which is worse than not playing at all. So in
     portrait the set is put away and this stands in its place, and the
     lesson is paused rather than talking to nobody. */
  const turnCard = `<div class="mm-tv-turn" data-tv="turn">`
    + `<div class="mm-tv-turn__card">${SVG_ROTATE}`
    + `<p>Turn your phone sideways</p>`
    + `<span>These lessons play in landscape, so that the drawing is big enough to read</span>`
    + `</div></div>`;
  box.innerHTML = turnCard +
    `<div class="mm-tv-col" role="dialog" aria-modal="true" aria-label="${title.replace(/"/g, "&quot;")}">` +
    `<div class="mm-tv">` +
    `<div class="mm-tv-screen">` +
    `<span class="mm-tv-step-sticker pp-sticky pp-sticky--tape pp-sticky--c0" data-tv="progress">Ready</span>` +
    `<div class="mm-tv-inner" data-tv="stage"></div>` +
    `<div class="mm-tv-curtain" data-tv="curtain" aria-hidden="true"><div class="mm-tv-curtain-panel mm-tv-curtain-panel--left"></div><div class="mm-tv-curtain-panel mm-tv-curtain-panel--right"></div></div>` +
    `<div class="mm-prepbot">` +
    `<div class="mm-prepbot-bubble mm-prepbot-bubble--speech" aria-hidden="true"><p></p></div>` +
    `<div class="mm-prepbot-avatar-wrap"><div class="mm-prepbot-menu">` +
    `<button class="mm-prepbot-menu-btn" data-b="ask" type="button" title="Ask PrepBot a question" aria-label="Ask PrepBot a question"></button>` +
    `<button class="mm-prepbot-menu-btn" data-b="voice" type="button" title="Mute or speak" aria-label="Mute PrepBot, or let it speak"></button>` +
    `<button class="mm-prepbot-menu-btn" data-b="sleep" type="button" title="Sleep" aria-label="Sleep PrepBot"></button>` +
    `<button class="mm-prepbot-menu-btn" data-b="poke" type="button" title="Wiggle" aria-label="Wiggle PrepBot"></button>` +
    `</div><div class="mm-prepbot-avatar" aria-hidden="true"></div></div></div>` +
    `</div>` +
    `<div class="mm-tv-panel"><span class="mm-tv-light" aria-hidden="true"></span><span class="mm-tv-title">${title}</span>` +
    `<div class="mm-tv-btns">` +
    `<button class="mm-tv-btn" data-tv="prev" type="button" aria-label="Previous step" title="Previous step (Left arrow)" aria-keyshortcuts="ArrowLeft">${ICON_PREV}</button>` +
    `<button class="mm-tv-btn mm-tv-btn--play" data-tv="play" type="button" aria-label="Play or pause" title="Play or pause (Space)" aria-keyshortcuts="Space"><span>${ICON_PAUSE}</span></button>` +
    `<button class="mm-tv-btn" data-tv="next" type="button" aria-label="Next step" title="Next step (Right arrow)" aria-keyshortcuts="ArrowRight">${ICON_NEXT}</button>` +
    `</div>` +
    `<button class="mm-tv-btn" data-tv="save" type="button" aria-label="Download this explanation" title="Download this explanation (D)" aria-keyshortcuts="D">${UI.download(22)}</button>` +
    `<button class="mm-tv-btn" data-tv="full" type="button" aria-label="Fullscreen" title="Full screen (F)" aria-keyshortcuts="F">${ICON_FULLSCREEN}</button>` +
    `<button class="mm-tv-btn" data-tv="close" type="button" aria-label="Turn the TV off" title="Turn the TV off (Esc)" aria-keyshortcuts="Escape">${ICON_CLOSE}</button>` +
    `</div></div>` +
    `<div class="mm-tv-stand" aria-hidden="true"><div class="mm-tv-stand-neck"></div><div class="mm-tv-stand-base"></div></div>` +
    `</div>`;
  document.body.appendChild(box);

  const q = (k) => box.querySelector(`[data-tv="${k}"]`);
  const b = (k) => box.querySelector(`[data-b="${k}"]`);
  const tv = box.querySelector(".mm-tv");
  const screen = box.querySelector(".mm-tv-screen");
  const stage = q("stage"), progress = q("progress"), curtain = q("curtain");
  const bot = box.querySelector(".mm-prepbot");
  /* not on stage until the curtain goes up */
  bot.style.opacity = "0";
  const playIcon = q("play").querySelector("span");

  let auth = null;
  try { auth = (await import("/firebase-init.js")).auth || null; } catch { /* the free voice */ }
  const teacher = new PrepbotTeacher({ root: box.querySelector(".mm-prepbot"), boundsEl: screen, auth, menu: { ask: b("ask"), voice: b("voice"), sleep: b("sleep"), poke: b("poke") } });
  /* the voice changed in the middle of a line: say the step again in the new one */
  teacher.onVoiceChange = () => { if (!closed && index >= 0) go(index); };
  let gsap = null;
  try {
    const m = await import("https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm");
    gsap = m.default || m.gsap || m;
    teacher.gsap = gsap;
  } catch { /* no animation library: every step simply appears */ }

  let index = -1;       // the step on the screen; -1 before the first
  /* THE SET WAITS TO BE TURNED ON. It used to start talking the moment the
     curtain opened, which gives nobody time to read the first picture or to
     turn the sound down — and a lesson that begins before you asked for it is
     one you have already missed the start of. Press play. */
  let playing = false;
  let token = 0;        // every move makes a new one, and a narration that is not the latest stops driving
  let closed = false;

  const paintControls = () => {
    playIcon.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
    q("prev").disabled = index <= 0;
    q("next").disabled = index >= steps.length - 1;
    progress.textContent = index < 0 ? "Ready" : `Step ${index + 1} of ${steps.length}`;
  };

  /**
   * Put step i on the screen: everything before it at once, itself animated,
   * and said.
   *
   * `speak` is false for exactly one call — the one that puts the set up. The
   * first picture is drawn and the controls are painted, but PrepBot does not
   * open its mouth until the learner has pressed play.
   */
  async function go(i, speak = true) {
    if (closed || !steps.length) return;
    const mine = ++token;
    teacher.stop();
    index = Math.max(0, Math.min(steps.length - 1, i));
    stage.innerHTML = "";
    build(stage);
    /* A STEP MARKED `once` IS NOT REPLAYED. Every step rebuilds the screen by
       running the ones before it instantly, which is right for a drawing that
       is added to — a bar, then its number, then its brace. A title card is
       not that: it is a picture that belongs to its own step, and replayed
       it lands on top of every step after it and hides the lesson. */
    for (let k = 0; k < index; k++) {
      if (!steps[k].once) steps[k].show?.(stage, { gsap, instant: true });
    }
    steps[index].show?.(stage, { gsap, instant: !gsap });
    paintControls();
    teacher.show();
    if (!speak) return;
    teacher.speak([{ text: steps[index].say, mode: "speech" }], { colorSeed: index });
    try { await teacher.narrationDone; } catch { /* stopped */ }
    if (mine !== token || closed || !playing) return;
    if (index >= steps.length - 1) { playing = false; paintControls(); return; }
    /* THINKING TIME. A step that hands the work over says `hold`, and the
       film waits that many seconds before going on — counted down on the
       screen, so the child can see how long they have got rather than
       feeling hurried by a teacher who has already stopped talking. It waits
       AFTER the narration, because a countdown running under PrepBot's voice
       is not time to think. */
    if (steps[index].hold) {
      const left = await think(steps[index].hold, mine);
      if (!left) return;
    }
    await new Promise((r) => setTimeout(r, 450));
    if (mine === token && !closed && playing) go(index + 1);
  }

  /**
   * The seconds a step gives the learner before it answers itself, counted
   * where they can see them. Pressing pause, stepping on, or closing the set
   * ends it: it returns false, and the caller stops rather than carrying on
   * into a step nobody asked for.
   */
  async function think(secs, mine) {
    const pad = document.createElement("div");
    pad.className = "mm-tv-count";
    pad.innerHTML = `<span class="mm-tv-count__n"></span><span class="mm-tv-count__say">your turn</span>`;
    stage.appendChild(pad);
    const n = pad.firstChild;
    for (let left = secs; left > 0; left -= 1) {
      n.textContent = String(left);
      /* restarted on every tick, so each number comes in on its own */
      n.style.animation = "none";
      void n.offsetWidth;
      n.style.animation = "";
      await new Promise((r) => setTimeout(r, 1000));
      if (mine !== token || closed || !playing) { pad.remove(); return false; }
    }
    pad.remove();
    return true;
  }

  /* Out of sight, out of hearing: when the learner leaves the page (another
     tab, another app, the phone locked) the lesson stops talking and PrepBot
     stops fidgeting; back again, a lesson that was playing takes its step up
     from the start. */
  let awayPlaying = false;
  const onVisible = () => {
    if (closed) return;
    if (document.hidden) {
      awayPlaying = playing && index >= 0;
      playing = false;
      token++;
      teacher.stop();
      teacher.stopIdle();
      paintControls();
    } else {
      teacher.scheduleIdle();
      if (awayPlaying) { awayPlaying = false; playing = true; go(index); }
    }
  };
  document.addEventListener("visibilitychange", onVisible);

  /* Turned upright mid-lesson, it stops where it is; turned back, it takes
     that step up again from the start — the same manners as leaving the page
     and coming back to it. */
  const upright = window.matchMedia("(orientation: portrait) and (max-width: 900px)");
  let turnedPlaying = false;
  const onTurn = () => {
    if (closed) return;
    const wrong = upright.matches;
    box.classList.toggle("mm-tv-sideways", wrong);
    if (wrong) {
      turnedPlaying = playing && index >= 0;
      playing = false;
      token++;
      teacher.stop();
      teacher.stopIdle();
      paintControls();
    } else if (turnedPlaying) {
      turnedPlaying = false;
      playing = true;
      go(index);
    }
  };
  upright.addEventListener?.("change", onTurn);
  onTurn();
  window.addEventListener("pagehide", close);

  function close() {
    if (closed) return;
    closed = true;
    token++;
    teacher.destroy();
    document.removeEventListener("visibilitychange", onVisible);
    upright.removeEventListener?.("change", onTurn);
    window.removeEventListener("pagehide", close);
    if (document.fullscreenElement === tv) document.exitFullscreen?.();
    window.removeEventListener("keydown", onKey, true);
    box.remove();
    if (open === api) open = null;
  }
  /* The keys are the set's own while it is up: caught before the page under it
     hears them (an opened workbook closes on Escape too). */
  const onKey = (e) => {
    if (["Escape", "ArrowRight", "ArrowLeft"].includes(e.key)) { e.stopImmediatePropagation(); e.preventDefault(); }
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") stepTo(index + 1);
    else if (e.key === "ArrowLeft") stepTo(index - 1);
    else if (e.key === " " && !e.target.closest?.("input, textarea, button")) { e.preventDefault(); toggle(); }
    else if ((e.key === "f" || e.key === "F") && !e.ctrlKey && !e.metaKey && !e.altKey && !e.target.closest?.("input, textarea")) { e.preventDefault(); q("full").click(); }
    else if ((e.key === "d" || e.key === "D") && !e.ctrlKey && !e.metaKey && !e.altKey && !e.target.closest?.("input, textarea")) { e.preventDefault(); q("save").click(); }
  };
  /**
   * UP GOES THE CURTAIN. The one thing that turns a television that is merely
   * on into a lesson that has started: the drapes part, PrepBot walks on, and
   * only then does the first step go up and get said.
   *
   * It happens once, on whatever the learner presses first — play, the next
   * key, an arrow — because all of those mean "begin".
   */
  let started = false;
  async function raise() {
    if (started || closed) return;
    started = true;
    /* PrepBot arrives first and pulls the curtain: it is above the drapes
       (z-index 7 against 6) precisely so it can be seen doing it */
    if (gsap) {
      gsap.fromTo(bot, { opacity: 0, yPercent: 14, scale: 0.84 },
        { opacity: 1, yPercent: 0, scale: 1, duration: 0.5, ease: "back.out(1.6)" });
    } else {
      bot.style.opacity = "1";
    }
    teacher.poke?.();
    if (gsap) {
      const [left, right] = curtain.children;
      await new Promise((done) => gsap.timeline({ onComplete: done })
        .to(left, { xPercent: -101, duration: 0.7, ease: "power2.inOut" }, 0.45)
        .to(right, { xPercent: 101, duration: 0.7, ease: "power2.inOut" }, 0.45));
    }
    if (closed) return;
    curtain.style.display = "none";
    teacher.scheduleIdle();
  }

  async function toggle() {
    if (!started) {
      playing = true;
      paintControls();
      await raise();
      if (!closed && playing) go(0);
      return;
    }
    playing = !playing;
    if (playing) go(index >= steps.length - 1 ? 0 : Math.max(0, index)); else { token++; teacher.stop(); paintControls(); }
  }
  /** Stepping by hand before the curtain is up starts it too, and stays put. */
  const stepTo = async (i) => {
    if (!started) { playing = false; await raise(); if (!closed) go(Math.max(0, i)); return; }
    playing = false;
    go(i);
  };
  q("prev").addEventListener("click", () => stepTo(index - 1));
  q("next").addEventListener("click", () => stepTo(index + 1));
  q("play").addEventListener("click", toggle);
  q("close").addEventListener("click", close);
  /* TAKE IT AWAY WITH YOU. The whole explanation, every step in order, as a
     sheet that prints — so the lesson does not end when the TV goes off. */
  q("save").addEventListener("click", async () => {
    const key = q("save");
    key.disabled = true;
    try {
      const { downloadSheet } = await import("./lesson-sheet.js");
      downloadSheet({ title, steps });
    } catch (err) {
      console.error("PrepBot could not make the sheet", err);
    }
    key.disabled = false;
  });

  q("full").addEventListener("click", () => { if (document.fullscreenElement) document.exitFullscreen?.(); else tv.requestFullscreen?.(); });
  box.addEventListener("click", (e) => { if (e.target === box) close(); });
  window.addEventListener("keydown", onKey, true);

  const api = { close, go, get index() { return index; } };
  open = api;

  /* the curtain is drawn before anything is shown, and PrepBot pulls it open */
  build(stage);
  paintControls();
  /* THE SET COMES ON SHUT. Turning the television on is not the same as
     starting the lesson: the curtain stays down and PrepBot has not come out
     yet. Pressing play is what draws the curtain, brings PrepBot on and
     begins — see `raise()`. */
  return api;
}
