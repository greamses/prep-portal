/* Generates data/vocab/world-map.js from Natural Earth 110m (public domain)
   via the world-atlas package. Hand-curated on top of it:
     - RENAME  fixes NE's abbreviated names ("Dem. Rep. Congo") into the names
               a school actually teaches.
     - INFO    capital-city hint + continent for every QUIZZED country. A
               country not in INFO is still DRAWN (the map must look right)
               but never asked — territories and disputed areas stay scenery.
   Antarctica is dropped entirely: no one names it in a quiz and it eats a
   third of the map's height.

   RUNNING IT (rarely needed — only to re-curate): this repo intentionally has
   no dependencies, so run it from a scratch directory that has them:
     npm i world-atlas@2 topojson-client d3-geo
     node /path/to/prep-portal/scripts/gen-world-map.mjs
   It resolves its deps from the CWD's node_modules and writes the data file
   into the repo next to itself. */
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import fs from 'fs';

const require = createRequire(pathToFileURL(join(process.cwd(), 'noop.js')));
const tj = await import(pathToFileURL(require.resolve('topojson-client')));
const { geoNaturalEarth1, geoPath, geoArea } = await import(pathToFileURL(require.resolve('d3-geo')));
const ATLAS = require.resolve('world-atlas/countries-110m.json');
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'vocab', 'world-map.js');

const RENAME = {
  'Bosnia and Herz.': 'Bosnia and Herzegovina',
  'Central African Rep.': 'Central African Republic',
  "Côte d'Ivoire": 'Ivory Coast',
  'Dem. Rep. Congo': 'Democratic Republic of the Congo',
  'Congo': 'Republic of the Congo',
  'Dominican Rep.': 'Dominican Republic',
  'Eq. Guinea': 'Equatorial Guinea',
  'S. Sudan': 'South Sudan',
  'Solomon Is.': 'Solomon Islands',
  'eSwatini': 'Eswatini',
  'Macedonia': 'North Macedonia',
  'United States of America': 'United States',
};

const DROP = new Set(['Antarctica', 'Fr. S. Antarctic Lands']);

