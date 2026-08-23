/**
 * Algebra Moves API — the engine behind /prep-math/activity/algebra-moves,
 * exposed over HTTP so it can be inspected, scripted and tested without a
 * browser.
 *
 * `eq` takes an EXPRESSION as readily as an equation: leave the equals sign out
 * and the moves on offer are the tidying ones.
 *
 *   GET /api/algebra/parse?eq=3x+5=20
 *        The tree the typed line becomes, plus what it reads back as. Read-back
 *        stability is a hard requirement of the site's linear maths input, and
 *        this is where you can check it on anything.
 *
 *   GET /api/algebra/moves?eq=3x+5=20
 *        Every term, and the legal moves offered on each — the exact menu the
 *        page shows when you tap it, with the line each one would produce.
 *
 *   GET /api/algebra/apply?eq=3x+5=20&term=1&move=across
 *        Make one move. `term` is the term's INDEX (left to right, both sides),
 *        because node ids are only stable within one parse and would be
 *        meaningless between two requests.
 *
 *   GET /api/algebra/solve?eq=3x+5=20
 *        The whole worked solution, line by line, with the reason for each.
 *
 *   GET /api/algebra/solve?eq=v=u%2Bat&given=u:5,a:2,t:3
 *        The same, for a formula: `given` pins letters to values, and the first
 *        moves are the substitutions. Works on /moves and /apply too.
 *
 *   GET /api/algebra/formulas
 *        The formula shelf the page offers, with what each letter stands for.
 *
 *   GET /api/algebra/check?from=3x+5=20&to=3x=20-5
 *        Run the verifier on any two equations, whether or not this engine
 *        produced them. This is the interesting one: it is the same gate every
 *        move passes through before a student is allowed to see it.
 *
 * WHY THIS IMPORTS THE BROWSER MODULES DIRECTLY
 * ---------------------------------------------
 * There is exactly one implementation of the algebra, and it lives with the
 * page. A server-side copy would be a second set of rules free to drift from
 * the first — which for a tool whose whole promise is "it cannot show you a
 * wrong line" is the worst possible place to keep a duplicate. The engine has
 * no DOM dependency at parse/rewrite/verify time (layout.js only reaches for a
 * canvas when something is actually being measured), so it loads here as-is.
 *
 * Those files are ES modules and this server is CommonJS, so they come in
 * through a dynamic import, cached after the first call. They are also listed
 * in vercel.json `includeFiles`, because a dynamic import is not something the
 * bundler's tracer can follow on its own.
 *
 * PUBLIC, DELIBERATELY. No auth, no AI spend, no data access — it is a pure
 * function of its query string. It is capped on input length and step count so
 * it cannot be used as a compute faucet.
 */

const express = require("express");
const path = require("path");
const { pathToFileURL } = require("url");

const ENGINE_DIR = path.join(__dirname, "..", "..", "prep-math", "activity", "algebra-moves", "js");
const load = (file) => import(pathToFileURL(path.join(ENGINE_DIR, file)).href);

let enginePromise = null;
function engine() {
  if (!enginePromise) {
    enginePromise = Promise.all([
      load("parse.js"), load("ast.js"), load("ops.js"),
      load("verify.js"), load("layout.js"), load("solve.js"), load("formulas.js"),
    ]).then(([parse, ast, ops, verify, layout, solve, formulas]) => ({
      parse: parse.parse, A: ast, ops, verify: verify.preservesSolutions,
      plain: layout.plain, solve: solve.solve, isSolved: solve.isSolved,
      formulas,
    }));
  }
  return enginePromise;
}

const MAX_INPUT = 200;

/** Read one line off the query string, or explain why it cannot be read. */
function read(E, raw, field = "eq") {
  if (typeof raw !== "string" || !raw.trim()) {
    return { error: `Give me an equation or an expression in "${field}", e.g. ${field}=3x+5%3D20` };
  }
  if (raw.length > MAX_INPUT) {
    return { error: `That is longer than ${MAX_INPUT} characters.` };
  }
  try {
    return { eq: E.parse(raw) };
  } catch (err) {
    return { error: err.message };
  }
}

/** The terms a student can tap, in the order the page lays them out. */
const termList = (E, eq) => E.A.allTerms(eq);

/* Values for the letters of a formula, written the way a question gives them:
   given=u:5,a:2,t:3. Returned as the exact rationals every move works in, or an
   explanation of which piece could not be read. */
