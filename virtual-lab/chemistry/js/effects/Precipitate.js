import { ParticleSystem } from '../../../shared/js/effects/Particles.js';

export class PrecipitateEffect extends ParticleSystem {
  constructor(scene) {
    super(scene, {
      count:    80,
      color:    0xffffff,
      size:     0.04,
      lifetime: 2.5,
      speed:    0.3,
      spread:   0.3,
      gravity:  0.6,    // precipitate sinks
    });
  }
}