const C = { AF: 0, AS: 1, EU: 2, NA: 3, SA: 4, OC: 5 };
// name -> [continent, capital] · capital '' means the hint is bespoke (below)
const INFO = {
  // ── Africa ──
  Algeria: [C.AF, 'Algiers'], Angola: [C.AF, 'Luanda'], Benin: [C.AF, 'Porto-Novo'],
  Botswana: [C.AF, 'Gaborone'], 'Burkina Faso': [C.AF, 'Ouagadougou'], Burundi: [C.AF, 'Gitega'],
  Cameroon: [C.AF, 'Yaounde'], 'Central African Republic': [C.AF, 'Bangui'], Chad: [C.AF, "N'Djamena"],
  'Republic of the Congo': [C.AF, 'Brazzaville'], 'Democratic Republic of the Congo': [C.AF, 'Kinshasa'],
  'Ivory Coast': [C.AF, 'Yamoussoukro'], Djibouti: [C.AF, ''], Egypt: [C.AF, 'Cairo'],
  'Equatorial Guinea': [C.AF, 'Malabo'], Eritrea: [C.AF, 'Asmara'], Eswatini: [C.AF, 'Mbabane'],
  Ethiopia: [C.AF, 'Addis Ababa'], Gabon: [C.AF, 'Libreville'], Gambia: [C.AF, 'Banjul'],
  Ghana: [C.AF, 'Accra'], Guinea: [C.AF, 'Conakry'], 'Guinea-Bissau': [C.AF, ''],
  Kenya: [C.AF, 'Nairobi'], Lesotho: [C.AF, 'Maseru'], Liberia: [C.AF, 'Monrovia'],
  Libya: [C.AF, 'Tripoli'], Madagascar: [C.AF, 'Antananarivo'], Malawi: [C.AF, 'Lilongwe'],
  Mali: [C.AF, 'Bamako'], Mauritania: [C.AF, 'Nouakchott'], Morocco: [C.AF, 'Rabat'],
  Mozambique: [C.AF, 'Maputo'], Namibia: [C.AF, 'Windhoek'], Niger: [C.AF, 'Niamey'],
  Nigeria: [C.AF, 'Abuja'], Rwanda: [C.AF, 'Kigali'], Senegal: [C.AF, 'Dakar'],
  'Sierra Leone': [C.AF, 'Freetown'], Somalia: [C.AF, 'Mogadishu'], 'South Africa': [C.AF, 'Pretoria'],
  'South Sudan': [C.AF, 'Juba'], Sudan: [C.AF, 'Khartoum'], Tanzania: [C.AF, 'Dodoma'],
  Togo: [C.AF, 'Lome'], Tunisia: [C.AF, 'Tunis'], Uganda: [C.AF, 'Kampala'],
  Zambia: [C.AF, 'Lusaka'], Zimbabwe: [C.AF, 'Harare'],
  // ── Asia ──
  Afghanistan: [C.AS, 'Kabul'], Armenia: [C.AS, 'Yerevan'], Azerbaijan: [C.AS, 'Baku'],
  Bangladesh: [C.AS, 'Dhaka'], Bhutan: [C.AS, 'Thimphu'], Brunei: [C.AS, 'Bandar Seri Begawan'],
  Cambodia: [C.AS, 'Phnom Penh'], China: [C.AS, 'Beijing'], Cyprus: [C.AS, 'Nicosia'],
  Georgia: [C.AS, 'Tbilisi'], India: [C.AS, 'New Delhi'], Indonesia: [C.AS, 'Jakarta'],
  Iran: [C.AS, 'Tehran'], Iraq: [C.AS, 'Baghdad'], Israel: [C.AS, 'Jerusalem'],
  Japan: [C.AS, 'Tokyo'], Jordan: [C.AS, 'Amman'], Kazakhstan: [C.AS, 'Astana'],
  Kuwait: [C.AS, ''], Kyrgyzstan: [C.AS, 'Bishkek'], Laos: [C.AS, 'Vientiane'],
  Lebanon: [C.AS, 'Beirut'], Malaysia: [C.AS, 'Kuala Lumpur'], Mongolia: [C.AS, 'Ulaanbaatar'],
  Myanmar: [C.AS, 'Naypyidaw'], Nepal: [C.AS, 'Kathmandu'], 'North Korea': [C.AS, 'Pyongyang'],
  Oman: [C.AS, 'Muscat'], Pakistan: [C.AS, 'Islamabad'], Philippines: [C.AS, 'Manila'],
  Qatar: [C.AS, 'Doha'], 'Saudi Arabia': [C.AS, 'Riyadh'], 'South Korea': [C.AS, 'Seoul'],
  'Sri Lanka': [C.AS, 'Colombo'], Syria: [C.AS, 'Damascus'], Tajikistan: [C.AS, 'Dushanbe'],
  Thailand: [C.AS, 'Bangkok'], 'Timor-Leste': [C.AS, 'Dili'], Turkey: [C.AS, 'Ankara'],
  Turkmenistan: [C.AS, 'Ashgabat'], 'United Arab Emirates': [C.AS, 'Abu Dhabi'],
  Uzbekistan: [C.AS, 'Tashkent'], Vietnam: [C.AS, 'Hanoi'], Yemen: [C.AS, 'Sanaa'],
  // ── Europe ──
  Albania: [C.EU, 'Tirana'], Austria: [C.EU, 'Vienna'], Belarus: [C.EU, 'Minsk'],
  Belgium: [C.EU, 'Brussels'], 'Bosnia and Herzegovina': [C.EU, 'Sarajevo'], Bulgaria: [C.EU, 'Sofia'],
  Croatia: [C.EU, 'Zagreb'], Czechia: [C.EU, 'Prague'], Denmark: [C.EU, 'Copenhagen'],
  Estonia: [C.EU, 'Tallinn'], Finland: [C.EU, 'Helsinki'], France: [C.EU, 'Paris'],
  Germany: [C.EU, 'Berlin'], Greece: [C.EU, 'Athens'], Hungary: [C.EU, 'Budapest'],
  Iceland: [C.EU, 'Reykjavik'], Ireland: [C.EU, 'Dublin'], Italy: [C.EU, 'Rome'],
  Latvia: [C.EU, 'Riga'], Lithuania: [C.EU, 'Vilnius'], Luxembourg: [C.EU, ''],
  Moldova: [C.EU, 'Chisinau'], Montenegro: [C.EU, 'Podgorica'], Netherlands: [C.EU, 'Amsterdam'],
  'North Macedonia': [C.EU, 'Skopje'], Norway: [C.EU, 'Oslo'], Poland: [C.EU, 'Warsaw'],
  Portugal: [C.EU, 'Lisbon'], Romania: [C.EU, 'Bucharest'], Russia: [C.EU, 'Moscow'],
  Serbia: [C.EU, 'Belgrade'], Slovakia: [C.EU, 'Bratislava'], Slovenia: [C.EU, 'Ljubljana'],
  Spain: [C.EU, 'Madrid'], Sweden: [C.EU, 'Stockholm'], Switzerland: [C.EU, 'Bern'],
  Ukraine: [C.EU, 'Kyiv'], 'United Kingdom': [C.EU, 'London'],
  // ── North America ──
  Bahamas: [C.NA, 'Nassau'], Belize: [C.NA, 'Belmopan'], Canada: [C.NA, 'Ottawa'],
  'Costa Rica': [C.NA, 'San Jose'], Cuba: [C.NA, 'Havana'], 'Dominican Republic': [C.NA, 'Santo Domingo'],
  'El Salvador': [C.NA, 'San Salvador'], Guatemala: [C.NA, ''], Haiti: [C.NA, 'Port-au-Prince'],
  Honduras: [C.NA, 'Tegucigalpa'], Jamaica: [C.NA, 'Kingston'], Mexico: [C.NA, ''],
  Nicaragua: [C.NA, 'Managua'], Panama: [C.NA, ''], 'Trinidad and Tobago': [C.NA, 'Port of Spain'],
  'United States': [C.NA, 'Washington DC'],
  // ── South America ──
  Argentina: [C.SA, 'Buenos Aires'], Bolivia: [C.SA, 'Sucre'], Brazil: [C.SA, 'Brasilia'],
  Chile: [C.SA, 'Santiago'], Colombia: [C.SA, 'Bogota'], Ecuador: [C.SA, 'Quito'],
  Guyana: [C.SA, 'Georgetown'], Paraguay: [C.SA, 'Asuncion'], Peru: [C.SA, 'Lima'],
  Suriname: [C.SA, 'Paramaribo'], Uruguay: [C.SA, 'Montevideo'], Venezuela: [C.SA, 'Caracas'],
  // ── Oceania ──
  Australia: [C.OC, 'Canberra'], Fiji: [C.OC, 'Suva'], 'New Zealand': [C.OC, 'Wellington'],
  'Papua New Guinea': [C.OC, 'Port Moresby'], 'Solomon Islands': [C.OC, 'Honiara'],
  Vanuatu: [C.OC, 'Port Vila'],
};

