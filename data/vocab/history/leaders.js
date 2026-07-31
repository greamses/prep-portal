/* ═══════════════════════════════════════════════════════
   VOCAB — Nigeria's heads of state, past to present.

   A DRAWN topic whose picture is a PHOTOGRAPH rather than a diagram: you are
   shown the face, and you either spell the name or type the years in office.
   Two topics off one bank:

     leader-name    portrait → the SURNAME.  The caption says nothing; the
                    hover note carries a fact about them that never contains
                    the answer (see the clue rule in data/vocab).
     leader-dates   portrait + the NAME → the YEARS. Digits are guessable in
                    this topic only (see rng.js's isGuessable), so the board
                    reads 1 9 8 5 - 1 9 9 3 with the hyphen as scenery.

   One person can hold two terms (Obasanjo and Buhari each ruled once in
   uniform and once elected), so `terms` is a list and the dates topic deals
   one entry per TERM while the name topic deals one per PERSON.

   SOURCES. Every portrait is a Wikimedia Commons file that is public domain,
   CC0 or CC-BY-SA, downloaded to /data/vocab/history/portraits at 640px and
   never hot-linked. Each carries its own CREDIT string, shown under the clue —
   for the CC-BY-SA ones that is a licence obligation, not decoration.

   SANI ABACHA HAS NO PORTRAIT. Commons holds no freely-licensed photograph of
   him (his category is a signature, an audio clip and his mausoleum; the
   Wikipedia image is fair-use, which we cannot ship). Leaving him out would
   make "past to present" a lie, so he plays with `img: null` and the clue
   renderer falls back to a written card. Drop a file in and clear the null the
   day a free photo appears.
═══════════════════════════════════════════════════════ */

const DIR = '/data/vocab/history/portraits/';

// "Portrait: <who> · <licence>", the licence linking to the Commons file page.
const credit = (file, licence, by) =>
  `Portrait: ${by} · <a href="https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file).replace(/%20/g, '_')}" target="_blank" rel="noopener">${licence}</a>`;

/* `g` is the minimum grade an entry is dealt at (topicPool filters on it): the
   leaders every Nigerian child can name come first, the short-lived and the
   interim ones only later. `big` marks a portrait sharp enough to be cut into
   a jigsaw — the Shonekan illustration is 300px and stays out of that pool. */
