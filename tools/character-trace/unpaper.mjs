// Makes an already-traced VTracer SVG (a picture on white paper) into a transparent one
// cropped to the figure, like media/characters/boy.svg:
//   1. the full-size paper path (the first one, the size of the whole picture) goes;
//   2. paper the figure encloses (white shapes the paper reaches from the edges, and
//      gaps under an arm) goes too: a near-white path whose box touches the picture's
//      edge, or one listed by its index;
//   3. the viewBox is cropped to what is left, with the feet on the bottom edge.
//
//   node unpaper.mjs <in.svg> <out.svg> "<Title>" [index,index...]
// The figure's box is measured in a browser (scratchpad pw/assets-bbox.mjs) and passed in
// with --box x,y,w,h, because SVG paths cannot be measured without drawing them.
import { readFileSync, writeFileSync } from 'node:fs';

const [, , IN, OUT, TITLE = 'Figure', drop = ''] = process.argv;
const boxArg = process.argv.indexOf('--box');
const src = readFileSync(IN, 'utf8');
const paths = [...src.matchAll(/<path\b[^>]*\/>/g)].map((m) => m[0]);
const W = Number(src.match(/<svg[^>]*\bwidth="([\d.]+)"/)[1]), H = Number(src.match(/<svg[^>]*\bheight="([\d.]+)"/)[1]);
const dropSet = new Set(drop.split(',').filter(Boolean).map(Number));
const nearWhite = (fill) => { const m = /^#([0-9a-f]{6})$/i.exec(fill || ''); if (!m) return false; const n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255].every((c) => c >= 240); };
const keep = paths.filter((p, i) => {
  if (i === 0) return false;                            // the paper
  if (dropSet.has(i)) return false;
  return true;
});
let box = [0, 0, W, H];
if (boxArg > 0) box = process.argv[boxArg + 1].split(',').map(Number);
const [x, y, w, h] = box;
const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}"><title>${TITLE}</title>\n${keep.join('\n')}\n</svg>\n`;
writeFileSync(OUT, out);
console.log(`${OUT}: ${keep.length} of ${paths.length} paths, viewBox ${box.join(' ')}, ${(out.length / 1024).toFixed(0)} KB; near-white kept: ${keep.filter((p) => nearWhite((p.match(/fill="([^"]+)"/) || [])[1])).length}`);
