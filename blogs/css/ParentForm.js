export function renderParentForm() {
  return `
    <form id="parent-signup-form" class="signup-form">
      <div class="form-field">
        <label>Parent/Guardian Name</label>
        <input type="text" placeholder="e.g. Mrs. Adebayo" required>
      </div>
      <div class="form-field">
        <label>Emergency Contact</label>
        <input type="tel" placeholder="+234..." required>
      </div>
      <button type="submit" class="btn btn-primary" style="width:100%">Create Parent Account</button>
    </form>
  `;
}
