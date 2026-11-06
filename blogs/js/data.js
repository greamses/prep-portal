// data.js — single source of truth for ALL blog subject data.
//
// One file for entering subject data, just like there is one blog.js.
//
// To ADD a subject: add one entry to SUBJECTS below, keyed by its URL param
// (?s=… on the reader, ?subject=… on the publisher). Each entry only needs:
//   aliases  – other URL params that should resolve to this subject
//   config   – { name, collectionName, source, apiKeyField, groqKeyField }
//   flavor   – wording knobs the shared prompt builder fills in
//   labels   – SUBJECT_LABELS (filter dropdown + badges)
//   styles   – SUBJECT_STYLES (badge colour classes)
//   topics   – the lesson topics to auto-generate from
//
// Everything else (the prompt builder, hook guides, tone guides, class labels
// and the AI model list) is SHARED and generated automatically — no need to
// copy it per subject ever again.

import { SHARED_MODELS } from "/blogs/js/models.js";

// ─── SHARED ACROSS EVERY SUBJECT ────────────────────────────
export const SUBJECT_MODELS = SHARED_MODELS;

export const CLASS_LABELS = {
  primary: (n) => `Grade ${n}`,
  jss: (n) => `Grade ${+n + 6}`,
  ss: (n) => `Grade ${+n + 9}`,
};

export const CLASS_STYLES = {
  primary: "cls-primary",
  jss: "cls-jss",
  ss: "cls-ss",
};

export const HOOK_STYLES = ["question", "descriptive", "story", "wildKratts"];

