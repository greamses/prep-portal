/*
 * competition-gate.js — the password on a competition paper (Scholastic, ANMC).
 *
 * Each paper has ONE password, set by the admin on the Exam Builder's
 * Competitions tab (compPasswords/{comp__div__year__round}). Nobody but the
 * admin opens a paper without it: not premium, not an old share link.
 *
 * This is the box on the PAGE. The lock itself is on the server: the questions
 * come from /api/cbt/competition, which checks the same password (sent by
 * quiz-engine.js from sessionStorage) before it hands anything over.
 *
 * /utils/archive-guard.js (first script in <head>) hides the page for every
 * source=competition visit and leaves the decision to this module, so the
 * failure mode is closed: if this file never loads, nothing is revealed.
 */
import { auth } from "/firebase-init.js";
import { onAuthStateChanged } from "firebase/auth";

const ADMIN_EMAIL = "eemadanyel@gmail.com";
const API_BASE = ["localhost", "127.0.0.1"].includes(location.hostname) ? "http://localhost:3000" : "";
const qp = new URLSearchParams(location.search);
const paper = { comp: qp.get("comp") || "", div: qp.get("div") || "", year: qp.get("year") || "", round: qp.get("round") || "" };
export const passKey = `pp-comp-pw:${[paper.comp, paper.div, paper.year, paper.round].join("|")}`;

function reveal() {
  document.getElementById("ag-hide")?.remove();
  document.getElementById("cg-box")?.remove();
}

const CARD = "min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem;"
  + "font-family:'JetBrains Mono',ui-monospace,monospace;text-align:center;color:#2a2723;background:#f0ece3";
const BTN = "display:inline-block;margin:.25rem;padding:.6rem 1.1rem;border:0;border-radius:0;cursor:pointer;"
  + "font:inherit;font-weight:700;color:#2a2723;text-decoration:none";

function whenBody(fn) { if (document.body) fn(); else document.addEventListener("DOMContentLoaded", fn); }

function block(title, message, loginHref) {
  whenBody(() => {
    document.body.innerHTML =
      `<div style="${CARD}"><div style="max-width:30rem">`
      + `<h1 style="font-family:Unbounded,system-ui,sans-serif;font-size:1.4rem;margin:0 0 .6rem">${title}</h1>`
      + `<p style="font-size:.85rem;line-height:1.6;color:#6b655c;margin:0 0 1.2rem">${message}</p>`
      + (loginHref ? `<a href="${loginHref}" style="${BTN};background:#f4c95d">Sign in</a>` : "")
      + `<a href="/exam-archive/national/exams/" style="${BTN};background:#fffdf8;border:2px solid rgba(42,39,35,.14)">Practice papers</a>`
      + `</div></div>`;
    reveal();
  });
}

/* the password box, over the hidden page; resolves once the server has said yes */
function askPassword(user, first = "") {
  whenBody(() => {
    const box = document.createElement("div");
    box.id = "cg-box";
    box.style.cssText = `position:fixed;inset:0;z-index:2147483000;visibility:visible;${CARD}`;
    box.innerHTML =
      `<form style="max-width:26rem;width:100%" autocomplete="off">`
      + `<h1 style="font-family:Unbounded,system-ui,sans-serif;font-size:1.3rem;margin:0 0 .5rem">This paper is locked</h1>`
      + `<p style="font-size:.85rem;line-height:1.6;color:#6b655c;margin:0 0 1.4rem">Type the paper's password. Your teacher or the organiser has it.</p>`
      + `<input name="pw" type="password" aria-label="Paper password" placeholder="Password" `
      + `style="width:100%;box-sizing:border-box;padding:.5rem .1rem;border:0;border-bottom:2px solid rgba(42,39,35,.45);border-radius:0;background:transparent;font:inherit;font-size:1rem;text-align:center;outline:none">`
      + `<p data-msg style="min-height:1.4em;font-size:.8rem;color:#b5473a;margin:.6rem 0 .8rem">${first}</p>`
      + `<button type="submit" style="${BTN};background:#f4c95d">Open the paper</button>`
      + `<a href="/exam-archive/national/exams/" style="${BTN};background:#fffdf8;border:2px solid rgba(42,39,35,.14)">Back</a>`
      + `</form>`;
    // over the page's own hiding veil, so the box is the one thing seen
    document.body.appendChild(box);
    const form = box.querySelector("form"), input = form.pw, msg = form.querySelector("[data-msg]");
    input.focus();
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const password = input.value.trim();
      if (!password) { msg.textContent = "Type the password first."; return; }
      form.querySelector("button").disabled = true;
      msg.style.color = "#6b655c"; msg.textContent = "Checking…";
      const v = await check(user, password);
      form.querySelector("button").disabled = false;
      if (v.ok) {
        try { sessionStorage.setItem(passKey, password); } catch { /* the page still opens */ }
        reveal();
        window.dispatchEvent(new Event("pp-comp-unlocked"));
        return;
      }
      msg.style.color = "#b5473a"; msg.textContent = v.error;
      input.select();
    });
  });
}

async function check(user, password) {
  try {
    const r = await fetch(`${API_BASE}/api/cbt/competition/unlock`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` },
      body: JSON.stringify({ ...paper, password }),
    });
    const d = await r.json().catch(() => ({}));
    return r.ok ? { ok: true } : { ok: false, error: d.error || "That password is not right." };
  } catch {
    return { ok: false, error: "Could not reach the server. Check your connection and try again." };
  }
}

// Resolves with the signed-in user, or null if there is none (or auth stalls).
function currentUser() {
  return new Promise((resolve) => {
    let unsub = () => {};
    const timer = setTimeout(() => { unsub(); resolve(auth.currentUser || null); }, 8000);
    unsub = onAuthStateChanged(auth, (user) => {
      clearTimeout(timer);
      setTimeout(() => unsub(), 0);
      resolve(user || null);
    });
  });
}

async function decide() {
  const user = await currentUser();
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    block("Sign in to open this paper", "Competition papers open with their password once you are signed in.", `/?login=1&next=${next}`);
    return;
  }
  if (user.email === ADMIN_EMAIL) { reveal(); return; }
  // a password already typed this session: check it is still the paper's password
  let kept = "";
  try { kept = sessionStorage.getItem(passKey) || ""; } catch { /* none */ }
  if (kept) {
    const v = await check(user, kept);
    if (v.ok) { reveal(); return; }
    try { sessionStorage.removeItem(passKey); } catch { /* gone anyway */ }
    askPassword(user, "The password has changed. Type the new one.");
    return;
  }
  askPassword(user);
}

if ((qp.get("source") || "").toLowerCase() === "competition") decide();