function readGiven(E, raw) {
  if (typeof raw !== "string" || !raw.trim()) return { given: null };
  if (raw.length > MAX_INPUT) return { error: `That is longer than ${MAX_INPUT} characters.` };

  const given = {};
  for (const piece of raw.split(",")) {
    const m = /^\s*([A-Za-z])\s*[:=]\s*(\S+)\s*$/.exec(piece);
    if (!m) return { error: `I cannot read "${piece.trim()}" — write it as u:5 or u=5.` };
    const v = E.formulas.readValue(m[2]);
    if (!v) return { error: `"${m[2]}" is not a number I can use for ${m[1]}.` };
    given[m[1]] = v;
  }
  return { given: Object.keys(given).length ? given : null };
}

/** A node as plain JSON — ids included, since they are what the animation uses. */
function describe(E, node) {
  const out = { id: node.id, kind: node.kind };
  if (node.kind === "num") out.value = { n: String(node.v.n), d: String(node.v.d) };
  if (node.kind === "var") out.name = node.name;
  if (node.paren) out.bracketed = true;
  const kids = E.A.kidsOf(node);
  if (kids.length) out.kids = kids.map((k) => describe(E, k));
  return out;
}

module.exports = function algebraRoutes() {
  const router = express.Router();

  router.use((req, res, next) => {
    res.set("Cache-Control", "public, max-age=60");
    next();
  });

  /* ── What the line becomes ───────────────────────────────────────────── */
  router.get("/parse", async (req, res) => {
    const E = await engine();
    const got = read(E, req.query.eq);
    if (got.error) return res.status(400).json({ ok: false, error: got.error });

    const { eq } = got;
    res.json({
      ok: true,
      typed: req.query.eq,
      reads: E.plain(eq),
      kind: eq.kind === "expr" ? "expression" : "equation",
      stable: E.plain(E.parse(E.plain(eq).replace(/−/g, "-").replace(/·/g, "*"))) === E.plain(eq),
      variables: E.A.varsIn(eq),
      terms: termList(E, eq).map((t, i) => ({
        index: i,
        side: eq.kind === "expr" ? "only" : E.A.termsOf(eq.l).includes(t) ? "left" : "right",
        reads: E.plain(t),
        numeric: E.A.isNumeric(t),
      })),
      tree: describe(E, eq),
    });
  });

  /* ── The menu the page would show ────────────────────────────────────── */
  router.get("/moves", async (req, res) => {
    const E = await engine();
    const got = read(E, req.query.eq);
    if (got.error) return res.status(400).json({ ok: false, error: got.error });
    const vals = readGiven(E, req.query.given);
    if (vals.error) return res.status(400).json({ ok: false, error: vals.error });

    const { eq } = got;
    const { given } = vals;
    const pinned = given ? E.ops.asNumbers(given) : null;

    const terms = termList(E, eq).map((term, index) => ({
      index,
      reads: E.plain(term),
      moves: E.ops.offers(eq, term.id, { given }).map((offer) => {
        const result = offer.run();
        const verdict = result.error
          ? null
          : E.verify(eq, result.eq, { given: pinned, scaledBy: result.scaledBy });
        return {
          move: offer.key,
          label: offer.label,
          mark: offer.mark || null,
          why: offer.hint,
          gives: result.error ? null : E.plain(result.eq),
          note: result.note || null,
          // Every offer is checked here too, exactly as the page checks it.
          verified: verdict ? verdict.ok : false,
          refused: result.error || (verdict && !verdict.ok ? verdict.why : null),
        };
      }),
    }));

    res.json({ ok: true, reads: E.plain(eq), given: given ? E.ops.asNumbers(given) : null, terms });
  });

  /* ── Make one move ───────────────────────────────────────────────────── */
  router.get("/apply", async (req, res) => {
    const E = await engine();
    const got = read(E, req.query.eq);
    if (got.error) return res.status(400).json({ ok: false, error: got.error });

    const { eq } = got;
    const terms = termList(E, eq);
    const index = Number(req.query.term);
    if (!Number.isInteger(index) || index < 0 || index >= terms.length) {
      return res.status(400).json({
        ok: false,
        error: `"term" must be an index from 0 to ${terms.length - 1}.`,
        terms: terms.map((t, i) => ({ index: i, reads: E.plain(t) })),
      });
    }

    const vals = readGiven(E, req.query.given);
    if (vals.error) return res.status(400).json({ ok: false, error: vals.error });
    const { given } = vals;

    const offered = E.ops.offers(eq, terms[index].id, { given });
    const offer = offered.find((o) => o.key === req.query.move);
    if (!offer) {
      return res.status(400).json({
        ok: false,
        error: `"${req.query.move}" is not on offer for ${E.plain(terms[index])}.`,
        available: offered.map((o) => ({ move: o.key, label: o.label })),
      });
    }

    const result = offer.run();
    if (result.error) return res.status(409).json({ ok: false, refused: result.error });

    // The gate. Nothing leaves here unverified, for the same reason nothing
    // reaches the screen unverified.
    const verdict = E.verify(eq, result.eq, {
      given: given ? E.ops.asNumbers(given) : null,
      scaledBy: result.scaledBy,
    });
    if (!verdict.ok) return res.status(409).json({ ok: false, refused: verdict.why });

    res.json({
      ok: true,
      was: E.plain(eq),
      move: offer.key,
      label: offer.label,
      note: result.note,
      now: E.plain(result.eq),
      solved: E.isSolved(result.eq, { given }),
    });
  });

  /* ── The whole thing, worked ─────────────────────────────────────────── */
  router.get("/solve", async (req, res) => {
    const E = await engine();
    const got = read(E, req.query.eq);
    if (got.error) return res.status(400).json({ ok: false, error: got.error });

    const vals = readGiven(E, req.query.given);
    if (vals.error) return res.status(400).json({ ok: false, error: vals.error });

    const worked = E.solve(got.eq, { maxSteps: 24, given: vals.given });
    res.json({
      ok: true,
      solved: worked.solved,
      answer: worked.solved ? worked.steps[worked.steps.length - 1].equation : null,
      stuck: worked.stuck || null,
      steps: worked.steps,
    });
  });

  /* ── Is that step legal? ─────────────────────────────────────────────── */
  router.get("/check", async (req, res) => {
    const E = await engine();
    const a = read(E, req.query.from, "from");
    const b = read(E, req.query.to, "to");
    if (a.error || b.error) {
      return res.status(400).json({ ok: false, error: a.error || b.error });
    }

    const vals = readGiven(E, req.query.given);
    if (vals.error) return res.status(400).json({ ok: false, error: vals.error });

    const verdict = E.verify(a.eq, b.eq, {
      given: vals.given ? E.ops.asNumbers(vals.given) : null,
    });
    const asExpression = a.eq.kind === "expr" || b.eq.kind === "expr";
    res.json({
      ok: true,
      from: E.plain(a.eq),
      to: E.plain(b.eq),
      kind: asExpression ? "expression" : "equation",
      same: verdict.ok,
      why: verdict.ok
        ? asExpression ? "same value everywhere" : "same solutions"
        : verdict.why,
    });
  });

  /* ── What is here ────────────────────────────────────────────────────── */
  router.get("/formulas", async (_req, res) => {
    const E = await engine();
    res.json({
      ok: true,
      what: "The formulas the page offers, and the letters each one wants.",
      formulas: E.formulas.ALL.map((f) => ({
        id: f.id,
        group: f.group,
        name: f.name,
        formula: f.eq,
        letters: f.letters,
        usuallyFinds: f.find,
        example: f.example,
        note: f.note || null,
      })),
      note: "Feed one to /solve as eq= with given=u:5,a:2,t:3.",
    });
  });

  router.get("/", (_req, res) => {
    res.json({
      ok: true,
      what: "The algebra engine behind /prep-math/activity/algebra-moves.",
      endpoints: {
        "GET /api/algebra/parse?eq=":  "the tree, and whether it reads back unchanged",
        "GET /api/algebra/moves?eq=":  "every term and the legal moves on it",
        "GET /api/algebra/apply?eq=&term=&move=": "make one move",
        "GET /api/algebra/solve?eq=":  "the whole worked solution",
        "GET /api/algebra/check?from=&to=": "is that step legal?",
        "GET /api/algebra/formulas":  "the formula shelf and the letters each one wants",
      },
      moves: ["substitute", "across", "combine", "divide", "times", "cancel", "flip", "expand", "swap", "dropzero", "workout"],
      takes: {
        eq: "an equation (3x+5=20) or an expression with no equals sign (3x+5-x)",
        given: "values for a formula's letters, u:5,a:2,t:3 — accepted by moves, apply and solve",
      },
      note: "Type = as %3D in a query string, and + as %2B.",
    });
  });

  return router;
};
