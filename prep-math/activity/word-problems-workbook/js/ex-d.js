/* ============================================================================
   Competition Word Problems — chapters 12 and 13
   ----------------------------------------------------------------------------
     12 Working backwards   undo the steps in the opposite order: think-of-a-
                            number chains, money spent in fractions, half and
                            some more, passengers at stops, equal after a
                            gift, and things that double or triple
     13 Elapsed time        how long between two times, what time it ends or
                            began, across midnight, school timetables, bus
                            times, journeys, dates and clocks that gain or lose

   Times are told on the 24-hour clock unless the problem says am or pm, and
   the answer is two boxes: hours, then minutes. Every problem is made from
   its answer (common.js).
   ========================================================================== */

import { bank, P, MARK, bills, names, plural } from "./common.js";

export const D_GROUPS = [
  { id: "wp-back", chapter: "Chapter 12 · Working backwards", label: "Working backwards", blurb: "Start at the end and undo each step, last one first." },
  { id: "wp-time", chapter: "Chapter 13 · Elapsed time", label: "Elapsed time", blurb: "How long between, what time it ends, timetables, journeys and dates." },
];

/* ═══ 12 · WORKING BACKWARDS ═══════════════════════════════════════════════*/

const divisors = (n, lo = 2, hi = 9) => { const o = []; for (let d = lo; d <= hi; d++) if (n % d === 0) o.push(d); return o; };

/** n steps done to a start number: the story, the end, and the undoing. */
function chain(r, n, big) {
  let cur = r.int(2, big ? 25 : 15);
  const start = cur, said = [], undo = [];
  for (let i = 0; i < n; i++) {
    for (let g = 0; g < 40; g++) {
      const kind = r.pick(["add", "sub", "mul", "div"]);
      if (kind === "add") { const a = r.int(2, 20); said.push(`add ${a}`); undo.push((v) => [v - a, `${v} − ${a}`]); cur += a; break; }
      if (kind === "sub" && cur > 2) { const a = r.int(1, cur - 1); said.push(`subtract ${a}`); undo.push((v) => [v + a, `${v} + ${a}`]); cur -= a; break; }
      if (kind === "mul" && cur < 120) { const m = r.int(2, big ? 9 : 5); said.push(`multiply by ${m}`); undo.push((v) => [v / m, `${v} ÷ ${m}`]); cur *= m; break; }
      if (kind === "div") { const ds = divisors(cur, 2, 6); if (!ds.length) continue; const d = r.pick(ds); said.push(`divide by ${d}`); undo.push((v) => [v * d, `${v} × ${d}`]); cur /= d; break; }
    }
  }
  if (said.length !== n) return null;
  let v = cur; const trail = [];
  for (let i = n - 1; i >= 0; i--) { const [nv, txt] = undo[i](v); trail.push(`${txt} = ${nv}`); v = nv; }
  return { start, end: cur, said, trail: trail.join(", ") };
}
const sayChain = (said) => said.join(", then ");
const ordinal = ["first", "second", "third", "fourth"];

const bkNumber = bank("wp-bk-number", "wp-back", {
  label: "I think of a number",
  blurb: "A chain of steps; undo them from the last to the first.",
  heading: "Think of a number",
  instruction: "The answer is at the END of the story, so START there and walk back. Undo the LAST step first, then the one " +
    "before it. The opposite of adding is subtracting, of multiplying is dividing — and the other way round.",
  example: "I think of a number, multiply it by 3, then subtract 4, and get 32. What was my number?",
  solution: "Work backwards. Last step was subtract 4, so undo it: 32 + 4 = 36. Before that I multiplied by 3, so undo it: 36 ÷ 3 = 12. My number was 12.",
}, [
  (r, t) => { const c = chain(r, t === "gentle" ? 2 : t === "middle" ? 3 : 4, t !== "gentle"); if (!c || c.end > 400) return null;
    return P(`I think of a number. I ${sayChain(c.said)}. The answer is ${c.end}. What was my number?`, [["number:", c.start]], `back from ${c.end}: ${c.trail}`); },
  (r, t) => { const c = chain(r, t === "gentle" ? 2 : 3, true); if (!c || c.end > 400) return null; const [A] = names(r, 1);
    return P(`${A} thinks of a number and does this to it: ${c.said.join(", then ")}. ${A} ends with ${c.end}. What number did ${A} start with?`, [["number:", c.start]], `back from ${c.end}: ${c.trail}`); },
  (r, t) => { if (t === "gentle") return null; const x = r.int(3, 30), a = r.int(2, 9), b = r.int(2, 9), c = r.int(1, 20);
    return P(`I think of a number, add ${a}, multiply the sum by ${b}, and then subtract ${c}. I get ${(x + a) * b - c}. What was my number?`, [["number:", x]], `${(x + a) * b - c} + ${c} = ${(x + a) * b}; ÷ ${b} = ${x + a}; − ${a} = ${x}`); },
]);

