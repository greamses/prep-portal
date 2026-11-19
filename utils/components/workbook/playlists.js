/* ============================================================================
   PREPBOT TV'S PLAYLISTS — one list, read by the playlist covers
   (tools/film-thumbnail ?playlist=<topic>) and by the admin's Playlists panel
   (admin/films), which shows each cover and its YouTube description.
   A new topic needs an entry here (and a SUBJECTS entry in the thumbnail tool).
   ========================================================================== */

export const PLAYLISTS = {
  ratio: {
    title: "Ratio, step by step",
    blurb: ["What a ratio is", "Part, whole, difference", "Compound ratio", "Squares and cubes", "Ages, shapes"],
    about: "Ratio with the box method: a ratio is a number of boxes. Count the boxes, find one box, multiply back up, and check. The lessons come first, then real competition questions worked two ways.",
    tag: "ratio",
  },
  percent: {
    title: "Percentages, step by step",
    blurb: ["Out of a hundred", "Percent of an amount", "The keywords, one by one", "Reverse percentages"],
    about: "Percentages drawn as boxes and bars, with the equivalent fraction beside every step. Percent of an amount, increase and decrease, then the keywords one group at a time (take a part, add on, take away, out of, find the whole), with every per cent turned into a fraction and a decimal, and reverse percentages from real exam questions.",
    tag: "percentages",
  },
  averages: {
    title: "Mean, median, mode, range",
    blurb: ["Share it fairly", "Median and mode", "Totals", "Competition questions"],
    about: "Averages you can see: levelling columns for the mean, number cards sliding into order for the median, and totals for the competition questions.",
    tag: "averages",
  },
  algebra: {
    title: "Algebra derivations",
    blurb: ["The quadratic formula", "Completing the square", "With pictures"],
    about: "Where the formulas come from, drawn: completing the square with a real square, and the quadratic formula built one step at a time.",
    tag: "algebra",
  },
  patterns: {
    title: "Sequences and series",
    blurb: ["Find the rule", "The nth term", "Adding a series", "Shapes that grow"],
    about: "Sequences and series with number cards and jump arcs: find the rule in the gaps, the nth term, adding a series by pairing, and shapes that grow.",
    tag: "patterns",
  },
  soroban: {
    title: "The soroban, step by step",
    blurb: ["Counting and place value", "Fives and friends", "Multidigit sums", "Flash anzan", "Multiplying"],
    about: "A full soroban (Japanese abacus) course with PrepBot, from the first bead to multiplying. Counting on a rod, place value, simple sums, the five bead, small friends, big friends, multidigit sums, flash anzan in your head, and multiplying two digits by one and by two. Every bead moves on screen, in the order your fingers move it.",
    tag: "soroban",
  },
};

const SITE = "https://www.prepportal.com.ng";

/** The playlist's YouTube description: what it is, the videos in order, where to practise, hashtags. */
export function playlistDescription(topic, films) {
  const pl = PLAYLISTS[topic];
  if (!pl) return "";
  const mine = films.filter((f) => f.topic === topic);
  const lessons = mine.filter((f) => f.lesson), rest = mine.filter((f) => !f.lesson);
  const lines = [pl.about, ""];
  if (lessons.length) {
    lines.push("Lessons:");
    lessons.forEach((f, i) => lines.push(`${i + 1}. ${f.name}`));
    lines.push("");
  }
  if (rest.length) {
    lines.push("Worked questions:");
    rest.forEach((f) => lines.push(`- ${f.name}${f.of ? ` (${f.of})` : ""}`));
    lines.push("");
  }
  lines.push(`Watch them all, and practise, at ${SITE}/media/videos/?t=${topic}`);
  lines.push("");
  lines.push(`#PrepBot #PrepPortal #maths #${pl.tag}`);
  return lines.join("\n");
}
