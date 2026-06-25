/* ============================================================================
   Cartesian Art — AI coordinate generation (admin)
   ----------------------------------------------------------------------------
   Build a strong prompt from a few inputs, then either:
     • Generate — send it to our in-app bot (utils/ai-client.js → /api/ai/groq), or
     • Copy prompt — copy the full prompt to run on a stronger external bot and
       paste the result back below ("Load result onto grid").
   Everything speaks the worksheet format the studio already understands
   (parse.js), with the World Cup trophy as a worked reference example so the
   model copies its ordering, colours and quality.
   ========================================================================== */

import { setShapes } from "./state.js";
import { parseWorksheet } from "./parse.js";
import { isAdminUser } from "./puzzles.js";
import { groqGenerate, groqText } from "/utils/ai-client.js";

const $ = (s) => document.querySelector(s);

const DETAIL = {
  simple:   { shapes: "2 to 4", pts: "5 to 12 integer" },
  medium:   { shapes: "4 to 6", pts: "6 to 18 integer" },
  detailed: { shapes: "6 to 9", pts: "6 to 26 integer" },
};

/* The reference the user supplied — a recognisable, multi-line worked example. */
const REFERENCE = `Worked example — a World Cup trophy (study its ordering, closed loops and colours):
Object: World Cup trophy
Line 1 {Orange with light yellow fill}: (-4,-11), (-6,-6), (-7,4), (-10,9), (-9,11), (-11,16), (-11,23), (-9,28), (-4,31), (3,31), (9,28), (11,23), (12,19), (11,16), (12,14), (12,12), (8,8), (8,0), (6,-11)
Line 2 {Orange with yellow fill}: (-4,-11), (-2,-2), (-3,5), (-7,13), (-6,21), (-3,21), (-4,14), (-1,9), (0,12), (2,13), (4,11), (4,9), (3,7), (7,13), (7,20), (10,21), (10,14), (8,8), (4,0), (4,-7), (6,-11), (7,-16), (7,-19), (8,-22), (4,-23), (-2,-23), (-6,-22), (-4,-11)
Line 3 {Orange with yellow fill}: (-9,-31), (-8,-32), (-4,-33), (7,-33), (10,-32), (11,-31), (7,-32), (-4,-32), (-9,-31)
Line 4 {Turquoise fill}: (-6,-22), (-7,-25), (-2,-26), (5,-26), (9,-25), (8,-22), (4,-23), (-2,-23), (-6,-22)
Line 5 {Turquoise fill}: (-9,-31), (-4,-32), (7,-32), (11,-31), (10,-28), (6,-29), (-3,-29), (-8,-28), (-9,-31)
Line 6 {Orange with yellow fill}: (-7,-25), (-2,-26), (5,-26), (9,-25), (10,-28), (6,-29), (-3,-29), (-8,-28)`;

const SYSTEM =
  "You are an expert designer of connect-the-dots coordinate art for a children's maths worksheet. " +
  "You picture the object's silhouette, then plot lattice points IN ORDER so that joining them with " +
  "straight line segments reproduces a clear, instantly recognisable picture. You reply with ONLY the " +
  "worksheet text in the requested format — no explanations, no markdown, no code fences.";

/** The single prompt used both for our bot and for copying to outside bots. */
export function buildPrompt(desc, detail, notes) {
  const d = DETAIL[detail] || DETAIL.medium;
  return (
`Design connect-the-dots coordinate art of: "${desc}".${notes ? ` Extra notes: ${notes}.` : ""}

Output EXACTLY this format (one "Line" per shape):
Object: <short name of the picture>
Line 1 {<stroke colour> with <fill colour> fill}: (x,y), (x,y), ...
Line 2 {<colour> fill}: (x,y), ...
Line 3 {<colour>}: (x,y), ...

Rules:
- First sketch the object in your head, then lay the points along its outline.
- Integer coordinates only, roughly within -33..33, centred near (0,0); keep proportions realistic.
- Order each line's points so consecutive points are ADJACENT along the outline — never jump across the figure.
- Build big outline shapes first, then detail shapes (eyes, windows, stripes, base, etc.).
- To close a loop, repeat the first point as the last point of that line.
- Use ${d.shapes} lines; each line has ${d.pts} points.
- Colours are plain words only: red, orange, yellow, light yellow, light orange, green, turquoise, blue, light blue, indigo, purple, pink, brown, black, white. "{Colour}" = stroke only; "{A with B fill}" = stroke A, fill B; "{Colour fill}" = fill only.
- It MUST be recognisable as "${desc}".

${REFERENCE}

Now output ONLY the worksheet for "${desc}".`
  );
}

