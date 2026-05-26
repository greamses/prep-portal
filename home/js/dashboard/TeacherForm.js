// TeacherForm.js
const CHEVRON = `<svg class="pp-select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`;

export function renderTeacherFields() {
  return `
    <div class="auth-field">
      <label>School Name</label>
      <input type="text" id="signup-school" placeholder="e.g. Westside Academy" required />
    </div>
    <div class="auth-field">
      <label>Contact Phone</label>
      <input type="tel" id="signup-teacher-phone" placeholder="+234..." required />
    </div>
    <div class="auth-row">
      <div class="auth-field">
        <label>Years of Experience</label>
        <div class="pp-select pp-select--lg" data-id="signup-experience">
          <button type="button" class="pp-select-trigger">
            <span>Select Experience</span>
            ${CHEVRON}
          </button>
          <div class="pp-select-menu">
            <div class="pp-select-item" data-value="0-2">0 - 2 Years</div>
            <div class="pp-select-item" data-value="3-5">3 - 5 Years</div>
            <div class="pp-select-item" data-value="5-10">5 - 10 Years</div>
            <div class="pp-select-item" data-value="10+">10+ Years</div>
          </div>
          <input type="hidden" id="signup-experience" required />
        </div>
      </div>
      <div class="auth-field">
        <label>Primary Specialization</label>
        <div class="pp-select pp-select--lg" data-id="signup-subject">
          <button type="button" class="pp-select-trigger">
            <span>Select Specialization</span>
            ${CHEVRON}
          </button>
          <div class="pp-select-menu">
            <div class="pp-select-item" data-value="Mathematics">Mathematics</div>
            <div class="pp-select-item" data-value="English Language">English Language</div>
            <div class="pp-select-item" data-value="Sciences">Sciences (Physics/Chemistry)</div>
            <div class="pp-select-item" data-value="General Studies">General Studies</div>
          </div>
          <input type="hidden" id="signup-subject" required />
        </div>
      </div>
    </div>
    <div class="auth-field">
      <label>Class Size</label>
      <input type="number" id="signup-students" placeholder="30" min="1" required />
    </div>
    <div class="auth-field">
      <label>Job Position</label>
      <input type="text" id="signup-position" placeholder="e.g. Senior Math Lead" required />
    </div>
  `;
}
