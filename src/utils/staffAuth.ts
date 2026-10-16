/** @deprecated use appAuth — re-exports for compatibility */
export {
  type StaffRole,
  type AppSession as StaffSession,
  readStaffSession,
  isStaffLoggedIn,
  clearStaffSession,
  writeStaffSession,
  roleFromEmail,
} from './appAuth';
