import { state } from "../utils/state.js";

// Tracks a touch from start so we can tell a TAP (no movement → select / place /
// double-tap delete) from a DRAG (movement → ghost). Lets mobile taps work even
// though StPageFlip pointer handling is off.
let touchStart = null;
const TAP_SLOP = 8;

export function updatePPProgress(exerIdx) {
  const allSlots = document.querySelectorAll(
    `.pp-slot[data-exer-idx="${exerIdx}"]`,
  );
  const requiredSlots = document.querySelectorAll(
    `.pp-slot[data-correct][data-exer-idx="${exerIdx}"]`,
  );
  const filled = [...allSlots].filter((s) => s.dataset.placed).length;
  const total = requiredSlots.length;
  const pct = total ? Math.min((filled / total) * 100, 100) : 0;

  const fill = document.getElementById(`ppProg-${exerIdx}`);
  const text = document.getElementById(`ppProgText-${exerIdx}`);
  if (fill) fill.style.width = pct + "%";
  if (text) text.textContent = `${filled} / ${total} placed`;
}

export function deselectToken() {
  if (state.drag.selected) {
    state.drag.selected.classList.remove("pp-token--selected");
    state.drag.selected = null;
  }
  state.drag.char = null;
}

export function clearSlot(slot) {
  delete slot.dataset.placed;
  delete slot.dataset.lastTap;
  slot.textContent = "";
  slot.classList.remove(
    "pp-slot--filled",
    "pp-slot--correct",
    "pp-slot--wrong",
    "pp-slot--hover",
  );
  slot.setAttribute("draggable", "false");
  updatePPProgress(parseInt(slot.dataset.exerIdx));
}

export function placeInSlot(slot, char) {
  slot.dataset.placed = char;
  slot.textContent = char;
  slot.classList.add("pp-slot--filled");
  slot.classList.remove("pp-slot--correct", "pp-slot--wrong", "pp-slot--hover");
  slot.setAttribute("draggable", "true");
  updatePPProgress(parseInt(slot.dataset.exerIdx));
}

export function tryPlaceInSlot(slot, char, sentence) {
  if (slot.dataset.placed) {
    clearSlot(slot);
    placeInSlot(slot, char);
    return;
  }
  const maxSlots = parseInt(sentence.dataset.maxSlots || 99);
  const filled = [...sentence.querySelectorAll(".pp-slot")].filter(
    (s) => s.dataset.placed,
  ).length;
  if (filled >= maxSlots) return;
  placeInSlot(slot, char);
}

export function buildToken(char) {
  const el = document.createElement("span");
  el.className = "pp-token";
  el.dataset.char = char;
  el.textContent = char;
  el.setAttribute("draggable", "true");
  el.setAttribute("title", `Drag '${char}'`);

  el.addEventListener("mousedown", (e) => e.stopPropagation());

  el.addEventListener("dragstart", (e) => {
    e.stopPropagation();
    deselectToken();
    state.drag.char = char;
    state.drag.sourceSlot = null;
    e.dataTransfer.setData("text/plain", char);
    e.dataTransfer.effectAllowed = "copy";
    el.classList.add("pp-token--dragging");
  });
  el.addEventListener("dragend", () =>
    el.classList.remove("pp-token--dragging"),
  );

  el.addEventListener("click", (e) => {
    e.stopPropagation();
    if (state.drag.selected === el) {
      deselectToken();
      return;
    }
    deselectToken();
    state.drag.char = char;
    state.drag.selected = el;
    el.classList.add("pp-token--selected");
  });

  el.addEventListener(
    "touchstart",
    (e) => {
      e.stopPropagation();
      deselectToken();
      state.drag.char = char;
      state.drag.sourceSlot = null;
      state.drag.selected = el;
      el.classList.add("pp-token--selected");
      const t = e.touches[0];
      touchStart = { x: t.clientX, y: t.clientY, moved: false, kind: "token" };
    },
    { passive: true },
  );
  el.addEventListener(
    "touchend",
    (e) => {
      // Tap = select (done on touchstart). Suppress the synthetic click so it
      // is not handled twice; drags are finished by the global touchend.
      if (touchStart && !touchStart.moved) e.preventDefault();
    },
    { passive: false },
  );

  return el;
}

