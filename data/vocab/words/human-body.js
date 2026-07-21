/* The Human Body's "word files" are bundled diagram data, not generated
   vocabulary — the organs and their parts themselves are the words. This shim
   gives the subject the same WORDS shape loadWords() hands every other subject.

   Two kinds of drawn topic:
     body-map            the whole-body figure — name the ORGAN (../body-map.js)
     {heart,brain,ear,skin}-map   one organ — name the PART (../organs/*.js)

   Imports are absolute so the import map's content-hashed URLs apply (see
   scripts/version-assets.mjs). */
import { GAME_ORGANS } from '/data/vocab/body-map.js';
import { GAME_PARTS as HEART_PARTS } from '/data/vocab/organs/heart.js';
import { GAME_PARTS as BRAIN_PARTS } from '/data/vocab/organs/brain.js';
import { GAME_PARTS as EAR_PARTS } from '/data/vocab/organs/ear.js';
import { GAME_PARTS as SKIN_PARTS } from '/data/vocab/organs/skin.js';

export const WORDS = {
  'body-map': GAME_ORGANS,
  'heart-map': HEART_PARTS,
  'brain-map': BRAIN_PARTS,
  'ear-map': EAR_PARTS,
  'skin-map': SKIN_PARTS,
};
