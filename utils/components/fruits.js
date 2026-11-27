/* ============================================================================
   PREP PORTAL — OUR OWN FRUIT SET  (twenty fruits, no emoji)
   ----------------------------------------------------------------------------
   Drawn for the fruit-puzzle activities (picture sums in the solvemoji style:
   each fruit stands for a number, the child works out which), and free for
   any page that wants a fruit.

   The drawing language is the nav's (nav-icons.js): a 24×24 grid, chunky
   rounded shapes, colour does the work, white only as a highlight enclosed by
   a coloured shape, NO outlines.

   ONE DIFFERENCE FROM THE ICON SET, ON PURPOSE: the fills are the fruits' OWN
   colours, not theme tokens. A fruit here is puzzle CONTENT, not chrome — the
   same rule as a manipulative piece being painted its own colour. A banana
   that turned blue in dark mode would be a different fruit.

   THE RULE THAT DECIDED EVERY DRAWING: in a puzzle the child must tell any two
   of these apart at a glance, so no two share BOTH a silhouette and a colour.
   Round fruits that would blur together are cut open instead (kiwi, coconut,
   guava, agbalumo, avocado, pawpaw, watermelon), and each cut face has its own
   inside: green with seeds, white, pink, a star, a stone, black seeds, a wedge.

   Usage:
     import { FRUITS, fruitSvg } from "/utils/components/fruits.js";
     el.innerHTML = fruitSvg("mango");          // bare <svg>, size it in CSS
     FRUITS.map((f) => f.name);                  // ids + names in a fixed order
   ========================================================================== */

const wrap = (paths, label) =>
  `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}">${paths}</svg>`;

/* A short bar, drawn as a filled rounded rect so it is still a shape, not a
   stroke (stems, cherry stalks). */
function stalk(x1, y1, x2, y2, w, fill) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  return `<rect x="${(cx - len / 2).toFixed(2)}" y="${(cy - w / 2).toFixed(2)}" width="${len.toFixed(2)}" height="${w}" rx="${w / 2}" fill="${fill}" transform="rotate(${ang.toFixed(1)} ${cx.toFixed(2)} ${cy.toFixed(2)})"/>`;
}

/* A shine: the white highlight every fruit gets on its upper left. */
const shine = (cx, cy, rx, ry, rot = 0, o = 0.6) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${o}" transform="rotate(${rot} ${cx} ${cy})"/>`;

/* n points spaced round a ring — seeds on a cut face. */
function ring(n, r, cx, cy, draw, start = -90) {
  let out = "";
  for (let i = 0; i < n; i++) {
    const a = ((start + (360 / n) * i) * Math.PI) / 180;
    out += draw(cx + r * Math.cos(a), cy + r * Math.sin(a), (start + (360 / n) * i) + 90);
  }
  return out;
}

/* A five-pointed star polygon (the agbalumo's seed chambers). */
function star(cx, cy, ro, ri, fill) {
  let pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? ri : ro;
    const a = ((-90 + 36 * i) * Math.PI) / 180;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return `<polygon points="${pts.join(" ")}" fill="${fill}" stroke="${fill}" stroke-width="1.2" stroke-linejoin="round"/>`;
}

const LEAF = "#5bb25a";
const LEAF_DARK = "#3e8f43";
const STEM = "#8a5a2b";

/* ── the twenty ─────────────────────────────────────────────────────────── */

