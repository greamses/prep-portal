// Import shared models from central location
import { SHARED_MODELS } from "/blogs/js/models.js";
export const SUBJECT_MODELS = SHARED_MODELS;

// ─── SUBJECT CONFIGURATION ───────────────────────────────────
export const SUBJECT_CONFIG = {
  name: "Plant Facts",
  collectionName: "plantfacts-posts", // Firestore collection name
  source: "auto-plantfacts-v1", // Source identifier
  apiKeyField: "geminiKey", // Field name in user doc for Gemini API keys
  groqKeyField: "groqKey", // Field name in user doc for Groq API keys
};

// ─── PLANT FACTS TOPICS (P1–P6 - AMAZING BOTANICAL WONDERS) ──────────
export const SUBJECT_TOPICS = [
  // ==================== PRIMARY 1 (Age 5-6) - Weird & Wonderful Plants ====================
  {
    text: "Venus flytrap: The plant that snaps shut like a bear trap to catch flies",
    subject: "plantfacts",
    classLevel: "primary-1",
    complexity: "simple",
  },
  {
    text: "Sunflower: The giant flower that turns its head to follow the sun all day",
    subject: "plantfacts",
    classLevel: "primary-1",
    complexity: "simple",
  },
  {
    text: "Cactus: The spiky plant that stores water like a camel in the desert",
    subject: "plantfacts",
    classLevel: "primary-1",
    complexity: "simple",
  },
  {
    text: "Giant water lily: A leaf so strong a small child can sit on it without sinking",
    subject: "plantfacts",
    classLevel: "primary-1",
    complexity: "simple",
  },
  {
    text: "Dandelion: The flower that turns into a fluffy white ball of flying seeds",
    subject: "plantfacts",
    classLevel: "primary-1",
    complexity: "simple",
  },
  {
    text: "Bamboo: The fastest-growing plant that can grow taller than a house in weeks",
    subject: "plantfacts",
    classLevel: "primary-1",
    complexity: "simple",
  },
  {
    text: "Mimosa pudica (Touch-me-not): The shy plant that folds its leaves when you tickle it",
    subject: "plantfacts",
    classLevel: "primary-1",
    complexity: "simple",
  },
  {
    text: "Coconut palm: The tree that gives us a fruit with water inside and a hard shell boat",
    subject: "plantfacts",
    classLevel: "primary-1",
    complexity: "simple",
  },
  {
    text: "Pumpkin: The fruit that grows into a giant orange ball bigger than a car",
    subject: "plantfacts",
    classLevel: "primary-1",
    complexity: "simple",
  },
  {
    text: "Pineapple: The spiky fruit that takes two whole years to grow just one",
    subject: "plantfacts",
    classLevel: "primary-1",
    complexity: "simple",
  },

  // ==================== PRIMARY 2 (Age 6-7) - Superpowers & Strange Abilities ====================
  {
    text: "Rafflesia arnoldii: The world's biggest flower that smells like rotten meat",
    subject: "plantfacts",
    classLevel: "primary-2",
    complexity: "simple",
  },
  {
    text: "Pitcher plant: The tricky plant that turns its leaf into a deep slippery pit of doom",
    subject: "plantfacts",
    classLevel: "primary-2",
    complexity: "simple",
  },
  {
    text: "Corpse flower (Titan arum): The skyscraper flower that blooms once every 7 years and stinks like dead elephants",
    subject: "plantfacts",
    classLevel: "primary-2",
    complexity: "simple",
  },
  {
    text: "Sundew: The plant with glittering sticky tentacles that sparkle like morning dew but trap insects like flypaper",
    subject: "plantfacts",
    classLevel: "primary-2",
    complexity: "simple",
  },
  {
    text: "Mangrove: The tree that grows in saltwater and stands on stilts like a giant spider",
    subject: "plantfacts",
    classLevel: "primary-2",
    complexity: "simple",
  },
  {
    text: "Baobab tree: The upside-down tree that stores water in its belly like a giant bottle",
    subject: "plantfacts",
    classLevel: "primary-2",
    complexity: "simple",
  },
  {
    text: "Sensitive plant telegraph: How a touched leaf sends electrical signals faster than you can blink",
    subject: "plantfacts",
    classLevel: "primary-2",
    complexity: "simple",
  },
  {
    text: "Bladderwort: The underwater plant with trapdoors faster than a speeding bullet",
    subject: "plantfacts",
    classLevel: "primary-2",
    complexity: "simple",
  },
  {
    text: "Dragon's blood tree: The mushroom-shaped tree that bleeds red sap like a dragon's wound",
    subject: "plantfacts",
    classLevel: "primary-2",
    complexity: "simple",
  },
  {
    text: "Welwitschia mirabilis: The plant that lives 2,000 years with only two leaves that never stop growing",
    subject: "plantfacts",
    classLevel: "primary-2",
    complexity: "simple",
  },
  {
    text: "Ghost plant (Monotropa): The white plant that doesn't need sunlight and steals food from fungi",
    subject: "plantfacts",
    classLevel: "primary-2",
    complexity: "simple",
  },
  {
    text: "Strangler fig: The tree that starts life in the air, then grows down and swallows other trees",
    subject: "plantfacts",
    classLevel: "primary-2",
    complexity: "simple",
  },

  // ==================== PRIMARY 3 (Age 7-8) - Extreme Survival & Defense ====================
  {
    text: "Cacti survival: How cacti turn their stems into water tanks and spines into shade umbrellas",
    subject: "plantfacts",
    classLevel: "primary-3",
    complexity: "simple",
  },
  {
    text: "Stinging nettle: The plant with tiny hypodermic needles that inject a painful chemical cocktail",
    subject: "plantfacts",
    classLevel: "primary-3",
    complexity: "simple",
  },
  {
    text: "Arctic willow: The tiny tree that grows sideways to survive freezing winds at the top of the world",
    subject: "plantfacts",
    classLevel: "primary-3",
    complexity: "simple",
  },
  {
    text: "Resurrection plant: The tumbleweed that dries up completely for years, then turns green with one drop of water",
    subject: "plantfacts",
    classLevel: "primary-3",
    complexity: "simple",
  },
  {
    text: "Acacia tree defense: The tree that calls ant armies to fight giraffes and sends chemical warnings to neighbours",
    subject: "plantfacts",
    classLevel: "primary-3",
    complexity: "simple",
  },
  {
    text: "Lava plants: The first plants that grow on black volcanic rock after a volcano erupts",
    subject: "plantfacts",
    classLevel: "primary-3",
    complexity: "simple",
  },
  {
    text: "Mountain avens: The flower that follows the sun like a satellite dish to stay warm in the Arctic",
    subject: "plantfacts",
    classLevel: "primary-3",
    complexity: "simple",
  },
  {
    text: "Giant sequoia fire armor: The tree with bark thicker than a mattress that needs fire to release its seeds",
    subject: "plantfacts",
    classLevel: "primary-3",
    complexity: "simple",
  },
  {
    text: "Lotus effect: The sacred flower that stays perfectly clean — water and mud just slide right off",
    subject: "plantfacts",
    classLevel: "primary-3",
    complexity: "simple",
  },
  {
    text: "Edelweiss: The woolly star flower that grows on cliff edges and wears a fur coat against UV rays",
    subject: "plantfacts",
    classLevel: "primary-3",
    complexity: "simple",
  },
  {
    text: "Saguaro cactus: The giant cactus that grows arms only after 75 years of waiting",
    subject: "plantfacts",
    classLevel: "primary-3",
    complexity: "simple",
  },
  {
    text: "Stone plant (Lithops): The plant that looks exactly like a pebble so nothing eats it",
    subject: "plantfacts",
    classLevel: "primary-3",
    complexity: "simple",
  },

  // ==================== PRIMARY 4 (Age 8-9) - Weird Plant Families & Life Cycles ====================
  {
    text: "Orchid trickery: Flowers that look and smell like female bees to trick male bees into pollinating them",
    subject: "plantfacts",
    classLevel: "primary-4",
    complexity: "standard",
  },
  {
    text: "Coco de mer: The palm tree with the world's biggest seed — heavier than a baby elephant",
    subject: "plantfacts",
    classLevel: "primary-4",
    complexity: "standard",
  },
  {
    text: "Mushroom (fungi): Not a plant but nature's recycler — the underground network bigger than cities",
    subject: "plantfacts",
    classLevel: "primary-4",
    complexity: "standard",
  },
  {
    text: "Bristlecone pine: The oldest living thing on Earth — trees that were alive before the pyramids were built",
    subject: "plantfacts",
    classLevel: "primary-4",
    complexity: "standard",
  },
  {
    text: "Carnivorous plant traps: How pitcher plants, sundews, and bladderworts each invented their own way to hunt",
    subject: "plantfacts",
    classLevel: "primary-4",
    complexity: "standard",
  },
  {
    text: "Dodder vine (Cuscuta): The vampire plant that sniffs out its victim and sucks the life out of it",
    subject: "plantfacts",
    classLevel: "primary-4",
    complexity: "standard",
  },
  {
    text: 'Walking palm: The tree that grows new roots and slowly "walks" across the forest floor',
    subject: "plantfacts",
    classLevel: "primary-4",
    complexity: "standard",
  },
  {
    text: "Bee orchid: The flower that wears a bee costume so convincing that real bees try to mate with it",
    subject: "plantfacts",
    classLevel: "primary-4",
    complexity: "standard",
  },
  {
    text: "Banyan tree: One tree that becomes a whole forest — with roots growing down from every branch",
    subject: "plantfacts",
    classLevel: "primary-4",
    complexity: "standard",
  },
  {
    text: "Wolffia (Watermeal): The world's smallest flower — you need a magnifying glass to see one bloom",
    subject: "plantfacts",
    classLevel: "primary-4",
    complexity: "standard",
  },
  {
    text: "Helicopter seeds: How maple, ash, and dipterocarp trees invented spinning wings to fly their babies away",
    subject: "plantfacts",
    classLevel: "primary-4",
    complexity: "standard",
  },
  {
    text: "Sausage tree: The tree that grows giant hanging fruits that look like salami and weigh more than a poodle",
    subject: "plantfacts",
    classLevel: "primary-4",
    complexity: "standard",
  },

  // ==================== PRIMARY 5 (Age 9-10) - Extreme Plant Adaptations ====================
  {
    text: "Succulent water storage: How aloe, agave, and living stones hoard water like desert camels",
    subject: "plantfacts",
    classLevel: "primary-5",
    complexity: "standard",
  },
  {
    text: "Redwood trees: The skyscrapers of nature that drink fog through their leaves and share roots with family",
    subject: "plantfacts",
    classLevel: "primary-5",
    complexity: "standard",
  },
  {
    text: "Carnivorous plant digestion: How pitcher plants turn into living stomachs filled with digestive soup",
    subject: "plantfacts",
    classLevel: "primary-5",
    complexity: "standard",
  },
  {
    text: "Mistletoe: The holiday plant that's actually a tree vampire stealing water and nutrients from branches",
    subject: "plantfacts",
    classLevel: "primary-5",
    complexity: "standard",
  },
  {
    text: "Eucalyptus fire strategy: The tree that oils its own leaves to start fires and kill its competition",
    subject: "plantfacts",
    classLevel: "primary-5",
    complexity: "standard",
  },
  {
    text: "Air plants (Tillandsia): The plants that live on nothing but air — no soil, no roots, just floating on breezes",
    subject: "plantfacts",
    classLevel: "primary-5",
    complexity: "standard",
  },
  {
    text: "Corpse flower heating trick: Blooms that heat themselves up to 36°C to spread their stink further",
    subject: "plantfacts",
    classLevel: "primary-5",
    complexity: "standard",
  },
  {
    text: "Bamboo mass flowering: How entire bamboo forests bloom once every 120 years, then die together",
    subject: "plantfacts",
    classLevel: "primary-5",
    complexity: "standard",
  },
  {
    text: "Ant plants (Myrmecophytes): The plants that grow hollow homes and cook meals for ant bodyguards",
    subject: "plantfacts",
    classLevel: "primary-5",
    complexity: "standard",
  },
  {
    text: "Snow plant: The bright red plant that pushes through snow using its own internal heater",
    subject: "plantfacts",
    classLevel: "primary-5",
    complexity: "standard",
  },
  {
    text: "Mangrove salt filters: How these trees drink seawater by filtering salt through special root membranes",
    subject: "plantfacts",
    classLevel: "primary-5",
    complexity: "standard",
  },
  {
    text: "Tumbleweed migration: Plants that break off at the roots and roll for miles, scattering 250,000 seeds",
    subject: "plantfacts",
    classLevel: "primary-5",
    complexity: "standard",
  },

  // ==================== PRIMARY 6 (Age 10-11) - Plant Intelligence & Communication ====================
  {
    text: "Wood Wide Web: How trees talk to each other through underground fungal internet",
    subject: "plantfacts",
    classLevel: "primary-6",
    complexity: "standard",
  },
  {
    text: "Plant memory: How Venus flytraps count to 5 before snapping shut and remember which hairs were touched",
    subject: "plantfacts",
    classLevel: "primary-6",
    complexity: "standard",
  },
  {
    text: "Acacia tree warning system: Trees that smell their neighbours being eaten and pump poison into their leaves",
    subject: "plantfacts",
    classLevel: "primary-6",
    complexity: "standard",
  },
  {
    text: "Root intelligence: How plant roots choose the best path through soil, avoiding rocks and finding water",
    subject: "plantfacts",
    classLevel: "primary-6",
    complexity: "standard",
  },
  {
    text: "Plant timekeeping: The internal clocks that tell sunflowers when to face east and flowers when to bloom",
    subject: "plantfacts",
    classLevel: "primary-6",
    complexity: "standard",
  },
  {
    text: "Mother tree nurturing: How the oldest trees feed seedlings sugar through their roots and recognize their own offspring",
    subject: "plantfacts",
    classLevel: "primary-6",
    complexity: "standard",
  },
  {
    text: "Dodder vine decision making: The parasitic plant that sniffs out tomato vs. wheat and chooses the best victim",
    subject: "plantfacts",
    classLevel: "primary-6",
    complexity: "standard",
  },
  {
    text: "Mimosa learning: How the sensitive plant remembers that dripping water is safe and stops folding its leaves",
    subject: "plantfacts",
    classLevel: "primary-6",
    complexity: "standard",
  },
  {
    text: "Plant electrical signalling: How wounded plants send electrical impulses faster than your nerve signals",
    subject: "plantfacts",
    classLevel: "primary-6",
    complexity: "standard",
  },
  {
    text: "Killer plant cooperation: How some pitcher plants work with ants — the ants hunt large prey for the plant",
    subject: "plantfacts",
    classLevel: "primary-6",
    complexity: "standard",
  },
  {
    text: "Bean plant risk assessment: How pea plants gamble — growing more roots when nutrients are steady, more shoots when risky",
    subject: "plantfacts",
    classLevel: "primary-6",
    complexity: "standard",
  },
  {
    text: "Flower sonar: How some flowers use their petals like satellite dishes to reflect bat sonar and attract pollinators",
    subject: "plantfacts",
    classLevel: "primary-6",
    complexity: "standard",
  },
];