const FR = [[1, 2], [1, 3], [1, 4], [2, 3], [1, 5], [3, 4], [2, 5]];
const word = (n, d) => `${n}/${d}`;

const bkMoney = bank("wp-bk-money", "wp-back", {
  label: "What was there at first?",
  blurb: "A fraction spent, then another; what is left tells the start.",
  heading: "Fractions spent, and what is left",
  instruction: "When a FRACTION of something is spent, what is LEFT is the rest of the fraction. Spending 1/3 leaves 2/3, so " +
    "to undo it, find what 2/3 is worth, then 1/3 of it, then all three thirds. Work from the last thing that happened " +
    "back to the first, and draw a bar to check: each step cuts the bar down.",
  example: "Tunde spent 1/2 of his money on a book and then 1/3 of what was left on food. He had 400 prepbills left. How much had he at first?",
  solution: "After the book he kept 1/2. Then he spent 1/3 of that, so he kept 2/3 of it. So 400 is 2/3 of what he had after the book: one third is 200, so he had 600 after the book. That was half of his money, so at first he had 1,200.",
  board: true,
}, [
  (r, t) => { const k = t === "gentle" ? 1 : 2; const fr = []; for (let i = 0; i < k; i++) fr.push(r.pick(FR)); let S = r.int(2, 30) * 60; let cur = S; for (const [n, d] of fr) { if ((cur * (d - n)) % d) return null; cur = (cur * (d - n)) / d; } if (cur < 20) return null;
    const [A] = names(r, 1); const things = ["a book", "food", "clothes", "a ticket", "toys"];
    const said = fr.map(([n, d], i) => (i === 0 ? `spent ${word(n, d)} of the money on ${things[0]}` : `then ${word(n, d)} of what was left on ${things[i]}`)).join(", ");
    return P(`${A} ${said}. ${A} then had ${bills(cur)} left. How much had ${A} at first?`, [[`at first (${MARK}):`, S]], `kept ${fr.map(([n, d]) => word(d - n, d)).join(" then ")}: ${cur} back to ${S}`); },
  (r, t) => { const [n, d] = r.pick(FR); const S = r.int(2, 40) * d * 10; const x = r.int(1, 6) * 50; const left = (S * (d - n)) / d - x; if (left < 50 || !Number.isInteger(left)) return null; const [A] = names(r, 1);
    return P(`${A} spent ${word(n, d)} of the savings on a bag and then ${bills(x)} on a pen, and had ${bills(left)} left. How much were the savings at first?`, [[`savings (${MARK}):`, S]], `${left} + ${x} = ${left + x} is ${word(d - n, d)} of the savings`); },
  (r, t) => { if (t === "gentle") return null; const [A, B] = names(r, 2); const [n, d] = r.pick(FR); const S = r.int(3, 30) * d * 20; const given = (S * n) / d; const keep = S - given; const [n2, d2] = r.pick(FR); if ((keep * n2) % d2) return null; const spent2 = (keep * n2) / d2; const left = keep - spent2; if (left < 20) return null;
    return P(`${A} gave ${word(n, d)} of the money to ${B}, then spent ${word(n2, d2)} of the rest, and had ${bills(left)} left. How much did ${A} have at first, and how much did ${B} receive?`, [[`${A} had (${MARK}):`, S], [`${B} got (${MARK}):`, given]], `kept ${word(d - n, d)}, then ${word(d2 - n2, d2)} of that`); },
]);

