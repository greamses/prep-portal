import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "/node_modules/firebase/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "/node_modules/firebase/firebase-firestore.js";
import { renderStudentFields } from "/home/js/dashboard/StudentForm.js";
import { renderParentFields } from "/home/js/dashboard/ParentForm.js";
import { renderTeacherFields } from "/home/js/dashboard/TeacherForm.js";
import { auth, googleProvider, db } from "/firebase-init.js";
import { ROUTES } from "/home/js/routing.js";

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

  mountPoint.innerHTML = `
  <div class="auth-overlay"></div>
  <div class="auth-modal">
    <button class="auth-close" id="auth-close-btn" aria-label="Close">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 6L6 18"/><path d="M6 6L18 18"/>
      </svg>
    </button>

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
      <div class="auth-sep"></div>

      <div class="auth-field">
        <label>Email Address</label>
        <input type="email" id="login-email" placeholder="student@email.com" required />
      </div>

      <div class="auth-field">
        <label>Password</label>
        <input type="password" id="login-password" placeholder="••••••••" required />
      </div>

      <div class="auth-options">
        <label class="remember-box">
          <input type="checkbox" />
          <span>Remember me</span>
        </label>
        <a href="#">Forgot password?</a>
      </div>

      <button type="submit" class="auth-submit">
        <span>Login to Dashboard</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12H19"/><path d="M12 5L19 12L12 19"/>
        </svg>
      </button>

      <div class="auth-or"><span>or</span></div>

      <button type="button" class="google-btn" id="google-login">
        <svg viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.2-8l-6.5 5C9.7 39.6 16.3 44 24 44z"/>
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.3 5.5-6 7l6.3 5.3C39.3 36.8 44 31 44 24c0-1.3-.1-2.3-.4-3.5z"/>
        </svg>
        <span>Continue with Google</span>
      </button>
    </form>

    <!-- SIGNUP -->
    <form class="auth-form" id="signup-form">
      <div class="auth-heading">
        <h3>Create account.</h3>
        <p>Start preparing smarter today.</p>
      </div>
      <div class="auth-sep"></div>

      <div class="auth-field">
        <label class="auth-label-main" style="text-align:center">I am registering as a...</label>
        <div class="role-toggle-container">
          <button type="button" class="role-toggle-btn active" data-role="student" title="Student">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12.5V16a6 6 0 0 0 12 0v-3.5"/></svg>
          </button>
          <button type="button" class="role-toggle-btn" data-role="parent" title="Parent">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </button>
          <button type="button" class="role-toggle-btn" data-role="teacher" title="Teacher">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          </button>
        </div>
      </div>

      <!-- Dynamic Role Specific Fields -->
      <div id="role-fields-container" class="role-fields"></div>

      <div class="auth-field">
        <label>Full Name</label>
        <input type="text" id="signup-name" placeholder="Emmanuel Daniel" required />
      </div>

      <div class="auth-field">
        <label>Email Address</label>
        <input type="email" id="signup-email" placeholder="student@email.com" required />
      </div>

      <div class="auth-field">
        <label>Password</label>
        <input type="password" id="signup-password" placeholder="Create a strong password" required />
      </div>

      <button type="submit" class="auth-submit">
        <span>Create Account</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12H19"/><path d="M12 5L19 12L12 19"/>
        </svg>
      </button>

      <div class="auth-or"><span>or</span></div>

      <button type="button" class="google-btn" id="google-signup">
        <svg viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.2-8l-6.5 5C9.7 39.6 16.3 44 24 44z"/>
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.3 5.5-6 7l6.3 5.3C39.3 36.8 44 31 44 24c0-1.3-.1-2.3-.4-3.5z"/>
        </svg>
        <span>Sign up with Google</span>
      </button>
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
