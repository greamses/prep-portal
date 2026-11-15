// Makes media/characters/girl-hands-down.svg from girl.svg.
//
// In the traced drawing the girl's right arm is bent up to her chest; her left arm hangs at
// her side. She is very nearly symmetrical, so the hanging side, mirrored, replaces the
// raised side between her shoulders and the hem of her sleeves. Nothing is redrawn: the new
// file is the same drawing used twice, once as it is (with that band cut out of one side)
// and once mirrored (showing only that band).
//
//   node tools/character-trace/hands-down.mjs
//
// The three numbers below are in the drawing's own units (viewBox 0 0 1835 4316).
import { readFileSync, writeFileSync } from 'node:fs';

const CX = Number(process.argv[2] || 914);     // her centre line (the seam of the dungarees)
const TOP = Number(process.argv[3] || 1489);   // just under the bunches
const BOTTOM = Number(process.argv[4] || 3151); // just under the hanging hand

const dir = new URL('../../media/characters/', import.meta.url);
const src = readFileSync(new URL('girl.svg', dir), 'utf8');
const open = src.match(/<svg[^>]*>/)[0];
const inner = src.slice(src.indexOf(open) + open.length, src.lastIndexOf('</svg>')).replace(/<title>[^<]*<\/title>/, '');
const [, , , W, H] = open.match(/viewBox="([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+)"/).map(Number);

const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"><title>Girl, hands down</title>` +
  `<defs><g id="girl">${inner}</g>` +
  `<clipPath id="rest"><path clip-rule="evenodd" d="M0 0H${W}V${H}H0ZM0 ${TOP}H${CX}V${BOTTOM}H0Z"/></clipPath>` +
  `<clipPath id="band"><rect x="0" y="${TOP}" width="${CX}" height="${BOTTOM - TOP}"/></clipPath></defs>` +
  `<use href="#girl" clip-path="url(#rest)"/>` +
  `<g clip-path="url(#band)"><use href="#girl" transform="translate(${2 * CX} 0) scale(-1 1)"/></g></svg>\n`;
writeFileSync(new URL('girl-hands-down.svg', dir), out);
console.log(`girl-hands-down.svg written (${(out.length / 1024).toFixed(0)} KB): centre ${CX}, band ${TOP}-${BOTTOM}`);