// ─── SUBJECT REGISTRY (THE ONLY PLACE YOU ENTER DATA) ───────
export const SUBJECTS = {
  plants: {
    aliases: ["plant", "plantfacts", "botany"],
    config: {
      name: "Plant Facts",
      collectionName: "plantfacts-posts",
      source: "auto-plantfacts-v1",
      apiKeyField: "geminiKey",
      groqKeyField: "groqKey",
    },
    flavor: {
      educatorRole: "master botanical educator",
      teachLike: "a plant explorer",
      powerLower: "plant",
      powerWord: "Plant",
      powerOwner: "plant's power",
      Noun: "Plant",
      noun: "plant",
      livesVerb: "grows",
      hookFlavor: "plant explorer",
      domainPhrase: "the botanical world",
      topicPhrase: "plant facts",
      explorerNoun: "plant explorer (like a botanical adventurer)",
      domainNoun: "botany",
    },
    labels: {
      plantfacts: "Plant Facts",
      botany: "Botany",
      horticulture: "Horticulture",
    },
    styles: {
      plantfacts: "sci-plantfacts",
      botany: "sci-botany",
      horticulture: "sci-horticulture",
    },
    topics: [
      // ===== PRIMARY 1 — Weird & Wonderful Plants =====
      { text: "Venus flytrap: The plant that snaps shut like a bear trap to catch flies", subject: "plantfacts", classLevel: "primary-1", complexity: "simple" },
      { text: "Sunflower: The giant flower that turns its head to follow the sun all day", subject: "plantfacts", classLevel: "primary-1", complexity: "simple" },
      { text: "Cactus: The spiky plant that stores water like a camel in the desert", subject: "plantfacts", classLevel: "primary-1", complexity: "simple" },
      { text: "Giant water lily: A leaf so strong a small child can sit on it without sinking", subject: "plantfacts", classLevel: "primary-1", complexity: "simple" },
      { text: "Dandelion: The flower that turns into a fluffy white ball of flying seeds", subject: "plantfacts", classLevel: "primary-1", complexity: "simple" },
      { text: "Bamboo: The fastest-growing plant that can grow taller than a house in weeks", subject: "plantfacts", classLevel: "primary-1", complexity: "simple" },
      { text: "Mimosa pudica (Touch-me-not): The shy plant that folds its leaves when you tickle it", subject: "plantfacts", classLevel: "primary-1", complexity: "simple" },
      { text: "Coconut palm: The tree that gives us a fruit with water inside and a hard shell boat", subject: "plantfacts", classLevel: "primary-1", complexity: "simple" },
      { text: "Pumpkin: The fruit that grows into a giant orange ball bigger than a car", subject: "plantfacts", classLevel: "primary-1", complexity: "simple" },
      { text: "Pineapple: The spiky fruit that takes two whole years to grow just one", subject: "plantfacts", classLevel: "primary-1", complexity: "simple" },

      // ===== PRIMARY 2 — Superpowers & Strange Abilities =====
      { text: "Rafflesia arnoldii: The world's biggest flower that smells like rotten meat", subject: "plantfacts", classLevel: "primary-2", complexity: "simple" },
      { text: "Pitcher plant: The tricky plant that turns its leaf into a deep slippery pit of doom", subject: "plantfacts", classLevel: "primary-2", complexity: "simple" },
      { text: "Corpse flower (Titan arum): The skyscraper flower that blooms once every 7 years and stinks like dead elephants", subject: "plantfacts", classLevel: "primary-2", complexity: "simple" },
      { text: "Sundew: The plant with glittering sticky tentacles that sparkle like morning dew but trap insects like flypaper", subject: "plantfacts", classLevel: "primary-2", complexity: "simple" },
      { text: "Mangrove: The tree that grows in saltwater and stands on stilts like a giant spider", subject: "plantfacts", classLevel: "primary-2", complexity: "simple" },
      { text: "Baobab tree: The upside-down tree that stores water in its belly like a giant bottle", subject: "plantfacts", classLevel: "primary-2", complexity: "simple" },
      { text: "Sensitive plant telegraph: How a touched leaf sends electrical signals faster than you can blink", subject: "plantfacts", classLevel: "primary-2", complexity: "simple" },
      { text: "Bladderwort: The underwater plant with trapdoors faster than a speeding bullet", subject: "plantfacts", classLevel: "primary-2", complexity: "simple" },
      { text: "Dragon's blood tree: The mushroom-shaped tree that bleeds red sap like a dragon's wound", subject: "plantfacts", classLevel: "primary-2", complexity: "simple" },
      { text: "Welwitschia mirabilis: The plant that lives 2,000 years with only two leaves that never stop growing", subject: "plantfacts", classLevel: "primary-2", complexity: "simple" },
      { text: "Ghost plant (Monotropa): The white plant that doesn't need sunlight and steals food from fungi", subject: "plantfacts", classLevel: "primary-2", complexity: "simple" },
      { text: "Strangler fig: The tree that starts life in the air, then grows down and swallows other trees", subject: "plantfacts", classLevel: "primary-2", complexity: "simple" },

      // ===== PRIMARY 3 — Extreme Survival & Defense =====
      { text: "Cacti survival: How cacti turn their stems into water tanks and spines into shade umbrellas", subject: "plantfacts", classLevel: "primary-3", complexity: "simple" },
      { text: "Stinging nettle: The plant with tiny hypodermic needles that inject a painful chemical cocktail", subject: "plantfacts", classLevel: "primary-3", complexity: "simple" },
      { text: "Arctic willow: The tiny tree that grows sideways to survive freezing winds at the top of the world", subject: "plantfacts", classLevel: "primary-3", complexity: "simple" },
      { text: "Resurrection plant: The tumbleweed that dries up completely for years, then turns green with one drop of water", subject: "plantfacts", classLevel: "primary-3", complexity: "simple" },
      { text: "Acacia tree defense: The tree that calls ant armies to fight giraffes and sends chemical warnings to neighbours", subject: "plantfacts", classLevel: "primary-3", complexity: "simple" },
      { text: "Lava plants: The first plants that grow on black volcanic rock after a volcano erupts", subject: "plantfacts", classLevel: "primary-3", complexity: "simple" },
      { text: "Mountain avens: The flower that follows the sun like a satellite dish to stay warm in the Arctic", subject: "plantfacts", classLevel: "primary-3", complexity: "simple" },
      { text: "Giant sequoia fire armor: The tree with bark thicker than a mattress that needs fire to release its seeds", subject: "plantfacts", classLevel: "primary-3", complexity: "simple" },
      { text: "Lotus effect: The sacred flower that stays perfectly clean — water and mud just slide right off", subject: "plantfacts", classLevel: "primary-3", complexity: "simple" },
      { text: "Edelweiss: The woolly star flower that grows on cliff edges and wears a fur coat against UV rays", subject: "plantfacts", classLevel: "primary-3", complexity: "simple" },
      { text: "Saguaro cactus: The giant cactus that grows arms only after 75 years of waiting", subject: "plantfacts", classLevel: "primary-3", complexity: "simple" },
      { text: "Stone plant (Lithops): The plant that looks exactly like a pebble so nothing eats it", subject: "plantfacts", classLevel: "primary-3", complexity: "simple" },

      // ===== PRIMARY 4 — Weird Plant Families & Life Cycles =====
      { text: "Orchid trickery: Flowers that look and smell like female bees to trick male bees into pollinating them", subject: "plantfacts", classLevel: "primary-4", complexity: "standard" },
      { text: "Coco de mer: The palm tree with the world's biggest seed — heavier than a baby elephant", subject: "plantfacts", classLevel: "primary-4", complexity: "standard" },
      { text: "Mushroom (fungi): Not a plant but nature's recycler — the underground network bigger than cities", subject: "plantfacts", classLevel: "primary-4", complexity: "standard" },
      { text: "Bristlecone pine: The oldest living thing on Earth — trees that were alive before the pyramids were built", subject: "plantfacts", classLevel: "primary-4", complexity: "standard" },
      { text: "Carnivorous plant traps: How pitcher plants, sundews, and bladderworts each invented their own way to hunt", subject: "plantfacts", classLevel: "primary-4", complexity: "standard" },
      { text: "Dodder vine (Cuscuta): The vampire plant that sniffs out its victim and sucks the life out of it", subject: "plantfacts", classLevel: "primary-4", complexity: "standard" },
      { text: 'Walking palm: The tree that grows new roots and slowly "walks" across the forest floor', subject: "plantfacts", classLevel: "primary-4", complexity: "standard" },
      { text: "Bee orchid: The flower that wears a bee costume so convincing that real bees try to mate with it", subject: "plantfacts", classLevel: "primary-4", complexity: "standard" },
      { text: "Banyan tree: One tree that becomes a whole forest — with roots growing down from every branch", subject: "plantfacts", classLevel: "primary-4", complexity: "standard" },
      { text: "Wolffia (Watermeal): The world's smallest flower — you need a magnifying glass to see one bloom", subject: "plantfacts", classLevel: "primary-4", complexity: "standard" },
      { text: "Helicopter seeds: How maple, ash, and dipterocarp trees invented spinning wings to fly their babies away", subject: "plantfacts", classLevel: "primary-4", complexity: "standard" },
      { text: "Sausage tree: The tree that grows giant hanging fruits that look like salami and weigh more than a poodle", subject: "plantfacts", classLevel: "primary-4", complexity: "standard" },

      // ===== PRIMARY 5 — Extreme Plant Adaptations =====
      { text: "Succulent water storage: How aloe, agave, and living stones hoard water like desert camels", subject: "plantfacts", classLevel: "primary-5", complexity: "standard" },
      { text: "Redwood trees: The skyscrapers of nature that drink fog through their leaves and share roots with family", subject: "plantfacts", classLevel: "primary-5", complexity: "standard" },
      { text: "Carnivorous plant digestion: How pitcher plants turn into living stomachs filled with digestive soup", subject: "plantfacts", classLevel: "primary-5", complexity: "standard" },
      { text: "Mistletoe: The holiday plant that's actually a tree vampire stealing water and nutrients from branches", subject: "plantfacts", classLevel: "primary-5", complexity: "standard" },
      { text: "Eucalyptus fire strategy: The tree that oils its own leaves to start fires and kill its competition", subject: "plantfacts", classLevel: "primary-5", complexity: "standard" },
      { text: "Air plants (Tillandsia): The plants that live on nothing but air — no soil, no roots, just floating on breezes", subject: "plantfacts", classLevel: "primary-5", complexity: "standard" },
      { text: "Corpse flower heating trick: Blooms that heat themselves up to 36°C to spread their stink further", subject: "plantfacts", classLevel: "primary-5", complexity: "standard" },
      { text: "Bamboo mass flowering: How entire bamboo forests bloom once every 120 years, then die together", subject: "plantfacts", classLevel: "primary-5", complexity: "standard" },
      { text: "Ant plants (Myrmecophytes): The plants that grow hollow homes and cook meals for ant bodyguards", subject: "plantfacts", classLevel: "primary-5", complexity: "standard" },
      { text: "Snow plant: The bright red plant that pushes through snow using its own internal heater", subject: "plantfacts", classLevel: "primary-5", complexity: "standard" },
      { text: "Mangrove salt filters: How these trees drink seawater by filtering salt through special root membranes", subject: "plantfacts", classLevel: "primary-5", complexity: "standard" },
      { text: "Tumbleweed migration: Plants that break off at the roots and roll for miles, scattering 250,000 seeds", subject: "plantfacts", classLevel: "primary-5", complexity: "standard" },

      // ===== PRIMARY 6 — Plant Intelligence & Communication =====
      { text: "Wood Wide Web: How trees talk to each other through underground fungal internet", subject: "plantfacts", classLevel: "primary-6", complexity: "standard" },
      { text: "Plant memory: How Venus flytraps count to 5 before snapping shut and remember which hairs were touched", subject: "plantfacts", classLevel: "primary-6", complexity: "standard" },
      { text: "Acacia tree warning system: Trees that smell their neighbours being eaten and pump poison into their leaves", subject: "plantfacts", classLevel: "primary-6", complexity: "standard" },
      { text: "Root intelligence: How plant roots choose the best path through soil, avoiding rocks and finding water", subject: "plantfacts", classLevel: "primary-6", complexity: "standard" },
      { text: "Plant timekeeping: The internal clocks that tell sunflowers when to face east and flowers when to bloom", subject: "plantfacts", classLevel: "primary-6", complexity: "standard" },
      { text: "Mother tree nurturing: How the oldest trees feed seedlings sugar through their roots and recognize their own offspring", subject: "plantfacts", classLevel: "primary-6", complexity: "standard" },
      { text: "Dodder vine decision making: The parasitic plant that sniffs out tomato vs. wheat and chooses the best victim", subject: "plantfacts", classLevel: "primary-6", complexity: "standard" },
      { text: "Mimosa learning: How the sensitive plant remembers that dripping water is safe and stops folding its leaves", subject: "plantfacts", classLevel: "primary-6", complexity: "standard" },
      { text: "Plant electrical signalling: How wounded plants send electrical impulses faster than your nerve signals", subject: "plantfacts", classLevel: "primary-6", complexity: "standard" },
      { text: "Killer plant cooperation: How some pitcher plants work with ants — the ants hunt large prey for the plant", subject: "plantfacts", classLevel: "primary-6", complexity: "standard" },
      { text: "Bean plant risk assessment: How pea plants gamble — growing more roots when nutrients are steady, more shoots when risky", subject: "plantfacts", classLevel: "primary-6", complexity: "standard" },
      { text: "Flower sonar: How some flowers use their petals like satellite dishes to reflect bat sonar and attract pollinators", subject: "plantfacts", classLevel: "primary-6", complexity: "standard" },
    ],
  },

  animals: {
    aliases: ["animal", "animalfacts", "animal-copy", "zoology", "wildlife"],
    config: {
      name: "Animal Facts",
      collectionName: "animalfacts-posts",
      source: "auto-animalfacts-v1",
      apiKeyField: "geminiKey",
      groqKeyField: "groqKey",
    },
    flavor: {
      educatorRole: "master wildlife educator",
      teachLike: "the Wild Kratts",
      powerLower: "creature",
      powerWord: "Creature",
      powerOwner: "power",
      Noun: "Animal",
      noun: "animal",
      livesVerb: "lives",
      hookFlavor: "Wild Kratts",
      domainPhrase: "animals",
      topicPhrase: "animal facts",
      explorerNoun: "wildlife explorer (like a Wild Kratts guide)",
      domainNoun: "zoology",
    },
    labels: {
      animalfacts: "Animal Facts",
      zoology: "Zoology",
      wildlife: "Wildlife",
    },
    styles: {
      animalfacts: "sci-animalfacts",
      zoology: "sci-zoology",
      wildlife: "sci-wildlife",
    },
    topics: [
      // ===== PRIMARY 1 — Weird & Wonderful Creatures =====
      { text: "Pangolin: The only mammal covered in scales like a moving pineapple", subject: "animalfacts", classLevel: "primary-1", complexity: "simple" },
      { text: "Aardvark: Nighttime digger with a long sticky tongue like a living vacuum", subject: "animalfacts", classLevel: "primary-1", complexity: "simple" },
      { text: "Slow loris: The world's only venomous primate with eyes like dinner plates", subject: "animalfacts", classLevel: "primary-1", complexity: "simple" },
      { text: "Axolotl: Smiling salamander that never grows up and can regrow its legs", subject: "animalfacts", classLevel: "primary-1", complexity: "simple" },
      { text: "Naked mole rat: Wrinkly, nearly hairless, and feels no pain from spicy food", subject: "animalfacts", classLevel: "primary-1", complexity: "simple" },
      { text: "Fossa: Madagascar's top predator that looks like a cat-dog-weasel mix", subject: "animalfacts", classLevel: "primary-1", complexity: "simple" },
      { text: "Okapi: Giraffe's secret cousin with zebra-striped legs hiding in the forest", subject: "animalfacts", classLevel: "primary-1", complexity: "simple" },
      { text: "Dumbo octopus: Deep-sea ear-flapping octopus that looks like a cartoon", subject: "animalfacts", classLevel: "primary-1", complexity: "simple" },
      { text: "Markhor: Screw-horned goat that climbs cliffs like a superhero", subject: "animalfacts", classLevel: "primary-1", complexity: "simple" },
      { text: "Saiga antelope: Nose like a vacuum hose, lives in frozen deserts", subject: "animalfacts", classLevel: "primary-1", complexity: "simple" },

      // ===== PRIMARY 2 — Superpowers & Strange Abilities =====
      { text: "Tardigrade (Water Bear): Microscopic creature that survives space, boiling, and freezing", subject: "animalfacts", classLevel: "primary-2", complexity: "simple" },
      { text: "Mantis shrimp: Punch like a bullet, sees 16 colors (humans see 3!)", subject: "animalfacts", classLevel: "primary-2", complexity: "simple" },
      { text: "Glass frog: See-through belly where you can watch its heart beat", subject: "animalfacts", classLevel: "primary-2", complexity: "simple" },
      { text: "Hairy frog: Breaks its own toe bones to push out claws like Wolverine", subject: "animalfacts", classLevel: "primary-2", complexity: "simple" },
      { text: "Star-nosed mole: Nose with 22 pink tentacles that feel faster than eyes", subject: "animalfacts", classLevel: "primary-2", complexity: "simple" },
      { text: "Lyrebird: Can copy chainsaws, camera shutters, and car alarms perfectly", subject: "animalfacts", classLevel: "primary-2", complexity: "simple" },
      { text: "Cuttlefish: Ocean chameleon with W-shaped pupils and hypnotic color waves", subject: "animalfacts", classLevel: "primary-2", complexity: "simple" },
      { text: "Shoebill stork: Bird that stands completely still then clatters its beak like machine gun", subject: "animalfacts", classLevel: "primary-2", complexity: "simple" },
      { text: "Blobfish: Looks like a sad old man but that's just its deep-sea travel face", subject: "animalfacts", classLevel: "primary-2", complexity: "simple" },
      { text: "Yeti crab: Fuzzy white claws that farm bacteria for food in deep-sea vents", subject: "animalfacts", classLevel: "primary-2", complexity: "simple" },
      { text: "Leaf sheep: Sea slug that looks like a cartoon sheep and photosynthesizes like a plant", subject: "animalfacts", classLevel: "primary-2", complexity: "simple" },
      { text: "Red-lipped batfish: Fish with bright red lipstick that walks on the ocean floor", subject: "animalfacts", classLevel: "primary-2", complexity: "simple" },

      // ===== PRIMARY 3 — Extreme Survival & Defense =====
      { text: "Ironclad beetle: So tough you can drive a car over it and it survives", subject: "animalfacts", classLevel: "primary-3", complexity: "simple" },
      { text: "Bombardier beetle: Shoots boiling hot chemical spray from its rear cannon", subject: "animalfacts", classLevel: "primary-3", complexity: "simple" },
      { text: "Honey badger: Fearless animal that fights lions and eats cobras like snacks", subject: "animalfacts", classLevel: "primary-3", complexity: "simple" },
      { text: "Mimic octopus: Pretends to be 15 different animals including snakes and fish", subject: "animalfacts", classLevel: "primary-3", complexity: "simple" },
      { text: "Gecko: Sticky feet that let it walk upside down and even in space", subject: "animalfacts", classLevel: "primary-3", complexity: "simple" },
      { text: "Fainting goat: Muscles freeze and tips over when scared like a toy", subject: "animalfacts", classLevel: "primary-3", complexity: "simple" },
      { text: "Japanese spider crab: Legs longer than a car, hides in underwater caves", subject: "animalfacts", classLevel: "primary-3", complexity: "simple" },
      { text: "Goblin shark: Living fossil with jaw that shoots out to grab prey", subject: "animalfacts", classLevel: "primary-3", complexity: "simple" },
      { text: "Sun bear: Has a golden chest mark like a sunrise, longest tongue for honey", subject: "animalfacts", classLevel: "primary-3", complexity: "simple" },
      { text: "Kakapo: World's only flightless parrot that smells like flowers", subject: "animalfacts", classLevel: "primary-3", complexity: "simple" },
      { text: "Satanic leaf-tailed gecko: Looks exactly like a dead leaf, even has bite marks", subject: "animalfacts", classLevel: "primary-3", complexity: "simple" },
      { text: "Thorny devil lizard: Collects water through its skin like living straw", subject: "animalfacts", classLevel: "primary-3", complexity: "simple" },

      // ===== PRIMARY 4 — Weird Animal Families & Life Cycles =====
      { text: "Platypus: Mammal that lays eggs, has venomous spurs, and glows under UV light", subject: "animalfacts", classLevel: "primary-4", complexity: "standard" },
      { text: "Echidna: Spiny anteater that can sense electricity and curls into a spiky ball", subject: "animalfacts", classLevel: "primary-4", complexity: "standard" },
      { text: "Sea pig: Pink, balloon-like sea cucumber that walks on tube feet in the deep sea", subject: "animalfacts", classLevel: "primary-4", complexity: "standard" },
      { text: "Pink fairy armadillo: Tiny pink-shelled digger that swims through sand", subject: "animalfacts", classLevel: "primary-4", complexity: "standard" },
      { text: "Dumbo octopus life: From floating egg to ear-flapping adult in the deep sea", subject: "animalfacts", classLevel: "primary-4", complexity: "standard" },
      { text: "Caecilian: Legless amphibian that feeds babies its own skin", subject: "animalfacts", classLevel: "primary-4", complexity: "standard" },
      { text: "Venezuelan poodle moth: Fuzzy white moth that looks like a Pokémon", subject: "animalfacts", classLevel: "primary-4", complexity: "standard" },
      { text: "Blue dragon sea slug: Floats upside down, steals stinging cells from its prey", subject: "animalfacts", classLevel: "primary-4", complexity: "standard" },
      { text: "Peacock spider: Tiny spider that dances like a disco ball to attract mates", subject: "animalfacts", classLevel: "primary-4", complexity: "standard" },
      { text: "Honduran white bat: Builds tents from leaves, looks like cotton ball with nose", subject: "animalfacts", classLevel: "primary-4", complexity: "standard" },
      { text: "Magnificent frigatebird: Inflates red throat pouch like a balloon to attract mates", subject: "animalfacts", classLevel: "primary-4", complexity: "standard" },
      { text: "Superb bird-of-paradise: Turns into a smiling face with neon blue eyes during dance", subject: "animalfacts", classLevel: "primary-4", complexity: "standard" },

      // ===== PRIMARY 5 — Extreme Animal Adaptations =====
      { text: "Wood frog: Freezes solid all winter, heart stops, then thaws and hops away", subject: "animalfacts", classLevel: "primary-5", complexity: "standard" },
      { text: "Alpine ibex: Climbs nearly vertical dam walls licking salt", subject: "animalfacts", classLevel: "primary-5", complexity: "standard" },
      { text: "Regenerating animals: Axolotl regrows limbs, starfish regrows whole body from one arm", subject: "animalfacts", classLevel: "primary-5", complexity: "standard" },
      { text: "Electric eel: Generates 600 volts, can curl up to double its power", subject: "animalfacts", classLevel: "primary-5", complexity: "standard" },
      { text: "Bar-headed goose: Flies over Mount Everest using special oxygen-carrying blood", subject: "animalfacts", classLevel: "primary-5", complexity: "standard" },
      { text: "Pistol shrimp: Snaps claw so fast it creates a bubble hotter than the sun", subject: "animalfacts", classLevel: "primary-5", complexity: "standard" },
      { text: "Common poorwill: The only bird that hibernates for months like a bear", subject: "animalfacts", classLevel: "primary-5", complexity: "standard" },
      { text: "Sea cucumber: Ejects sticky, toxic intestines to escape predators, grows new ones", subject: "animalfacts", classLevel: "primary-5", complexity: "standard" },
      { text: "Horned lizard: Shoots blood from its eyes to scare away coyotes", subject: "animalfacts", classLevel: "primary-5", complexity: "standard" },
      { text: "Archerfish: Shoots water jets like a pistol to knock insects off branches", subject: "animalfacts", classLevel: "primary-5", complexity: "standard" },
      { text: "Sperm whale: Clicks so loud it could vibrate a human to death", subject: "animalfacts", classLevel: "primary-5", complexity: "standard" },
      { text: "Tardigrade cryptobiosis: Enters death-like state for decades, comes back to life", subject: "animalfacts", classLevel: "primary-5", complexity: "standard" },

      // ===== PRIMARY 6 — Animal Intelligence & Social Mysteries =====
      { text: "Octopus intelligence: Solves puzzles, opens jars, recognizes human faces", subject: "animalfacts", classLevel: "primary-6", complexity: "standard" },
      { text: "Raven cognition: Outsmarts chimpanzees, plans for the future, holds grudges", subject: "animalfacts", classLevel: "primary-6", complexity: "standard" },
      { text: "Honeybee waggle dance: Tells sisters exactly where flowers are using dance moves", subject: "animalfacts", classLevel: "primary-6", complexity: "standard" },
      { text: "Elephant infrasound: Talks with rumbles too low for humans to hear, miles away", subject: "animalfacts", classLevel: "primary-6", complexity: "standard" },
      { text: "Orca culture: Different pods speak different languages and eat different foods", subject: "animalfacts", classLevel: "primary-6", complexity: "standard" },
      { text: "Ant supercolonies: Millions of ants working as one super-organism", subject: "animalfacts", classLevel: "primary-6", complexity: "standard" },
      { text: "Cleaner wrasse: Fish that runs a cleaning station, remembers each client", subject: "animalfacts", classLevel: "primary-6", complexity: "standard" },
      { text: "Portia jumping spider: Plans routes, learns from watching other spiders hunt", subject: "animalfacts", classLevel: "primary-6", complexity: "standard" },
      { text: "Meerkat sentinels: Takes turns being lookout, uses different alarms for different predators", subject: "animalfacts", classLevel: "primary-6", complexity: "standard" },
      { text: "Dolphin signature whistles: Has its own name that others call to get its attention", subject: "animalfacts", classLevel: "primary-6", complexity: "standard" },
      { text: "New Caledonian crow: Makes hooks from twigs, drops nuts on roads for cars to crack", subject: "animalfacts", classLevel: "primary-6", complexity: "standard" },
      { text: "Humpback whale bubble nets: Team hunts by blowing curtains of bubbles to trap fish", subject: "animalfacts", classLevel: "primary-6", complexity: "standard" },
    ],
  },

  humanbody: {
    aliases: ["human-body", "humanbody", "body", "anatomy", "senses", "health"],
    config: {
      name: "Human Body Facts",
      collectionName: "humanbody-posts",
      source: "auto-humanbody-v1",
      apiKeyField: "geminiKey",
      groqKeyField: "groqKey",
    },
    flavor: {
      educatorRole: "master human-body educator",
      teachLike: "a friendly body explorer in the spirit of The Magic School Bus",
      powerLower: "body",
      powerWord: "Body",
      powerOwner: "ability",
      Noun: "Body",
      noun: "body part",
      livesVerb: "sits",
      hookFlavor: "Magic School Bus",
      domainPhrase: "the human body",
      topicPhrase: "human body facts",
      explorerNoun: "body explorer (like a Magic School Bus guide)",
      domainNoun: "human biology",
      imagineTitle: "Imagine If Your Body Could Do This",
    },
    labels: {
      anatomy: "Anatomy",
      senses: "Senses & Brain",
      health: "Health & Immunity",
    },
    styles: {
      anatomy: "sci-anatomy",
      senses: "sci-senses",
      health: "sci-health",
    },
    topics: [
      { text: "Heart: The fist-sized pump that beats about 100,000 times every single day", subject: "anatomy", classLevel: "primary-1", complexity: "simple" },
      { text: "Skin: Your stretchy waterproof suit that heals its own cuts", subject: "anatomy", classLevel: "primary-1", complexity: "simple" },
      { text: "Tongue: The muscle that tastes sweet, sour, salty and bitter", subject: "senses", classLevel: "primary-1", complexity: "simple" },
      { text: "Eyes: Two living cameras that turn light into colourful pictures", subject: "senses", classLevel: "primary-2", complexity: "simple" },
      { text: "Ears: Tiny bones that turn wiggling air into music and voices", subject: "senses", classLevel: "primary-2", complexity: "simple" },
      { text: "Teeth: 20 baby teeth that make room for 32 grown-up ones", subject: "anatomy", classLevel: "primary-2", complexity: "simple" },
      { text: "Lungs: Two pink balloons that breathe about 20,000 times a day", subject: "anatomy", classLevel: "primary-3", complexity: "simple" },
      { text: "Bones: 206 bones hold you up, and a baby is born with about 300", subject: "anatomy", classLevel: "primary-3", complexity: "simple" },
      { text: "Muscles: Stretchy ropes that pull your bones to make you run and jump", subject: "anatomy", classLevel: "primary-3", complexity: "simple" },
      { text: "Brain: The 1.4 kg control centre that sends messages faster than a speeding motorbike", subject: "anatomy", classLevel: "primary-4", complexity: "standard" },
      { text: "Stomach: The stretchy bag with acid strong enough to turn food into soup", subject: "health", classLevel: "primary-4", complexity: "standard" },
      { text: "Blood: Red cells, white cells and platelets in a river that never stops", subject: "anatomy", classLevel: "primary-4", complexity: "standard" },
      { text: "Nose: Millions of smell sensors that can tell thousands of scents apart", subject: "senses", classLevel: "primary-5", complexity: "standard" },
      { text: "Kidneys: Two bean-shaped filters that clean all your blood many times a day", subject: "anatomy", classLevel: "primary-5", complexity: "standard" },
      { text: "Sleep: Why your brain tidies up and your body grows while you snore", subject: "health", classLevel: "primary-5", complexity: "standard" },
      { text: "Immune system: The army of white blood cells that fights germs before you feel sick", subject: "health", classLevel: "primary-6", complexity: "standard" },
      { text: "Joints: Hinges, balls and sockets that let you dance, kick and write", subject: "anatomy", classLevel: "primary-6", complexity: "standard" },
      { text: "Small intestine: About seven metres of tubing that soaks up the goodness from your food", subject: "anatomy", classLevel: "primary-6", complexity: "standard" },
      { text: "Reflex arc: Why your hand jumps off a hot pot before your brain even knows", subject: "anatomy", classLevel: "jss-1", complexity: "standard" },
      { text: "Digestion: The journey of a bite of food from mouth to the end of the line", subject: "health", classLevel: "jss-1", complexity: "standard" },
      { text: "Double circulation: Two loops, one heart, and why blood visits your lungs first", subject: "anatomy", classLevel: "jss-1", complexity: "standard" },
      { text: "Hormones: Chemical messengers like adrenaline that make your heart race", subject: "health", classLevel: "jss-2", complexity: "standard" },
      { text: "Respiration: How every cell burns sugar with oxygen to make energy", subject: "anatomy", classLevel: "jss-2", complexity: "standard" },
      { text: "Eye focusing: How the lens changes shape so you can see near and far", subject: "senses", classLevel: "jss-2", complexity: "standard" },
      { text: "Vaccines: Teaching your immune system to beat a germ without making you sick", subject: "health", classLevel: "jss-3", complexity: "standard" },
      { text: "The nephron: A million tiny filters in each kidney deciding what stays and what goes", subject: "anatomy", classLevel: "jss-3", complexity: "standard" },
      { text: "Body temperature: Sweating, shivering and the thermostat in your brain", subject: "health", classLevel: "jss-3", complexity: "standard" },
      { text: "Homeostasis: How negative feedback keeps your sugar, water and temperature steady", subject: "health", classLevel: "ss-1", complexity: "standard" },
      { text: "Nerve impulses: How an electrical signal runs along a neuron and jumps a synapse", subject: "anatomy", classLevel: "ss-1", complexity: "standard" },
      { text: "Sickle cell: How one tiny gene change reshapes haemoglobin and protects against malaria", subject: "health", classLevel: "ss-1", complexity: "standard" },
      { text: "Gas exchange: Why the alveoli have huge surface area and walls one cell thick", subject: "anatomy", classLevel: "ss-2", complexity: "standard" },
      { text: "Insulin and glucagon: Two hormones that balance blood sugar, and what goes wrong in diabetes", subject: "health", classLevel: "ss-2", complexity: "standard" },
      { text: "Blood clotting: The chain reaction that plugs a wound within minutes", subject: "anatomy", classLevel: "ss-2", complexity: "standard" },
      { text: "Antibodies: How B cells are selected, multiplied and remembered after an infection", subject: "health", classLevel: "ss-3", complexity: "standard" },
      { text: "Muscle contraction: Actin, myosin and ATP in the sliding filament model", subject: "anatomy", classLevel: "ss-3", complexity: "standard" },
      { text: "Synapse chemistry: How neurotransmitters pass a message and how drugs hijack it", subject: "senses", classLevel: "ss-3", complexity: "standard" },
    ],
  },

  engineering: {
    aliases: ["engineer", "engineers", "inventions", "howitworks", "how-it-works", "tech", "technology"],
    config: {
      name: "Engineering Facts",
      collectionName: "engineering-posts",
      source: "auto-engineering-v1",
      apiKeyField: "geminiKey",
      groqKeyField: "groqKey",
    },
    flavor: {
      educatorRole: "master educator who makes inventions and technology fascinating for kids",
      teachLike: "a curious young inventor who takes everything apart to see how it works",
      powerLower: "invention",
      powerWord: "Invention",
      powerOwner: "invention",
      Noun: "Invention",
      noun: "invention or machine",
      livesVerb: "is used",
      hookFlavor: "How It's Made",
      domainPhrase: "inventions and how things work",
      topicPhrase: "inventions and how things work",
      explorerNoun: "young inventor",
      domainNoun: "technology and engineering",
      imagineTitle: "Imagine If You Invented It",
    },
    labels: {
      inventions: "Inventions",
      howitworks: "How It Works",
      amazing: "Amazing Builds",
      machines: "Cool Machines",
    },
    styles: {
      inventions: "sci-inventions",
      howitworks: "sci-howitworks",
      amazing: "sci-amazing",
      machines: "sci-machines",
    },
    topics: [
      { text: "Wheel: The round invention that changed how the whole world moves", subject: "inventions", classLevel: "primary-1", complexity: "simple" },
      { text: "Zipper: How tiny teeth lock together without any glue", subject: "howitworks", classLevel: "primary-1", complexity: "simple" },
      { text: "Giant bridges: Roads in the sky built over rivers and the sea", subject: "amazing", classLevel: "primary-1", complexity: "simple" },
      { text: "Light bulb: The glowing invention that gave us the night", subject: "inventions", classLevel: "primary-2", complexity: "simple" },
      { text: "Magnets: Why they pull some things and ignore others", subject: "howitworks", classLevel: "primary-2", complexity: "simple" },
      { text: "Skyscrapers: Buildings so tall they touch the clouds", subject: "amazing", classLevel: "primary-2", complexity: "simple" },
      { text: "Paper: How a mash of plant fibres became the page you write on", subject: "inventions", classLevel: "primary-3", complexity: "simple" },
      { text: "Torch: How a battery, a wire and a bulb make light", subject: "howitworks", classLevel: "primary-3", complexity: "simple" },
      { text: "Race cars: Machines built to go faster than 300 km/h", subject: "machines", classLevel: "primary-3", complexity: "simple" },
      { text: "Telephone: The invention that sent voices along a wire", subject: "inventions", classLevel: "primary-4", complexity: "standard" },
      { text: "Fridge: How a box keeps food cold by pushing heat out", subject: "howitworks", classLevel: "primary-4", complexity: "standard" },
      { text: "Kainji Dam: The giant wall that makes electricity from the River Niger", subject: "amazing", classLevel: "primary-4", complexity: "standard" },
      { text: "Aeroplane: How two brothers got a heavy machine to fly", subject: "inventions", classLevel: "primary-5", complexity: "standard" },
      { text: "Microwave oven: How invisible waves heat your food from the inside", subject: "howitworks", classLevel: "primary-5", complexity: "standard" },
      { text: "Submarines: Boats that dive deep and live under the sea", subject: "machines", classLevel: "primary-5", complexity: "standard" },
      { text: "Printing press: The invention that spread books and ideas everywhere", subject: "inventions", classLevel: "primary-6", complexity: "standard" },
      { text: "Touch screen: How your phone knows exactly where your finger is", subject: "howitworks", classLevel: "primary-6", complexity: "standard" },
      { text: "Space station: A home that circles Earth at 28,000 km/h", subject: "amazing", classLevel: "primary-6", complexity: "standard" },
      { text: "Accidental inventions: Penicillin, microwaves and sticky notes found by luck", subject: "inventions", classLevel: "jss-1", complexity: "standard" },
      { text: "GPS: How satellites tell your phone exactly where you are", subject: "howitworks", classLevel: "jss-1", complexity: "standard" },
      { text: "Roller coasters: The engineering that makes you scream and keeps you safe", subject: "machines", classLevel: "jss-1", complexity: "standard" },
      { text: "Radio: How voices travel through the air without any wires", subject: "inventions", classLevel: "jss-2", complexity: "standard" },
      { text: "Camera: How a lens and a sensor freeze one moment forever", subject: "howitworks", classLevel: "jss-2", complexity: "standard" },
      { text: "Pyramids: How ancient builders moved giant stones with ramps and rope", subject: "amazing", classLevel: "jss-2", complexity: "standard" },
      { text: "The internet: How a message crosses the world in a fraction of a second", subject: "inventions", classLevel: "jss-3", complexity: "standard" },
      { text: "Wi-Fi and Bluetooth: How devices talk to each other without wires", subject: "howitworks", classLevel: "jss-3", complexity: "standard" },
      { text: "Robots: Machines that sense, think and move on their own", subject: "machines", classLevel: "jss-3", complexity: "standard" },
      { text: "Steam engine: The invention that started the Industrial Revolution", subject: "inventions", classLevel: "ss-1", complexity: "standard" },
      { text: "Jet engine: How air, fuel and fire push a plane at 900 km/h", subject: "howitworks", classLevel: "ss-1", complexity: "standard" },
      { text: "Burj Khalifa: How a building over 800 metres tall stands up to the wind", subject: "amazing", classLevel: "ss-1", complexity: "standard" },
      { text: "Transistor: The tiny switch that made computers and phones possible", subject: "inventions", classLevel: "ss-2", complexity: "standard" },
      { text: "Electric cars: How a battery and a motor replace a petrol engine", subject: "howitworks", classLevel: "ss-2", complexity: "standard" },
      { text: "Mars rovers: Robot explorers that work alone on another planet", subject: "machines", classLevel: "ss-2", complexity: "standard" },
      { text: "Lasers: From a lab idea to barcodes, eye surgery and fibre internet", subject: "inventions", classLevel: "ss-3", complexity: "standard" },
      { text: "Nuclear power: How splitting atoms boils water to make electricity", subject: "howitworks", classLevel: "ss-3", complexity: "standard" },
      { text: "Self-driving cars: Sensors and software that drive without a person", subject: "machines", classLevel: "ss-3", complexity: "standard" },
    ],
  },
};

