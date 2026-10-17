/* ============================================================================
   Comprehension Workbook — the ONE registry
   ----------------------------------------------------------------------------
   The engine, the builder and the answer key read this file and nothing else.

     ex-read.js      chapter 1, reading for the answer — a short numbered
                     passage with literal, vocabulary and inference
                     questions, every one of which also asks which LINE it
                     came from
     ex-context.js   chapter 2, working a word out from the sentence it
                     stands in: five sections, one per kind of clue, in the
                     order that spells IDEAS

   THE ORDER IS THE BOOK. A new chapter is a new ex-file and new entries here,
   and nothing else changes.
   ========================================================================== */

import { CM_GROUPS, CM_EXERCISES } from "./ex-read.js";
import { CM_CTX_GROUPS, CM_CTX_EXERCISES } from "./ex-context.js";

export { LEVELS, HELP, levelOf, helpOf } from "../../shared/levels.js";

export const GROUPS = [...CM_GROUPS, ...CM_CTX_GROUPS];
export const EXERCISES = [...CM_EXERCISES, ...CM_CTX_EXERCISES];

/** Which chapter an exercise belongs to. */
const CHAPTER = new Map([
  ...CM_GROUPS.map((g) => [g.id, 1]),
  ...CM_CTX_GROUPS.map((g) => [g.id, 2]),
]);
export const chapterOf = (ex) => CHAPTER.get(ex.group) || 1;

export const CHAPTERS = {
  1: "Chapter 1: Reading for the answer",
  2: "Chapter 2: Context clues (IDEAS)",
};

export const exerciseById = (id) => EXERCISES.find((e) => e.id === id) || null;
export const GROUP_IDS = GROUPS.map((g) => g.id);
