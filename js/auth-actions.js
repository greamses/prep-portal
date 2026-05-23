import { auth } from "/firebase-init.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { SUBSCRIPTION_PLANS } from "/payment-manager.js";

export function doLogout() {
  signOut(auth)
    .then(() => {
      window.location.href = "/";
    })
    .catch(console.error);
}

export function doUpgrade() {
  if (!auth.currentUser) {
    window.openAuthModal?.("login");
    return;
  }
  window.PaymentPortal?.open(SUBSCRIPTION_PLANS.PREMIUM);
}
