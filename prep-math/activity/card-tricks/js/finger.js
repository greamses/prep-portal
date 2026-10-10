/* ============================================================================
   CARD TRICKS — PrepBot's pointing hand
   ----------------------------------------------------------------------------
   When the computer has to show which pile its card is in, it does not write
   "my card is here": PrepBot's own hand comes down and points at it.

   The hand is drawn to belong to PrepBot (mental-math/shared/icons.js,
   ICON_PREPBOT): the same sky-blue body, the same butter-yellow joints, the
   same dark visor with an amber light in it — so the hand reads as the
   tutor's, reaching in from above. One finger out, the others curled, an
   amber light at the fingertip.

   It keeps its own inks (it lies on black cloth in both themes, and the
   theme's --ink would turn cream in the dark).

   A pure string, pointing DOWN, in a 64 × 84 box.
   ========================================================================== */

const BODY = "#6fb7e8";
const SHADE = "#4f9bd0";
const JOINT = "#f4c95d";
const LAMP = "#f0a868";
const INK = "#2a2723";

export const BOT_FINGER =
  `<svg class="ct-finger" viewBox="0 0 64 84" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="PrepBot is pointing at this pile">` +
  /* the arm it reaches in on, and the yellow cuff at the wrist */
  `<rect x="24" y="0" width="16" height="9" rx="3" fill="${SHADE}"/>` +
  `<rect x="17" y="6" width="30" height="9" rx="4.5" fill="${JOINT}"/>` +
  `<circle cx="24" cy="10.5" r="1.5" fill="${INK}"/><circle cx="40" cy="10.5" r="1.5" fill="${INK}"/>` +
  /* the thumb, tucked against the side */
  `<rect x="5" y="22" width="12" height="22" rx="6" fill="${SHADE}" transform="rotate(12 11 33)"/>` +
  /* the palm */
  `<rect x="12" y="13" width="40" height="31" rx="12" fill="${BODY}"/>` +
  `<rect x="16" y="16" width="32" height="5" rx="2.5" fill="#fff" opacity=".28"/>` +
  /* the same visor PrepBot looks out of, with one amber light */
  `<rect x="22" y="23" width="22" height="11" rx="5.5" fill="${INK}"/>` +
  `<circle cx="33" cy="28.5" r="2.6" fill="${LAMP}"/>` +
  /* three fingers curled into the palm */
  `<rect x="32" y="38" width="8" height="12" rx="4" fill="${SHADE}"/>` +
  `<rect x="39.5" y="37" width="8" height="11.5" rx="4" fill="${SHADE}"/>` +
  `<rect x="46" y="34" width="7" height="10.5" rx="3.5" fill="${SHADE}"/>` +
  /* the one that points: three joints, yellow at each knuckle */
  `<rect x="15" y="38" width="15" height="17" rx="6" fill="${BODY}"/>` +
  `<rect x="15.5" y="51" width="14" height="5" rx="2.5" fill="${JOINT}"/>` +
  `<rect x="16" y="54" width="13" height="14" rx="5" fill="${BODY}"/>` +
  `<rect x="16.5" y="64.5" width="12" height="4.5" rx="2.2" fill="${JOINT}"/>` +
  `<rect x="16.5" y="67" width="12" height="15" rx="6" fill="${BODY}"/>` +
  `<rect x="18.5" y="40" width="3.4" height="11" rx="1.7" fill="#fff" opacity=".28"/>` +
  /* the light at the fingertip */
  `<circle cx="22.5" cy="77" r="6" fill="${LAMP}" opacity=".35"/>` +
  `<circle cx="22.5" cy="77" r="3.3" fill="${LAMP}"/><circle cx="21.4" cy="75.9" r="1.1" fill="#fff"/>` +
  `</svg>`;
