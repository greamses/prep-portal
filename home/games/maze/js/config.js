/* ============================================================================
   3D Maze — configuration
   ----------------------------------------------------------------------------
   One small place to tune the maze size, scale and look. Player settings (size,
   gates, zombies, scene) persist in localStorage and override the defaults.
   ========================================================================== */

export const CFG = {
  // maze grid (cells)
  cols: 12,
  rows: 12,

  // world scale (Babylon units)
  cell: 4, // size of one maze cell
  wallH: 3, // wall height
  wallT: 0.35, // wall thickness

  // player
  eyeH: 1.7, // camera (eye) height
  moveSpeed: 0.1, // walk speed (per frame)
  runSpeed: 0.28, // run speed (per frame)
  runThreshold: 0.85, // stick magnitude above which the character runs
  turnLerp: 0.2, // how fast the character turns to face movement (0..1)
  modelYaw: 0, // facing offset so the model points the right way
  camDist: 3.6, // third-person camera distance (closer behind)
  camKey: "Normal",
  closeOnRun: true, // pull the camera in close behind while running
  lookSensitivity: 3500, // higher = slower mouse-look

  // enemies / gates (overridable in Settings)
  enemyCount: 1, // the detailed chaser that trails from behind (0/1)
  ambushCount: 5, // shadow zombies hidden in dead-ends (wake when you pass)
  enemySpeed: 0.07, // zombie move speed (< player walk)
  graceMs: 3000, // countdown after the chaser appears before it hunts
  gateCount: 3, // riddle gates on the solution path
  debugCollision: false,

  // scene / theme
  scene: "dungeon",
  themes: {
    dungeon: { sky: "#2a3550", fog: "#161d30", fogD: 0.012, ground: "#cfc6b4", wallTint: "#9aa6c8", name: "Dungeon" },
    grass:   { sky: "#bfe6ff", fog: "#cfeaff", fogD: 0.009, ground: "#6faa4c", wallTint: "#a9cf86", name: "Grass" },
    forest:  { sky: "#7e9472", fog: "#67805d", fogD: 0.022, ground: "#5a4a32", wallTint: "#7c6a48", name: "Forest" },
    ice:     { sky: "#dff1ff", fog: "#eaf6ff", fogD: 0.016, ground: "#cfe6f2", wallTint: "#bcd9ec", name: "Ice" },
  },
  goalColor: "#7cc47c",
  subject: "all", // gate question subject: all | math | english | science

  /** Current theme palette. */
  theme() { return this.themes[this.scene] || this.themes.dungeon; },
};

// ── apply persisted player settings ───────────────────────────────────────
export const SIZES = { S: 8, M: 12, L: 16, XL: 22 };
export const CAM = { Close: 2.6, Normal: 3.6, Far: 5.5 };
try {
  const s = JSON.parse(localStorage.getItem("mz-settings") || "{}");
  if (s.size && SIZES[s.size]) { CFG.cols = CFG.rows = SIZES[s.size]; CFG.sizeKey = s.size; }
  if (Number.isInteger(s.gates)) CFG.gateCount = s.gates;
  if (Number.isInteger(s.zombies)) CFG.ambushCount = s.zombies;
  if (s.scene && CFG.themes[s.scene]) CFG.scene = s.scene;
  if (s.cam && CAM[s.cam]) { CFG.camKey = s.cam; CFG.camDist = CAM[s.cam]; }
  if (s.subject) CFG.subject = s.subject;
} catch (e) {}
if (!CFG.sizeKey) CFG.sizeKey = CFG.cols >= 22 ? "XL" : CFG.cols >= 16 ? "L" : CFG.cols >= 12 ? "M" : "S";
