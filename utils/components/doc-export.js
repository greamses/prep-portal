/* ============================================================================
   Download what a page prints: PDF, Word or Google Docs
   ----------------------------------------------------------------------------
   Every print on the site gets a Download key beside it (mountDownload). It opens a small receipt with three choices:

     PDF          the printed pages as they print: each page is captured with the page's PRINT styles switched on (so what
                  is hidden on paper is hidden here too), one PDF page per sheet, or one long piece cut into A4 pages at a gap
                  between lines.
     Word         an editable .docx: the same printed content read as text, headings, lists and tables, with every picture,
                  diagram and formula put in as an image. Opens in Word, Google Docs, Pages and LibreOffice.
     Google Docs  that same .docx put in the person's OWN Google Drive (a Google sign-in asks for permission to add files to
                  Drive), converted to a Google Doc, and a link to open it. Nothing is kept by us.

     mountDownload(printButton, {
       pages: () => [elements],      one PDF page per element (fixed-size sheets: workbooks, OMR sheets)   } one of these
       root:  () => element,         one long piece, cut into A4 pages                                      }
       image: async () => canvas,    a single picture (Cartesian Art)                                       }
       name:  () => "file name",
       gate:  async () => true,      false stops it (a workbook without a subscription: the gate explains)
       before: async () => {},       bring the page up to date first (redraw, typeset)
       pdfUrl: "",                   a ready-made PDF to hand over instead of making one
     })

   The libraries are fetched only when a download is asked for: modern-screenshot (the browser's own rendering of a piece of
   the page), jsPDF and docx.
   ========================================================================== */

const LIB = {
  shot: "https://cdn.jsdelivr.net/npm/modern-screenshot@4.4.39/+esm",
  pdf: "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm",
  docx: "https://cdn.jsdelivr.net/npm/docx@8.5.0/+esm",
};
const SVGNS = "http://www.w3.org/2000/svg";
const PX_MM = 25.4 / 96;
const A4 = { w: 210, h: 297 };

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
const safeName = (s) => (String(s || "Prep Portal").replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 90) || "Prep Portal");

/* ── the page's print styles, switched on for screen ─────────────────────────
   Every @media print rule the page's own stylesheets carry is copied into a style element for the length of the capture, and the
   page is told it is about to print (beforeprint), so anything that readies itself for paper does so here too. */
function emulatePrint() {
  const css = [];
  const take = (rules) => {
    for (const r of rules) {
      if (r.type === CSSRule.MEDIA_RULE) {
        const m = r.media.mediaText.toLowerCase();
        if (/\bprint\b/.test(m) && !/not\s+print/.test(m)) for (const x of r.cssRules) { if (x.type === CSSRule.STYLE_RULE && /a\[href\]::?after/.test(x.selectorText)) continue; css.push(x.cssText); }
        else take(r.cssRules);
      } else if (r.type === CSSRule.IMPORT_RULE && r.styleSheet) {
        try { take(r.styleSheet.cssRules); } catch { /* another site's sheet */ }
      } else if (r.cssRules && r.type !== CSSRule.STYLE_RULE) {
        try { take(r.cssRules); } catch { /* skip */ }
      }
    }
  };
  for (const sh of document.styleSheets) {
    let rules; try { rules = sh.cssRules; } catch { continue; }
    if (sh.media && /^\s*print\s*$/i.test(sh.media.mediaText)) { for (const x of rules) css.push(x.cssText); continue; }
    take(rules);
  }
  try { dispatchEvent(new Event("beforeprint")); } catch { /* nothing listening */ }
  const st = document.createElement("style");
  st.id = "pp-export-print";
  st.textContent = css.join("\n");
  document.head.appendChild(st);
  document.documentElement.classList.add("pp-exporting");
  return () => {
    st.remove();
    document.documentElement.classList.remove("pp-exporting");
    try { dispatchEvent(new Event("afterprint")); } catch { /* nothing listening */ }
  };
}

