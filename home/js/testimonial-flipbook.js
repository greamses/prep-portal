// ============================================================
// CONSTANTS
// ============================================================
const COLORS = {
  primary:     [0, 85, 255],
  darkPrimary: [0, 61, 179],
  yellow:      [255, 229, 0],
  ratingGold:  [255, 190, 0],
  black:       [10, 10, 10],
  white:       [255, 255, 255],
  gray:        [180, 180, 180],
  darkGray:    [85, 85, 85],
};

const SUBJECT_ACCENT = {
  'MATHEMATICS':      [0, 85, 255],
  'CAMBRIDGE IGCSE':  [8, 145, 178],
  'JAMB CBT':         [220, 38, 38],
  'CONVINCING VALUE': [124, 58, 237],
  'ENGLISH':          [22, 163, 74],
  'ECONOMICS':        [217, 119, 6],
  'BIOLOGY':          [5, 150, 105],
};

const PAGE = {
  WIDTH:  148,
  HEIGHT: 210,
  MARGIN: 15,
};

const FONT = {
  primary: "Helvetica",
  mono:    "Courier",
  sizes: {
    tiny:    7,
    small:   9,
    body:    10,
    medium:  11,
    heading: 13,
    large:   18,
    xlarge:  22,
  },
};

// ============================================================
// LOGO DRAWING UTILITY
// ============================================================
function drawLogoOnPDF(doc, cx, cy, size) {
  const s  = size / 100;
  const tx = (x) => cx - size / 2 + x * s;
  const ty = (y) => cy - size / 2 + y * s;

  function poly(pts, r, g, b) {
    doc.setFillColor(r, g, b);
    doc.setDrawColor(...COLORS.black);
    doc.setLineWidth(0.4);
    const segs = pts.slice(1).map((p, i) => [p[0] - pts[i][0], p[1] - pts[i][1]]);
    doc.lines(segs, pts[0][0], pts[0][1], [1, 1], "FD", true);
  }

  poly([[tx(50), ty(50)], [tx(10), ty(27)], [tx(10), ty(73)], [tx(50), ty(96)]], ...COLORS.primary);
  poly([[tx(50), ty(50)], [tx(90), ty(27)], [tx(90), ty(73)], [tx(50), ty(96)]], ...COLORS.darkPrimary);
  poly([[tx(50), ty(50)], [tx(90), ty(27)], [tx(50), ty(4)],  [tx(10), ty(27)]], ...COLORS.white);
  poly([[tx(50), ty(35)], [tx(65), ty(43)], [tx(65), ty(58)], [tx(50), ty(66)], [tx(35), ty(58)], [tx(35), ty(43)]], ...COLORS.yellow);
  doc.setFillColor(...COLORS.black);
  doc.circle(tx(50), ty(50.5), 4 * s, "F");
}

// ============================================================
// PAGE RENDERERS  (all theme-aware via isDark flag)
// ============================================================
function renderCoverPage(doc, page, isDark) {
  const { WIDTH: pw, HEIGHT: ph, MARGIN: M } = PAGE;

  const bg  = isDark ? COLORS.black : COLORS.white;
  const ink = isDark ? COLORS.white : COLORS.black;

  doc.setFillColor(...bg);
  doc.rect(0, 0, pw, ph, "F");

  // Left accent stripe
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, 11, ph, "F");

  // Logo
  drawLogoOnPDF(doc, 36, 58, 30);

  // Prep Portal wordmark
  doc.setFont(FONT.primary, "bold");
  doc.setFontSize(FONT.sizes.tiny);
  doc.setTextColor(...COLORS.primary);
  doc.text("PREP PORTAL", 26, 78);

  // Big title
  doc.setFont(FONT.primary, "bold");
  doc.setFontSize(FONT.sizes.xlarge);
  doc.setTextColor(...ink);
  const titleLines = doc.splitTextToSize(page.title || "SUCCESS JOURNAL", pw - 26 - M);
  let y = 100;
  titleLines.forEach((line) => {
    doc.text(line, 26, y);
    y += 13;
  });

  // Yellow rule
  doc.setFillColor(...COLORS.yellow);
  doc.rect(26, y + 2, 55, 3.5, "F");

  // Sub
  y += 14;
  doc.setFont(FONT.primary, "normal");
  doc.setFontSize(FONT.sizes.small);
  doc.setTextColor(...(isDark ? COLORS.gray : COLORS.darkGray));
  const subLines = doc.splitTextToSize(page.sub || "", pw - 26 - M);
  subLines.forEach((line) => {
    doc.text(line, 26, y);
    y += 5.5;
  });

  // Footer
  doc.setFont(FONT.mono, "bold");
  doc.setFontSize(FONT.sizes.tiny);
  doc.setTextColor(...COLORS.primary);
  doc.text(page.footer || "PREP PORTAL • EST. 2026", 26, ph - 14);
}