export const LEADERS = [
  {
    key: 'azikiwe', name: 'Nnamdi Azikiwe', surname: 'Azikiwe', g: 4, big: true,
    img: `${DIR}azikiwe.jpg`,
    credit: credit('Vintage Nnamdi Azikiwe.jpg', 'CC0', 'SusuGeo'),
    hint: 'The first President of the Republic — a ceremonial office under the 1963 constitution. Known across the continent as “Zik”.',
    terms: [{ years: '1963-1966', note: 'His years as ceremonial President of the First Republic.' }],
  },
  {
    key: 'ironsi', name: 'Johnson Aguiyi-Ironsi', surname: 'Aguiyi-Ironsi', g: 8, big: true,
    img: `${DIR}ironsi.jpg`,
    credit: credit('Major Gen. J.T.U. Aguiyi Ironsi (cropped).jpg', 'Public domain', 'National Library of Nigeria'),
    hint: 'The first military Head of State, who took charge after the January 1966 coup and was killed in the counter-coup six months later.',
    terms: [{ years: '1966', note: 'The first military government — January to July of one year.' }],
  },
  {
    key: 'gowon', name: 'Yakubu Gowon', surname: 'Gowon', g: 4, big: true,
    img: `${DIR}gowon.jpg`,
    credit: credit('Gen. Yakubu Gowon GCFR (cropped).jpg', 'Public domain', 'National Library of Nigeria'),
    hint: 'Led the country through the civil war and declared “no victor, no vanquished” when it ended.',
    terms: [{ years: '1966-1975', note: 'The civil-war years and the oil boom that followed.' }],
  },
  {
    key: 'murtala', name: 'Murtala Mohammed', surname: 'Mohammed', g: 8, big: true,
    img: `${DIR}murtala.jpg`,
    credit: credit('Murtala Mohammed.jpg', 'Public domain', 'Seven Ways Zaria'),
    hint: 'Began the move of the federal capital to Abuja, and was assassinated in a failed coup after only six months in office.',
    terms: [{ years: '1975-1976', note: 'Six months in office, ended by an assassination.' }],
  },
  {
    key: 'obasanjo', name: 'Olusegun Obasanjo', surname: 'Obasanjo', g: 4, big: true,
    img: `${DIR}obasanjo.jpg`,
    credit: credit('Olusegun Obasanjo DD-SC-07-14396-cropped.jpg', 'Public domain', 'Helene C. Stikkel, US DoD'),
    hint: 'Ruled twice — first as a general who handed power back to civilians, then as an elected president twenty years later.',
    terms: [
      { years: '1976-1979', note: 'His MILITARY government, which handed over to civilians.' },
      { years: '1999-2007', note: 'His ELECTED presidency — two terms, at the return of democracy.', g: 6 },
    ],
  },
  {
    key: 'shagari', name: 'Shehu Shagari', surname: 'Shagari', g: 6, big: true,
    img: `${DIR}shagari.jpg`,
    credit: credit('President Sharari cropped.jpg', 'Public domain', 'US Department of Defense'),
    hint: 'The first executive President of the Second Republic, overthrown by the army on New Year’s Eve.',
    terms: [{ years: '1979-1983', note: 'The Second Republic, ended by a coup on New Year’s Eve.' }],
  },
  {
    key: 'buhari', name: 'Muhammadu Buhari', surname: 'Buhari', g: 4, big: true,
    img: `${DIR}buhari.jpg`,
    credit: credit('Muhammadu Buhari, President of the Federal Republic of Nigeria (3x4 cropped).jpg', 'CC BY-SA 4.0', 'Bayo Omoboriowo'),
    hint: 'Ran the “War Against Indiscipline” as a military ruler, then came back thirty years later by winning an election.',
    terms: [
      { years: '1983-1985', note: 'His MILITARY government and the War Against Indiscipline.', g: 6 },
      { years: '2015-2023', note: 'His ELECTED presidency — two terms.' },
    ],
  },
  {
    key: 'babangida', name: 'Ibrahim Babangida', surname: 'Babangida', g: 6, big: true,
    img: `${DIR}babangida.jpg`,
    credit: credit('Nigerian Public Domain 145.jpg', 'Public domain', 'Seven Ways Zaria'),
    hint: 'Styled himself “military president”, and annulled the June 12 election of 1993.',
    terms: [{ years: '1985-1993', note: 'The years of SAP and the annulled June 12 election.' }],
  },
  {
    key: 'shonekan', name: 'Ernest Shonekan', surname: 'Shonekan', g: 8, big: false,
    img: `${DIR}shonekan.png`,
    credit: credit('Ernest Shonekan illustration.png', 'Public domain', 'Voice of America'),
    hint: 'A businessman, not a soldier, who headed the Interim National Government for about three months.',
    terms: [{ years: '1993', note: 'The Interim National Government — under three months.' }],
  },
  {
    // No free photograph exists — see the header. The clue renderer draws a
    // written card for any leader with img: null.
    key: 'abacha', name: 'Sani Abacha', surname: 'Abacha', g: 6, big: false,
    img: null, credit: '',
    hint: 'The general who dissolved the interim government and ruled until he died in office at the Villa in 1998.',
    terms: [{ years: '1993-1998', note: 'Military rule that ended with his death in office.' }],
  },
  {
    key: 'abubakar', name: 'Abdulsalami Abubakar', surname: 'Abubakar', g: 8, big: true,
    img: `${DIR}abubakar.jpg`,
    credit: credit('Abdulsalami Abubakar detail DF-SC-02-04323.jpg', 'Public domain', 'SSGT Karen L. Sanders, USAF'),
    hint: 'Ran the eleven-month transition that wrote the 1999 constitution and handed the country back to civilians.',
    terms: [{ years: '1998-1999', note: 'The short transition programme back to civilian rule.' }],
  },
  {
    key: 'yaradua', name: "Umaru Musa Yar'Adua", surname: "Yar'Adua", g: 6, big: true,
    img: `${DIR}yaradua.jpg`,
    credit: credit('YarAdua WEF 2008.jpg', 'CC BY-SA 2.0', 'World Economic Forum'),
    hint: 'A former Katsina State governor, and the first sitting president to die in office after a long illness abroad.',
    terms: [{ years: '2007-2010', note: 'Cut short by a long illness and his death in office.' }],
  },
  {
    key: 'jonathan', name: 'Goodluck Jonathan', surname: 'Jonathan', g: 4, big: true,
    img: `${DIR}jonathan.jpg`,
    credit: credit('Goodluck Jonathan World Economic Forum 2013.jpg', 'CC BY-SA 2.0', 'World Economic Forum'),
    hint: 'A vice-president from Bayelsa who finished his boss’s term, then conceded an election he lost — the first sitting Nigerian leader ever to do so.',
    terms: [{ years: '2010-2015', note: 'From acting president to an elected term, ending in a conceded election.' }],
  },
  {
    key: 'tinubu', name: 'Bola Tinubu', surname: 'Tinubu', g: 4, big: true,
    img: `${DIR}tinubu.jpg`,
    credit: credit('Bola Tinubu portrait.jpg', 'CC BY-SA 4.0', 'Nosa Asemota'),
    hint: 'A former Lagos State governor who won the 2023 election and is the sitting President.',
    terms: [{ years: '2023', note: 'The year he was sworn in — he is still in office.' }],
  },
];

// What the clue renderer needs, per entry. `label` is what the caption shows:
// blank when the name IS the answer, the full name when the years are.
const face = (l, label) => ({ img: l.img, label, hint: '', credit: l.credit, name: l.name });

/** leader-name — one entry per PERSON: the portrait, answer is the surname. */
export const NAME_WORDS = LEADERS.map((l) => ({
  w: l.surname,
  d: l.hint,
  g: l.g,
  leader: { ...face(l, ''), hint: l.hint },
}));

/** leader-dates — one entry per TERM: the portrait AND the name, answer is the
    years. A leader with two terms is dealt twice, and the note is what tells
    the two apart ("his MILITARY government" / "his ELECTED presidency"). */
export const DATE_WORDS = LEADERS.flatMap((l) =>
  l.terms.map((t) => ({
    w: t.years,
    d: `${l.name} — ${t.note}`,
    g: t.g != null ? t.g : l.g,
    digits: true, // this topic's answers are numbers; see game.js's keyboard
    leader: { ...face(l, l.name), hint: t.note },
  })));

/** The portraits sharp enough to cut into a jigsaw or a sliding puzzle —
    used by the Puzzles game (exam-archive/national/puzzles/js/photos.js).
    Order is fixed: it is the seeded pick's index space. */
export const PORTRAITS = LEADERS
  .filter((l) => l.img && l.big)
  .map((l) => ({ key: l.key, name: l.name, img: l.img, credit: l.credit }));
