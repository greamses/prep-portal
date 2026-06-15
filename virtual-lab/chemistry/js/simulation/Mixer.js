import { mixpH } from './pH.js';

/**
 * Mixer — tracks volumes and concentrations for multi-step mixing.
 * Used when you want more realism than the simple ChemistryCore.mix().
 */
export class Mixer {
  constructor() {
    this._vessels = new Map(); // id -> { substance, volumeML, pH, color }
  }

  add(id, substance) {
    this._vessels.set(id, { ...substance });
  }

  remove(id) { this._vessels.delete(id); }

  /** Pour some ml from vessel A into vessel B */
  pour(idFrom, idTo, volumeML) {
    const from = this._vessels.get(idFrom);
    const to   = this._vessels.get(idTo);
    if (!from || !to) return null;

    if (volumeML > from.volumeML) volumeML = from.volumeML;
    from.volumeML -= volumeML;

    const totalVol = to.volumeML + volumeML;
    const ratioTo  = to.volumeML / totalVol;

    to.pH      = mixpH(to.pH, from.pH, ratioTo);
    to.volumeML = totalVol;

    return { fromState: { ...from }, toState: { ...to } };
  }

  getState(id) { return this._vessels.get(id) ?? null; }
}