const bkStory = bank("wp-bk-story", "wp-back", {
  label: "Stops, sales and gifts",
  blurb: "Half and some more, passengers on a bus, two friends made equal.",
  heading: "Working backwards in a story",
  instruction: "Number the events in the order they happened and undo them in the REVERSE order. 'Half of them and 2 more' " +
    "leaves half, take away 2: to undo it, add the 2 back and then double. When a gift makes two people EQUAL, the " +
    "giver started higher by the gift and the receiver lower by the gift.",
  example: "A trader sold half of her eggs and 2 more in the morning. In the afternoon she sold half of the rest and 1 more. She had 3 eggs left. How many had she at first?",
  solution: "Afternoon, undone: 3 + 1 = 4, doubled = 8 eggs in the afternoon at the start. Morning, undone: 8 + 2 = 10, doubled = 20. She had 20 eggs at first.",
}, [
  (r, t) => { const k = t === "gentle" ? 2 : t === "middle" ? 2 : 3; const e = r.int(2, 6); const cs = []; for (let i = 0; i < k; i++) cs.push(r.int(1, 4)); let x = e; for (let i = k - 1; i >= 0; i--) x = 2 * (x + cs[i]); if (x > 400) return null;
    const [A] = names(r, 1); const stuff = r.pick(["oranges", "eggs", "mangoes", "pencils"]); const when = ["at the first market", "at the second market", "at the third market"];
    const said = cs.map((c, i) => `${i === 0 ? "sold" : "then sold"} half of ${i === 0 ? "the " + stuff : "those left"} and ${c} more ${when[i]}`).join(", ");
    return P(`${A} ${said}. ${A} then had ${e} ${stuff} left. How many ${stuff} had ${A} at first?`, [[`${stuff}:`, x]], `undo each, last first: add the extra, then double`); },
  (r, t) => { const k = t === "gentle" ? 2 : 3; const evs = []; let cur = r.int(8, 40); const start = cur; const said = [];
    for (let i = 0, tries = 0; i < k; i++) {
      if (++tries > 60) return null;
      const kind = r.pick(["offon", "half", "third", "on"]);
      if (kind === "offon") { const off = r.int(2, Math.max(2, cur - 2)), on = r.int(2, 12); if (off >= cur) { i--; continue; } said.push(`${off} got off and ${on} got on`); cur = cur - off + on; evs.push((v) => v + off - on); }
      else if (kind === "half" && cur % 2 === 0) { said.push("half of the passengers got off"); cur /= 2; evs.push((v) => v * 2); }
      else if (kind === "third" && cur % 3 === 0) { said.push("a third of the passengers got off"); cur = (cur * 2) / 3; evs.push((v) => (v * 3) / 2); }
      else if (kind === "on") { const on = r.int(3, 15); said.push(`${on} more got on`); cur += on; evs.push((v) => v - on); }
      else i--;
    }
    if (said.length < k) return null; let v = cur; for (let i = evs.length - 1; i >= 0; i--) v = evs[i](v); if (v !== start) return null;
    return P(`A bus left the terminus with some passengers. ${said.map((s, i) => `At the ${ordinal[i]} stop ${s}`).join(". ")}. The bus then had ${cur} passengers. How many were on it when it left the terminus?`, [["passengers:", start]], `undo the stops from the last to the first`); },
  (r) => { const g = r.int(3, 30), X = r.int(g + 1, g + 40); const [A, B] = names(r, 2); const what = r.pick(["marbles", "stickers", "beads", "coins"]);
    return P(`${A} gave ${g} ${what} to ${B}, and then they each had ${X}. How many ${what} did each have at first?`, [[`${A}:`, X + g], [`${B}:`, X - g]], `${A} had ${g} more, ${B} had ${g} fewer`); },
  (r, t) => { if (t === "gentle") return null; const m = r.pick([2, 3, 5]); let b = r.int(3, 20); while ((b * (m - 1)) % 2) b++; const g = (b * (m - 1)) / 2; const [A, B] = names(r, 2);
    return P(`${A} had ${m} times as many stickers as ${B}. ${A} gave ${g} stickers to ${B}, and then they had the same number. How many had each at first?`, [[`${A}:`, m * b], [`${B}:`, b]], `equal after the gift, so ${A} had ${2 * g} more at first`); },
]);