// ─── SHARED PROMPT BUILDER (filled in from each subject's flavor) ──
// Every lesson is written as ONE structured page that blogs/css/render.css
// knows how to dress (headline, quick-facts sticky notes, two-column body,
// comparison tables, feature notes, activity, quiz, vocabulary). The model is
// given the exact skeleton, so new posts look like the best existing ones
// instead of a bare run of <h3>/<p>.
function gradeOfLevel(classLevel) {
  const [type, n] = String(classLevel || "primary-4").split("-");
  return +n + ({ primary: 0, jss: 6, ss: 9 }[type] ?? 0);
}

function makePromptBuilder(flavor) {
  return function buildSubjectPrompt(topic) {
    const { text, classLevel, complexity } = topic;
    const grade = gradeOfLevel(classLevel);
    const level =
      grade <= 3
        ? "Grades 1-3 (ages 6-8): very short sentences, one idea each, everyday words"
        : grade <= 6
          ? "Grades 4-6 (ages 9-11): short sentences, simple science words explained at once"
          : grade <= 9
            ? "Grades 7-9 (ages 12-14): real science vocabulary, explain the how and why"
            : "Grades 10-12 (ages 15-18): exam-level detail, correct terminology, mechanisms and evolutionary reasons";
    const depth = complexity === "simple" ? "light" : "full";
    return `You are a ${flavor.educatorRole} writing one illustrated lesson page on: "${text}"

READER: Grade ${grade} Nigerian student. ${level}.
VOICE: ${flavor.teachLike} - warm, full of wonder, "${flavor.powerLower} power" energy, never boring. Use comparisons kids know (football, jollof, danfo buses, phones, games). Facts must be accurate.

OUTPUT: ONE block of HTML that starts with <div class="lesson-note"> and ends with </div>. No markdown, no <html>/<body>, no <style>, no <script>, no <img>, no inline style attributes, no emoji, no SVG. Use ONLY the classes shown below, exactly as written. Depth: ${depth}.

SKELETON (replace every [bracketed] part with real content; keep the class names):

<div class="lesson-note">
  <div class="ln-headline">
    <div class="ln-kicker">${flavor.Noun} Facts · Grade ${grade}</div>
    <h1 class="ln-h1">[Catchy title part]: <em>[the ${flavor.noun}'s name or the big idea]</em></h1>
    <p class="ln-lede">[2-3 sentence hook: a wow fact or a question that makes the child stop and wonder]</p>
  </div>
  <div class="ln-byline">
    <strong>Prep Portal Science Desk</strong><span class="ln-byline-dot">·</span>
    <span>[3 topic words separated by · ]</span><span class="ln-byline-dot">·</span>
    <span class="ln-level-badge">Grade ${grade}</span>
  </div>
  <div class="ln-facts-strip">
    <div class="ln-facts-label">Quick Facts</div>
    <div class="ln-facts-grid">
      [exactly 3 of:]
      <div class="ln-fact-item"><div class="ln-fact-num">[2-3 word label]</div><div class="ln-fact-text">[one sentence, with a real number or measurement when you can]</div></div>
    </div>
  </div>
  <div class="ln-article-body">
    <div class="ln-col">
      <span class="ln-h2">[Meet the ${flavor.Noun} heading]</span>
      <p class="ln-p">[4-5 sentences: what it looks like, where it ${flavor.livesVerb} (include Africa or Nigeria if true), why it is unique. Highlight 1-2 key terms with <span class="ln-chip blue">term</span>]</p>
      <div class="ln-pull-quote"><span class="ln-quote-mark">"</span><p>[one amazing fact worth remembering]</p></div>
      <span class="ln-h2">[How it works heading]</span>
      <p class="ln-p">[the superpower explained simply, 5-6 sentences, comparisons kids know, key terms in <span class="ln-chip red">term</span>]</p>
      <ul>
        [3-4 of:] <li><span class="ln-chip green">[term]</span> - [one sentence]</li>
      </ul>
    </div>
    <div class="ln-col">
      <span class="ln-h2">[Why it matters heading]</span>
      <p class="ln-p">[why this ability helps it survive, 4-5 sentences]</p>
      <ol class="ln-process-list">
        [3-4 of:] <li><span class="ln-process-title">Step 1 - [Name].</span><br>[one or two sentences]</li>
      </ol>
      <div class="ln-pull-quote"><span class="ln-quote-mark">"</span><p>[a surprising second fact]</p></div>
    </div>
  </div>
  <div class="ln-table-section">
    <div class="ln-table-title">[The ${flavor.noun} vs. a human child / vs. a similar ${flavor.noun}]</div>
    <table class="ln-table">
      <thead><tr><th></th><th>[${flavor.Noun}]</th><th>[Human / other]</th></tr></thead>
      <tbody>
        [4 rows of:] <tr><td>[trait]</td><td>[its version]</td><td>[the comparison]</td></tr>
      </tbody>
    </table>
  </div>
  <div class="ln-features">
    <div class="ln-features-title">${flavor.imagineTitle || `Imagine If You Had This ${flavor.powerWord} Power`}</div>
    <div class="ln-features-grid">
      [exactly 3 of:]
      <div class="ln-feature-card"><div class="ln-feature-num">[short tag]</div><div class="ln-feature-label">[fun title]</div><div class="ln-feature-desc">[2 imaginative sentences about what you could do]</div></div>
    </div>
  </div>
  <div class="ln-activity">
    <div>
      <div class="ln-activity-label">Try This</div>
      <p class="ln-activity-text"><strong>[Activity name].</strong> [A safe hands-on activity using things found at home or school, 3-4 sentences]</p>
    </div>
  </div>
  <div class="ln-table-section">
    <div class="ln-table-title">Check Your Understanding</div>
    <table class="ln-table">
      <thead><tr><th>Question</th><th>Think about it</th></tr></thead>
      <tbody>
        [4 rows of a recall or reasoning question and its short answer:] <tr><td>[question]</td><td>[answer]</td></tr>
      </tbody>
    </table>
  </div>
  <div class="ln-table-section">
    <div class="ln-table-title">Vocabulary Builder</div>
    <table class="ln-table">
      <thead><tr><th>Word</th><th>Definition</th></tr></thead>
      <tbody>
        [5-6 rows of:] <tr><td><strong>[word]</strong></td><td>[child-friendly definition]</td></tr>
      </tbody>
    </table>
  </div>
</div>

RULES:
- Every section above must be present, in this order. Do not add other classes or sections.
- Chip colours allowed: red, blue, green, amber, purple.
- Keep each cell and paragraph short and concrete. Use the plain hyphen "-" and straight quotes.
- Everything must be true. If unsure of a number, describe it without a number.

Now write the lesson page. Output only the HTML.`;
  };
}

