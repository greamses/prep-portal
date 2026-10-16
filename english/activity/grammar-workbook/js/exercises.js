/* ============================================================================
   Grammar Workbook — the ONE registry
   ----------------------------------------------------------------------------
   The engine, the builder and the answer key read this file and nothing else.

     ex-parts.js  chapter 1, the jobs words do — naming the part of speech a
                 word is doing in THIS sentence, and finding a word doing a
                 named job

   THE ORDER IS THE BOOK. A new chapter is a new ex-file and new entries here,
   and nothing else changes.
   ========================================================================== */

import { GR_GROUPS, GR_EXERCISES } from "./ex-parts.js";

export { LEVELS, HELP, levelOf, helpOf } from "../../shared/levels.js";

export const GROUPS = [...GR_GROUPS];
export const EXERCISES = [...GR_EXERCISES];

/** Which chapter an exercise belongs to. */
const CHAPTER = new Map([...GR_GROUPS.map((g) => [g.id, 1])]);
export const chapterOf = (ex) => CHAPTER.get(ex.group) || 1;

export const CHAPTERS = { 1: "Chapter 1: The jobs words do" };

export const exerciseById = (id) => EXERCISES.find((e) => e.id === id) || null;
export const GROUP_IDS = GROUPS.map((g) => g.id);
