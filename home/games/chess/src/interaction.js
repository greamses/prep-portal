/**
 * interaction.js — turns taps into moves.
 *
 * Owns the mapping between the rules engine's board and the 3D piece groups,
 * raycasts pointer taps onto squares/pieces, shows legal-move highlights, and
 * animates moves (lift-and-place, knight hops, captures sinking off-board,
 * castling rook slides, promotions). The rules engine decides legality; this
 * module only visualises and reports moves back.
 */
import * as THREE from "three";
import { squareToWorld, BOARD } from "./config.js";
import { createPiece, BACK_RANK, placePieceAt } from "./pieces/index.js";
import { chooseMove } from "./ai.js";

const LIFT = 0.6; // how high a piece arcs when moving
const MOVE_DUR = 0.42; // seconds

export function createInteraction({ scene, camera, controls, dom, board, game, hud }) {
  const objs = Array.from({ length: 8 }, () => Array(8).fill(null)); // objs[file][rank]
  const root = new THREE.Group();
  scene.add(root);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const anims = []; // active tweens
  let selected = null; // {file, rank}
  let legal = []; // legal moves for selected
  let busy = false; // input lock during animation
  let gameOver = false;
  const captured = { white: [], black: [] };

  // AI opponent. aiDepth = null disables it (two-player hotseat).
  let aiDepth = null;
  const AI_SIDE = "black"; // the computer always plays Black

  /* ---------------- Highlights ---------------- */
  const highlights = new THREE.Group();
  scene.add(highlights);

  const selRing = makeRing(0.46, 0.5, 0xffd66b);
  highlights.add(selRing);
  selRing.visible = false;

  const checkRing = makeRing(0.42, 0.52, 0xff4d4d);
  highlights.add(checkRing);
  checkRing.visible = false;

  const dotPool = [];
  const capPool = [];
  function getDot() {
    let d = dotPool.find((m) => !m.visible);
    if (!d) {
      d = new THREE.Mesh(
        new THREE.CircleGeometry(0.16, 24),
        new THREE.MeshBasicMaterial({ color: 0x6be3a0, transparent: true, opacity: 0.85 })
      );
      d.rotation.x = -Math.PI / 2;
      highlights.add(d);
      dotPool.push(d);
    }
    d.visible = true;
    return d;
  }
  function getCapRing() {
    let m = capPool.find((x) => !x.visible);
    if (!m) {
      m = makeRing(0.4, 0.5, 0xff7a59);
      highlights.add(m);
      capPool.push(m);
    }
    m.visible = true;
    return m;
  }

  function makeRing(inner, outer, color) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(inner, outer, 40),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    return ring;
  }

  function clearHighlights() {
    selRing.visible = false;
    dotPool.forEach((d) => (d.visible = false));
    capPool.forEach((c) => (c.visible = false));
  }

  /* ---------------- Build / reset board ---------------- */
  function setup() {
    // Remove any existing piece groups.
    for (let f = 0; f < 8; f++)
      for (let r = 0; r < 8; r++) {
        if (objs[f][r]) {
          root.remove(objs[f][r]);
          disposeGroup(objs[f][r]);
          objs[f][r] = null;
        }
      }
    captured.white.length = 0;
    captured.black.length = 0;
    selected = null;
    legal = [];
    gameOver = false;

    for (let f = 0; f < 8; f++) {
      spawn(BACK_RANK[f], "white", f, 0);
      spawn("p", "white", f, 1);
      spawn("p", "black", f, 6);
      spawn(BACK_RANK[f], "black", f, 7);
    }
    refreshCheckRing();
    hud.setTurn(game.turn);
    hud.setStatus("normal");
    hud.renderCaptured(captured);
    hud.setUndoEnabled(false);
  }

  function spawn(type, side, file, rank) {
    const g = createPiece(type, side);
    placePieceAt(g, file, rank);
    g.userData.square = { file, rank };
    objs[file][rank] = g;
    root.add(g);
    return g;
  }

  /* ---------------- Picking ---------------- */
  function squareFromEvent(ev) {
    const rect = dom.getBoundingClientRect();
    pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    // Pieces first (taller, easier to hit), then board tiles.
    const targets = [];
    for (let f = 0; f < 8; f++)
      for (let r = 0; r < 8; r++) if (objs[f][r]) targets.push(objs[f][r]);
    const pieceHits = raycaster.intersectObjects(targets, true);
    if (pieceHits.length) {
      let o = pieceHits[0].object;
      while (o && !o.userData.square) o = o.parent;
      if (o) return o.userData.square;
    }
    const tileHits = raycaster.intersectObjects(flatTiles(), false);
    if (tileHits.length) return tileHits[0].object.userData.square;
    return null;
  }

  let _tiles = null;
  function flatTiles() {
    if (_tiles) return _tiles;
    _tiles = [];
    for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) _tiles.push(board.squareMeshes[f][r]);
    return _tiles;
  }

  /* ---------------- Selection + move ---------------- */
  function selectSquare(sq) {
    const piece = game.at(sq.file, sq.rank);
    if (!piece || piece.side !== game.turn) return false;
    selected = sq;
    legal = game.legalMoves(sq.file, sq.rank);
    showHighlights();
    return true;
  }

  function showHighlights() {
    clearHighlights();
    if (!selected) return;
    const w = squareToWorld(selected.file, selected.rank, 0.02);
    selRing.position.set(w.x, 0.02, w.z);
    selRing.visible = true;
    for (const m of legal) {
      const tw = squareToWorld(m.to.file, m.to.rank, 0.02);
      const isCapture =
        game.at(m.to.file, m.to.rank) || m.flags.enPassant;
      const marker = isCapture ? getCapRing() : getDot();
      marker.position.set(tw.x, 0.02, tw.z);
    }
  }

  function deselect() {
    selected = null;
    legal = [];
    clearHighlights();
  }

  async function tryMove(to) {
    const m = legal.find((x) => x.to.file === to.file && x.to.rank === to.rank);
    if (!m) return false;

    // Lock input up front so a stray tap during the promotion prompt can't
    // kick off a second move.
    busy = true;
    let promo = "q";
    if (m.flags.promotion) {
      promo = await hud.askPromotion(game.turn);
    }
    deselect();
    return performMove(m, promo);
  }

  /** Execute an already-legal move object (used by both human and AI). */
  function performMove(m, promo = "q") {
    const mover = game.turn;
    const result = game.move(m.from, m.to, promo);
    if (!result) {
      busy = false;
      return false;
    }
    busy = true;
    animateResult(result, mover, () => {
      busy = false;
      afterMove(result, mover);
      maybeAIMove();
    });
    return true;
  }

  function afterMove(result, mover) {
    hud.setTurn(game.turn);
    // game.turn is now the side to move — i.e. the side in check / checkmated.
    hud.setStatus(result.status, game.turn);
    hud.renderCaptured(captured);
    hud.setUndoEnabled(game.history.length > 0);
    refreshCheckRing();
    if (result.status === "checkmate" || result.status === "stalemate") {
      gameOver = true;
    }
  }

  /** If the AI is on and it's its turn, think (off the paint frame) and move. */
  function maybeAIMove() {
    if (aiDepth == null || gameOver || game.turn !== AI_SIDE) return;
    busy = true; // block taps while the computer thinks
    hud.setThinking(true);
    // Defer so the "thinking" label paints before the (synchronous) search.
    setTimeout(() => {
      const m = chooseMove(game, AI_SIDE, aiDepth);
      hud.setThinking(false);
      if (!m) {
        busy = false;
        return;
      }
      performMove(m, "q");
    }, 220);
  }

  /* ---------------- Animations ---------------- */
  function animateResult(result, mover, done) {
    const { move, captured: cap, capturedSquare, rookMove, enPassant, promotion } = result;
    const piece = objs[move.from.file][move.from.rank];

    // Remove a captured piece (sink + shrink, then drop into the tray).
    if (cap) {
      const capObj = objs[capturedSquare.file][capturedSquare.rank];
      if (capObj) {
        captured[cap.side].push(cap.type);
        sinkAndRemove(capObj, capturedSquare.file, capturedSquare.rank);
        objs[capturedSquare.file][capturedSquare.rank] = null;
      }
    }

    // Move the piece group in the object grid.
    objs[move.from.file][move.from.rank] = null;
    objs[move.to.file][move.to.rank] = piece;
    piece.userData.square = { file: move.to.file, rank: move.to.rank };

    const isKnight = piece.userData.type === "n";
    const to = squareToWorld(move.to.file, move.to.rank);
    glide(piece, to, isKnight ? LIFT * 1.6 : LIFT, () => {
      if (promotion) swapPromoted(move.to.file, move.to.rank, mover, promotion);
      done();
    });

    // Slide the castled rook alongside (no arc — it rolls).
    if (rookMove) {
      const rook = objs[rookMove.from.file][rookMove.from.rank];
      if (rook) {
        objs[rookMove.from.file][rookMove.from.rank] = null;
        objs[rookMove.to.file][rookMove.to.rank] = rook;
        rook.userData.square = { file: rookMove.to.file, rank: rookMove.to.rank };
        glide(rook, squareToWorld(rookMove.to.file, rookMove.to.rank), 0.1);
      }
    }
  }

  function swapPromoted(file, rank, side, type) {
    const old = objs[file][rank];
    if (old) {
      root.remove(old);
      disposeGroup(old);
    }
    const g = spawn(type, side, file, rank);
    g.scale.setScalar(0.0);
    popIn(g, 0.92 * 1.0);
  }

  // ---- tiny tween helpers (advanced from main loop via update) ----
  function glide(obj, toVec, arc, onDone) {
    const from = obj.position.clone();
    anims.push({
      obj,
      t: 0,
      dur: MOVE_DUR,
      tick(p) {
        const e = easeInOut(p);
        obj.position.x = from.x + (toVec.x - from.x) * e;
        obj.position.z = from.z + (toVec.z - from.z) * e;
        obj.position.y = Math.sin(Math.PI * p) * arc; // lift arc
      },
      onDone() {
        obj.position.set(toVec.x, 0, toVec.z);
        onDone && onDone();
      },
    });
  }

  function sinkAndRemove(obj, file, rank) {
    anims.push({
      obj,
      t: 0,
      dur: 0.35,
      tick(p) {
        obj.position.y = -p * 0.8;
        obj.scale.setScalar(0.92 * (1 - p) + 0.001);
        obj.rotation.z = p * 0.6;
      },
      onDone() {
        root.remove(obj);
        disposeGroup(obj);
      },
    });
  }

  function popIn(obj, target) {
    anims.push({
      obj,
      t: 0,
      dur: 0.3,
      tick(p) {
        obj.scale.setScalar(target * easeOutBack(p));
      },
      onDone() {
        obj.scale.setScalar(target);
      },
    });
  }

  function update(dt) {
    for (let i = anims.length - 1; i >= 0; i--) {
      const a = anims[i];
      a.t += dt;
      const p = Math.min(a.t / a.dur, 1);
      a.tick(p);
      if (p >= 1) {
        a.onDone && a.onDone();
        anims.splice(i, 1);
      }
    }
    // Gentle idle bob on the selection ring.
    if (selRing.visible) {
      selRing.material.opacity = 0.6 + Math.sin(performance.now() * 0.005) * 0.3;
    }
  }

  /* ---------------- Check indicator ---------------- */
  function refreshCheckRing() {
    checkRing.visible = false;
    const st = game.status();
    if (st === "check" || st === "checkmate") {
      const k = game.findKing(game.turn);
      if (k) {
        const w = squareToWorld(k.file, k.rank, 0.025);
        checkRing.position.set(w.x, 0.025, w.z);
        checkRing.visible = true;
      }
    }
  }

  /* ---------------- Undo ---------------- */
  function undoOnce() {
    const rec = game.undo();
    if (!rec) return false;
    if (rec.captured) {
      const arr = captured[rec.captured.side];
      const idx = arr.lastIndexOf(rec.captured.type);
      if (idx !== -1) arr.splice(idx, 1);
    }
    return true;
  }

  function undo() {
    if (busy || game.history.length === 0) return;
    undoOnce();
    // Versus the computer, also take back its reply so the human is to move.
    if (aiDepth != null && game.turn === AI_SIDE && game.history.length > 0) {
      undoOnce();
    }
    // Easiest correct rebuild: re-sync every square's group from the model.
    resyncFromModel();
    deselect();
    hud.setTurn(game.turn);
    hud.setStatus(game.status() === "check" ? "check" : "normal", game.turn);
    hud.renderCaptured(captured);
    hud.setUndoEnabled(game.history.length > 0);
    refreshCheckRing();
    gameOver = false;
  }

  // Rebuild 3D pieces to match the engine board exactly (used by undo).
  function resyncFromModel() {
    for (let f = 0; f < 8; f++)
      for (let r = 0; r < 8; r++) {
        if (objs[f][r]) {
          root.remove(objs[f][r]);
          disposeGroup(objs[f][r]);
          objs[f][r] = null;
        }
      }
    for (let f = 0; f < 8; f++)
      for (let r = 0; r < 8; r++) {
        const p = game.board[f][r];
        if (p) spawn(p.type, p.side, f, r);
      }
  }

  /* ---------------- Pointer handling ---------------- */
  let downX = 0,
    downY = 0,
    downT = 0;
  function onDown(ev) {
    downX = ev.clientX;
    downY = ev.clientY;
    downT = performance.now();
  }
  function onUp(ev) {
    const moved = Math.hypot(ev.clientX - downX, ev.clientY - downY);
    const dt = performance.now() - downT;
    if (moved > 6 || dt > 500) return; // it was an orbit drag, not a tap
    if (busy || gameOver) return;

    const sq = squareFromEvent(ev);
    if (!sq) {
      deselect();
      return;
    }
    hud.fadeHint();

    if (selected) {
      // Tap a legal destination → move.
      if (legal.some((m) => m.to.file === sq.file && m.to.rank === sq.rank)) {
        tryMove(sq);
        return;
      }
      // Tap the same piece → deselect; another own piece → reselect.
      if (sq.file === selected.file && sq.rank === selected.rank) {
        deselect();
        return;
      }
    }
    if (!selectSquare(sq)) deselect();
  }

  dom.addEventListener("pointerdown", onDown);
  dom.addEventListener("pointerup", onUp);

  /* ---------------- Disposal ---------------- */
  function disposeGroup(g) {
    g.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
    });
  }

  function newGame() {
    game.reset();
    setup();
    maybeAIMove(); // covers the (unused) case where the AI moves first
  }

  /** depth = null disables the AI; a number enables it at that search depth. */
  function setAI(depth) {
    aiDepth = depth;
    if (!gameOver) maybeAIMove(); // jump in if it's already the AI's turn
  }

  return { root, setup, update, undo, newGame, setAI };
}

/* ---- easing ---- */
function easeInOut(p) {
  return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
}
function easeOutBack(p) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
}
