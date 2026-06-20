import { PLANS } from "/payment-manager.js";
import { auth, db } from "/firebase-init.js";
import { doc, setDoc } from "firebase/firestore";
import { heroPaint } from "/utils/components/nav-icons.js";

const PK = "pk_live_f4ddce00cea983792c801c129d875e64086d68da";

// ─── TUTOR PACKAGES ───────────────────────────────────────────
// Price is per hour. Each extra child beyond the first gets 5% off.
const TUTOR_PACKAGES = [
  {
    id: "math-only",
    name: "Mathematics",
    tagline: "Maths only",
    ratePerHour: 8000,
    features: [
      "All maths topics covered",
      "Algebra, calculus & statistics",
      "WAEC, JAMB & Cambridge prep",
      "Session notes after every class",
    ],
  },
  {
    id: "math-science",
    name: "Maths + Science",
    tagline: "Maths & one Science",
    ratePerHour: 10000,
    features: [
      "Mathematics & one Science subject",
      "Physics, Chemistry or Biology",
      "WAEC, JAMB & Cambridge prep",
      "Session notes after every class",
    ],
  },
  {
    id: "math-english",
    name: "Maths + English",
    tagline: "Maths & English",
    ratePerHour: 12000,
    badge: "Popular",
    features: [
      "Mathematics & English Language",
      "Essay, comprehension & grammar",
      "WAEC & Cambridge prep",
      "Session notes after every class",
    ],
  },
  {
    id: "all-subjects",
    name: "All Subjects",
    tagline: "Maths · English · Science",
    ratePerHour: 15000,
    badge: "Complete",
    features: [
      "Mathematics, English & Science",
      "Full curriculum coverage",
      "Dedicated tutor assignment",
      "Weekly progress reports",
      "Parent updates included",
    ],
  },
];

// ─── HELPERS ────────────────────────────────────────────────
function fmt(n) {
  return n.toLocaleString("en-NG");
}

function loadSDK() {
  return new Promise((resolve) => {
    if (window.PaystackPop) return resolve();
    const s = document.createElement("script");
    s.src = "https://js.paystack.co/v1/inline.js";
    s.onload = resolve;
    document.head.appendChild(s);
  });
}

