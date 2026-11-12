/* ============================================================================
   VOICE AVATARS — the premium (ElevenLabs) voices PrepBot and PrepBoard speak
   in, each shown as its own drawn character instead of a name.
   ----------------------------------------------------------------------------
     ELEVEN_VOICES          the six voices: "dansum" (Teacher Dansum's own,
                            the default) and five of ElevenLabs' default voices
     avatarSvg(look)        one character's face, a filled SVG
     getVoiceKey() / setVoiceKey(key)
                            PrepBot's chosen voice (shared by the chat and the
                            lesson teacher; a "pp-voice-change" event on window)
     voicePicker({ voices, value, onPick, label })
                            a key showing the chosen face; it opens a small
                            receipt of faces, the chosen one ticked. Names live
                            only in the tooltip and aria-label.

   The server (server/routes/tts.js) takes "dansum" and finds that voice on the
   account by its name, and accepts only these ids.
   ========================================================================== */

/* skin, hair, shirt and background, from the site's soft paint colours */
const SKIN = { a: "#f3d2b3", b: "#d9a679", c: "#a8714a", d: "#6e4429", e: "#4a2c1a" };

export const ELEVEN_VOICES = [
  { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice", note: "clear, British",
    look: { skin: SKIN.a, hair: "bob", hairC: "#c98b3c", shirt: "#c2527a", bg: "#f6d6e0" } },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian", note: "deep, American",
    look: { skin: SKIN.b, hair: "side", hairC: "#5a3a22", shirt: "#4f7a3a", bg: "#dcebcf", beard: true } },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", note: "warm, American",
    look: { skin: SKIN.e, hair: "puffs", hairC: "#17100b", shirt: "#d98b2b", bg: "#f8e3c2", earrings: true } },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", note: "easy-going, Australian",
    look: { skin: SKIN.c, hair: "curly", hairC: "#2a1a10", shirt: "#7058a8", bg: "#e2dbf3", cap: "#d9534f" } },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", note: "gentle, British",
    look: { skin: SKIN.a, hair: "long", hairC: "#8a4b25", shirt: "#3b8f86", bg: "#d3eeea", glasses: true } },
  { id: "dansum", name: "Teacher Dansum", note: "the teacher's own voice",
    look: { skin: SKIN.d, hair: "short", hairC: "#1b1410", shirt: "#2f6f8f", bg: "#cfe6ef", beard: true, glasses: true } },
];
/* Alice, ElevenLabs' clear educator, since 2026-11-12: the cloned voice was not close enough
   ("I dont think eleven labs have cloned it perfectly"). Teacher Dansum's stays in the picker. */
export const DEFAULT_VOICE = "Xb7hH8MSUJpSbSDYk0k2";
export const voiceOf = (id) => ELEVEN_VOICES.find((v) => v.id === id) || null;

