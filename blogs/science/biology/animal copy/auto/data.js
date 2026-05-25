// Import shared models from central location
import { SHARED_MODELS } from "/blogs/js/models.js";
export const SUBJECT_MODELS = SHARED_MODELS;

// ─── SUBJECT CONFIGURATION ───────────────────────────────────
export const SUBJECT_CONFIG = {
  name: "Animal Facts",
  collectionName: "animalfacts-posts", // Firestore collection name
  source: "auto-animalfacts-v1", // Source identifier
  apiKeyField: "geminiKey", // Field name in user doc for Gemini API keys
  groqKeyField: "groqKey", // Field name in user doc for Groq API keys
};

// ─── ANIMAL FACTS TOPICS (P1–P6 - UNIQUE & FASCINATING ANIMALS) ──────────
export const SUBJECT_TOPICS = [
  // ==================== PRIMARY 1 (Age 5-6) - Weird & Wonderful Creatures ====================
  {
    text: "Pangolin: The only mammal covered in scales like a moving pineapple",
    subject: "animalfacts",
    classLevel: "primary-1",
    complexity: "simple",
  },
  {
    text: "Aardvark: Nighttime digger with a long sticky tongue like a living vacuum",
    subject: "animalfacts",
    classLevel: "primary-1",
    complexity: "simple",
  },
  {
    text: "Slow loris: The world's only venomous primate with eyes like dinner plates",
    subject: "animalfacts",
    classLevel: "primary-1",
    complexity: "simple",
  },
  {
    text: "Axolotl: Smiling salamander that never grows up and can regrow its legs",
    subject: "animalfacts",
    classLevel: "primary-1",
    complexity: "simple",
  },
  {
    text: "Naked mole rat: Wrinkly, nearly hairless, and feels no pain from spicy food",
    subject: "animalfacts",
    classLevel: "primary-1",
    complexity: "simple",
  },
  {
    text: "Fossa: Madagascar's top predator that looks like a cat-dog-weasel mix",
    subject: "animalfacts",
    classLevel: "primary-1",
    complexity: "simple",
  },
  {
    text: "Okapi: Giraffe's secret cousin with zebra-striped legs hiding in the forest",
    subject: "animalfacts",
    classLevel: "primary-1",
    complexity: "simple",
  },
  {
    text: "Dumbo octopus: Deep-sea ear-flapping octopus that looks like a cartoon",
    subject: "animalfacts",
    classLevel: "primary-1",
    complexity: "simple",
  },
  {
    text: "Markhor: Screw-horned goat that climbs cliffs like a superhero",
    subject: "animalfacts",
    classLevel: "primary-1",
    complexity: "simple",
  },
  {
    text: "Saiga antelope: Nose like a vacuum hose, lives in frozen deserts",
    subject: "animalfacts",
    classLevel: "primary-1",
    complexity: "simple",
  },

  // ==================== PRIMARY 2 (Age 6-7) - Superpowers & Strange Abilities ====================
  {
    text: "Tardigrade (Water Bear): Microscopic creature that survives space, boiling, and freezing",
    subject: "animalfacts",
    classLevel: "primary-2",
    complexity: "simple",
  },
  {
    text: "Mantis shrimp: Punch like a bullet, sees 16 colors (humans see 3!)",
    subject: "animalfacts",
    classLevel: "primary-2",
    complexity: "simple",
  },
  {
    text: "Glass frog: See-through belly where you can watch its heart beat",
    subject: "animalfacts",
    classLevel: "primary-2",
    complexity: "simple",
  },
  {
    text: "Hairy frog: Breaks its own toe bones to push out claws like Wolverine",
    subject: "animalfacts",
    classLevel: "primary-2",
    complexity: "simple",
  },
  {
    text: "Star-nosed mole: Nose with 22 pink tentacles that feel faster than eyes",
    subject: "animalfacts",
    classLevel: "primary-2",
    complexity: "simple",
  },
  {
    text: "Lyrebird: Can copy chainsaws, camera shutters, and car alarms perfectly",
    subject: "animalfacts",
    classLevel: "primary-2",
    complexity: "simple",
  },
  {
    text: "Cuttlefish: Ocean chameleon with W-shaped pupils and hypnotic color waves",
    subject: "animalfacts",
    classLevel: "primary-2",
    complexity: "simple",
  },
  {
    text: "Shoebill stork: Bird that stands completely still then clatters its beak like machine gun",
    subject: "animalfacts",
    classLevel: "primary-2",
    complexity: "simple",
  },
  {
    text: "Blobfish: Looks like a sad old man but that's just its deep-sea travel face",
    subject: "animalfacts",
    classLevel: "primary-2",
    complexity: "simple",
  },
  {
    text: "Yeti crab: Fuzzy white claws that farm bacteria for food in deep-sea vents",
    subject: "animalfacts",
    classLevel: "primary-2",
    complexity: "simple",
  },
  {
    text: "Leaf sheep: Sea slug that looks like a cartoon sheep and photosynthesizes like a plant",
    subject: "animalfacts",
    classLevel: "primary-2",
    complexity: "simple",
  },
  {
    text: "Red-lipped batfish: Fish with bright red lipstick that walks on the ocean floor",
    subject: "animalfacts",
    classLevel: "primary-2",
    complexity: "simple",
  },

  // ==================== PRIMARY 3 (Age 7-8) - Extreme Survival & Defense ====================
  {
    text: "Ironclad beetle: So tough you can drive a car over it and it survives",
    subject: "animalfacts",
    classLevel: "primary-3",
    complexity: "simple",
  },
  {
    text: "Bombardier beetle: Shoots boiling hot chemical spray from its rear cannon",
    subject: "animalfacts",
    classLevel: "primary-3",
    complexity: "simple",
  },
  {
    text: "Honey badger: Fearless animal that fights lions and eats cobras like snacks",
    subject: "animalfacts",
    classLevel: "primary-3",
    complexity: "simple",
  },
  {
    text: "Mimic octopus: Pretends to be 15 different animals including snakes and fish",
    subject: "animalfacts",
    classLevel: "primary-3",
    complexity: "simple",
  },
  {
    text: "Gecko: Sticky feet that let it walk upside down and even in space",
    subject: "animalfacts",
    classLevel: "primary-3",
    complexity: "simple",
  },
  {
    text: "Fainting goat: Muscles freeze and tips over when scared like a toy",
    subject: "animalfacts",
    classLevel: "primary-3",
    complexity: "simple",
  },
  {
    text: "Japanese spider crab: Legs longer than a car, hides in underwater caves",
    subject: "animalfacts",
    classLevel: "primary-3",
    complexity: "simple",
  },
  {
    text: "Goblin shark: Living fossil with jaw that shoots out to grab prey",
    subject: "animalfacts",
    classLevel: "primary-3",
    complexity: "simple",
  },
  {
    text: "Sun bear: Has a golden chest mark like a sunrise, longest tongue for honey",
    subject: "animalfacts",
    classLevel: "primary-3",
    complexity: "simple",
  },
  {
    text: "Kakapo: World's only flightless parrot that smells like flowers",
    subject: "animalfacts",
    classLevel: "primary-3",
    complexity: "simple",
  },
  {
    text: "Satanic leaf-tailed gecko: Looks exactly like a dead leaf, even has bite marks",
    subject: "animalfacts",
    classLevel: "primary-3",
    complexity: "simple",
  },
  {
    text: "Thorny devil lizard: Collects water through its skin like living straw",
    subject: "animalfacts",
    classLevel: "primary-3",
    complexity: "simple",
  },

  // ==================== PRIMARY 4 (Age 8-9) - Weird Animal Families & Life Cycles ====================
  {
    text: "Platypus: Mammal that lays eggs, has venomous spurs, and glows under UV light",
    subject: "animalfacts",
    classLevel: "primary-4",
    complexity: "standard",
  },
  {
    text: "Echidna: Spiny anteater with a four-headed penis and can sense electricity",
    subject: "animalfacts",
    classLevel: "primary-4",
    complexity: "standard",
  },
  {
    text: "Sea pig: Pink, balloon-like sea cucumber that walks on tube feet in the deep sea",
    subject: "animalfacts",
    classLevel: "primary-4",
    complexity: "standard",
  },
  {
    text: "Pink fairy armadillo: Tiny pink-shelled digger that swims through sand",
    subject: "animalfacts",
    classLevel: "primary-4",
    complexity: "standard",
  },
  {
    text: "Dumbo octopus life: From floating egg to ear-flapping adult in the deep sea",
    subject: "animalfacts",
    classLevel: "primary-4",
    complexity: "standard",
  },
  {
    text: "Caecilian: Legless amphibian that feeds babies its own skin",
    subject: "animalfacts",
    classLevel: "primary-4",
    complexity: "standard",
  },
  {
    text: "Venezuelan poodle moth: Fuzzy white moth that looks like a Pokémon",
    subject: "animalfacts",
    classLevel: "primary-4",
    complexity: "standard",
  },
  {
    text: "Blue dragon sea slug: Floats upside down, steals stinging cells from its prey",
    subject: "animalfacts",
    classLevel: "primary-4",
    complexity: "standard",
  },
  {
    text: "Peacock spider: Tiny spider that dances like a disco ball to attract mates",
    subject: "animalfacts",
    classLevel: "primary-4",
    complexity: "standard",
  },
  {
    text: "Honduran white bat: Builds tents from leaves, looks like cotton ball with nose",
    subject: "animalfacts",
    classLevel: "primary-4",
    complexity: "standard",
  },
  {
    text: "Magnificent frigatebird: Inflates red throat pouch like a balloon to attract mates",
    subject: "animalfacts",
    classLevel: "primary-4",
    complexity: "standard",
  },
  {
    text: "Superb bird-of-paradise: Turns into a smiling face with neon blue eyes during dance",
    subject: "animalfacts",
    classLevel: "primary-4",
    complexity: "standard",
  },

  // ==================== PRIMARY 5 (Age 9-10) - Extreme Animal Adaptations ====================
  {
    text: "Wood frog: Freezes solid all winter, heart stops, then thaws and hops away",
    subject: "animalfacts",
    classLevel: "primary-5",
    complexity: "standard",
  },
  {
    text: "Alpine ibex: Climbs nearly vertical dam walls licking salt",
    subject: "animalfacts",
    classLevel: "primary-5",
    complexity: "standard",
  },
  {
    text: "Regenerating animals: Axolotl regrows limbs, starfish regrows whole body from one arm",
    subject: "animalfacts",
    classLevel: "primary-5",
    complexity: "standard",
  },
  {
    text: "Electric eel: Generates 600 volts, can curl up to double its power",
    subject: "animalfacts",
    classLevel: "primary-5",
    complexity: "standard",
  },
  {
    text: "Bar-headed goose: Flies over Mount Everest using special oxygen-carrying blood",
    subject: "animalfacts",
    classLevel: "primary-5",
    complexity: "standard",
  },
  {
    text: "Pistol shrimp: Snaps claw so fast it creates a bubble hotter than the sun",
    subject: "animalfacts",
    classLevel: "primary-5",
    complexity: "standard",
  },
  {
    text: "Common poorwill: The only bird that hibernates for months like a bear",
    subject: "animalfacts",
    classLevel: "primary-5",
    complexity: "standard",
  },
  {
    text: "Sea cucumber: Ejects sticky, toxic intestines to escape predators, grows new ones",
    subject: "animalfacts",
    classLevel: "primary-5",
    complexity: "standard",
  },
  {
    text: "Horned lizard: Shoots blood from its eyes to scare away coyotes",
    subject: "animalfacts",
    classLevel: "primary-5",
    complexity: "standard",
  },
  {
    text: "Archerfish: Shoots water jets like a pistol to knock insects off branches",
    subject: "animalfacts",
    classLevel: "primary-5",
    complexity: "standard",
  },
  {
    text: "Sperm whale: Clicks so loud it could vibrate a human to death",
    subject: "animalfacts",
    classLevel: "primary-5",
    complexity: "standard",
  },
  {
    text: "Tardigrade cryptobiosis: Enters death-like state for decades, comes back to life",
    subject: "animalfacts",
    classLevel: "primary-5",
    complexity: "standard",
  },

  // ==================== PRIMARY 6 (Age 10-11) - Animal Intelligence & Social Mysteries ====================
  {
    text: "Octopus intelligence: Solves puzzles, opens jars, recognizes human faces",
    subject: "animalfacts",
    classLevel: "primary-6",
    complexity: "standard",
  },
  {
    text: "Raven cognition: Outsmarts chimpanzees, plans for the future, holds grudges",
    subject: "animalfacts",
    classLevel: "primary-6",
    complexity: "standard",
  },
  {
    text: "Honeybee waggle dance: Tells sisters exactly where flowers are using dance moves",
    subject: "animalfacts",
    classLevel: "primary-6",
    complexity: "standard",
  },
  {
    text: "Elephant infrasound: Talks with rumbles too low for humans to hear, miles away",
    subject: "animalfacts",
    classLevel: "primary-6",
    complexity: "standard",
  },
  {
    text: "Orca culture: Different pods speak different languages and eat different foods",
    subject: "animalfacts",
    classLevel: "primary-6",
    complexity: "standard",
  },
  {
    text: "Ant supercolonies: Millions of ants working as one super-organism",
    subject: "animalfacts",
    classLevel: "primary-6",
    complexity: "standard",
  },
  {
    text: "Cleaner wrasse: Fish that runs a cleaning station, remembers each client",
    subject: "animalfacts",
    classLevel: "primary-6",
    complexity: "standard",
  },
  {
    text: "Portia jumping spider: Plans routes, learns from watching other spiders hunt",
    subject: "animalfacts",
    classLevel: "primary-6",
    complexity: "standard",
  },
  {
    text: "Meerkat sentinels: Takes turns being lookout, uses different alarms for different predators",
    subject: "animalfacts",
    classLevel: "primary-6",
    complexity: "standard",
  },
  {
    text: "Dolphin signature whistles: Has its own name that others call to get its attention",
    subject: "animalfacts",
    classLevel: "primary-6",
    complexity: "standard",
  },
  {
    text: "New Caledonian crow: Makes hooks from twigs, drops nuts on roads for cars to crack",
    subject: "animalfacts",
    classLevel: "primary-6",
    complexity: "standard",
  },
  {
    text: "Humpback whale bubble nets: Team hunts by blowing curtains of bubbles to trap fish",
    subject: "animalfacts",
    classLevel: "primary-6",
    complexity: "standard",
  },
];