// ─── SHARED TONE GUIDES (per level, flavoured per subject) ────
function makeToneGuide(flavor) {
  return function getToneGuide(levelType) {
    const guides = {
      primary: `You are an enthusiastic ${flavor.explorerNoun} talking to kids ages 5-11.

**Key rules:**
- Be amazed by the ${flavor.domainPhrase} — your excitement is contagious
- Use short, punchy sentences
- Say "WOW!" "Check this out!" "You won't believe this!"
- Compare ${flavor.noun} abilities to things kids know (superheroes, video games, sports)
- Ask "Can you imagine..." and "What if YOU could..."
- End with a challenge: "Now go tell someone about this amazing ${flavor.noun}!"`,

      jss: `You are a ${flavor.domainNoun} educator for ages 11-14. Keep the wonder but add more science.

**Key rules:**
- Start with the "wow" factor, then explain the "how"
- Use analogies that teens get (video games, social media, sports)
- Connect ${flavor.noun} abilities to biology concepts
- Call out common myths about the ${flavor.noun}
- End with a "deeper dive" question for curious students`,

      ss: `You are a ${flavor.domainNoun} teacher for ages 14-18. Rigorous but still fascinating.

**Key rules:**
- Respect that they love ${flavor.domainPhrase} but need exam-level knowledge
- Explain the evolutionary WHY behind each adaptation
- Use proper taxonomic and anatomical terminology
- Connect ${flavor.noun} facts to broader biological principles
- Include exam-style application questions`,
    };
    return guides[levelType];
  };
}

