/*
 * competition-gate.js — who may open a competition paper (Scholastic, ANMC).
 *
 * The competition papers are not on general release. The admin and PREMIUM
 * users can open any of them (premium is `isPremium` on users/{uid}, the same
 * flag every premium page reads); everyone else needs a link the admin made for
 * that exact paper (the
 * Exam Builder's "Copy link" on the Competitions tab). Such a link carries a
 * code, `k`, which names a `paperShares/{code}` document recording the paper it
 * was made for. No code, a code for a different paper, or a code the admin has
 * since deleted — and the page stays shut.
 *
 * /utils/archive-guard.js (first script in <head>) hides the page for every
 * source=competition visit and leaves the decision to this module, so the
 * failure mode is closed: if this file never loads, nothing is revealed.
 *
 * Note this is a gate on the PAGE. The papers themselves are static files, so
 * it keeps honest visitors out; it is not a lock on the data.
 */
import { auth, db } from "/firebase-init.js";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const ADMIN_EMAIL = "eemadanyel@gmail.com";
const qp = new URLSearchParams(location.search);

// The paper a URL names — the same string the builder stores on the share.
const paperKey = (p) => ["comp", "div", "year", "round"].map((k) => p.get(k) || "").join("|");

function reveal() {
  const hide = document.getElementById("ag-hide");
  if (hide) hide.remove();
}

function block(title, message, loginHref) {
  const paint = () => {
    const link = (href, label, primary) =>
      `<a href="${href}" style="display:inline-block;margin:.25rem;padding:.6rem 1.1rem;border-radius:0;` +
      (primary ? "background:#f4c95d;" : "background:#fffdf8;border:2px solid rgba(42,39,35,.14);") +
      `color:#2a2723;text-decoration:none;font-weight:700">${label}</a>`;
    document.body.innerHTML =
      '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem;' +
      'font-family:ui-monospace,monospace;text-align:center;color:#2a2723;background:#f0ece3">' +
      '<div style="max-width:30rem">' +
      `<h1 style="font-family:Unbounded,system-ui,sans-serif;font-size:1.4rem;margin:0 0 .6rem">${title}</h1>` +
      `<p style="font-size:.85rem;line-height:1.6;color:#6b655c;margin:0 0 1.2rem">${message}</p>` +
      (loginHref ? link(loginHref, "Sign in", true) : link("/exam-archive/national/exams/index.html", "Practice papers", true)) +
      link("/", "Home", false) +
      "</div></div>";
    reveal();
  };
  if (document.body) paint();
  else document.addEventListener("DOMContentLoaded", paint);
}

// Not premium and no link: say both ways in.
function blockWithPlans() {
  block("This paper is for premium members", "Competition papers open with a premium plan, or with a link from your teacher.");
  const add = () => {
    const box = document.querySelector("body > div > div");
    if (!box || box.querySelector("[data-plans]")) return;
    const a = document.createElement("a");
    a.href = "/subscribe.html#plans";
    a.dataset.plans = "1";
    a.textContent = "See plans";
    a.style.cssText = "display:inline-block;margin:.25rem;padding:.6rem 1.1rem;border-radius:0;background:#f4c95d;color:#2a2723;text-decoration:none;font-weight:700";
    box.insertBefore(a, box.querySelector("a"));
  };
  if (document.body) add(); else document.addEventListener("DOMContentLoaded", add);
}

// Resolves with the signed-in user, or null if there is none (or auth stalls).
function currentUser() {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(auth.currentUser || null), 8000);
    const unsub = onAuthStateChanged(auth, (user) => {
      clearTimeout(timer);
      unsub();
      resolve(user || null);
    });
  });
}

async function decide() {
  const user = await currentUser();
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    block("Sign in to open this paper", "This practice paper was shared with you. Sign in and it will open.", `/index.html?login=1&next=${next}`);
    return;
  }
  if (user.email === ADMIN_EMAIL) { reveal(); return; }

  /* a premium user needs no link. A failed read is not a "no": it falls
     through to the link check, so the page still fails closed. */
  try {
    const me = await getDoc(doc(db, "users", user.uid));
    if (me.exists() && me.data().isPremium === true) { reveal(); return; }
  } catch (e) {
    console.warn("[competition-gate] could not read the profile:", e);
  }

  const code = (qp.get("k") || "").trim();
  if (!/^[A-Za-z0-9]{6,32}$/.test(code)) {
    blockWithPlans();
    return;
  }
  try {
    const snap = await getDoc(doc(db, "paperShares", code));
    if (snap.exists() && snap.data().key === paperKey(qp)) { reveal(); return; }
  } catch (e) {
    console.warn("[competition-gate] could not check the link:", e);
  }
  block("This link does not open a paper", "It may have been withdrawn, or part of it is missing. Ask for a fresh link.");
}

if ((qp.get("source") || "").toLowerCase() === "competition") decide();
