// StudentForm.js
const CHEVRON = `<svg class="pp-select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`;

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