// ─── SUBJECT LABELS & STYLES ───────────────────────────────
export const SUBJECT_LABELS = {
  plantfacts: "Plant Facts",
  botany: "Botany",
  horticulture: "Horticulture",
};

export const SUBJECT_STYLES = {
  plantfacts: "sci-plantfacts",
  botany: "sci-botany",
  horticulture: "sci-horticulture",
};

export const CLASS_LABELS = {
  primary: (n) => `P${n}`,
  jss: (n) => `JSS ${n}`,
  ss: (n) => `SS ${n}`,
};

export const CLASS_STYLES = {
  primary: "cls-primary",
  jss: "cls-jss",
  ss: "cls-ss",
};

// ─── HOOK STYLES FOR ROTATION ──────────────────────────────
const HOOK_STYLES = ["question", "descriptive", "story", "wildKratts"];

// ─── EXTRACTED HOOK CONTENT BY LEVEL AND STYLE ─────────────
const HOOK_CONTENT = {
  primary: {
    question: `**HOOK TYPE: QUESTION**

Open your lesson with a question that makes a child stop and wonder about the plant world.

**Use one of these patterns:**

**The "Did You Know" Question:**
"Did you know there's a flower that smells like rotting meat? ... (pause) ... It's not a trick — it's the rafflesia, the biggest flower in the world!"

**The "Have You Ever" Question:**
"Have you ever seen a plant move when you touch it? ... (pause) ... There's a shy plant called mimosa pudica that folds its leaves when tickled!"

**The "What If" Question:**
"What if I told you there's a tree that can walk across the forest? ... (pause) ... The walking palm grows new roots and slowly moves to find sunlight!"

**The "Can You Imagine" Question:**
"Can you imagine a plant that eats bugs faster than you can blink? ... (pause) ... The bladderwort has trapdoors that snap shut in less than a millisecond!"

**The "I Bet You Can't" Question:**
"I bet you can't name the oldest living thing on Earth. ... (pause) ... It's a bristlecone pine tree that was alive before the pyramids were built!"

**Adapt for your specific plant:** Replace the example with your plant. Keep the energy high and the pause clear.`,

    descriptive: `**HOOK TYPE: DESCRIPTIVE**

Paint a picture with your words. Tell the child to close their eyes and SEE the plant.

**Use one of these patterns:**

**Sight Hook:**
"Close your eyes. Picture a flower as wide as a car tire. Its petals are deep red with white spots, and from its center rises a spike taller than your teacher. But here's the surprise — it smells like rotten meat! This is the corpse flower."

**Sound Hook:**
"Close your eyes and listen. Rustle-rustle. That's a strangler fig growing. It starts as a tiny seed dropped on a branch, then sends roots down like living ropes, wrapping around the tree until it becomes a tree itself."

**Touch Hook:**
"Imagine touching a plant that feels like soft velvet. But wait — tiny hairs on this plant are actually hollow needles filled with stinging chemicals. Touch it, and your hand tingles for hours. This is the stinging nettle."

**Action Hook:**
"Picture a plant that moves so fast you can't see it. Inside a Venus flytrap, an ant brushes against a tiny hair. One second. Two seconds. On the third touch — SNAP! The trap closes like a green bear trap."

**Adapt for your specific plant:** Replace the example with your plant. Keep it to 3-4 sentences. Use ONE sense at a time.`,

    story: `**HOOK TYPE: STORY**

Tell a short story with a plant character, a small problem, and a fascinating solution.

**Use one of these patterns:**

**The Venus Flytrap's Snack:**
"Vinnie the Venus flytrap was hungry. His leaves were open wide, showing sweet nectar to passing bugs. 'Come closer,' he whispered. A fly landed and brushed a trigger hair. Vinnie counted quietly: 'One...' The fly walked again. 'Two...' A third touch — SNAP! 'Gotcha!' Vinnie cheered. 'Now I have lunch!'"

**The Mimosa's Lesson:**
"Mimi the mimosa was scared. Every time a raindrop hit her leaves, she folded up tight. But after lots of rain, Mimi learned — raindrops don't hurt. She stayed open through the next shower. 'I remember now,' Mimi whispered. 'Rain is safe. Wind is safe. But grasshoppers — still scary!'"

**The Sunflower's Dance:**
"Sunny the sunflower loved the morning. As the sun peeked over the hills, Sunny turned her head to face it. All day long, she danced — slowly, slowly — following the sun across the sky. At night, she reset to the east, waiting for dawn. 'I never miss a sunrise,' Sunny said proudly."

**Adapt for your specific plant:** Create a character. Give them a simple problem. Let the plant's unique ability solve it. Keep it to 4-5 sentences.`,

    wildKratts: `**HOOK TYPE: WILD KRATTS (PLANT EXPLORER STYLE)**

Channel the energy of a plant explorer — excitement, discovery, and botanical superpowers!

**Use one of these patterns:**

**The Plant Power Challenge:**
"Explorer style — what if YOU could have the powers of this plant? Imagine saying: 'ACTIVATE PITCHER PLANT POWER!' Your hands would turn into deep slippery pits that trap your lunch for you. Cool, right? Let's find out how pitcher plants do it."

**The "Wow Fact" Opening:**
"PLANT EXPLORER WOW FACT: There's a plant that can count! It literally counts to five before it snaps shut on its prey. It's called a Venus flytrap, and today we're going botanical exploring!"

**The Habitat Sneak:**
"Grab your magnifying glass — we're going on a plant adventure! Today we're diving into the tropical rainforest to find a flower bigger than a car tire. It blooms once every seven years and stinks like rotting meat. The corpse flower is waiting — let's go!"

**The Superpower Comparison:**
"Every plant has a superpower. The resurrection plant? It can dry up completely for 100 years, then turn green again with one drop of water. If you had RESURRECTION POWER, you'd never stay dead. Ever. Let's learn how."

**Adapt for your specific plant:** Use plant explorer energy. Mention "plant powers" or "botanical adventure." Keep it excited and punchy.`,
  },

  jss: {
    wildKratts: `**HOOK TYPE: PLANT EXPLORER (JSS Level)**

Channel plant discovery energy but with more scientific depth — still fun, but ready for deeper botany.

**Pattern:**
"Any plant explorer would lose their mind over this species. The dodder vine doesn't just grow — it sniffs. It detects the chemical scent of its victim and grows toward it, choosing tomato over wheat every time. Imagine: 'DODDER POWER — ACTIVATE!' And you'd have your own built-in chemical detection system to find exactly what you need. That's not magic — that's real plant behavior. Let me show you how this vampire plant chooses its prey."`,
  },

  ss: {
    wildKratts: `**HOOK TYPE: PLANT EXPLORER (SS Level - Engagement Hook)**

Use the plant explorer frame as a fun entry point before diving into rigorous biology.

**Pattern:**
"You might think plants are boring. They just sit there, right? Wrong. Plants count, remember, communicate, and make decisions. The Venus flytrap does arithmetic. Acacia trees warn each other of danger through chemical signals. Today we'll go from 'cool plant fact' to the actual molecular biology and electrophysiology behind it. Plants have been underestimated for too long."`,
  },
};

