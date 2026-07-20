/* Geography's "word files" are bundled map data, not generated vocabulary —
   the countries and states themselves are the words (see ../world-map.js
   and ../nigeria-map.js). This shim gives the subject the same WORDS shape
   loadWords() hands every other subject, so the round machinery needs no
   special path for it. The imports are absolute so the import map's
   content-hashed URLs apply (see scripts/version-assets.mjs). */
import { GAME_COUNTRIES } from '/data/vocab/world-map.js';
import { GAME_STATES } from '/data/vocab/nigeria-map.js';
import { GAME_ORGANS } from '/data/vocab/body-map.js';
import { GAME_PARTS as HEART_PARTS } from '/data/vocab/organs/heart.js';
import { GAME_PARTS as BRAIN_PARTS } from '/data/vocab/organs/brain.js';
import { GAME_PARTS as EAR_PARTS } from '/data/vocab/organs/ear.js';
import { GAME_PARTS as SKIN_PARTS } from '/data/vocab/organs/skin.js';

export const WORDS = {
  'world-map': GAME_COUNTRIES,
  'nigeria-map': GAME_STATES,
  'body-map': GAME_ORGANS,
  // The single-organ maps — name the parts of one organ.
  'heart-map': HEART_PARTS,
  'brain-map': BRAIN_PARTS,
  'ear-map': EAR_PARTS,
  'skin-map': SKIN_PARTS,
};