const shown = (el) => { if (!el || !el.isConnected) return false; const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2 && getComputedStyle(el).display !== "none"; };

/* ── pictures ────────────────────────────────────────────────────────────────
   An SVG drawn by MathJax points into a glyph store kept elsewhere on the page (<use href="#MJX-…">); on its own it would be
   empty, so every <use> is replaced by a copy of what it points at before the picture is made. */
function standaloneSvg(svg) {
  const c = svg.cloneNode(true);
  const r = svg.getBoundingClientRect();
  let guard = 0;
  let uses = c.querySelectorAll("use");
  while (uses.length && guard++ < 4) {
    uses.forEach((u) => {
      const id = (u.getAttribute("href") || u.getAttribute("xlink:href") || "").replace(/^#/, "");
      const ref = id && document.getElementById(id);
      if (!ref) { u.remove(); return; }
      const g = document.createElementNS(SVGNS, "g");
      for (const a of u.attributes) if (!/^(href|xlink:href|x|y|width|height)$/.test(a.name)) g.setAttribute(a.name, a.value);
      const x = +u.getAttribute("x") || 0, y = +u.getAttribute("y") || 0;
      if (x || y) g.setAttribute("transform", `${g.getAttribute("transform") || ""} translate(${x} ${y})`.trim());
      const copy = ref.cloneNode(true);
      copy.removeAttribute("id");
      if (copy.tagName.toLowerCase() === "symbol") { const inner = document.createElementNS(SVGNS, "g"); while (copy.firstChild) inner.appendChild(copy.firstChild); g.appendChild(inner); }
      else g.appendChild(copy);
      u.replaceWith(g);
    });
    uses = c.querySelectorAll("use");
  }
  c.setAttribute("xmlns", SVGNS);
  c.setAttribute("width", String(Math.max(1, r.width)));
  c.setAttribute("height", String(Math.max(1, r.height)));
  const cs = getComputedStyle(svg);
  c.style.color = cs.color;
  return c;
}
async function canvasToPng(canvas) {
  const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
  return { data: new Uint8Array(await blob.arrayBuffer()), w: canvas.width, h: canvas.height };
}
async function svgToPng(svg, scale = 2) {
  const r = svg.getBoundingClientRect();
  const c = standaloneSvg(svg);
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(c)], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    await new Promise((ok, bad) => { img.onload = ok; img.onerror = bad; img.src = url; });
    const cv = document.createElement("canvas");
    cv.width = Math.max(1, Math.round(r.width * scale)); cv.height = Math.max(1, Math.round(r.height * scale));
    cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
    const out = await canvasToPng(cv);
    return { ...out, cssW: r.width, cssH: r.height };
  } finally { URL.revokeObjectURL(url); }
}
async function imgToPng(img) {
  const r = img.getBoundingClientRect();
  try {
    const cv = document.createElement("canvas");
    cv.width = img.naturalWidth || Math.round(r.width); cv.height = img.naturalHeight || Math.round(r.height);
    cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
    const out = await canvasToPng(cv);
    return { ...out, cssW: r.width, cssH: r.height };
  } catch { return null; }
}
async function elToPng(el) {
  const { domToCanvas } = await import(LIB.shot);
  const r = el.getBoundingClientRect();
  const cv = await domToCanvas(el, { scale: 2, backgroundColor: null });
  const out = await canvasToPng(cv);
  return { ...out, cssW: r.width, cssH: r.height };
}

