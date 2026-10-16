/* ============================================================================
   Spelling Workbook — the ONE registry
   ----------------------------------------------------------------------------
   The engine, the builder and the answer key read this file and nothing else.

     ex-endings.js  chapter 1, adding -ing and -ed — the four rules that
                 look like one: jumping, hoping, hopping, carried

   THE ORDER IS THE BOOK. A new chapter is a new ex-file and new entries here,
   and nothing else changes.
   ========================================================================== */

import { SP_GROUPS, SP_EXERCISES } from "./ex-endings.js";

export { LEVELS, HELP, levelOf, helpOf } from "../../shared/levels.js";

export const GROUPS = [...SP_GROUPS];
export const EXERCISES = [...SP_EXERCISES];

/** Which chapter an exercise belongs to. */
const CHAPTER = new Map([...SP_GROUPS.map((g) => [g.id, 1])]);
export const chapterOf = (ex) => CHAPTER.get(ex.group) || 1;

export const CHAPTERS = { 1: "Chapter 1: Adding an ending" };

export const exerciseById = (id) => EXERCISES.find((e) => e.id === id) || null;
export const GROUP_IDS = GROUPS.map((g) => g.id);