// ─── SUBJECT LABELS & STYLES ───────────────────────────────
export const SUBJECT_LABELS = {
  animalfacts: "Animal Facts",
  zoology: "Zoology",
  wildlife: "Wildlife",
};

export const SUBJECT_STYLES = {
  animalfacts: "sci-animalfacts",
  zoology: "sci-zoology",
  wildlife: "sci-wildlife",
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

Open your lesson with a question that makes a little kid stop what they're doing and listen.

**Use one of these patterns:**

**The "Did You Know" Question:**
"Did you know there's an animal that looks like a walking pineapple? ... (pause) ... Meet the pangolin!"

**The "Have You Ever" Question:**
"Have you ever seen an animal that can freeze solid and come back to life? ... (pause) ... It's not magic — it's the wood frog!"

**The "What If" Question:**
"What if I told you there's an animal with a punch faster than a bullet? ... (pause) ... The mantis shrimp has the strongest punch in the world!"

**The "Can You Imagine" Question:**
"Can you imagine an animal that never grows up? It stays a baby its whole life! ... (pause) ... That's the axolotl!"

**The "I Bet You Can't" Question:**
"I bet you can't name an animal that has a see-through belly. ... (pause) ... The glass frog — you can watch its heart beat!"

**Adapt for your specific animal:** Replace the example with your animal. Keep the energy high and the pause clear.`,

    descriptive: `**HOOK TYPE: DESCRIPTIVE**

Paint a picture with your words. Tell the child to close their eyes and SEE the animal.

**Use one of these patterns:**

**Sight Hook:**
"Close your eyes. Picture an animal covered in scales — not like a fish, but like a pinecone. It walks on two legs and has a long, sticky tongue. When it's scared, it rolls into a perfect ball. That's the pangolin."

**Sound Hook:**
"Close your eyes and listen. Click-click-click. That's a dolphin talking. But dolphins don't just make sounds — they have names! Each dolphin has its own special whistle that others use to call it."

**Touch Hook:**
"Imagine touching an animal that feels like a hairy potato with a snout like a vacuum cleaner. It has a long sticky tongue that shoots out to catch ants. That's the aardvark!"

**Action Hook:**
"Picture an animal doing a dance. It's tiny — smaller than your fingernail. It waves its colorful tail like a flag and shakes its legs. This spider has a dance better than any you've ever seen!"

**Adapt for your specific animal:** Replace the example with your animal. Keep it to 3-4 sentences. Use ONE sense at a time.`,

    story: `**HOOK TYPE: STORY**

Tell a short story with an animal character, a small problem, and a fascinating solution.

**Use one of these patterns:**

**The Pangolin's Roll:**
"Pango the pangolin was scared. A leopard was nearby. 'What do I do?' Pango whispered. So he did what pangolins do best — he rolled into a tight ball. His scales clicked together like armor. The leopard pushed and pawed, but Pango was safe inside his scaly suit. 'My scales saved me!' Pango cheered."

**The Axolotl's Lost Leg:**
"Axie the axolotl was swimming when — SNAP — a bigger salamander bit her leg. 'Ouch!' Axie cried. She swam away, sad. But then something amazing happened. A tiny bump appeared where her leg had been. Then a little foot. Then a whole new leg! 'I grew it back!' Axie shouted."

**The Tardigrade's Space Adventure:**
"Tardi was so small you needed a microscope to see her. One day, scientists put Tardi in a spaceship and sent her to space! No air? Tardi didn't care. Freezing cold? Tardi was fine. Boiling hot? No problem. Tardi curled up, went to sleep, and woke up perfectly fine back on Earth."

**Adapt for your specific animal:** Create a character. Give them a simple problem. Let the animal's unique ability solve it. Keep it to 4-5 sentences.`,

    wildKratts: `**HOOK TYPE: WILD KRATTS**

Channel the energy of the Wild Kratts — excitement, discovery, and creature powers!

**Use one of these patterns:**

**The Creature Power Challenge:**
"Kratt brothers style — what if YOU could have the powers of this animal? Chris and Martin would say: 'ACTIVATE PANGOLIN POWER!' You'd roll into an armor ball that no predator could crack. Cool, right? Let's find out how pangolins do it."

**The "Wow Fact" Opening:**
"WILD KRATTS WOW FACT: There's an animal that can survive in space. Space! No oxygen, freezing cold, boiling heat — doesn't matter. It just curls up and waits. It's called the tardigrade, and today we're going creature exploring!"

**The Habitat Sneak:**
"Jump in the Tortuga — we're going on a creature adventure! Today we're diving into the deep sea to find an animal with ears that look like Dumbo's. It flaps them to swim. The dumbo octopus is waiting — let's go!"

**The Superpower Comparison:**
"Every animal has a superpower. The mantis shrimp? It sees 16 colors (we only see 3). It punches so fast it boils water. If you had MANTIS SHRIMP POWER, you'd never lose an arm-wrestling match. Ever. Let's learn how."

**Adapt for your specific animal:** Use Wild Kratts energy. Mention "creature powers" or "creature adventure." Keep it excited and punchy.`,
  },

  jss: {
    // Similar structure but for JSS level...
    wildKratts: `**HOOK TYPE: WILD KRATTS (JSS Level)**

Channel Wild Kratts but with more scientific depth — still fun, but ready for deeper biology.

**Pattern:**
"Chris and Martin would lose their minds over this animal. The bombardier beetle doesn't just spray — it aims. It mixes chemicals in its abdomen that reach 100°C and shoots them out a rotating cannon. The Kratt brothers would say: 'BOMBARDIER BEETLE POWER — ACTIVATE!' And you'd have your own built-in boiling spray gun. That's not a cartoon — that's real biochemistry. Let me show you how this beetle makes its own explosions."`,
  },

  ss: {
    // SS level might not use Wild Kratts as much, but could for fun engagement
    wildKratts: `**HOOK TYPE: WILD KRATTS (SS Level - Engagement Hook)**

Use the Wild Kratts frame as a fun entry point before diving into rigorous biology.

**Pattern:**
"You might have watched Wild Kratts as a kid. Remember the creature power suits? Turns out the Kratt brothers weren't making things up. The pistol shrimp really DOES create a bubble hotter than the sun. That's not an exaggeration — it's thermodynamics. Today we'll go from 'cool animal fact' to the actual physics and biology behind it. Even Martin would be impressed."`,
  },
};

