/* ═══════════════════════════════════════════════════════
   GRAMMAR — the outline: grades and themes.

   Tiny on purpose. The setup screen needs this the moment the page loads;
   the passages themselves (passages/<theme>.js) are much bigger and load only
   once a round is actually starting.

   A THEME is what the passage is — a diary entry, a letter, a report. It is
   not a school subject: the grammar being drilled is the same either way, but
   a Grade 5 child editing a birthday invitation and a Grade 11 student editing
   a lab report are practising the register they will actually be marked on.

   Each theme carries a BAND — the grades it is written for. A theme is offered
   at a grade only if that grade sits inside its band, which is what keeps a
   Grade 4 reader out of the formal-letter passages and a Grade 12 student out
   of the playground ones.
═══════════════════════════════════════════════════════ */

export const GRADES = [4, 5, 6, 7, 8, 9, 10, 11, 12];

export const THEMES = {
  'diary': {
    label: 'Diary & Everyday',
    band: [4, 8],
    blurb: 'A day out, a birthday, a football match — written the way a child writes it.',
  },
  'story': {
    label: 'Stories',
    band: [4, 9],
    blurb: 'Short narrative passages. Dialogue punctuation lives here.',
  },
  'letter': {
    label: 'Letters & Notes',
    band: [5, 12],
    blurb: 'Informal notes and formal letters — greetings, addresses, sign-offs.',
  },
  'report': {
    label: 'Reports & Notices',
    band: [7, 12],
    blurb: 'School notices, news reports and announcements. Facts, formally written.',
  },
  'science': {
    label: 'Science Write-ups',
    band: [8, 12],
    blurb: 'Lab reports and explanations — the register your practicals are marked in.',
  },
};

export const THEME_KEYS = Object.keys(THEMES);

/** The themes written for this grade, in registry order. */
export function themesForGrade(grade) {
  return THEME_KEYS.filter((key) => {
    const [lo, hi] = THEMES[key].band;
    return grade >= lo && grade <= hi;
  });
}

/** { key, label, blurb } for a theme, or null. */
export function themeMeta(key) {
  const t = THEMES[key];
  return t ? { key, ...t } : null;
}