const bkGrow = bank("wp-bk-grow", "wp-back", {
  label: "Doubling and tripling",
  blurb: "It grows by the same multiple each time: step back by dividing.",
  heading: "Working backwards through growth",
  instruction: "If something DOUBLES every day, then one day EARLIER it was HALF as much. If it triples every hour, an hour " +
    "earlier it was a THIRD. So to go back n steps, divide n times. The pond that is full on day 20 was half full on day 19.",
  example: "The weed on a pond doubles in area every day, and it covers the whole pond on day 20. On which day did it cover a quarter of the pond?",
  solution: "Going back one day halves it: day 19 is a half, day 18 is a quarter. It covered a quarter of the pond on day 18.",
}, [
  (r, t) => { const N = r.int(10, 30), k = r.int(1, t === "gentle" ? 2 : 4); const frac = ["", "half", "a quarter", "an eighth", "a sixteenth"][k]; const w = r.pick(["weed", "moss", "algae"]);
    return P(`The ${w} on a pond doubles in area every day and covers the whole pond on day ${N}. On which day does it cover ${frac} of the pond?`, [["day:", N - k]], `each day back halves it: ${k} ${plural(k, "day")} earlier`); },
  (r, t) => { const m = r.pick([2, 3, 4]), h = r.int(3, t === "gentle" ? 4 : 6), s = r.int(2, 9); if (s * m ** h > 6000) return null;
    return P(`A colony of bacteria ${m === 2 ? "doubles" : m === 3 ? "triples" : "becomes four times as many"} every hour. After ${h} hours there are ${s * m ** h}. How many were there at the start?`, [["at the start:", s]], `${s * m ** h} ÷ ${m}, ${h} times`); },
  (r, t) => { if (t === "gentle") return null; const m = r.pick([2, 3]), h = r.int(4, 7), j = r.int(1, h - 2), s = r.int(2, 6); if (s * m ** h > 6000) return null;
    return P(`A group of ants ${m === 2 ? "doubles" : "triples"} every day. On day ${h} there are ${s * m ** h}. How many were there ${j} ${plural(j, "day")} earlier, on day ${h - j}?`, [["ants:", s * m ** (h - j)]], `divide by ${m}, ${j} ${plural(j, "time")}`); },
  (r, t) => { if (t !== "stretch") return null; const m = r.pick([2, 3]), h = r.int(3, 5), s = r.int(2, 6), tot = s * m ** h; if (tot > 3000) return null;
    return P(`Every hour a puddle of water becomes ${m} times as large. After ${h} hours it holds ${tot} ml. How much did it hold after 2 hours, and how much at the start?`, [["after 2 hours (ml):", s * m ** 2], ["at the start (ml):", s]], `divide by ${m}, ${h} times to reach the start`); },
]);

/* ═══ 13 · ELAPSED TIME ════════════════════════════════════════════════════*/

const pad = (n) => String(n).padStart(2, "0");
/** Minutes since midnight, told on the 24-hour clock. */
const clock = (m) => `${pad(Math.floor(((m % 1440) + 1440) % 1440 / 60))}:${pad(((m % 60) + 60) % 60)}`;
const hm = (m) => { const h = Math.floor(m / 60), n = m % 60; return h && n ? `${h} h ${n} min` : h ? `${h} h` : `${n} min`; };
const hoursOf = (m) => Math.floor(((m % 1440) + 1440) % 1440 / 60);
const minsOf = (m) => ((m % 60) + 60) % 60;
const am12 = (m) => { const h = Math.floor(m / 60) % 24, n = m % 60; return `${h % 12 || 12}:${pad(n)} ${h < 12 ? "am" : "pm"}`; };
/** A length of time: Foundation keeps to quarter hours. */
const span = (r, t, lo, hi) => (t === "gentle" ? r.int(Math.ceil(lo / 15), Math.floor(hi / 15)) * 15 : r.int(lo, hi));
const stepMin = (r, t) => (t === "gentle" ? r.pick([0, 15, 30, 45]) : r.int(0, 59));
const ansHM = (m) => [["hours:", Math.floor(m / 60)], ["minutes:", m % 60]];
const ansClock = (m) => [["hours:", hoursOf(m)], ["minutes:", minsOf(m)]];
const MONTHS = [["January", 31], ["February", 28], ["March", 31], ["April", 30], ["May", 31], ["June", 30], ["July", 31], ["August", 31], ["September", 30], ["October", 31], ["November", 30], ["December", 31]];
const doy = (mo, d) => MONTHS.slice(0, mo).reduce((s, [, n]) => s + n, 0) + d;

