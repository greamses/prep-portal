/* ============================================================================
   Writing Workbook — the ONE registry
   ----------------------------------------------------------------------------
   The engine, the builder and the answer key read this file and nothing else.

     ex-build.js  chapter 1, building a sentence — loose words put into the
                 order that makes them mean something, and a sentence written
                 out with its capitals and stops

   THE ORDER IS THE BOOK. A new chapter is a new ex-file and new entries here,
   and nothing else changes.
   ========================================================================== */

import { WR_GROUPS, WR_EXERCISES } from "./ex-build.js";

export { LEVELS, HELP, levelOf, helpOf } from "../../shared/levels.js";

export const GROUPS = [...WR_GROUPS];
export const EXERCISES = [...WR_EXERCISES];

/** Which chapter an exercise belongs to. */
const CHAPTER = new Map([...WR_GROUPS.map((g) => [g.id, 1])]);
export const chapterOf = (ex) => CHAPTER.get(ex.group) || 1;

export const CHAPTERS = { 1: "Chapter 1: Building a sentence" };

export const exerciseById = (id) => EXERCISES.find((e) => e.id === id) || null;
export const GROUP_IDS = GROUPS.map((g) => g.id);
