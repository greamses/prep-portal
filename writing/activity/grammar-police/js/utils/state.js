export const state = {
  pageFlip: null,
  bookBuilt: false,

  // Loaded content (set by main.js before the book is built)
  book: null,           // full payload from /api/grammar/book
  wordGroups: {},       // confusable option sets, keyed by group id
  passages: [],         // grammar passages, in display order  (index = passageIdx)
  exercises: [],        // punctuation exercises, in display order (index = exerIdx)

  // Page-jump targets for the Table of Contents
  UNIT_START_PAGE: [],          // unit index → opener page
  EXPLANATION_START_PAGE: [],
  PASSAGE_START_PAGE: [],
  PP_EXPL_START: [],
  PP_EXER_START: [],
  CHECKER_PAGE: null,           // page index of the AI "Check My Writing" tool

  drag: {
    char: null,
    sourceSlot: null,
    ghost: null,
    selected: null,
  },
  mobileCurrentPage: 0,
  mobileFlipping: false,
};
