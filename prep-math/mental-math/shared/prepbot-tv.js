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
import { ICON_PLAY, ICON_PAUSE, ICON_PREV, ICON_NEXT, ICON_FULLSCREEN, ICON_CLOSE } from "./icons.js";

const css = (href) => {
  if ([...document.styleSheets].some((s) => s.href && s.href.endsWith(href.split("/").pop()))) return;
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
};

let open = null;      // the set that is up now: one at a time

export async function openTv({ title = "", build = () => {}, steps = [] } = {}) {
  open?.close();
  css("/prep-math/mental-math/shared/prepbot-teacher.css");
  css("/prep-math/mental-math/shared/prepbot-tv.css");

  const box = document.createElement("div");
  box.className = "mm-tv-overlay";
  box.innerHTML =
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
    `<button class="mm-prepbot-menu-btn" data-b="voice" type="button" title="Beep or talking voice" aria-label="Toggle beep or talking voice"></button>` +
    `<button class="mm-prepbot-menu-btn" data-b="sleep" type="button" title="Sleep" aria-label="Sleep PrepBot"></button>` +
    `<button class="mm-prepbot-menu-btn" data-b="poke" type="button" title="Wiggle" aria-label="Wiggle PrepBot"></button>` +
    `</div><div class="mm-prepbot-avatar" aria-hidden="true"></div></div></div>` +
    `</div>` +
    `<div class="mm-tv-panel"><span class="mm-tv-light" aria-hidden="true"></span><span class="mm-tv-title">${title}</span>` +
    `<div class="mm-tv-btns">` +
    `<button class="mm-tv-btn" data-tv="prev" type="button" aria-label="Previous step">${ICON_PREV}</button>` +
    `<button class="mm-tv-btn mm-tv-btn--play" data-tv="play" type="button" aria-label="Play or pause"><span>${ICON_PAUSE}</span></button>` +
    `<button class="mm-tv-btn" data-tv="next" type="button" aria-label="Next step">${ICON_NEXT}</button>` +
    `</div>` +
    `<button class="mm-tv-btn" data-tv="full" type="button" aria-label="Fullscreen">${ICON_FULLSCREEN}</button>` +
    `<button class="mm-tv-btn" data-tv="close" type="button" aria-label="Turn the TV off">${ICON_CLOSE}</button>` +
    `</div></div>` +
    `<div class="mm-tv-stand" aria-hidden="true"><div class="mm-tv-stand-neck"></div><div class="mm-tv-stand-base"></div></div>` +
    `</div>`;
  document.body.appendChild(box);

  const q = (k) => box.querySelector(`[data-tv="${k}"]`);
  const b = (k) => box.querySelector(`[data-b="${k}"]`);
  const tv = box.querySelector(".mm-tv");
  const screen = box.querySelector(".mm-tv-screen");
  const stage = q("stage"), progress = q("progress"), curtain = q("curtain");
  const playIcon = q("play").querySelector("span");

  let auth = null;
  try { auth = (await import("/firebase-init.js")).auth || null; } catch { /* the free voice */ }
  const teacher = new PrepbotTeacher({ root: box.querySelector(".mm-prepbot"), boundsEl: screen, auth, menu: { ask: b("ask"), voice: b("voice"), sleep: b("sleep"), poke: b("poke") } });
  let gsap = null;
  try {
    const m = await import("https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm");
    gsap = m.default || m.gsap || m;
    teacher.gsap = gsap;
  } catch { /* no animation library: every step simply appears */ }

  let index = -1;       // the step on the screen; -1 before the first
  let playing = true;
  let token = 0;        // every move makes a new one, and a narration that is not the latest stops driving
  let closed = false;

  const paintControls = () => {
    playIcon.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
    q("prev").disabled = index <= 0;
    q("next").disabled = index >= steps.length - 1;
    progress.textContent = index < 0 ? "Ready" : `Step ${index + 1} of ${steps.length}`;
  };

  /** Put step i on the screen: everything before it at once, itself animated, and said. */
  async function go(i) {
    if (closed || !steps.length) return;
    const mine = ++token;
    teacher.stop();
    index = Math.max(0, Math.min(steps.length - 1, i));
    stage.innerHTML = "";
    build(stage);
    for (let k = 0; k < index; k++) steps[k].show?.(stage, { gsap, instant: true });
    steps[index].show?.(stage, { gsap, instant: !gsap });
    paintControls();
    teacher.show();
    teacher.speak([{ text: steps[index].say, mode: "speech" }], { colorSeed: index });
    try { await teacher.narrationDone; } catch { /* stopped */ }
    if (mine !== token || closed || !playing) return;
    if (index >= steps.length - 1) { playing = false; paintControls(); return; }
    await new Promise((r) => setTimeout(r, 450));
    if (mine === token && !closed && playing) go(index + 1);
  }

  function close() {
    if (closed) return;
    closed = true;
    token++;
    teacher.stop();
    teacher.stopIdle?.();
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
    else if (e.key === "ArrowRight") { playing = false; go(index + 1); }
    else if (e.key === "ArrowLeft") { playing = false; go(index - 1); }
    else if (e.key === " " && !e.target.closest?.("input, textarea, button")) { e.preventDefault(); toggle(); }
  };
  function toggle() {
    playing = !playing;
    if (playing) go(index >= steps.length - 1 ? 0 : Math.max(0, index)); else { token++; teacher.stop(); paintControls(); }
  }
  q("prev").addEventListener("click", () => { playing = false; go(index - 1); });
  q("next").addEventListener("click", () => { playing = false; go(index + 1); });
  q("play").addEventListener("click", toggle);
  q("close").addEventListener("click", close);
  q("full").addEventListener("click", () => { if (document.fullscreenElement) document.exitFullscreen?.(); else tv.requestFullscreen?.(); });
  box.addEventListener("click", (e) => { if (e.target === box) close(); });
  window.addEventListener("keydown", onKey, true);

  const api = { close, go, get index() { return index; } };
  open = api;

  /* the curtain is drawn before anything is shown, and PrepBot pulls it open */
  build(stage);
  paintControls();
  if (gsap) {
    const [left, right] = curtain.children;
    await new Promise((done) => gsap.timeline({ onComplete: done })
      .to(left, { xPercent: -101, duration: 0.7, ease: "power2.inOut" }, 0.25)
      .to(right, { xPercent: 101, duration: 0.7, ease: "power2.inOut" }, 0.25));
    teacher.scheduleIdle();
  }
  curtain.style.display = "none";
  if (!closed) go(0);
  return api;
}