// ─── TONE GUIDES ────────────────────────────────────
function getToneGuide(levelType) {
  const toneGuides = {
    primary: `You are an enthusiastic plant explorer (like a botanical adventurer) talking to kids ages 5-11.

**Key rules:**
- Be amazed by the plants — your excitement is contagious
- Use short, punchy sentences
- Say "WOW!" "Check this out!" "You won't believe this!"
- Compare plant abilities to things kids know (superheroes, video games, sports)
- Ask "Can you imagine..." and "What if YOU could..."
- End with a challenge: "Now go tell someone about this amazing plant!"`,

    jss: `You are a botany educator for ages 11-14. Keep the wonder but add more science.

**Key rules:**
- Start with the "wow" factor, then explain the "how"
- Use analogies that teens get (video games, social media, sports)
- Connect plant abilities to biology concepts
- Call out common myths about the plant
- End with a "deeper dive" question for curious students`,

    ss: `You are a botany teacher for ages 14-18. Rigorous but still fascinating.

**Key rules:**
- Respect that they love plants but need exam-level knowledge
- Explain evolutionary WHY behind each adaptation
- Use proper taxonomic and anatomical terminology
- Connect plant facts to broader biological principles
- Include exam-style application questions`,
  };

  return toneGuides[levelType];
}

