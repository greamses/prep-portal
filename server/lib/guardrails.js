/* Server-side safety net for high-risk learner input — the same patterns as
   routes/ai.js GUARDRAILS (kept in step by hand until ai.js moves onto this). */
const GUARDRAILS = [
  {
    re: /\b(kill(ing)? myself|suicid|end my life|take my (own )?life|self[-\s]?harm(?:ing|ed|s)?|harm(?:ing)? myself|cut(ting)? myself)\b/i,
    reply: "I'm really sorry you're feeling like this. You matter, and you don't have to face it alone. Please talk to someone you trust, like a parent, a teacher or a school counsellor, as soon as you can.",
  },
  {
    re: /\b((make|build|making|building)\s+(a\s+)?bomb|explosive device|how to (kill|murder|stab|shoot)\s+(a\s+|someone|people|him|her|them|the))\b/i,
    reply: "I can't help with anything that could hurt people. Let's get back to your schoolwork. What would you like to learn?",
  },
  {
    re: /\b(porn|pornograph|nudes?|sexting|child\s*abuse|\brape\b)\b/i,
    reply: "That isn't something I can help with. I'm your study tutor, so let's keep to your schoolwork.",
  },
];

/** A safe reply when the text must not go to a model, else null. */
function guardrail(text) {
  const t = String(text || "");
  for (const g of GUARDRAILS) if (g.re.test(t)) return g.reply;
  return null;
}

module.exports = { guardrail };