// A capital-city hint would name (or nearly spell) these countries — they get
// a bespoke hint instead.
const BESPOKE = {
  Djibouti: "Small Horn-of-Africa state guarding the Red Sea's southern gate.",
  'Guinea-Bissau': 'Once Portuguese West Africa; its capital sits on the Geba estuary.',
  Kuwait: 'Small, oil-rich Gulf state between Iraq and Saudi Arabia.',
  Luxembourg: 'Tiny, wealthy country wedged between France, Belgium and Germany.',
  Guatemala: 'The most populous Central American country, heartland of the Maya.',
  Mexico: 'Land of the Aztecs, directly south of the United States.',
  Panama: 'Its famous canal joins the Atlantic and Pacific oceans.',
};

const topo = JSON.parse(fs.readFileSync(ATLAS, 'utf8'));
const geo = tj.feature(topo, topo.objects.countries);
const feats = geo.features
  .filter((f) => !DROP.has(f.properties.name))
  .map((f) => ({ ...f, name: RENAME[f.properties.name] || f.properties.name }));

const W = 1000;
const proj = geoNaturalEarth1().fitWidth(W, { type: 'FeatureCollection', features: feats });
const [[x0, y0], [x1, y1]] = geoPath(proj).bounds({ type: 'FeatureCollection', features: feats });
const H = Math.ceil(y1 - y0);
proj.translate([proj.translate()[0] - x0, proj.translate()[1] - y0]);
const path = geoPath(proj);

const round1 = (d) => d.replace(/-?\d+\.\d+/g, (m) => {
  const v = (+m).toFixed(1);
  return v.endsWith('.0') ? v.slice(0, -2) : v;
});

