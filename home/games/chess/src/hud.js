/**
 * hud.js — thin wrapper over the DOM overlay: turn indicator, status pill,
 * captured-piece trays, and the promotion picker. Knows nothing about 3D.
 */
import { GLYPH } from "./config.js";

export function createHUD() {
  const turnDot = document.getElementById("turn-dot");
  const turnText = document.getElementById("turn-text");
  const statusPill = document.getElementById("status-pill");
  const capWhite = document.getElementById("captured-white");
  const capBlack = document.getElementById("captured-black");
  const hint = document.getElementById("hint");
  const undoBtn = document.getElementById("btn-undo");

  const promo = document.getElementById("promo");
  const promoOptions = document.getElementById("promo-options");

  function setTurn(side) {
    turnDot.dataset.side = side;
    turnText.textContent = `${side === "white" ? "White" : "Black"} to move`;
  }

  // While the computer searches, show a thinking state on the turn card.
  function setThinking(on) {
    if (on) {
      turnDot.dataset.side = "black";
      turnText.textContent = "Computer thinking…";
    }
  }

  function setStatus(status, side) {
    if (status === "checkmate") {
      const winner = side === "white" ? "Black" : "White";
      show(statusPill, `Checkmate — ${winner} wins`, "win");
    } else if (status === "stalemate") {
      show(statusPill, "Stalemate — draw", "win");
    } else if (status === "check") {
      show(statusPill, "Check!", "check");
    } else {
      statusPill.hidden = true;
    }
  }

  function show(el, text, kind) {
    el.textContent = text;
    el.dataset.kind = kind;
    el.hidden = false;
    // restart the pop animation
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "";
  }

  // Captured pieces are grouped by which side lost them.
  function renderCaptured(captured) {
    capWhite.innerHTML = captured.white
      .map((t) => `<span>${GLYPH.white[t]}</span>`)
      .join("");
    capBlack.innerHTML = captured.black
      .map((t) => `<span>${GLYPH.black[t]}</span>`)
      .join("");
  }

  function setUndoEnabled(on) {
    undoBtn.disabled = !on;
  }

  function fadeHint() {
    if (hint) hint.style.opacity = "0";
  }

  /** Show the promotion picker; resolves with chosen type ('q'|'r'|'b'|'n'). */
  function askPromotion(side) {
    return new Promise((resolve) => {
      const types = ["q", "r", "b", "n"];
      promoOptions.innerHTML = "";
      for (const t of types) {
        const btn = document.createElement("button");
        btn.className = "promo-opt";
        btn.textContent = GLYPH[side][t];
        btn.addEventListener(
          "click",
          () => {
            promo.hidden = true;
            resolve(t);
          },
          { once: true }
        );
        promoOptions.appendChild(btn);
      }
      promo.hidden = false;
    });
  }

  return {
    setTurn,
    setThinking,
    setStatus,
    renderCaptured,
    setUndoEnabled,
    fadeHint,
    askPromotion,
  };
}
