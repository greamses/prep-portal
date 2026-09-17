// TeacherForm.js
const CHEVRON = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="pp-select-chevron"><g transform="rotate(90 12 12)"><path d="M9.4 3.9 17 11.1a1.25 1.25 0 0 1 0 1.8L9.4 20.1a1.3 1.3 0 0 1-1.8-1.9L14 12 7.6 5.8a1.3 1.3 0 0 1 1.8-1.9z" fill="var(--accent-secondary)"/></g></svg>`;

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
