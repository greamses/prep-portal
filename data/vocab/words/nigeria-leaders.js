/* Nigerian Leaders' "word files" are bundled portrait data, not generated
   vocabulary — the leaders themselves are the words. This shim gives the
   subject the same WORDS shape loadWords() hands every other subject.

   Two drawn topics off one bank (../history/leaders.js):
     leader-name    portrait → spell the SURNAME
     leader-dates   portrait + name → type the YEARS in office

   The import is absolute so the import map's content-hashed URL applies (see
   scripts/version-assets.mjs). */
import { NAME_WORDS, DATE_WORDS } from '/data/vocab/history/leaders.js';

export const WORDS = {
  'leader-name': NAME_WORDS,
  'leader-dates': DATE_WORDS,
};