/** One character's face (head and shoulders), 48×48, filled shapes only. */
export function avatarSvg(look = {}) {
  const { skin = SKIN.b, hair = "short", hairC = "#2a1a10", shirt = "#4f6f8f", bg = "#e6e1d8" } = look;
  const back = {
    long: `<path d="M12 22c0-9 5-14 12-14s12 5 12 14v16H12z" fill="${hairC}"/>`,
    bob: `<path d="M13 24c0-9 4.5-14 11-14s11 5 11 14v6h-22z" fill="${hairC}"/>`,
    puffs: `<circle cx="13" cy="13" r="5.4" fill="${hairC}"/><circle cx="35" cy="13" r="5.4" fill="${hairC}"/>`,
    curly: "", short: "", side: "",
  }[hair] || "";
  const front = {
    short: `<path d="M15 21c0-7 4-10.5 9-10.5s9 3.5 9 10.5c-2-3-5-4.4-9-4.4s-7 1.4-9 4.4z" fill="${hairC}"/>`,
    side: `<path d="M15 22c-.4-8 4-11.5 9.4-11.5 5 0 8.8 3 8.6 10-3.4-2.6-8-3.6-13.6-1.6-1.6.6-3 1.6-4.4 3.1z" fill="${hairC}"/>`,
    bob: `<path d="M15 20c1-6 4.6-8.6 9-8.6s8 2.6 9 8.6c-4-.6-7-2.4-9-4.6-2 2.2-5 4-9 4.6z" fill="${hairC}"/>`,
    long: `<path d="M15 21c1-6.4 4.4-9.2 9-9.2s8 2.8 9 9.2c-3.4-1-6.6-3-9-5.4-2.4 2.4-5.6 4.4-9 5.4z" fill="${hairC}"/>`,
    puffs: `<path d="M15.6 19.4c.8-5.6 4-8.4 8.4-8.4s7.6 2.8 8.4 8.4c-2.6-1.6-5.4-2.4-8.4-2.4s-5.8.8-8.4 2.4z" fill="${hairC}"/>`,
    curly: [[16, 16], [19.5, 12.6], [24, 11.4], [28.5, 12.6], [32, 16], [17.4, 19.4], [30.6, 19.4]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.6" fill="${hairC}"/>`).join(""),
  }[hair] || "";
  const beard = look.beard ? `<path d="M15.8 25c.6 6.4 3.8 10 8.2 10s7.6-3.6 8.2-10c-1.4 2.6-3.2 3.8-4.6 3.8-1.4-1-2.4-1.4-3.6-1.4s-2.2.4-3.6 1.4c-1.4 0-3.2-1.2-4.6-3.8z" fill="${look.hairC || "#2a1a10"}"/>` : "";
  const glasses = look.glasses ? `<g fill="#2a2723"><path d="M16.4 21.2h6v4.4h-6zM25.6 21.2h6v4.4h-6zM22.4 22.4h3.2v1.2h-3.2z"/></g><g fill="#fff" opacity=".55"><path d="M17.4 22.2h4v2.4h-4zM26.6 22.2h4v2.4h-4z"/></g>` : "";
  const ears = look.earrings ? `<circle cx="14.6" cy="28" r="1.5" fill="#e8b93a"/><circle cx="33.4" cy="28" r="1.5" fill="#e8b93a"/>` : "";
  const cap = look.cap ? `<path d="M14.6 18.6c0-6.4 4-9.6 9.4-9.6s9.4 3.2 9.4 9.6z" fill="${look.cap}"/><path d="M24 17.4h13.4c.8 0 .8 1.8 0 1.8H24z" fill="${look.cap}"/>` : "";
  const eyes = look.glasses ? `<circle cx="19.4" cy="23.4" r="1.15" fill="#2a2723"/><circle cx="28.6" cy="23.4" r="1.15" fill="#2a2723"/>`
    : `<circle cx="19.6" cy="23.4" r="1.35" fill="#2a2723"/><circle cx="28.4" cy="23.4" r="1.35" fill="#2a2723"/>`;
  return `<svg viewBox="0 0 48 48" aria-hidden="true" class="pp-vav">`
    + `<circle cx="24" cy="24" r="24" fill="${bg}"/>`
    + back
    + `<path d="M8 48c0-9 7-14 16-14s16 5 16 14z" fill="${shirt}"/>`
    + `<path d="M20.6 31h6.8v5.4c-1 1.4-2.2 2-3.4 2s-2.4-.6-3.4-2z" fill="${skin}"/>`
    + `<ellipse cx="14.8" cy="24.6" rx="2" ry="2.6" fill="${skin}"/><ellipse cx="33.2" cy="24.6" rx="2" ry="2.6" fill="${skin}"/>`
    + `<ellipse cx="24" cy="23.4" rx="9.2" ry="10.6" fill="${skin}"/>`
    + ears + beard + front + cap + eyes
    + `<path d="M20.6 28.6c1 1.2 2.1 1.8 3.4 1.8s2.4-.6 3.4-1.8c-.9.4-2 .6-3.4.6s-2.5-.2-3.4-.6z" fill="#8a3b33"/>`
    + glasses
    + `</svg>`;
}

/* ── PrepBot's chosen voice (the chat and the lesson teacher share it) ── */
const KEY = "pp-voice2"; // a new key: everyone starts on the new default
export function getVoiceKey() {
  try { const v = localStorage.getItem(KEY); if (voiceOf(v)) return v; } catch {}
  return DEFAULT_VOICE;
}
export function setVoiceKey(id) {
  if (!voiceOf(id)) return;
  try { localStorage.setItem(KEY, id); } catch {}
  window.dispatchEvent(new CustomEvent("pp-voice-change", { detail: { id } }));
}

/* ── the picker ── */
let styled = false;
function style() {
  if (styled) return;
  styled = true;
  const css = document.createElement("style");
  css.textContent = `
.pp-vpick{position:relative;display:inline-flex}
.pp-vpick__key{width:2.4rem;height:2.4rem;padding:0;border-radius:50%;display:inline-grid;place-items:center;cursor:pointer;background:none;border:0}
.pp-vpick__key .pp-vav{width:2.1rem;height:2.1rem;display:block}
.pp-vpick__pop{position:fixed;z-index:10200;min-width:12.5rem}
.pp-vpick__pop[hidden]{display:none}
.pp-vpick__paper{padding:.75rem .8rem .9rem}
.pp-vpick__head{margin:0 0 .5rem;font:600 .72rem/1.3 var(--font-mono,monospace);color:#5c564d;text-transform:uppercase;letter-spacing:.06em}
.pp-vpick__grid{display:grid;grid-template-columns:repeat(3,3.1rem);gap:.45rem}
.pp-vpick__face{position:relative;width:3.1rem;height:3.1rem;padding:0;border-radius:50%;background:none;border:0;cursor:pointer;display:grid;place-items:center}
.pp-vpick__face .pp-vav{width:2.9rem;height:2.9rem;display:block}
.pp-vpick__face:focus-visible{outline:2px solid var(--accent-secondary,#2f6f8f);outline-offset:2px}
.pp-vpick__tick{position:absolute;right:-.15rem;bottom:-.15rem;width:1.15rem;height:1.15rem;display:none}
.pp-vpick__face[aria-checked="true"] .pp-vpick__tick{display:block}
`;
  document.head.appendChild(css);
}
const TICK = `<svg class="pp-vpick__tick" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="10" fill="var(--accent-success,#3f8f5a)"/><path d="M5.6 10.4l2.9 2.9 5.9-6.1-1.5-1.4-4.4 4.6-1.4-1.4z" fill="#fff"/></svg>`;

/**
 * voices: [{ id, name, note, look, group? }] — `group` names a heading
 * ("Premium", "Free") when the faces come in more than one set.
 */
export function voicePicker({ voices = ELEVEN_VOICES, value = DEFAULT_VOICE, onPick = () => {}, label = "The voice PrepBot speaks in", tipSide = "bottom" } = {}) {
  style();
  const wrap = document.createElement("span");
  wrap.className = "pp-vpick";
  const key = document.createElement("button");
  key.type = "button";
  key.className = "pp-vpick__key pp-plain";
  key.setAttribute("aria-haspopup", "dialog");
  key.setAttribute("aria-expanded", "false");
  key.dataset.tipSide = tipSide;
  const pop = document.createElement("div");
  pop.className = "pp-receipt pp-vpick__pop";
  pop.hidden = true;
  pop.setAttribute("role", "dialog");
  pop.setAttribute("aria-label", label);
  wrap.appendChild(key);
  document.body.appendChild(pop);

  let list = voices;
  let current = value;
  const tipOf = (v) => `${v.name}${v.note ? ` — ${v.note}` : ""}`;
  function drawKey() {
    const v = list.find((x) => x.id === current) || list[0];
    if (!v) return;
    key.innerHTML = avatarSvg(v.look);
    key.dataset.tip = `${label}: ${tipOf(v)}`;
    key.setAttribute("aria-label", `${label}: ${v.name}`);
  }
  function drawPop() {
    const groups = [];
    list.forEach((v) => {
      const g = v.group || "";
      let at = groups.find((x) => x.name === g);
      if (!at) groups.push(at = { name: g, voices: [] });
      at.voices.push(v);
    });
    pop.innerHTML = `<div class="pp-receipt__paper pp-vpick__paper">${groups.map((g) => `
      ${g.name || groups.length > 1 ? `<p class="pp-vpick__head">${g.name}</p>` : `<p class="pp-vpick__head">${label}</p>`}
      <div class="pp-vpick__grid" role="radiogroup">${g.voices.map((v) => `
        <button type="button" class="pp-vpick__face pp-plain" role="radio" aria-checked="${v.id === current}" data-voice="${v.id}" data-tip="${tipOf(v)}" aria-label="${v.name}${v.note ? `, ${v.note}` : ""}">${avatarSvg(v.look)}${TICK}</button>`).join("")}
      </div>`).join("")}</div>`;
  }
  function place() {
    const r = key.getBoundingClientRect();
    const w = pop.offsetWidth || 240;
    pop.style.left = `${Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2))}px`;
    const below = r.bottom + 8;
    const h = pop.offsetHeight || 160;
    pop.style.top = `${below + h > window.innerHeight - 8 ? Math.max(8, r.top - h - 8) : below}px`;
  }
  function open(on) {
    pop.hidden = !on;
    key.setAttribute("aria-expanded", String(on));
    if (on) { drawPop(); place(); pop.querySelector('[aria-checked="true"]')?.focus(); }
  }
  key.addEventListener("click", (e) => { e.stopPropagation(); open(pop.hidden); });
  pop.addEventListener("click", (e) => {
    e.stopPropagation();
    const b = e.target.closest("[data-voice]");
    if (!b) return;
    current = b.dataset.voice;
    drawKey();
    open(false);
    key.focus();
    onPick(current);
  });
  pop.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { open(false); key.focus(); return; }
    if (!/^Arrow(Left|Right|Up|Down)$/.test(e.key)) return;
    const faces = [...pop.querySelectorAll("[data-voice]")];
    const i = faces.indexOf(document.activeElement);
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : e.key === "ArrowDown" ? 3 : -3;
    faces[(i + step + faces.length) % faces.length]?.focus();
    e.preventDefault();
  });
  document.addEventListener("pointerdown", (e) => { if (!pop.hidden && !pop.contains(e.target) && !key.contains(e.target)) open(false); });
  window.addEventListener("resize", () => { if (!pop.hidden) place(); });
  drawKey();
  return {
    el: wrap,
    key,
    get value() { return current; },
    set(id) { current = id; drawKey(); if (!pop.hidden) drawPop(); },
    setVoices(v) { list = v; if (!list.some((x) => x.id === current) && list[0]) current = list[0].id; drawKey(); if (!pop.hidden) drawPop(); },
    open: () => open(true),
  };
}