/* ── PDF ─────────────────────────────────────────────────────────────────── */
async function capture(el) {
  const { domToCanvas } = await import(LIB.shot);
  return domToCanvas(el, { scale: 2, backgroundColor: "#ffffff" });
}
/* where to cut a tall picture: the lowest nearly-blank row in the bottom fifth of the page, so a line of text is not cut in two */
function cutAt(cv, from, to) {
  const ctx = cv.getContext("2d");
  const top = Math.max(from, Math.round(to - (to - from) * 0.2));
  const h = Math.max(1, Math.min(cv.height, to) - top);
  let data;
  try { data = ctx.getImageData(0, top, cv.width, h).data; } catch { return to; }
  for (let y = h - 1; y >= 0; y--) {
    let blank = true;
    for (let x = 0; x < cv.width; x += 3) { const i = (y * cv.width + x) * 4; if (data[i] + data[i + 1] + data[i + 2] < 705) { blank = false; break; } }
    if (blank) return top + y;
  }
  return to;
}
async function makePdf({ pages, root, image, name, step }) {
  const { jsPDF } = await import(LIB.pdf);
  let doc = null;
  const add = (wmm, hmm) => {
    const o = wmm > hmm ? "l" : "p";
    if (!doc) doc = new jsPDF({ unit: "mm", format: [wmm, hmm], orientation: o, compress: true });
    else doc.addPage([wmm, hmm], o);
  };
  if (image) {
    const cv = await image();
    const m = 14, cw = A4.w - 2 * m, ch = A4.h - 2 * m;
    const k = Math.min(cw / cv.width, ch / cv.height);
    add(A4.w, A4.h);
    doc.addImage(cv.toDataURL("image/png"), "PNG", (A4.w - cv.width * k) / 2, m, cv.width * k, cv.height * k);
  } else if (pages && pages.length) {
    for (let i = 0; i < pages.length; i++) {
      step(`Page ${i + 1} of ${pages.length}`);
      const el = pages[i], r = el.getBoundingClientRect();
      const cv = await capture(el);
      const wmm = r.width * PX_MM, hmm = r.height * PX_MM;
      add(wmm, hmm);
      doc.addImage(cv.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, wmm, hmm);
    }
  } else if (root) {
    step("Reading the page");
    const cv = await capture(root);
    const m = 12, cw = A4.w - 2 * m, ch = A4.h - 2 * m;
    const pxPerMm = cv.width / cw, pageH = Math.round(ch * pxPerMm);
    let y = 0, n = 0;
    while (y < cv.height - 4) {
      const end = y + pageH >= cv.height ? cv.height : cutAt(cv, y, y + pageH);
      const h = Math.max(1, end - y);
      const part = document.createElement("canvas");
      part.width = cv.width; part.height = h;
      const pc = part.getContext("2d");
      pc.fillStyle = "#fff"; pc.fillRect(0, 0, part.width, h);
      pc.drawImage(cv, 0, y, cv.width, h, 0, 0, cv.width, h);
      add(A4.w, A4.h);
      doc.addImage(part.toDataURL("image/jpeg", 0.92), "JPEG", m, m, cw, h / pxPerMm);
      step(`Page ${++n}`);
      y = end;
    }
  }
  if (!doc) throw new Error("There was nothing to put in the PDF.");
  return doc.output("blob");
}

/* ── Word ────────────────────────────────────────────────────────────────────
   The printed content read in order: a block element starts a new paragraph, text keeps its bold, italic, underline, size and
   colour, a table stays a table, and a picture (an image, a drawing, a formula, a canvas) goes in as an image at its own size. */
