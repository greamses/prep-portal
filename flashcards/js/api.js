/* ═══════════════════════════════════════════════════════
   RECALL PRESS — AI CARD GENERATION
   Same fallback pattern as writing/js/api.js: Gemini first,
   Groq as the fallback if Gemini errors or is rate-limited.
═══════════════════════════════════════════════════════ */
import { geminiGenerate, groqGenerate, groqText } from '/utils/ai-client.js';

function canTryFallback(err) {
  return /No Gemini key|API Error|Gemini API|unavailable|over quota|quota|overload|400|403|404|429|503|529/i.test(err?.message || '');
}

function getSystemPrompt() {
  return `You are a flashcard printer for a Nigerian secondary/primary school revision app. Given a class level, subject, and topic, produce concise, accurate spaced-repetition flashcards.

RULES:
- "front" is a short question, term, or prompt (ideally under 90 characters).
- "back" is the complete answer or definition — correct, age-appropriate, and no longer than necessary (aim under 240 characters unless the concept truly needs more).
- Cover distinct sub-ideas within the topic — never repeat the same fact twice.
- Match the class level's curriculum depth — don't ask JSS-level students university-level detail, and don't undershoot SS3 students.
- No markdown, no numbering inside front/back text.

RESPOND ONLY WITH VALID JSON, no markdown fences:
{ "cards": [ { "front": "...", "back": "..." } ] }`;
}

function buildPrompt({ classLabel, subject, topic, count }) {
  return `CLASS: ${classLabel}\nSUBJECT: ${subject}\nTOPIC: ${topic}\n\nGenerate exactly ${count} flashcards as the JSON schema described.`;
}

async function geminiPost(body) {
  const data = await geminiGenerate({ body, key: 'backend' });
  return { data, label: 'Gemini' };
}

async function groqPost({ system, prompt }) {
  const data = await groqGenerate({ system, prompt, json: true, temperature: 0.6, maxTokens: 4096, key: 'backend' });
  return { label: 'Groq', text: groqText(data) };
}

function stripControlChars(text) {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    const isControl = (code <= 0x09) || (code >= 0x0b && code <= 0x1f);
    if (!isControl) out += text[i];
  }
  return out;
}

function parseCards(raw) {
  let text = raw || '';
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object found in AI response');
  text = stripControlChars(text.substring(start, end + 1));
  const parsed = JSON.parse(text);
  const cards = Array.isArray(parsed.cards) ? parsed.cards : [];
  return cards
    .filter((c) => c && c.front && c.back)
    .map((c) => ({ front: String(c.front).trim().slice(0, 300), back: String(c.back).trim().slice(0, 600) }));
}

/**
 * Generate a batch of flashcards for a class/subject/topic.
 * @returns {Promise<{front:string, back:string}[]>}
 */
export async function printCards({ classLabel, subject, topic, count }) {
  const system = getSystemPrompt();
  const prompt = buildPrompt({ classLabel, subject, topic, count });

  try {
    const { data } = await geminiPost({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.6, maxOutputTokens: 4096 },
    });
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cards = parseCards(text);
    if (cards.length) return cards;
    throw new Error('Gemini returned no usable cards');
  } catch (err) {
    if (!canTryFallback(err)) throw err;
    console.warn('[Flashcards] Gemini unavailable; trying Groq fallback:', err.message);
    const { text } = await groqPost({ system, prompt });
    return parseCards(text);
  }
}
