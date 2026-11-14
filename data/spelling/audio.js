/* Which Kokoro recordings of the spelling bank exist, and where (written by
   tools/spelling-audio/manifest.mjs on GitHub Actions). The clips are not in this branch:
   they live on the repo's spelling-audio branch and are served by jsDelivr, pinned to a
   commit. w / d / s: bank indexes (0-based) with a word / definition / sentence clip.
   Anything not listed is spoken with the browser's voice. Voice: bf_emma. */
export const CLIPS = {
  base: 'https://cdn.jsdelivr.net/gh/greamses/prep-portal@f3b83d61d34ed5766a0f7298f6e0c7bd112738c8/secondary/bf_emma/',
  w: new Set([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39]),
  d: new Set([]),
  s: new Set([]),
};
