/* Geography's "word files" are bundled map data, not generated vocabulary —
   the countries and states themselves are the words (see ../world-map.js
   and ../nigeria-map.js). This shim gives the subject the same WORDS shape
   loadWords() hands every other subject, so the round machinery needs no
   special path for it. The imports are absolute so the import map's
   content-hashed URLs apply (see scripts/version-assets.mjs).

   The BODY maps used to live here too; they moved to their own science
   subject — see ./human-body.js. Anatomy is not geography. */
import { GAME_COUNTRIES } from '/data/vocab/world-map.js';
import { GAME_STATES } from '/data/vocab/nigeria-map.js';
import { GAME_BODIES } from '/data/vocab/space/solar-system.js';

export const WORDS = {
  'world-map': GAME_COUNTRIES,
  'nigeria-map': GAME_STATES,
  // A flat diagram of the Sun, the planets and the Moon — name the body lit.
  'solar-system': GAME_BODIES,
};