function showToast(msg, type = "info") {
  let el = document.getElementById("pm-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "pm-toast";
    el.className = "pm-toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = `pm-toast pm-toast--${type} pm-toast--show`;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("pm-toast--show"), 3500);
}

// ─── SVGs ────────────────────────────────────────────────────
const CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
const ARROW = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;
const BACK  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`;
const LOCK  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;

// ─── STATE ───────────────────────────────────────────────────
let currentBilling  = "monthly";
let currentChildren = 1;
let currentSessions = 4;

// ─── PRICING HELPERS ─────────────────────────────────────────
function childRate(ratePerHour) {
  return Math.round(ratePerHour * 0.95);
}

function calcTotal(ratePerHour, sessions, children) {
  let total = ratePerHour * sessions;
  for (let i = 1; i < children; i++) total += childRate(ratePerHour) * sessions;
  return total;
}

// ─── PLAN CARD BUILDER ───────────────────────────────────────
function buildPlanCards() {
  return Object.values(PLANS).map((plan) => {
    const b          = plan[currentBilling];
    const isPopular  = plan.badge === "Most Popular";
    const isEnterprise = plan.badge === "Enterprise";
    const isSaving   = currentBilling === "yearly" && b.saving;

    const badge = plan.badge
      ? `<span class="sp-badge ${isPopular ? "sp-badge--popular" : "sp-badge--enterprise"}">${plan.badge}</span>`
      : `<span class="sp-badge sp-badge--ghost"></span>`;

    return `
      <div class="sp-card${isPopular ? " sp-card--popular" : ""}${isEnterprise ? " sp-card--enterprise" : ""}">
        ${badge}
        <div class="sp-card__paper">
        <div class="sp-card-head">
          <h3 class="sp-card-name">${plan.name}</h3>
          <p class="sp-card-sub">${plan.tagline}</p>
        </div>
        <div class="sp-price-block">
          <div class="sp-price-row">
            <span class="sp-currency">&#8358;</span>
            <span class="sp-amount">${fmt(b.amount)}</span>
            ${isSaving ? `<span class="sp-saving">${b.saving}</span>` : ""}
          </div>
          <p class="sp-billing-note">${currentBilling === "yearly" ? `&#8358;${fmt(b.monthlyEq)}/mo &middot; billed annually` : "per month"}</p>
        </div>
        <ul class="sp-features">
          ${plan.features.map((f) => `<li>${CHECK}${f}</li>`).join("")}
        </ul>
        <button class="sp-cta${isPopular ? " sp-cta--popular" : isEnterprise ? " sp-cta--enterprise" : ""}" data-checkout="${plan.id}">
          <span>Get ${plan.name}</span>${ARROW}
        </button>
        </div>
      </div>`;
  }).join("");
}

// ─── TUTOR CARD BUILDER ──────────────────────────────────────
function buildTutorCards() {
  return TUTOR_PACKAGES.map((pkg) => {
    const isPopular = pkg.badge === "Popular";
    const isComplete = pkg.badge === "Complete";
    const hasHighlight = isPopular || isComplete;

    const badge = pkg.badge
      ? `<span class="sp-badge ${isPopular ? "sp-badge--popular" : "sp-badge--enterprise"}">${pkg.badge}</span>`
      : `<span class="sp-badge sp-badge--ghost"></span>`;

    const extraNote = currentChildren > 1
      ? `<p class="sp-billing-note sp-billing-note--discount">Extra children: &#8358;${fmt(childRate(pkg.ratePerHour))}/hr &middot; 5% off each</p>`
      : `<p class="sp-billing-note">per hour &middot; one-to-one</p>`;

    return `
      <div class="sp-card${isPopular ? " sp-card--popular" : isComplete ? " sp-card--enterprise" : ""}">
        ${badge}
        <div class="sp-card__paper">
        <div class="sp-card-head">
          <h3 class="sp-card-name">${pkg.name}</h3>
          <p class="sp-card-sub">${pkg.tagline}</p>
        </div>
        <div class="sp-price-block">
          <div class="sp-price-row">
            <span class="sp-currency">&#8358;</span>
            <span class="sp-amount">${fmt(pkg.ratePerHour)}</span>
            <span class="sp-per-hour">/hr</span>
          </div>
          ${extraNote}
        </div>
        <ul class="sp-features">
          ${pkg.features.map((f) => `<li>${CHECK}${f}</li>`).join("")}
        </ul>
        <button class="sp-cta${isPopular ? " sp-cta--popular" : isComplete ? " sp-cta--enterprise" : ""}" data-tutor-checkout="${pkg.id}">
          <span>Book ${pkg.name}</span>${ARROW}
        </button>
        </div>
      </div>`;
  }).join("");
}

// ─── WIRE PLAN CARDS ────────────────────────────────────────
function wirePlanCards() {
  document.querySelectorAll("[data-checkout]").forEach((btn) => {
    btn.onclick = () => {
      window.PaymentPortal?.checkout(btn.dataset.checkout, currentBilling);
    };
  });
}

// ─── TUTOR CHECKOUT MODAL ────────────────────────────────────
const tpOverlay = document.getElementById("tp-overlay");
const tpBody    = document.getElementById("tp-body");

function openTutorCheckout(pkg) {
  const user = auth.currentUser;
  if (!user) {
    showToast("Sign in to book a session.", "error");
    window.openAuthModal?.("login");
    return;
  }
  currentSessions = 4;
  tpBody.innerHTML = buildTutorCheckout(pkg, user.email);
  tpOverlay.classList.add("pm-overlay--active");
  document.body.style.overflow = "hidden";

  document.getElementById("tp-back").onclick = closeTutorCheckout;

  document.querySelectorAll(".tp-session-btn").forEach((btn) => {
    btn.onclick = () => {
      currentSessions = parseInt(btn.dataset.sessions);
      document.querySelectorAll(".tp-session-btn").forEach((b) =>
        b.classList.toggle("tp-session-btn--active", b === btn)
      );
      refreshCheckoutTotals(pkg);
    };
  });

  document.getElementById("tp-pay-btn").onclick = () => chargeTutor(pkg);
}

function refreshCheckoutTotals(pkg) {
  const sessions  = currentSessions;
  const children  = currentChildren;
  document.querySelectorAll(".tp-child-row").forEach((row, i) => {
    const rate   = i === 0 ? pkg.ratePerHour : childRate(pkg.ratePerHour);
    const amount = rate * sessions;
    row.querySelector(".tp-child-sessions").textContent = `${sessions} × ₦${fmt(rate)}/hr`;
    row.querySelector(".tp-child-amount").textContent   = `₦${fmt(amount)}`;
  });
  const grandTotal = calcTotal(pkg.ratePerHour, sessions, children);
  document.getElementById("tp-grand-total").textContent = `₦${fmt(grandTotal)}`;
  const btn = document.getElementById("tp-pay-btn");
  if (btn) btn.querySelector("span").textContent = `Pay ₦${fmt(grandTotal)}`;
}

