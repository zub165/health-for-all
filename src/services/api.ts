import axios from 'axios';
import { Patient, Vitals, Doctor, Recommendation, ApiResponse } from '../types';
import { getApiBaseUrl, isDemoMode } from '../config/api';

const API_BASE_URL = getApiBaseUrl();

// Create axios instance only if we have a backend URL
const api = API_BASE_URL ? axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
}) : null;

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
    
    const response = await api!.post('/patients/', patient);
    return response.data;
  },

  getAll: async (): Promise<ApiResponse<Patient[]>> => {
    if (!isApiAvailable()) {
      // Demo mode: return empty array
      return { success: true, data: [], message: 'No patients found (Demo Mode)' };
    }
    
    const response = await api!.get('/patients/');
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
