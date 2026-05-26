/**
 * Prep Portal — Paystack Payment Gateway
 * Three-tier subscription: Starter / Premium / Schools
 * Monthly + Yearly billing with discount toggle
 *
 * IMPORTANT — verify these plan codes match your Paystack dashboard
 * (Products → Plans) before going live:
 *
 *   Monthly:  Starter  PLN_knvr81r8t903ria
 *             Premium  PLN_3mghi8hr1mxg5lk
 *             Schools  PLN_3os05kpnhpauvav
 *
 *   Yearly:   Starter  PLN_xodc0xq5eki6vyg
 *             Premium  PLN_bbypkk64rsyacww  (5% off)
 *             Schools  PLN_la6q8cp6ryy2alq  (10% off)
 */

import { auth, db } from "./firebase-init.js";
import {
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// ─── PLAN DEFINITIONS ──────────────────────────────────────
export const PLANS = {
  STARTER: {
    id: "starter",
    name: "Starter",
    tagline: "Perfect for individual learners",
    monthly: { code: "PLN_knvr81r8t903ria", amount: 10000 },
    yearly:  { code: "PLN_xodc0xq5eki6vyg", amount: 120000, monthlyEq: 10000, saving: null },
    features: [
      "All Math games & activities",
      "Visual learning tools",
      "Progress tracking",
      "5 AI PrepBot queries/day",
    ],
    tier: "starter",
  },
  PREMIUM: {
    id: "premium",
    name: "Premium",
    tagline: "For serious students",
    badge: "Most Popular",
    monthly: { code: "PLN_3mghi8hr1mxg5lk", amount: 30000 },
    yearly:  { code: "PLN_bbypkk64rsyacww", amount: 342000, monthlyEq: 28500, saving: "5% off" },
    features: [
      "Everything in Starter",
      "1,000+ practice questions",
      "Unlimited AI PrepBot",
      "Personalised study track",
      "All past papers (50+)",
    ],
    tier: "premium",
  },
  SCHOOLS: {
    id: "schools",
    name: "Schools",
    tagline: "For institutions & tutors",
    badge: "Enterprise",
    monthly: { code: "PLN_3os05kpnhpauvav", amount: 150000 },
    yearly:  { code: "PLN_la6q8cp6ryy2alq", amount: 1620000, monthlyEq: 135000, saving: "10% off" },
    features: [
      "Everything in Premium",
      "Up to 50 student accounts",
      "Teacher dashboard",
      "School analytics & reports",
      "Priority support",
    ],
    tier: "schools",
  },
};

// Backward-compat alias used by toolbar.js
export const SUBSCRIPTION_PLANS = {
  GAMES:   PLANS.STARTER,
  PREMIUM: PLANS.PREMIUM,
};

// ─── PORTAL (IIFE — side-effect, sets window.PaymentPortal) ─
(function () {
  const PK = "pk_live_f4ddce00cea983792c801c129d875e64086d68da";
  let billing = "monthly";

  // ── helpers ──────────────────────────────────────────────
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

  // ── card HTML ─────────────────────────────────────────────
  const CHECK_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  const ARROW_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;

  function buildCards(highlightId) {
    return Object.values(PLANS).map((plan) => {
      const b = plan[billing];
      const isPopular    = plan.badge === "Most Popular";
      const isEnterprise = plan.badge === "Enterprise";
      const isHighlit    = plan.id === highlightId;

      const badgeHtml = plan.badge
        ? `<span class="pm-badge ${isPopular ? "pm-badge--popular" : "pm-badge--enterprise"}">${plan.badge}</span>`
        : `<span class="pm-badge pm-badge--ghost"></span>`;

      const displayPrice  = billing === "yearly" ? fmt(b.monthlyEq) : fmt(b.amount);
      const billingNote   = billing === "yearly"
        ? `billed ₦${fmt(b.amount)}/year`
        : "per month";
      const savingBadge   = (billing === "yearly" && b.saving)
        ? `<span class="pm-saving">${b.saving}</span>`
        : "";

      return `
        <div class="pm-card${isPopular ? " pm-card--popular" : ""}${isEnterprise ? " pm-card--enterprise" : ""}${isHighlit ? " pm-card--highlight" : ""}" data-plan="${plan.id}">
          ${badgeHtml}
          <div class="pm-card-head">
            <h3 class="pm-plan-name">${plan.name}</h3>
            <p class="pm-plan-tagline">${plan.tagline}</p>
          </div>
          <div class="pm-price-block">
            <div class="pm-price-row">
              <span class="pm-currency">₦</span>
              <span class="pm-amount">${displayPrice}</span>
              ${savingBadge}
            </div>
            <p class="pm-billing-note">${billingNote}</p>
          </div>
          <ul class="pm-features">
            ${plan.features.map((f) => `<li>${CHECK_SVG}${f}</li>`).join("")}
          </ul>
          <button class="pm-cta-btn" data-plan="${plan.id}">
            <span>Get ${plan.name}</span>
            ${ARROW_SVG}
          </button>
        </div>`;
    }).join("");
  }

  // ── modal HTML ────────────────────────────────────────────
  function buildModal() {
    return `
      <div id="pm-overlay" class="pm-overlay" role="dialog" aria-modal="true" aria-label="Choose a plan">
        <div class="pm-sheet">
          <button class="pm-close" id="pm-close" aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          <div class="pm-intro">
            <p class="pm-eyebrow">Choose your plan</p>
            <h2 class="pm-headline">Unlock the full<br>Prep Portal.</h2>

            <div class="pm-toggle" role="group" aria-label="Billing cycle">
              <button class="pm-toggle-btn pm-toggle-btn--active" data-billing="monthly">Monthly</button>
              <button class="pm-toggle-btn" data-billing="yearly">
                Yearly
                <span class="pm-toggle-pill">Up to 10% off</span>
              </button>
            </div>
          </div>

          <div class="pm-cards" id="pm-cards">
            ${buildCards()}
          </div>

          <p class="pm-secure">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Secured by Paystack. Cancel anytime from your account dashboard.
          </p>
        </div>
      </div>`;
  }

  // ── portal object ─────────────────────────────────────────
  const Portal = {
    _highlightId: null,

    init() {
      // inject CSS
      if (!document.getElementById("pm-styles")) {
        const link = document.createElement("link");
        link.id   = "pm-styles";
        link.rel  = "stylesheet";
        link.href = "/payment-manager.css";
        document.head.appendChild(link);
      }

      // inject markup
      const root = document.createElement("div");
      root.id = "pm-root";
      root.innerHTML = buildModal();
      document.body.appendChild(root);

      this._wireStatic();
      this._wireCards();
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

      document.querySelectorAll(".pm-toggle-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          billing = btn.dataset.billing;
          document.querySelectorAll(".pm-toggle-btn").forEach((b) =>
            b.classList.toggle("pm-toggle-btn--active", b.dataset.billing === billing)
          );
          document.getElementById("pm-cards").innerHTML = buildCards(this._highlightId);
          this._wireCards();
        });
      });
    },

    _wireCards() {
      document.querySelectorAll(".pm-cta-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const plan = Object.values(PLANS).find((p) => p.id === btn.dataset.plan);
          if (plan) this._charge(plan, btn);
        });
      });
    },

    async _charge(plan, btn) {
      const user = auth.currentUser;
      if (!user) {
        showToast("Sign in to subscribe.", "error");
        window.openAuthModal?.("login");
        return;
      }

      const origHtml = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<span>Loading…</span>`;

      await loadSDK();

      const pricing = plan[billing];

      const handler = window.PaystackPop.setup({
        key:      PK,
        email:    user.email,
        amount:   pricing.amount * 100, // kobo
        currency: "NGN",
        plan:     pricing.code,
        ref:      `pp_${plan.id}_${billing}_${Date.now()}`,
        metadata: {
          custom_fields: [
            { display_name: "Plan",    variable_name: "plan",    value: plan.name },
            { display_name: "Billing", variable_name: "billing", value: billing },
          ],
        },
        callback: async (response) => {
          try {
            await setDoc(
              doc(db, "users", user.uid),
              {
                isPremium:       true,
                planId:          pricing.code,
                planName:        plan.name,
                planTier:        plan.tier,
                billingCycle:    billing,
                lastPaymentRef:  response.reference,
                updatedAt:       new Date().toISOString(),
              },
              { merge: true }
            );
            this.close();
            showToast(`${plan.name} plan activated — welcome aboard!`, "success");
            setTimeout(() => window.location.reload(), 2000);
          } catch (err) {
            console.error("Firestore update error:", err);
            showToast("Payment received. Contact support if your plan doesn't activate.", "error");
          }
        },
        onClose: () => {
          btn.disabled = false;
          btn.innerHTML = origHtml;
        },
      });

      handler.openIframe();
    },

    open(planOrId) {
      const plan = (typeof planOrId === "string")
        ? Object.values(PLANS).find((p) => p.id === planOrId)
        : planOrId ?? PLANS.PREMIUM;

      this._highlightId = plan?.id ?? null;
      document.getElementById("pm-cards").innerHTML = buildCards(this._highlightId);
      this._wireCards();

      document.getElementById("pm-overlay").classList.add("pm-overlay--active");
      document.body.style.overflow = "hidden";
    },

    close() {
      document.getElementById("pm-overlay").classList.remove("pm-overlay--active");
      document.body.style.overflow = "";
      this._highlightId = null;
    },

    _setupInterceptors() {
      // Any element with data-plan-open="starter|premium|schools" opens the modal
      document.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-plan-open]");
        if (!btn) return;
        e.preventDefault();
        this.open(btn.dataset.planOpen || "premium");
      });

      document.addEventListener("click", async (e) => {
        const link = e.target.closest("a");
        if (!link) return;
        const href = link.getAttribute("href") || "";
        if (!href.includes("/prep-math/games/") && !href.includes("/prep-math/activity/")) return;

        e.preventDefault();

        const user = auth.currentUser;
        if (!user) {
          showToast("Sign in to access premium content.", "error");
          window.openAuthModal?.("login");
          return;
        }

        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          if (snap.exists() && snap.data().isPremium) {
            window.location.href = href;
            return;
          }
          this.open(PLANS.STARTER);
        } catch {
          showToast("Could not verify subscription status.", "error");
        }
      });
    },
  };

  window.PaymentPortal = Portal;
  document.addEventListener("DOMContentLoaded", () => Portal.init());
})();