function extractTitle(text, fallback) {
  const m = text.match(/^\s*(?:object|title|picture)\s*:\s*(.+)$/im);
  return (m ? m[1].trim() : fallback || "Untitled").slice(0, 120);
}

/** Parse worksheet text → load shapes onto the grid + prefill the puzzle title. */
function loadFromText(text, fallbackTitle, status) {
  const shapes = parseWorksheet(text);
  if (!shapes.length) {
    if (status) status.textContent = "Couldn't find any coordinates in that text.";
    return false;
  }
  setShapes(shapes);
  const titleEl = $("#author-title");
  if (titleEl) titleEl.value = extractTitle(text, fallbackTitle);
  const n = shapes.reduce((a, s) => a + s.points.length, 0);
  if (status) status.textContent = `Loaded ${shapes.length} shape${shapes.length === 1 ? "" : "s"} · ${n} points. Edit, then Save as puzzle.`;
  return true;
}

function inputs() {
  return {
    desc: ($("#ai-desc")?.value || "").trim(),
    detail: $("#ai-detail")?.value,
    notes: ($("#ai-notes")?.value || "").trim(),
  };
}

async function generate() {
  const status = $("#ai-status");
  const btn = $("#ai-generate");
  const { desc, detail, notes } = inputs();
  if (!desc) { if (status) status.textContent = "Describe a picture first."; return; }

  btn.disabled = true;
  if (status) status.textContent = "Drawing with AI…";
  try {
    const result = await groqGenerate({
      system: SYSTEM,
      prompt: buildPrompt(desc, detail, notes),
      temperature: 0.5,
      maxTokens: 4096,
    });
    if (loadFromText(groqText(result), desc, status)) setTimeout(close, 1400);
  } catch (e) {
    if (status) status.textContent = e.message || "Generation failed. Please try again.";
  } finally {
    btn.disabled = false;
  }
}

async function copyPrompt() {
  const status = $("#ai-status");
  const { desc, detail, notes } = inputs();
  if (!desc) { if (status) status.textContent = "Describe a picture first."; return; }
  const full = SYSTEM + "\n\n" + buildPrompt(desc, detail, notes);
  const btn = $("#ai-copy");
  const label = btn?.querySelector(".ca-copy-label");
  try {
    await navigator.clipboard.writeText(full);
    if (label) { const p = label.textContent; label.textContent = "Copied!"; setTimeout(() => (label.textContent = p), 1500); }
    if (status) status.textContent = "Prompt copied — paste it into your AI, then bring the result back below.";
  } catch {
    // fallback: drop it into the paste box so it can be copied manually
    const paste = $("#ai-paste");
    if (paste) { paste.value = full; paste.select(); }
    if (status) status.textContent = "Couldn't access the clipboard — prompt placed in the box below; copy it manually.";
  }
}

function loadResult() {
  const status = $("#ai-status");
  const text = $("#ai-paste")?.value || "";
  if (!text.trim()) { if (status) status.textContent = "Paste the AI's worksheet result first."; return; }
  if (loadFromText(text, inputs().desc, status)) setTimeout(close, 1400);
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
  $("#ai-copy")?.addEventListener("click", copyPrompt);
  $("#ai-load")?.addEventListener("click", loadResult);
  $("#ai-desc")?.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") generate();
  });
}