const BLOCK = /^(block|flex|grid|list-item|table|flow-root|table-row-group|table-header-group|table-footer-group)$/;
const SKIP_TAGS = /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|BUTTON|DIALOG|OPTION|IFRAME|VIDEO|AUDIO|LINK|META)$/;
function hex(color) {
  const m = String(color).match(/rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?/);
  if (!m || (m[4] !== undefined && +m[4] < 0.3)) return null;
  const v = [m[1], m[2], m[3]].map((x) => Math.round(+x));
  if (v.every((x) => x < 70)) return null;          // ink: leave it to the document's own black
  return v.map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase();
}
async function makeDocx({ pages, root, image, name, step }) {
  const D = await import(LIB.docx);
  const { Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType, PageBreak, BorderStyle } = D;
  const sizeFrom = pages && pages[0] ? pages[0].getBoundingClientRect() : null;
  const pageW = sizeFrom ? sizeFrom.width * PX_MM : A4.w, pageH = sizeFrom ? sizeFrom.height * PX_MM : A4.h;
  const marginMm = 15;
  const maxW = Math.round(((pageW - 2 * marginMm) / PX_MM));   // widest picture, in CSS px
  const twip = (mm) => Math.round((mm / 25.4) * 1440);

  const picture = (png) => {
    if (!png) return null;
    let w = png.cssW || png.w / 2, h = png.cssH || png.h / 2;
    if (w > maxW) { h = (h * maxW) / w; w = maxW; }
    return new ImageRun({ data: png.data, transformation: { width: Math.max(1, Math.round(w)), height: Math.max(1, Math.round(h)) } });
  };

  /* one walk of a piece of the page → a list of docx blocks */
  async function blocks(rootEl) {
    const out = [];
    let runs = [], para = {}, carry = null;
    /* a label on its own (a question number, an option letter: "1", "A", "(b)") joins the line after it, as it sits on the page */
    const flush = (end = false) => {
      const has = runs.some((r) => r.__text !== undefined ? r.__text.trim() : true);
      const words = runs.map((r) => (r.__text === undefined ? "\u0001" : r.__text)).join("").trim();
      if (has && !end && words.length <= 4 && !words.includes("\u0001") && /^[(\[]?[A-Za-z0-9ivx]{1,3}[.)\]:]?$/.test(words)) {
        carry = { runs: runs.slice(), para: { ...para } };
        runs = []; para = {};
        return;
      }
      if (carry && (has || end)) {
        runs = [...carry.runs, { run: new TextRun({ text: "  " }), __text: " " }, ...runs];
        para = { ...carry.para, ...para };
        carry = null;
      }
      if (runs.some((r) => r.__text !== undefined ? r.__text.trim() : true)) out.push(new Paragraph({ children: runs.map((r) => r.run), ...para }));
      runs = []; para = {};
    };
    const textRun = (text, cs, extra = {}) => {
      const pt = parseFloat(cs.fontSize) * 0.75;
      const color = hex(cs.color);
      const run = new TextRun({
        text,
        bold: (parseInt(cs.fontWeight, 10) || 400) >= 600,
        italics: cs.fontStyle === "italic",
        underline: /underline/.test(cs.textDecorationLine) ? {} : undefined,
        strike: /line-through/.test(cs.textDecorationLine),
        size: Math.round(Math.max(7, Math.min(30, pt || 11)) * 2),
        ...(color ? { color } : {}),
        ...extra,
      });
      runs.push({ run, __text: text });
    };
    async function walk(node, pre) {
      if (node.nodeType === Node.TEXT_NODE) {
        const parent = node.parentElement;
        if (!parent) return;
        const cs = getComputedStyle(parent);
        let t = node.nodeValue;
        if (!/pre/.test(cs.whiteSpace) && !pre) t = t.replace(/\s+/g, " ");
        if (!t || (!t.trim() && !runs.length)) return;
        if (cs.textTransform === "uppercase") t = t.toUpperCase();
        textRun(t, cs);
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const el = node, tag = el.tagName;
      if (SKIP_TAGS.test(tag)) return;
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") return;
      /* text kept only for screen readers (a formula's source beside its picture): clipped to a pixel, so not on the page */
      { const r = el.getBoundingClientRect(); if (r.width <= 1.5 && r.height <= 1.5 && (cs.overflow === "hidden" || cs.clipPath !== "none" || cs.clip !== "auto")) return; }
      /* pictures */
      if (tag === "MJX-CONTAINER" || (el.classList && (el.classList.contains("pp-note__eq") || el.classList.contains("wb-m")) && el.querySelector("svg"))) {
        const svg = el.querySelector("svg");
        if (svg) { const p = picture(await svgToPng(svg).catch(() => null)); if (p) runs.push({ run: p }); }
        return;
      }
      if (tag === "svg" || tag === "SVG") {
        const r = el.getBoundingClientRect();
        if (r.width < 14 && r.height < 14) return;           // an icon
        const p = picture(await svgToPng(el).catch(() => null));
        if (p) { if (r.width > 120) flush(); runs.push({ run: p }); if (r.width > 120) flush(); }
        return;
      }
      if (tag === "IMG") { const p = picture(await imgToPng(el)); if (p) runs.push({ run: p }); return; }
      if (tag === "CANVAS") { try { const png = await canvasToPng(el); const r = el.getBoundingClientRect(); const p = picture({ ...png, cssW: r.width, cssH: r.height }); if (p) { flush(); runs.push({ run: p }); flush(); } } catch { /* a tainted canvas */ } return; }
      if (el.getAttribute("aria-hidden") === "true") return;
      if (tag === "BR") { runs.push({ run: new TextRun({ text: "", break: 1 }), __text: " " }); return; }
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        const type = (el.getAttribute("type") || "").toLowerCase();
        if (type === "checkbox" || type === "radio") { textRun(el.checked ? "[x] " : "[ ] ", cs); return; }
        if (type === "hidden" || type === "file") return;
        const v = tag === "SELECT" ? (el.selectedOptions[0] ? el.selectedOptions[0].textContent : "") : el.value;
        if (v) textRun(v, cs);
        return;
      }
      if (tag === "TABLE") {
        flush();
        const rows = [];
        for (const tr of el.rows) {
          if (getComputedStyle(tr).display === "none") continue;
          const cells = [];
          for (const td of tr.cells) {
            if (getComputedStyle(td).display === "none") continue;
            const kids = await blocks(td);
            cells.push(new TableCell({ children: kids.length ? kids : [new Paragraph("")], columnSpan: td.colSpan > 1 ? td.colSpan : undefined }));
          }
          if (cells.length) rows.push(new TableRow({ children: cells }));
        }
        if (rows.length) out.push(new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } }));
        return;
      }
      const block = BLOCK.test(cs.display) || /^H[1-6]$/.test(tag);
      if (block) {
        flush();
        if (/^H[1-3]$/.test(tag)) para.heading = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3][+tag[1] - 1];
        if (cs.textAlign === "center") para.alignment = AlignmentType.CENTER;
        else if (cs.textAlign === "right" || cs.textAlign === "end") para.alignment = AlignmentType.RIGHT;
        if (cs.display === "list-item" || tag === "LI") {
          const ol = el.parentElement && el.parentElement.tagName === "OL";
          const idx = ol ? [...el.parentElement.children].indexOf(el) + 1 : 0;
          if (cs.listStyleType !== "none") runs.push({ run: new TextRun({ text: ol ? `${idx}. ` : "• " }), __text: "x" });
        }
      }
      /* a pseudo-element's words (labels drawn in CSS, such as an option letter) */
      const before = getComputedStyle(el, "::before").content;
      if (before && before !== "none" && before !== "normal" && /^["']/.test(before)) { const t = before.slice(1, -1).replace(/\\A/g, " "); if (t.trim()) textRun(t + " ", cs); }
      const isPre = pre || tag === "PRE";
      for (const k of el.childNodes) await walk(k, isPre);
      if (block) flush();
    }
    await walk(rootEl, false);
    flush(true);
    return out;
  }

  const children = [];
  if (image) {
    const cv = await image();
    const png = await canvasToPng(cv);
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [picture({ ...png, cssW: cv.width / 2, cssH: cv.height / 2 })] }));
  } else if (pages && pages.length) {
    for (let i = 0; i < pages.length; i++) {
      step(`Page ${i + 1} of ${pages.length}`);
      if (i) children.push(new Paragraph({ children: [new PageBreak()] }));
      children.push(...(await blocks(pages[i])));
    }
  } else if (root) {
    step("Reading the page");
    children.push(...(await blocks(root)));
  }
  if (!children.length) throw new Error("There was nothing to put in the document.");
  const doc = new Document({
    creator: "Prep Portal",
    title: name,
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [{
      properties: { page: { size: { width: twip(pageW), height: twip(pageH) }, margin: { top: twip(marginMm), bottom: twip(marginMm), left: twip(marginMm), right: twip(marginMm) } } },
      children,
    }],
  });
  return Packer.toBlob(doc);
}

