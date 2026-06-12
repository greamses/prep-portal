/* =====================================================================
   Algo Lab — the module/category browser of OLL/PLL (and friends)
   algorithms, plus playing a chosen algorithm back on the cube (optionally
   setting up its inverse first so you watch it get solved).
   ===================================================================== */
import { TURN_MS } from "./constants.js";
import { cubies, cubeGroup, rebuildSolved } from "./scene.js";
import { S } from "./state.js";
import { movesEl } from "./dom.js";
import { queue, pump, applyAlgoInstant } from "./engine.js";
import { parseMoves, invertMoves } from "./moves.js";
import { renderThumb } from "./thumbs.js";
import { setStatus } from "./ui.js";
import { clearSolution } from "./scan-play.js";
import { releaseMove } from "./game-flow.js";
import { gsapRef } from "./gsap.js";
import { ALGO_MODULES } from "./algs.js";

let algoListBuilt = false;
let activeModuleId = null;

export function buildAlgoList() {
  if (algoListBuilt) return;
  algoListBuilt = true;
  const switcher = document.getElementById("algo-modules");
  if (switcher) {
    switcher.innerHTML = "";
    ALGO_MODULES.forEach((mod) => {
      const b = document.createElement("button");
      b.className = "algo-mod-btn";
      b.textContent = mod.label;
      b.dataset.module = mod.id;
      b.addEventListener("click", () => showModule(mod.id));
      switcher.appendChild(b);
    });
  }
  showModule(ALGO_MODULES[0].id);
}

function showModule(id) {
  activeModuleId = id;
  const mod = ALGO_MODULES.find((m) => m.id === id);
  const host = document.getElementById("algo-list");
  if (!mod || !host) return;
  document
    .querySelectorAll(".algo-mod-btn")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.module === id)),
    );
  const hint = document.querySelector(".mode-algos .algo-hint");
  if (hint) hint.textContent = mod.hint || "";

  host.innerHTML = "";
  let tint = 0;
  mod.groups.forEach((grp, gi) => {
    const cat = document.createElement("div");
    cat.className = "algo-cat" + (gi === 0 ? " open" : "");
    const head = document.createElement("button");
    head.className = "algo-cat-head";
    head.innerHTML = `<span>${grp.cat}</span><span class="algo-cat-chev">▾</span>`;
    const body = document.createElement("div");
    body.className = "algo-cat-body";
    if (gi !== 0) body.style.height = "0px";
    head.addEventListener("click", () => toggleAccordion(cat, body));
    grp.items.forEach((algo) => {
      const card = document.createElement("button");
      card.className = "algo-card tc-" + (tint++ % 6);
      card.innerHTML =
        `<img class="algo-thumb" alt="" src="${renderThumb(algo, mod.setup)}" />` +
        `<span class="algo-body"><span class="algo-name">${algo.name}</span>` +
        `<span class="algo-moves">${algo.moves}</span></span>`;
      card.addEventListener("click", () => playAlgo(algo, card, mod.setup));
      body.appendChild(card);
    });
    cat.appendChild(head);
    cat.appendChild(body);
    host.appendChild(cat);
  });
  const gsap = gsapRef.current;
  if (gsap)
    gsap.from(host.querySelectorAll(".algo-cat"), {
      x: -24,
      autoAlpha: 0,
      stagger: 0.05,
      duration: 0.4,
      ease: "back.out(1.7)",
      overwrite: true,
    });
}

function toggleAccordion(cat, body) {
  const opening = !cat.classList.contains("open");
  cat.classList.toggle("open", opening);
  const gsap = gsapRef.current;
  if (!gsap) {
    body.style.height = opening ? "auto" : "0px";
    return;
  }
  gsap.killTweensOf(body);
  if (opening) {
    gsap.fromTo(
      body,
      { height: 0, opacity: 0 },
      {
        height: "auto",
        opacity: 1,
        duration: 0.34,
        ease: "power2.out",
        onComplete: () => (body.style.height = "auto"),
      },
    );
  } else {
    gsap.to(body, { height: 0, opacity: 0, duration: 0.28, ease: "power2.in" });
  }
}

function enqueueAlgo(moves) {
  for (const t of parseMoves(moves)) {
    queue.push({
      type: "face",
      dir: t.turn.dir,
      layers: t.turn.layers,
      prime: t.prime,
      double: t.double,
      notation: t.base + (t.double ? "2" : t.prime ? "'" : ""),
      dur: TURN_MS,
    });
  }
  pump();
}

function playAlgo(algo, card, isSetup) {
  if (S.gameMode !== "algo" || S.animating || S.scrambling) return;
  clearSolution();
  queue.length = 0;
  releaseMove();
  rebuildSolved();
  cubeGroup.quaternion.identity();
  S.moveCount = 0;
  movesEl.textContent = "0";
  document
    .querySelectorAll(".algo-card")
    .forEach((c) => c.setAttribute("aria-pressed", String(c === card)));

  if (isSetup) {
    applyAlgoInstant(cubies, invertMoves(algo.moves));
    setStatus(algo.name + " — set up · solving…");
    setTimeout(() => {
      setStatus(algo.name + " — " + algo.moves);
      enqueueAlgo(algo.moves);
    }, 820);
  } else {
    setStatus(algo.name + " — " + algo.moves);
    setTimeout(() => enqueueAlgo(algo.moves), 260);
  }
}