export function tokenizeSentence(item) {
  const tokens = [];
  let wordCount = 0;

  item.forEach((seg) => {
    if (typeof seg === "string") {
      const words = seg.trim().split(/\s+/).filter(Boolean);
      words.forEach((word) => {
        if (tokens.length > 0 && tokens[tokens.length - 1].type === "word") {
          tokens.push({ type: "slot", correct: null });
        }
        tokens.push({
          type: "word",
          text: wordCount === 0 ? word : " " + word,
        });
        wordCount++;
      });
    } else {
      if (tokens.length > 0 && tokens[tokens.length - 1].type === "slot") {
        tokens[tokens.length - 1].correct = seg.correct;
      } else {
        tokens.push({ type: "slot", correct: seg.correct });
      }
    }
  });

  if (tokens.length > 0 && tokens[tokens.length - 1].type === "word") {
    tokens.push({ type: "slot", correct: null });
  }

  return tokens;
}

export function findNearestSlot(sentence, clientX) {
  const slots = sentence.querySelectorAll(".pp-slot");
  let nearest = null,
    nearestDist = Infinity;
  slots.forEach((slot) => {
    const rect = slot.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const dist = Math.abs(clientX - cx);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = slot;
    }
  });
  return nearest;
}

export function findNearestSlotInContainer(container, clientX, clientY) {
  const slots = container.querySelectorAll(".pp-slot");
  let nearest = null,
    nearestDist = Infinity;
  slots.forEach((slot) => {
    const rect = slot.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dist = Math.sqrt((clientX - cx) ** 2 + (clientY - cy) ** 2);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = slot;
    }
  });
  return nearest;
}

export function buildSentenceRow(item, itemIdx, exerIdx) {
  const tokens = tokenizeSentence(item);
  const requiredCount = tokens.filter(
    (t) => t.type === "slot" && t.correct,
  ).length;
  const commaCount = tokens.filter(
    (t) => t.type === "slot" && t.correct === ",",
  ).length;

  const row = document.createElement("div");
  row.className = "pp-item";

  const num = document.createElement("span");
  num.className = "pp-item-num";
  num.textContent = itemIdx + 1 + ".";
  row.appendChild(num);

  const wrap = document.createElement("span");
  wrap.className = "pp-sentence";
  wrap.dataset.exerIdx = exerIdx;
  wrap.dataset.itemIdx = itemIdx;
  wrap.dataset.maxSlots = requiredCount;

  tokens.forEach((token) => {
    if (token.type === "word") {
      const span = document.createElement("span");
      span.className = "pp-word";
      span.textContent = token.text;
      wrap.appendChild(span);
    } else {
      const slot = document.createElement("span");
      slot.className = "pp-slot";
      slot.dataset.exerIdx = exerIdx;
      slot.dataset.itemIdx = itemIdx;
      if (token.correct) slot.dataset.correct = token.correct;

      slot.addEventListener("mousedown", (e) => e.stopPropagation());

      slot.addEventListener("click", (e) => {
        e.stopPropagation();
        if (slot.dataset.placed) {
          // Double-tap to remove
          const now = Date.now();
          const lastTap = parseInt(slot.dataset.lastTap || 0);
          if (now - lastTap < 400) {
            clearSlot(slot);
          } else {
            slot.dataset.lastTap = now;
            // Brief flash to confirm first tap registered
            slot.classList.add("pp-slot--tap1");
            setTimeout(() => slot.classList.remove("pp-slot--tap1"), 350);
          }
          return;
        }
        if (state.drag.char) {
          tryPlaceInSlot(slot, state.drag.char, wrap);
          deselectToken();
        }
      });

      slot.setAttribute("draggable", "false");
      slot.addEventListener("dragstart", (e) => {
        if (!slot.dataset.placed) {
          e.preventDefault();
          return;
        }
        e.stopPropagation();
        state.drag.char = slot.dataset.placed;
        state.drag.sourceSlot = slot;
        e.dataTransfer.setData("text/plain", slot.dataset.placed);
        e.dataTransfer.effectAllowed = "move";
      });
      slot.addEventListener("dragend", () => {
        state.drag.char = null;
        state.drag.sourceSlot = null;
      });

      // Empty slots are 0-width snap targets — not tappable themselves. Touch
      // taps are handled at the container level (place / delete by nearest
      // slot to the tap point); see buildSentences().
      wrap.appendChild(slot);
    }
  });

  row.appendChild(wrap);

  if (commaCount > 0) {
    const hint = document.createElement("span");
    hint.className = "pp-needs";
    hint.textContent = commaCount + " ,";
    row.appendChild(hint);
  }

  return row;
}

