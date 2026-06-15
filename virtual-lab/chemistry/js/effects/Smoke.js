import { ParticleSystem } from '../../../shared/js/effects/Particles.js';

export class SmokeEffect extends ParticleSystem {
  constructor(scene) {
    super(scene, {
      count:    60,
      color:    0xaaaaaa,
      size:     0.12,
      lifetime: 3.5,
      speed:    0.5,
      spread:   0.6,
      gravity:  -0.15,
    });
  }

  emit(pos, count = 8) {
    super.emit(pos, count);
  }
}