function closeTutorCheckout() {
  tpOverlay.classList.remove("pm-overlay--active");
  document.body.style.overflow = "";
}

document.getElementById("tp-close").onclick = closeTutorCheckout;
tpOverlay.onclick = (e) => { if (e.target === tpOverlay) closeTutorCheckout(); };
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && tpOverlay.classList.contains("pm-overlay--active")) {
    closeTutorCheckout();
  }
});

function buildTutorCheckout(pkg, email) {
  const sessions   = currentSessions;
  const children   = currentChildren;
  const grandTotal = calcTotal(pkg.ratePerHour, sessions, children);

  const sessionBtns = [4, 8, 12].map((n) =>
    `<button class="tp-session-btn${n === sessions ? " tp-session-btn--active" : ""}" data-sessions="${n}">${n}</button>`
  ).join("");

  const childRows = Array.from({ length: children }, (_, i) => {
    const rate   = i === 0 ? pkg.ratePerHour : childRate(pkg.ratePerHour);
    const amount = rate * sessions;
    const label  = children === 1
      ? "Per session"
      : i === 0 ? "Child 1 (full rate)" : `Child ${i + 1} (5% off)`;
    return `
      <div class="pm-breakdown-row tp-child-row">
        <span class="tp-child-label">${label}
          <span class="tp-child-sessions">${sessions} &times; &#8358;${fmt(rate)}/hr</span>
        </span>
        <strong class="tp-child-amount">&#8358;${fmt(amount)}</strong>
      </div>`;
  }).join("");

  const topbarTag = children > 1
    ? `<div class="pm-billing-tag pm-billing-tag--yearly">${children} children &middot; 5% off per extra</div>`
    : `<div class="pm-billing-tag pm-billing-tag--monthly">One-to-one</div>`;

  return `
    <div class="pm-checkout">
      <div class="pm-checkout-topbar">
        <button class="pm-back-btn" id="tp-back">${BACK} All packages</button>
        ${topbarTag}
      </div>

      <div class="pm-checkout-header">
        <p class="pm-eyebrow">Order summary</p>
        <div class="pm-checkout-plan-badge">
          <span class="pm-checkout-plan-name">${pkg.name}</span>
          ${pkg.badge ? `<span class="pm-badge pm-badge--popular">${pkg.badge}</span>` : ""}
        </div>
        <p class="pm-plan-tagline">${pkg.tagline} &middot; &#8358;${fmt(pkg.ratePerHour)}/hr</p>
      </div>

      <div class="tp-sessions-row">
        <span class="tp-sessions-label">Sessions per child</span>
        <div class="tp-session-picker">${sessionBtns}</div>
      </div>

      <div class="pm-breakdown">
        ${childRows}
        ${children > 1 ? `
        <div class="pm-breakdown-row pm-breakdown-saving">
          <span>Multi-child discount</span>
          <span class="pm-saving">5% per extra child</span>
        </div>` : ""}
        <div class="pm-breakdown-row pm-breakdown-total">
          <span>Total</span>
          <strong id="tp-grand-total">&#8358;${fmt(grandTotal)}</strong>
        </div>
      </div>

      <div class="pm-checkout-email">
        <span class="pm-checkout-email-label">Paying as</span>
        <span class="pm-checkout-email-value">${email}</span>
      </div>

      <button class="pm-pay-btn" id="tp-pay-btn">
        <span>Pay &#8358;${fmt(grandTotal)}</span>${ARROW}
      </button>

      <p class="pm-secure">
        ${LOCK} Secured by Paystack &middot; Sessions valid for 90 days from purchase
      </p>
    </div>`;
}

