// ParentForm.js
const CHEVRON = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="pp-select-chevron"><g transform="rotate(90 12 12)"><path d="M9.4 3.9 17 11.1a1.25 1.25 0 0 1 0 1.8L9.4 20.1a1.3 1.3 0 0 1-1.8-1.9L14 12 7.6 5.8a1.3 1.3 0 0 1 1.8-1.9z" fill="var(--accent-secondary)"/></g></svg>`;

export function renderParentFields() {
  return `
    <div class="auth-row">
      <div class="auth-field">
        <label>Your Relationship</label>
        <div class="pp-select pp-select--lg" data-id="signup-relation">
          <button type="button" class="pp-select-trigger">
            <span>Select Relationship</span>
            ${CHEVRON}
          </button>
          <div class="pp-select-menu">
            <div class="pp-select-item" data-value="Mother">Mother</div>
            <div class="pp-select-item" data-value="Father">Father</div>
            <div class="pp-select-item" data-value="Guardian">Guardian</div>
          </div>
          <input type="hidden" id="signup-relation" required />
        </div>
      </div>
      <div class="auth-field">
        <label>Child's Current Class</label>
        <div class="pp-select pp-select--lg" data-id="signup-child-class">
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
          <input type="hidden" id="signup-child-class" required />
        </div>
      </div>
    </div>
    <div class="auth-field">
      <label>Contact Phone</label>
      <input type="tel" id="signup-parent-phone" placeholder="+234..." required />
    </div>
    <div class="auth-field">
      <label>Child's Full Name</label>
      <input type="text" id="signup-child-name" placeholder="John Doe" required />
    </div>
    <div class="auth-field">
      <label>Learning Goal</label>
      <div class="pp-select pp-select--lg" data-id="signup-goal">
        <button type="button" class="pp-select-trigger">
          <span>Select Goal</span>
          ${CHEVRON}
        </button>
        <div class="pp-select-menu">
          <div class="pp-select-item" data-value="Daily Practice">Daily Practice</div>
          <div class="pp-select-item" data-value="Exam Preparation">Exam Prep (WAEC/NECO/JAMB)</div>
          <div class="pp-select-item" data-value="Remedial Help">Remedial Help</div>
        </div>
        <input type="hidden" id="signup-goal" required />
      </div>
    </div>
  `;
}
