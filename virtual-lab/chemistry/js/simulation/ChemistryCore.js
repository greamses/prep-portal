import { REACTIONS } from '../data/reactions.js';

/**
 * Pure JS chemistry logic — no Three.js imports.
 * All color values are numeric hex (0xRRGGBB).
 */
export class ChemistryCore {
  constructor() {
    this._state = {
      pH:          7.0,
      temperature: 25,
      reaction:    'None',
      color:       0xffffff,
    };
  }

  /**
   * Mix two liquid colors and return a reaction result.
   * Returns { color, pH, temperature, reaction, description }
   */
  mix(colorA, colorB) {
    const key = this._key(colorA, colorB);
    const match = REACTIONS[key] ?? this._blend(colorA, colorB);

    this._state = {
      pH:          match.pH          ?? 7.0,
      temperature: match.temperature ?? 25,
      reaction:    match.reaction    ?? 'No reaction',
      color:       match.color,
    };

    return { ...this._state };
  }

  get state() { return { ...this._state }; }

  _key(a, b) {
    const sorted = [a, b].sort();
    return `${sorted[0]}_${sorted[1]}`;
  }

  /** Fallback: average the two colors */
  _blend(a, b) {
    const ra = (a >> 16) & 0xff, ga = (a >> 8) & 0xff, ba = a & 0xff;
    const rb = (b >> 16) & 0xff, gb = (b >> 8) & 0xff, bb = b & 0xff;
    const r  = (ra + rb) >> 1;
    const g  = (ga + gb) >> 1;
    const bv = (ba + bb) >> 1;
    return { color: (r << 16) | (g << 8) | bv, pH: 7, temperature: 25, reaction: 'Mixed' };
  }
}
