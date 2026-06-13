/* =====================================================================
   Shared mutable game state.

   ES-module exports are read-only for importers, so every cross-module
   flag lives on this single object: any module can do `S.animating = true`
   and every other module sees it. Module-private state (timers, the active
   key-press, pointer bookkeeping) stays local to its owning module.
   ===================================================================== */
export const S = {
  // move engine / solve flow
  animating: false,
  moveCount: 0,
  started: false,
  solved: true,
  scrambling: false,
  inspecting: false,
  gameMode: "challenge", // "challenge" | "algo" | "scan"

  // practice + modal
  practiceMode: "full",
  modalOpen: false,

  // thumbstick / whole-cube rotation
  rotMode: "step", // "step" | "free"
  stickEngaged: false,
  stickNX: 0,
  stickNY: 0,

  // scanned-cube solution playback
  playingSolve: false,
};
