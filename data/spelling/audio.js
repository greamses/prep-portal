/* Which Kokoro recordings of the spelling bank exist (written by tools/spelling-audio).
   dir: the folder under /media/spelling; w / d / s: bank indexes (0-based) that have a
   word / definition / sentence clip. Empty until the recordings are made: the drill
   then speaks with the browser's voice. */
export const CLIPS = { dir: 'secondary', w: new Set(), d: new Set(), s: new Set() };
