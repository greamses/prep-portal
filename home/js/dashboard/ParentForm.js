export function renderParentFields() {
  return `
    <div class="auth-row">
      <div class="auth-field">
        <label>Your Relationship</label>
        <select id="signup-relation" required>
          <option value="Mother">Mother</option>
          <option value="Father">Father</option>
          <option value="Guardian">Guardian</option>
        </select>
      </div>
      <div class="auth-field">
        <label>Contact Phone</label>
        <input type="tel" id="signup-parent-phone" placeholder="+234..." required />
      </div>
    </div>
    <div class="auth-field">
      <label>Child's Full Name</label>
      <input type="text" id="signup-child-name" placeholder="John Doe" required />
    </div>
    <div class="auth-row">
      <div class="auth-field">
        <label>Grade Level</label>
        <select id="signup-grade" required>
          <option value="" disabled selected>Select Grade</option>
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => `<option value="grade-${g}">Grade ${g}</option>`).join("")}
        </select>
      </div>
      <div class="auth-field">
        <label>Learning Goal</label>
        <select id="signup-goal" required>
          <option value="Daily Practice" selected>Daily Practice</option>
          <option value="Exam Preparation">Exam Preparation</option>
          <option value="Remedial Help">Remedial Help</option>
        </select>
      </div>
    </div>
  `;
}
