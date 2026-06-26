/* ============================================================================
   3D Maze — configuration
   ----------------------------------------------------------------------------
   One small place to tune the maze size, scale and look. Everything else reads
   from here so the game is easy to retune without hunting through modules.
   ========================================================================== */

export const CFG = {
  // maze grid (cells)
  cols: 8,
  rows: 8,

  // world scale (Babylon units)
  cell: 4, // size of one maze cell
  wallH: 3, // wall height
  wallT: 0.35, // wall thickness

  // player
  eyeH: 1.7, // camera (eye) height
  moveSpeed: 0.22, // walk speed (per frame)
  runSpeed: 0.36, // run speed (per frame)
  runThreshold: 0.85, // stick magnitude above which the character runs
  turnLerp: 0.2, // how fast the character turns to face movement (0..1)
  modelYaw: Math.PI, // facing offset so the model points the right way
  camDist: 6, // third-person camera distance
  lookSensitivity: 3500, // higher = slower mouse-look
  graceMs: 4000, // head-start before the hunters wake

  // palette (soft-UI friendly)
  colors: {
    sky: "#aed4f2",
    ground: "#d7cdb8",
    wallA: "#8aa0e8",
    wallB: "#6fb7e8",
    goal: "#7cc47c",
  },
};