async function chargeTutor(pkg) {
  const user = auth.currentUser;
  if (!user) return;

  const sessions   = currentSessions;
  const children   = currentChildren;
  const total      = calcTotal(pkg.ratePerHour, sessions, children);

  const btn = document.getElementById("tp-pay-btn");
  if (btn) { btn.disabled = true; btn.innerHTML = `<span>Opening payment&hellip;</span>`; }

  await loadSDK();

  const handler = window.PaystackPop.setup({
    key:      PK,
    email:    user.email,
    amount:   total * 100,
    currency: "NGN",
    ref:      `pp_tutor_${pkg.id}_${Date.now()}`,
    metadata: {
      custom_fields: [
        { display_name: "Package",  variable_name: "package",  value: pkg.name },
        { display_name: "Sessions", variable_name: "sessions", value: String(sessions) },
        { display_name: "Children", variable_name: "children", value: String(children) },
      ],
    },
    callback: (response) => {
      setDoc(
        doc(db, "tutor-bookings", response.reference),
        {
          userId:            user.uid,
          email:             user.email,
          packageId:         pkg.id,
          packageName:       pkg.name,
          subjects:          pkg.tagline,
          ratePerHour:       pkg.ratePerHour,
          sessionsPerChild:  sessions,
          childCount:        children,
          sessionsRemaining: sessions * children,
          amountPaid:        total,
          paymentRef:        response.reference,
          status:            "active",
          purchasedAt:       new Date().toISOString(),
        }
      ).then(() => {
        closeTutorCheckout();
        const who = children > 1 ? `${children} children` : "1 child";
        showToast(`Booked! ${sessions} sessions × ${who} — ready to schedule.`, "success");
      }).catch((err) => {
        console.error("Firestore error:", err);
        showToast("Payment received. Contact support to activate your sessions.", "error");
      });
    },
    onClose: () => {
      const b = document.getElementById("tp-pay-btn");
      if (b) {
        b.disabled = false;
        b.innerHTML = `<span>Pay &#8358;${fmt(total)}</span>${ARROW}`;
      }
    },
  });

  handler.openIframe();
}

// ─── PARTNER REFERRAL CODE ───────────────────────────────────
// A learner attaches a school's redeem code before subscribing; the server
// records it on their profile so the partner earns a commission on payment.
function injectRefStyles() {
  if (document.getElementById("sp-ref-styles")) return;
  const s = document.createElement("style");
  s.id = "sp-ref-styles";
  s.textContent = `
    .sp-ref { max-width: 460px; margin: 0 auto 1.4rem; padding: .9rem 1rem;
      border: var(--border-subtle, 1px solid rgba(42,39,35,.12)); border-radius: 14px;
      background: var(--surface-primary, #fffdf8); box-shadow: var(--shadow-sm, 0 2px 5px rgba(42,39,35,.08)); }
    .sp-ref__label { display:block; font-family: var(--font-mono, monospace); font-size: .72rem;
      font-weight: 700; color: var(--ink, #2a2723); margin-bottom: .5rem; }
    .sp-ref__row { display:flex; gap:.5rem; }
    .sp-ref__input { flex:1 1 auto; padding:.55rem .7rem; border-radius:10px; text-transform:uppercase;
      border: var(--border-subtle, 1px solid rgba(42,39,35,.14)); background: var(--surface-secondary,#f4f0e8);
      color: var(--ink,#2a2723); font-family: var(--font-mono, monospace); font-size:.8rem; letter-spacing:.08em; }
    .sp-ref__btn { padding:.55rem 1rem; border:none; border-radius:10px; cursor:pointer; font-weight:700;
      font-family: var(--font-mono, monospace); font-size:.75rem; background: var(--accent-primary,#f4c95d);
      color: var(--text-on-accent,#2a2723); }
    .sp-ref__btn:disabled { opacity:.6; cursor:default; }
    .sp-ref__status { margin:.5rem 0 0; font-family: var(--font-mono, monospace); font-size:.68rem; min-height:1em; }
    .sp-ref__status--ok  { color: var(--accent-success,#6db58f); }
    .sp-ref__status--err { color: var(--accent-danger,#e07a5f); }`;
  document.head.appendChild(s);
}

