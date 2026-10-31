/* ============================================================================
   Exam camera check: the notes (no browser, no camera, no imports)
   ----------------------------------------------------------------------------
   The camera is looked at on the student's own device, and nothing of it is sent.
   All that is kept is a short list of NOTES, each a kind, the second of the exam it
   began and how long it lasted:

       { k: "no_face",    t: 312, d: 14 }   no face in view for 14 s, from 5:12
       { k: "extra_face",  t: 640, d: 6 }    more than one face in view
       { k: "left_tab",    t: 901, d: 30 }   went to another tab or window
       { k: "camera_off",  t: 1200, d: 9 }   the camera stopped
       { k: "no_detector", t: 0,   d: 0 }    the check could not run on this device

   A glance is not a note: a condition has to hold for a few seconds first (`HOLD`),
   so blinking, a cough or a bad frame makes nothing. A note that is still going on
   has its length kept up to date, so a closed tab does not lose it.

   This file is the whole decision, so it can be tested without a camera.
   ========================================================================== */

/** Seconds a condition must last before it is worth a note. */
export const HOLD = { no_face: 8, extra_face: 3, left_tab: 1, camera_off: 2 };
/** Seconds before a SPOKEN warning (earlier than the note: the student is told while they can still put it right). */
export const WARN = { no_face: 4, extra_face: 3, camera_off: 2 };
export const KINDS = ["no_face", "extra_face", "left_tab", "camera_off", "no_detector"];
const MAX_NOTES = 200;

/**
 * One exam's notes.
 *   hold   optional replacement for HOLD (tests use shorter ones)
 * → { see(faces, t), hidden(isHidden, t), camera(isOn, t), note(kind, t), notes(), seen(), stop(t) }
 * `t` is always seconds since the exam began.
 */
export function createTracker({ hold = HOLD, warn = WARN, onWarn = () => {} } = {}) {
  const list = [];
  const open = {};      // kind → { since, note | null, warned }
  let checks = 0;
  let hiddenNow = false;
  let awaySince = 0;
  let leaves = 0;       // times the page was left for a second or more

  function begin(kind, t) { if (!open[kind]) open[kind] = { since: t, note: null, warned: false }; }
  function grow(kind, t) {
    const o = open[kind]; if (!o) return;
    /* the spoken warning comes once per episode, a little before the note is written */
    if (!o.warned && warn[kind] !== undefined && t - o.since >= warn[kind]) { o.warned = true; onWarn(kind, { t }); }
    if (!o.note && t - o.since >= hold[kind] && list.length < MAX_NOTES) {
      o.note = { k: kind, t: Math.round(o.since), d: 0 };
      list.push(o.note);
    }
    if (o.note) o.note.d = Math.max(1, Math.round(t - o.since));
  }
  function end(kind, t) { grow(kind, t); delete open[kind]; }
  const set = (kind, on, t) => { if (on) { begin(kind, t); grow(kind, t); } else if (open[kind]) end(kind, t); };

  return {
    /** A look at the camera: how many faces were in view. Ignored while the page is hidden (nothing to see). */
    see(faces, t) {
      if (hiddenNow) return;
      checks++;
      set("no_face", faces === 0, t);
      set("extra_face", faces > 1, t);
    },
    /** The page went to the background, or came back. */
    hidden(isHidden, t) {
      /* coming back from the page being left: that is the moment to warn (nothing can be heard while it is away) */
      if (isHidden && !hiddenNow) awaySince = t;
      if (!isHidden && hiddenNow && t - awaySince >= 1) { leaves++; onWarn("left_tab", { t, count: leaves, away: Math.round(t - awaySince) }); }
      hiddenNow = isHidden;
      /* what the camera shows while the page is away says nothing about the student */
      if (isHidden) { end("no_face", t); end("extra_face", t); }
      set("left_tab", isHidden, t);
    },
    /** The camera stream stopped (unplugged, switched off), or is back. */
    camera(isOn, t) { set("camera_off", !isOn, t); },
    /** A single note with no length (the check could not run). */
    note(kind, t) { if (list.length < MAX_NOTES && KINDS.includes(kind)) list.push({ k: kind, t: Math.round(t), d: 0 }); },
    /** Bring the length of anything still going on up to date (before sending). */
    tick(t) { for (const k of Object.keys(open)) grow(k, t); },
    /** The notes so far, as plain data. */
    notes() { return list.map((n) => ({ ...n })); },
    /** How many looks at the camera there have been. */
    seen() { return checks; },
    /** How many times the page has been left (for a second or more) and come back to. */
    leaves() { return leaves; },
    /** The exam is over: close everything. */
    stop(t) { for (const k of Object.keys(open)) end(k, t); },
  };
}

const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
const WORDS = {
  no_face: (d) => `Face not in view for ${d} s`,
  extra_face: (d) => `More than one face in view for ${d} s`,
  left_tab: (d) => `Left the exam page for ${d} s`,
  camera_off: (d) => `Camera stopped for ${d} s`,
  no_detector: () => "The camera check could not run on this device",
};
/** A note as a teacher reads it: "5:12  Face not in view for 14 s". */
export const sayNote = (n) => `${mmss(n.t)}  ${(WORDS[n.k] || (() => n.k))(n.d)}`;
