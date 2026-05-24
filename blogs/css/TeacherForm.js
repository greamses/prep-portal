export function renderTeacherForm() {
  return `
    <form id="teacher-signup-form" class="signup-form">
      <div class="form-field">
        <label>Staff Name</label>
        <input type="text" placeholder="e.g. Mr. Okeke" required>
      </div>
      <div class="form-field">
        <label>Subject Specialization</label>
        <select required>
          <option value="math">Mathematics</option>
          <option value="eng">English Language</option>
        </select>
      </div>
      <button type="submit" class="btn btn-primary" style="width:100%">Register as Educator</button>
    </form>
  `;
}
