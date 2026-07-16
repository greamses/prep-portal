/* ═══════════════════════════════════════════════════════
   THE PERIODIC TABLE — public-domain scientific data, hand-entered.

   Names, symbols, atomic numbers, standard atomic weights, categories and
   grid positions are settled facts (IUPAC); no API, nothing that changes.

   Two audiences:
     ELEMENTS      all 118, laid out on the standard grid — the LIBRARY draws
                   the whole table from this.
     GAME_ELEMENTS the examinable subset a school actually studies — the GAME
                   quizzes only these, because "name Z=106" is not a fair round.

   Each row: [z, symbol, name, mass, category, group(x), period(y)].
   Lanthanides sit on display row 8 and actinides on row 9 (the strip beneath
   the main block), x running 3..17 — exactly where a printed table puts them.
═══════════════════════════════════════════════════════ */

// [z, sym, name, mass, cat, x, y]
const RAW = [
  [1, 'H', 'hydrogen', 1.008, 'nonmetal', 1, 1],
  [2, 'He', 'helium', 4.003, 'noble', 18, 1],
  [3, 'Li', 'lithium', 6.94, 'alkali', 1, 2],
  [4, 'Be', 'beryllium', 9.012, 'alkaline', 2, 2],
  [5, 'B', 'boron', 10.81, 'metalloid', 13, 2],
  [6, 'C', 'carbon', 12.011, 'nonmetal', 14, 2],
  [7, 'N', 'nitrogen', 14.007, 'nonmetal', 15, 2],
  [8, 'O', 'oxygen', 15.999, 'nonmetal', 16, 2],
  [9, 'F', 'fluorine', 18.998, 'halogen', 17, 2],
  [10, 'Ne', 'neon', 20.180, 'noble', 18, 2],
  [11, 'Na', 'sodium', 22.990, 'alkali', 1, 3],
  [12, 'Mg', 'magnesium', 24.305, 'alkaline', 2, 3],
  [13, 'Al', 'aluminium', 26.982, 'post', 13, 3],
  [14, 'Si', 'silicon', 28.085, 'metalloid', 14, 3],
  [15, 'P', 'phosphorus', 30.974, 'nonmetal', 15, 3],
  [16, 'S', 'sulfur', 32.06, 'nonmetal', 16, 3],
  [17, 'Cl', 'chlorine', 35.45, 'halogen', 17, 3],
  [18, 'Ar', 'argon', 39.948, 'noble', 18, 3],
  [19, 'K', 'potassium', 39.098, 'alkali', 1, 4],
  [20, 'Ca', 'calcium', 40.078, 'alkaline', 2, 4],
  [21, 'Sc', 'scandium', 44.956, 'transition', 3, 4],
  [22, 'Ti', 'titanium', 47.867, 'transition', 4, 4],
  [23, 'V', 'vanadium', 50.942, 'transition', 5, 4],
  [24, 'Cr', 'chromium', 51.996, 'transition', 6, 4],
  [25, 'Mn', 'manganese', 54.938, 'transition', 7, 4],
  [26, 'Fe', 'iron', 55.845, 'transition', 8, 4],
  [27, 'Co', 'cobalt', 58.933, 'transition', 9, 4],
  [28, 'Ni', 'nickel', 58.693, 'transition', 10, 4],
  [29, 'Cu', 'copper', 63.546, 'transition', 11, 4],
  [30, 'Zn', 'zinc', 65.38, 'transition', 12, 4],
  [31, 'Ga', 'gallium', 69.723, 'post', 13, 4],
  [32, 'Ge', 'germanium', 72.630, 'metalloid', 14, 4],
  [33, 'As', 'arsenic', 74.922, 'metalloid', 15, 4],
  [34, 'Se', 'selenium', 78.971, 'nonmetal', 16, 4],
  [35, 'Br', 'bromine', 79.904, 'halogen', 17, 4],
  [36, 'Kr', 'krypton', 83.798, 'noble', 18, 4],
  [37, 'Rb', 'rubidium', 85.468, 'alkali', 1, 5],
  [38, 'Sr', 'strontium', 87.62, 'alkaline', 2, 5],
  [39, 'Y', 'yttrium', 88.906, 'transition', 3, 5],
  [40, 'Zr', 'zirconium', 91.224, 'transition', 4, 5],
  [41, 'Nb', 'niobium', 92.906, 'transition', 5, 5],
  [42, 'Mo', 'molybdenum', 95.95, 'transition', 6, 5],
  [43, 'Tc', 'technetium', 98, 'transition', 7, 5],
  [44, 'Ru', 'ruthenium', 101.07, 'transition', 8, 5],
  [45, 'Rh', 'rhodium', 102.906, 'transition', 9, 5],
  [46, 'Pd', 'palladium', 106.42, 'transition', 10, 5],
  [47, 'Ag', 'silver', 107.868, 'transition', 11, 5],
  [48, 'Cd', 'cadmium', 112.414, 'transition', 12, 5],
  [49, 'In', 'indium', 114.818, 'post', 13, 5],
  [50, 'Sn', 'tin', 118.710, 'post', 14, 5],
  [51, 'Sb', 'antimony', 121.760, 'metalloid', 15, 5],
  [52, 'Te', 'tellurium', 127.60, 'metalloid', 16, 5],
  [53, 'I', 'iodine', 126.904, 'halogen', 17, 5],
  [54, 'Xe', 'xenon', 131.293, 'noble', 18, 5],
  [55, 'Cs', 'caesium', 132.905, 'alkali', 1, 6],
  [56, 'Ba', 'barium', 137.327, 'alkaline', 2, 6],
  [57, 'La', 'lanthanum', 138.905, 'lanthanide', 3, 8],
  [58, 'Ce', 'cerium', 140.116, 'lanthanide', 4, 8],
  [59, 'Pr', 'praseodymium', 140.908, 'lanthanide', 5, 8],
  [60, 'Nd', 'neodymium', 144.242, 'lanthanide', 6, 8],
  [61, 'Pm', 'promethium', 145, 'lanthanide', 7, 8],
  [62, 'Sm', 'samarium', 150.36, 'lanthanide', 8, 8],
  [63, 'Eu', 'europium', 151.964, 'lanthanide', 9, 8],
  [64, 'Gd', 'gadolinium', 157.25, 'lanthanide', 10, 8],
  [65, 'Tb', 'terbium', 158.925, 'lanthanide', 11, 8],
  [66, 'Dy', 'dysprosium', 162.500, 'lanthanide', 12, 8],
  [67, 'Ho', 'holmium', 164.930, 'lanthanide', 13, 8],
  [68, 'Er', 'erbium', 167.259, 'lanthanide', 14, 8],
  [69, 'Tm', 'thulium', 168.934, 'lanthanide', 15, 8],
  [70, 'Yb', 'ytterbium', 173.045, 'lanthanide', 16, 8],
  [71, 'Lu', 'lutetium', 174.967, 'lanthanide', 17, 8],
  [72, 'Hf', 'hafnium', 178.49, 'transition', 4, 6],
  [73, 'Ta', 'tantalum', 180.948, 'transition', 5, 6],
  [74, 'W', 'tungsten', 183.84, 'transition', 6, 6],
  [75, 'Re', 'rhenium', 186.207, 'transition', 7, 6],
  [76, 'Os', 'osmium', 190.23, 'transition', 8, 6],
  [77, 'Ir', 'iridium', 192.217, 'transition', 9, 6],
  [78, 'Pt', 'platinum', 195.084, 'transition', 10, 6],
  [79, 'Au', 'gold', 196.967, 'transition', 11, 6],
  [80, 'Hg', 'mercury', 200.592, 'transition', 12, 6],
  [81, 'Tl', 'thallium', 204.38, 'post', 13, 6],
  [82, 'Pb', 'lead', 207.2, 'post', 14, 6],
  [83, 'Bi', 'bismuth', 208.980, 'post', 15, 6],
  [84, 'Po', 'polonium', 209, 'post', 16, 6],
  [85, 'At', 'astatine', 210, 'halogen', 17, 6],
  [86, 'Rn', 'radon', 222, 'noble', 18, 6],
  [87, 'Fr', 'francium', 223, 'alkali', 1, 7],
  [88, 'Ra', 'radium', 226, 'alkaline', 2, 7],
  [89, 'Ac', 'actinium', 227, 'actinide', 3, 9],
  [90, 'Th', 'thorium', 232.038, 'actinide', 4, 9],
  [91, 'Pa', 'protactinium', 231.036, 'actinide', 5, 9],
  [92, 'U', 'uranium', 238.029, 'actinide', 6, 9],
  [93, 'Np', 'neptunium', 237, 'actinide', 7, 9],
  [94, 'Pu', 'plutonium', 244, 'actinide', 8, 9],
  [95, 'Am', 'americium', 243, 'actinide', 9, 9],
  [96, 'Cm', 'curium', 247, 'actinide', 10, 9],
  [97, 'Bk', 'berkelium', 247, 'actinide', 11, 9],
  [98, 'Cf', 'californium', 251, 'actinide', 12, 9],
  [99, 'Es', 'einsteinium', 252, 'actinide', 13, 9],
  [100, 'Fm', 'fermium', 257, 'actinide', 14, 9],
  [101, 'Md', 'mendelevium', 258, 'actinide', 15, 9],
  [102, 'No', 'nobelium', 259, 'actinide', 16, 9],
  [103, 'Lr', 'lawrencium', 262, 'actinide', 17, 9],
  [104, 'Rf', 'rutherfordium', 267, 'transition', 4, 7],
  [105, 'Db', 'dubnium', 268, 'transition', 5, 7],
  [106, 'Sg', 'seaborgium', 269, 'transition', 6, 7],
  [107, 'Bh', 'bohrium', 270, 'transition', 7, 7],
  [108, 'Hs', 'hassium', 269, 'transition', 8, 7],
  [109, 'Mt', 'meitnerium', 278, 'transition', 9, 7],
  [110, 'Ds', 'darmstadtium', 281, 'transition', 10, 7],
  [111, 'Rg', 'roentgenium', 282, 'transition', 11, 7],
  [112, 'Cn', 'copernicium', 285, 'transition', 12, 7],
  [113, 'Nh', 'nihonium', 286, 'post', 13, 7],
  [114, 'Fl', 'flerovium', 289, 'post', 14, 7],
  [115, 'Mc', 'moscovium', 290, 'post', 15, 7],
  [116, 'Lv', 'livermorium', 293, 'post', 16, 7],
  [117, 'Ts', 'tennessine', 294, 'halogen', 17, 7],
  [118, 'Og', 'oganesson', 294, 'noble', 18, 7],
];

