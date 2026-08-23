/* ═══════════════════════════════════════════════════════════════════════════
   API EXPLORER

   Builds the request in front of you and shows you what came back. The URL is
   a real link, so anything you work out here can be copied straight into a
   terminal or a bookmark — which is the whole point of having the engine
   reachable over HTTP rather than only inside the page.
   ═══════════════════════════════════════════════════════════════════════════ */

import { heroPaint } from "/utils/components/nav-icons.js";

const $ = (sel) => document.querySelector(sel);

const VERBS = [
  { id: "solve", label: "solve",  hint: "the whole thing, worked" },
  { id: "moves", label: "moves",  hint: "every term and what is legal on it" },
  { id: "parse", label: "parse",  hint: "the tree, and does it read back" },
  { id: "apply", label: "apply",  hint: "one move — needs a term and a move" },
  { id: "check", label: "check",  hint: "is that step legal?" },
  { id: "formulas", label: "formulas", hint: "the shelf, and what each letter wants" },
];

let verb = "solve";
let applyTerm = 0;
let applyMove = "across";

function url() {
  const eq = $("#ap-eq").value.trim();
  const base = `/api/algebra/${verb}`;
  // Values for a formula's letters ride along on everything that takes an
  // equation — the substitutions are moves like any other.
  const given = $("#ap-given")?.value.trim();
  const pinned = given ? `&given=${encodeURIComponent(given)}` : "";
  if (verb === "formulas") return base;
  if (verb === "check") {
    return `${base}?from=${encodeURIComponent(eq)}&to=${encodeURIComponent($("#ap-to").value.trim())}${pinned}`;
  }
  if (verb === "apply") {
    return `${base}?eq=${encodeURIComponent(eq)}&term=${applyTerm}&move=${encodeURIComponent(applyMove)}${pinned}`;
  }
  return `${base}?eq=${encodeURIComponent(eq)}${pinned}`;
}

function paintUrl() {
  const u = url();
  const link = $("#ap-url");
  link.textContent = u;
  link.href = u;

  $("#ap-second").hidden = verb !== "check";
  $("#ap-line").hidden = verb === "formulas";
  const chosen = VERBS.find((v) => v.id === verb);
  $("#ap-hint").textContent =
    verb === "apply"
      ? `${chosen.hint} — currently term ${applyTerm}, move "${applyMove}". Run "moves" first to see what is on offer.`
      : chosen.hint;
}

async function run() {
  const out = $("#ap-out");
  out.textContent = "…";
  out.classList.remove("is-bad");
  try {
    const res = await fetch(url(), { headers: { accept: "application/json" } });
    const body = await res.json();
    out.textContent = JSON.stringify(body, null, 2);
    if (!res.ok || body.ok === false) out.classList.add("is-bad");

    // After listing the moves, aim "apply" at something that actually exists,
    // so the next click is a working request rather than a 400.
    if (verb === "moves" && body.terms) {
      const withMoves = body.terms.find((t) => t.moves && t.moves.length);
      if (withMoves) {
        applyTerm = withMoves.index;
        applyMove = withMoves.moves[0].move;
      }
    }
  } catch (err) {
    out.textContent = `The request did not come back: ${err.message}`;
    out.classList.add("is-bad");
  }
  paintUrl();
}

function boot() {
  const paint = $(".am-paint");
  if (paint) paint.innerHTML = heroPaint();

  const rail = $("#ap-verbs");
  for (const v of VERBS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pp-pill am-starter am-verb";
    btn.textContent = v.label;
    btn.dataset.verb = v.id;
    btn.addEventListener("click", () => {
      verb = v.id;
      for (const b of rail.children) b.classList.toggle("is-on", b.dataset.verb === verb);
      paintUrl();
      run();
    });
    rail.appendChild(btn);
  }
  rail.firstElementChild.classList.add("is-on");

  for (const id of ["#ap-eq", "#ap-to", "#ap-given"]) {
    $(id).addEventListener("input", paintUrl);
    $(id).addEventListener("keydown", (e) => { if (e.key === "Enter") run(); });
  }

  paintUrl();
  run();
}

boot();
