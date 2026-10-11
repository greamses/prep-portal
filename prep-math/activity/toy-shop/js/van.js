/* ============================================================================
   The Prep Toy Shop — the delivery
   ----------------------------------------------------------------------------
   The van turns into the street, pulls up, the parcel is set down on the step,
   and the van drives on. Then the child is told they did it: the bill, the
   discount, the tax and the change are exactly the sums a person does at a
   real till, and they have just done all four.

   The scene is CSS keyframes over the drawn van (art.js) — wheels turning, the
   body dipping on its springs as it brakes, the road sliding past — so it
   costs nothing and plays the same everywhere.
   ========================================================================== */

import { VAN, PARCEL } from "./art.js";

/**
 * Play the delivery into `host`.
 *
 *   spent    what was paid, already written as money (mark and all)
 *   how      "cash" or "card" — what they paid with, so the praise can say so
 *   onDone   told when the scene is over and the card is up
 * → stop(), for a child who leaves before it finishes
 */
export function deliver(host, { spent = "", how = "cash", onDone = () => {} } = {}) {
  const paidWith = how === "card"
    ? "You read the bill, worked out the tax and paid it with your PrepCard."
    : "You read the bill, worked out the tax, counted out the notes and worked out your change.";

  host.innerHTML = `
    <div class="ts-street" role="group" aria-label="A delivery van bringing a parcel">
      <!-- everything behind the van is blurred and desaturated, the way a lens
           throws a background out of focus. It is what stops a drawn street
           reading as a drawing: the eye is told where to look. -->
      <div class="ts-street__back" aria-hidden="true">
        <span class="ts-street__sky"></span>
        <span class="ts-street__house">
          <i class="ts-street__roof"></i>
          <i class="ts-street__door"></i>
          <i class="ts-street__win"></i>
          <i class="ts-street__win"></i>
        </span>
        <span class="ts-street__hedge"></span>
      </div>
      <div class="ts-street__kerb" aria-hidden="true"></div>
      <div class="ts-street__road" aria-hidden="true"><i></i></div>
      <div class="ts-street__parcel" data-parcel>${PARCEL}</div>
      <div class="ts-street__van" data-van>${VAN}</div>
      <p class="ts-street__skip">tap to skip</p>
    </div>

    <div class="ts-well" data-well hidden>
      <p class="ts-well__tick">${tick()}</p>
      <h3 class="ts-well__head">Well done — that is exactly how it is done.</h3>
      <p class="ts-well__say">${paidWith}
        ${spent ? `The bill came to <b>${spent}</b>, and every figure of it was yours.</p><p class="ts-well__say">` : ""}
        That is the whole of buying something in a real shop: you check what the
        things cost, you check what the discount takes off, you check the tax,
        and you check your change — because the till can be wrong, and the
        person who can do the sums is the person who notices.</p>
      <p class="ts-well__again" data-again></p>
    </div>`;

  const street = host.querySelector(".ts-street");
  const well = host.querySelector("[data-well]");
  let timers = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));

  const finish = () => {
    well.hidden = false;
    well.classList.add("is-in");
    onDone();
  };

  street.classList.add("is-driving");
  at(2900, () => street.classList.add("is-dropping"));
  at(4100, () => street.classList.add("is-leaving"));
  at(5000, finish);

  /* A child who cannot wait, or has seen it before, may have the end at once. */
  const skip = () => {
    timers.forEach(clearTimeout);
    timers = [];
    street.classList.add("is-driving", "is-dropping", "is-leaving", "is-done");
    finish();
  };
  host.addEventListener("click", skip, { once: true });

  return { stop() { timers.forEach(clearTimeout); timers = []; } };
}

/** A tick, drawn, for the top of the card. */
function tick() {
  return `<svg viewBox="0 0 24 24" width="46" height="46" aria-hidden="true">
    <circle cx="12" cy="12" r="11" fill="#3f8f4f"/>
    <path d="M6.8 12.4l3.6 3.6 7-7.4" fill="none" stroke="#fff" stroke-width="2.6"
          stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
