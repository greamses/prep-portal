/* ============================================================================
   Mental Maths Workbook — PREPBOT'S VIDEO for each trick
   ----------------------------------------------------------------------------
   On a Skill development paper every section opens with a strip that says
   "PrepBot explains …". With a video in the table below, the strip plays it
   (on screen: a player opens over the page). With none, it says the video is
   on its way — the SPACE is always there, so a video can be added without
   the paper moving.

   TO ADD A VIDEO, put its address beside the trick's id:

       "vm-eleven": { src: "https://youtu.be/XXXXXXXXXXX" },

   `src` may be a YouTube link (watch, youtu.be, shorts or embed), or the
   address of a video file (.mp4, .webm) — on this site ("/videos/x11.mp4")
   or anywhere else. `title` is optional: without one, the strip uses the
   section's own name.

   Drills papers have no strip: a drill is against the clock.
   ========================================================================== */

export const VIDEOS = {
  /* chapter 1 · adding and taking away */
  "vm-nine": { src: "" },      // complements: all from 9 and the last from 10
  "vm-addc": { src: "" },      // adding with complements
  "vm-subc": { src: "" },      // taking away with complements
  "vm-dbl": { src: "" },       // doubles
  "vm-ndbl": { src: "" },      // near doubles
  "vm-same": { src: "" },      // same difference
  "vm-split": { src: "" },     // split into easy regroupers
  /* chapter 2 · multiplying in your head */
  "vm-eleven": { src: "" },    // × 11
  "vm-five": { src: "" },      // × 5, 25 or 50
  "vm-tens": { src: "" },      // same front, units that make 10
  "vm-cross": { src: "" },     // vertically and crosswise
  "vm-near": { src: "" },      // near a base
  /* chapter 3 · squares */
  "vm-sq5": { src: "" },       // ending in 5
  "vm-sq1": { src: "" },       // ending in 1
  "vm-sqteen": { src: "" },    // starting with 1
  "vm-sqsame": { src: "" },    // same-digit numbers
  "vm-sq50": { src: "" },      // near 50
  "vm-yava": { src: "" },      // near 100
  /* chapter 4 · roots */
  "vm-sqrt": { src: "" },      // square roots
  "vm-cbrt": { src: "" },      // cube roots
  /* chapter 5 · dividing and checking */
  "vm-div9": { src: "" },      // divide by 9
  "vm-root": { src: "" },      // digit sums
  "vm-check9": { src: "" },    // casting out nines
  /* chapter 6 · the Trachtenberg system: one video for each multiplier,
     whichever stage (even digits, odd digits, both) the section is */
  "vm-tr-12": { src: "" },
  "vm-tr-9": { src: "" },
  "vm-tr-8": { src: "" },
  "vm-tr-6": { src: "" },
  "vm-tr-7": { src: "" },
  "vm-tr-5": { src: "" },
};

/** The video for a section, or null. A Trachtenberg section falls back to its multiplier's. */
export function videoFor(ex) {
  const own = VIDEOS[ex.id];
  if (own && own.src) return own;
  const m = /^vm-tr(\d+)/.exec(ex.id);
  const shared = m ? VIDEOS[`vm-tr-${m[1]}`] : null;
  return shared && shared.src ? shared : null;
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/* PrepBot's face: a round-cornered head, two eyes, an aerial. */
const BOT = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="11.2" y="1.6" width="1.6" height="3.4" rx="0.8" fill="#2a2723"/><circle cx="12" cy="2" r="1.5" fill="#f0443e"/>` +
  `<rect x="3" y="5" width="18" height="14.6" rx="4.4" fill="#bfe3ff" stroke="#2a2723" stroke-width="1.2"/>` +
  `<circle cx="8.6" cy="11.4" r="2.1" fill="#2a2723"/><circle cx="15.4" cy="11.4" r="2.1" fill="#2a2723"/><circle cx="9.2" cy="10.8" r="0.7" fill="#fff"/><circle cx="16" cy="10.8" r="0.7" fill="#fff"/>` +
  `<path d="M8.6 15.6Q12 17.8 15.4 15.6" fill="none" stroke="#2a2723" stroke-width="1.2" stroke-linecap="round"/></svg>`;
const PLAY = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.4" fill="#2a2723"/><path d="M9.6 7.4v9.2l7.6-4.6z" fill="#fffdf8"/></svg>`;

/** The strip that opens a section: PrepBot, the trick's name, and the video (or its place). */
export function videoStrip(ex) {
  const v = videoFor(ex);
  const title = (v && v.title) || ex.label;
  return `<div class="vm-video${v ? " has-video" : ""}"${v ? ` data-video="${esc(v.src)}" data-title="${esc(title)}" tabindex="0"` : ""}>` +
    `<span class="vm-video__bot">${BOT}</span>` +
    `<span class="vm-video__say"><b>PrepBot explains</b><em>${esc(title)}</em></span>` +
    `<span class="vm-video__go">${v ? `${PLAY}<i>Watch the video</i>` : "<i>Video coming soon</i>"}</span></div>`;
}

/* ── the player: one for the page, opened by any strip that has a video ──── */

/** A YouTube address as the address its player needs, or null if it is not one. */
function youtube(src) {
  const m = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([\w-]{6,})/.exec(src);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}?autoplay=1&rel=0` : null;
}

function play(src, title) {
  document.querySelector(".vm-player")?.remove();
  const yt = youtube(src);
  const box = document.createElement("div");
  box.className = "vm-player";
  box.innerHTML = `<div class="vm-player__card" role="dialog" aria-modal="true" aria-label="${esc(title)}">` +
    `<div class="vm-player__bar"><span class="vm-video__bot">${BOT}</span><b>${esc(title)}</b><span class="vm-player__close" data-close tabindex="0" aria-label="Close the video">×</span></div>` +
    `<div class="vm-player__frame">${yt
      ? `<iframe src="${esc(yt)}" title="${esc(title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`
      : `<video src="${esc(src)}" controls autoplay playsinline></video>`}</div></div>`;
  const close = () => { box.remove(); document.removeEventListener("keydown", onKey); };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  box.addEventListener("click", (e) => { if (e.target === box || e.target.closest("[data-close]")) close(); });
  document.addEventListener("keydown", onKey);
  document.body.appendChild(box);
}

if (typeof document !== "undefined" && !document.__vmVideo) {
  document.__vmVideo = true;
  const open = (e) => {
    const strip = e.target.closest?.(".vm-video[data-video]");
    if (!strip) return;
    if (e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    play(strip.dataset.video, strip.dataset.title);
  };
  document.addEventListener("click", open);
  document.addEventListener("keydown", open);
}
