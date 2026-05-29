// ============================================================================
// COVER COMPONENT - the front & back book covers, in one place so they are
// easy to update. Built to scale: everything sizes in container-query units
// (see cover.css), so the SAME markup renders full-size inside the flipbook
// AND shrunk down on the bookshelf - just drop it in a smaller box.
//
// Art: a full-bleed cartoon scene (inline SVG + the detective character) with
// a gradient + mix-blend overlay so the title sits cleanly on top, a halftone
// pattern backdrop behind the title, a spiral binding down the left edge, and
// the Prep Portal logo + name below. To use your OWN cartoon JPEG (e.g. from
// pngtree), set media.coverArt to its URL or drop a file at
// images/cover-art.jpg and point media.coverArt at "./images/cover-art.jpg".
// ============================================================================

const LOGO = "/icon.svg";

// Full-bleed cartoon backdrop (sky, hills, sun, clouds, floating letters &
// punctuation, an open book). preserveAspectRatio "slice" makes it cover.
const SCENE = `
<svg class="gp-cover__scene-svg" viewBox="0 0 400 560" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="gcSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#38b6ff"/><stop offset="0.55" stop-color="#7fd3ff"/><stop offset="1" stop-color="#d6f3ff"/>
    </linearGradient>
    <linearGradient id="gcHill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5fd16a"/><stop offset="1" stop-color="#2fa84a"/>
    </linearGradient>
    <linearGradient id="gcBook" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff7e8"/><stop offset="1" stop-color="#ffe0a8"/>
    </linearGradient>
  </defs>
  <rect width="400" height="560" fill="url(#gcSky)"/>
  <circle cx="330" cy="78" r="46" fill="#ffe14d"/>
  <g stroke="#ffe14d" stroke-width="5" stroke-linecap="round" opacity="0.85">
    <path d="M330 12v-2"/><path d="M386 78h2"/><path d="M372 36l3-3"/><path d="M372 120l3 3"/>
  </g>
  <g fill="#ffffff" opacity="0.92">
    <ellipse cx="80" cy="120" rx="40" ry="20"/><ellipse cx="120" cy="108" rx="30" ry="18"/>
    <ellipse cx="300" cy="180" rx="34" ry="17"/><ellipse cx="262" cy="170" rx="24" ry="14"/>
  </g>
  <path d="M0 430C70 392 150 392 210 416C270 440 340 432 400 408V560H0Z" fill="url(#gcHill)"/>
  <path d="M0 470C90 448 150 470 230 470C300 470 350 452 400 462V560H0Z" fill="#249a40"/>
  <!-- floating letters + punctuation -->
  <g font-family="'Unbounded',sans-serif" font-weight="900" opacity="0.9">
    <text x="58" y="250" font-size="44" fill="#ff5d73" transform="rotate(-12 58 250)">A</text>
    <text x="320" y="300" font-size="40" fill="#ffd23f" transform="rotate(10 320 300)">B</text>
    <text x="40" y="360" font-size="38" fill="#7c5cff" transform="rotate(8 40 360)">?</text>
    <text x="350" y="430" font-size="40" fill="#ff8a3d" transform="rotate(-10 350 430)">!</text>
    <text x="300" y="120" font-size="30" fill="#28c0b0" transform="rotate(-8 300 120)">,</text>
  </g>
  <g opacity="0.85" fill="#fff">
    <path d="M150 70l3 8 8 0-6 6 2 9-7-5-7 5 2-9-6-6 8 0z"/>
    <path d="M250 60l2 6 6 0-5 4 2 7-5-4-5 4 2-7-5-4 6 0z"/>
  </g>
  <!-- open book on the hill -->
  <g transform="translate(200 446)">
    <path d="M-78 6C-52-12-18-12 0 0 18-12 52-12 78 6L78 56C52 40 18 40 0 52-18 40-52 40-78 56Z" fill="url(#gcBook)" stroke="#9a6a2a" stroke-width="3"/>
    <path d="M0 0V52" stroke="#9a6a2a" stroke-width="3"/>
    <g stroke="#c79a55" stroke-width="2" opacity="0.8">
      <path d="M-66 14h52"/><path d="M-66 24h52"/><path d="M-66 34h48"/>
      <path d="M14 14h52"/><path d="M14 24h52"/><path d="M18 34h48"/>
    </g>
  </g>
</svg>`;

function artHTML(book) {
  const src = book?.media?.coverArt;
  if (src) return `<img class="gp-cover__photo" src="${src}" alt="" loading="lazy" onerror="this.style.display='none'">`;
  return SCENE;
}

export function frontCoverInner(book = {}) {
  const m = book.meta || { title: "Grammar Police", subtitle: "& Punctuation Patrol" };
  return `
    <div class="gp-cover__art">${artHTML(book)}</div>
    <div class="gp-cover__overlay" aria-hidden="true"></div>
    <div class="gp-spiral" aria-hidden="true"><span></span></div>
    <div class="gp-cover__content">
      <span class="gp-cover__edition">Student Edition</span>
      <div class="gp-cover__titlebox">
        <span class="gp-cover__halftone" aria-hidden="true"></span>
        <h1 class="gp-cover__title gp-3d">${m.title}</h1>
        <span class="gp-cover__sub">${m.subtitle}</span>
      </div>
      <div class="gp-cover__brandrow">
        <img class="gp-cover__logo" src="${LOGO}" alt="Prep Portal logo">
        <span class="gp-cover__brand">Prep&nbsp;Portal</span>
      </div>
    </div>
    <span class="gp-cover__vol">Vol.&nbsp;1</span>`;
}

export function backCoverInner(book = {}) {
  void book;
  return `
    <div class="gp-cover__art gp-cover__art--dim">${SCENE}</div>
    <div class="gp-cover__overlay gp-cover__overlay--back" aria-hidden="true"></div>
    <div class="gp-spiral gp-spiral--right" aria-hidden="true"><span></span></div>
    <div class="gp-back__content">
      <span class="gp-cover__halftone" aria-hidden="true"></span>
      <p class="gp-back__msg gp-3d">Keep practising.<br>Words matter.</p>
      <a class="gp-back__cta" href="/writing/">Try the Writing Assistant &rarr;</a>
      <div class="gp-cover__brandrow">
        <img class="gp-cover__logo" src="${LOGO}" alt="Prep Portal logo">
        <span class="gp-cover__brand">Prep&nbsp;Portal &middot; prepportal.com</span>
      </div>
    </div>`;
}