function renderBackPage(doc, page, isDark) {
  const { WIDTH: pw, HEIGHT: ph, MARGIN: M } = PAGE;

  // Back cover always dark for emphasis
  doc.setFillColor(...COLORS.black);
  doc.rect(0, 0, pw, ph, "F");

  // Right yellow stripe
  doc.setFillColor(...COLORS.yellow);
  doc.rect(pw - 11, 0, 11, ph, "F");

  // Title
  doc.setFont(FONT.primary, "bold");
  doc.setFontSize(FONT.sizes.large);
  doc.setTextColor(...COLORS.white);
  const titleLines = doc.splitTextToSize(page.title || "", pw - M * 2 - 12);
  let y = 55;
  titleLines.forEach((line) => {
    doc.text(line, M, y);
    y += 10;
  });

  // Sub
  y += 6;
  doc.setFont(FONT.primary, "normal");
  doc.setFontSize(FONT.sizes.small);
  doc.setTextColor(...COLORS.gray);
  const subLines = doc.splitTextToSize(page.sub || "", pw - M * 2 - 12);
  subLines.forEach((line) => {
    doc.text(line, M, y);
    y += 5.5;
  });

  // CTA button
  y += 12;
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(M, y, 72, 12, 2, 2, "F");
  doc.setFont(FONT.primary, "bold");
  doc.setFontSize(FONT.sizes.small);
  doc.setTextColor(...COLORS.white);
  doc.text(page.cta || "START REVISION", M + 5, y + 8);
}

function renderTestimonialPage(doc, page, isDark) {
  const { WIDTH: pw, HEIGHT: ph, MARGIN: M } = PAGE;
  const pw2 = pw - M * 2;

  const bg      = isDark ? COLORS.black : COLORS.white;
  const ink     = isDark ? COLORS.white : COLORS.black;
  const muted   = isDark ? COLORS.gray  : COLORS.darkGray;
  const accent  = SUBJECT_ACCENT[(page.subject || "").toUpperCase()] || COLORS.primary;

  // Background
  doc.setFillColor(...bg);
  doc.rect(0, 0, pw, ph, "F");

  // Top accent bar
  doc.setFillColor(...accent);
  doc.rect(0, 0, pw, 7, "F");

  // Subject label — top right
  doc.setFont(FONT.mono, "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...accent);
  doc.text((page.subject || "REVIEW").toUpperCase(), pw - M, 17, { align: "right" });

  // Stars — top left
  doc.setFontSize(FONT.sizes.small);
  doc.setTextColor(...COLORS.ratingGold);
  doc.text("★★★★★", M, 17);

  // Giant decorative open-quote mark
  doc.setFont(FONT.primary, "bold");
  doc.setFontSize(58);
  doc.setTextColor(isDark ? 55 : 215, isDark ? 55 : 215, isDark ? 55 : 215);
  doc.text("“", M - 1, 52);

  // Quote text
  doc.setFont(FONT.primary, "bold");
  doc.setFontSize(11);
  doc.setTextColor(...ink);
  const quoteLines = doc.splitTextToSize(page.quote || "", pw2);
  let y = 62;
  for (const line of quoteLines) {
    if (y > ph - 42) break;
    doc.text(line, M, y);
    y += 8.5;
  }

  // Bottom horizontal rule (accent colored, short)
  const ruleY = ph - 32;
  doc.setDrawColor(...accent);
  doc.setLineWidth(1.5);
  doc.line(M, ruleY, M + pw2 / 2.8, ruleY);

  // Author name
  doc.setFont(FONT.primary, "bold");
  doc.setFontSize(FONT.sizes.medium);
  doc.setTextColor(...ink);
  doc.text(page.author || "", M, ruleY + 9);

  // Role / location
  doc.setFont(FONT.mono, "normal");
  doc.setFontSize(FONT.sizes.tiny + 0.5);
  doc.setTextColor(...muted);
  doc.text(page.role || "", M, ruleY + 17);
}

// ============================================================
// PDF GENERATION
// ============================================================
function generatePDF(reviews) {
  const jspdfLib = window.jspdf;
  if (!jspdfLib || typeof jspdfLib.jsPDF !== "function") {
    throw new Error("jsPDF is not loaded.");
  }
  const { jsPDF } = jspdfLib;

  if (!Array.isArray(reviews) || reviews.length === 0) {
    throw new Error("generatePDF requires a non-empty array of page objects.");
  }

  const isDark = document.documentElement.dataset.theme === "dark";

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });

  reviews.forEach((page, index) => {
    if (index > 0) doc.addPage("a5", "portrait");

    if (page.type === "cover") {
      renderCoverPage(doc, page, isDark);
    } else if (page.type === "back") {
      renderBackPage(doc, page, isDark);
    } else {
      renderTestimonialPage(doc, page, isDark);
    }
  });

  return URL.createObjectURL(doc.output("blob"));
}

// ============================================================
// FLIPBOOK INITIALISATION
// ============================================================
export function initTestimonialFlipbook({ containerId, data }) {
  let currentBlobUrl = null;

  function mount() {
    const selector = containerId.startsWith("#") ? containerId : `#${containerId}`;
    const $c = jQuery(selector);
    if (!$c.length) {
      console.error(`Container "${selector}" not found in the DOM.`);
      return;
    }

    $c.empty();
    if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);

    try {
      currentBlobUrl = generatePDF(data);
    } catch (err) {
      console.error("Failed to generate PDF:", err.message);
      $c.html('<p style="color:red;padding:20px;text-align:center;">⚠️ Unable to load the flipbook. Please refresh the page.</p>');
      return;
    }

    $c.flipBook(currentBlobUrl, {
      webgl: true,
      height: window.innerHeight,
      duration: 800,
      backgroundColor: "transparent",
      moreControls: "pageMode,sound",
      hideControls: "download,share",
    });
  }

  jQuery(document).ready(mount);
}
