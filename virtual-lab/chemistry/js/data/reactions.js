/**
 * Reaction database.
 * Keys are sorted hex pairs: "0xCOLORA_0xCOLORB"
 * Values describe the product state.
 *
 * Add new reactions by appending entries here — no other file needs to change.
 */
export const REACTIONS = {
  // Blue (water/neutral) + Red (acid) → orange acid solution
  '0x3baaff_0xff4444': {
    color: 0xff8800,
    pH: 3.2,
    temperature: 26,
    reaction: 'Acid + Neutral',
    description: 'Acidic solution formed.',
  },

  // Blue + Purple (base) → teal neutral
  '0x3baaff_0xaa44ff': {
    color: 0x00ccaa,
    pH: 7.0,
    temperature: 25,
    reaction: 'Acid–Base Neutralisation',
    description: 'Neutralisation: salt + water.',
  },

  // Red + Purple → dark purple precipitate
  '0xff4444_0xaa44ff': {
    color: 0x880088,
    pH: 8.5,
    temperature: 28,
    reaction: 'Precipitate Formed',
    description: 'Insoluble salt precipitate visible.',
  },

  // Green (indicator) + any acid (red) → yellow
  '0x22c55e_0xff4444': {
    color: 0xffee00,
    pH: 4.5,
    temperature: 25,
    reaction: 'Indicator in Acid',
    description: 'Universal indicator turns yellow-orange.',
  },

  // Green + base (purple) → dark green/blue
  '0x22c55e_0xaa44ff': {
    color: 0x0044cc,
    pH: 10,
    temperature: 25,
    reaction: 'Indicator in Base',
    description: 'Universal indicator turns blue.',
  },
};
