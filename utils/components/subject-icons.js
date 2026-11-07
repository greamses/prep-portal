/* ============================================================================
   SUBJECT ICONS  —  utils/components/subject-icons.js
   ----------------------------------------------------------------------------
   One icon per school subject, in the site's ONE icon language
   (utils/components/nav-icons.js): a 24x24 grid, chunky rounded shapes filled
   with var(--accent-*) tokens, #fff only where a coloured shape encloses it, no
   outlines. What tells one subject from the next is drawn loud; the rest quiet.

     subjectIcon("chemistry")   -> an <svg> string
   Unknown subjects get the stack-of-papers icon.
   ========================================================================== */

const P = "var(--accent-primary)";
const S = "var(--accent-secondary)";
const T = "var(--accent-tertiary, var(--accent-secondary))";
const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;

const ICONS = {
  // Mathematics: plus, minus, times and equals tiles
  mathematics: svg(`<rect x="2" y="2" width="9" height="9" rx="2.4" fill="${P}"/><rect x="13" y="2" width="9" height="9" rx="2.4" fill="${S}"/><rect x="2" y="13" width="9" height="9" rx="2.4" fill="${S}"/><rect x="13" y="13" width="9" height="9" rx="2.4" fill="${P}"/>
    <rect x="5.7" y="4.2" width="1.6" height="4.6" rx=".8" fill="#fff"/><rect x="4.2" y="5.7" width="4.6" height="1.6" rx=".8" fill="#fff"/>
    <rect x="15.2" y="5.7" width="4.6" height="1.6" rx=".8" fill="#fff"/>
    <rect x="4.1" y="16.7" width="4.8" height="1.6" rx=".8" fill="#fff" transform="rotate(45 6.5 17.5)"/><rect x="4.1" y="16.7" width="4.8" height="1.6" rx=".8" fill="#fff" transform="rotate(-45 6.5 17.5)"/>
    <rect x="15.2" y="15.6" width="4.6" height="1.5" rx=".75" fill="#fff"/><rect x="15.2" y="18.4" width="4.6" height="1.5" rx=".75" fill="#fff"/>`),
  // English: an open book with a big A
  english: svg(`<path d="M2 5.5c3.4-1.4 6.4-1.2 9.2.7v14.3C8.4 18.6 5.4 18.4 2 19.8z" fill="${P}"/><path d="M22 5.5c-3.4-1.4-6.4-1.2-9.2.7v14.3c2.8-1.9 5.8-2.1 9.2-.7z" fill="${S}"/>
    <path d="M5.3 15.2l1.9-6.4h1.4l1.9 6.4h-1.5l-.4-1.4H7.2l-.4 1.4zm2.2-2.6h1.5l-.75-2.6z" fill="#fff"/><rect x="14.6" y="9.4" width="5" height="1.3" rx=".65" fill="#fff"/><rect x="14.6" y="12" width="5" height="1.3" rx=".65" fill="#fff"/><rect x="14.6" y="14.6" width="3.4" height="1.3" rx=".65" fill="#fff"/>`),
  // Literature: a quill over a page
  englishlit: svg(`<rect x="3" y="4" width="13" height="17" rx="2.4" fill="${S}"/><rect x="5.6" y="8" width="7.8" height="1.4" rx=".7" fill="#fff"/><rect x="5.6" y="11" width="7.8" height="1.4" rx=".7" fill="#fff"/><rect x="5.6" y="14" width="5" height="1.4" rx=".7" fill="#fff"/>
    <path d="M21.5 2.5c-5 .8-8.4 4.6-9.6 10.4l1.6.6c1.5-2 3.6-3.6 6.4-4.6-1.6-.4-2.6-.2-3.8.2 1.6-1.6 3.4-2.6 5.4-3-1.4-.4-2.4-.4-3.4-.2 1.2-1.4 2.4-2.4 3.4-3.4z" fill="${P}"/>`),
  // Biology: a leaf with its veins
  biology: svg(`<path d="M20.5 3.5C11 3.2 4.2 7.6 4 15.4c0 2 .5 3.6 1.4 5.1 1.4-3.6 4.2-6.6 8.4-8.6-3.4 2.4-5.8 5.4-7 9 1.3.6 2.8.9 4.4.9 7.8-.2 10.4-8.4 9.3-18.3z" fill="${P}"/><circle cx="16.5" cy="7.5" r="1.4" fill="#fff"/>`),
  // Chemistry: a flask with bubbling liquid
  chemistry: svg(`<path d="M9 2.5h6v1.8h-.8v4.9l5.6 9.4c.9 1.6-.2 3.4-2 3.4H6.2c-1.8 0-2.9-1.8-2-3.4l5.6-9.4V4.3H9z" fill="${S}"/><path d="M6.6 15.6h10.8l1.4 2.4c.4.7-.1 1.6-.9 1.6H6.1c-.8 0-1.3-.9-.9-1.6z" fill="${P}"/><circle cx="10.4" cy="12.6" r="1.1" fill="#fff"/><circle cx="13.2" cy="10.6" r=".8" fill="#fff"/>`),
  // Physics: an atom
  physics: svg(`<ellipse cx="12" cy="12" rx="10" ry="4.2" fill="none" stroke="${S}" stroke-width="2.2"/><ellipse cx="12" cy="12" rx="10" ry="4.2" fill="none" stroke="${S}" stroke-width="2.2" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.2" fill="none" stroke="${S}" stroke-width="2.2" transform="rotate(-60 12 12)"/><circle cx="12" cy="12" r="3" fill="${P}"/>`),
  // Economics: rising bars and a coin
  economics: svg(`<rect x="2.5" y="13" width="4.4" height="8.5" rx="1.4" fill="${S}"/><rect x="8.6" y="9" width="4.4" height="12.5" rx="1.4" fill="${S}"/><rect x="14.7" y="5" width="4.4" height="16.5" rx="1.4" fill="${S}"/><circle cx="18" cy="6" r="4" fill="${P}"/><rect x="17.3" y="3.9" width="1.4" height="4.2" rx=".7" fill="#fff"/>`),
  // Commerce: a shopping bag
  commerce: svg(`<path d="M8 8V6.6a4 4 0 0 1 8 0V8" fill="none" stroke="${S}" stroke-width="2"/><path d="M4.2 8h15.6l-1.2 12a2 2 0 0 1-2 1.8H7.4a2 2 0 0 1-2-1.8z" fill="${P}"/><circle cx="9" cy="11.4" r="1.2" fill="#fff"/><circle cx="15" cy="11.4" r="1.2" fill="#fff"/>`),
  // Accounting: a ledger with a total line
  accounting: svg(`<rect x="4" y="2.5" width="16" height="19" rx="2.6" fill="${S}"/><rect x="7" y="6" width="10" height="1.6" rx=".8" fill="#fff"/><rect x="7" y="9.4" width="10" height="1.6" rx=".8" fill="#fff"/><rect x="7" y="12.8" width="10" height="1.6" rx=".8" fill="#fff"/><rect x="7" y="16.4" width="10" height="2.6" rx="1.3" fill="${P}"/>`),
  // Government: a building with pillars
  government: svg(`<path d="M12 2.5l9.5 5H2.5z" fill="${P}"/><rect x="3.5" y="8.6" width="17" height="1.8" rx=".9" fill="${P}"/><rect x="5" y="11.2" width="2.4" height="7.4" rx="1" fill="${S}"/><rect x="10.8" y="11.2" width="2.4" height="7.4" rx="1" fill="${S}"/><rect x="16.6" y="11.2" width="2.4" height="7.4" rx="1" fill="${S}"/><rect x="2.5" y="19.4" width="19" height="2.2" rx="1.1" fill="${P}"/>`),
  // Civic education: two people and a shield
  civiledu: svg(`<path d="M12 2.5l8 3v6.2c0 4.8-3.4 8.4-8 9.8-4.6-1.4-8-5-8-9.8V5.5z" fill="${S}"/><circle cx="12" cy="9.4" r="2.4" fill="#fff"/><path d="M7.8 16.6c.8-2.4 2.4-3.6 4.2-3.6s3.4 1.2 4.2 3.6z" fill="#fff"/>`),
  // Geography: a globe
  geography: svg(`<circle cx="12" cy="12" r="9.5" fill="${S}"/><path d="M8.4 4.4c1.4 1.4 1.2 3.2-.4 4.2-1.4.8-1.6 2.4-.2 3.6 1.2 1 1 2.8-.4 3.6-1.2.6-2 1.6-2 2.8A9.5 9.5 0 0 1 8.4 4.4zM16 6.2c-1.4.4-2.2 1.6-1.6 3 .6 1.2 2.2 1.4 3.2.4.8-.8 2-.8 2.8 0A9.5 9.5 0 0 0 16 6.2zM15.8 14c-1.6 0-2.6 1.4-2 2.8.4 1 .2 2.2-.6 3.2a9.4 9.4 0 0 0 6.6-4.8c-1.2-.8-2.6-1.2-4-1.2z" fill="${P}"/>`),
  // History: a scroll
  history: svg(`<rect x="5" y="4" width="14" height="16" rx="2" fill="${S}"/><rect x="3" y="2.5" width="18" height="3.6" rx="1.8" fill="${P}"/><rect x="3" y="17.9" width="18" height="3.6" rx="1.8" fill="${P}"/><rect x="8" y="9" width="8" height="1.5" rx=".75" fill="#fff"/><rect x="8" y="12.4" width="6" height="1.5" rx=".75" fill="#fff"/>`),
  // Christian religious studies: a book with a cross
  crk: svg(`<rect x="4" y="2.5" width="16" height="19" rx="2.6" fill="${S}"/><rect x="11" y="6" width="2" height="11" rx="1" fill="#fff"/><rect x="7.6" y="9" width="8.8" height="2" rx="1" fill="#fff"/><rect x="4" y="18" width="16" height="3.5" rx="1.6" fill="${P}"/>`),
  // Islamic religious studies: a book with a crescent
  irk: svg(`<rect x="4" y="2.5" width="16" height="19" rx="2.6" fill="${S}"/><path d="M13.6 6.6a4.6 4.6 0 1 0 0 7.8 3.8 3.8 0 1 1 0-7.8z" fill="#fff"/><rect x="4" y="18" width="16" height="3.5" rx="1.6" fill="${P}"/>`),
  // Insurance: an umbrella
  insurance: svg(`<path d="M12 3C6.6 3 2.6 6.8 2.5 12h19C21.4 6.8 17.4 3 12 3z" fill="${P}"/><rect x="11" y="11.5" width="2" height="7.5" rx="1" fill="${S}"/><path d="M13 18.4a2.4 2.4 0 0 1-4.8 0" fill="none" stroke="${S}" stroke-width="2" stroke-linecap="round"/>`),
  // Current affairs: a newspaper
  currentaffairs: svg(`<rect x="2.5" y="4" width="16" height="16" rx="2.4" fill="${S}"/><rect x="17" y="8" width="4.5" height="12" rx="2" fill="${P}"/><rect x="5" y="7" width="11" height="4" rx="1" fill="#fff"/><rect x="5" y="13" width="11" height="1.5" rx=".75" fill="#fff"/><rect x="5" y="16" width="7" height="1.5" rx=".75" fill="#fff"/>`),
  // General studies: a light bulb
  generalstudies: svg(`<path d="M12 2.5a7 7 0 0 0-4.2 12.6c.7.6 1.2 1.4 1.2 2.4h6c0-1 .5-1.8 1.2-2.4A7 7 0 0 0 12 2.5z" fill="${P}"/><rect x="9" y="18.4" width="6" height="1.6" rx=".8" fill="${S}"/><rect x="10" y="20.6" width="4" height="1.6" rx=".8" fill="${S}"/><path d="M10 9.6a2.4 2.4 0 0 1 2-2.2" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`),
  // The teacher's own questions: a page with a pencil
  mine: svg(`<rect x="3" y="2.5" width="14" height="19" rx="2.6" fill="${S}"/><rect x="6" y="7" width="8" height="1.5" rx=".75" fill="#fff"/><rect x="6" y="10.4" width="8" height="1.5" rx=".75" fill="#fff"/><rect x="6" y="13.8" width="5" height="1.5" rx=".75" fill="#fff"/><path d="M20.2 9.4l1.4 1.4-7.4 7.4-2.4.9.9-2.4z" fill="${P}"/>`),
  // Competitions: a trophy
  competition: svg(`<path d="M7 3h10v5.4a5 5 0 0 1-10 0z" fill="${P}"/><path d="M7 5H3.6c0 3 1.4 4.8 3.6 5M17 5h3.4c0 3-1.4 4.8-3.6 5" fill="none" stroke="${P}" stroke-width="1.8"/><rect x="10.8" y="13" width="2.4" height="4" fill="${S}"/><rect x="7" y="17" width="10" height="4.5" rx="1.6" fill="${S}"/>`),
  // anything else: a stack of papers
  general: svg(`<rect x="6" y="2.5" width="14" height="17" rx="2.4" fill="${S}"/><rect x="3.5" y="5" width="14" height="16.5" rx="2.4" fill="${P}"/><rect x="6.5" y="9.4" width="8" height="1.5" rx=".75" fill="#fff"/><rect x="6.5" y="12.8" width="8" height="1.5" rx=".75" fill="#fff"/><rect x="6.5" y="16.2" width="5" height="1.5" rx=".75" fill="#fff"/>`),
};
const SAME = { englishlanguage: "english", literature: "englishlit", maths: "mathematics", math: "mathematics", civiceducation: "civiledu", christianreligiousstudies: "crk", islamicreligiousstudies: "irk", financialaccounting: "accounting" };

/** The icon for a subject key ("chemistry", "englishlanguage", …). */
export function subjectIcon(key) {
  const k = String(key || "").toLowerCase().replace(/[^a-z]/g, "");
  return ICONS[SAME[k] || k] || ICONS.general;
}