// ─── TONE GUIDES ────────────────────────────────────
function getToneGuide(levelType) {
  const toneGuides = {
    primary: `You are an enthusiastic animal explorer (like a Wild Kratts guide) talking to kids ages 5-11.

**Key rules:**
- Be amazed by the animals — your excitement is contagious
- Use short, punchy sentences
- Say "WOW!" "Check this out!" "You won't believe this!"
- Compare animal abilities to things kids know (superheroes, video games, sports)
- Ask "Can you imagine..." and "What if YOU could..."
- End with a challenge: "Now go tell someone about this amazing animal!"`,

    jss: `You are a wildlife educator for ages 11-14. Keep the wonder but add more science.

**Key rules:**
- Start with the "wow" factor, then explain the "how"
- Use analogies that teens get (video games, social media, sports)
- Connect animal abilities to biology concepts
- Call out common myths about the animal
- End with a "deeper dive" question for curious students`,

    ss: `You are a zoology teacher for ages 14-18. Rigorous but still fascinating.

**Key rules:**
- Respect that they love animals but need exam-level knowledge
- Explain evolutionary WHY behind each adaptation
- Use proper taxonomic and anatomical terminology
- Connect animal facts to broader biological principles
- Include exam-style application questions`,
  };

  return toneGuides[levelType];
}