const etLength = bank("wp-et-length", "wp-time", {
  label: "How long between two times",
  blurb: "From one time to another: on one day, across noon or across midnight.",
  heading: "Elapsed time: how long?",
  instruction: "To find how long between two times, count UP: from the start to the next whole hour, then the whole hours, then " +
    "the minutes after the last hour. Across MIDNIGHT, count to 24:00 first and then on from 00:00. On the 24-hour " +
    "clock 13:00 is 1 pm. Give the answer as hours and minutes — 75 minutes is 1 hour 15 minutes.",
  example: "A film starts at 18:35 and ends at 21:10. How long does it last?",
  solution: "18:35 to 19:00 is 25 minutes. 19:00 to 21:00 is 2 hours. 21:00 to 21:10 is 10 minutes. Altogether 2 hours and 25 + 10 = 35 minutes.",
  signed: true,
}, [
  (r, t) => { const s = r.int(6, 15) * 60 + stepMin(r, t), d = span(r, t, 40, 400); const e = s + d; const [A] = names(r, 1);
    return P(`${A}'s lesson starts at ${clock(s)} and ends at ${clock(e)}. How long does it last?`, ansHM(d), `${clock(s)} to ${clock(e)}`); },
  (r, t) => { const s = r.int(6, 11) * 60 + stepMin(r, t), d = span(r, t, 120, 480); const e = s + d; if (e < 13 * 60) return null;
    return P(`A market opens at ${am12(s)} and closes at ${am12(e)}. For how long is it open?`, ansHM(d), `${am12(s)} to ${am12(e)}`); },
  (r, t) => { const s = r.int(20, 23) * 60 + stepMin(r, t), d = span(r, t, 180, 600); const e = s + d; if (e < 1440) return null;
    return P(`A night bus leaves at ${clock(s)} and arrives at ${clock(e)} the next morning. How long is the journey?`, ansHM(d), `${clock(s)} to 24:00, then 00:00 to ${clock(e)}`); },
  (r, t) => { const s = r.int(7, 20) * 60 + stepMin(r, t), d = span(r, t, 35, 300); const e = s + d;
    return P(`A film starts at ${clock(s)} and lasts ${hm(d)}. At what time does it end? (24-hour clock)`, ansClock(e), `${clock(s)} + ${hm(d)}`); },
  (r, t) => { const e = r.int(9, 21) * 60 + stepMin(r, t), d = span(r, t, 35, 280); const s = e - d;
    return P(`An examination ended at ${clock(e)} after lasting ${hm(d)}. At what time did it start? (24-hour clock)`, ansClock(s), `${clock(e)} − ${hm(d)}`); },
  (r, t) => { if (t === "gentle") return null; const e = r.int(1, 7) * 60 + r.int(0, 59), d = span(r, t, 60, 480); const s = e - d + 1440; if (s < 1200 || d <= e) return null;
    return P(`A train arrives at ${clock(e)} after a journey of ${hm(d)}. When did it leave the day before? (24-hour clock)`, ansClock(s), `${clock(e)} − ${hm(d)}, back past midnight`); },
]);

