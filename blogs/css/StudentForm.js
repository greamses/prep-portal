export function renderStudentForm() {
  return `
    <form id="student-signup-form" class="signup-form">
      <div class="form-field">
        <label>Student Name</label>
        <input type="text" placeholder="e.g. Chidi Obi" required>
      </div>
      <div class="form-field">
        <label>Current Class</label>
        <select required>
          <option value="jss1">JSS 1</option>
          <option value="ss1">SS 1</option>
        </select>
      </div>
      <button type="submit" class="btn btn-primary" style="width:100%">Create Student Account</button>
    </form>
  `;
}
