// A local "employee view" preview may only narrow the interface for an admin.
// It never grants administrative access: authorization stays in Cloud roles and
// row policies, so a tampered browser flag can only ever show less, not more.

export function adminUiVisible(isAdmin: boolean, employeePreview: boolean) {
  return isAdmin && !employeePreview;
}

// While previewing, an admin sees the same inbox an employee would: only the
// documents their own account uploaded.
export function inboxFor<T extends { user_id: string }>(
  rows: T[],
  isAdmin: boolean,
  employeePreview: boolean,
  userId: string,
) {
  return isAdmin && employeePreview ? rows.filter((r) => r.user_id === userId) : rows;
}
