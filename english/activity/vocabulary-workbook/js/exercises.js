/* ============================================================================
   Vocabulary Workbook — the ONE registry
   ----------------------------------------------------------------------------
   The engine, the builder and the answer key read this file and nothing else.

     ex-prefixes.js  chapter 1, opposites made with a prefix — un-, dis-,
                 im-, il-, ir-, in-, mis- and non-, which one goes on which
                 word, and what the new word means

   THE ORDER IS THE BOOK. A new chapter is a new ex-file and new entries here,
   and nothing else changes.
   ========================================================================== */

import { VB_GROUPS, VB_EXERCISES } from "./ex-prefixes.js";

export { LEVELS, HELP, levelOf, helpOf } from "../../shared/levels.js";

export const GROUPS = [...VB_GROUPS];
export const EXERCISES = [...VB_EXERCISES];

/** Which chapter an exercise belongs to. */
const CHAPTER = new Map([...VB_GROUPS.map((g) => [g.id, 1])]);
export const chapterOf = (ex) => CHAPTER.get(ex.group) || 1;

export const CHAPTERS = { 1: "Chapter 1: Building words from the front" };

export const exerciseById = (id) => EXERCISES.find((e) => e.id === id) || null;
export const GROUP_IDS = GROUPS.map((g) => g.id);
