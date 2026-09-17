/**
 * Prep Portal — Paystack Payment Gateway
 * Three-tier subscription: Pro / Premium / Enterprise
 * Monthly + Yearly billing with discount toggle
 *
 * Flow: Plan selection → Order summary → Paystack popup → Success screen
 *
 *   Monthly:  Pro         PLN_3mghi8hr1mxg5lk   ₦10,000
 *             Premium     PLN_xodc0xq5eki6vyg   ₦30,000
 *             Enterprise  PLN_la6q8cp6ryy2alq   ₦150,000
 *
 *   Yearly:   Pro         PLN_knvr81r8t903ria   ₦120,000
 *             Premium     PLN_3os05kpnhpauvav   ₦342,000
 *             Enterprise  PLN_bbypkk64rsyacww   ₦1,620,000
 */

import { auth, db } from "./firebase-init.js";
import {
  doc,
  getDoc,
} from "firebase/firestore";

// ─── PLAN DEFINITIONS ──────────────────────────────────────
export const PLANS = {
  PRO: {
    id: "pro",
    name: "Pro",
    tagline: "Perfect for individual learners",
    monthly: { code: "PLN_3mghi8hr1mxg5lk", amount: 10000 },
    yearly:  { code: "PLN_knvr81r8t903ria", amount: 120000, monthlyEq: 10000, saving: null },
    features: [
      "All Math games & activities",
      "Visual learning tools",
      "Progress tracking",
      "5 AI PrepBot queries/day",
    ],
    tier: "pro",
  },
  PREMIUM: {
    id: "premium",
    name: "Premium",
    tagline: "For serious students",
    badge: "Most Popular",
    monthly: { code: "PLN_xodc0xq5eki6vyg", amount: 30000 },
    yearly:  { code: "PLN_3os05kpnhpauvav", amount: 342000, monthlyEq: 28500, saving: "5% off" },
    features: [
      "Everything in Pro",
      "1,000+ practice questions",
      "Unlimited AI PrepBot",
      "Personalised study track",
      "All past papers (50+)",
    ],
    tier: "premium",
  },
  ENTERPRISE: {
    id: "enterprise",
    name: "Enterprise",
    tagline: "For institutions & tutors",
    badge: "Enterprise",
    monthly: { code: "PLN_la6q8cp6ryy2alq", amount: 150000 },
    yearly:  { code: "PLN_bbypkk64rsyacww", amount: 1620000, monthlyEq: 135000, saving: "10% off" },
    features: [
      "Everything in Premium",
      "Up to 50 student accounts",
      "Teacher dashboard",
      "School analytics & reports",
      "Priority support",
    ],
    tier: "enterprise",
  },
};

