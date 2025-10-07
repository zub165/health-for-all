import axios from 'axios';
import { Patient, Vitals, Doctor, Recommendation, ApiResponse } from '../types';
import { getApiBaseUrl, isDemoMode } from '../config/api';

const API_BASE_URL = getApiBaseUrl();

// Create axios instance only if we have a backend URL
const api = API_BASE_URL ? axios.create({
  baseURL: API_BASE_URL,
  // Do not set Content-Type globally to avoid preflight on GET
  withCredentials: false, // Keep false unless using cookies
  timeout: 10000, // 10 second timeout
}) : null;

// Interceptors: remove Content-Type on GET and validate content-type for JSON responses
if (api) {
  api.interceptors.request.use((config) => {
    const method = (config.method || 'get').toLowerCase();
    // Ensure headers object exists
    if (!config.headers) config.headers = {} as any;

    // Remove Content-Type on GET to avoid preflight
    if (method === 'get') {
      if ((config.headers as any).set) {
        // AxiosHeaders instance
        (config.headers as any).delete?.('Content-Type');
      } else if ('Content-Type' in (config.headers as any)) {
        delete (config.headers as any)['Content-Type'];
      }
    }

    // Set Accept header safely
    if ((config.headers as any).set) {
      (config.headers as any).set('Accept', 'application/json');
    } else {
      (config.headers as any)['Accept'] = 'application/json';
    }

    return config;
  });

  api.interceptors.response.use(
    (response) => {
      const method = (response.config.method || 'get').toLowerCase();
      const contentType = String(response.headers['content-type'] || '');
      if (method === 'get' && !contentType.includes('application/json')) {
        const dataPreview = typeof response.data === 'string' ? response.data.slice(0, 200) : '';
        return Promise.reject(new Error(`Expected JSON, got ${contentType || 'unknown'} — ${dataPreview}`));
      }
      return response;
    },
    async (error) => {
      const status = error?.response?.status;
      const statusText = error?.response?.statusText || '';
      const ct = String(error?.response?.headers?.['content-type'] || '');
      let body = '';
      try {
        body = typeof error?.response?.data === 'string' ? error.response.data : JSON.stringify(error?.response?.data);
      } catch {}
      return Promise.reject(new Error(`HTTP ${status} ${statusText} — ct:${ct} — ${body.slice(0, 200)}`));
    }
  );
}

// Helper function to check if API is available
const isApiAvailable = (): boolean => {
  return api !== null && !isDemoMode();
};

