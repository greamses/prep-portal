/* ============================================================================
   Mental Maths Workbook — PREPBOT EXPLAINS each trick
   ----------------------------------------------------------------------------
   Learning with PrepBot (/prep-math/mental-math) is where a trick is TAUGHT:
   the mascot talks it through, a line at a time. This brings that teacher
   onto the workbook. On a Skill development paper every section opens with a
   strip that says "PrepBot explains …"; tapped, PrepBot comes up beside the
   paper and talks the trick through — what to do, then the example worked on
   the page, which is ringed while it speaks.

   IT IS THE SAME PREPBOT. The character is the one shared module
   (/prep-math/mental-math/shared/prepbot-teacher.js): its typewriter bubble,
   its beep or talking voice, its menu. Its "Ask" button opens the site's real
   chat. Nothing here draws a bot of its own.

   What it SAYS is the section's own words — its instruction and the "one
   done for you" — so a trick's explanation can never drift from its paper.
   A trick that also has a full animated lesson links to it (LESSONS).

   Drills papers have no strip: a drill is against the clock.
   ========================================================================== */

/* Tricks with a full animated lesson in Learning with PrepBot. */
const LESSONS = {
  "vm-eleven": "/prep-math/mental-math/times-eleven/index.html",
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const plain = (html) => String(html || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
/** Text as the lines PrepBot says: a sentence each, a long one broken at its dash or semicolon. */
function linesOf(text) {
  return plain(text)
    .split(/(?<=[.!?])\s+(?=[A-Z0-9“"(])/)
    .flatMap((s) => (s.length > 150 ? s.split(/\s+—\s+|;\s+/) : [s]))
    .map((s) => s.trim())
    .filter((s) => s.length > 1);
}
/** The words of a section's worked example: every "say" paragraph in it. */
function workedLines(html) {
  const out = [];
  String(html || "").replace(/<p class="wb-ask wb-worked__say">([\s\S]*?)<\/p>/g, (_, body) => { out.push(...linesOf(body)); return ""; });
  return out;
}

const FACE = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="11.2" y="1.6" width="1.6" height="3.4" rx="0.8" fill="#2a2723"/><circle cx="12" cy="2" r="1.5" fill="#f0443e"/>` +
  `<rect x="3" y="5" width="18" height="14.6" rx="4.4" fill="#bfe3ff" stroke="#2a2723" stroke-width="1.2"/>` +
  `<circle cx="8.6" cy="11.4" r="2.1" fill="#2a2723"/><circle cx="15.4" cy="11.4" r="2.1" fill="#2a2723"/><circle cx="9.2" cy="10.8" r="0.7" fill="#fff"/><circle cx="16" cy="10.8" r="0.7" fill="#fff"/>` +
  `<path d="M8.6 15.6Q12 17.8 15.4 15.6" fill="none" stroke="#2a2723" stroke-width="1.2" stroke-linecap="round"/></svg>`;
const PLAY = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.4" fill="#2a2723"/><path d="M9.6 7.4v9.2l7.6-4.6z" fill="#fffdf8"/></svg>`;

/** The strip that opens a section: PrepBot, the trick's name, and "listen". */
export function explainStrip(ex, opts) {
  const lines = [
    ...linesOf(typeof ex.instruction === "function" ? ex.instruction(opts) : ex.instruction),
    ...(ex.worked ? workedLines(ex.worked(opts)) : []),
  ];
  const lesson = LESSONS[ex.id];
  return `<div class="vm-video has-video" data-explain="${esc(JSON.stringify(lines))}" data-title="${esc(ex.label)}" tabindex="0">` +
    `<span class="vm-video__bot">${FACE}</span>` +
    `<span class="vm-video__say"><b>PrepBot explains</b><em>${esc(ex.label)}</em></span>` +
    (lesson ? `<a class="vm-video__more" href="${lesson}" target="_blank" rel="noopener">The full lesson</a>` : "") +
    `<span class="vm-video__go">${PLAY}<i>Listen</i></span></div>`;
}

/* ── the teacher: one for the page, brought up by any strip ──────────────── */

let teacher = null;
let booting = null;
let playing = null;      // the strip PrepBot is explaining now

async function boot() {
  if (teacher) return teacher;
  if (booting) return booting;
  booting = (async () => {
    if (!document.querySelector('link[href$="prepbot-teacher.css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "/prep-math/mental-math/shared/prepbot-teacher.css";
      document.head.appendChild(link);
    }
    const [{ PrepbotTeacher }, fb] = await Promise.all([
      import("/prep-math/mental-math/shared/prepbot-teacher.js"),
      import("/firebase-init.js").catch(() => ({})),
    ]);
    const root = document.createElement("div");
    root.id = "vm-prepbot";
    root.className = "mm-prepbot vm-prepbot";
    root.innerHTML =
      `<div class="mm-prepbot-bubble mm-prepbot-bubble--speech mm-prepbot-bubble--hidden" aria-hidden="true"><p></p></div>` +
      `<div class="mm-prepbot-avatar-wrap"><div class="mm-prepbot-menu">` +
      `<button class="mm-prepbot-menu-btn" data-b="ask" type="button" title="Ask PrepBot a question" aria-label="Ask PrepBot a question"></button>` +
      `<button class="mm-prepbot-menu-btn" data-b="voice" type="button" title="Beep or talking voice" aria-label="Toggle beep or talking voice"></button>` +
      `<button class="mm-prepbot-menu-btn" data-b="sleep" type="button" title="Sleep" aria-label="Sleep PrepBot"></button>` +
      `<button class="mm-prepbot-menu-btn" data-b="poke" type="button" title="Wiggle" aria-label="Wiggle PrepBot"></button>` +
      `</div><div class="mm-prepbot-avatar" aria-hidden="true"></div></div>`;
    document.body.appendChild(root);
    const b = (k) => root.querySelector(`[data-b="${k}"]`);
    teacher = new PrepbotTeacher({ root, boundsEl: document.body, auth: fb.auth || null, menu: { ask: b("ask"), voice: b("voice"), sleep: b("sleep"), poke: b("poke") } });
    import("https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm")
      .then((m) => { teacher.gsap = m.default || m.gsap || m; teacher.scheduleIdle(); })
      .catch(() => { /* no idle animation; everything else still works */ });
    return teacher;
  })();
  return booting;
}

function settle() {
  document.querySelectorAll(".is-explaining").forEach((n) => n.classList.remove("is-explaining"));
  if (playing) { const i = playing.querySelector(".vm-video__go i"); if (i) i.textContent = "Listen"; playing.classList.remove("is-playing"); }
  playing = null;
}

async function explain(strip) {
  const t = await boot();
  if (playing === strip) { t.stop(); settle(); t.hide(); return; }
  t.stop();
  settle();
  let lines = [];
  try { lines = JSON.parse(strip.dataset.explain); } catch { /* nothing to say */ }
  if (!lines.length) return;
  playing = strip;
  strip.classList.add("is-playing");
  strip.querySelector(".vm-video__go i").textContent = "Stop";
  /* ring the example PrepBot is talking about: the worked one under the strip */
  let next = strip.nextElementSibling;
  if (next && next.classList.contains("wb-worked")) next.classList.add("is-explaining");
  strip.scrollIntoView({ block: "center", behavior: "smooth" });
  t.show();
  t.speak(lines.map((text) => ({ text, mode: "speech" })));
  const mine = strip;
  try { await t.narrationDone; } catch { /* stopped */ }
  if (playing === mine) settle();
}

if (typeof document !== "undefined" && !document.__vmExplain) {
  document.__vmExplain = true;
  const open = (e) => {
    if (e.target.closest?.(".vm-video__more")) return;      // the link to the full lesson
    const strip = e.target.closest?.(".vm-video[data-explain]");
    if (!strip) return;
    if (e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    explain(strip);
  };
  document.addEventListener("click", open);
  document.addEventListener("keydown", open);
}
