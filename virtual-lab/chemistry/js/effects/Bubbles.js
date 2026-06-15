import { ParticleSystem } from '../../../shared/js/effects/Particles.js';

export class BubbleEffect extends ParticleSystem {
  constructor(scene) {
    super(scene, {
      count:    120,
      color:    0x88ddff,
      size:     0.05,
      lifetime: 1.8,
      speed:    1.4,
      spread:   0.25,
      gravity:  -0.8,   // bubbles rise
    });
  }

  emit(pos, count = 15) {
    super.emit(pos, count);
  }
}
