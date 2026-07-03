/* ============================================================================
   Bearing Courier — HUD
   ----------------------------------------------------------------------------
   Everything the pilot reads: a scrolling compass ribbon (current bearing under
   a fixed centre marker), a North-up radar with the target blip, the delivery
   card (required bearing / distance / a "turn X° left/right" coach line), the
   timer + score, and the end overlay. Two small canvases (compass, radar) are
   redrawn each frame; the rest is text.
   ========================================================================== */

import { CFG } from "./config.js";
import { fmt3, angleDelta, norm360 } from "./bearing.js";

const $ = (s) => document.querySelector(s);

export function createHud() {
  const compass = $("#dr-compass");
  const cctx = compass.getContext("2d");
  const radar = $("#dr-radar");
  const rctx = radar.getContext("2d");

  fitCanvas(compass, cctx);
  fitCanvas(radar, rctx);
  window.addEventListener("resize", () => {
    fitCanvas(compass, cctx);
    fitCanvas(radar, rctx);
  });

  function setScore(done, target) {
    $("#dr-score").textContent = `${done} / ${target}`;
  }

  function setTimer(msLeft) {
    const s = Math.max(0, Math.ceil(msLeft / 1000));
    const t = $("#dr-timer");
    t.textContent = `0:${String(s).padStart(2, "0")}`;
    t.classList.toggle("dr-low", s <= 10);
  }

  function setCard(n, target, label, houseLabel) {
    $("#dr-card-num").textContent = `PKG ${n} / ${target}`;
    $("#dr-card-tag").textContent = label;
    $("#dr-card-house").textContent = houseLabel;
  }

  /** Per-frame readouts + the coaching line. `phase` is "toDrop" | "toBase".
      The required bearing homes live onto the target, so it's updated here. */
  function tick(state) {
    const { droneBearing, requiredBearing, distanceM, altM, overTarget, lowEnough, phase } = state;
    $("#dr-heading").textContent = fmt3(droneBearing) + "°";
    $("#dr-alt").textContent = `${altM} m`;
    $("#dr-card-bearing").textContent = fmt3(requiredBearing) + "°";
    $("#dr-card-dist").textContent = `${distanceM} m`;

    const off = angleDelta(droneBearing, requiredBearing); // −180..180
    const hint = $("#dr-hint");
    const card = $("#dr-card");
    const verb = phase === "toBase" ? "pick up" : "drop";
    if (overTarget) {
      if (lowEnough) {
        hint.textContent = phase === "toBase" ? "PICK UP!  next carton" : "DROP!  carton away";
        hint.className = "dr-hint dr-good";
      } else {
        hint.textContent = `descend below ${CFG.landAlt * CFG.metresPerUnit} m to ${verb}`;
        hint.className = "dr-hint dr-warn";
      }
    } else if (Math.abs(off) <= CFG.bearingSnap) {
      hint.textContent = "on course — fly forward (W)";
      hint.className = "dr-hint dr-good";
    } else {
      const dir = off > 0 ? "right (D)" : "left (A)";
      hint.textContent = `turn ${Math.abs(Math.round(off))}° ${dir}`;
      hint.className = "dr-hint";
    }
    card.classList.toggle("dr-locked", Math.abs(off) <= CFG.bearingSnap);
    card.classList.toggle("dr-return", phase === "toBase");

    drawCompass(cctx, compass, droneBearing, requiredBearing);
    drawRadar(rctx, radar, droneBearing);
  }

  function showEnd(won, done, target) {
    const ov = $("#dr-end");
    $("#dr-end-title").textContent = won ? "DELIVERY COMPLETE" : "TIME'S UP";
    $("#dr-end-msg").textContent = won
      ? `All ${target} packages delivered by bearing. Ace pilot!`
      : `You delivered ${done} of ${target}. Line up the bearing and try again.`;
    ov.classList.toggle("dr-won", won);
    ov.hidden = false;
  }

  function hideEnd() { $("#dr-end").hidden = true; }

  return { setScore, setTimer, setCard, tick, showEnd, hideEnd };
}

/* ── HUD show/hide toggle (persisted; the stick figures need the screen too) ─*/
const HUD_HIDDEN_KEY = "dr-hud-hidden";

export function initHudToggle() {
  const stage = $(".drone-stage");
  const btn = $("#dr-hud-toggle");
  const eye = $("#dr-hud-toggle-eye");
  const slash = $("#dr-hud-toggle-slash");
  if (!stage || !btn) return;

  function apply(hidden) {
    stage.classList.toggle("dr-hud-hidden", hidden);
    btn.setAttribute("aria-pressed", String(hidden));
    btn.setAttribute("aria-label", hidden ? "Show flight HUD" : "Hide flight HUD");
    if (eye) eye.style.display = hidden ? "none" : "";
    if (slash) slash.style.display = hidden ? "" : "none";
    // The compass/radar canvases are 0×0 while their panel is display:none;
    // re-measure once they're shown again (createHud() listens for this).
    if (!hidden) window.dispatchEvent(new Event("resize"));
  }

  let hidden = false;
  try { hidden = localStorage.getItem(HUD_HIDDEN_KEY) === "1"; } catch (e) {}
  apply(hidden);

  btn.addEventListener("click", () => {
    hidden = !hidden;
    apply(hidden);
    try { localStorage.setItem(HUD_HIDDEN_KEY, hidden ? "1" : "0"); } catch (e) {}
  });
}

