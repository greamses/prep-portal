/* ============================================================================
   PrepBot Board — keeping the voice and the pen together
   ----------------------------------------------------------------------------
   Beats arrive one by one (from the stream, or a demo file). Each is SAID and
   DRAWN together: the next beat starts only when this one's sentence has been
   said AND its strokes are on the board, and when the next sentence's audio is
   ready — or after a short wait, when it is said silently, caption only, so a
   slow voice never stalls the lesson.

   The learner can cut in at any moment. interrupt() does it in a fixed order —
   new turn number, stop the voice, finish the strokes in hand (the board stays
   as said), drop everything queued — and every callback still in flight checks
   the turn number and goes quiet if it is stale.

   Pure apart from what it is given (board, voice, clock): node-testable.
   ========================================================================== */

export function createScheduler({
  board,                  // { play(beat, seconds) → Promise, finishNow() }
  voice,                  // { prepare(text) → clip }
  onBeat = () => {},      // (beat) a sentence is starting: show the caption
  onAsk = () => {},       // (beat) PrepBot asked and is waiting
  onIdle = () => {},      // the turn has played out (no ask)
  onEnd = () => {},       // the model said the lesson part is done
  readyWait = 2.5,        // seconds to wait for a sentence's audio
  gap = 0.25,             // seconds between beats
  clock = {
    sleep: (s) => new Promise((r) => setTimeout(r, s * 1000)),
  },
} = {}) {
  let turn = 0;
  let queue = [];          // { beat, clip }
  let current = null;      // { beat, clip }
  let runningTurn = null;  // the turn whose loop is running, if any
  let streamDone = false;
  let spoken = [];         // beats said in full this turn
  let partial = null;      // the beat being said when the learner cut in

  const prep = (entry) => {
    if (!entry.clip && entry.beat.say) entry.clip = voice.prepare(entry.beat.say);
    return entry;
  };

  async function run(myTurn) {
    if (runningTurn === myTurn) return;
    runningTurn = myTurn;
    try {
      while (myTurn === turn) {
        const entry = queue.shift();
        if (!entry) break;
        prep(entry);
        if (queue[0]) prep(queue[0]); // one beat ahead, no more
        current = entry;
        const { beat, clip } = entry;

        if (clip) {
          await Promise.race([clip.ready, clock.sleep(readyWait)]);
          if (myTurn !== turn) return;
        }
        onBeat(beat);
        const seconds = clip ? clip.duration : 0.6;
        await Promise.all([clip ? clip.play() : clock.sleep(seconds), board.play(beat, seconds)]);
        if (myTurn !== turn) return;
        spoken.push(beat);
        current = null;
        if (beat.end) { onEnd(beat); return; }
        if (beat.ask) { queue = []; onAsk(beat); return; }
        await clock.sleep(gap);
      }
      if (myTurn === turn && streamDone && !queue.length) onIdle();
    } finally {
      if (runningTurn === myTurn) runningTurn = null;
      /* a beat may have arrived while the last one was finishing */
      if (myTurn === turn && queue.length) run(myTurn);
    }
  }

  return {
    get turn() { return turn; },
    get busy() { return runningTurn === turn || queue.length > 0; },

    /** A new turn: forget the last one's beats (call before streaming). */
    begin() {
      turn++;
      queue = [];
      current = null;
      spoken = [];
      partial = null;
      streamDone = false;
      return turn;
    },

    /** One beat for this turn. Beats from an older turn are ignored. */
    push(beat, forTurn = turn) {
      if (forTurn !== turn || !beat) return;
      const entry = { beat, clip: null };
      queue.push(entry);
      if (queue.length <= 1 && !current) prep(entry); // the first one: start its audio now
      run(turn);
    },

    /** The stream has ended — no more beats will come this turn. */
    done(forTurn = turn) {
      if (forTurn !== turn) return;
      streamDone = true;
      if (runningTurn !== turn && !queue.length) onIdle();
    },

    /**
     * The learner cut in. Returns what was actually said this turn (the beat
     * being said when they cut in is marked partial).
     */
    interrupt() {
      turn++;
      const cut = current;
      current = null;
      cut?.clip?.stop();
      board.finishNow();
      for (const q of queue) q.clip?.stop();
      queue = [];
      if (cut) partial = cut.beat;
      return { spoken: [...spoken], partial };
    },

    /** What was said this turn, for the next turn's transcript. */
    record() {
      return { spoken: [...spoken], partial };
    },
  };
}
