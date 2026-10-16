/**
 * Lab API — GoDaddy Saeed Lab Management
 * HTTPS: https://api.mywaitime.com/lab/ → nginx → django_hospitalfinder :3015
 *
 * Radiology = Imaging category (XRAY / CT / MRI / US) on this same API.
 * Patient profile attach uses /api/lab-results/ via patientLabService (hybrid).
 */
import { GODADDY_BACKENDS } from '../config/godaddyBackends';

const LAB_BASE_URL = GODADDY_BACKENDS.labManagement.httpsBase;
const TOKEN_KEY = 'hfa_lab_jwt_access_v1';

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

  async getTests(): Promise<ApiResponse<LabTest[]>> {
    try {
      const response = await fetch(`${this.baseURL}/tests/?page_size=500`, {
        method: 'GET',
        headers: this.headers(false),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const data = await response.json();
      return { success: true, data: unwrapList<LabTest>(data), message: 'Lab tests loaded' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
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
