/* ============================================================================
   Comprehension Workbook — what makes THIS workbook this workbook
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
  id: "comprehension-workbook",
  label: "Comprehension Workbook",
  subjectLine: "English · Comprehension",
  exercises: EXERCISES,
  groups: GROUPS,
  chapters: CHAPTERS,
  chapterOf,
  icons: ICON,
  glyphs: { "cm-read": ICON["cm-read"] },
  /* a first visit starts at the beginning */
  starter: { "cm-read-passage": 1 },
});