const etSchedule = bank("wp-et-schedule", "wp-time", {
  label: "Timetables and schedules",
  blurb: "Lessons and breaks added up; a bus that comes every so often.",
  heading: "Elapsed time: timetables",
  instruction: "A timetable is a chain of lengths of time. ADD all the lengths, in minutes, and then add the total to the " +
    "start. If the END is known and one length is missing, subtract everything you know from the whole time. For a bus " +
    "that comes every k minutes, the 9th bus is 8 gaps after the first — one fewer gap than buses.",
  example: "School starts at 08:00. There are 5 lessons of 40 minutes and 2 breaks of 15 minutes. At what time does school end?",
  solution: "5 × 40 = 200 minutes of lessons, and 2 × 15 = 30 minutes of breaks: 230 minutes, which is 3 h 50 min. 08:00 + 3 h 50 min = 11:50.",
  signed: true,
}, [
  (r, t) => { const s = r.pick([7, 8, 9]) * 60 + r.pick([0, 30]), n = r.int(4, 7), L = r.pick([30, 35, 40, 45]), b = r.int(1, 3), B = r.pick([10, 15, 20, 25]); const e = s + n * L + b * B;
    return P(`School starts at ${clock(s)}. There are ${n} lessons of ${L} minutes and ${b} ${plural(b, "break")} of ${B} minutes. At what time does school end? (24-hour clock)`, ansClock(e), `${n} × ${L} + ${b} × ${B} = ${n * L + b * B} min = ${hm(n * L + b * B)}`); },
  (r, t) => { const s = r.pick([7, 8, 9]) * 60, n = r.int(4, 7), L = r.pick([30, 35, 40, 45]), b = r.int(2, 3), B = r.pick([10, 15, 20, 25]); const e = s + n * L + b * B;
    return P(`School begins at ${clock(s)} and ends at ${clock(e)}. There are ${n} lessons of ${L} minutes and ${b} breaks, all the same length. How long is each break?`, [["minutes:", B]], `${hm(e - s)} − ${n} × ${L} = ${b * B} min, ÷ ${b}`); },
  (r, t) => { const [A] = names(r, 1); const s = r.int(15, 17) * 60 + r.pick([0, 10, 20, 30, 40, 50]); const a = span(r, t, 20, 55), b = r.pick([5, 10, 15]), c = span(r, t, 25, 90); const e = s + a + b + c;
    return P(`${A} starts homework at ${clock(s)}. Maths takes ${a} minutes, then there is a break of ${b} minutes, and English takes ${hm(c)}. At what time does ${A} finish? (24-hour clock)`, ansClock(e), `${a} + ${b} + ${c} = ${a + b + c} min`); },
  (r, t) => { const cook = span(r, t, 35, 190), e = r.int(11, 19) * 60 + r.pick([0, 15, 30, 45]), s = e - cook;
    return P(`A cake takes ${hm(cook)} to bake and must come out of the oven at ${clock(e)}. At what time must it go in? (24-hour clock)`, ansClock(s), `${clock(e)} − ${hm(cook)}`); },
  (r, t) => { const f = r.int(5, 8) * 60 + r.pick([0, 10, 20, 30, 40, 50]), i = r.pick([12, 15, 18, 20, 25, 30, 35, 40]), n = r.int(5, 12); const e = f + (n - 1) * i;
    return P(`The first bus of the day leaves at ${clock(f)}, and after that one leaves every ${i} minutes. At what time does bus number ${n} leave? (24-hour clock)`, ansClock(e), `${n - 1} gaps of ${i} min = ${hm((n - 1) * i)}`); },
  (r, t) => { if (t === "gentle") return null; const f = r.int(6, 9) * 60 + r.pick([0, 10, 20, 30, 40, 50]), i = r.pick([15, 20, 25, 30, 40]), n = r.int(6, 14); const e = f + (n - 1) * i; if (e > 1380) return null;
    return P(`Buses leave a station every ${i} minutes. The first leaves at ${clock(f)} and the last at ${clock(e)}. How many buses leave altogether?`, [["buses:", n]], `${hm(e - f)} ÷ ${i} = ${n - 1} gaps, plus the first bus`); },
]);