// ─── SUBJECT-SPECIFIC PROMPT BUILDER (modified for animal facts) ───
export function buildSubjectPrompt(topic, topicIndex = 0) {
  const { text, subject, classLevel } = topic;
  const levelType = classLevel.startsWith("primary")
    ? "primary"
    : classLevel.startsWith("jss")
      ? "jss"
      : "ss";
  const classNum = classLevel.split("-")[1];

  return `You are a master wildlife educator creating an exciting lesson on: "${text}"

## YOUR TEACHING STYLE:
You teach like the Wild Kratts — full of wonder, excitement, and "creature power" energy. Every lesson makes kids say "WHOA!" and want to learn more about animals.

## LESSON STRUCTURE:

**1. The Hook (2-3 sentences)** — Grab attention with a Wild Kratts-style wow fact or question.

**2. Meet the Animal (4-5 sentences)** — Describe what this animal looks like, where it lives, and why it's unique.

**3. The Amazing Ability (8-10 sentences)** — Explain the animal's superpower. Break down HOW it works in simple terms. Use comparisons kids understand.

**4. Creature Power Breakdown (3-4 sentences)** — If a human had this power, what could they do? Make it fun and imaginative.

**5. Quick Quiz (2-3 questions)** — Fun recall questions to check understanding.

## LANGUAGE RULES:
- Be EXCITED! Use exclamation points, "wow," "amazing," "incredible"
- Short sentences for primary, longer for upper levels
- Compare to things kids know (superheroes, sports, video games)
- Never be boring — this is the coolest animal facts ever!

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
