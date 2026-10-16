/**
 * Lab API — GoDaddy Saeed Lab Management
 * HTTPS: https://api.mywaitime.com/lab/ → nginx → django_hospitalfinder :3015
 *
 * Radiology = Imaging category (XRAY / CT / MRI / US) on this same API.
 * Patient profile attach uses /api/lab-results/ via patientLabService (hybrid).
 *
 * Live catalog can be rate-limited (429). We cache successes and ship a
 * VPS-exported fallback JSON so clinical-note Lab/MRI pickers keep working.
 */
import { GODADDY_BACKENDS } from '../config/godaddyBackends';
import fallbackCatalog from '../data/labCatalogFallback.json';

const LAB_BASE_URL = GODADDY_BACKENDS.labManagement.httpsBase;
const TOKEN_KEY = 'hfa_lab_jwt_access_v1';
const CATALOG_CACHE_KEY = 'hfa_lab_catalog_cache_v1';

export interface LabTest {
  id: string;
  test_code: string;
  test_name: string;
  category: number;
  category_name: string;
  description: string;
  normal_range: string;
  unit: string;
  price: string;
  preparation_instructions: string;
  turnaround_time: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LabTestCategory {
  id: number;
  name: string;
  description: string;
  is_active?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  source?: 'live' | 'cache' | 'fallback';
}

function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.results)) return obj.results as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];
  }
  return [];
}

function normalizeTests(rows: LabTest[]): LabTest[] {
  return rows
    .filter((t) => t && t.test_code && t.test_name)
    .map((t) => ({
      ...t,
      id: String(t.id),
      test_code: String(t.test_code).toUpperCase(),
      is_active: t.is_active !== false,
    }));
}

function readCachedCatalog(): LabTest[] {
  try {
    const raw = localStorage.getItem(CATALOG_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const rows = Array.isArray(parsed?.data) ? parsed.data : [];
    return normalizeTests(rows);
  } catch {
    return [];
  }
}

function writeCachedCatalog(tests: LabTest[]): void {
  try {
    localStorage.setItem(
      CATALOG_CACHE_KEY,
      JSON.stringify({ data: tests, timestamp: Date.now() })
    );
  } catch {
    /* ignore */
  }
}

class LabApiService {
  private baseURL = LAB_BASE_URL;

  getStoredToken(): string | null {
    try {
      return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  setStoredToken(token: string | null, persist = false): void {
    try {
      if (!token) {
        sessionStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TOKEN_KEY);
        return;
      }
      sessionStorage.setItem(TOKEN_KEY, token);
      if (persist) localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* ignore */
    }
  }

  private headers(auth = false): HeadersInit {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (auth) {
      const token = this.getStoredToken();
      if (token) h.Authorization = `Bearer ${token}`;
    }
    return h;
  }

  /** JWT login against GoDaddy lab_management */
  async login(username: string, password: string): Promise<ApiResponse<{ access: string }>> {
    try {
      const response = await fetch(GODADDY_BACKENDS.labManagement.authToken, {
        method: 'POST',
        headers: this.headers(false),
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.detail || data?.message || `HTTP ${response.status}`);
      }
      const access = data.access || data?.data?.access_token;
      if (!access) throw new Error('No access token in lab login response');
      this.setStoredToken(access, true);
      return { success: true, data: { access }, message: 'Lab API login OK' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Lab login failed',
      };
    }
  }

  private fallbackTests(): LabTest[] {
    const cached = readCachedCatalog();
    if (cached.length > 0) return cached;
    return normalizeTests(fallbackCatalog as LabTest[]);
  }

  /**
   * Live catalog from GoDaddy /lab/tests/.
   * On 429 / network failure → browser cache → VPS-exported fallback (includes MRI/CT/XRAY/US).
   */
  async getTests(): Promise<ApiResponse<LabTest[]>> {
    const urls = [
      `${this.baseURL}/tests/?page_size=500`,
      `${this.baseURL}/tests/?page_size=200`,
      `${this.baseURL}/tests/`,
    ];

    for (const url of urls) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: this.headers(false),
            signal: AbortSignal.timeout(20000),
          });

          if (response.status === 429) {
            await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
            continue;
          }

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          const tests = normalizeTests(unwrapList<LabTest>(data));
          if (tests.length > 0) {
            writeCachedCatalog(tests);
            return {
              success: true,
              data: tests,
              message: `Lab tests loaded live (${tests.length})`,
              source: 'live',
            };
          }
        } catch (error) {
          console.warn('labApi.getTests attempt failed:', url, error);
        }
      }
    }

    const fallback = this.fallbackTests();
    const fromCache = readCachedCatalog().length > 0;
    return {
      success: fallback.length > 0,
      data: fallback,
      message: fromCache
        ? `Using cached lab catalog (${fallback.length}) — live API busy`
        : `Using offline lab catalog (${fallback.length}) — live API unavailable`,
      source: fromCache ? 'cache' : 'fallback',
      error: fallback.length ? undefined : 'Lab catalog unavailable',
    };
  }

  async getTestCategories(): Promise<ApiResponse<LabTestCategory[]>> {
    try {
      const response = await fetch(`${this.baseURL}/test-categories/`, {
        method: 'GET',
        headers: this.headers(false),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const data = await response.json();
      return {
        success: true,
        data: unwrapList<LabTestCategory>(data),
        message: 'Categories loaded',
        source: 'live',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create order on Saeed Lab API (requires JWT + lab patient_id PAT######).
   * Health For ALL primary path is patientLabService → /api/lab-results/.
   */
  async createTestOrder(payload: {
    patient: string;
    doctor?: string | number;
    priority?: string;
    clinical_notes?: string;
    test_items: Array<{ test_id?: string; test_code?: string }>;
  }): Promise<ApiResponse<unknown>> {
    try {
      const response = await fetch(`${this.baseURL}/test-orders/`, {
        method: 'POST',
        headers: this.headers(true),
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          data?.message || data?.detail || JSON.stringify(data?.errors || data) || `HTTP ${response.status}`
        );
      }
      return { success: true, data, message: 'Lab order created on /lab/' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const labApi = new LabApiService();
