/* ============================================================================
   Comprehension Workbook — the ONE registry
   ----------------------------------------------------------------------------
   The engine, the builder and the answer key read this file and nothing else.

     ex-read.js   chapter 1, reading for the answer — a short numbered
                 passage with literal, vocabulary and inference questions,
                 every one of which also asks which LINE it came from

   THE ORDER IS THE BOOK. A new chapter is a new ex-file and new entries here,
   and nothing else changes.
   ========================================================================== */

import { CM_GROUPS, CM_EXERCISES } from "./ex-read.js";

export { LEVELS, HELP, levelOf, helpOf } from "../../shared/levels.js";

export const GROUPS = [...CM_GROUPS];
export const EXERCISES = [...CM_EXERCISES];

/** Which chapter an exercise belongs to. */
const CHAPTER = new Map([...CM_GROUPS.map((g) => [g.id, 1])]);
export const chapterOf = (ex) => CHAPTER.get(ex.group) || 1;

export const CHAPTERS = { 1: "Chapter 1: Reading for the answer" };

export const exerciseById = (id) => EXERCISES.find((e) => e.id === id) || null;
export const GROUP_IDS = GROUPS.map((g) => g.id);
