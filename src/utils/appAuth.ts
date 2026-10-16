/**
 * App-wide role session.
 * doctor/admin → see all patients & volunteers
 * patient/volunteer → see only their own record
 */

export type AppRole = 'admin' | 'doctor' | 'patient' | 'volunteer' | 'guest';

export interface AppSession {
  role: AppRole;
  name: string;
  email: string;
  id?: string;
  loginTime?: string;
}

const STAFF_KEY = 'doctorData';
const PATIENT_KEY = 'hfa_patient_session_v1';
const VOLUNTEER_KEY = 'hfa_volunteer_session_v1';

const ADMIN_EMAILS = new Set(
  ['admin@healthforall.org', 'zub165@yahoo.com'].map((e) => e.toLowerCase())
);

export function staffRoleFromEmail(email: string): 'admin' | 'doctor' {
  return ADMIN_EMAILS.has((email || '').trim().toLowerCase()) ? 'admin' : 'doctor';
}

export function isStaffRole(role: AppRole): boolean {
  return role === 'admin' || role === 'doctor';
}

/** Screens that expose other people's PHI — staff only. */
export const STAFF_ONLY_VIEWS = new Set([
  'ai-assessment',
  'doctor',
  'lab-management',
  'health-fair-dashboard',
  'health-fair-assessment',
  'icd10-diagnosis',
]);

function normEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}

export function clearAllSessions(): void {
  localStorage.removeItem(STAFF_KEY);
  localStorage.removeItem(PATIENT_KEY);
  localStorage.removeItem(VOLUNTEER_KEY);
  localStorage.removeItem('hipaa_access_log');
  localStorage.removeItem('doctorToken');
  localStorage.removeItem('doctorId');
  localStorage.removeItem('dashboardId');
  localStorage.removeItem('doctorName');
}

export function writeStaffSession(partial: {
  name: string;
  email: string;
  id?: string;
  role?: 'admin' | 'doctor';
}): AppSession {
  localStorage.removeItem(PATIENT_KEY);
  localStorage.removeItem(VOLUNTEER_KEY);
  const role = partial.role || staffRoleFromEmail(partial.email);
  const session: AppSession = {
    role,
    name: partial.name,
    email: partial.email,
    id: partial.id,
    loginTime: new Date().toISOString(),
  };
  localStorage.setItem(
    STAFF_KEY,
    JSON.stringify({ ...session, hipaaCompliant: true })
  );
  return session;
}

export function writePatientSession(partial: {
  name: string;
  email: string;
  id?: string;
}): AppSession {
  localStorage.removeItem(STAFF_KEY);
  localStorage.removeItem(VOLUNTEER_KEY);
  const session: AppSession = {
    role: 'patient',
    name: partial.name,
    email: partial.email,
    id: partial.id,
    loginTime: new Date().toISOString(),
  };
  localStorage.setItem(PATIENT_KEY, JSON.stringify(session));
  return session;
}

export function writeVolunteerSession(partial: {
  name: string;
  email: string;
  id?: string;
}): AppSession {
  localStorage.removeItem(STAFF_KEY);
  localStorage.removeItem(PATIENT_KEY);
  const session: AppSession = {
    role: 'volunteer',
    name: partial.name,
    email: partial.email,
    id: partial.id,
    loginTime: new Date().toISOString(),
  };
  localStorage.setItem(VOLUNTEER_KEY, JSON.stringify(session));
  return session;
}

function parseSession(raw: string | null, fallbackRole: AppRole): AppSession | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    const email = String(data.email || '');
    if (!email && !data.name) return null;
    let role: AppRole = data.role || fallbackRole;
    if (fallbackRole === 'doctor' || data.role === 'admin' || data.role === 'doctor') {
      role =
        data.role === 'admin' || data.role === 'doctor'
          ? data.role
          : staffRoleFromEmail(email);
    }
    return {
      role,
      name: String(data.name || email.split('@')[0] || 'User'),
      email,
      id: data.id ? String(data.id) : undefined,
      loginTime: data.loginTime,
    };
  } catch {
    return null;
  }
}

/** Active session: staff wins over patient/volunteer if somehow both exist. */
export function readAppSession(): AppSession | null {
  const staff = parseSession(localStorage.getItem(STAFF_KEY), 'doctor');
  if (staff && isStaffRole(staff.role)) return staff;
  const patient = parseSession(localStorage.getItem(PATIENT_KEY), 'patient');
  if (patient) return { ...patient, role: 'patient' };
  const volunteer = parseSession(localStorage.getItem(VOLUNTEER_KEY), 'volunteer');
  if (volunteer) return { ...volunteer, role: 'volunteer' };
  return null;
}

export function emailsMatch(a?: string, b?: string): boolean {
  return !!a && !!b && normEmail(a) === normEmail(b);
}

export function filterOwnPatientRecords<T extends { id?: string; email?: string }>(
  records: T[],
  session: AppSession | null
): T[] {
  if (!session || session.role !== 'patient') return [];
  return records.filter(
    (r) =>
      (session.id && r.id && String(r.id) === String(session.id)) ||
      emailsMatch(r.email, session.email)
  );
}

export function filterOwnVolunteerRecords<
  T extends { id?: string; email?: string },
>(records: T[], session: AppSession | null): T[] {
  if (!session || session.role !== 'volunteer') return [];
  return records.filter(
    (r) =>
      (session.id && r.id && String(r.id) === String(session.id)) ||
      emailsMatch(r.email, session.email)
  );
}

/** What a role may see from the full hybrid patient list. */
export function scopePatientsForSession<
  T extends { id?: string; email?: string },
>(records: T[], session: AppSession | null): T[] {
  if (!session || session.role === 'guest') return [];
  if (isStaffRole(session.role)) return records;
  if (session.role === 'patient') return filterOwnPatientRecords(records, session);
  return []; // volunteers do not see patient PHI
}

export function scopeVolunteersForSession<
  T extends { id?: string; email?: string },
>(records: T[], session: AppSession | null): T[] {
  if (!session || session.role === 'guest') return [];
  if (isStaffRole(session.role)) return records;
  if (session.role === 'volunteer') return filterOwnVolunteerRecords(records, session);
  return []; // patients do not see volunteer roster
}

// Back-compat aliases used by earlier staffAuth draft
export type StaffRole = 'doctor' | 'admin';
export const readStaffSession = (): AppSession | null => {
  const s = readAppSession();
  return s && isStaffRole(s.role) ? s : null;
};
export const isStaffLoggedIn = (): boolean => !!readStaffSession();
export const clearStaffSession = clearAllSessions;
export const roleFromEmail = staffRoleFromEmail;