const DRAW = {
  apple: () =>
    `<path d="M12 7.6c-1.4-1-3.1-1.5-4.7-1-2.8.8-4 3.6-3.6 6.6.5 3.9 3.1 7.6 5.7 7.6.9 0 1.6-.4 2.6-.4s1.7.4 2.6.4c2.6 0 5.2-3.7 5.7-7.6.4-3-.8-5.8-3.6-6.6-1.6-.5-3.3 0-4.7 1z" fill="#e8453c"/>` +
    stalk(11.6, 7.4, 12.4, 3, 1.5, STEM) +
    `<path d="M12.8 5.6c.5-2.2 2.5-3.4 4.9-3.1-.5 2.3-2.6 3.5-4.9 3.1z" fill="${LEAF}"/>` +
    shine(7.6, 11.2, 1.1, 2, 20),

  banana: () =>
    `<path d="M4.2 6.2c-.8 5.9 3 12.1 9.6 13.4 3 .6 5.6 0 7.1-1.4.3-.3.1-.9-.4-.8-5.5.2-10.7-3.5-12.7-9.8-.4-1.3-1.5-1.9-3.6-1.4z" fill="#f7c531"/>` +
    `<path d="M4.4 6.8c3.4-.4 4.6 1 5.2 2.6 1.8 5.2 6 8.2 10.6 8.8-1.4.9-3.6 1.3-6.2.8C8.2 17.6 4.6 12.2 4.4 6.8z" fill="#e3a91c"/>` +
    `<path d="M3.5 7l.1-2.7c0-.7 1-.8 1.3-.2l.9 2.5z" fill="${STEM}"/>` +
    `<circle cx="20.6" cy="17.9" r=".9" fill="#5e3c1f"/>` +
    `<path d="M5.8 8.4c.6 3.4 2.4 6.2 5.2 8-.1.4-.4.5-.8.4C7.6 15.2 5.6 12.2 5 8.6c0-.5.7-.6.8-.2z" fill="#fff" opacity=".55"/>`,

  orange: () =>
    `<circle cx="12" cy="13.2" r="8.2" fill="#f7931e"/>` +
    [[8, 16.4], [11, 18.6], [15.4, 17], [16.8, 12.4], [13.6, 9.6], [10, 12.4], [13, 14.6], [7.4, 13.2]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".42" fill="#d97810"/>`).join("") +
    `<circle cx="12" cy="5.4" r="1" fill="${LEAF_DARK}"/>` +
    `<path d="M12.4 5.3c1-1.9 3.1-2.7 5.1-2-.8 2-3 2.9-5.1 2z" fill="${LEAF}"/>` +
    shine(8.4, 10, 1.4, 2.1, 30),

  lemon: () =>
    `<g transform="rotate(-35 12 12)">` +
    `<ellipse cx="3.8" cy="12" rx="1.6" ry="1.1" fill="#f3d93a"/>` +
    `<ellipse cx="20.2" cy="12" rx="1.6" ry="1.1" fill="#f3d93a"/>` +
    `<ellipse cx="12" cy="12" rx="8" ry="5.9" fill="#fbe55a"/>` +
    `<ellipse cx="12" cy="13.6" rx="6.4" ry="3.6" fill="#f3d93a"/>` +
    shine(9.2, 9.4, 2.8, 1, 0, 0.7) +
    `</g>`,

  strawberry: () =>
    `<path d="M12 6.6c3.9-1 8.2.3 8.2 4.2 0 4.7-4.7 10.1-8.2 11-3.5-.9-8.2-6.3-8.2-11 0-3.9 4.3-5.2 8.2-4.2z" fill="#e5383b"/>` +
    [[8, 11.2], [12, 10.6], [16, 11.2], [10, 14.2], [14, 14.2], [12, 17.4], [6.6, 13.6], [17.4, 13.6]]
      .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx=".45" ry=".7" fill="#ffe08a"/>`).join("") +
    `<path d="M12 8l-2.4-1.3-3.2.5 2-1.8-1.3-2 2.7 1L12 2.6l2.2 1.8 2.7-1-1.3 2 2 1.8-3.2-.5z" fill="#47a24a"/>` +
    shine(7.4, 9.6, .9, 1.5, 40, .5),

  cherries: () =>
    stalk(7.8, 13, 12.6, 3.6, 1.2, "#5a9a3c") +
    stalk(16.4, 13.4, 12.6, 3.6, 1.2, "#5a9a3c") +
    `<path d="M12.8 3.8c1.7-1.7 4.2-1.8 6-.5-1.6 1.7-4.1 1.9-6 .5z" fill="${LEAF}"/>` +
    `<circle cx="7.6" cy="16.6" r="4" fill="#c8102e"/>` +
    `<circle cx="16.6" cy="17.2" r="4" fill="#a90d27"/>` +
    `<circle cx="6.1" cy="15.1" r="1" fill="#fff" opacity=".6"/>` +
    `<circle cx="15.1" cy="15.7" r="1" fill="#fff" opacity=".5"/>`,

  grapes: () =>
    stalk(12, 6.2, 12.8, 2.6, 1.3, STEM) +
    `<path d="M12.6 4.6c1.4-2.1 3.9-2.7 6.1-1.7-1.3 2.1-3.9 2.8-6.1 1.7z" fill="${LEAF}"/>` +
    [[7.2, 8.6, "#8e4fb5"], [12, 8.2, "#7b3fa0"], [16.8, 8.6, "#8e4fb5"],
     [9.6, 12.6, "#7b3fa0"], [14.4, 12.6, "#6c3590"],
     [12, 16.6, "#8e4fb5"]]
      .map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="${c}"/>`).join("") +
    `<circle cx="12" cy="20.2" r="2.1" fill="#6c3590"/>` +
    [[7.2, 8.6], [12, 8.2], [16.8, 8.6], [9.6, 12.6], [14.4, 12.6], [12, 16.6]]
      .map(([x, y]) => `<circle cx="${x - .9}" cy="${y - .9}" r=".6" fill="#fff" opacity=".55"/>`).join(""),

  watermelon: () =>
    `<path d="M2.4 7.6h19.2a9.6 9.6 0 0 1-19.2 0z" fill="#3c9a3c"/>` +
    `<path d="M3.6 7.6h16.8a8.4 8.4 0 0 1-16.8 0z" fill="#dff3b8"/>` +
    `<path d="M4.6 7.6h14.8a7.4 7.4 0 0 1-14.8 0z" fill="#f2545b"/>` +
    [[8.2, 10, -30], [12, 11.6, 0], [15.8, 10, 30], [10, 13.8, -15], [14, 13.8, 15]]
      .map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx=".55" ry=".9" fill="#2b2522" transform="rotate(${r} ${x} ${y})"/>`).join(""),

  pineapple: () =>
    `<path d="M11.6 9C9.6 7.4 7.4 6.8 5.4 7.4c1.7 1.1 3.6 1.8 6.2 1.6z" fill="${LEAF_DARK}"/>` +
    `<path d="M12.4 9c2-1.6 4.2-2.2 6.2-1.6-1.7 1.1-3.6 1.8-6.2 1.6z" fill="${LEAF_DARK}"/>` +
    `<path d="M12 9.2L8.8 4l2.2.9L12 1.4l1 3.5 2.2-.9z" fill="#4caf50"/>` +
    `<ellipse cx="12" cy="15.4" rx="5.8" ry="6.6" fill="#f2b53b"/>` +
    [[9.4, 12], [12, 12], [14.6, 12], [10.7, 14.6], [13.3, 14.6], [8.2, 14.6], [15.8, 14.6],
     [9.4, 17.2], [12, 17.2], [14.6, 17.2], [10.7, 19.7], [13.3, 19.7]]
      .map(([x, y]) => `<path d="M${x} ${y - .8}l.8.8-.8.8-.8-.8z" fill="#c98316"/>`).join("") +
    shine(8.6, 12.6, .8, 1.8, 15, .45),

  mango: () =>
    `<path d="M6.4 19c-2.9-2.9-2.6-8.2.8-11.6C10.6 4 16.5 3.4 19.1 6c2.5 2.5 1.7 7.1-1.2 10.4C14.7 20 9.2 21.8 6.4 19z" fill="#f9a73e"/>` +
    `<path d="M7.2 7.4c2-2 4.6-3.2 7.2-3.3-2.4 2.2-4.2 5-5.2 8.4-.8 2.6-1.2 5-1 7.4-.4-.1-1-.4-1.8-.9-2.9-2.9-2.6-8.2.8-11.6z" fill="#8cc63f"/>` +
    `<ellipse cx="15.2" cy="10.4" rx="2.8" ry="3.6" fill="#f2603a" opacity=".85" transform="rotate(35 15.2 10.4)"/>` +
    stalk(17.8, 5.6, 19.4, 3.8, 1.2, STEM) +
    `<path d="M19 4.4c.3-2 1.7-3.3 3.7-3.4-.3 2-1.7 3.3-3.7 3.4z" fill="${LEAF}"/>` +
    shine(8.4, 12.6, .9, 2.2, 30, .55),

  pear: () =>
    `<path d="M12 4.8c1.6 0 2.4 1.4 2.6 3.2.2 1.8 1.4 2.6 2.7 4.1 1.6 1.9 2 4.4 1 6.4-1.2 2.4-3.7 3.4-6.3 3.4s-5.1-1-6.3-3.4c-1-2-.6-4.5 1-6.4 1.3-1.5 2.5-2.3 2.7-4.1.2-1.8 1-3.2 2.6-3.2z" fill="#b5cf3c"/>` +
    `<path d="M15 21.3c2-.5 3.4-1.6 4.3-2.8 1-2 .6-4.5-1-6.4-.6-.7-1.2-1.2-1.7-1.8.6 1.3 1 2.8.9 4.4-.1 2.8-1.1 5-2.5 6.6z" fill="#9dba2c"/>` +
    stalk(12, 5, 13, 1.8, 1.3, STEM) +
    `<path d="M12.9 3.4c1.2-1.4 3.2-1.9 4.9-1.1-1.2 1.4-3.2 1.9-4.9 1.1z" fill="${LEAF}"/>` +
    shine(8.8, 15.4, 1.1, 2.3, 10),

  peach: () =>
    `<circle cx="12" cy="13.6" r="7.9" fill="#ffb27a"/>` +
    `<ellipse cx="14.6" cy="14.4" rx="4.2" ry="4.8" fill="#ff8166" opacity=".8"/>` +
    `<path d="M12 6.2c-1.9 2.6-2.2 6.4-.9 9.8-.1-3.4.2-6.6.9-9.8z" fill="#e56d55"/>` +
    `<path d="M12 6.2c-.6-2.3-2.7-3.5-5-3.3.6 2.3 2.7 3.5 5 3.3z" fill="${LEAF}"/>` +
    `<path d="M12 6.2c.9-1.9 2.8-2.7 4.6-2.2-.8 1.9-2.7 2.7-4.6 2.2z" fill="${LEAF_DARK}"/>` +
    shine(7.8, 11, 1.2, 2, 25),

  coconut: () =>
    `<circle cx="12" cy="12" r="9.2" fill="#7a4a26"/>` +
    ring(14, 8.4, 12, 12, (x, y, r) => `<rect x="${(x - .2).toFixed(2)}" y="${(y - .55).toFixed(2)}" width=".4" height="1.1" rx=".2" fill="#5c3518" transform="rotate(${r.toFixed(0)} ${x.toFixed(2)} ${y.toFixed(2)})"/>`) +
    `<circle cx="12" cy="12" r="7.2" fill="#fffaf0"/>` +
    `<circle cx="12" cy="12" r="5.2" fill="#efe4c8"/>` +
    shine(9.6, 9.4, 1.4, .8, -40, .9),

  kiwi: () =>
    `<circle cx="12" cy="12" r="9.2" fill="#8b6b3a"/>` +
    `<circle cx="12" cy="12" r="7.9" fill="#8cc63f"/>` +
    `<circle cx="12" cy="12" r="5.6" fill="#a9d65a"/>` +
    `<circle cx="12" cy="12" r="2.6" fill="#eef7d2"/>` +
    ring(10, 4.1, 12, 12, (x, y, r) => `<ellipse cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" rx=".38" ry=".75" fill="#2b2522" transform="rotate(${r.toFixed(0)} ${x.toFixed(2)} ${y.toFixed(2)})"/>`),

  avocado: () =>
    `<path d="M12 2.6c2.6 0 3.8 2.4 4.4 5 .5 2.2 2.4 3.6 2.8 6.4.6 4.4-2.8 7.6-7.2 7.6S4.2 18.4 4.8 14c.4-2.8 2.3-4.2 2.8-6.4.6-2.6 1.8-5 4.4-5z" fill="#3d6b2a"/>` +
    `<path d="M12 2.6c2.6 0 3.8 2.4 4.4 5 .5 2.2 2.4 3.6 2.8 6.4.6 4.4-2.8 7.6-7.2 7.6S4.2 18.4 4.8 14c.4-2.8 2.3-4.2 2.8-6.4.6-2.6 1.8-5 4.4-5z" fill="#b9d25a" transform="translate(12 13.4) scale(.84) translate(-12 -13.4)"/>` +
    `<path d="M12 2.6c2.6 0 3.8 2.4 4.4 5 .5 2.2 2.4 3.6 2.8 6.4.6 4.4-2.8 7.6-7.2 7.6S4.2 18.4 4.8 14c.4-2.8 2.3-4.2 2.8-6.4.6-2.6 1.8-5 4.4-5z" fill="#e3ec9c" transform="translate(12 13.8) scale(.7) translate(-12 -13.8)"/>` +
    `<circle cx="12" cy="15" r="3.5" fill="#8a5a2b"/>` +
    `<circle cx="10.9" cy="13.9" r="1" fill="#fff" opacity=".45"/>`,

  pawpaw: () =>
    `<g transform="rotate(35 12 12)">` +
    `<ellipse cx="12" cy="12" rx="9.6" ry="5.8" fill="#8fbf3a"/>` +
    `<ellipse cx="12" cy="12" rx="8.5" ry="4.8" fill="#ff8a3d"/>` +
    `<ellipse cx="12.6" cy="12" rx="4.8" ry="2.3" fill="#e2582a"/>` +
    [[9, 11.4], [10.4, 12.7], [11.6, 11.2], [12.8, 12.8], [14, 11.3], [15.2, 12.5], [16.1, 11.6]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".75" fill="#2b2522"/>`).join("") +
    `<ellipse cx="3.1" cy="12" rx="1" ry=".7" fill="${STEM}"/>` +
    `</g>`,

  guava: () =>
    `<ellipse cx="12" cy="12.6" rx="8" ry="8.8" fill="#8fc441"/>` +
    `<ellipse cx="12" cy="12.6" rx="6.7" ry="7.5" fill="#ff8fa3"/>` +
    `<ellipse cx="12" cy="12.6" rx="3.9" ry="4.4" fill="#ffc6cf"/>` +
    [[12, 9.6], [10.2, 11], [13.8, 11], [10.4, 13.6], [13.6, 13.6], [12, 15.4], [12, 12.4]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".55" fill="#fff4d6"/>`).join("") +
    `<path d="M10.8 3.6h2.4l-.4 1.6h-1.6z" fill="#5f8a2a"/>`,

  pomegranate: () =>
    `<path d="M9 7l-.8-3.6 2.3 1.6L12 2.8l1.5 2.2 2.3-1.6L15 7z" fill="#a52530"/>` +
    `<circle cx="12" cy="13.6" r="8" fill="#c8303c"/>` +
    `<path d="M15.6 20.8c2.6-1.3 4.4-4 4.4-7.2 0-1.2-.3-2.4-.8-3.5.2 4.6-1.4 8.4-3.6 10.7z" fill="#a52530"/>` +
    shine(8.2, 10.6, 1.3, 2.3, 30),

  /* One colour only — a cashew apple is red OR yellow, never both — and the
     nut hangs from the bottom as an upright kidney, its hollow to one side,
     the way it grows. */
  cashew: () =>
    stalk(12, 3.4, 12.3, 1.1, 1.2, STEM) +
    `<path d="M9.8 2.6h4.4c.8 0 1.4.5 1.6 1.2l2.4 6.6c.8 2.5-.3 4.9-2.8 5.5-1.1.3-2.3.4-3.4.4s-2.3-.1-3.4-.4c-2.5-.6-3.6-3-2.8-5.5l2.4-6.6c.2-.7.8-1.2 1.6-1.2z" fill="#e8432e"/>` +
    `<path d="M15 15.8c1.8-.8 2.6-2.8 2.1-4.7l-.8-2.2c.5 2.6.1 5-1.3 6.9z" fill="#c4321f"/>` +
    `<path d="M10.2 16.2C12.9 15.5 15.6 16.8 15.6 19.5 15.6 22 13.5 23.4 11.4 23 9.9 22.7 9.3 21.5 9.9 20.6 10.5 19.8 11.9 20.1 12.3 19.3 12.6 18.6 11.8 18 10.7 17.8 9.6 17.6 9.4 16.4 10.2 16.2Z" fill="#b5a46c"/>` +
    `<path d="M14.1 17.6c.8.7 1 1.8.6 2.8-.1.3-.5.2-.5-.1.1-.9-.1-1.7-.5-2.4-.1-.3.2-.5.4-.3z" fill="#fff" opacity=".45"/>` +
    shine(9, 9.8, .9, 2.2, 15, .5),

  agbalumo: () =>
    `<circle cx="12" cy="12" r="9.2" fill="#e8862a"/>` +
    `<circle cx="12" cy="12" r="7.8" fill="#fdf1dc"/>` +
    star(12, 12, 5.4, 2.2, "#f2c58e") +
    ring(5, 3.6, 12, 12, (x, y, r) => `<ellipse cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" rx=".7" ry="1.25" fill="#5a3a1e" transform="rotate(${r.toFixed(0)} ${x.toFixed(2)} ${y.toFixed(2)})"/>`) +
    `<circle cx="12" cy="12" r=".9" fill="#fdf1dc"/>`,
};

