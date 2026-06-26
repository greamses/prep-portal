/* ============================================================================
   3D Maze — settings panel
   ----------------------------------------------------------------------------
   Lets the player choose maze size, riddle-gate count, zombie count and scene.
   Persists to localStorage, writes into CFG, and restarts the maze on apply.
   ========================================================================== */

import { CFG, SIZES, CAM } from "./config.js";

const $ = (s) => document.querySelector(s);
const KEY = "mz-settings";

function save(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }

export function initSettings(onApply) {
  const panel = $("#maze-settings");
  if (!panel) return;

  const sync = () => {
    $("#mz-set-size").value = CFG.sizeKey || "M";
    $("#mz-set-gates").value = String(CFG.gateCount);
    $("#mz-set-zombies").value = String(CFG.ambushCount);
    $("#mz-set-cam").value = CFG.camKey || "Normal";
    $("#mz-set-subject").value = CFG.subject || "all";
    $("#mz-set-scene").value = CFG.scene;
  };

  $("#maze-settings-btn")?.addEventListener("click", () => { sync(); panel.hidden = false; });
  $("#mz-set-close")?.addEventListener("click", () => { panel.hidden = true; });
  panel.addEventListener("click", (e) => { if (e.target === panel) panel.hidden = true; });

  $("#mz-set-apply")?.addEventListener("click", () => {
    const size = $("#mz-set-size").value;
    const gates = +$("#mz-set-gates").value;
    const zombies = +$("#mz-set-zombies").value;
    const cam = $("#mz-set-cam").value;
    const subject = $("#mz-set-subject").value;
    const scene = $("#mz-set-scene").value;
    save({ size, gates, zombies, cam, subject, scene });
    CFG.sizeKey = size;
    CFG.cols = CFG.rows = SIZES[size] || 12;
    CFG.gateCount = gates;
    CFG.ambushCount = zombies;
    CFG.camKey = cam;
    CFG.camDist = CAM[cam] || 3.6;
    CFG.subject = subject;
    CFG.scene = scene;
    panel.hidden = true;
    onApply && onApply();
  });

  sync();
}
