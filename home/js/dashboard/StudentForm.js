// StudentForm.js
const CHEVRON = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="pp-select-chevron"><g transform="rotate(90 12 12)"><path d="M9.4 3.9 17 11.1a1.25 1.25 0 0 1 0 1.8L9.4 20.1a1.3 1.3 0 0 1-1.8-1.9L14 12 7.6 5.8a1.3 1.3 0 0 1 1.8-1.9z" fill="var(--accent-secondary)"/></g></svg>`;

export function renderStudentFields() {
  return `
    <div class="auth-row">
      <div class="auth-field">
        <label>Current Class</label>
        <div class="pp-select pp-select--lg" data-id="signup-class">
          <button type="button" class="pp-select-trigger">
            <span>Select Class</span>
            ${CHEVRON}
          </button>
          <div class="pp-select-menu">
            <div class="pp-select-item" data-value="jss1">JSS 1</div>
            <div class="pp-select-item" data-value="jss2">JSS 2</div>
            <div class="pp-select-item" data-value="jss3">JSS 3</div>
            <div class="pp-select-item" data-value="ss1">SS 1</div>
            <div class="pp-select-item" data-value="ss2">SS 2</div>
            <div class="pp-select-item" data-value="ss3">SS 3</div>
          </div>
          <input type="hidden" id="signup-class" required />
        </div>
      </div>
      <div class="auth-field">
        <label>Primary Focus Subject</label>
        <div class="pp-select pp-select--lg" data-id="signup-student-focus">
          <button type="button" class="pp-select-trigger">
            <span>Select Subject</span>
            ${CHEVRON}
          </button>
          <div class="pp-select-menu">
            <div class="pp-select-item" data-value="Mathematics">Mathematics</div>
            <div class="pp-select-item" data-value="English Language">English Language</div>
            <div class="pp-select-item" data-value="Sciences">General Sciences</div>
            <div class="pp-select-item" data-value="All Subjects">All Subjects</div>
          </div>
          <input type="hidden" id="signup-student-focus" required />
        </div>
      </div>
    </div>
    <div class="auth-field">
      <label>School Name</label>
      <input type="text" id="signup-student-school" placeholder="e.g. Grace High School" required />
    </div>
    <div class="auth-field">
      <label>Parent's Email / Phone</label>
      <input type="text" id="signup-student-parent" placeholder="parent@mail.com" required />
    </div>
  `;
}
