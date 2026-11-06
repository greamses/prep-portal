// Checks for the PrepBot Board's pure modules: node scripts/check-whiteboard.mjs
import assert from "node:assert/strict";
import { cleanOp, cleanBeat, boardSummary } from "../prepbot-board/js/protocol/ops.js";
import { createLayout, wrapWords, splitAtEquals, overlaps, CANVAS } from "../prepbot-board/js/board/layout.js";
import { niceTicks, makeMapper, compileFn, samplePlot, pathOf } from "../prepbot-board/js/board/plot.js";
import { createScheduler } from "../prepbot-board/js/scheduler.js";

let n = 0;
const t = (name, fn) => {
  try { fn(); n++; } catch (e) { console.error("FAIL", name); throw e; }
};

/* ── ops ─────────────────────────────────────────────────────────────── */
t("unknown op dropped", () => assert.equal(cleanOp({ op: "explode" }), null));
t("write needs words", () => assert.equal(cleanOp({ op: "write" }), null));
t("write math shorthand", () => {
  const o = cleanOp({ op: "write", id: "w1", math: "y = 2x + 1" });
  assert.equal(o.text, "$y = 2x + 1$");
  assert.equal(o.as, "step");
});
t("bad id replaced", () => assert.match(cleanOp({ op: "write", id: "<b>", text: "hi" }).id, /^w\d+$/));
t("graph ranges ordered", () => assert.deepEqual(cleanOp({ op: "graph", x: [10, -2], y: [0, 5] }).x, [-2, 10]));
t("graph default ranges", () => assert.deepEqual(cleanOp({ op: "graph", x: [3, 3] }).x, [-1, 10]));
t("point needs numbers", () => assert.equal(cleanOp({ op: "point", on: "g", x: "a", y: 1 }), null));
t("arrow grid clamped", () => assert.deepEqual(cleanOp({ op: "arrow", from: [-5, 2], to: [14, 3] }).to, [10, 3]));
t("arrow zero length dropped", () => assert.equal(cleanOp({ op: "arrow", from: [1, 1], to: [1, 1] }), null));
t("long text cut", () => assert.ok(cleanOp({ op: "write", text: "x".repeat(500) }).text.length <= 180));
t("beat keeps good ops", () => {
  const b = cleanBeat({ say: "Hello", do: [{ op: "write", text: "Hi" }, { op: "nope" }, null] });
  assert.equal(b.do.length, 1);
  assert.equal(b.say, "Hello");
});
t("ask beat", () => assert.equal(cleanBeat({ ask: "Why?" }).ask, true));
t("empty beat dropped", () => assert.equal(cleanBeat({ say: "", do: [] }), null));
t("end beat", () => assert.equal(cleanBeat({ end: true }).end, true));
t("summary", () => {
  const s = boardSummary([{ op: "write", id: "w1", text: "a", as: "step" }, { op: "graph", id: "g", x: [0, 1], y: [0, 1] }]);
  assert.deepEqual(s[1], { id: "g", kind: "graph", x: [0, 1], y: [0, 1] });
});

/* ── layout ──────────────────────────────────────────────────────────── */
t("lines never overlap and turn a page", () => {
  const L = createLayout("landscape");
  const boxes = [];
  let turned = false;
  for (let i = 0; i < 40; i++) {
    let b = L.place("step", { w: 400 + (i % 4) * 200, h: 60 });
    if (b.turn) { turned = true; L.reset(); boxes.length = 0; b = L.place("step", { w: 400, h: 60 }); }
    for (const o of boxes) assert.ok(!overlaps(o, b), "overlap");
    assert.ok(b.x + b.w <= CANVAS.landscape.main.x + CANVAS.landscape.main.w + 0.01, "too wide");
    boxes.push(b);
  }
  assert.ok(turned);
});
t("fit shrinks then asks to break", () => {
  const L = createLayout();
  assert.equal(L.fit(500).scale, 1);
  assert.ok(L.fit(900).scale < 1 && !L.fit(900).tooWide);
  assert.ok(L.fit(3000).tooWide);
});
t("portrait regions don't overlap", () => assert.ok(!overlaps(CANVAS.portrait.main, CANVAS.portrait.figure)));
t("landscape regions don't overlap", () => assert.ok(!overlaps(CANVAS.landscape.main, CANVAS.landscape.figure)));
t("wrap", () => {
  const lines = wrapWords("the quick brown fox jumps".split(" "), (s) => s.length, 10);
  assert.deepEqual(lines, ["the quick", "brown fox", "jumps"]);
});
t("split at equals", () => {
  assert.deepEqual(splitAtEquals("y = f(a=b) = 3"), ["y", "= f(a=b)", "= 3"]);
  assert.deepEqual(splitAtEquals("x+1"), ["x+1"]);
});

