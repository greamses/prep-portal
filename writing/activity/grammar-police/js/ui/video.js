// ===========================================================================
// LEARNING VIDEO - per-topic YouTube lesson, found via Gemini (same approach
// as the theory page). Gemini turns the unit topic into a precise English
// channel-specific search; /api/ai/youtube returns the best matching video.
// Clicks never flip the page, and a page-flip stops/removes any playing video.
// ===========================================================================

import { GEMINI_MODELS } from "/utils/ai-models.js";

const API_BASE = window.location.port === "5500" ? "http://127.0.0.1:5000" : "";
const _cache = {};
const CTRL = new RegExp("[\\u0000-\\u001F]+", "g");

// Kid-friendly English channels (from the theory page's English maps).
const CHANNELS = [
  { name: "Grammar Songs by Melissa", handle: "grammarsongsmelissa" },
  { name: "Scratch Garden", handle: "scratchgarden" },
  { name: "English Tree TV", handle: "englishteetv" },
  { name: "BBC Bitesize", handle: "bbcbitesize" },
  { name: "Khan Academy", handle: "khanacademy" },
  { name: "TED-Ed", handle: "teded" },
];

async function token() {
  if (window._getAuthToken) return window._getAuthToken();
  const { auth } = await import("/firebase-init.js");
  const u = auth.currentUser;
  if (!u) throw new Error("auth");
  return u.getIdToken();
}