async function applyReferral(code, statusEl, btn) {
  const user = auth.currentUser;
  if (!user) {
    showToast("Sign in first to add a school code.", "error");
    window.openAuthModal?.("login");
    return;
  }
  const c = String(code || "").trim().toUpperCase();
  if (!c) return;
  btn.disabled = true;
  try {
    const base = window.location.port === "5500" ? "http://127.0.0.1:5000" : "";
    const token = await user.getIdToken();
    const res = await fetch(`${base}/api/payments/apply-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code: c }),
      credentials: "include",
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok && d.ok) {
      statusEl.textContent = `✓ Code ${d.code} applied — your school earns when you subscribe.`;
      statusEl.className = "sp-ref__status sp-ref__status--ok";
      try { localStorage.setItem("pp_ref_code", d.code); } catch (_) {}
    } else {
      statusEl.textContent = d.error || "Couldn't apply that code.";
      statusEl.className = "sp-ref__status sp-ref__status--err";
    }
  } catch (_) {
    statusEl.textContent = "Network error — please try again.";
    statusEl.className = "sp-ref__status sp-ref__status--err";
  } finally {
    btn.disabled = false;
  }
}

function mountReferralBox() {
  const grid = document.getElementById("spPlanGrid");
  if (!grid || document.getElementById("sp-ref")) return;
  injectRefStyles();
  const box = document.createElement("div");
  box.id = "sp-ref";
  box.className = "sp-ref";
  box.innerHTML =
    '<label class="sp-ref__label" for="sp-ref-input">Have a school redeem code?</label>' +
    '<div class="sp-ref__row">' +
      '<input id="sp-ref-input" class="sp-ref__input" type="text" placeholder="e.g. LAGS7K2P" autocomplete="off" spellcheck="false" maxlength="16" />' +
      '<button id="sp-ref-apply" class="sp-ref__btn" type="button">Apply</button>' +
    '</div>' +
    '<p id="sp-ref-status" class="sp-ref__status"></p>';
  grid.parentNode.insertBefore(box, grid);
  const input = box.querySelector("#sp-ref-input");
  const btn = box.querySelector("#sp-ref-apply");
  const status = box.querySelector("#sp-ref-status");
  try { const saved = localStorage.getItem("pp_ref_code"); if (saved) input.value = saved; } catch (_) {}
  btn.onclick = () => applyReferral(input.value, status, btn);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") btn.click(); });
}

// ─── INIT ────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const paint = document.querySelector(".sp-paint");
  if (paint) paint.innerHTML = heroPaint();

  document.getElementById("spPlanGrid").innerHTML  = buildPlanCards();
  document.getElementById("spTutorGrid").innerHTML = buildTutorCards();
  wirePlanCards();
  wireTutorCards();
  mountReferralBox();

  // Children counter
  const minusBtn = document.getElementById("spChildMinus");
  const plusBtn  = document.getElementById("spChildPlus");
  const countEl  = document.getElementById("spChildCount");
  const hintEl   = document.getElementById("spChildHint");

  function refreshChildrenUI() {
    countEl.textContent  = currentChildren;
    minusBtn.disabled    = currentChildren <= 1;
    const extra = currentChildren - 1;
    hintEl.textContent   = extra > 0
      ? `${extra} extra child${extra > 1 ? "ren" : ""} · 5% off each`
      : "";
    document.getElementById("spTutorGrid").innerHTML = buildTutorCards();
    wireTutorCards();
  }

  minusBtn.addEventListener("click", () => {
    if (currentChildren > 1) { currentChildren--; refreshChildrenUI(); }
  });
  plusBtn.addEventListener("click", () => {
    if (currentChildren < 10) { currentChildren++; refreshChildrenUI(); }
  });

  // Billing toggle
  document.getElementById("spBillingToggle").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-billing]");
    if (!btn) return;
    currentBilling = btn.dataset.billing;
    document.querySelectorAll(".sp-billing-btn").forEach((b) =>
      b.classList.toggle("sp-billing-btn--active", b.dataset.billing === currentBilling)
    );
    document.getElementById("spPlanGrid").innerHTML = buildPlanCards();
    wirePlanCards();
  });

  // Kind tabs switch between Platform Plans and Book a Tutor (plans show first).
  const kindtabs = document.querySelectorAll(".sp-kindtab[data-go]");
  const showKind = (which) => {
    if (which !== "plans" && which !== "tutor") return;
    document.querySelectorAll(".sp-section").forEach((s) =>
      s.classList.toggle("sp-section--hidden", s.id !== `sp-${which}`)
    );
    kindtabs.forEach((t) =>
      t.classList.toggle("sp-kindtab--active", t.dataset.go === which)
    );
  };
  kindtabs.forEach((tab) =>
    tab.addEventListener("click", () => showKind(tab.dataset.go))
  );

  // Deep link: /subscribe.html#plans or #tutor opens that kind directly.
  const hash = location.hash.replace("#", "");
  if (hash === "plans" || hash === "tutor") showKind(hash);
});

function wireTutorCards() {
  document.querySelectorAll("[data-tutor-checkout]").forEach((btn) => {
    btn.onclick = () => {
      const pkg = TUTOR_PACKAGES.find((p) => p.id === btn.dataset.tutorCheckout);
      if (pkg) openTutorCheckout(pkg);
    };
  });
}
