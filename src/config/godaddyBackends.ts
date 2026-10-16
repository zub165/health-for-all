/**
 * GoDaddy VPS backends used by Health For ALL Lab + Radiology.
 *
 * Host: api.mywaitime.com (nginx :443 → local services)
 * Server: 208.109.215.53
 */
export const GODADDY_BACKENDS = {
  /** Hospital Finder Django (Gunicorn :3015) — patients, doctors, lab-results */
  hospitalFinder: {
    service: 'django_hospitalfinder.service',
    port: 3015,
    httpsBase: 'https://api.mywaitime.com',
    patients: 'https://api.mywaitime.com/api/patients/',
    doctors: 'https://api.mywaitime.com/api/doctors/',
    /** Attach lab/radiology findings to HFA patient profile (no separate /radiology/) */
    labResults: 'https://api.mywaitime.com/api/lab-results/',
  },
  /**
   * Saeed Lab Management app (same Django process :3015, URL prefix /lab/).
   * Catalog includes Imaging category = Radiology (XRAY, CT, MRI, US).
   */
  labManagement: {
    service: 'django_hospitalfinder.service (lab_management app)',
    port: 3015,
    httpsBase: 'https://api.mywaitime.com/lab',
    root: 'https://api.mywaitime.com/lab/',
    tests: 'https://api.mywaitime.com/lab/tests/',
    categories: 'https://api.mywaitime.com/lab/test-categories/',
    orders: 'https://api.mywaitime.com/lab/test-orders/',
    results: 'https://api.mywaitime.com/lab/test-results/',
    authToken: 'https://api.mywaitime.com/lab/auth/token/',
    spaUi: 'https://api.mywaitime.com/lab-management/',
  },
  /**
   * Optional AI imaging microservices (combined-backend :8004) — NOT order catalog.
   * Urine / skin / retina analysis only.
   */
  aiImaging: {
    service: 'combined_backend.service',
    port: 8004,
    urine: 'https://api.mywaitime.com/api/urine/',
    skin: 'https://api.mywaitime.com/api/skin/',
    retina: 'https://api.mywaitime.com/api/retina/',
  },
} as const;

export const LAB_IMAGING_CODES = ['XRAY', 'CT', 'MRI', 'US'] as const;

export type LabResultCategory =
  | 'blood'
  | 'urine'
  | 'imaging'
  | 'biopsy'
  | 'cardiac'
  | 'pulmonary'
  | 'other';

export function categoryFromLabTest(
  categoryName: string | undefined,
  testCode?: string
): LabResultCategory {
  const code = (testCode || '').toUpperCase();
  if (LAB_IMAGING_CODES.includes(code as (typeof LAB_IMAGING_CODES)[number])) {
    return 'imaging';
  }
  const name = (categoryName || '').toLowerCase();
  if (name.includes('imaging') || name.includes('radiolog')) return 'imaging';
  if (name.includes('urin')) return 'urine';
  if (name.includes('cardio')) return 'cardiac';
  if (name.includes('pulmon') || name.includes('respir')) return 'pulmonary';
  if (name.includes('patholog') || name.includes('biop')) return 'biopsy';
  if (
    name.includes('hemat') ||
    name.includes('chem') ||
    name.includes('liver') ||
    name.includes('renal') ||
    name.includes('endocrin') ||
    name.includes('immun')
  ) {
    return 'blood';
  }
  return 'other';
}
