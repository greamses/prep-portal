import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { renderStudentFields } from "/home/js/dashboard/StudentForm.js";
import { renderParentFields } from "/home/js/dashboard/ParentForm.js";
import { renderTeacherFields } from "/home/js/dashboard/TeacherForm.js";
import { auth, googleProvider, db } from "/firebase-init.js";
import { ROUTES } from "/home/js/routing.js";
import { AUTH_ICONS } from "/home/js/auth-icons.js";
import { heroPaint } from "/utils/components/nav-icons.js";

const ADMIN_EMAIL = "eemadanyel@gmail.com";

function goToDashboard() {
  // Intentionally empty — users stay on the page they logged in from.
  // Auth state propagates to all components via Firebase onAuthStateChanged.
}

export function injectAuthModal() {
  if (document.querySelector(".auth-modal")) return;

  let mountPoint = document.querySelector(".log-in");

  if (!mountPoint) {
    mountPoint = document.createElement("div");
    mountPoint.className = "log-in";
    document.body.appendChild(mountPoint);
  }

  const field = (opts) => {
    const { label, type, id, placeholder, icon, password } = opts;
    const eye = password
      ? `<button type="button" class="auth-eye" data-eye-for="${id}" aria-label="Show password">${AUTH_ICONS.eye}</button>`
      : "";
    return `
      <div class="auth-field">
        <label for="${id}">${label}</label>
        <div class="auth-input-wrap${password ? " auth-input-wrap--pw" : ""}">
          <span class="auth-input-icon">${icon}</span>
          <input type="${type}" id="${id}" placeholder="${placeholder}" required />
          ${eye}
        </div>
      </div>`;
  };

  const roleBtn = (role, label, active) => `
    <button type="button" class="role-toggle-btn${active ? " active" : ""}" data-role="${role}">
      <span class="role-ico">${AUTH_ICONS[role]}</span>
      <span class="role-lbl">${label}</span>
    </button>`;

  const googleBtn = (id, text) =>
    `<button type="button" class="google-btn" id="${id}">${AUTH_ICONS.google}<span>${text}</span></button>`;

  mountPoint.innerHTML = `
  <div class="auth-overlay"></div>
  <div class="auth-modal">
    <div class="auth-paint" aria-hidden="true">${heroPaint()}</div>

    <button class="auth-close" id="auth-close-btn" aria-label="Close">${AUTH_ICONS.close}</button>

    <div class="auth-scroll-body">

    <div class="auth-brand">
      <div class="auth-badge">
        <img src="/logo/logo-light.svg" alt="Prep Portal Logo" />
      </div>
      <div class="auth-title">
        <span class="brand-top">Prep</span><span class="brand-bottom">portal</span>
      </div>
    </div>

    <div class="auth-tabs">
      <button class="auth-tab active" data-auth-tab="login">Login</button>
      <button class="auth-tab" data-auth-tab="signup">Sign Up</button>
    </div>

    <!-- LOGIN -->
    <form class="auth-form active" id="login-form">
      <div class="auth-heading">
        <h3>Welcome back.</h3>
        <p>Continue your learning journey.</p>
      </div>

      ${field({ label: "Email Address", type: "email", id: "login-email", placeholder: "student@email.com", icon: AUTH_ICONS.email })}
      ${field({ label: "Password", type: "password", id: "login-password", placeholder: "••••••••", icon: AUTH_ICONS.lock, password: true })}

      <div class="auth-options">
        <label class="remember-box">
          <input type="checkbox" />
          <span>Remember me</span>
        </label>
        <a href="#">Forgot password?</a>
      </div>

      <button type="submit" class="auth-submit">
        <span>Login to Dashboard</span>
        ${AUTH_ICONS.arrow}
      </button>

      <div class="auth-or"><span>or</span></div>

      ${googleBtn("google-login", "Continue with Google")}
    </form>

    <!-- SIGNUP -->
    <form class="auth-form" id="signup-form">
      <div class="auth-heading">
        <h3>Create account.</h3>
        <p>Start preparing smarter today.</p>
      </div>

      <div class="auth-field">
        <label class="auth-label-main">I am registering as a…</label>
        <div class="role-toggle-container">
          ${roleBtn("student", "Student", true)}
          ${roleBtn("parent", "Parent", false)}
          ${roleBtn("teacher", "Teacher", false)}
        </div>
      </div>

      <!-- Dynamic Role Specific Fields -->
      <div id="role-fields-container" class="role-fields"></div>

      ${field({ label: "Full Name", type: "text", id: "signup-name", placeholder: "Emmanuel Daniel", icon: AUTH_ICONS.user })}
      ${field({ label: "Email Address", type: "email", id: "signup-email", placeholder: "student@email.com", icon: AUTH_ICONS.email })}
      ${field({ label: "Password", type: "password", id: "signup-password", placeholder: "Create a strong password", icon: AUTH_ICONS.lock, password: true })}

      <button type="submit" class="auth-submit">
        <span>Create Account</span>
        ${AUTH_ICONS.arrow}
      </button>

      <div class="auth-or"><span>or</span></div>

      ${googleBtn("google-signup", "Sign up with Google")}
    </form>

    </div>
  </div>
  `;

  initializeAuthModal(mountPoint);
}

