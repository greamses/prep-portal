import { auth, db } from "../../../firebase-init.js";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "/node_modules/firebase/firebase-firestore.js";

/* =============================================
   STYLE LOADER
============================================= */
function ensureModalStyles() {
  if (document.getElementById("db-modal-styles")) return;
  const link = document.createElement("link");
  link.id = "db-modal-styles";
  link.rel = "stylesheet";
  link.href = "/home/js/dashboard/dashboard-modals.css";
  document.head.appendChild(link);
}

/* =============================================
   MODAL CORE
============================================= */
function ensureModalContainer() {
  let container = document.getElementById("db-modal-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "db-modal-container";
    document.body.appendChild(container);

    // Global esc key listener for closing
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
  }
  return container;
}

function closeModal() {
  const container = document.getElementById("db-modal-container");
  if (container) container.classList.remove("active");
  document.body.style.overflow = "";
}

/* =============================================
   NEW ASSIGNMENT (TEACHER)
============================================= */
export function showAssignmentModal() {
  ensureModalStyles();
  const container = ensureModalContainer();

  container.innerHTML = `
    <div class="db-modal-overlay"></div>
    <div class="db-modal">
      <div class="db-modal-header">
        <h3>New Math Assignment</h3>
        <button class="db-modal-close" id="close-modal" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"/><path d="M6 6L18 18"/></svg>
        </button>
      </div>
      <form id="assignment-form" class="db-modal-form">
        <div class="db-modal-field">
          <label>Assignment Title</label>
          <input type="text" id="assign-title" placeholder="e.g. Quadratic Equations Practice" required />
        </div>
        <div class="db-modal-field">
          <label>Subject / Topic</label>
          <input type="text" id="assign-subject" placeholder="e.g. Algebra" required />
        </div>
        <div class="db-modal-field">
          <label>Due Date</label>
          <input type="date" id="assign-date" required />
        </div>
        <button type="submit" class="db-modal-submit">Create Assignment</button>
      </form>
    </div>`;

  container.classList.add("active");
  document.body.style.overflow = "hidden";

  container.querySelector("#close-modal").onclick = closeModal;
  container.querySelector(".db-modal-overlay").onclick = closeModal;

  const form = container.querySelector("#assignment-form");
  form.onsubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const btn = form.querySelector(".db-modal-submit");
    btn.disabled = true;
    btn.textContent = "Creating...";

    try {
      await addDoc(collection(db, "assignments"), {
        title: document.getElementById("assign-title").value,
        subject: document.getElementById("assign-subject").value,
        dueDate: document.getElementById("assign-date").value,
        teacherId: user.uid,
        status: "pending",
        progress: 0,
        createdAt: serverTimestamp(),
      });
      closeModal();
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
      btn.disabled = false;
      btn.textContent = "Create Assignment";
    }
  };
}

/* =============================================
   NEW CLASS (ADMIN)
============================================= */
export function showClassModal() {
  ensureModalStyles();
  const container = ensureModalContainer();

  container.innerHTML = `
    <div class="db-modal-overlay"></div>
    <div class="db-modal">
      <div class="db-modal-header">
        <h3>Create New Math Class</h3>
        <button class="db-modal-close" id="close-modal" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"/><path d="M6 6L18 18"/></svg>
        </button>
      </div>
      <form id="class-form" class="db-modal-form">
        <div class="db-modal-field">
          <label>Class Name</label>
          <input type="text" id="class-name" placeholder="e.g. Grade 9 Advanced Math" required />
        </div>
        <div class="db-modal-field">
          <label>Assigned Teacher Email</label>
          <input type="email" id="teacher-email" placeholder="teacher@email.com" />
        </div>
        <button type="submit" class="db-modal-submit">Create Class</button>
      </form>
    </div>`;

  container.classList.add("active");
  document.body.style.overflow = "hidden";

  container.querySelector("#close-modal").onclick = closeModal;
  container.querySelector(".db-modal-overlay").onclick = closeModal;

  const form = container.querySelector("#class-form");
  form.onsubmit = async (e) => {
    e.preventDefault();
    const btn = form.querySelector(".db-modal-submit");
    btn.disabled = true;
    btn.textContent = "Creating...";

    try {
      await addDoc(collection(db, "classes"), {
        name: document.getElementById("class-name").value,
        teacherEmail: document.getElementById("teacher-email").value || null,
        studentCount: 0,
        createdAt: serverTimestamp(),
      });
      closeModal();
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
      btn.disabled = false;
      btn.textContent = "Create Class";
    }
  };
}

/* =============================================
   LINK CHILD (PARENT)
============================================= */
export function showLinkChildModal() {
  ensureModalStyles();
  const container = ensureModalContainer();

  container.innerHTML = `
    <div class="db-modal-overlay"></div>
    <div class="db-modal">
      <div class="db-modal-header">
        <h3>Link Child Account</h3>
        <button class="db-modal-close" id="close-modal" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"/><path d="M6 6L18 18"/></svg>
        </button>
      </div>
      <form id="link-child-form" class="db-modal-form">
        <div class="db-modal-field">
          <label>Child's Email Address</label>
          <input type="email" id="child-email" placeholder="student@email.com" required />
        </div>
        <p class="db-modal-hint">Enter the email your child uses to log in to Prep Portal.</p>
        <button type="submit" class="db-modal-submit">Send Link Request</button>
      </form>
    </div>`;

  container.classList.add("active");
  document.body.style.overflow = "hidden";

  container.querySelector("#close-modal").onclick = closeModal;
  container.querySelector(".db-modal-overlay").onclick = closeModal;

  const form = container.querySelector("#link-child-form");
  form.onsubmit = async (e) => {
    e.preventDefault();
    const btn = form.querySelector(".db-modal-submit");
    btn.disabled = true;
    btn.textContent = "Processing...";

    // Placeholder for invitation/linking logic
    setTimeout(() => {
      alert(
        "Linking request sent to " +
          document.getElementById("child-email").value,
      );
      closeModal();
    }, 1000);
  };
}