// A short, helpful hint for the game's hover — NEVER names the element.
const USES = {
  1: 'The lightest gas of all; burns in air to make water.',
  2: 'The unreactive gas that fills floating party balloons.',
  3: 'The light metal at the heart of rechargeable batteries.',
  4: 'A light, stiff metal used in aircraft and X-ray windows.',
  5: 'A metalloid used to make heat-proof kitchen glass.',
  6: 'Found in coal, diamond, and every living thing.',
  7: 'Makes up most of the air; used to make fertiliser.',
  8: 'The gas in the air that all living things breathe.',
  9: 'The most reactive of all; added to toothpaste.',
  10: 'The noble gas that glows red-orange in bright signs.',
  11: 'A soft metal that reacts violently with water; half of table salt.',
  12: 'A light metal that burns with a brilliant white flame.',
  13: 'The light, cheap metal used for drink cans and foil.',
  14: 'The metalloid at the heart of computer chips.',
  15: 'Found in bones, matches, and garden fertiliser.',
  16: 'A yellow solid that smells of rotten eggs when it burns.',
  17: 'A green, choking gas used to clean swimming pools.',
  18: 'The noble gas that fills ordinary filament light bulbs.',
  19: 'A soft metal needed by plants; plenty of it in bananas.',
  20: 'The metal that makes bones, teeth and chalk hard.',
  24: 'A shiny metal used to plate taps and car trim.',
  25: 'A hard metal added to steel to toughen it up.',
  26: 'The cheap, strong metal that rusts and is made into steel.',
  27: 'A magnetic metal that gives glass a deep blue colour.',
  28: 'A silvery, magnetic metal used in coins and batteries.',
  29: 'The reddish metal drawn out into electrical wires.',
  30: 'The metal that coats iron to stop it rusting.',
  33: 'A famous poison; a metalloid used in some chips.',
  35: 'A brown liquid non-metal that gives off choking fumes.',
  36: 'A rare noble gas used in some very bright lamps.',
  47: 'The best conductor of all; used in jewellery and mirrors.',
  50: 'A soft metal used to coat cans and to make solder.',
  53: 'A purple-black solid painted on cuts to kill germs.',
  54: 'A noble gas used in powerful car headlamps.',
  55: 'The most reactive metal; used to keep atomic clocks.',
  56: 'A metal whose compound is swallowed for stomach X-rays.',
  78: 'A precious metal used in jewellery and catalytic converters.',
  79: 'The prized yellow metal that never tarnishes.',
  80: 'The only metal that is liquid at room temperature.',
  82: 'A heavy, soft metal once used in pipes and paint.',
  86: 'A radioactive noble gas that seeps up from some rocks.',
  88: 'A glowing radioactive metal once painted on watch dials.',
  92: 'The heavy radioactive metal that fuels nuclear power.',
};