function initializeAuthModal(authContainer) {
  const closeBtn = document.getElementById("auth-close-btn");
  const overlay = authContainer.querySelector(".auth-overlay");
  const tabs = authContainer.querySelectorAll(".auth-tab");
  const forms = authContainer.querySelectorAll(".auth-form");

  let selectedRole = "student";
  const roleContainer = authContainer.querySelector("#role-fields-container");
  const roleButtons = authContainer.querySelectorAll(".role-toggle-btn");

  // ============================================
  // PP-SELECT CONTROLLER
  // ============================================

  // Close open selects on clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".pp-select")) {
      document.querySelectorAll(".pp-select.open").forEach((dropdown) => {
        dropdown.classList.remove("open");
      });
    }
  });

  // Handle actions within pp-select elements
  authContainer.addEventListener("click", (e) => {
    const trigger = e.target.closest(".pp-select-trigger");
    if (trigger) {
      e.preventDefault();
      const selectParent = trigger.closest(".pp-select");

      // Close any other open selectors
      authContainer.querySelectorAll(".pp-select").forEach((el) => {
        if (el !== selectParent) el.classList.remove("open");
      });

      selectParent.classList.toggle("open");
      return;
    }

    const option = e.target.closest(".pp-select-item");
    if (option) {
      const selectParent = option.closest(".pp-select");
      const hiddenInput = selectParent.querySelector("input[type='hidden']");
      const value = option.dataset.value;
      const text = option.textContent;

      hiddenInput.value = value;
      selectParent.querySelector(".pp-select-trigger span").textContent = text;

      selectParent.classList.add("has-value");
      selectParent.classList.remove("open");

      // Dispatch changes for reactive listeners
      hiddenInput.dispatchEvent(new Event("change", { bubbles: true }));
      hiddenInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });

  function updateRoleFields(role) {
    selectedRole = role;
    roleButtons.forEach((btn) =>
      btn.classList.toggle("active", btn.dataset.role === role),
    );

    switch (role) {
      case "student":
        roleContainer.innerHTML = renderStudentFields();
        break;
      case "parent":
        roleContainer.innerHTML = renderParentFields();
        break;
      case "teacher":
        roleContainer.innerHTML = renderTeacherFields();
        break;
    }
  }

  roleButtons.forEach((btn) => {
    btn.addEventListener("click", () => updateRoleFields(btn.dataset.role));
  });
  updateRoleFields("student");

  // Custom-Select Validation checker
  function validateSignupFields(isGoogle = false) {
    const roleInputs = roleContainer.querySelectorAll("input");

    for (const input of roleInputs) {
      // Check hidden inputs for our pp-select objects
      if (
        input.type === "hidden" &&
        input.hasAttribute("required") &&
        !input.value
      ) {
        const customSelect = input.closest(".pp-select");
        customSelect.classList.add("error");

        const trigger = customSelect.querySelector(".pp-select-trigger");
        trigger.focus();

        // Highlight active selector outline briefly on error
        setTimeout(() => {
          customSelect.classList.remove("error");
        }, 2500);
        return false;
      }

      if (!input.checkValidity()) {
        input.reportValidity();
        return false;
      }
    }

    if (!isGoogle) {
      const name = document.getElementById("signup-name");
      const email = document.getElementById("signup-email");
      const password = document.getElementById("signup-password");

      for (const input of [name, email, password]) {
        if (!input.checkValidity()) {
          input.reportValidity();
          return false;
        }
      }
    }
    return true;
  }

  function collectExtraData(role) {
    const extraData = {};
    if (role === "teacher") {
      extraData.schoolName =
        document.getElementById("signup-school")?.value || "";
      extraData.phone =
        document.getElementById("signup-teacher-phone")?.value || "";
      extraData.experience =
        document.getElementById("signup-experience")?.value || "";
      extraData.totalStudents =
        parseInt(document.getElementById("signup-students")?.value) || 0;
      extraData.activeClass =
        document.getElementById("signup-subject")?.value || "";
      extraData.position =
        document.getElementById("signup-position")?.value || "";
    } else if (role === "parent") {
      extraData.relationship =
        document.getElementById("signup-relation")?.value || "";
      extraData.phone =
        document.getElementById("signup-parent-phone")?.value || "";
      extraData.childName =
        document.getElementById("signup-child-name")?.value || "";
      extraData.childGrade =
        document.getElementById("signup-child-class")?.value || "";
      extraData.childGoal = document.getElementById("signup-goal")?.value || "";
    } else if (role === "student") {
      extraData.activeClass =
        document.getElementById("signup-class")?.value || "";
      extraData.schoolName =
        document.getElementById("signup-student-school")?.value || "";
      extraData.focusSubject =
        document.getElementById("signup-student-focus")?.value || "";
      extraData.parentContact =
        document.getElementById("signup-student-parent")?.value || "";
    }
    return extraData;
  }

  window.openAuthModal = (mode = "login") => {
    authContainer.classList.add("active");
    switchTab(mode);
    document.body.style.overflow = "hidden";
  };

  function closeModal() {
    authContainer.classList.remove("active");
    document.body.style.overflow = "";
  }

  function switchTab(mode) {
    tabs.forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.authTab === mode);
    });
    forms.forEach((form) => {
      form.classList.toggle("active", form.id === `${mode}-form`);
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.authTab));
  });

  closeBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // Password show / hide toggles
  authContainer.querySelectorAll(".auth-eye").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.eyeFor);
      if (!input) return;
      const reveal = input.type === "password";
      input.type = reveal ? "text" : "password";
      btn.innerHTML = reveal ? AUTH_ICONS.eyeOff : AUTH_ICONS.eye;
      btn.setAttribute("aria-label", reveal ? "Hide password" : "Show password");
    });
  });

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-auth-open]");
    if (!trigger) return;
    e.preventDefault();
    window.openAuthModal(trigger.dataset.authOpen || "login");
  });

  document
    .getElementById("google-login")
    .addEventListener("click", async () => {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        await ensureUserDoc(result.user);
        closeModal();
        goToDashboard();
      } catch (err) {
        console.error(err);
        alert(err.message);
      }
    });

  document
    .getElementById("google-signup")
    .addEventListener("click", async () => {
      if (!validateSignupFields(true)) return;

      try {
        const result = await signInWithPopup(auth, googleProvider);
        const extraData = collectExtraData(selectedRole);

        const userRef = doc(db, "users", result.user.uid);
        const userData = {
          name:
            result.user.displayName ||
            document.getElementById("signup-name").value ||
            "New User",
          email: result.user.email,
          role: result.user.email === ADMIN_EMAIL ? "admin" : selectedRole,
          isPremium: result.user.email === ADMIN_EMAIL,
          createdAt: new Date().toISOString(),
          ...extraData,
        };

        await setDoc(userRef, userData, { merge: true });
        closeModal();
        goToDashboard();
      } catch (err) {
        console.error(err);
        alert(err.message);
      }
    });

  document
    .getElementById("login-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;
      try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        await ensureUserDoc(result.user);
        closeModal();
        goToDashboard();
      } catch (err) {
        console.error(err);
        alert(err.message);
      }
    });

  document
    .getElementById("signup-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!validateSignupFields(false)) return;

      const name = document.getElementById("signup-name").value;
      const email = document.getElementById("signup-email").value;
      const password = document.getElementById("signup-password").value;

      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        await updateProfile(userCredential.user, { displayName: name });

        const extraData = collectExtraData(selectedRole);
        const userData = {
          name: name,
          email: email,
          role: email === ADMIN_EMAIL ? "admin" : selectedRole,
          isPremium: email === ADMIN_EMAIL,
          createdAt: new Date().toISOString(),
          ...extraData,
        };

        await setDoc(doc(db, "users", userCredential.user.uid), userData);
        closeModal();
        goToDashboard();
      } catch (err) {
        console.error(err);
        alert(err.message);
      }
    });

  async function ensureUserDoc(user) {
    const userRef = doc(db, "users", user.uid);
    let snap = await getDoc(userRef);

    if (snap.exists()) {
      if (user.email === ADMIN_EMAIL && snap.data().role !== "admin") {
        await setDoc(
          userRef,
          { role: "admin", isPremium: true },
          { merge: true },
        );
      }
      return;
    }

    const q = query(collection(db, "users"), where("email", "==", user.email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const existingData = querySnapshot.docs[0].data();
      await setDoc(userRef, existingData, { merge: true });
      return;
    }

    await setDoc(userRef, {
      name: user.displayName || "New User",
      email: user.email,
      role: user.email === ADMIN_EMAIL ? "admin" : "student",
      isPremium: user.email === ADMIN_EMAIL,
      createdAt: new Date().toISOString(),
    });
  }
}

document.addEventListener("DOMContentLoaded", injectAuthModal);