// Ring marker anchor: the centroid of the LARGEST polygon, so France's ring
// sits on France (not pulled into the Atlantic by French Guiana).
function anchor(f) {
  let g = f.geometry;
  if (g.type === 'MultiPolygon') {
    let best = null, bestA = -1;
    for (const coords of g.coordinates) {
      const poly = { type: 'Polygon', coordinates: coords };
      const a = geoArea(poly);
      if (a > bestA) { bestA = a; best = poly; }
    }
    g = best;
  }
  const [cx, cy] = path.centroid(g);
  return [Math.round(cx * 10) / 10, Math.round(cy * 10) / 10];
}

const rows = feats.map((f) => {
  const info = INFO[f.name];
  const hint = info ? (BESPOKE[f.name] || `Its capital city is ${info[1]}.`) : '';
  const cont = info ? info[0] : -1;
  const [cx, cy] = anchor(f);
  const d = round1(path(f));
  return { name: f.name, hint, cont, cx, cy, d };
}).sort((a, b) => a.name.localeCompare(b.name));

const quizzed = rows.filter((r) => r.hint);
console.log(`countries drawn: ${rows.length} · quizzed: ${quizzed.length}`);
const perC = {};
for (const r of quizzed) perC[r.cont] = (perC[r.cont] || 0) + 1;
console.log('per continent:', JSON.stringify(perC));
const unnamed = rows.filter((r) => !r.hint).map((r) => r.name);
console.log('drawn but not quizzed:', unnamed.join(', '));
// sanity: no hint contains its own word, no name has non A-Za-z chars beyond space/hyphen
for (const r of quizzed) {
  if (r.hint.toLowerCase().includes(r.name.toLowerCase())) console.log('!! hint names itself:', r.name);
  if (!/^[A-Za-z][A-Za-z -]*$/.test(r.name)) console.log('!! odd name:', r.name);
}

const CONT_KEYS = ['africa', 'asia', 'europe', 'n-america', 's-america', 'oceania'];
const body = rows.map((r) =>
  `  [${JSON.stringify(r.name)}, ${JSON.stringify(r.hint)}, ${r.cont}, ${r.cx}, ${r.cy}, ${JSON.stringify(r.d)}],`
).join('\n');

const out = `/* ═══════════════════════════════════════════════════════
   MAP OF THE WORLD — country outlines from Natural Earth (public domain,
   110m, via the world-atlas package), projected once (geoNaturalEarth1) and
   baked to SVG paths at build time by scripts/gen-world-map.mjs. Capitals,
   continents and the quizzed subset are hand-curated in that script.

   Two audiences, exactly like the periodic table:
     COUNTRIES       everything drawable — the LIBRARY and the clue map draw
                     all of it, so the world looks right.
     GAME_COUNTRIES  the quizzed subset: sovereign countries a school names.
                     Territories and disputed areas are drawn but never asked.

   Each row: [name, hint, continent(-1 = not quizzed), cx, cy, path].
   cx/cy anchor the clue's locator ring on the country's biggest landmass.
   This file is LAZY-LOADED (via words/geography.js or a dynamic import) —
   never import it statically from index.js, it is a few hundred KB.
═══════════════════════════════════════════════════════ */

export const MAP_W = ${W};
export const MAP_H = ${H};

export const CONTINENT_KEYS = ${JSON.stringify(CONT_KEYS)};

const RAW = [
${body}
];

export const COUNTRIES = RAW.map(([name, hint, cont, cx, cy, d]) => ({
  name, hint, cont: cont >= 0 ? CONTINENT_KEYS[cont] : '', cx, cy, d,
}));

// What the game quizzes, shaped like any other topic's words: the country's
// NAME is the word, its capital (or a bespoke line) is the clue, and \`s\` is
// the continent scope key a scoped round filters on.
export const GAME_COUNTRIES = COUNTRIES
  .filter((c) => c.hint)
  .map((c) => ({ w: c.name, d: c.hint, s: c.cont, country: c }));
`;

fs.writeFileSync(OUT, out);
const kb = Math.round(fs.statSync(OUT).size / 1024);
console.log(`wrote data/vocab/world-map.js (${kb} KB, viewBox ${W}x${H})`);