/* The fixed order, and the name a tooltip / screen reader uses. Nigerian names
   in brackets where a child here calls it something else. */
export const FRUITS = [
  ["apple", "Apple"],
  ["banana", "Banana"],
  ["orange", "Orange"],
  ["lemon", "Lemon"],
  ["strawberry", "Strawberry"],
  ["cherries", "Cherries"],
  ["grapes", "Grapes"],
  ["watermelon", "Watermelon"],
  ["pineapple", "Pineapple"],
  ["mango", "Mango"],
  ["pear", "Pear"],
  ["peach", "Peach"],
  ["coconut", "Coconut"],
  ["kiwi", "Kiwi"],
  ["avocado", "Avocado (pear)"],
  ["pawpaw", "Pawpaw"],
  ["guava", "Guava"],
  ["pomegranate", "Pomegranate"],
  ["cashew", "Cashew"],
  ["agbalumo", "Agbalumo (African star apple)"],
].map(([id, name]) => ({ id, name }));

const CACHE = {};

/** The fruit's bare <svg> markup. Size it with CSS (width/height on the svg
 *  or its box). Unknown ids throw, so a typo in a puzzle bank fails loudly. */
export function fruitSvg(id) {
  if (!DRAW[id]) throw new Error(`fruits.js: no fruit "${id}"`);
  if (!CACHE[id]) CACHE[id] = wrap(DRAW[id](), FRUITS.find((f) => f.id === id).name);
  return CACHE[id];
}
