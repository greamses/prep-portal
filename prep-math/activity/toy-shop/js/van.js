/* ============================================================================
   The Prep Toy Shop — the delivery, which delivers nothing
   ----------------------------------------------------------------------------
   The van drives on, the parcel comes off, the parcel opens — and it is empty,
   and the page SAYS SO, in so many words, before the child has to wonder.

   That honesty is the whole design. A page that let a child believe a teddy
   bear was coming would be a page that lied to them for a laugh, and they
   would be right never to trust it again. So the joke is told the other way
   round: you did the sums, the shop is pretend, the toys were always pretend,
   and what you actually take away is that you can now work out a bill.

   It is drawn, not animated with a library: a handful of CSS keyframes on an
   SVG van, so it costs nothing and plays the same everywhere.
   ========================================================================== */

import { VAN, PARCEL, PARCEL_OPEN } from "./art.js";

/**
 * Play the delivery into `host`.
 *
 *   spent    what was paid, already written as money (mark and all)
 *   onDone   told when the parcel has opened and the truth is out
 * → stop(), for a child who leaves before it finishes
 */
export function deliver(host, { spent = "", onDone = () => {} } = {}) {
  host.innerHTML = `
    <div class="ts-road" role="group" aria-label="A delivery van arriving">
      <div class="ts-road__van" data-van>${VAN}</div>
      <div class="ts-road__parcel" data-parcel>${PARCEL}</div>
      <div class="ts-road__line" aria-hidden="true"></div>
      <p class="ts-road__skip">tap to skip</p>
    </div>
    <div class="ts-truth" data-truth hidden>
      <h3 class="ts-truth__head">The box is empty.</h3>
      <p class="ts-truth__say">Of course it is. There is no teddy bear, no robot and no van —
        this is a shop made of arithmetic, and the only thing in the parcel was the sums.
        ${spent ? `You worked out a bill of ${spent} and paid it to the prepcoin.` : ""}
        That part was real, and it is the part worth keeping.</p>
      <p class="ts-truth__again" data-again></p>
    </div>`;

  const road = host.querySelector(".ts-road");
  const parcel = host.querySelector("[data-parcel]");
  const truth = host.querySelector("[data-truth]");
  let timers = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));

  /* The lid comes OFF — the box is redrawn open, rather than faded out. A
     parcel that dissolves looks like a bug; a parcel with its lid on the
     ground beside it and a dark hole where a teddy should be is the joke. */
  const open = () => { road.classList.add("is-opening"); parcel.innerHTML = PARCEL_OPEN; };
  const tell = () => { truth.hidden = false; truth.classList.add("is-in"); onDone(); };

  road.classList.add("is-driving");
  at(2500, () => road.classList.add("is-dropping"));
  at(4000, open);
  at(5000, tell);

  /* A child who cannot wait, or has seen it before, may have the end at once. */
  const skip = () => {
    timers.forEach(clearTimeout);
    timers = [];
    road.classList.add("is-driving", "is-dropping", "is-done");
    open();
    tell();
  };
  host.addEventListener("click", skip, { once: true });

  return { stop() { timers.forEach(clearTimeout); timers = []; } };
}
