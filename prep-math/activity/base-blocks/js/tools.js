/* ============================================================================
   Manipulatives — what there is to put on the canvas
   ----------------------------------------------------------------------------
   ONE registry, read by both the shelf on the landing page and the dock inside
   the canvas, so the families can never drift apart between them. A group may
   name a `face` — the tool whose picture stands for it on the landing card —
   and gets its first tool if it does not.
   ========================================================================== */

import {
  blocksArt, schotyArt, suanpanArt, sorobanArt,
  placeValueArt, multiplyArt, divideArt, tilesArt, frameArt, numberCardArt,
  longDivideArt, columnAddArt,
} from "./illustrations.js";

export const GROUPS = [
  {
    id: "blocks",
    label: "Blocks",
    icon: "blocks",
    blurb: "Place-value blocks you can cut apart and trade back together.",
    tools: [
      {
        id: "base-blocks",
        kind: "blocks",
        label: "Base Blocks",
        short: "Blocks",
        blurb:
          "Units, rods, flats and cubes on squared paper. Split one into its " +
          "parts, trade a handful back into one, or size a cuboid of your own — " +
          "in any base from two to twelve.",
        art: blocksArt,
      },
    ],
  },
  {
    id: "abacus",
    label: "Abacus",
    icon: "abacus",
    /* the family's face on the landing card: the soroban is the frame most
       people picture, and the schoty (first here) reads as a ladder in a
       thumbnail */
    face: "soroban",
    blurb: "Three counting frames, each with its own way of holding a number.",
    tools: [
      {
        id: "schoty",
        kind: "abacus",
        variant: "schoty",
        label: "Russian Schoty",
        short: "Schoty",
        blurb:
          "Ten beads to a wire, counted from the right, with the middle pair " +
          "darkened so you can see five without counting to it.",
        art: schotyArt,
      },
      {
        id: "suanpan",
        kind: "abacus",
        variant: "suanpan",
        label: "Chinese Suanpan",
        short: "Suanpan",
        blurb:
          "Two beads above the bar worth five each, five below worth one each — " +
          "room enough to hold a carry before you make it.",
        art: suanpanArt,
      },
      {
        id: "soroban",
        kind: "abacus",
        variant: "soroban",
        label: "Japanese Soroban",
        short: "Soroban",
        blurb:
          "One bead above the bar worth five, four below worth one. Exactly " +
          "enough beads for a digit and not one more.",
        art: sorobanArt,
      },
    ],
  },
  {
    id: "tiles",
    label: "Algebra tiles",
    icon: "algebra",
    blurb: "Tiles and cubes for x and y and 1, and a red one of each for the negatives.",
    tools: [
      {
        id: "algebra-tiles",
        kind: "tile",
        label: "Algebra Tiles",
        short: "Tiles",
        blurb:
          "x³ , x²y , xy² , y³ , x² , xy , y² , x , y and 1 — unit, rod, flat " +
          "and cube built out of x and y instead of out of ten, and a red one " +
          "of each, because a piece and its opposite are nothing at all. The " +
          "x-tile is deliberately not a whole number of units long: x is the " +
          "thing you are not told.",
        art: tilesArt,
      },
      {
        id: "area-frame",
        kind: "board",
        variant: "area",
        label: "Area Frame",
        short: "Frame",
        blurb:
          "A corner with a track along the top and a track down the side. Lay " +
          "pieces along the two tracks to say what you are multiplying, fill " +
          "the field between them to say what it comes to, and the frame says " +
          "whether the two agree — read the other way round, it is factorising.",
        art: frameArt,
      },
    ],
  },
  {
    id: "grids",
    label: "Charts & grids",
    icon: "table",
    /* This family shows FOUR pictures on the door, because it holds four
       different KINDS of thing behind one name. The number card is not a chart
       and neither written sum is a table, and behind a single picture of a
       place-value chart nobody ever found any of them. */
    faces: ["place-value", "column-addition", "long-division", "number-card"],
    blurb: "Boards to lay the blocks on, tables to read a fact off, and sheets to work a sum out on.",
    tools: [
      {
        id: "place-value",
        kind: "board",
        variant: "place",
        label: "Place Value Chart",
        short: "Place value",
        blurb:
          "A column for each place, relabelled the moment you change the base. " +
          "Stand blocks in the columns and it reads the number back to you.",
        art: placeValueArt,
      },
      {
        id: "multiplication",
        kind: "board",
        variant: "multiply",
        label: "Multiplication Grid",
        short: "Multiply",
        blurb:
          "Every product to twelve twelves in base ten — and in any other base, " +
          "the whole of its multiplication in one square. Tap a cell to light " +
          "its row and column, or hide it and try to say it first.",
        art: multiplyArt,
      },
      {
        id: "number-card",
        kind: "card",
        label: "Number Card",
        short: "Number card",
        blurb:
          "A card that says what the canvas comes to, written whichever way " +
          "you ask for: 123, or 100 + 20 + 3, or 1 × 10² + 2 × 10¹ + 3, or " +
          "one flat and two rods and three units. Change the canvas and the " +
          "card follows it.",
        art: numberCardArt,
      },
      {
        id: "column-addition",
        kind: "board",
        variant: "column",
        label: "Column Addition",
        short: "Adding up",
        blurb:
          "Numbers stacked, a line, and the answer written a column at a time "
          + "from the right. It asks what goes under the line and then what "
          + "carries — two questions, because they are two different facts — "
          + "and writes the carry small above the column it goes into. Add up "
          + "to four numbers, in any base you are working in.",
        art: columnAddArt,
      },
      {
        id: "long-division",
        kind: "board",
        variant: "longdiv",
        label: "Long Division",
        short: "Long division",
        blurb:
          "The bus stop, worked a line at a time. Say how many times it goes, "
          + "what that comes to and what is left, and the board writes each one "
          + "in its own column — or refuses it and says why. Set any sum you "
          + "like, in any base you are working in.",
        art: longDivideArt,
      },
      {
        id: "division",
        kind: "board",
        variant: "divide",
        label: "Division Grid",
        short: "Divide",
        blurb:
          "The same table read backwards, in whatever base you are working in: " +
          "find the number you are dividing inside the square, and its two " +
          "edges are what you divided by and what you got.",
        art: divideArt,
      },
    ],
  },
];

export const TOOLS = GROUPS.flatMap((g) => g.tools.map((t) => ({ ...t, group: g.id })));

export function toolById(id) {
  return TOOLS.find((t) => t.id === id) || null;
}

export function groupById(id) {
  return GROUPS.find((g) => g.id === id) || null;
}
