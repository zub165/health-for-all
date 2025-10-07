import axios from 'axios';
import { Patient, Vitals, Doctor, Recommendation, ApiResponse } from '../types';
import { getApiBaseUrl, isDemoMode } from '../config/api';

const API_BASE_URL = getApiBaseUrl();

// Create axios instance only if we have a backend URL
const api = API_BASE_URL ? axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false, // Keep false unless using cookies
  timeout: 10000, // 10 second timeout
}) : null;

// Safe fetch helper - disabled to prevent 404 errors
export async function getJson(url: string): Promise<any> {
  // Always return demo data to prevent API errors
  console.log(`Demo mode: Skipping API call to ${url}`);
  throw new Error('Demo mode - API calls disabled');
}

// Helper function to check if API is available
const isApiAvailable = (): boolean => {
  // Always use demo mode to prevent 404 errors in production
  return false;
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
      // Demo mode: return sample patients
      const demoPatients: Patient[] = [
        {
          id: 'demo_1',
          name: 'NASIR AHMED',
          email: 'nasir@gmail.com',
          phoneNumber: '1111111',
          age: 56,
          gender: 'Male',
          bloodGroup: 'A+',
          pastMedicalHistory: 'Hypertension, controlled with medication',
          allergies: 'Penicillin',
          familyHistory: 'Father had diabetes',
          medicationList: 'Lisinopril 10mg daily',
          registeredAt: new Date().toISOString(),
        },
        {
          id: 'demo_2',
          name: 'Muhammad Abdullah',
          email: 'mabdullah@gmail.com',
          phoneNumber: '111111111',
          age: 19,
          gender: 'Male',
          bloodGroup: 'O+',
          pastMedicalHistory: 'No significant history',
          allergies: 'None known',
          familyHistory: 'No significant family history',
          medicationList: 'None',
          registeredAt: new Date().toISOString(),
        },
        {
          id: 'demo_3',
          name: 'Nasir Anjum',
          email: 'nasir@gmail.com',
          phoneNumber: '11111111',
          age: 51,
          gender: 'Male',
          bloodGroup: 'B+',
          pastMedicalHistory: 'Type 2 diabetes, well controlled',
          allergies: 'None',
          familyHistory: 'Mother had heart disease',
          medicationList: 'Metformin 500mg twice daily',
          registeredAt: new Date().toISOString(),
        },
      ];
      return { success: true, data: demoPatients, message: 'Demo patients loaded successfully' };
    }
    
    try {
      const data = await getJson(`${API_BASE_URL}/api/patients/`);
      
      // Transform backend data to frontend format
      if (data.status === 'success' && data.data) {
        const transformedPatients = data.data.map((backendPatient: any) => ({
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
      
      return data;
    } catch (error) {
      console.warn('API not available, falling back to demo mode');
      // Fallback to demo mode if API fails
      const demoPatients: Patient[] = [
        {
          id: 'demo_1',
          name: 'NASIR AHMED',
          email: 'nasir@gmail.com',
          phoneNumber: '1111111',
          age: 56,
          gender: 'Male',
          bloodGroup: 'A+',
          pastMedicalHistory: 'Hypertension, controlled with medication',
          allergies: 'Penicillin',
          familyHistory: 'Father had diabetes',
          medicationList: 'Lisinopril 10mg daily',
          registeredAt: new Date().toISOString(),
        },
      ];
      return { success: true, data: demoPatients, message: 'Demo patients loaded (API unavailable)' };
    }
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