// The examinable subset the GAME draws from — by atomic number.
const COMMON = new Set([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  24, 25, 26, 27, 28, 29, 30, 33, 35, 36, 47, 50, 53, 54, 55, 56,
  78, 79, 80, 82, 86, 88, 92,
]);

export const CATEGORY_LABELS = {
  alkali: 'Alkali metal',
  alkaline: 'Alkaline earth metal',
  transition: 'Transition metal',
  post: 'Post-transition metal',
  metalloid: 'Metalloid',
  nonmetal: 'Non-metal',
  halogen: 'Halogen',
  noble: 'Noble gas',
  lanthanide: 'Lanthanide',
  actinide: 'Actinide',
};

export const ELEMENTS = RAW.map(([z, sym, name, mass, cat, x, y]) => ({
  z, sym, name, mass, cat, x, y,
  group: y <= 7 ? x : null, // strip rows aren't real groups
  period: y <= 7 ? y : (y === 8 ? 6 : 7),
  use: USES[z] || '',
}));

// What the game quizzes: the common elements, given as {w, d, element} entries
// so they slot straight into the same round machinery as any other topic.
export const GAME_ELEMENTS = ELEMENTS
  .filter((e) => COMMON.has(e.z))
  .map((e) => ({ w: e.name, d: e.use, element: e }));

