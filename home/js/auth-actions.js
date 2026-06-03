import { auth } from "/firebase-init.js";
import { signOut } from "firebase/auth";

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
  window.location.href = "/subscribe.html#plans";
}
