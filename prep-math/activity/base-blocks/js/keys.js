/* ============================================================================
   Manipulatives — every key on the canvas, in one list
   ----------------------------------------------------------------------------
   This is the list the Keys panel shows AND the list the canvas dispatches
   from: `k` is the key as `event.key.toLowerCase()` reports it, `act` names the
   handler in ui.js. Add a shortcut here and it works and is documented in the
   same stroke — there is no second place to keep in step.

   A handful of keys cannot be one entry each: the arrows, the two zooms, the
   highlight digits and the step-back/step-forward pair are RANGES or modified
   keys, so they are listed here with no `k` and handled by name in ui.js's
   keydown. Those are the only five, and each is marked.
   ========================================================================== */

export const SHORTCUTS = [
  {
    name: "Picking things up",
    items: [
      { keys: "A", k: "a", act: "all", does: "Pick up everything on the canvas" },
      { keys: "Esc", k: "escape", act: "clear", does: "Put everything down, and close a panel" },
      { keys: "Del", k: "delete", act: "delete", does: "Remove what is picked up" },
      { keys: "Backspace", k: "backspace", act: "delete", does: "The same", hide: true },
      { keys: "Ctrl + Z", act: "undo", does: "Step back" },
      { keys: "Ctrl + Y", act: "redo", does: "Step forward again — Ctrl + Shift + Z does the same" },
      { keys: "1 … 6", act: null, does: "Highlight what is picked up" },
      { keys: "0", act: null, does: "Take the highlight off" },
      { keys: "Shift-drag", act: null, does: "Sweep a box round several things" },
      { keys: "Ctrl-tap", act: null, does: "Add one more thing to what is picked up" },
    ],
  },
  {
    name: "Moving a piece",
    items: [
      { keys: "Drag", act: null, does: "Slide it about the paper" },
      { keys: "Q", k: "q", act: "turn", does: "Turn it a quarter turn on the paper" },
      { keys: "E", k: "e", act: "tip", does: "Tip it a quarter turn onto another face" },
      { keys: "U", k: "u", act: "lift", does: "Lift it a unit off the paper" },
      { keys: "D", k: "d", act: "lower", does: "Let it down a unit" },
      { keys: "Page ↑ / ↓", act: null, does: "Lift and let down, the same" },
      { keys: "Page ↑", k: "pageup", act: "lift", does: "Lift", hide: true },
      { keys: "Page ↓", k: "pagedown", act: "lower", does: "Let down", hide: true },
      { keys: "Alt-drag", act: null, does: "Ignore the snapping for this one move" },
      { keys: "Shift + handle", act: null, does: "Turn or tip in fifteens" },
    ],
  },
  {
    name: "How a piece lands",
    items: [
      { keys: "G", k: "g", act: "snapGrid", does: "Snap to the squares of the paper" },
      { keys: "F", k: "f", act: "snapSide", does: "Snap flush against the piece beside it" },
    ],
  },
  {
    name: "The blocks",
    items: [
      { keys: "S", k: "s", act: "split", does: "Split what is picked up" },
      { keys: "M", k: "m", act: "merge", does: "Merge it — or cancel zero pairs, on tiles" },
      { keys: "B", k: "b", act: "break", does: "Break it all the way down to units" },
      { keys: "R", k: "r", act: "regroup", does: "Regroup it the best way this base allows" },
      { keys: "T", k: "t", act: "tidy", does: "Tidy the whole canvas into rows" },
      { keys: "Y", k: "y", act: "sync", does: "Sync the tools to one number" },
    ],
  },
  {
    /* These belong to the note's own paper rather than to the canvas — the
       editor has them while you are writing on a note — but a learner looking
       for "how do I write a formula" looks in one list, so they are in it. */
    name: "Writing on a note",
    items: [
      { keys: "Double-tap", act: null, does: "Open a note to write on it" },
      { keys: "Alt + =", act: null, does: "Write an equation where the caret is" },
      { keys: "Enter", act: null, does: "Set the equation and carry on writing" },
      { keys: "Tap it", act: null, does: "Open a set equation again to correct it" },
      { keys: "Ctrl + B I U", act: null, does: "Bold, slanted, underlined" },
      { keys: "Esc", act: null, does: "Put the pen down — an empty note is binned" },
    ],
  },
  {
    name: "Getting about",
    items: [
      { keys: "← ↑ → ↓", act: null, does: "Slide the paper under the camera" },
      { keys: "+ / −", act: null, does: "Closer and further" },
      { keys: "H", k: "h", act: "hand", does: "The hand tool: drag anywhere to slide the paper" },
      { keys: "V", k: "v", act: "view", does: "Flat 2D view, and back to solid" },
      { keys: "?", k: "?", act: "keys", does: "This list" },
      { keys: "Right-drag", act: null, does: "Swing the camera round the paper" },
    ],
  },
];

/** Every entry that dispatches itself, by key. */
export function keyMap() {
  const out = new Map();
  for (const group of SHORTCUTS) {
    for (const item of group.items) {
      if (item.k && item.act) out.set(item.k, item.act);
    }
  }
  return out;
}
