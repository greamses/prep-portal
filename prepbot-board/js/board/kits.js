/* ============================================================================
   PrepBoard — diagrams drawn IN STEPS
   ----------------------------------------------------------------------------
   A teacher does not put a finished cell on the board: they draw the wall,
   say what it is for, then the vacuole, then the chloroplasts, one part at a
   time. These are the parts, each drawn on its own, in the diagram's own box.

   The two cells are drawn here, part by part, in a clean textbook style (the
   library's cell pictures are single paintings and cannot be taken apart).
   The heart and the brain need nothing here: their library drawings are
   already one outline per part (diagrams.js turns those into steps).

   Each part: { svg, cx, cy } — `svg` in the box's units; elements with the
   class "k-line" are DRAWN (the pencil traces them), "k-fill" are laid in
   after; (cx, cy) is where its label points.
   ========================================================================== */

const L = (d, c = "#2a2723", w = 4) => `<path class="k-line" d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const F = (d, c, o = 1) => `<path class="k-fill" d="${d}" fill="${c}" opacity="${o}" stroke="none"/>`;
const ell = (cx, cy, rx, ry, rot = 0) => {
  /* an ellipse as a path, so it can be drawn by its dash */
  const a = (rot * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const p = (t) => { const x = rx * Math.cos(t), y = ry * Math.sin(t); return [cx + x * c - y * s, cy + x * s + y * c]; };
  const pts = Array.from({ length: 25 }, (_, i) => p((i / 24) * Math.PI * 2));
  return "M" + pts.map((q) => q.map((v) => v.toFixed(1)).join(" ")).join("L") + "Z";
};
const rrect = (x, y, w, h, r) => `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
const wave = (x0, y0, x1, amp, n) => {
  let d = `M${x0} ${y0}`;
  const step = (x1 - x0) / n;
  for (let i = 0; i < n; i++) d += `Q${x0 + step * (i + 0.5)} ${y0 + (i % 2 ? amp : -amp)} ${x0 + step * (i + 1)} ${y0}`;
  return d;
};
const dots = (pts, r = 5, c = "#4b4440") => pts.map(([x, y]) => `<circle class="k-fill" cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join("");

/* a chloroplast: a green lozenge with its stacks of discs (grana) */
const chloro = (cx, cy, rot) => {
  const a = (rot * Math.PI) / 180;
  const stack = [-26, 0, 26].map((dx) => {
    const x = cx + dx * Math.cos(a), y = cy + dx * Math.sin(a);
    return [-7, 0, 7].map((dy) => L(`M${(x - 9).toFixed(1)} ${(y + dy).toFixed(1)}H${(x + 9).toFixed(1)}`, "#2f6f2f", 3)).join("");
  }).join("");
  return F(ell(cx, cy, 56, 27, rot), "#8fd07a") + L(ell(cx, cy, 56, 27, rot), "#3b8a3b", 4) + stack;
};
/* a mitochondrion: an orange capsule with its folded inner membrane */
const mito = (cx, cy, rot) => {
  const a = (rot * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const pts = [-30, -18, -6, 6, 18, 30].map((x, i) => [cx + x * c - (i % 2 ? 9 : -9) * s, cy + x * s + (i % 2 ? 9 : -9) * c]);
  const cristae = "M" + pts.map((q) => q.map((v) => v.toFixed(1)).join(" ")).join("L");
  return F(ell(cx, cy, 46, 22, rot), "#f6bf91") + L(ell(cx, cy, 46, 22, rot), "#c8692b", 4) + L(cristae, "#c8692b", 3);
};
/* the Golgi apparatus: a stack of curved sacs */
const golgi = (cx, cy) => [0, 14, 28, 42].map((dy, i) => L(`M${cx - 52 + i * 4} ${cy + dy}Q${cx} ${cy + dy - 22} ${cx + 52 - i * 4} ${cy + dy}`, "#b0679b", 6)).join("");

const PLANT = {
  w: 1000, h: 756,
  parts: {
    "cell wall": { cx: 92, cy: 380, svg: F(rrect(70, 50, 860, 656, 70) + rrect(96, 76, 808, 604, 52), "#c8e8b4") .replace('d="', 'fill-rule="evenodd" d="') + L(rrect(70, 50, 860, 656, 70), "#3f8f3f", 6) + L(rrect(96, 76, 808, 604, 52), "#3f8f3f", 4) },
    "cell membrane": { cx: 112, cy: 250, svg: L(rrect(112, 92, 776, 572, 44), "#d99a2b", 4) },
    cytoplasm: { cx: 170, cy: 420, svg: F(rrect(114, 94, 772, 568, 42), "#f6f3d6", 0.9) },
    vacuole: { cx: 420, cy: 380, svg: F("M220 300C240 200 380 170 470 190C580 210 660 260 650 380C640 500 560 570 430 565C300 560 210 500 220 300Z", "#cfe6f7") + L("M220 300C240 200 380 170 470 190C580 210 660 260 650 380C640 500 560 570 430 565C300 560 210 500 220 300Z", "#5a9bd0", 5) },
    tonoplast: { cx: 650, cy: 380, svg: L("M220 300C240 200 380 170 470 190C580 210 660 260 650 380C640 500 560 570 430 565C300 560 210 500 220 300Z", "#2e6ea3", 8) },
    chloroplast: { cx: 205, cy: 160, svg: chloro(205, 160, -18) + chloro(720, 150, 12) + chloro(190, 600, 14) + chloro(560, 625, -8) },
    "thylakoid membrane": { cx: 205, cy: 160, svg: L("M180 150H230M178 160H232M180 170H230", "#1f5a1f", 3) },
    "starch grain": { cx: 720, cy: 150, svg: `<ellipse class="k-fill" cx="740" cy="152" rx="11" ry="7" fill="#fff"/><ellipse class="k-fill" cx="195" cy="604" rx="11" ry="7" fill="#fff"/>` + L(ell(740, 152, 11, 7), "#8a8a6a", 2) },
    nucleus: { cx: 775, cy: 390, svg: F(ell(775, 390, 82, 82), "#e6c8f0") + L(ell(775, 390, 82, 82), "#8a5aa8", 5) + L(ell(775, 390, 72, 72), "#8a5aa8", 2) },
    nucleolus: { cx: 790, cy: 380, svg: F(ell(790, 380, 26, 26), "#a77bc0") + L(ell(790, 380, 26, 26), "#6d4489", 3) },
    "nuclear pore": { cx: 700, cy: 360, svg: dots([[694, 360], [856, 410], [760, 309], [790, 471]], 6, "#fff") },
    mitochondrion: { cx: 845, cy: 245, svg: mito(845, 245, 70) + mito(330, 640, 6) },
    "rough endoplasmic reticulum": { cx: 790, cy: 525, svg: L(wave(700, 510, 870, 12, 6), "#9a6bb0", 5) + L(wave(705, 540, 865, 12, 6), "#9a6bb0", 5) + dots([[712, 500], [740, 520], [770, 500], [800, 520], [830, 500], [858, 520], [725, 552], [785, 552], [845, 552]], 4) },
    "smooth endoplasmic reticulum": { cx: 470, cy: 640, svg: L(wave(410, 630, 530, 10, 4), "#c07fb8", 6) + L(wave(415, 656, 525, 10, 4), "#c07fb8", 6) },
    ribosome: { cx: 160, cy: 360, svg: dots([[150, 300], [175, 340], [148, 380], [170, 420], [152, 460], [880, 600], [640, 150], [600, 175], [860, 140], [660, 590]]) },
    "Golgi apparatus": { cx: 540, cy: 120, svg: golgi(540, 112) },
    vesicle: { cx: 610, cy: 205, svg: F(ell(615, 205, 12, 12), "#e3b5d8") + L(ell(615, 205, 12, 12), "#b0679b", 3) + F(ell(470, 595, 10, 10), "#e3b5d8") + L(ell(470, 595, 10, 10), "#b0679b", 3) },
    peroxisome: { cx: 640, cy: 520, svg: F(ell(645, 520, 16, 16), "#cfe7a3") + L(ell(645, 520, 16, 16), "#6f9a2a", 3) },
    plasmodesma: { cx: 500, cy: 62, svg: L("M500 48V96M640 48V96M360 660V708M500 660V708", "#2f6f2f", 4) },
  },
};

const ANIMAL = {
  w: 1000, h: 653,
  parts: {
    "cell membrane": { cx: 70, cy: 330, svg: F("M80 330C80 150 260 50 500 50C760 50 930 160 930 330C930 500 760 610 500 610C250 610 80 510 80 330Z", "#fbe9dc") + L("M80 330C80 150 260 50 500 50C760 50 930 160 930 330C930 500 760 610 500 610C250 610 80 510 80 330Z", "#d58a5a", 6) },
    cytoplasm: { cx: 200, cy: 330, svg: F("M90 330C90 160 265 60 500 60C755 60 920 165 920 330C920 495 755 600 500 600C255 600 90 505 90 330Z", "#fdf3e2", 0.9) },
    nucleus: { cx: 520, cy: 320, svg: F(ell(520, 320, 112, 104), "#e2c6ee") + L(ell(520, 320, 112, 104), "#8a5aa8", 5) },
    "nuclear envelope": { cx: 408, cy: 320, svg: L(ell(520, 320, 122, 114), "#6d4489", 3) },
    nucleolus: { cx: 545, cy: 300, svg: F(ell(545, 300, 34, 30), "#a77bc0") + L(ell(545, 300, 34, 30), "#6d4489", 3) },
    chromatin: { cx: 480, cy: 350, svg: L("M440 350q12-18 24 0t24 0t24 0M450 380q10-14 20 0t20 0M470 260q10-12 20 0t20 0", "#7b4c96", 3) },
    mitochondrion: { cx: 240, cy: 240, svg: mito(240, 240, -20) + mito(770, 460, 15) + mito(300, 470, 30) },
    ribosome: { cx: 200, cy: 330, svg: dots([[190, 320], [215, 360], [380, 180], [660, 160], [700, 520], [620, 560], [880, 300], [160, 420], [420, 520]]) },
    "rough endoplasmic reticulum": { cx: 380, cy: 300, svg: L("M392 210Q350 260 360 320T392 430", "#9a6bb0", 6) + L("M372 200Q328 260 338 322T372 444", "#9a6bb0", 6) + dots([[352, 240], [336, 290], [334, 350], [346, 400], [372, 252], [358, 380]], 4) },
    "smooth endoplasmic reticulum": { cx: 760, cy: 230, svg: L(wave(700, 220, 830, 11, 5), "#c07fb8", 6) + L(wave(705, 248, 825, 11, 5), "#c07fb8", 6) },
    "Golgi apparatus": { cx: 690, cy: 360, svg: golgi(700, 340) },
    lysosome: { cx: 230, cy: 380, svg: F(ell(230, 380, 24, 24), "#f3a6a6") + L(ell(230, 380, 24, 24), "#c25454", 3) + F(ell(840, 400, 18, 18), "#f3a6a6") + L(ell(840, 400, 18, 18), "#c25454", 3) },
    centrosome: { cx: 430, cy: 150, svg: L("M410 140h26v14h-26zM430 158v26h14v-26z", "#4f7f9f", 4) },
    "secretory vesicle": { cx: 860, cy: 320, svg: F(ell(865, 320, 16, 16), "#e3b5d8") + L(ell(865, 320, 16, 16), "#b0679b", 3) + F(ell(820, 250, 12, 12), "#e3b5d8") + L(ell(820, 250, 12, 12), "#b0679b", 3) },
    peroxisome: { cx: 600, cy: 520, svg: F(ell(600, 520, 18, 18), "#cfe7a3") + L(ell(600, 520, 18, 18), "#6f9a2a", 3) },
    microtubule: { cx: 330, cy: 120, svg: L("M430 150L300 100M440 160L560 90M436 170L250 180", "#8fb3c9", 2) },
    cytoskeleton: { cx: 640, cy: 470, svg: L("M120 300L260 120M700 90L880 220M650 600L880 420M200 560L320 520", "#cfd8dc", 2) },
    flagellum: { cx: 960, cy: 330, svg: L("M930 330q15-25 30 0t30 0", "#d58a5a", 5) },
  },
};

export const KITS = { "plant-cell": PLANT, "animal-cell": ANIMAL };
