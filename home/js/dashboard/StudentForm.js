export function renderStudentFields() {
  return `
    <div class="auth-field">
      <label>Current Class</label>
      <select id="signup-class" required>
        <option value="" disabled selected>Select Class</option>
        <option value="jss1">JSS 1</option>
        <option value="jss2">JSS 2</option>
        <option value="jss3">JSS 3</option>
        <option value="ss1">SS 1</option>
        <option value="ss2">SS 2</option>
        <option value="ss3">SS 3</option>
      </select>
    </div>
  `;
}