/* ── plot ────────────────────────────────────────────────────────────── */
t("nice ticks", () => {
  assert.deepEqual(niceTicks(0, 10), [0, 2, 4, 6, 8, 10]);
  assert.deepEqual(niceTicks(-1, 1, 4), [-1, -0.5, 0, 0.5, 1]);
});
t("compile forms", () => {
  assert.equal(compileFn("y = 2x + 1")(3), 7);
  assert.equal(compileFn("f(x) = x^2")(4), 16);
  assert.equal(compileFn("x^2 - 3")(2), 1);
  assert.throws(() => compileFn("y = = 2"));
});
t("mapper", () => {
  const m = makeMapper({ x: [0, 10], y: [0, 5] }, { x: 100, y: 100, w: 500, h: 250 });
  assert.equal(m.toX(0), 100);
  assert.equal(m.toX(10), 600);
  assert.equal(m.toY(0), 350);
  assert.equal(m.toY(5), 100);
});
t("sample smooth curve is one line", () => {
  const m = makeMapper({ x: [-3, 3], y: [-1, 9] }, { x: 0, y: 0, w: 600, h: 600 });
  const lines = samplePlot(compileFn("x^2"), m);
  assert.equal(lines.length, 1);
  assert.ok(lines[0].length > 40);
  assert.ok(pathOf(lines).startsWith("M"));
});
t("sample breaks at a jump (1/x)", () => {
  const m = makeMapper({ x: [-4, 4], y: [-4, 4] }, { x: 0, y: 0, w: 600, h: 600 });
  assert.ok(samplePlot(compileFn("1/x"), m).length >= 2);
});
t("sample tan breaks", () => {
  const m = makeMapper({ x: [-6, 6], y: [-5, 5] }, { x: 0, y: 0, w: 600, h: 600 });
  assert.ok(samplePlot(compileFn("tan(x)"), m).length >= 3);
});
t("sample sub-range", () => {
  const m = makeMapper({ x: [0, 10], y: [0, 10] }, { x: 0, y: 0, w: 500, h: 500 });
  const l = samplePlot(compileFn("x"), m, [2, 4]);
  assert.ok(Math.abs(l[0][0][0] - 100) < 1e-6);
});

/* ── scheduler (async) ───────────────────────────────────────────────── */
const tick = () => new Promise((r) => setTimeout(r, 2));
function rig(opts = {}) {
  const log = [];
  const stops = [];
  const voice = { prepare: (text) => { log.push("prep:" + text); let done; return {
    duration: 0.01, ready: opts.slowReady ? new Promise(() => {}) : Promise.resolve(true),
    play: () => new Promise((r) => { done = r; setTimeout(r, 5); }), stop: () => { stops.push(text); done?.(); } }; } };
  const board = { play: (b) => { log.push("draw:" + b.say); return new Promise((r) => setTimeout(r, 5)); }, finishNow: () => log.push("finish") };
  const ev = [];
  const sch = createScheduler({ board, voice, clock: { sleep: () => tick() },
    onBeat: (b) => ev.push("beat:" + b.say), onAsk: (b) => ev.push("ask:" + b.say), onIdle: () => ev.push("idle"), onEnd: () => ev.push("end") });
  return { sch, log, ev, stops };
}
const until = async (f, ms = 2000) => { const t0 = Date.now(); while (!f()) { if (Date.now() - t0 > ms) throw new Error("timeout"); await tick(); } };

await (async () => {
  const { sch, ev } = rig();
  sch.begin();
  sch.push({ say: "one", do: [] }); sch.push({ say: "two", do: [] }); sch.done();
  await until(() => ev.includes("idle"));
  assert.deepEqual(ev, ["beat:one", "beat:two", "idle"]); n++;
})();
await (async () => {
  const { sch, ev } = rig();
  sch.begin();
  sch.push({ say: "q", ask: true, do: [] }); sch.push({ say: "after", do: [] }); sch.done();
  await until(() => ev.includes("ask:q"));
  await new Promise((r) => setTimeout(r, 40));
  assert.ok(!ev.includes("beat:after"), "beats after an ask are not said"); n++;
})();
await (async () => {
  const { sch, ev, stops, log } = rig();
  sch.begin();
  sch.push({ say: "a", do: [] }); sch.push({ say: "b", do: [] }); sch.push({ say: "c", do: [] });
  await until(() => ev.includes("beat:b"));
  const rec = sch.interrupt();
  assert.deepEqual(rec.spoken.map((b) => b.say), ["a"]);
  assert.equal(rec.partial.say, "b");
  assert.ok(stops.includes("b") && log.includes("finish"));
  await new Promise((r) => setTimeout(r, 40));
  assert.ok(!ev.includes("beat:c"), "nothing after an interrupt"); n++;
  sch.push({ say: "stale", do: [] }, 1);
  await new Promise((r) => setTimeout(r, 20));
  assert.ok(!ev.includes("beat:stale")); n++;
})();
await (async () => {
  const { sch, ev } = rig({ slowReady: true });
  sch.begin(); sch.push({ say: "slow", do: [] }); sch.done();
  await until(() => ev.includes("idle"));
  assert.ok(ev.includes("beat:slow"), "a slow voice does not stall the lesson"); n++;
})();

console.log(`check-whiteboard: ${n} checks passed`);