/* ── canvas helpers ────────────────────────────────────────────────────────*/

function fitCanvas(cv, ctx) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const r = cv.getBoundingClientRect();
  cv.width = Math.max(1, r.width * dpr);
  cv.height = Math.max(1, r.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/** Scrolling tape of bearings; the fixed centre notch reads the drone bearing,
    and a green pip marks where the required bearing sits. */
function drawCompass(ctx, cv, bearing, required) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = cv.width / dpr, H = cv.height / dpr;
  ctx.clearRect(0, 0, W, H);
  const pxPerDeg = W / 90; // show a 90° window
  const cx = W / 2;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const LABELS = { 0: "N", 45: "NE", 90: "E", 135: "SE", 180: "S", 225: "SW", 270: "W", 315: "NW" };

  for (let d = -50; d <= 50; d += 5) {
    const b = norm360(bearing + d);
    const x = cx + d * pxPerDeg;
    if (x < -20 || x > W + 20) continue;
    const major = b % 45 === 0;
    const mid = b % 15 === 0;
    ctx.strokeStyle = major ? "rgba(255,255,255,0.9)" : mid ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.28)";
    ctx.lineWidth = major ? 2 : 1;
    const h = major ? 14 : mid ? 10 : 6;
    ctx.beginPath();
    ctx.moveTo(x, H - h - 16);
    ctx.lineTo(x, H - 16);
    ctx.stroke();
    if (major) {
      ctx.fillStyle = LABELS[b] === "N" ? "#f0a868" : "rgba(255,255,255,0.92)";
      ctx.font = "700 13px 'JetBrains Mono', monospace";
      ctx.fillText(LABELS[b] || fmt3(b), x, H - h - 26);
    }
  }

  // required-bearing pip (green) if within the visible window
  const off = angleDelta(bearing, required);
  if (Math.abs(off) <= 50) {
    const x = cx + off * pxPerDeg;
    ctx.fillStyle = "#7cc47c";
    ctx.beginPath();
    ctx.moveTo(x, H - 34);
    ctx.lineTo(x - 6, H - 46);
    ctx.lineTo(x + 6, H - 46);
    ctx.closePath();
    ctx.fill();
  }

  // fixed centre marker (current heading)
  ctx.fillStyle = "#f0a868";
  ctx.beginPath();
  ctx.moveTo(cx, H - 12);
  ctx.lineTo(cx - 7, H - 2);
  ctx.lineTo(cx + 7, H - 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = "700 16px 'JetBrains Mono', monospace";
  ctx.textBaseline = "top";
  ctx.fillText(fmt3(bearing) + "°", cx, 2);
}

/** North-up heading compass. Shows only where the drone is pointing (an amber
    needle) against the compass rose — NO target blip, so the pilot must fly the
    quoted bearing to find the hidden drop. The tick marks read the heading. */
function drawRadar(ctx, cv, droneBearing) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = cv.width / dpr, H = cv.height / dpr;
  const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 4;
  ctx.clearRect(0, 0, W, H);
  if (R <= 0) return; // canvas is mid-resize or its panel is hidden (dr-hud-hidden)

  // dial
  ctx.fillStyle = "rgba(10,20,30,0.55)";
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.5, 0, Math.PI * 2); ctx.stroke();

  // cardinal ticks + labels (fixed, North-up)
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const LB = [["N", 0], ["E", 90], ["S", 180], ["W", 270]];
  for (const [lab, deg] of LB) {
    const a = deg * Math.PI / 180;
    const ox = Math.sin(a), oy = -Math.cos(a);
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.moveTo(cx + ox * R, cy + oy * R);
    ctx.lineTo(cx + ox * R * 0.82, cy + oy * R * 0.82);
    ctx.stroke();
    ctx.fillStyle = lab === "N" ? "#f0a868" : "rgba(255,255,255,0.8)";
    ctx.font = "700 11px 'JetBrains Mono', monospace";
    ctx.fillText(lab, cx + ox * R * 0.68, cy + oy * R * 0.68);
  }

  // heading needle (where the drone is pointing) — North-up, clockwise
  const hr = droneBearing * Math.PI / 180;
  const nx = Math.sin(hr), ny = -Math.cos(hr);
  ctx.strokeStyle = "#f0a868";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - nx * R * 0.2, cy - ny * R * 0.2);
  ctx.lineTo(cx + nx * R * 0.82, cy + ny * R * 0.82);
  ctx.stroke();
  // arrowhead
  ctx.fillStyle = "#f0a868";
  const hx = cx + nx * R * 0.82, hy = cy + ny * R * 0.82;
  const pa = hr + Math.PI * 0.85, pb = hr - Math.PI * 0.85;
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.lineTo(hx + Math.sin(pa) * 8, hy - Math.cos(pa) * 8);
  ctx.lineTo(hx + Math.sin(pb) * 8, hy - Math.cos(pb) * 8);
  ctx.closePath();
  ctx.fill();
  // hub
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
}