export function buildSentences(items, start, end, exerIdx, container) {
  for (let i = start; i < end && i < items.length; i++) {
    container.appendChild(buildSentenceRow(items[i], i, exerIdx));
  }
}

// Wire a rendered `.pp-items` container as a drop zone (desktop drag-and-drop +
// touch tap-to-place / tap-to-remove). This MUST run on the actual per-page
// `.pp-items` element: pagination moves the sentence rows out of the build host
// into per-page containers, so listeners left on the build host are orphaned and
// drag-and-drop silently does nothing. See pages.js makePunctPracticePages.
export function wireDropZone(container) {
  // ── Touch: tap anywhere in the items area places the selected mark at the
  //    nearest slot, or removes the mark you tap. A press-and-drag instead
  //    moves a placed mark out (handled by the global touchmove/touchend). ──
  container.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    const slot = e.target.closest?.(".pp-slot");
    const onFilled = slot && slot.dataset.placed;
    touchStart = { x: t.clientX, y: t.clientY, moved: false, kind: onFilled ? "itemsFilled" : "items" };
    if (onFilled) { state.drag.char = slot.dataset.placed; state.drag.sourceSlot = slot; }
  }, { passive: true });

  container.addEventListener("touchend", (e) => {
    if (!touchStart || touchStart.moved) return; // a drag — global handles it
    const t = e.changedTouches[0];

    if (touchStart.kind === "itemsFilled") {
      // tapped a placed mark → remove it
      e.preventDefault();
      const tapped = document.elementFromPoint(t.clientX, t.clientY)?.closest?.(".pp-slot");
      const target = tapped?.dataset.placed ? tapped : findNearestSlotInContainer(container, t.clientX, t.clientY);
      if (target?.dataset.placed) clearSlot(target);
      state.drag.char = null;
      state.drag.sourceSlot = null;
      return;
    }
    if (state.drag.char) {
      // a token is selected → place it at the nearest slot to the tap
      const nearest = findNearestSlotInContainer(container, t.clientX, t.clientY);
      const sentence = nearest?.closest(".pp-sentence");
      if (nearest && sentence) {
        e.preventDefault();
        tryPlaceInSlot(nearest, state.drag.char, sentence);
        deselectToken();
      }
    }
  }, { passive: false });

  // Container-level drop zone: catches drops anywhere on the items area
  // and magnets to the nearest slot (2D distance)
  container.addEventListener("dragover", (e) => {
    if (!state.drag.char) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = state.drag.sourceSlot ? "move" : "copy";

    const nearest = findNearestSlotInContainer(container, e.clientX, e.clientY);
    container.querySelectorAll(".pp-slot--hover").forEach((s) =>
      s.classList.remove("pp-slot--hover"),
    );
    if (nearest) nearest.classList.add("pp-slot--hover");
  });

  container.addEventListener("dragleave", (e) => {
    if (e.relatedTarget && container.contains(e.relatedTarget)) return;
    container.querySelectorAll(".pp-slot--hover").forEach((s) =>
      s.classList.remove("pp-slot--hover"),
    );
  });

  container.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    container.querySelectorAll(".pp-slot--hover").forEach((s) =>
      s.classList.remove("pp-slot--hover"),
    );

    const char = state.drag.char || e.dataTransfer.getData("text/plain");
    if (!char) return;
    const nearest = findNearestSlotInContainer(container, e.clientX, e.clientY);
    if (!nearest) return;
    const sentence = nearest.closest(".pp-sentence");
    if (!sentence) return;

    if (state.drag.sourceSlot && state.drag.sourceSlot !== nearest)
      clearSlot(state.drag.sourceSlot);
    tryPlaceInSlot(nearest, char, sentence);
    state.drag.char = null;
    state.drag.sourceSlot = null;
  });
}

export function createGhost(char, touch) {
  if (state.drag.ghost) state.drag.ghost.remove();
  const g = document.createElement("span");
  g.className = "pp-drag-ghost";
  g.textContent = char;
  document.body.appendChild(g);
  state.drag.ghost = g;
  moveGhost(touch);
}

export function moveGhost(touch) {
  if (!state.drag.ghost) return;
  state.drag.ghost.style.left = touch.clientX - 19 + "px";
  state.drag.ghost.style.top = touch.clientY - 19 + "px";
}