// ─── SHARED HOOK CONTENT (flavoured per subject) ──────────────
function makeHookContent(flavor) {
  return {
    primary: {
      question: `**HOOK TYPE: QUESTION**

Open your lesson with a question that makes a child stop and wonder.

Use "Did you know…", "Have you ever…", "What if I told you…", "Can you imagine…", or "I bet you can't…" patterns. Keep the energy high and the pause clear, then reveal the ${flavor.noun}.`,
      descriptive: `**HOOK TYPE: DESCRIPTIVE**

Paint a picture with your words. Tell the child to close their eyes and SEE the ${flavor.noun}. Use ONE sense at a time (sight, sound, or touch) across 3-4 sentences.`,
      story: `**HOOK TYPE: STORY**

Tell a short story with a ${flavor.noun} character, a small problem, and a fascinating solution that uses the ${flavor.noun}'s unique ability. Keep it to 4-5 sentences.`,
      wildKratts: `**HOOK TYPE: ${flavor.hookFlavor.toUpperCase()}**

Channel ${flavor.teachLike} energy — excitement, discovery, and "${flavor.powerLower} power"! Use a "${flavor.powerWord} Power" challenge or a "WOW FACT" opening. Keep it excited and punchy.`,
    },
    jss: {
      wildKratts: `**HOOK TYPE: ${flavor.hookFlavor.toUpperCase()} (JSS Level)**

Same wonder, more scientific depth. Open with a punchy "${flavor.powerWord} Power — ACTIVATE!" style hook, then promise the real biology behind it.`,
    },
    ss: {
      wildKratts: `**HOOK TYPE: ${flavor.hookFlavor.toUpperCase()} (SS Level — Engagement Hook)**

Use the ${flavor.teachLike} frame as a fun entry point before diving into rigorous biology — then move from "cool fact" to the actual molecular/physiological mechanism.`,
    },
  };
}