// ─── PORTAL (IIFE — side-effect, sets window.PaymentPortal) ─
(function () {
  const PK = "pk_live_f4ddce00cea983792c801c129d875e64086d68da";
  let billing = "monthly";

  // ── helpers ──────────────────────────────────────────────
  function fmt(n) {
    return n.toLocaleString("en-NG");
  }

  // Confirm a Paystack charge with our own API (which verifies it with Paystack
  // and grants premium server-side). The browser no longer writes isPremium —
  // that's what makes the upcoming partner-earnings ledger trustworthy.
  async function verifyPayment(reference) {
    const user = auth.currentUser;
    if (!user) return false;
    try {
      const base = window.location.port === "5500" ? "http://127.0.0.1:5000" : "";
      const token = await user.getIdToken();
      const res = await fetch(`${base}/api/payments/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reference }),
        credentials: "include",
      });
      if (!res.ok) return false;
      const d = await res.json();
      return !!(d.ok && d.premium);
    } catch (_) {
      return false;
    }
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

  // ── shared SVGs ───────────────────────────────────────────
  const CHECK_SVG  = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="12" cy="12" r="9.6" fill="var(--accent-success)"/><path d="M7.4 12.4l3 3 6.2-6.7" fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const ARROW_SVG  = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g transform="rotate(90 12 12)"><rect x="10.6" y="9" width="2.8" height="12" rx="1.4" fill="var(--accent-secondary)"/><path d="M12 2.6 19.4 11H4.6z" fill="var(--accent-danger)"/></g></svg>`;
  const BACK_SVG   = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g transform="rotate(270 12 12)"><rect x="10.6" y="9" width="2.8" height="12" rx="1.4" fill="var(--accent-secondary)"/><path d="M12 2.6 19.4 11H4.6z" fill="var(--accent-danger)"/></g></svg>`;
  const LOCK_SVG   = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="13" height="13"><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" fill="none" stroke="var(--text-tertiary)" stroke-width="2.4" stroke-linecap="round"/><rect x="4" y="10.5" width="16" height="10.4" rx="2.6" fill="var(--accent-primary)"/><circle cx="12" cy="15" r="1.7" fill="#fff"/><rect x="11.2" y="15.6" width="1.6" height="2.6" rx="0.8" fill="#fff"/></svg>`;

  // ── view builders ─────────────────────────────────────────
  // NOTE: the multi-plan "grid" view has been removed. Plan selection now
  // lives entirely on /subscribe.html; this modal only ever shows the
  // single-plan order summary (a narrow receipt) and the success screen.

  function buildCheckoutView(plan, email) {
    const pricing      = plan[billing];
    const isYearly     = billing === "yearly";
    const isEnterprise = plan.badge === "Enterprise";
    const isPopular    = plan.badge === "Most Popular";

    const savingsRow = (isYearly && pricing.saving) ? `
      <div class="pm-breakdown-row pm-breakdown-saving">
        <span>Yearly discount</span>
        <span class="pm-saving">${pricing.saving}</span>
      </div>` : "";

    const CAL_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="13" height="13" style="flex-shrink:0"><rect x="3" y="4.4" width="18" height="16.6" rx="2.4" fill="var(--accent-secondary)"/><path d="M3 6.8a2.4 2.4 0 0 1 2.4-2.4h13.2A2.4 2.4 0 0 1 21 6.8v3H3z" fill="var(--accent-danger)"/><rect x="7" y="2.2" width="2.4" height="4.6" rx="1.2" fill="var(--accent-primary)"/><rect x="14.6" y="2.2" width="2.4" height="4.6" rx="1.2" fill="var(--accent-primary)"/><rect x="6.4" y="12.4" width="3.2" height="3" rx="0.6" fill="#fff"/><rect x="10.4" y="12.4" width="3.2" height="3" rx="0.6" fill="#fff"/><rect x="14.4" y="12.4" width="3.2" height="3" rx="0.6" fill="#fff"/></svg>`;

    return `
      <div class="pm-checkout">

        <div class="pm-checkout-topbar">
          <button class="pm-back-btn" id="pm-back">
            ${BACK_SVG} All plans
          </button>
          <div class="pm-billing-tag pm-billing-tag--${isYearly ? "yearly" : "monthly"}">
            ${CAL_SVG}
            ${isYearly ? "Yearly billing" : "Monthly billing"}
            <button class="pm-billing-tag-change" id="pm-change-billing">Change</button>
          </div>
        </div>

        <div class="pm-checkout-header">
          <p class="pm-eyebrow">Order summary</p>
          <div class="pm-checkout-plan-badge${isPopular ? " pm-checkout-plan-badge--popular" : isEnterprise ? " pm-checkout-plan-badge--enterprise" : ""}">
            <span class="pm-checkout-plan-name">${plan.name}</span>
            ${plan.badge ? `<span class="pm-badge ${isPopular ? "pm-badge--popular" : "pm-badge--enterprise"}">${plan.badge}</span>` : ""}
          </div>
          <p class="pm-plan-tagline">${plan.tagline}</p>
        </div>

        <ul class="pm-checkout-features">
          ${plan.features.map((f) => `<li>${CHECK_SVG}${f}</li>`).join("")}
        </ul>

        <div class="pm-breakdown">
          <div class="pm-breakdown-row">
            <span>${plan.name} · ${isYearly ? "Yearly" : "Monthly"}</span>
            <span>₦${isYearly ? `${fmt(pricing.monthlyEq)}/mo` : `${fmt(pricing.amount)}/mo`}</span>
          </div>
          ${isYearly ? `<div class="pm-breakdown-row"><span>Months</span><span>× 12</span></div>` : ""}
          ${savingsRow}
          <div class="pm-breakdown-row pm-breakdown-total">
            <span>${isYearly ? "Total charged now (1 year)" : "Total per month"}</span>
            <strong>₦${fmt(pricing.amount)}</strong>
          </div>
        </div>

        <div class="pm-checkout-email">
          <span class="pm-checkout-email-label">Paying as</span>
          <span class="pm-checkout-email-value">${email}</span>
        </div>

        <button class="pm-pay-btn${isPopular ? " pm-pay-btn--popular" : isEnterprise ? " pm-pay-btn--enterprise" : ""}" id="pm-pay-btn">
          <span>Pay ₦${fmt(pricing.amount)}${isYearly ? " / year" : " / month"}</span>
          ${ARROW_SVG}
        </button>

        <p class="pm-secure">
          ${LOCK_SVG}
          Secured by Paystack &middot; Cancel anytime &middot; All Nigerian payment methods accepted
        </p>
      </div>`;
  }

  function buildSuccessView(plan) {
    return `
      <div class="pm-success">
        <div class="pm-success-icon">
          <svg viewBox="0 0 52 52" fill="none">
            <circle class="pm-success-circle" cx="26" cy="26" r="24" fill="var(--accent-success)" stroke="var(--accent-success)" stroke-width="3"/>
            <polyline class="pm-success-check" points="14 27 22 35 38 18" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h2 class="pm-success-heading">You're all set!</h2>
        <p class="pm-success-plan">${plan.name} plan activated</p>
        <p class="pm-success-sub">Your subscription is now active. Enjoy full access to Prep Portal.</p>
        <button class="pm-success-btn" id="pm-dashboard-btn">
          <span>Go to dashboard</span>
          ${ARROW_SVG}
        </button>
      </div>`;
  }

  // ── modal shell ───────────────────────────────────────────
  function buildModalShell() {
    return `
      <div id="pm-overlay" class="pm-overlay" role="dialog" aria-modal="true" aria-label="Order summary">
        <div class="pm-sheet pm-sheet--narrow">
          <button class="pm-close" id="pm-close" aria-label="Close">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="10.6" y="3.5999999999999996" width="2.8" height="16.8" rx="1.4" fill="var(--accent-danger)" transform="rotate(45 12 12)"/><rect x="10.6" y="3.5999999999999996" width="2.8" height="16.8" rx="1.4" fill="var(--accent-danger)" transform="rotate(-45 12 12)"/></svg>
          </button>
          <div id="pm-body"></div>
        </div>
      </div>`;
  }

  // ── portal object ─────────────────────────────────────────
  const Portal = {
    init() {
      if (!document.getElementById("pm-styles")) {
        const link = document.createElement("link");
        link.id   = "pm-styles";
        link.rel  = "stylesheet";
        link.href = "/payment-manager.css";
        document.head.appendChild(link);
      }

      const root = document.createElement("div");
      root.id = "pm-root";
      root.innerHTML = buildModalShell();
      document.body.appendChild(root);

      this._wireStatic();
      this._setupInterceptors();
    },

    _wireStatic() {
      document.getElementById("pm-close").onclick = () => this.close();
      document.getElementById("pm-overlay").onclick = (e) => {
        if (e.target.id === "pm-overlay") this.close();
      };
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && document.getElementById("pm-overlay")?.classList.contains("pm-overlay--active")) {
          this.close();
        }
      });
    },

    _showCheckout(plan) {
      const user = auth.currentUser;
      if (!user) {
        showToast("Sign in to subscribe.", "error");
        window.openAuthModal?.("login");
        return;
      }

      document.getElementById("pm-body").innerHTML = buildCheckoutView(plan, user.email);

      // The plan grid is gone — "All plans" and "Change" simply close the
      // receipt so the user is back on the subscribe page where the cards live.
      document.getElementById("pm-back").onclick = () => this.close();
      document.getElementById("pm-change-billing").onclick = () => this.close();

      document.getElementById("pm-pay-btn").onclick = () => this._charge(plan);
    },

    async _charge(plan) {
      const user = auth.currentUser;
      if (!user) return;

      const btn = document.getElementById("pm-pay-btn");
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span>Opening payment…</span>`;
      }

      await loadSDK();

      const pricing = plan[billing];

      const handler = window.PaystackPop.setup({
        key:      PK,
        email:    user.email,
        amount:   pricing.amount * 100,
        currency: "NGN",
        plan:     pricing.code,
        ref:      `pp_${plan.id}_${billing}_${Date.now()}`,
        metadata: {
          // uid lets the webhook attribute renewals; ref_code (Phase 2) will
          // carry the partner's referral code through to the commission ledger.
          uid: user.uid,
          custom_fields: [
            { display_name: "Plan",    variable_name: "plan",    value: plan.name },
            { display_name: "Billing", variable_name: "billing", value: billing },
          ],
        },
        callback: (response) => {
          // Confirm server-side (the API verifies with Paystack and grants
          // premium). The browser no longer self-writes isPremium.
          verifyPayment(response.reference)
            .then((ok) => {
              if (ok) this._showSuccess(plan);
              else showToast("Payment received — activating shortly. Refresh in a minute, or contact support if it doesn't unlock.", "error");
            })
            .catch(() => showToast("Payment received — activating shortly. Contact support if it doesn't unlock.", "error"));
        },
        onClose: () => {
          const b = document.getElementById("pm-pay-btn");
          if (b) {
            b.disabled = false;
            b.innerHTML = `<span>Pay ₦${fmt(plan[billing].amount)}</span>${ARROW_SVG}`;
          }
        },
      });

      handler.openIframe();
    },

    _showSuccess(plan) {
      document.getElementById("pm-body").innerHTML = buildSuccessView(plan);

      document.getElementById("pm-dashboard-btn").onclick = () => {
        this.close();
        window.location.href = "/dashboard.html";
      };
    },

    // The multi-plan grid modal is gone. Any "upgrade / choose a plan" entry
    // point now sends the user to the dedicated subscribe page.
    open() {
      window.location.href = "/subscribe.html#plans";
    },

    // Opens directly at the single-plan order summary (a narrow receipt).
    // Used by the subscribe page once the user has picked a plan + billing cycle.
    checkout(planOrId, cycle) {
      if (cycle) billing = cycle;
      const plan = (typeof planOrId === "string")
        ? Object.values(PLANS).find((p) => p.id === planOrId)
        : planOrId ?? PLANS.PRO;
      if (!plan) return;

      document.getElementById("pm-overlay").classList.add("pm-overlay--active");
      document.body.style.overflow = "hidden";
      this._showCheckout(plan);
    },

    close() {
      document.getElementById("pm-overlay").classList.remove("pm-overlay--active");
      document.body.style.overflow = "";
    },

    _setupInterceptors() {
      // Content-gate UX nicety: intercept clicks into gated areas and resolve
      // access through the SAME feature registry the page guards and server
      // use (/utils/features.js), so an admin's "free" setting or a per-user
      // grant/block is honoured here too — this used to be a second,
      // isPremium-only gate that silently defeated "free" settings. If the
      // link maps to no registered feature, let the click through: the page's
      // own premium-guard is the enforcement.
      document.addEventListener("click", async (e) => {
        const link = e.target.closest("a");
        if (!link) return;
        const href = link.getAttribute("href") || "";
        const GATED = ["/home/games/", "/prep-math/activity/", "/virtual-lab/", "/writing/"];
        if (!GATED.some((p) => href.includes(p))) return;

        let mapping = null;
        try {
          const { featureAndPartForPath } = await import("/utils/features.js");
          mapping = featureAndPartForPath(new URL(href, window.location.href).pathname);
        } catch { return; } // resolver unavailable → let the page guard decide
        if (!mapping || !mapping.featureId) return; // unregistered → page guard decides

        e.preventDefault();

        const user = auth.currentUser;
        if (!user) {
          showToast("Sign in to access premium content.", "error");
          window.openAuthModal?.("login");
          return;
        }

        try {
          const { resolveUserAccess } = await import("/utils/features.js");
          const snap = await getDoc(doc(db, "users", user.uid));
          const profile = (snap.exists() && snap.data()) || null;
          const v = await resolveUserAccess({ ...mapping, profile });
          if (v.allowed) {
            window.location.href = href;
          } else if (v.reason === "premium-required") {
            window.location.href = "/subscribe.html#plans";
          } else {
            showToast("This feature is currently unavailable.", "error");
          }
        } catch {
          window.location.href = href; // fail open — the page guard still runs
        }
      });
    },
  };

  window.PaymentPortal = Portal;
  document.addEventListener("DOMContentLoaded", () => Portal.init());
})();
