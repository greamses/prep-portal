/* ============================================================================
   Vocabulary Workbook — what makes THIS workbook this workbook
   ----------------------------------------------------------------------------
   The bench, the paper, the pagination, the seed, the answer key and the
   marking all come from /utils/components/workbook/; the two dials and the
   wiring from ../../shared/book.js. What is left here is the name, the
   sections, and what each section is drawn as.
   ========================================================================== */

import { GROUPS, EXERCISES, CHAPTERS, chapterOf } from "./exercises.js";
import { ICON } from "./icons.js";
import { mountEnglishBook } from "../../shared/book.js";

mountEnglishBook({
  id: "vocabulary-workbook",
  label: "Vocabulary Workbook",
  subjectLine: "English · Vocabulary",
  exercises: EXERCISES,
  groups: GROUPS,
  chapters: CHAPTERS,
  chapterOf,
  icons: ICON,
  glyphs: { "vb-prefix": ICON["vb-prefix"] },
  /* a first visit starts at the beginning */
  starter: { "vb-prefix-make": 8 },
});
