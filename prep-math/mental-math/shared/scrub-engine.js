/* ═══════════════════════════════════════════════════════════
   MENTAL MATH — SCRUB ENGINE
   ───────────────────────────────────────────────────────────
   A single GSAP timeline is built once, with a label at the end of every
   step ("start" first, then one per step). Play/Pause drive it normally;
   Next/Prev/Seek jump between labels with tl.tweenTo()/tl.seek(). Every
   trick page writes its own `steps` array and hands it to a Scrubber —
   this file never changes when a new trick is added.
═══════════════════════════════════════════════════════════ */

// steps: Array<{ id: string, build(tl: gsap.core.Timeline): void }>
//   `id` is a unique label name marking the END of that step's tweens.
//   `build(tl)` appends this step's tweens to the shared timeline — GSAP
//   inserts .to()/.from() calls sequentially at the timeline's current end
//   by default, so calling addLabel(step.id) right after build() marks
//   exactly where that step finishes.
// onIndexChange?(index, step): fired whenever the active step changes
//   (crossing a label during play, or via next/prev/seek). `index` is
//   0..steps.length (0 = resting "poster" state before step 1); `step` is
//   `steps[index - 1]` or null at index 0.
export class Scrubber {
  constructor(gsap, { steps, onIndexChange } = {}) {
    this.gsap = gsap;
    this.steps = steps;
    this.onIndexChange = onIndexChange;
    this.labels = ["start", ...steps.map((s) => s.id)];
    this._index = 0;

    // GSAP timelines don't flip their own `paused` flag just because the
    // playhead ran out of tweens to advance — pause explicitly on natural
    // completion so `isPlaying`/togglePlay() behave correctly afterward.
    // onComplete fires right after the final onUpdate of the same tick, so
    // the index-change notification from that last onUpdate has already
    // gone out with isPlaying still (incorrectly) true — notify again here
    // once actually paused, so any UI reflecting isPlaying can catch up.
    const tl = gsap.timeline({
      paused: true,
      onUpdate: () => this._syncIndex(),
      onComplete: () => {
        tl.pause();
        this.onIndexChange?.(this._index, this._index === 0 ? null : this.steps[this._index - 1]);
      },
    });
    tl.addLabel("start");
    steps.forEach((step) => {
      step.build(tl);
      tl.addLabel(step.id);
    });
    this.tl = tl;
  }

  _syncIndex() {
    const t = this.tl.time();
    let idx = 0;
    for (let i = 0; i < this.labels.length; i++) {
      if (this.tl.labels[this.labels[i]] <= t + 0.0001) idx = i;
    }
    if (idx !== this._index) {
      this._index = idx;
      this.onIndexChange?.(idx, idx === 0 ? null : this.steps[idx - 1]);
    }
  }

  get index() { return this._index; }
  get total() { return this.steps.length; }
  get isPlaying() { return !this.tl.paused(); }
  get isFinished() { return this._index === this.steps.length; }

  play() {
    if (this.tl.time() >= this.tl.duration() - 0.001) this.tl.seek(0);
    this.tl.play();
  }

  pause() { this.tl.pause(); }

  togglePlay() { this.tl.paused() ? this.play() : this.pause(); }

  next() {
    const target = Math.min(this._index + 1, this.labels.length - 1);
    if (target === this._index) return;
    this.tl.pause();
    this.tl.tweenTo(this.labels[target], { duration: 0.5, ease: "power2.inOut" });
  }

  prev() {
    const target = Math.max(this._index - 1, 0);
    if (target === this._index) return;
    this.tl.pause();
    this.tl.tweenTo(this.labels[target], { duration: 0.5, ease: "power2.inOut" });
  }

  seek(i) {
    const clamped = Math.max(0, Math.min(i, this.labels.length - 1));
    this.tl.pause();
    this.tl.seek(this.labels[clamped], false);
    this._syncIndex();
  }

  restart() {
    this.seek(0);
    this.pause();
  }

  destroy() { this.tl.kill(); }
}
