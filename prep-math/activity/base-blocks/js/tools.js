/* ============================================================================
   Manipulatives — what there is to put on the canvas
   ----------------------------------------------------------------------------
   ONE registry, read by both the shelf on the landing page and the dock inside
   the canvas, so the three families can never drift apart between them.
   ========================================================================== */

import {
  blocksArt, schotyArt, suanpanArt, sorobanArt,
  placeValueArt, multiplyArt, divideArt,
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
    id: "grids",
    label: "Charts & grids",
    icon: "table",
    blurb: "Boards to lay the blocks on, and tables to read a fact off.",
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
          "Every product to twelve twelves. Tap a cell to hide or show it, and " +
          "its row and column light up so you can see where the answer comes from.",
        art: multiplyArt,
      },
      {
        id: "division",
        kind: "board",
        variant: "divide",
        label: "Division Grid",
        short: "Divide",
        blurb:
          "The same table read backwards: pick the number you are dividing by, " +
          "then find the one you are dividing, and the answer is on the edge.",
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
