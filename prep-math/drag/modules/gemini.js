/**
 * modules/gemini.js
 * Generates WORD PROBLEMS only via Gemini AI.
 * Equations, expressions, and inequalities are handled offline in generator.js.
 *
 * Called when: type === 'word' AND geminiKey is present.
 * If no key, the caller (script.js) should show a prompt to add a key.
 */

import { geminiGenerate, geminiText } from '/utils/ai-client.js';

/**
 * Build a word-problem prompt from topic + subtopic.
 * Injects random seed numbers to prevent repetition.
 */
function buildWordPrompt(topic, subtopic, classId) {
    const a = Math.floor(Math.random() * 80) + 5;
    const b = Math.floor(Math.random() * 40) + 3;
    const levelNote = `"${classId}" level (P1-P6 = Primary, JSS1-JSS3 = Junior Secondary, SS1-SS3 = Senior Secondary)`;

    return `You are a math word problem generator for Nigerian school students.

Generate ONE word problem for the topic "${topic}", specifically about: "${subtopic}", at the ${levelNote}.

RULES:
- Write a realistic, age-appropriate scenario. Use Nigerian names, places, or contexts naturally.
- Do NOT include any equation, expression, or worked solution in the "problem" text — the student sets it up themselves.
- The "hint" is ONE sentence: a formula, method, or first step. Do not reveal the answer.
- Vary numbers on every call. Seed values for this question: ${a}, ${b}.
- Match difficulty strictly to the level.
- The problem must be clearly solvable using the concepts in "${subtopic}".

Respond with ONLY a raw JSON object — no markdown, no explanation:
{"type":"word","problem":"<problem text>","hint":"<one sentence hint>"}`;
}

/**
 * Generate a word problem via Gemini API, trying models in fallback chain order.
 *
 * @param {string} topic     - topic group name
 * @param {string} subtopic  - the specific subtopic string from topics.js
 * @param {string} classId   - e.g. 'jss2'
 * @param {string} apiKey    - Gemini API key
 * @returns {Promise<{type:'word', problem:string, hint:string}>}
 * @throws if all models fail
 */
export async function generateWordProblem(topic, subtopic, classId, apiKey) {
    const prompt = buildWordPrompt(topic, subtopic, classId);

    const data = await geminiGenerate({
        key: apiKey,
        body: {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 1.0, maxOutputTokens: 350 },
        },
    });

    const raw    = geminiText(data);
    const clean  = raw.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(clean);

    if (parsed.type !== 'word' || !parsed.problem || !parsed.hint) {
        throw new Error(`Invalid word problem shape: ${clean}`);
    }
    return parsed;
}