export function checkExercise(exerIdx) {
  const sentences = document.querySelectorAll(
    `.pp-sentence[data-exer-idx="${exerIdx}"]`,
  );
  let totalRequired = 0,
    totalCorrect = 0;

  sentences.forEach((sentence) => {
    const allSlots = [...sentence.querySelectorAll(".pp-slot")];
    const requiredSlots = allSlots.filter((s) => s.dataset.correct);

    // Only highlight the placed marks red/green — never reveal the answer.
    allSlots.forEach((slot) => {
      slot.classList.remove("pp-slot--correct", "pp-slot--wrong");
      if (!slot.dataset.placed) return;
      const correct =
        slot.dataset.correct && slot.dataset.placed === slot.dataset.correct;
      slot.classList.add(correct ? "pp-slot--correct" : "pp-slot--wrong");
    });

    totalRequired += requiredSlots.length;
    totalCorrect += requiredSlots.filter(
      (s) => s.dataset.placed === s.dataset.correct,
    ).length;
  });

  const pct = totalRequired
    ? Math.round((totalCorrect / totalRequired) * 100)
    : 0;
  const tier = pct === 100 ? "perfect" : pct >= 70 ? "good" : "low";
  const scoreEl = document.getElementById(`ppScore-${exerIdx}`);
  if (scoreEl) {
    scoreEl.innerHTML = `<span class="pc-score-pill pc-score-pill--${tier}">${pct === 100 ? "✨ " : ""}${totalCorrect} / ${totalRequired} correct</span>`;
  }
}

export function resetExercise(exerIdx) {
  document
    .querySelectorAll(`.pp-slot[data-exer-idx="${exerIdx}"]`)
    .forEach(clearSlot);
  document
    .querySelectorAll(`.pp-sentence[data-exer-idx="${exerIdx}"]`)
    .forEach((s) => {
      s.closest(".pp-item")?.querySelector(".pp-correct-answer")?.remove();
    });
  const scoreEl = document.getElementById(`ppScore-${exerIdx}`);
  if (scoreEl) scoreEl.innerHTML = "";
  deselectToken();
}

// ── Touch global listeners (lazy ghost: only a real drag creates one) ───────
document.addEventListener(
  "touchmove",
  (e) => {
    if (!touchStart) return;
    const t = e.touches[0];

    if (!touchStart.moved) {
      if (Math.abs(t.clientX - touchStart.x) < TAP_SLOP &&
          Math.abs(t.clientY - touchStart.y) < TAP_SLOP) return;
      touchStart.moved = true;
      // Only tokens and placed marks can be dragged; elsewhere allow scroll.
      if (touchStart.kind !== "token" && touchStart.kind !== "itemsFilled") return;
      if (state.drag.char && !state.drag.ghost) createGhost(state.drag.char, t);
    }

    if (!state.drag.ghost) return;
    e.preventDefault();
    moveGhost(t);

    state.drag.ghost.style.visibility = "hidden";
    const under = document.elementFromPoint(t.clientX, t.clientY);
    state.drag.ghost.style.visibility = "";

    const container = under?.closest(".pp-items");
    document.querySelectorAll(".pp-slot--hover").forEach((s) => s.classList.remove("pp-slot--hover"));
    if (container) {
      const nearest = findNearestSlotInContainer(container, t.clientX, t.clientY);
      if (nearest) nearest.classList.add("pp-slot--hover");
    }
  },
  { passive: false },
);

document.addEventListener("touchend", (e) => {
  if (state.drag.ghost) {
    const touch = e.changedTouches[0];
    state.drag.ghost.style.visibility = "hidden";
    const under = document.elementFromPoint(touch.clientX, touch.clientY);
    state.drag.ghost.remove();
    state.drag.ghost = null;
    document.querySelectorAll(".pp-slot--hover").forEach((s) => s.classList.remove("pp-slot--hover"));

    const container = under?.closest(".pp-items");
    if (container && state.drag.char) {
      const nearest = findNearestSlotInContainer(container, touch.clientX, touch.clientY);
      const sentence = nearest?.closest(".pp-sentence");
      if (sentence) {
        if (state.drag.sourceSlot && state.drag.sourceSlot !== nearest) clearSlot(state.drag.sourceSlot);
        tryPlaceInSlot(nearest, state.drag.char, sentence);
      }
    }
    state.drag.char = null;
    state.drag.sourceSlot = null;
  }
  touchStart = null;
});
