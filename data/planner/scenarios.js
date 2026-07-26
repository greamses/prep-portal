/* ═══════════════════════════════════════════════════════
   PLANNER — the event-programme bank

   The Planner game briefs a player to schedule a day's events. This file is the
   pure content it draws from: a pool of culture-neutral programme items, and the
   difficulty dials (how many events a round schedules). The GENERATION — picking
   events, laying down a hidden true schedule, and writing the clues that pin it
   — lives in js/rng.js, seeded so every client in a room gets the identical
   brief with no network traffic.

   Keep the pool generic and worldwide-readable (no exam past-paper text, no
   place- or culture-specific events). Adding an entry just widens the variety.
═══════════════════════════════════════════════════════ */

// Each event is { id (stable slug), name (what the sticky note + clues show) }.
// The pool must be at least as large as the hardest difficulty's event count so
// a round can always pick that many distinct events.
export const EVENT_POOL = [
  { id: 'registration', name: 'Registration' },
  { id: 'welcome', name: 'Welcome' },
  { id: 'opening', name: 'Opening Speech' },
  { id: 'warmup', name: 'Warm-up' },
  { id: 'team-games', name: 'Team Games' },
  { id: 'relay', name: 'Relay Race' },
  { id: 'quiz', name: 'Quiz' },
  { id: 'performance', name: 'Performance' },
  { id: 'music', name: 'Music Set' },
  { id: 'break', name: 'Short Break' },
  { id: 'lunch', name: 'Lunch' },
  { id: 'photo', name: 'Group Photo' },
  { id: 'workshop', name: 'Workshop' },
  { id: 'presentation', name: 'Presentation' },
  { id: 'awards', name: 'Awards' },
  { id: 'closing', name: 'Closing' },
  { id: 'cleanup', name: 'Clean-up' },
  { id: 'snacks', name: 'Snacks' },
];

// How many events a round schedules, by difficulty. More events = a longer clue
// chain to work through (and the clock scales with it — see main.js). Counts
// stay within EVENT_POOL.length.
export const DIFFICULTY = {
  easy: { count: 5 },
  medium: { count: 7 },
  hard: { count: 9 },
};

export const DIFFICULTY_KEYS = ['easy', 'medium', 'hard'];

/** Event count for a difficulty (medium if unknown). */
export function eventCount(difficulty) {
  return (DIFFICULTY[difficulty] || DIFFICULTY.medium).count;
}
