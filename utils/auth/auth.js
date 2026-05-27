// Account page — shows user profile and plan status.
// API key management has been removed; all AI keys are backend-supplied.
import { auth, db } from "../../firebase-init.js";
import {
  doc,
  getDoc,
} from "firebase/firestore";

function showStatus(type, msg, duration = 3000) {
  const bar = document.getElementById("status-bar");
  if (!bar) return;
  bar.className = `status-bar ${type}`;
  bar.textContent = msg;
  if (duration) {
    setTimeout(() => {
      if (bar.className === `status-bar ${type}`) bar.className = "status-bar";
    }, duration);
  }
}

function initials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function injectTicker() {
  const items = [
    "PrepBot", "Essay Grader", "Theory Analyser", "Algebra Lab",
    "WAEC Prep", "JAMB Prep", "IGCSE", "Cambridge", "Common Entrance",
    "AI Powered", "Secure", "No Keys Needed",
  ];
  const track = document.getElementById("ticker-track");
  if (!track) return;
  const doubled = [...items, ...items];
  track.innerHTML = doubled
    .map((i) => `<span class="ticker-item">${i}<span class="ticker-dot"></span></span>`)
    .join("");
}

function initNav() {
  const toggle = document.getElementById("nav-toggle");
  const links = document.getElementById("nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      toggle.classList.toggle("open");
      links.classList.toggle("open");
    });
  }
}

async function handleAuthStateChanged(user) {
  const gate = document.getElementById("auth-gate");

  if (!user) {
    if (gate) {
      gate.innerHTML = `
        <div class="gate-spinner"></div>
        <span class="gate-lbl">No active session — please sign in</span>
        <button class="btn-primary" style="margin-top:20px;background:var(--ink);color:var(--yellow);border:none;padding:12px 24px;cursor:pointer;" onclick="window.location.href='../login/login.html'">
          Go to Login
        </button>`;
    }
    return;
  }

  if (gate) {
    gate.classList.add("hidden");
    setTimeout(() => gate.remove(), 400);
  }

  injectTicker();
  initNav();

  // Populate profile card
  const displayName = user.displayName || user.email?.split("@")[0] || "User";
  const avatar = document.getElementById("user-avatar");
  const nameEl = document.getElementById("user-name");
  const emailEl = document.getElementById("user-email");
  const planBadge = document.getElementById("plan-badge");
  const planLabel = document.getElementById("plan-label");

  if (avatar) avatar.textContent = initials(displayName);
  if (nameEl) nameEl.textContent = displayName;
  if (emailEl) emailEl.textContent = user.email || "";

  // Load plan from Firestore
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    const data = snap.data() || {};
    const plan = data.planName || (data.isPremium ? "Premium" : "Free");
    if (planLabel) planLabel.textContent = plan;
    if (planBadge) {
      planBadge.className = `kc-status ${data.isPremium ? "stored" : "idle"}`;
    }
  } catch {
    // Firestore unavailable — show defaults
  }

  // Sign out
  document.getElementById("signout-btn")?.addEventListener("click", async () => {
    try {
      await auth.signOut();
      window.location.href = "../login/login.html";
    } catch (err) {
      showStatus("error", `Sign out failed: ${err.message}`);
    }
  });
}

auth.onAuthStateChanged(handleAuthStateChanged);