// Gemini: plan precise English search queries for this topic.
async function planSearches(topic) {
  const chList = CHANNELS.slice(0, 4).map((c, i) => `Channel ${i + 1}: ${c.name}`).join("\n");
  const prompt = `You are an educational video expert for Nigerian primary/JSS English students.
TOPIC: "${topic}"

CRITICAL: All content must be in ENGLISH. Never suggest Hindi/Urdu/other-language content.
TASK 1 - the single precise grammar/punctuation concept.
TASK 2 - 4 to 6 MUST-MATCH keywords.
TASK 3 - one search query per channel; append "English lesson for kids".

Channels:
${chList}

Return ONLY valid JSON, no markdown:
{
  "topicLabel": "<concept, max 6 words>",
  "mustMatchTerms": ["<kw1>","<kw2>","<kw3>","<kw4>"],
  "searches": [
    { "query": "<Channel> <concept> English lesson for kids", "channel": "<Channel>" },
    { "query": "<Channel> <concept> English lesson for kids", "channel": "<Channel>" },
    { "query": "<Channel> <concept> English lesson for kids", "channel": "<Channel>" },
    { "query": "<Channel> <concept> English lesson for kids", "channel": "<Channel>" }
  ]
}`;

  let tok;
  try { tok = await token(); } catch { return null; }

  for (const modelUrl of GEMINI_MODELS) {
    try {
      const res = await fetch(`${API_BASE}/api/ai/gemini`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
        body: JSON.stringify({
          modelUrl,
          body: {
            systemInstruction: { parts: [{ text: prompt }] },
            contents: [{ parts: [{ text: `Plan English video resources for: ${topic}` }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.3, maxOutputTokens: 700 },
          },
        }),
      });
      if (!res.ok) continue;
      const raw = await res.json();
      const text = raw.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const s = text.indexOf("{"), e = text.lastIndexOf("}");
      if (s < 0 || e < 0) continue;
      return JSON.parse(text.slice(s, e + 1).replace(CTRL, " "));
    } catch { /* next model */ }
  }
  return null;
}

function scoreTitle(title, keywords) {
  const t = title.toLowerCase();
  const bad = ["hindi", "urdu", "tamil", "telugu", "cbse", "ncert"];
  if (bad.some((w) => t.includes(w))) return -100;
  if (!keywords?.length) return 1;
  return keywords.filter((kw) => t.includes(String(kw).toLowerCase())).length;
}

async function ytSearch(query, keywords) {
  const tok = await token();
  const params = new URLSearchParams({
    part: "snippet", type: "video", maxResults: "5", videoEmbeddable: "true",
    safeSearch: "strict", relevanceLanguage: "en", regionCode: "NG", q: `${query} English`,
  });
  const res = await fetch(`${API_BASE}/api/ai/youtube?${params}`, {
    headers: { Authorization: `Bearer ${tok}` },
  });
  if (!res.ok) throw new Error(`yt ${res.status}`);
  const data = await res.json();
  if (!data.items?.length) return null;
  const scored = data.items
    .map((item) => ({ item, score: scoreTitle(item.snippet.title, keywords) }))
    .sort((a, b) => b.score - a.score);
  if (scored[0].score < 1) return null;
  const it = scored[0].item;
  return {
    videoId: it.id.videoId,
    title: it.snippet.title,
    channel: it.snippet.channelTitle,
    thumb: it.snippet.thumbnails?.medium?.url || it.snippet.thumbnails?.default?.url || "",
  };
}

// Find the best video for a topic (cached).
async function findVideo(topic) {
  if (_cache[topic]) return _cache[topic];
  const plan = await planSearches(topic);
  const terms = plan?.mustMatchTerms || topic.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const searches = plan?.searches?.length
    ? plan.searches
    : CHANNELS.slice(0, 4).map((c) => ({ query: `${c.name} ${topic} English lesson for kids`, channel: c.name }));

  for (const s of searches) {
    try {
      const v = await ytSearch(s.query, terms);
      if (v) {
        const out = { ...v, embedUrl: `https://www.youtube-nocookie.com/embed/${v.videoId}?rel=0&modestbranding=1` };
        _cache[topic] = out;
        return out;
      }
    } catch { /* try next */ }
  }
  const c = CHANNELS[0];
  const out = {
    search: `https://www.youtube.com/@${c.handle}/search?query=${encodeURIComponent(topic + " English lesson")}`,
    channel: c.name,
  };
  _cache[topic] = out;
  return out;
}

function esc(s) {
  return String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

// Wire one [data-gp-topic-video] card (event-delegated so restored / retry
// buttons keep working).
export function wireTopicVideo(card) {
  if (!card || card.dataset.wired) return;
  card.dataset.wired = "1";
  const topic = card.dataset.topic || "";
  const stage = card.querySelector(".gp-tvid__stage");

  // Nothing inside the card should ever flip the page.
  ["mousedown", "touchstart"].forEach((ev) =>
    card.addEventListener(ev, (e) => e.stopPropagation(), { passive: true })
  );

  card.addEventListener("click", async (e) => {
    e.stopPropagation();

    const poster = e.target.closest(".gp-tvid__poster");
    if (poster) {
      stage.innerHTML = `<iframe class="gp-vid-frame" src="${poster.dataset.embed}&autoplay=1" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen frameborder="0"></iframe>`;
      return;
    }

    const playBtn = e.target.closest("[data-gp-vid-play]");
    if (!playBtn || card.dataset.loading) return;
    card.dataset.loading = "1";
    stage.innerHTML = `<div class="gp-tvid__loading"><span class="gp-tvid__spin"></span>Finding a lesson video...</div>`;
    try {
      const v = await findVideo(topic);
      if (v.embedUrl) {
        stage.innerHTML = `
          <div class="gp-tvid__poster" data-embed="${esc(v.embedUrl)}" role="button" tabindex="0" aria-label="Play ${esc(v.title)}">
            <img src="${esc(v.thumb)}" alt="" loading="lazy">
            <span class="gp-tvid__play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>
            <span class="gp-tvid__cap">${esc(v.title)} - ${esc(v.channel)}</span>
          </div>`;
      } else {
        stage.innerHTML = `<a class="gp-tvid__searchlink" href="${esc(v.search)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">Search ${esc(v.channel)} on YouTube</a>`;
      }
    } catch {
      stage.innerHTML = `<p class="gp-tvid__err">Couldn't load a video. <button type="button" class="gp-tvid__btn" data-gp-vid-play>Retry</button></p>`;
    } finally {
      card.dataset.loading = "";
    }
  });
}

// Stop/remove every playing video under root (called on page flip + close).
export function stopAllVideos(root) {
  root?.querySelectorAll(".gp-vid-frame").forEach((f) => {
    const stage = f.closest(".gp-tvid__stage");
    f.remove();
    if (stage && !stage.children.length) {
      stage.innerHTML = `<button type="button" class="gp-tvid__btn" data-gp-vid-play>Watch a lesson video</button>`;
    }
  });
}