// The classroom names for the named groups — the setup step's stickers.
export const GROUP_NAMES = {
  1: 'Alkali metals',
  2: 'Alkaline earth',
  17: 'Halogens',
  18: 'Noble gases',
};

/* ── Scoped rounds ────────────────────────────────────────────────────────
   The topic key can carry a scope suffix picking groups or periods. The
   WHOLE table quizzes only the common elements ("name Z=106" is not a fair
   round), but groups/periods are sets the player chose to drill, so they
   quiz EVERY element in them — exactly the columns or rows they can study in
   the library first. Periods go by the drawn row, so the lanthanide/actinide
   strips stay out of Periods 6 and 7, the same as reading a printed table.

   Scope formats (the checkbox picker writes masks; singles are the launch
   format and stay decodable so a mid-deploy room never breaks):
     'gm<hex>' / 'pm<hex>'  a bitmask — bit i is Group/Period i+1, so
                            'periodic-table:gm20001' is Groups 1 and 18.
                            Hex keeps ANY combination under the rules' 40-char
                            topic cap, and one canonical spelling per set
                            keeps matchmaking buckets honest.
     'g17' / 'p3'           legacy single group/period. */
export function scopeInfo(scope) {
  if (!scope) return null;
  const kind = scope[0]; // 'g' | 'p'
  const max = kind === 'g' ? 18 : 7;
  const nums = new Set();
  if (scope[1] === 'm') {
    const mask = parseInt(scope.slice(2), 16) || 0;
    for (let i = 0; i < max; i++) if (mask & (1 << i)) nums.add(i + 1);
  } else {
    const n = Number(scope.slice(1));
    if (n >= 1 && n <= max) nums.add(n);
  }
  return nums.size ? { kind, nums } : null;
}

export function scopedElements(scope) {
  const info = scopeInfo(scope);
  if (!info) return GAME_ELEMENTS;
  const members = info.kind === 'g'
    ? ELEMENTS.filter((e) => info.nums.has(e.group))
    : ELEMENTS.filter((e) => info.nums.has(e.y));
  return members.map((e) => ({ w: e.name, d: e.use, element: e }));
}

export function scopeLabel(scope) {
  const info = scopeInfo(scope);
  if (!info) return '';
  const word = info.kind === 'g' ? 'Group' : 'Period';
  const ns = [...info.nums].sort((a, b) => a - b);
  if (ns.length === 1) return `${word} ${ns[0]}`;
  if (ns.length <= 3) return `${word}s ${ns.join(', ')}`;
  return `${ns.length} ${word.toLowerCase()}s`;
}

/** Is this element inside the scoped rows/columns? (Everything, when unscoped.) */
export function inScope(el, scope) {
  const info = scopeInfo(scope);
  if (!info) return true;
  return info.kind === 'g' ? info.nums.has(el.group) : info.nums.has(el.y);
}

export const TABLE_COLUMNS = 18;
export const TABLE_ROWS = 9; // 7 main periods + lanthanide + actinide strips
