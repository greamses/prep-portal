/* =====================================================================
   Practice algorithm library — Basics · F2L (41) · OLL (57) · PLL (21) · Patterns.
   Pure data (no imports) so it can be unit-checked in Node by
   scripts/verify-algs.mjs (parse + last-layer correctness).

   Notation supported by the engine (js/game.js):
     faces   U D L R F B      slices  M E S
     wide    u d l r f b  (or Uw Rw …)     rotations  x y z
     suffix  ' (anticlockwise)   2 (180°)
   Modules flagged `setup: true` (F2L/OLL/PLL) demonstrate by first setting up
   the case (the inverse of the algorithm) and then solving it.
   ===================================================================== */

export const ALGO_MODULES = [
  {
    id: "basics",
    label: "Basics",
    hint: "The core triggers every method is built from.",
    groups: [
      {
        cat: "Triggers",
        items: [
          { name: "Sexy Move", moves: "R U R' U'" },
          { name: "Sledgehammer", moves: "R' F R F'" },
          { name: "Hedgeslammer", moves: "F R' F' R" },
          { name: "Right F2L pair", moves: "U R U' R'" },
          { name: "Sune", moves: "R U R' U R U2 R'" },
          { name: "Anti-Sune", moves: "R' U' R U' R' U2 R" },
        ],
      },
    ],
  },

  {
    id: "f2l",
    label: "F2L",
    hint: "First Two Layers — all 41 cases. Tap one to set it up, then watch it solve.",
    setup: true,
    groups: [
      {
        cat: "Basic insertions",
        items: [
          { name: "F2L 1 · Pair insert (Right)", moves: "R U R'" },
          { name: "F2L 2 · Pair insert (Front)", moves: "y' R' U' R" },
          { name: "F2L 3 · Split insert (Right)", moves: "U R U' R'" },
          { name: "F2L 4 · Split insert (Front)", moves: "y' U' R' U R" },
        ],
      },
      {
        cat: "Corner in U, Edge in U (White on side)",
        items: [
          {
            name: "F2L 5 · Corner facing front, top match",
            moves: "U' R U2 R' U2 R U' R'",
          },
          {
            name: "F2L 6 · Corner facing right, top match",
            moves: "y' U R' U2 R U2 R' U R",
          },
          {
            name: "F2L 7 · Corner facing front, top differ",
            moves: "U' R U' R' U R U R'",
          },
          {
            name: "F2L 8 · Corner facing right, top differ",
            moves: "y' U R' U R U' R' U' R",
          },
          {
            name: "F2L 9 · Corner facing front, top match (separated)",
            moves: "U' R U R' U R U R'",
          },
          {
            name: "F2L 10 · Corner facing right, top match (separated)",
            moves: "y' U R' U' R U' R' U' R",
          },
          {
            name: "F2L 11 · Corner facing front, top differ (separated)",
            moves: "U' R U2 R' U R U' R'",
          },
          {
            name: "F2L 12 · Corner facing right, top differ (separated)",
            moves: "y' U R' U2 R U' R' U R",
          },
          {
            name: "F2L 13 · Corner facing front, top match (connected)",
            moves: "U2 R U R' U R U' R'",
          },
          {
            name: "F2L 14 · Corner facing right, top match (connected)",
            moves: "y' U2 R' U' R U' R' U R",
          },
          {
            name: "F2L 15 · Corner facing front, top differ (connected)",
            moves: "R U' R' U2 R U' R'",
          },
          {
            name: "F2L 16 · Corner facing right, top differ (connected)",
            moves: "y' R' U R U2 R' U R",
          },
        ],
      },
      {
        cat: "Corner in U, Edge in U (White on top)",
        items: [
          {
            name: "F2L 17 · White up, edge matching side",
            moves: "R U2 R' U' R U R'",
          },
          {
            name: "F2L 18 · White up, edge mismatching side",
            moves: "y' R' U2 R U R' U' R",
          },
          {
            name: "F2L 19 · White up, edge separated, matching side",
            moves: "U R U' R' U' R U' R' U R U' R'",
          },
          {
            name: "F2L 20 · White up, edge separated, mismatching side",
            moves: "y' U' R' U R U R' U R U' R' U R",
          },
          {
            name: "F2L 21 · White up, edge in U, matching front",
            moves: "U2 R U2 R' U' R U R'",
          },
          {
            name: "F2L 22 · White up, edge in U, matching right",
            moves: "y' U2 R' U2 R U R' U' R",
          },
        ],
      },
      {
        cat: "Edge in Slot, Corner in U",
        items: [
          {
            name: "F2L 23 · Corner facing front (edge oriented)",
            moves: "R U' R' U R U' R' U2 R U' R'",
          },
          {
            name: "F2L 24 · Corner facing right (edge oriented)",
            moves: "y' R' U R U' R' U R U2 R' U R",
          },
          {
            name: "F2L 25 · Corner facing front (edge flipped)",
            moves: "U' R U' R' U2 R U' R'",
          },
          {
            name: "F2L 26 · Corner facing right (edge flipped)",
            moves: "y' U R' U R U2 R' U R",
          },
          {
            name: "F2L 27 · Corner facing front (edge flipped, separated)",
            moves: "U' R U R' U2 R U' R'",
          },
          {
            name: "F2L 28 · Corner facing right (edge flipped, separated)",
            moves: "y' U R' U' R U2 R' U R",
          },
        ],
      },
      {
        cat: "Corner in Slot, Edge in U",
        items: [
          {
            name: "F2L 29 · Corner facing front, white front",
            moves: "R U' R' U' R U R' U2 R U' R'",
          },
          {
            name: "F2L 30 · Corner facing right, white right",
            moves: "y' R' U R U R' U' R U2 R' U R",
          },
          {
            name: "F2L 31 · Corner facing front, white right",
            moves: "U' R U' R' U R U R'",
          },
          {
            name: "F2L 32 · Corner facing right, white front",
            moves: "y' U R' U R U' R' U' R",
          },
          {
            name: "F2L 33 · White up (edge matching front)",
            moves: "U' R U2 R' U R U' R'",
          },
          {
            name: "F2L 34 · White up (edge matching right)",
            moves: "y' U R' U2 R U' R' U R",
          },
        ],
      },
      {
        cat: "Corner in Slot, Edge in Slot",
        items: [
          {
            name: "F2L 35 · Corner solved, edge flipped",
            moves: "R U' R' U y' R' U2 R U2 R' U R",
          },
          {
            name: "F2L 36 · Corner flipped, edge solved",
            moves: "R U' R' U' R U R' U2 R U R'",
          },
          {
            name: "F2L 37 · Corner flipped, edge flipped (white front)",
            moves: "R U' R' U2 R U2 R' U R U' R'",
          },
          {
            name: "F2L 38 · Corner flipped, edge flipped (white right)",
            moves: "R U R' U' R U2 R' U' R U R'",
          },
          {
            name: "F2L 39 · Corner flipped, edge flipped (white up, front)",
            moves: "R U' R' U' R U R' U' R U2 R' U' R U R'",
          },
          {
            name: "F2L 40 · Corner flipped, edge flipped (white up, right)",
            moves: "R U' R' U R U' R' U R U' R'",
          },
          {
            name: "F2L 41 · Corner flipped, edge flipped (white up, double)",
            moves: "R U' R' U' R U2 R' U2 R U' R'",
          },
        ],
      },
    ],
  },

  {
    id: "oll",
    label: "OLL",
    hint: "Orient the last layer — all 57 cases. Tap one to set it up, then watch it solve.",
    setup: true,
    groups: [
      {
        cat: "All corners oriented (OCLL)",
        items: [
          { name: "OLL 21 · H", moves: "R U2 R' U' R U R' U' R U' R'" },
          { name: "OLL 22 · Pi", moves: "R U2 R2 U' R2 U' R2 U2 R" },
          { name: "OLL 23 · U", moves: "R2 D R' U2 R D' R' U2 R'" },
          { name: "OLL 24 · T", moves: "r U R' U' r' F R F'" },
          { name: "OLL 25 · L / Bowtie", moves: "F' r U R' U' r' F R" },
          { name: "OLL 26 · Anti-Sune", moves: "R U2 R' U' R U' R'" },
          { name: "OLL 27 · Sune", moves: "R U R' U R U2 R'" },
        ],
      },
      {
        cat: "Dot shapes",
        items: [
          { name: "OLL 1 · Dot", moves: "R U2 R2 F R F' U2 R' F R F'" },
          { name: "OLL 2 · Dot", moves: "F R U R' U' F' f R U R' U' f'" },
          { name: "OLL 3 · Dot", moves: "f R U R' U' f' U' F R U R' U' F'" },
          { name: "OLL 4 · Dot", moves: "f R U R' U' f' U F R U R' U' F'" },
          { name: "OLL 17 · Dot", moves: "R U R' U R' F R F' U2 R' F R F'" },
          { name: "OLL 18 · Dot", moves: "r U R' U R U2 r2 U' R U' R' U2 r" },
          { name: "OLL 19 · Dot", moves: "r' R U R U R' U' r R2 F R F'" },
          { name: "OLL 20 · Dot", moves: "r U R' U' M2 U R U' R' U' M'" },
        ],
      },
      {
        cat: "Square shapes",
        items: [
          { name: "OLL 5 · Square", moves: "r' U2 R U R' U r" },
          { name: "OLL 6 · Square", moves: "r U2 R' U' R U' r'" },
        ],
      },
      {
        cat: "Lightning bolts",
        items: [
          { name: "OLL 7 · Lightning", moves: "r U R' U R U2 r'" },
          { name: "OLL 8 · Lightning", moves: "l' U' L U' L' U2 l" },
          { name: "OLL 11 · Lightning", moves: "r U R' U R' F R F' R U2 r'" },
          { name: "OLL 12 · Lightning", moves: "M' R' U' R U' R' U2 R U' M" },
          { name: "OLL 39 · Lightning", moves: "L F' L' U' L U F U' L'" },
          { name: "OLL 40 · Lightning", moves: "R' F R U R' U' F' U R" },
        ],
      },
      {
        cat: "Fish shapes",
        items: [
          { name: "OLL 9 · Fish", moves: "R U R' U' R' F R2 U R' U' F'" },
          { name: "OLL 10 · Fish", moves: "R U R' U R' F R F' R U2 R'" },
          { name: "OLL 35 · Fish", moves: "R U2 R2 F R F' R U2 R'" },
          { name: "OLL 37 · Fish", moves: "F R' F' R U R U' R'" },
        ],
      },
      {
        cat: "Knight-move shapes",
        items: [
          { name: "OLL 13 · Knight", moves: "r U' r' U' r U r' F' U F" },
          { name: "OLL 14 · Knight", moves: "R' F R U R' F' R F U' F'" },
          { name: "OLL 15 · Knight", moves: "l' U' l L' U' L U l' U l" },
          { name: "OLL 16 · Knight", moves: "r U r' R U R' U' r U' r'" },
        ],
      },
      {
        cat: "Awkward shapes",
        items: [
          {
            name: "OLL 29 · Awkward",
            moves: "R U R' U' R U' R' F' U' F R U R'",
          },
          { name: "OLL 30 · Awkward", moves: "F R' F R2 U' R' U' R U R' F2" },
          {
            name: "OLL 41 · Awkward",
            moves: "R U R' U R U2 R' F R U R' U' F'",
          },
          {
            name: "OLL 42 · Awkward",
            moves: "R' U' R U' R' U2 R F R U R' U' F'",
          },
        ],
      },
      {
        cat: "P / T / C / W / L shapes",
        items: [
          { name: "OLL 31 · P", moves: "R' U' F U R U' R' F' R" },
          { name: "OLL 32 · P", moves: "R U B' U' R' U R B R'" },
          { name: "OLL 43 · P", moves: "F' U' L' U L F" },
          { name: "OLL 44 · P", moves: "F U R U' R' F'" },
          { name: "OLL 33 · T", moves: "R U R' U' R' F R F'" },
          { name: "OLL 45 · T", moves: "F R U R' U' F'" },
          { name: "OLL 34 · C", moves: "R U R2 U' R' F R U R U' F'" },
          { name: "OLL 46 · C", moves: "R' U' R' F R F' U R" },
          { name: "OLL 36 · W", moves: "L' U' L U' L' U L U L F' L' F" },
          { name: "OLL 38 · W", moves: "R U R' U R U' R' U' R' F R F'" },
          { name: "OLL 47 · L", moves: "F' L' U' L U L' U' L U F" },
          { name: "OLL 48 · L", moves: "F R U R' U' R U R' U' F'" },
          { name: "OLL 49 · L", moves: "r U' r2 U r2 U r2 U' r" },
          { name: "OLL 50 · L", moves: "r' U r2 U' r2 U' r2 U r'" },
          { name: "OLL 53 · L", moves: "l' U2 L U L' U' L U L' U l" },
          { name: "OLL 54 · L", moves: "r U2 R' U' R U R' U' R U' r'" },
        ],
      },
      {
        cat: "Line / I shapes",
        items: [
          { name: "OLL 51 · Line", moves: "F U R U' R' U R U' R' F'" },
          { name: "OLL 52 · Line", moves: "R U R' U R U' B U' B' R'" },
          { name: "OLL 55 · Line", moves: "R U2 R2 U' R U' R' U2 F R F'" },
          {
            name: "OLL 56 · Line",
            moves: "r U r' U R U' R' U R U' R' r U' r'",
          },
          { name: "OLL 28 · Line", moves: "r U R' U' r' R U R U' R'" },
          { name: "OLL 57 · Line", moves: "R U R' U' M' U R U' r'" },
        ],
      },
    ],
  },

  {
    id: "pll",
    label: "PLL",
    hint: "Permute the last layer — all 21 cases. Tap one to set it up, then watch it solve.",
    setup: true,
    groups: [
      {
        cat: "Edges only",
        items: [
          { name: "Ua perm", moves: "M2 U M U2 M' U M2" },
          { name: "Ub perm", moves: "M2 U' M U2 M' U' M2" },
          { name: "H perm", moves: "M2 U M2 U2 M2 U M2" },
          { name: "Z perm", moves: "M2 U M2 U M' U2 M2 U2 M'" },
        ],
      },
      {
        cat: "Corners only",
        items: [
          { name: "Aa perm", moves: "R' F R' B2 R F' R' B2 R2" },
          { name: "Ab perm", moves: "R2 B2 R F R' B2 R F' R" },
          {
            name: "E perm",
            moves: "x' R U' R' D R U R' D' R U R' D R U' R' D' x",
          },
        ],
      },
      {
        cat: "Adjacent corner swap",
        items: [
          { name: "T perm", moves: "R U R' U' R' F R2 U' R' U' R U R' F'" },
          {
            name: "F perm",
            moves: "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R",
          },
          { name: "Ja perm", moves: "R' U L' U2 R U' R' U2 R L" },
          { name: "Jb perm", moves: "R U R' F' R U R' U' R' F R2 U' R' U'" },
          {
            name: "Ra perm",
            moves: "R U R' F' R U2 R' U2 R' F R U R U2 R' U'",
          },
          { name: "Rb perm", moves: "R' U2 R U2 R' F R U R' U' R' F' R2 U'" },
        ],
      },
      {
        cat: "Diagonal corner swap",
        items: [
          { name: "V perm", moves: "R' U R' U' y R' F' R2 U' R' U R' F R F" },
          {
            name: "Y perm",
            moves: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
          },
          {
            name: "Na perm",
            moves: "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'",
          },
          {
            name: "Nb perm",
            moves: "R' U R U' R' F' U' F R U R' F R' F' R U' R",
          },
        ],
      },
      {
        cat: "G perms",
        items: [
          { name: "Ga perm", moves: "R2 U R' U R' U' R U' R2 U' D R' U R D'" },
          { name: "Gb perm", moves: "R' U' R U D' R2 U R' U R U' R U' R2 D" },
          { name: "Gc perm", moves: "R2 U' R U' R U R' U R2 U D' R U' R' D" },
          { name: "Gd perm", moves: "R U R' U' D R2 U' R U' R' U R' U R2 D'" },
        ],
      },
    ],
  },

  {
    id: "patterns",
    label: "Patterns",
    hint: "Fun symmetric patterns — applied to a solved cube.",
    groups: [
      {
        cat: "Pretty patterns",
        items: [
          { name: "Checkerboard", moves: "M2 E2 S2" },
          { name: "Six spots", moves: "U D' R L' F B' U D'" },
          { name: "Plus / minus", moves: "U2 R2 L2 U2 R2 L2" },
          {
            name: "Cube in a cube",
            moves: "F L F U' R U F2 L2 U' L' B D' B' L2 U",
          },
          {
            name: "Superflip",
            moves: "U R2 F B R B2 R U2 L B2 R U' D' R2 F R' L B2 U2 F2",
          },
        ],
      },
    ],
  },
];
