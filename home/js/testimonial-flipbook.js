// Draws the Prep Portal gem logo using jsPDF primitives.
// SVG source: /icon.svg (100×100 viewBox)
function drawLogoOnPDF(doc, cx, cy, size) {
  const s = size / 100;
  const tx = x => cx - size / 2 + x * s;
  const ty = y => cy - size / 2 + y * s;

  function poly(pts, r, g, b) {
    doc.setFillColor(r, g, b);
    doc.setDrawColor(10, 10, 10);
    doc.setLineWidth(0.4);
    const segs = pts.slice(1).map((p, i) => [p[0] - pts[i][0], p[1] - pts[i][1]]);
    doc.lines(segs, pts[0][0], pts[0][1], [1, 1], 'FD', true);
  }

  // Blue left+bottom face
  poly([[tx(50),ty(50)],[tx(10),ty(27)],[tx(10),ty(73)],[tx(50),ty(96)]], 0, 85, 255);
  // Dark blue right+bottom face
  poly([[tx(50),ty(50)],[tx(90),ty(27)],[tx(90),ty(73)],[tx(50),ty(96)]], 0, 61, 179);
  // White top face
  poly([[tx(50),ty(50)],[tx(90),ty(27)],[tx(50),ty(4)],[tx(10),ty(27)]], 255, 255, 255);
  // Yellow centre diamond
  poly([[tx(50),ty(35)],[tx(65),ty(43)],[tx(65),ty(58)],[tx(50),ty(66)],[tx(35),ty(58)],[tx(35),ty(43)]], 255, 229, 0);
  // Centre dot
  doc.setFillColor(10, 10, 10);
  doc.circle(tx(50), ty(50.5), 4 * s, 'F');
}

function generatePDF(reviews) {
  const { jsPDF } = window.jspdf || window;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
  const margin = 15, pageWidth = 148, pageHeight = 210;
  const printableWidth = pageWidth - margin * 2;

  reviews.forEach((page, index) => {
    if (index > 0) doc.addPage('a5', 'portrait');

    if (page.type === 'cover') {
      // Blue background
      doc.setFillColor(0, 85, 255);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      // Outer border
      doc.setDrawColor(10, 10, 10);
      doc.setLineWidth(2.5);
      doc.rect(8, 8, pageWidth - 16, pageHeight - 16, 'S');

      // Logo centred in upper third of cover
      drawLogoOnPDF(doc, pageWidth / 2, 52, 34);

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.text('PREP PORTAL', pageWidth / 2, 78, { align: 'center' });

      doc.setFontSize(13);
      doc.setTextColor(255, 229, 0);
      doc.text(page.title || 'SUCCESS JOURNAL', pageWidth / 2, 90, { align: 'center' });

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      const subLines = doc.splitTextToSize(page.sub || '', printableWidth);
      let y = 104;
      subLines.forEach(line => { doc.text(line, pageWidth / 2, y, { align: 'center' }); y += 6; });

      doc.setFont('Courier', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 229, 0);
      doc.text(page.footer || 'PREP PORTAL • EST. 2026', pageWidth / 2, pageHeight - 25, { align: 'center' });

    } else if (page.type === 'back') {
      doc.setFillColor(10, 10, 10);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      doc.setDrawColor(255, 229, 0);
      doc.setLineWidth(2.0);
      doc.rect(8, 8, pageWidth - 16, pageHeight - 16, 'S');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      const titleLines = doc.splitTextToSize(page.title || '', printableWidth);
      let y = 60;
      titleLines.forEach(line => { doc.text(line, pageWidth / 2, y, { align: 'center' }); y += 8; });

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(180, 180, 180);
      const subLines = doc.splitTextToSize(page.sub || '', printableWidth);
      y += 10;
      subLines.forEach(line => { doc.text(line, pageWidth / 2, y, { align: 'center' }); y += 6; });

      y += 20;
      doc.setFillColor(0, 85, 255);
      doc.rect(pageWidth / 2 - 35, y, 70, 12, 'F');
      doc.setDrawColor(255, 255, 255);
      doc.rect(pageWidth / 2 - 35, y, 70, 12, 'S');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text(page.cta || 'START REVISION', pageWidth / 2, y + 7.5, { align: 'center' });

    } else {
      // Notebook-style testimonial page
      doc.setFillColor(250, 249, 246);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      doc.setDrawColor(10, 10, 10);
      doc.setLineWidth(1.5);
      doc.rect(margin / 2, margin / 2, pageWidth - margin, pageHeight - margin, 'S');

      doc.setDrawColor(0, 85, 255);
      doc.setLineWidth(0.15);
      for (let lineY = 40; lineY < pageHeight - 30; lineY += 9) {
        doc.line(margin, lineY, pageWidth - margin, lineY);
      }

      doc.setDrawColor(220, 38, 38);
      doc.setLineWidth(0.3);
      doc.line(26, margin, 26, pageHeight - margin);

      let y = 25;
      doc.setFillColor(0, 85, 255);
      doc.rect(30, y, 50, 9, 'F');
      doc.setDrawColor(10, 10, 10);
      doc.setLineWidth(0.8);
      doc.rect(30, y, 50, 9, 'S');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text((page.subject || 'REVIEW').toUpperCase(), 35, y + 6);

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(255, 190, 0);
      doc.text('★★★★★', pageWidth - margin - 25, y + 6);

      y += 24;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(10, 10, 10);
      const quoteLines = doc.splitTextToSize(`"${page.quote || ''}"`, printableWidth - 15);
      quoteLines.forEach(line => {
        if (y < pageHeight - 40) { doc.text(line, 30, y); y += 9; }
      });

      y = pageHeight - 35;
      doc.setDrawColor(10, 10, 10);
      doc.setLineWidth(0.8);
      doc.line(30, y, 80, y);
      y += 8;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(10, 10, 10);
      doc.text(page.author || 'User', 30, y);
      y += 5;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(85, 85, 85);
      doc.text(page.role || '', 30, y);
    }
  });

  return URL.createObjectURL(doc.output('blob'));
}

export function initTestimonialFlipbook({ containerId, data }) {
  let currentBlobUrl = null;

  function mount() {
    const $c = jQuery('#' + containerId);
    if (!$c.length) return;

    $c.empty();
    if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);
    currentBlobUrl = generatePDF(data);

    // DearFlip sizes the book by fitting the PDF aspect ratio inside the
    // container's width × height box. Width = full viewport (no section padding).
    // Height: pass a large number — DearFlip caps it at window.innerHeight,
    // which is the largest the book can ever be in one dimension.
    const bookHeight = window.innerHeight;

    $c.flipBook(currentBlobUrl, {
      webgl: true,
      height: bookHeight,
      duration: 800,
      backgroundColor: 'transparent',
      moreControls: 'pageMode,sound',
      hideControls: 'download,share',
    });
  }

  jQuery(document).ready(mount);
}
