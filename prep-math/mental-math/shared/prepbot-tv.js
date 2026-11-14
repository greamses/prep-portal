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
/* a theatre curtain that opens like a real one (./tv-curtain.js) */
import { makeCurtain } from "./tv-curtain.js";
/* the off key is a power button; the tuck key folds the controls away for more screen */
const ICON_POWER = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7.05 6.4a8 8 0 1 0 9.9 0" fill="none" stroke="var(--accent-danger, #c0453f)" stroke-width="2.6" stroke-linecap="round"/><rect x="10.7" y="2.2" width="2.6" height="10" rx="1.3" fill="var(--accent-danger, #c0453f)"/></svg>`;
const ICON_TUCK = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M5 9l7 7 7-7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_UNTUCK = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M5 15l7-7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
import { sayMaths } from "/utils/speech-maths.js";

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

/* ── VIDEO CARDS: other films on the same topic, played in this same set ─────────
   `related` is [{ id, name, of, thumb }] and `onPick(id)` plays one. The cards close the film
   and end it (an "Up next" screen after the outro), and the cards key in the control bar
   brings them up at any moment. Nobody leaves the question page: the next film plays here. */
function thumbSvg(thumb) {
  /* the film's own bar in miniature: n boxes, k of them the part, the rest tinted (or grown past) */
  const n = Math.max(1, thumb?.n || 4), k = Math.max(0, thumb?.k ?? n - 1);
  const row = Math.max(n, k), w = 84 / row;
  let out = "";
  for (let i = 0; i < row; i++) {
    const rest = k > n ? i >= n : i >= k;
    out += `<rect x="${(8 + i * w).toFixed(2)}" y="20" width="${(w).toFixed(2)}" height="14" fill="${rest ? "#ffd9cf" : "#bfe3ff"}" stroke="#2a2723" stroke-width="0.9"/>`;
  }
  return `<svg viewBox="0 0 100 56" aria-hidden="true"><rect width="100" height="56" fill="#fffdf8"/>`
    + `<path d="M8 15 Q50 6 ${(8 + Math.min(k, row) * w).toFixed(1)} 15" fill="none" stroke="#c0453f" stroke-width="1.2"/>`
    + out + `<circle cx="50" cy="45" r="7" fill="#2a2723"/><path d="M47.5 41.6v6.8l5.8-3.4z" fill="#fff"/></svg>`;
}
/* films whose voice is saved (looked up once per film, from the server's cached manifest) */
const savedFilms = new Set();
const lookedUp = new Set();
const SAVED_TICK = () => `<span class="mm-tv-card__saved" data-tip="Voice saved" aria-label="Voice saved">${UI.check(12)}</span>`;
function markSaved(root) {
  root?.querySelectorAll?.("[data-pick]").forEach((b) => {
    if (savedFilms.has(b.dataset.pick) && !b.querySelector(".mm-tv-card__saved")) b.querySelector(".mm-tv-card__thumb")?.insertAdjacentHTML("beforeend", SAVED_TICK());
  });
}
async function lookUpSaved(related, root) {
  const todo = related.filter((r) => !lookedUp.has(r.id));
  todo.forEach((r) => lookedUp.add(r.id));
  try {
    const { keptAudio } = await import("/utils/components/workbook/film-store.js");
    await Promise.all(todo.map(async (r) => { if ((await keptAudio(r.id)).size) savedFilms.add(r.id); }));
  } catch { /* no ticks, no harm */ }
  markSaved(root);
}
/* THE CARDS, IN THEIR CATEGORIES. *"I should see the three intro cards with the other ratio cards
   but in its category."* Every film on the topic is offered, grouped by `group` in the order the
   groups come ("Lessons" before "Worked questions"), each card showing the film's own thumbnail. */
const cardHtml = (r, i) => `<li style="animation-delay:${(0.2 + Math.min(i, 8) * 0.08).toFixed(2)}s">`
  + `<button type="button" class="mm-tv-card pp-plain" data-pick="${esc(r.id)}" aria-label="Watch: ${esc(r.name)}">`
  + `<span class="mm-tv-card__thumb">${r.img ? `<img src="${esc(r.img)}" alt="" loading="lazy">` : thumbSvg(r.thumb)}</span>`
  + `<span class="mm-tv-card__name">${esc(r.name)}</span>`
  + (r.of ? `<span class="mm-tv-card__of">${esc(r.of)}</span>` : "")
  + `</button></li>`;
const cardsHtml = (related) => {
  const groups = [];
  related.forEach((r) => {
    const g = r.group || "";
    let set = groups.find((x) => x.name === g);
    if (!set) groups.push(set = { name: g, items: [] });
    set.items.push(r);
  });
  let n = 0;
  return `<div class="mm-tv-cardsets">` + groups.map((g) => (g.name ? `<p class="mm-tv-cards__group">${esc(g.name)}</p>` : "")
    + `<ul class="mm-tv-cards" role="list">${g.items.map((r) => cardHtml(r, n++)).join("")}</ul>`).join("") + `</div>`;
};
const upNextStep = (related) => ({
  say: "Want another one like this? Pick a card. Each one is a different question on the same idea, "
    + "and it plays right here.",
  show(stage) {
    const box = document.createElement("div");
    box.className = "mm-tv-upnext";
    box.innerHTML = `<p class="mm-tv-upnext__lead">Watch another one</p>${cardsHtml(related)}`;
    stage.appendChild(box);
    markSaved(box);
  },
});

/** Save a film's YouTube thumbnail (tools/film-thumbnail/png/<id>.png). False when it has none. */
async function downloadThumb(id) {
  const res = await fetch(`/tools/film-thumbnail/png/${encodeURIComponent(id)}.png`);
  if (!res.ok || !/image\/png/.test(res.headers.get("content-type") || "")) return false;
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = `prepbot-${id}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return true;
}

export async function openTv({ title = "", build = () => {}, steps: told = [], onEdit = null, related = [], onPick = null, filmId = "" } = {}) {
  const more = related.length && typeof onPick === "function";
  const steps = told.length ? [introStep(title), ...told, outroStep(), ...(more ? [upNextStep(related)] : [])] : told;
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
    (onEdit ? `<button class="mm-tv-btn" data-tv="edit" type="button" aria-label="Edit this film" title="Edit this film">${UI.edit(22)}</button>` : "") +
    (onEdit && filmId ? `<button class="mm-tv-btn" data-tv="keep" type="button" disabled aria-label="Keep this audio" title="Keep this audio: play these recordings from now on, with no voice service">${UI.speaker(22)}<span class="mm-tv-keep__n" aria-hidden="true"></span></button>` : "") +
    (onEdit && filmId ? `<button class="mm-tv-btn" data-tv="redo" type="button" aria-label="Record this line again" data-tip="Record this line again: a new take replaces the saved one">${UI.refresh(22)}</button>` : "") +
    (more ? `<button class="mm-tv-btn" data-tv="more" type="button" aria-label="More videos like this" title="More videos like this (M)" aria-keyshortcuts="M">${UI.cards(22)}</button>` : "") +
    (filmId
      ? `<button class="mm-tv-btn" data-tv="save" type="button" aria-label="Download this film's thumbnail" title="Download this film's thumbnail (D)" aria-keyshortcuts="D">${UI.download(22)}</button>`
      : `<button class="mm-tv-btn" data-tv="save" type="button" aria-label="Download this explanation" title="Download this explanation (D)" aria-keyshortcuts="D">${UI.download(22)}</button>`) +
    `<button class="mm-tv-btn" data-tv="full" type="button" aria-label="Fullscreen" title="Full screen (F)" aria-keyshortcuts="F">${ICON_FULLSCREEN}</button>` +
    `<button class="mm-tv-btn" data-tv="hide" type="button" aria-label="Hide the controls for more room" data-tip="Hide the controls for more room (C)" aria-keyshortcuts="C">${ICON_TUCK}</button>` +
    `<button class="mm-tv-btn" data-tv="close" type="button" aria-label="Turn the TV off" data-tip="Turn the TV off (Esc)" aria-keyshortcuts="Escape">${ICON_POWER}</button>` +
    `</div></div>` +
    `<div class="mm-tv-stand" aria-hidden="true"><div class="mm-tv-stand-neck"></div><div class="mm-tv-stand-base"></div></div>` +
    `</div>`;
  document.body.appendChild(box);

  const q = (k) => box.querySelector(`[data-tv="${k}"]`);
  const b = (k) => box.querySelector(`[data-b="${k}"]`);
  const tv = box.querySelector(".mm-tv");
  const screen = box.querySelector(".mm-tv-screen");
  const stage = q("stage"), progress = q("progress"), curtain = q("curtain");
  const drapes = makeCurtain(curtain);
  const bot = box.querySelector(".mm-prepbot");
  /* not on stage until the curtain goes up */
  bot.style.opacity = "0";
  const playIcon = q("play").querySelector("span");

  let auth = null;
  try { auth = (await import("/firebase-init.js")).auth || null; } catch { /* the free voice */ }
  const teacher = new PrepbotTeacher({ root: box.querySelector(".mm-prepbot"), boundsEl: screen, auth, menu: { ask: b("ask"), voice: b("voice"), sleep: b("sleep"), poke: b("poke") } });
  teacher.lessonVoice = true;   // the films ask for the lesson voice (server/routes/tts.js "lesson")
  /* each line is spoken knowing the two lines either side of it, so the talk flows instead of restarting */
  steps.forEach((st, k) => {
    const near = (a, b) => steps.slice(Math.max(0, a), Math.max(0, b)).map((x) => x.say || "").filter(Boolean).join(" ");
    teacher.setLineContext?.(st.say, near(k - 2, k), near(k + 1, k + 3));
  });
  /* the voice changed in the middle of a line: say the step again in the new one */
  teacher.onVoiceChange = () => { if (!closed && index >= 0) go(index); };
  let gsap = null;
  try {
    const m = await import("https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm");
    gsap = m.default || m.gsap || m;
    teacher.gsap = gsap;
  } catch { /* no animation library: every step simply appears */ }

  /**
   * THE SCALE, KEPT RIGHT BY THE SET ITSELF.
   *
   * Every film is measured in `--u`, a hundredth of the stage's width, and
   * each caller used to set it once just after building. That is one reading
   * taken at the worst possible moment: the overlay has only just been put in
   * the document, so the stage can still be measuring the whole window —
   * caught at 16px on a stage 876 across, which draws the whole lesson at
   * nearly twice its size. The set owns the stage, so the set watches it, and
   * every film it is ever given is right: coded or written down, resized,
   * rotated or put full screen.
   */
  const scale = () => {
    const tv = stage.querySelector(".vm-tv");
    if (tv && stage.clientWidth) tv.style.setProperty("--u", `${stage.clientWidth / 100}px`);
  };
  const watchStage = typeof ResizeObserver === "function" ? new ResizeObserver(scale) : null;
  watchStage?.observe(stage);

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
    /* THE DRAWING STARTS WHEN THE VOICE DOES. A line's audio is fetched first (a
       moment at most, and usually already fetched while the step before was said),
       so the hand draws while the words about it are being heard, not seconds ahead. */
    if (speak && playing) {
      await Promise.race([teacher.prepare?.(steps[index].say), new Promise((r) => setTimeout(r, 2500))]);
      if (mine !== token || closed) return;
    }
    steps[index].show?.(stage, { gsap, instant: !gsap });
    scale();
    paintControls();
    teacher.show();
    if (!speak) return;
    /* a title card on the screen: PrepBot waits for it to lift before speaking */
    if (steps[index].lead) {
      await new Promise((r) => setTimeout(r, steps[index].lead * 1000));
      if (mine !== token || closed) return;
    }
    /* and the next line is fetched while this one is said */
    if (steps[index + 1]?.say) teacher.prepare?.(steps[index + 1].say);
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
    /* A PAUSE IS PART OF THE LESSON. A step may ask for one (`pause`, seconds): the
       silence after a question, or after a thing worth letting sink in. */
    await new Promise((r) => setTimeout(r, 1000 * (steps[index].pause ?? 0.45)));
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

  let shut = () => {};
  const done = new Promise((r) => { shut = r; });

  function close() {
    if (closed) return;
    closed = true;
    token++;
    teacher.destroy();
    document.removeEventListener("visibilitychange", onVisible);
    upright.removeEventListener?.("change", onTurn);
    watchStage?.disconnect();
    window.removeEventListener("pagehide", close);
    if (document.fullscreenElement === tv) document.exitFullscreen?.();
    window.removeEventListener("keydown", onKey, true);
    box.remove();
    if (open === api) open = null;
    shut();
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
    /* the drapes are gathered to the sides, swing and settle, and the curtain goes */
    await new Promise((r) => setTimeout(r, 350));
    await drapes.open();
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
      /* a film with a thumbnail (*"use the download button for downloading the thumbnail"*):
         the key hands over its 1280 x 720 YouTube picture from tools/film-thumbnail/png */
      if (filmId && await downloadThumb(filmId)) return;
      const { downloadSheet } = await import("./lesson-sheet.js");
      downloadSheet({ title, steps });
    } catch (err) {
      console.error("PrepBot could not make the download", err);
    } finally {
      key.disabled = false;
    }
  });

  /* STRAIGHT FROM THE SET TO THE CUTTING ROOM. A film is judged watching it,
     and the moment you see the line that is wrong is the moment to change it
     (film-editor.js). Only the admin is ever handed an onEdit. */
  q("edit")?.addEventListener("click", () => { close(); onEdit(); });

  /* ── SAVED VOICE ──────────────────────────────────────────────────────────
     The recordings the admin kept for this film play instead of the voice service.
     *"No notification to show that a voice is saved. Also a better saving progress
     and saving completion is needed."* So:
       - a "Voice saved" badge by the title whenever this film plays from its recordings
       - a short notice on opening ("Playing the saved voice")
       - while saving, a receipt on the screen: what is being done, a bar for each stage
       - at the end, a clear done (or a plain reason it could not) */
  const said = steps.map((st) => st.say).filter(Boolean);
  if (filmId) {
    try {
      const { keptAudio } = await import("/utils/components/workbook/film-store.js");
      teacher.kept = await Promise.race([keptAudio(filmId), new Promise((r) => setTimeout(() => r(new Map()), 3000))]);
    } catch { teacher.kept = new Map(); }
  }
  const keptNow = () => said.filter((t) => teacher.kept?.has(teacher.keyOf(sayMaths(t)))).length;

  /* the badge by the title */
  const badge = document.createElement("span");
  badge.className = "mm-tv-saved";
  badge.hidden = true;
  badge.innerHTML = `${UI.check(14)}<span class="mm-tv-saved__t"></span>`;
  box.querySelector(".mm-tv-title")?.after(badge);
  const paintBadge = () => {
    const k = keptNow();
    badge.hidden = !k;
    badge.querySelector(".mm-tv-saved__t").textContent = k === said.length ? "Voice saved" : `Voice saved: ${k} of ${said.length} lines`;
    badge.dataset.tip = k === said.length
      ? "Every line plays from its saved recording: no voice service is used"
      : `${k} of ${said.length} lines play from saved recordings; the rest are spoken live (re-worded lines are new lines)`;
  };
  paintBadge();

  /* the receipt on the screen: notices, and the saving in progress */
  const note = document.createElement("div");
  note.className = "mm-tv-keepbox pp-receipt";
  note.hidden = true;
  note.setAttribute("role", "status");
  note.setAttribute("aria-live", "polite");
  note.innerHTML = `<div class="pp-receipt__paper"><p class="mm-tv-keepbox__t"></p><p class="mm-tv-keepbox__s"></p>`
    + `<div class="mm-tv-keepbox__bar"><i></i></div><p class="mm-tv-keepbox__n"></p></div>`;
  screen.appendChild(note);
  let noteTimer = 0;
  const say = ({ title = "", sub = "", frac = null, count = "", kind = "", hold = 0 }) => {
    clearTimeout(noteTimer);
    note.hidden = false;
    note.dataset.kind = kind;
    note.querySelector(".mm-tv-keepbox__t").textContent = title;
    note.querySelector(".mm-tv-keepbox__s").textContent = sub;
    note.querySelector(".mm-tv-keepbox__n").textContent = count;
    const bar = note.querySelector(".mm-tv-keepbox__bar");
    bar.hidden = frac == null;
    if (frac != null) bar.firstChild.style.width = `${Math.round(Math.max(0, Math.min(1, frac)) * 100)}%`;
    if (hold) noteTimer = setTimeout(() => { note.hidden = true; }, hold * 1000);
  };
  if (keptNow()) say({ title: "Playing the saved voice", sub: keptNow() === said.length ? "Every line comes from its saved recording." : `${keptNow()} of ${said.length} lines come from saved recordings.`, kind: "ok", hold: 3.5 });

  /* THE KEEP KEY (admin) */
  if (q("keep")) {
    const keepKey = q("keep");
    keepKey.disabled = false;   // ready now: the saved recordings have been looked up
    const paint = (txt) => {
      const n = keepKey.querySelector(".mm-tv-keep__n");
      n.classList.toggle("is-tick", txt === "✓");
      if (txt === "✓") n.innerHTML = UI.check(11); else n.textContent = txt;
    };
    const label = () => {
      const k = keptNow();
      keepKey.dataset.tip = k ? `Voice saved (${k} of ${said.length} lines). Press to save it again: re-worded lines are recorded fresh.` : "Save this voice: every line is recorded once and played from the recording from now on";
      keepKey.setAttribute("aria-label", keepKey.dataset.tip);
      keepKey.removeAttribute("title");
      paint(k ? (k === said.length ? "✓" : `${k}/${said.length}`) : "");
    };
    label();
    const b64 = async (url) => {
      if (url.startsWith("data:")) return url.slice(url.indexOf(",") + 1);
      const buf = new Uint8Array(await (await fetch(url)).arrayBuffer());
      let bin = "";
      for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
      return btoa(bin);
    };
    /* WATCHING IS SAVING. *"When I am watching a video, please save audio alongside, we can correct
       the section I dont like and resave it."* Every line the voice service records while the admin
       watches is kept at once (only that line; the rest of the manifest stays), so a film watched
       through is a film saved, and the redo key below re-records just the line on the screen. */
    const lineOf = new Map(said.map((t) => [sayMaths(t), t]));
    const fresh = [];
    let pumping = false;
    const pump = async () => {
      if (pumping) return;
      pumping = true;
      keepKey.classList.add("is-busy");
      try {
        const { keepAudio } = await import("/utils/components/workbook/film-store.js");
        while (fresh.length) {
          const { spoken, url } = fresh.shift();
          const key = teacher.keyOf(spoken);
          const kept = await keepAudio(filmId, [{ key, b64: await b64(url), text: lineOf.get(spoken) }], () => {}, { merge: teacher.kept || new Map() });
          teacher.kept = new Map(Object.entries(kept));
          label();
          paintBadge();
        }
      } catch (e) {
        paint("!");
        say({ title: "A line was not saved", sub: e.message || "Play it again to try once more.", kind: "bad", hold: 7 });
        console.warn("[keep as you watch]", e);
      } finally {
        pumping = false;
        keepKey.classList.remove("is-busy");
      }
    };
    teacher.onFresh = (spoken, url) => {
      if (!lineOf.has(spoken)) return;   // PrepBot's other chatter is not part of the film
      fresh.push({ spoken, url });
      pump();
    };
    const savedNow = async () => { while (pumping || fresh.length) await new Promise((r) => setTimeout(r, 150)); };

    /* RECORD THIS LINE AGAIN: a new take of the line on the screen replaces the kept one, and is played */
    q("redo")?.addEventListener("click", async () => {
      const redo = q("redo");
      if (index < 0 || redo.disabled || !steps[index]?.say) return;
      const at = index;
      if (playing) toggle();
      teacher.stop();
      redo.disabled = true;
      redo.classList.add("is-busy");
      say({ title: "Recording this line again", sub: `Step ${at + 1} of ${steps.length}: a new take` });
      try {
        const url = await teacher._tryElevenLabs(sayMaths(steps[at].say), { fresh: true });
        if (!url) throw new Error("The voice service gave nothing back. Is the premium voice on for this account?");
        await savedNow();
        say({ title: "New take saved", sub: "Playing it now. Not right? Press again for another take.", kind: "ok", hold: 4 });
        go(at);
      } catch (e) {
        say({ title: "The line was not recorded", sub: e.message || "Try again.", kind: "bad", hold: 7 });
      } finally {
        redo.disabled = false;
        redo.classList.remove("is-busy");
      }
    });

    keepKey.addEventListener("click", async () => {
      if (keepKey.disabled) return;
      if (playing) toggle();
      keepKey.disabled = true;
      keepKey.classList.add("is-busy");
      const lines = [];
      const total = said.length;
      try {
        /* stage 1 of 2: a recording for every line (the ones already heard come from memory) */
        for (let i = 0; i < total; i++) {
          say({ title: "Saving this voice", sub: "Step 1 of 2: recording every line", frac: i / total, count: `Line ${i + 1} of ${total}` });
          const spoken = sayMaths(said[i]);
          const url = await teacher._tryElevenLabs(spoken);
          if (!url) throw new Error(`Line ${i + 1} could not be recorded. Is the premium voice on for this account?`);
          lines.push({ key: teacher.keyOf(spoken), b64: await b64(url), text: said[i] });
        }
        /* stage 2 of 2: up to the saved place, one line at a time */
        const { keepAudio, keptAudio } = await import("/utils/components/workbook/film-store.js");
        await keepAudio(filmId, lines, (n, all) => say({ title: "Saving this voice", sub: "Step 2 of 2: storing the recordings", frac: n / all, count: `${n} of ${all} saved` }));
        teacher.kept = await keptAudio(filmId);
        label();
        paintBadge();
        keepKey.setAttribute("aria-pressed", "true");
        say({ title: "Voice saved", sub: `All ${total} lines will play from these recordings, for everyone, with no voice service.`, frac: 1, count: "Done", kind: "ok", hold: 6 });
        try { (await import("/utils/components/workbook/film-fx.js")).sfx("ding"); } catch { /* quiet */ }
      } catch (e) {
        paint("!");
        say({ title: "The voice was not saved", sub: e.message || "Something went wrong. Nothing was changed: try again.", kind: "bad", hold: 9 });
        console.warn("[keep audio]", e);
      } finally {
        keepKey.disabled = false;
        keepKey.classList.remove("is-busy");
      }
    });
  }
  /* THE CARDS: on the end screen, or brought up over the film by the cards key (the film pauses) */
  if (more) {
    const sheet = document.createElement("div");
    sheet.className = "mm-tv-morepanel";
    sheet.hidden = true;
    sheet.innerHTML = `<div class="mm-tv-upnext"><p class="mm-tv-upnext__lead">More like this</p>${cardsHtml(related)}</div>`
      + `<button type="button" class="mm-tv-morepanel__x pp-plain" aria-label="Back to the film" data-tip="Back to the film">${ICON_CLOSE}</button>`;
    screen.appendChild(sheet);
    lookUpSaved(related, box);
    const showMore = (on) => {
      sheet.hidden = !on;
      q("more").setAttribute("aria-pressed", String(on));
      if (on && playing) toggle();
    };
    q("more").addEventListener("click", () => showMore(sheet.hidden));
    sheet.querySelector(".mm-tv-morepanel__x").addEventListener("click", () => showMore(false));
    /* a card, wherever it is shown, plays its film in this set */
    box.addEventListener("click", (e) => {
      const card = e.target.closest?.("[data-pick]");
      if (!card) return;
      e.preventDefault();
      onPick(card.dataset.pick);
    });
    window.addEventListener("keydown", (e) => {
      if (closed || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.target.closest?.("input, textarea, select, [contenteditable='true']")) return;
      if (e.key === "m" || e.key === "M") { e.preventDefault(); e.stopImmediatePropagation(); showMore(sheet.hidden); }
      else if (e.key === "Escape" && !sheet.hidden) { e.preventDefault(); e.stopImmediatePropagation(); showMore(false); }
    }, true);
  }
  /* MORE LEARNING SPACE (*"the black part of the Tv where the buttons can be hidden"*): the bar of keys
     and the frame fold away and the screen grows; a small tab on the screen, or C, brings them back.
     Remembered on this device. */
  const col = box.querySelector(".mm-tv-col");
  const untuck = document.createElement("button");
  untuck.type = "button";
  untuck.className = "mm-tv-untuck pp-plain";
  untuck.innerHTML = ICON_UNTUCK;
  untuck.setAttribute("aria-label", "Show the controls");
  untuck.dataset.tip = "Show the controls (C)";
  screen.appendChild(untuck);
  const tuck = (on) => {
    tv.classList.toggle("mm-tv--bare", on);
    col?.classList.toggle("is-bare", on);
    try { localStorage.setItem("pp-tv-bare", on ? "1" : "0"); } catch { /* private mode */ }
  };
  try { if (localStorage.getItem("pp-tv-bare") === "1") tuck(true); } catch { /* no memory */ }
  q("hide").addEventListener("click", () => tuck(true));
  untuck.addEventListener("click", () => tuck(false));
  window.addEventListener("keydown", (e) => {
    if (closed || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest?.("input, textarea, select, [contenteditable='true']")) return;
    if (e.key === "c" || e.key === "C") { e.preventDefault(); e.stopImmediatePropagation(); tuck(!tv.classList.contains("mm-tv--bare")); }
  }, true);
  q("full").addEventListener("click", () => { if (document.fullscreenElement) document.exitFullscreen?.(); else tv.requestFullscreen?.(); });
  box.addEventListener("click", (e) => { if (e.target === box) close(); });
  window.addEventListener("keydown", onKey, true);

  const api = { close, go, done, get index() { return index; } };
  open = api;

  /* the curtain is drawn before anything is shown, and PrepBot pulls it open */
  build(stage);
  scale();
  requestAnimationFrame(scale);
  paintControls();
  /* THE SET COMES ON SHUT. Turning the television on is not the same as
     starting the lesson: the curtain stays down and PrepBot has not come out
     yet. Pressing play is what draws the curtain, brings PrepBot on and
     begins — see `raise()`. */
  return api;
}