const etJourney = bank("wp-et-journey", "wp-time", {
  label: "Journeys, clocks and dates",
  blurb: "Distance and speed give a time; clocks that gain or lose; days between dates.",
  heading: "Elapsed time: journeys, clocks and dates",
  instruction: "Time = distance ÷ speed. At 60 km/h a minute is a kilometre. A clock that GAINS 3 minutes every hour shows " +
    "63 minutes for each true hour. To count the days between two dates in a year, number each date from 1 January (a " +
    "year that is not a leap year has 28 days in February) and subtract.",
  example: "A car leaves at 09:20 and drives 150 km at 60 km/h. At what time does it arrive?",
  solution: "150 ÷ 60 = 2.5 hours, which is 2 h 30 min. 09:20 + 2 h 30 min = 11:50.",
  signed: true,
}, [
  (r, t) => { const v = r.pick([40, 48, 60, 72, 80, 90, 120]), tm = r.int(2, 14) * 15; if ((v * tm) % 60) return null; const d = (v * tm) / 60, s = r.int(6, 17) * 60 + stepMin(r, t); const e = s + tm; const [A] = names(r, 1);
    return P(`${A} leaves at ${clock(s)} and drives ${d} km at ${v} km/h. At what time does ${A} arrive? (24-hour clock)`, ansClock(e), `${d} ÷ ${v} h = ${hm(tm)}`); },
  (r, t) => { const v = r.pick([40, 48, 60, 72, 80, 90, 120]), tm = r.int(3, 16) * 15; if ((v * tm) % 60) return null; const d = (v * tm) / 60, e = r.int(10, 20) * 60 + r.pick([0, 15, 30, 45]), s = e - tm;
    return P(`A bus must reach a town ${d} km away at ${clock(e)}. It travels at ${v} km/h. At what time must it set off? (24-hour clock)`, ansClock(s), `${d} ÷ ${v} h = ${hm(tm)}; ${clock(e)} − ${hm(tm)}`); },
  (r, t) => { const v = r.pick([40, 60, 80, 90, 120]), tm = r.int(2, 12) * 15; if ((v * tm) % 60) return null; const s = r.int(6, 15) * 60 + stepMin(r, t), e = s + tm;
    return P(`A train leaves at ${clock(s)} and arrives at ${clock(e)}, travelling at ${v} km/h all the way. How far does it go, in kilometres?`, [["km:", (v * tm) / 60]], `${hm(tm)} at ${v} km/h`); },
  (r, t) => { if (t === "gentle") return null; const g = r.pick([2, 3, 4, 5]), h = r.int(3, 12), s = r.int(6, 10) * 60; const shown = s + h * (60 + g); const [A] = names(r, 1);
    return P(`${A}'s clock gains ${g} minutes every hour. It is set right at ${clock(s)}. What does it show ${h} hours later, when the true time is ${clock(s + h * 60)}? (24-hour clock)`, ansClock(shown), `${h} × ${g} = ${h * g} minutes fast`); },
  (r, t) => { if (t === "gentle") return null; const g = r.pick([2, 3, 4, 5, 6]), h = r.int(3, 12), s = r.int(6, 10) * 60; const shown = s + h * (60 - g);
    return P(`A watch loses ${g} minutes every hour. It is set right at ${clock(s)}. What does it show when the true time is ${clock(s + h * 60)}? (24-hour clock)`, ansClock(shown), `${h} × ${g} = ${h * g} minutes slow`); },
  (r, t) => { const a = r.int(0, 9), da = r.int(1, 28), b = r.int(a + 1, 11), db = r.int(1, 28); const days = doy(b, db) - doy(a, da); if (days < 10) return null;
    return P(`How many days are there from ${da} ${MONTHS[a][0]} to ${db} ${MONTHS[b][0]} of the same year? (It is not a leap year.)`, [["days:", days]], `day ${doy(b, db)} − day ${doy(a, da)}`); },
  (r, t) => { if (t === "gentle") return null; const a = r.int(0, 9), da = r.int(1, 28), b = r.int(a + 1, 11), db = r.int(1, 28); const days = doy(b, db) - doy(a, da); if (days < 15) return null;
    return P(`A holiday begins on ${da} ${MONTHS[a][0]} and ends on ${db} ${MONTHS[b][0]} of the same year (not a leap year). Counting from the first date to the second, how many whole weeks and how many extra days is that?`, [["weeks:", Math.floor(days / 7)], ["days:", days % 7]], `${days} days = ${Math.floor(days / 7)} weeks and ${days % 7} days`); },
  (r, t) => { const a = r.int(0, 10), da = r.int(15, 28), n = r.pick([14, 21, 28, 30, 35]); const total = doy(a, da) + n; let m = 0; while (m < 11 && total > doy(m + 1, 0)) m++; const day = total - doy(m, 0); if (m === a || day > MONTHS[m][1]) return null;
    return P(`A library book is borrowed on ${da} ${MONTHS[a][0]} and must be returned after ${n} days. On what day of ${MONTHS[m][0]} (that is, which date) must it be returned? (Not a leap year.)`, [["date:", day]], `day ${doy(a, da)} + ${n} = day ${total} of the year`); },
]);

export const D_EXERCISES = [bkNumber, bkMoney, bkStory, bkGrow, etLength, etSchedule, etJourney];
