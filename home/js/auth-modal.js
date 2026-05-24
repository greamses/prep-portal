// ============================================
// AUTH MODAL INJECTABLE COMPONENT
// auth-modal.js
// ============================================

import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { auth, googleProvider, db } from "../../firebase-init.js";

const DASHBOARD_PATH = "/dashboard.html";
const ADMIN_EMAIL = "eemadanyel@gmail.com";

function goToDashboard() {
  window.location.href = DASHBOARD_PATH;
}

// ============================================
// INJECT AUTH MODAL
// ============================================

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
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8"
        stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 6L6 18"/><path d="M6 6L18 18"/>
      </svg>
    </button>

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
        <input type="email" placeholder="student@email.com" required />
      </div>

      <div class="auth-field">
        <label>Password</label>
        <input type="password" placeholder="••••••••" required />
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
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8"
          stroke-linecap="round" stroke-linejoin="round">
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
        <label class="auth-label-main">Select Your Role</label>
        <div class="role-selection">
          <button type="button" class="role-card active" data-role="teacher">
            <div class="role-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                <circle cx="12" cy="10" r="2"></circle>
              </svg>
            </div>
            <div class="role-info">
              <strong>Teacher</strong>
              <small>Manage classrooms</small>
            </div>
            <div class="role-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
          </button>
          <button type="button" class="role-card" data-role="parent">
            <div class="role-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <div class="role-info">
              <strong>Parent</strong>
              <small>Monitor progress</small>
            </div>
            <div class="role-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
          </button>
        </div>
      </div>

      <!-- Teacher Specific -->
      <div class="role-fields" data-role-section="teacher">
        <div class="auth-row">
          <div class="auth-field">
            <label>School Name</label>
            <input type="text" id="signup-school" placeholder="e.g. Westside Academy" />
          </div>
          <div class="auth-field" style="max-width: 120px;">
            <label>Class Size</label>
            <input type="number" id="signup-students" placeholder="30" min="1" />
          </div>
        </div>
        <div class="auth-row">
          <div class="auth-field">
            <label>Years of Experience</label>
            <select id="signup-experience">
              <option value="0-2">0 - 2 Years</option>
              <option value="3-5">3 - 5 Years</option>
              <option value="5-10">5 - 10 Years</option>
              <option value="10+">10+ Years</option>
            </select>
          </div>
          <div class="auth-field">
            <label>Job Position</label>
            <input type="text" id="signup-position" placeholder="e.g. Senior Math Lead" />
          </div>
        </div>
        <div class="auth-field">
          <label>Primary Level / Specialization</label>
          <input type="text" id="signup-subject" placeholder="e.g. Grade 9 Mathematics" />
        </div>
      </div>

      <!-- Parent Specific -->
      <div class="role-fields" data-role-section="parent" style="display: none;">
        <div class="auth-row">
          <div class="auth-field">
            <label>Your Relationship</label>
            <select id="signup-relation">
              <option value="Mother">Mother</option>
              <option value="Father">Father</option>
              <option value="Guardian">Guardian</option>
            </select>
          </div>
          <div class="auth-field">
            <label>Contact Phone</label>
            <input type="tel" id="signup-parent-phone" placeholder="+234..." />
          </div>
        </div>
        <div class="auth-field">
          <label>Child's Full Name</label>
          <input type="text" id="signup-child-name" placeholder="John Doe" />
        </div>
        <div class="auth-row">
          <div class="auth-field">
            <label>Grade Level</label>
            <select id="signup-grade">
              <option value="" disabled selected>Select Grade</option>
              ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => `<option value="grade-${g}">Grade ${g}</option>`).join("")}
            </select>
          </div>
          <div class="auth-field">
            <label>Learning Goal</label>
            <select id="signup-goal">
              <option value="Daily Practice" selected>Daily Practice</option>
              <option value="Exam Preparation">Exam Preparation</option>
              <option value="Remedial Help">Remedial Help</option>
            </select>
          </div>
        </div>
      </div>

      <div class="auth-field">
        <label>Full Name</label>
        <input type="text" placeholder="Emmanuel Daniel" required />
      </div>

      <div class="auth-field">
        <label>Email Address</label>
        <input type="email" placeholder="student@email.com" required />
      </div>

      <div class="auth-field">
        <label>Password</label>
        <input type="password" placeholder="Create a strong password" required />
      </div>

      <button type="submit" class="auth-submit">
        <span>Create Account</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8"
          stroke-linecap="round" stroke-linejoin="round">
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

  `;

  initializeAuthModal(mountPoint);
}

// ============================================
// INITIALIZE
// ============================================

function initializeAuthModal(authContainer) {
  const closeBtn = document.getElementById("auth-close-btn");
  const modal = authContainer.querySelector(".auth-modal");
  const overlay = authContainer.querySelector(".auth-overlay");
  const tabs = authContainer.querySelectorAll(".auth-tab");
  const forms = authContainer.querySelectorAll(".auth-form");

  // ============================================
  // ROLE SELECTION LOGIC
  // ============================================
  let selectedRole = "teacher";
  const roleCards = authContainer.querySelectorAll(".role-card");
  const roleSections = authContainer.querySelectorAll(".role-fields");

  roleCards.forEach((card) => {
    card.addEventListener("click", () => {
      roleCards.forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
      selectedRole = card.dataset.role;

      // Toggle specific fields
      roleSections.forEach((section) => {
        section.style.display =
          section.dataset.roleSection === selectedRole ? "flex" : "none";
      });
    });
  });

  // ============================================
  // OPEN MODAL
  // ============================================

  window.openAuthModal = (mode = "login") => {
    authContainer.classList.add("active");
    switchTab(mode);
    document.body.style.overflow = "hidden";
  };

  // ============================================
  // CLOSE MODAL
  // ============================================

  function closeModal() {
    authContainer.classList.remove("active");
    document.body.style.overflow = "";
  }

  // ============================================
  // SWITCH TAB
  // ============================================

  function switchTab(mode) {
    modal?.classList.toggle("signup-mode", mode === "signup");
    tabs.forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.authTab === mode);
    });
    forms.forEach((form) => {
      form.classList.toggle("active", form.id === `${mode}-form`);
    });
  }

  // ============================================
  // TAB EVENTS
  // ============================================

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.authTab));
  });

  // ============================================
  // CLOSE EVENTS
  // ============================================

  closeBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // ============================================
  // OPEN TRIGGERS
  // ============================================

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-auth-open]");
    if (!trigger) return;
    e.preventDefault();
    window.openAuthModal(trigger.dataset.authOpen || "login");
  });

  // ============================================
  // GOOGLE LOGIN
  // ============================================

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

  // ============================================
  // GOOGLE SIGNUP
  // ============================================

  document
    .getElementById("google-signup")
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

  // ============================================
  // EMAIL LOGIN
  // ============================================

  document
    .getElementById("login-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = e.target.querySelector('input[type="email"]').value;
      const password = e.target.querySelector('input[type="password"]').value;
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

  // ============================================
  // EMAIL SIGNUP
  // ============================================

  document
    .getElementById("signup-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = e.target.querySelector('input[type="text"]').value;
      const email = e.target.querySelector('input[type="email"]').value;
      const password = e.target.querySelector('input[type="password"]').value;
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        await updateProfile(userCredential.user, { displayName: name });

        const extraData = {};
        if (selectedRole === "teacher") {
          extraData.schoolName =
            document.getElementById("signup-school")?.value || "";
          extraData.totalStudents =
            parseInt(document.getElementById("signup-students")?.value) || 0;
          extraData.activeClass =
            document.getElementById("signup-subject")?.value || "Mathematics";
          extraData.experience =
            document.getElementById("signup-experience")?.value || "";
          extraData.position =
            document.getElementById("signup-position")?.value || "";
        } else if (selectedRole === "parent") {
          extraData.childName =
            document.getElementById("signup-child-name")?.value || "";
          extraData.childGrade =
            document.getElementById("signup-grade")?.value || "";
          extraData.childGoal =
            document.getElementById("signup-goal")?.value || "Daily Practice";
          extraData.relationship =
            document.getElementById("signup-relation")?.value || "";
          extraData.phone =
            document.getElementById("signup-parent-phone")?.value || "";
        }

        // Initialize Firestore Document with the selected role
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

  // Helper to ensure a doc exists (useful for Google signups)
  async function ensureUserDoc(user) {
    const userRef = doc(db, "users", user.uid);
    let snap = await getDoc(userRef);

    if (snap.exists()) {
      // Ensure designated admin email is always promoted if currently a student/teacher
      if (user.email === ADMIN_EMAIL && snap.data().role !== "admin") {
        await setDoc(
          userRef,
          { role: "admin", isPremium: true },
          { merge: true },
        );
      }
      return;
    }

    // If UID doesn't exist, check if a document with this email already exists
    // (Handles cases where a user switches login methods but accounts weren't linked in Auth)
    const q = query(collection(db, "users"), where("email", "==", user.email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Move existing data to the new UID to keep it consistent
      const existingData = querySnapshot.docs[0].data();
      await setDoc(userRef, existingData, { merge: true });
      return;
    }

    // Truly new user
    await setDoc(userRef, {
      name: user.displayName || "New User",
      email: user.email,
      role: user.email === ADMIN_EMAIL ? "admin" : "student",
      isPremium: user.email === ADMIN_EMAIL,
      createdAt: new Date().toISOString(),
    });
  }
}

// ============================================
// AUTO INIT
// ============================================

document.addEventListener("DOMContentLoaded", injectAuthModal);
