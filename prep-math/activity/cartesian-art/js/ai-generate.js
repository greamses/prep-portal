/* ============================================================================
   Cartesian Art — AI coordinate generation (Phase 7, admin only)
   ----------------------------------------------------------------------------
   An admin describes a picture ("a sailboat") and the model returns the
   connect-the-dots coordinates — several shapes ("Lines"), each an ordered
   polyline with a stroke + fill colour. We map the colour words onto the studio
   palette and drop the shapes onto the grid via setShapes, ready for the admin
   to tweak and Save as a puzzle. Routes through the shared AI layer
   (utils/ai-client.js → /api/ai/groq); admins are premium by default.
   ========================================================================== */

import { setShapes, GRID_MAX } from "./state.js";
import { colorFromWords } from "./parse.js";
import { isAdminUser } from "./puzzles.js";
import { groqGenerate, groqText } from "/utils/ai-client.js";

const $ = (s) => document.querySelector(s);

const DETAIL = {
  simple:   { shapes: "2 to 4", pts: "4 to 12" },
  medium:   { shapes: "3 to 6", pts: "5 to 18" },
  detailed: { shapes: "5 to 9", pts: "6 to 24" },
};

const SYSTEM =
  "You generate connect-the-dots coordinate art for a children's math worksheet. " +
  "You output ONLY a single JSON object — no prose, no markdown, no code fences. " +
  "The art sits on a Cartesian plane; joining each shape's points in order with " +
  "straight segments (closing the loop when closed) must form a clear, recognisable picture.";

function buildPrompt(desc, detail) {
  const d = DETAIL[detail] || DETAIL.medium;
  return (
    `Create coordinate art of: "${desc}".\n` +
    `Return JSON exactly like:\n` +
    `{"title": "...", "shapes": [{"points": [[x,y],[x,y]], "closed": true, "stroke": "orange", "fill": "light yellow"}]}\n` +
    `Rules:\n` +
    `- Use ${d.shapes} shapes; each shape has ${d.pts} integer points.\n` +
    `- All coordinates are integers from -30 to 30, with (0,0) near the picture's centre.\n` +
    `- Order each shape's points so consecutive points connect along the outline (no zig-zag).\n` +
    `- "closed": true joins the last point back to the first; do NOT repeat the first point.\n` +
    `- "stroke" and "fill" are colour words from: red, orange, yellow, light yellow, green, ` +
    `turquoise, blue, indigo, purple, pink, brown, black, white. Use "" for no fill.\n` +
    `- Build the picture from a few big outline shapes plus smaller detail shapes. Keep it simple and recognisable.\n` +
    `Return ONLY the JSON object.`
  );
}

function clampInt(v) {
  return Math.max(-GRID_MAX, Math.min(GRID_MAX, Math.round(Number(v) || 0)));
}

/** Turn the model's JSON into the studio's shape objects. */
function toShapes(data) {
  const list = Array.isArray(data?.shapes) ? data.shapes : [];
  const shapes = [];
  for (const s of list) {
    const pts = (s.points || s.coords || [])
      .map((p) => (Array.isArray(p) ? { x: clampInt(p[0]), y: clampInt(p[1]) } : { x: clampInt(p.x), y: clampInt(p.y) }))
      .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
    if (pts.length < 2) continue;
    shapes.push({
      points: pts,
      closed: !!s.closed && pts.length > 2,
      strokeColor: colorFromWords(s.stroke),
      fillColor: colorFromWords(s.fill),
    });
  }
  return shapes;
}

/** Best-effort JSON extraction (the proxy returns json_object, but be safe). */
function parseJson(text) {
  try { return JSON.parse(text); } catch {}
  const m = text.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}

async function generate() {
  const descEl = $("#ai-desc");
  const status = $("#ai-status");
  const btn = $("#ai-generate");
  const desc = (descEl?.value || "").trim();
  if (!desc) { if (status) status.textContent = "Describe a picture first."; return; }

  btn.disabled = true;
  if (status) status.textContent = "Drawing with AI…";
  try {
    const result = await groqGenerate({
      system: SYSTEM,
      prompt: buildPrompt(desc, $("#ai-detail")?.value),
      json: true,
      temperature: 0.6,
      maxTokens: 4096,
    });
    const data = parseJson(groqText(result));
    const shapes = toShapes(data);
    if (!shapes.length) throw new Error("The AI didn't return any shapes — try a simpler description.");

    setShapes(shapes);
    const titleEl = $("#author-title");
    if (titleEl && data.title) titleEl.value = String(data.title).slice(0, 120);

    const n = shapes.reduce((a, s) => a + s.points.length, 0);
    if (status) status.textContent = `Loaded ${shapes.length} shape${shapes.length === 1 ? "" : "s"} · ${n} points. Edit, then Save as puzzle.`;
    setTimeout(close, 1200);
  } catch (e) {
    if (status) status.textContent = e.message || "Generation failed. Please try again.";
  } finally {
    btn.disabled = false;
  }
}

function open() {
  if (!isAdminUser()) return;
  $("#ca-ai")?.classList.add("is-open");
  $("#ai-desc")?.focus();
}
function close() { $("#ca-ai")?.classList.remove("is-open"); }

export function initAiGenerate() {
  const overlay = $("#ca-ai");
  if (!overlay) return;
  $("#ca-ai-btn")?.addEventListener("click", open);
  $("#ai-close")?.addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  $("#ai-generate")?.addEventListener("click", generate);
  $("#ai-desc")?.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") generate();
  });
}