/* ── Google Docs ─────────────────────────────────────────────────────────────
   A Google sign-in on a SEPARATE copy of the site's Firebase app, asking only to add files to the person's Drive (drive.file:
   it can see nothing else there). The main sign-in on the site is not touched. The token is kept in memory for its hour. */
let drive = { token: "", until: 0 };
async function driveToken() {
  if (drive.token && Date.now() < drive.until) return drive.token;
  const [{ auth }, appMod, authMod] = await Promise.all([import("/firebase-init.js"), import("firebase/app"), import("firebase/auth")]);
  const name = "pp-drive";
  const app = appMod.getApps().find((a) => a.name === name) || appMod.initializeApp(auth.app.options, name);
  const a2 = authMod.getAuth(app);
  const p = new authMod.GoogleAuthProvider();
  p.addScope("https://www.googleapis.com/auth/drive.file");
  p.setCustomParameters({ prompt: "select_account" });
  const res = await authMod.signInWithPopup(a2, p);
  const cred = authMod.GoogleAuthProvider.credentialFromResult(res);
  authMod.signOut(a2).catch(() => {});
  if (!cred || !cred.accessToken) throw new Error("Google did not give permission to add the file to Drive.");
  drive = { token: cred.accessToken, until: Date.now() + 50 * 60 * 1000 };
  return drive.token;
}
async function toGoogleDocs(blob, name, token) {
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify({ name, mimeType: "application/vnd.google-apps.document" })], { type: "application/json" }));
  form.append("file", new Blob([blob], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }));
  const r = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 401) drive = { token: "", until: 0 };
    throw new Error((d.error && d.error.message) || "Google Drive would not take the file.");
  }
  return d.webViewLink || `https://docs.google.com/document/d/${d.id}/edit`;
}

