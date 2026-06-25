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
  moveSpeed: 0.16, // walk speed
  lookSensitivity: 3500, // higher = slower mouse-look

  // palette (soft-UI friendly)
  colors: {
    sky: "#aed4f2",
    ground: "#d7cdb8",
    wallA: "#8aa0e8",
    wallB: "#6fb7e8",
    goal: "#7cc47c",
  },
};
