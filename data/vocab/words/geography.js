/* Geography's "word file" is bundled map data, not generated vocabulary —
   the countries themselves are the words (see ../world-map.js). This shim
   gives the subject the same WORDS shape loadWords() hands every other
   subject, so the round machinery needs no special path for it. The import
   is absolute so the import map's content-hashed URL applies (see
   scripts/version-assets.mjs). */
import { GAME_COUNTRIES } from '/data/vocab/world-map.js';

export const WORDS = { 'world-map': GAME_COUNTRIES };
