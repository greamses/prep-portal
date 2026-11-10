/* ============================================================================
   PrepBoard — turning a model's text into beats, as it streams
   ----------------------------------------------------------------------------
   The model is asked for one JSON object per beat. Models do not always do as
   asked: they wrap the objects in an array or a ```json fence, put two on one
   line, add a sentence of prose first, or ignore the format altogether. So
   this does not split on newlines. It walks the text a character at a time,
   aware of strings and escapes, and every time a top-level { … } closes it
   tries to read it — with one light repair (trailing commas) before giving up
   on that object.

   If no object has appeared after PROSE_AFTER characters, the model is writing
   prose: from then on the text is cut into sentences and each is a speech-only
   beat, so the lesson still talks even when nothing is drawn.

   It stops at the first beat that ASKS or ENDS (anything after an ask is
   wasted — PrepBot is waiting for the learner) and after MAX_BEATS.

   The shape check here is light — known op names, sizes. The board checks
   every field properly before it draws anything.
   ========================================================================== */

const OPS = new Set(["write", "graph", "plot", "point", "arrow", "underline", "circle", "highlight", "shape", "clear", "look", "diagram", "label", "part", "object", "move", "sticky", "bars", "brace", "suggest", "tool", "sketch", "picture"]);
const MAX_BEATS = 18;
const PROSE_AFTER = 400;

function shape(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  if (Array.isArray(raw.beats)) return null; // a wrapper: its beats are scanned on their own
  const beat = {};
  if (raw.end === true) beat.end = true;
  const ask = typeof raw.ask === "string" ? raw.ask.trim().slice(0, 400) : "";
  const say = typeof raw.say === "string" ? raw.say.trim().slice(0, 400) : "";
  if (ask) beat.ask = ask;
  else if (say) beat.say = say;
  const ops = Array.isArray(raw.do) ? raw.do : [];
  beat.do = ops
    .filter((o) => o && typeof o === "object" && OPS.has(o.op) && JSON.stringify(o).length <= 700)
    .slice(0, 8);
  if (!beat.end && !beat.ask && !beat.say && !beat.do.length) return null;
  return beat;
}

function tryParse(text) {
  try { return JSON.parse(text); } catch (_) {}
  try { return JSON.parse(text.replace(/,\s*([}\]])/g, "$1")); } catch (_) {}
  return undefined;
}

const SENTENCE = /[^.!?]+[.!?]+["')\]]*\s*/g;

function createScanner({ maxBeats = MAX_BEATS, proseAfter = PROSE_AFTER, noAsk = false } = {}) {
  let buf = "";          // text not yet consumed
  let pos = 0;           // scan position in buf
  let depth = 0, inStr = false, esc = false, start = -1;
  let found = 0;         // objects read
  let outside = 0;       // characters seen outside any object
  let prose = false;
  let proseBuf = "";
  let rawAll = "";       // everything, while no object has been read (for prose)
  let stopped = false;
  let emitted = 0;
  const stats = { dropped: 0, prose: false };

  function emit(out, beat) {
    if (stopped || !beat) return;
    /* a lecture never waits: a question the model asks anyway is just said */
    if (noAsk && beat.ask) { beat.say = beat.ask; delete beat.ask; }
    out.push(beat);
    emitted++;
    if (beat.ask || beat.end || emitted >= maxBeats) stopped = true;
  }

  function scan(out) {
    while (pos < buf.length && !stopped) {
      const ch = buf[pos];
      if (start < 0) {
        if (ch === "{") { start = pos; depth = 1; inStr = false; esc = false; }
        else if (!/\s|[[\],`]/.test(ch)) outside++;
        pos++;
        continue;
      }
      if (inStr) {
        if (esc) esc = false;
        else if (ch === "\\") esc = true;
        else if (ch === '"') inStr = false;
      } else if (ch === '"') inStr = true;
      else if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          const raw = tryParse(buf.slice(start, pos + 1));
          if (raw === undefined) stats.dropped++;
          else {
            found++;
            if (raw && Array.isArray(raw.beats)) raw.beats.forEach((b) => emit(out, shape(b)));
            else {
              const b = shape(raw);
              if (b) emit(out, b); else stats.dropped++;
            }
          }
          start = -1;
        }
      }
      pos++;
    }
    /* keep the buffer small: drop what has been consumed */
    if (start < 0) { buf = buf.slice(pos); pos = 0; }
    else if (start > 0) { buf = buf.slice(start); pos -= start; start = 0; }
  }

  function proseOut(out, final) {
    let m, last = 0;
    SENTENCE.lastIndex = 0;
    while ((m = SENTENCE.exec(proseBuf)) && !stopped) {
      const s = m[0].replace(/[*_#`>]+/g, "").trim();
      if (s) emit(out, { say: s.slice(0, 400), do: [] });
      last = SENTENCE.lastIndex;
    }
    proseBuf = proseBuf.slice(last);
    if (final && proseBuf.trim() && !stopped) emit(out, { say: proseBuf.trim().slice(0, 400), do: [] });
  }

  return {
    /** Feed text; returns the beats it completed. */
    push(text) {
      const out = [];
      if (stopped || !text) return out;
      if (prose) { proseBuf += text; proseOut(out, false); return out; }
      buf += text;
      if (!found) rawAll += text;
      scan(out);
      if (!found && outside > proseAfter) {
        prose = stats.prose = true;
        proseBuf = rawAll.replace(/```(?:json)?/g, "");
        buf = ""; pos = 0; start = -1;
        proseOut(out, false);
      }
      return out;
    },
    /** The stream ended; returns any last beats. */
    end() {
      const out = [];
      if (stopped) return out;
      if (prose) { proseOut(out, true); return out; }
      if (!emitted && rawAll.trim()) {
        /* nothing readable at all: say it as prose */
        prose = stats.prose = true;
        proseBuf = rawAll.replace(/```(?:json)?/g, "").replace(/[{}[\]"]/g, " ");
        proseOut(out, true);
      }
      return out;
    },
    get stopped() { return stopped; },
    get count() { return emitted; },
    stats,
  };
}

module.exports = { createScanner, shape, OPS, MAX_BEATS };