// Patient API calls
export const patientApi = {
  create: async (patient: Omit<Patient, 'id'>): Promise<ApiResponse<Patient>> => {
    if (!isApiAvailable()) {
      // Demo mode: simulate successful creation
      const demoPatient: Patient = {
        ...patient,
        id: `demo_${Date.now()}`,
      };
      return { success: true, data: demoPatient, message: 'Patient created successfully (Demo Mode)' };
    }
    
    // Transform frontend data to Django backend format
    const backendPatient = {
      first_name: patient.firstName || '',
      last_name: patient.lastName || '',
      email: patient.email || '',
      phone: patient.phoneNumber || '',
      date_of_birth: patient.dateOfBirth || '',
      gender: patient.gender || 'male',
      address: patient.address || '',
      blood_type: patient.bloodGroup && patient.bloodGroup !== '' ? patient.bloodGroup : null,
    };
    
    const response = await api!.post('/patients/', backendPatient);
    return response.data;
  },

  getAll: async (): Promise<ApiResponse<Patient[]>> => {
    if (!isApiAvailable()) {
      // Demo mode: return empty array
      return { success: true, data: [], message: 'No patients found (Demo Mode)' };
    }
    
    const response = await api!.get('/patients/');
    
    // Transform backend data to frontend format
    if (response.data.status === 'success' && response.data.data) {
      const transformedPatients = response.data.data.map((backendPatient: any) => ({
        id: backendPatient.id,
        name: backendPatient.full_name || `${backendPatient.first_name || ''} ${backendPatient.last_name || ''}`.trim(),
        email: backendPatient.email || '',
        phoneNumber: backendPatient.phone || '',
        age: backendPatient.date_of_birth ? new Date().getFullYear() - new Date(backendPatient.date_of_birth).getFullYear() : 0,
        gender: backendPatient.gender || '',
        bloodGroup: backendPatient.blood_type || '',
        // Keep backend fields for compatibility
        first_name: backendPatient.first_name,
        last_name: backendPatient.last_name,
        full_name: backendPatient.full_name,
        date_of_birth: backendPatient.date_of_birth,
        phone: backendPatient.phone,
        blood_type: backendPatient.blood_type,
        health_risk_score: backendPatient.health_risk_score,
        recommended_specialists: backendPatient.recommended_specialists,
        health_trends: backendPatient.health_trends,
        ai_health_insights: backendPatient.ai_health_insights,
      }));
      
      return { success: true, data: transformedPatients, message: 'Patients loaded successfully' };
    }
    
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Patient>> => {
    if (!isApiAvailable()) {
      // Demo mode: return a mock patient
      const mockPatient: Patient = {
        id,
        name: 'Demo Patient',
        email: 'demo@example.com',
        phoneNumber: '123-456-7890',
        age: 30,
        gender: 'Other',
        bloodGroup: 'O+',
        pastMedicalHistory: 'No significant history',
        allergies: 'None',
        familyHistory: 'No significant family history',
        medicationList: 'None',
        registeredAt: new Date().toISOString(),
      };
      return { success: true, data: mockPatient, message: 'Patient retrieved (Demo Mode)' };
    }
    
    const response = await api!.get(`/patients/${id}/`);
    return response.data;
  },

  update: async (id: string, patient: Partial<Patient>): Promise<ApiResponse<Patient>> => {
    if (!isApiAvailable()) {
      // Demo mode: simulate successful update
      const updatedPatient: Patient = {
        id,
        name: 'Demo Patient',
        email: 'demo@example.com',
        phoneNumber: '123-456-7890',
        age: 30,
        gender: 'Other',
        bloodGroup: 'O+',
        pastMedicalHistory: 'No significant history',
        allergies: 'None',
        familyHistory: 'No significant family history',
        medicationList: 'None',
        registeredAt: new Date().toISOString(),
        ...patient,
      };
      return { success: true, data: updatedPatient, message: 'Patient updated successfully (Demo Mode)' };
    }
    
    const response = await api!.put(`/patients/${id}/`, patient);
    return response.data;
  },
};

// Vitals API calls
export const vitalsApi = {
  create: async (vitals: Omit<Vitals, 'id'>): Promise<ApiResponse<Vitals>> => {
    if (!isApiAvailable()) {
      // Demo mode: simulate successful creation
      const demoVitals: Vitals = {
        ...vitals,
        id: `demo_vitals_${Date.now()}`,
      };
      return { success: true, data: demoVitals, message: 'Vitals recorded successfully (Demo Mode)' };
    }
    
    const response = await api!.post('/vitals/', vitals);
    return response.data;
  },

  getByPatientId: async (patientId: string): Promise<ApiResponse<Vitals[]>> => {
    if (!isApiAvailable()) {
      // Demo mode: return empty array
      return { success: true, data: [], message: 'No vitals found (Demo Mode)' };
    }
    
    const response = await api!.get(`/vitals/patient/${patientId}/`);
    return response.data;
  },

  getAll: async (): Promise<ApiResponse<Vitals[]>> => {
    if (!isApiAvailable()) {
      // Demo mode: return empty array
      return { success: true, data: [], message: 'No vitals found (Demo Mode)' };
    }
    
    const response = await api!.get('/vitals/');
    return response.data;
  },
};

// Doctor API calls
export const doctorApi = {
  create: async (doctor: Omit<Doctor, 'id'>): Promise<ApiResponse<Doctor>> => {
    if (!isApiAvailable()) {
      // Demo mode: simulate successful creation
      const demoDoctor: Doctor = {
        ...doctor,
        id: `demo_doctor_${Date.now()}`,
      };
      return { success: true, data: demoDoctor, message: 'Doctor created successfully (Demo Mode)' };
    }
    
    const response = await api!.post('/doctors/', doctor);
    return response.data;
  },

  getAll: async (): Promise<ApiResponse<Doctor[]>> => {
    if (!isApiAvailable()) {
      // Demo mode: return empty array
      return { success: true, data: [], message: 'No doctors found (Demo Mode)' };
    }
    
    const response = await api!.get('/doctors/');
    return response.data;
  },
};

// Recommendation API calls
export const recommendationApi = {
  create: async (recommendation: Omit<Recommendation, 'id'>): Promise<ApiResponse<Recommendation>> => {
    if (!isApiAvailable()) {
      // Demo mode: simulate successful creation
      const demoRecommendation: Recommendation = {
        ...recommendation,
        id: `demo_recommendation_${Date.now()}`,
      };
      return { success: true, data: demoRecommendation, message: 'Recommendation created successfully (Demo Mode)' };
    }
    
    const response = await api!.post('/recommendations/', recommendation);
    return response.data;
  },

  sendEmail: async (recommendationId: string): Promise<ApiResponse<any>> => {
    if (!isApiAvailable()) {
      // Demo mode: simulate successful email sending
      return { success: true, data: { messageId: `demo_${Date.now()}` }, message: 'Email sent successfully (Demo Mode)' };
    }
    
    const response = await api!.post(`/recommendations/${recommendationId}/send-email/`);
    return response.data;
  },
};

export default api;