// ─── SUBJECT RESOLUTION ───────────────────────────────────────
// Build an alias → canonical-key lookup once.
const ALIAS_MAP = (() => {
  const map = {};
  for (const [key, entry] of Object.entries(SUBJECTS)) {
    map[key] = key;
    for (const a of entry.aliases || []) map[a] = key;
  }
  return map;
})();

export function resolveSubjectKey(param) {
  const k = (param || "").toLowerCase();
  return ALIAS_MAP[k] || "plants";
}

// Returns a module-shaped object identical to the old per-subject data.js,
// so blog.js / ui-controller.js / publisher-core.js need no structural change.
export function getSubjectData(param) {
  const entry = SUBJECTS[resolveSubjectKey(param)];
  return {
    SUBJECT_MODELS,
    SUBJECT_CONFIG: entry.config,
    SUBJECT_TOPICS: entry.topics,
    SUBJECT_LABELS: entry.labels,
    SUBJECT_STYLES: entry.styles,
    CLASS_LABELS,
    CLASS_STYLES,
    HOOK_STYLES,
    HOOK_CONTENT: makeHookContent(entry.flavor),
    getToneGuide: makeToneGuide(entry.flavor),
    buildSubjectPrompt: makePromptBuilder(entry.flavor),
    generateAllPrompts() {
      const build = makePromptBuilder(entry.flavor);
      return entry.topics.map((topic, i) => ({
        ...topic,
        prompt: build(topic),
        hookStyle: HOOK_STYLES[i % HOOK_STYLES.length],
      }));
    },
  };
}
