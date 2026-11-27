/* ============================================================================
   PEN MARKS — the marker's tick and cross
   ----------------------------------------------------------------------------
   The marks a teacher's pen leaves, first drawn for the Exam Maker's live
   paper (prep-math/activity/exam-maker/js/live.js) and shared from here so
   every page marks work the same way. Each stroke is a SHAPE, thin where the
   pen lands, full in the turn and tapering where it lifts off, and a little
   off the straight — not a line of even width.

   They fill with currentColor: colour the element that holds them (the exam
   paper uses #1f9d46 for right and #d6322a for wrong).
   ========================================================================== */

export const PEN_TICK = `<svg viewBox="0 0 24 24" aria-hidden="true"><g transform="rotate(-5 12 12)"><path d="M2.9 13.7C4.1 12.8 5.7 13.3 6.9 14.9C7.8 16.1 8.5 17.4 9 18.8C10.5 13.9 14.2 8.5 20.7 3.5C21.2 3.2 21.6 3.7 21.2 4.1C15.9 9.6 12.4 15 10.7 20.5C10.4 21.4 9.2 21.5 8.8 20.6C7.9 18.6 6.5 16.6 4.9 15.3C4.1 14.7 3.3 14.7 2.8 14.2C2.5 13.9 2.6 13.8 2.9 13.7Z"/></g></svg>`;

export const PEN_CROSS = `<svg viewBox="0 0 24 24" aria-hidden="true"><g transform="rotate(3 12 12)"><path d="M4.3 4.5C8 7.9 14 14.3 19.7 19.8C20.2 20.3 19.6 20.8 19.1 20.4C13.2 15.7 8.3 10.7 3.9 5.7C3.5 5.2 3.9 4.2 4.3 4.5Z"/><path d="M19.5 4.4C15.3 8.6 9.8 14.2 6.2 19.7C5.9 20.2 5.4 19.9 5.7 19.4C8.6 14 13.6 8.3 18.9 3.9C19.4 3.6 19.9 4.1 19.5 4.4Z"/></g></svg>`;
