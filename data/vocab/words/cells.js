/* The Cell's "word files" are bundled diagram data, not generated vocabulary —
   the parts of the cell themselves are the words. This shim gives the subject
   the same WORDS shape loadWords() hands every other subject.

   Two drawn topics, both figures composed by scripts/gen-cell-maps.mjs:
     plant-cell    the boxy walled cell — name the PART (../cells/plant-cell.js)
     animal-cell   the soft blob cell   — name the PART (../cells/animal-cell.js)

   Imports are absolute so the import map's content-hashed URLs apply (see
   scripts/version-assets.mjs). */
import { GAME_PARTS as PLANT_PARTS } from '/data/vocab/cells/plant-cell.js';
import { GAME_PARTS as ANIMAL_PARTS } from '/data/vocab/cells/animal-cell.js';

export const WORDS = {
  'plant-cell': PLANT_PARTS,
  'animal-cell': ANIMAL_PARTS,
};