function save(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Make the file: "pdf" | "docx" | "gdocs". Used by the menu, and directly by any page that wants it. */
export async function exportDoc(kind, opts, step = () => {}) {
  const name = safeName(typeof opts.name === "function" ? opts.name() : opts.name);
  if (kind === "pdf" && opts.pdfUrl) { const a = Object.assign(document.createElement("a"), { href: opts.pdfUrl, download: "" }); document.body.appendChild(a); a.click(); a.remove(); return {}; }
  /* the Google permission comes first, while the click still counts as the person's own (a popup needs that) */
  const token = kind === "gdocs" ? await driveToken() : "";
  if (opts.before) await opts.before();
  const undo = opts.image ? () => {} : emulatePrint();
  try {
    await frames(); await wait(120);
    const pages = opts.pages ? (opts.pages() || []).filter(shown) : null;
    const root = !pages || !pages.length ? (opts.root ? opts.root() : null) : null;
    /* one long piece is laid out at the width it has on A4 paper, not the width of this window */
    let unwide = () => {};
    if (root) {
      const was = root.getAttribute("style");
      root.style.setProperty("width", opts.width || "186mm", "important");
      root.style.setProperty("max-width", opts.width || "186mm", "important");
      root.style.setProperty("min-width", "0", "important");
      unwide = () => { if (was === null) root.removeAttribute("style"); else root.setAttribute("style", was); };
      await frames();
    }
    const job = { pages, root, image: opts.image, name, step };
    try {
      if (kind === "pdf") { save(await makePdf(job), `${name}.pdf`); return {}; }
      const blob = await makeDocx(job);
      if (kind === "docx") { save(blob, `${name}.docx`); return {}; }
      step("Putting it in your Google Drive");
      return { link: await toGoogleDocs(blob, name, token) };
    } finally { unwide(); }
  } finally { undo(); }
}

/* ── the Download key and its little receipt ─────────────────────────────── */
const ICON_DL = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="4" y="17" width="16" height="4" rx="1.2" fill="var(--accent-secondary, #6aa7e0)"/><path d="M10.4 3h3.2v7.2h3.3L12 15.6 7.1 10.2h3.3z" fill="var(--accent-warning, #f0a868)"/></svg>';
const fileIcon = (band, label) => `<svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true"><path d="M7 2h12.5L26 8.5V28a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="#fffdf7" stroke="#cfc6b6" stroke-width="1.2"/><path d="M19.5 2v6.5H26z" fill="#e6dfd2"/><rect x="2.5" y="15" width="21" height="9" rx="1.5" fill="${band}"/><text x="13" y="21.8" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="6.4" font-weight="800" fill="#fff">${label}</text></svg>`;
const CHOICES = [
  { kind: "pdf", icon: fileIcon("#d6503f", "PDF"), title: "PDF", say: "The pages as they print" },
  { kind: "docx", icon: fileIcon("#2f6db5", "DOCX"), title: "Word", say: "An editable document (.docx)" },
  { kind: "gdocs", icon: fileIcon("#2f9a5a", "DOCS"), title: "Google Docs", say: "Saved to your own Google Drive as a Google Doc" },
];
const CSS = `
.pp-dl-pop.pp-receipt { position: fixed; z-index: 2147482500; width: min(21rem, 94vw); }
.pp-dl-pop .pp-receipt__paper { padding: 1rem 1rem 0.85rem; display: grid; gap: 0.3rem; font-family: var(--font-mono, "JetBrains Mono"), monospace; }
.pp-dl-pop__h { font-family: var(--font-display, "Unbounded"), sans-serif; font-size: 0.9rem; margin-bottom: 0.25rem; }
.pp-dl-pop__row { display: grid !important; grid-template-columns: 2.2rem 1fr; gap: 0.6rem; align-items: center; padding: 0.45rem 0.4rem !important; text-align: left; width: 100%; font: inherit; color: inherit; cursor: pointer; }
.pp-dl-pop__row svg { display: block; width: 2rem; height: 2rem; }
.pp-dl-pop__row b { display: block; font-size: 0.8rem; }
.pp-dl-pop__row small { display: block; font-size: 0.68rem; line-height: 1.35; color: var(--text-secondary, #6f675b); }
.pp-dl-pop__row[disabled] { opacity: 0.55; cursor: progress; }
.pp-dl-pop__msg { min-height: 1.1em; margin: 0.3rem 0 0; font-size: 0.72rem; line-height: 1.4; color: var(--text-secondary, #6f675b); }
.pp-dl-pop__msg.is-bad { color: var(--accent-danger, #c0392b); }
.pp-dl-pop__msg a { color: inherit; font-weight: 700; }
.pp-dl-key svg { display: block; }
@media print { .pp-dl-pop, .pp-dl-key { display: none !important; } }
`;
function addCss() { if (!document.getElementById("pp-dl-css")) document.head.appendChild(Object.assign(document.createElement("style"), { id: "pp-dl-css", textContent: CSS })); }
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/**
 * A Download key beside a print key. The new key copies the print key's own classes, so it wears the page's dress.
 *   label   the key's words when the print key has words (it is icon-only when the print key is)
 */
export function mountDownload(printBtn, opts = {}) {
  if (!printBtn || printBtn.dataset.ppDownload) return null;
  printBtn.dataset.ppDownload = "1";
  addCss();
  const key = document.createElement("button");
  key.type = "button";
  key.className = `${printBtn.className} pp-dl-key`.replace(/\bxm-icon-only\b/, "").trim();
  key.removeAttribute("id");
  const iconOnly = !printBtn.textContent.trim() || printBtn.querySelector(".wb-btn__name");
  if (printBtn.querySelector(".wb-btn__ico")) key.innerHTML = `<span class="wb-btn__ico" aria-hidden="true">${ICON_DL}</span><em class="wb-btn__name">Download</em>`;
  else if (iconOnly) key.innerHTML = ICON_DL;
  else key.innerHTML = `${ICON_DL} ${esc(opts.label || "Download")}`;
  key.setAttribute("aria-label", "Download as PDF, Word or Google Docs");
  key.dataset.tip = "Download: PDF, Word or Google Docs";
  key.setAttribute("aria-haspopup", "dialog");
  printBtn.after(key);

  let pop = null, busy = false;
  const shut = () => { if (busy) return; pop && pop.remove(); pop = null; document.removeEventListener("pointerdown", away, true); document.removeEventListener("keydown", onKey, true); };
  const away = (e) => { if (pop && !pop.contains(e.target) && !key.contains(e.target)) shut(); };
  /* Escape closes the menu only, not whatever it sits in (the workbook's preview closes on Escape too) */
  const onKey = (e) => { if (e.key === "Escape" && pop) { e.preventDefault(); e.stopImmediatePropagation(); shut(); key.focus(); } };
  key.addEventListener("click", async () => {
    if (pop) return shut();
    if (opts.gate && !(await opts.gate())) return;
    pop = document.createElement("div");
    pop.className = "pp-receipt pp-dl-pop";
    pop.setAttribute("role", "dialog");
    pop.setAttribute("aria-label", "Download");
    pop.innerHTML = `<div class="pp-receipt__paper"><b class="pp-dl-pop__h">Download</b>
      ${CHOICES.map((c) => `<button type="button" class="pp-btn pp-btn--ghost pp-dl-pop__row" data-kind="${c.kind}">${c.icon}<span><b>${c.title}</b><small>${c.say}</small></span></button>`).join("")}
      <p class="pp-dl-pop__msg" role="status"></p></div>`;
    document.body.appendChild(pop);
    const r = key.getBoundingClientRect();
    const below = r.bottom + 8 + pop.offsetHeight < innerHeight;
    pop.style.top = `${below ? r.bottom + 8 : Math.max(8, r.top - pop.offsetHeight - 8)}px`;
    pop.style.left = `${Math.max(8, Math.min(r.left, innerWidth - pop.offsetWidth - 8))}px`;
    const msg = pop.querySelector(".pp-dl-pop__msg");
    const rows = [...pop.querySelectorAll(".pp-dl-pop__row")];
    pop.addEventListener("click", async (e) => {
      const b = e.target.closest(".pp-dl-pop__row");
      if (!b || busy) return;
      busy = true; rows.forEach((x) => (x.disabled = true));
      msg.classList.remove("is-bad");
      const what = CHOICES.find((c) => c.kind === b.dataset.kind).title;
      msg.textContent = b.dataset.kind === "gdocs" ? "Asking Google for permission to add a file to your Drive…" : `Making the ${what} file…`;
      try {
        const res = await exportDoc(b.dataset.kind, opts, (s) => { if (msg) msg.textContent = `Making the ${what} file… ${s}`; });
        msg.innerHTML = res.link ? `It is in your Google Drive. <a href="${esc(res.link)}" target="_blank" rel="noopener">Open it in Google Docs</a>` : `Your ${what} file is downloading.`;
      } catch (err) {
        msg.classList.add("is-bad");
        const t = String((err && (err.code || err.message)) || err);
        msg.textContent = /popup-closed|cancelled-popup/.test(t) ? "The Google window was closed before permission was given." : /popup-blocked/.test(t) ? "Your browser blocked the Google window. Allow pop-ups for this site and try again." : t.slice(0, 160);
      } finally { busy = false; rows.forEach((x) => (x.disabled = false)); }
    });
    document.addEventListener("pointerdown", away, true);
    document.addEventListener("keydown", onKey, true);
    rows[0].focus();
  });
  return key;
}