// ─── SUBJECT-SPECIFIC PROMPT BUILDER (modified for plant facts) ───
export function buildSubjectPrompt(topic, topicIndex = 0) {
  const { text, subject, classLevel } = topic;
  const levelType = classLevel.startsWith("primary")
    ? "primary"
    : classLevel.startsWith("jss")
      ? "jss"
      : "ss";
  const classNum = classLevel.split("-")[1];

  return `You are a master botanical educator creating an exciting lesson on: "${text}"

## YOUR TEACHING STYLE:
You teach like a plant explorer — full of wonder, excitement, and "plant power" energy. Every lesson makes kids say "WHOA!" and want to learn more about the botanical world.

## LESSON STRUCTURE:

**1. The Hook (2-3 sentences)** — Grab attention with a plant explorer-style wow fact or question.

**2. Meet the Plant (4-5 sentences)** — Describe what this plant looks like, where it grows, and why it's unique.

**3. The Amazing Ability (8-10 sentences)** — Explain the plant's superpower. Break down HOW it works in simple terms. Use comparisons kids understand.

**4. Plant Power Breakdown (3-4 sentences)** — If a human had this plant's power, what could they do? Make it fun and imaginative.

**5. Quick Quiz (2-3 questions)** — Fun recall questions to check understanding.

## LANGUAGE RULES:
- Be EXCITED! Use exclamation points, "wow," "amazing," "incredible"
- Short sentences for primary, longer for upper levels
- Compare to things kids know (superheroes, sports, video games)
- Never be boring — this is the coolest plant facts ever!

## CRITICAL FORMATTING:
- Use only HTML tags (<h3>, <p>, <ul>, <li>)
- No markdown
- Keep paragraphs short

Now write the lesson! Make it AMAZING!`;
}

// ─── HELPER FUNCTION TO GENERATE ALL PROMPTS ─────────────────
export function generateAllPrompts() {
  return SUBJECT_TOPICS.map((topic, index) => ({
    ...topic,
    prompt: buildSubjectPrompt(topic, index),
    hookStyle: HOOK_STYLES[index % HOOK_STYLES.length],
  }));
}

// ─── EXPORTS ─────────────────────────────────────────
export { HOOK_STYLES, HOOK_CONTENT, getToneGuide };
