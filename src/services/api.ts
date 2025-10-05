import axios from 'axios';
import { Patient, Vitals, Doctor, Recommendation, ApiResponse } from '../types';

const API_BASE_URL = 'http://localhost:3015/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Patient API calls
export const patientApi = {
  create: async (patient: Omit<Patient, 'id'>): Promise<ApiResponse<Patient>> => {
    const response = await api.post('/patients/', patient);
    return response.data;
  },

  getAll: async (): Promise<ApiResponse<Patient[]>> => {
    const response = await api.get('/patients/');
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Patient>> => {
    const response = await api.get(`/patients/${id}/`);
    return response.data;
  },

  update: async (id: string, patient: Partial<Patient>): Promise<ApiResponse<Patient>> => {
    const response = await api.put(`/patients/${id}/`, patient);
    return response.data;
  },
};

// Vitals API calls
export const vitalsApi = {
  create: async (vitals: Omit<Vitals, 'id'>): Promise<ApiResponse<Vitals>> => {
    const response = await api.post('/vitals/', vitals);
    return response.data;
  },

  getByPatientId: async (patientId: string): Promise<ApiResponse<Vitals[]>> => {
    const response = await api.get(`/vitals/patient/${patientId}/`);
    return response.data;
  },

  getAll: async (): Promise<ApiResponse<Vitals[]>> => {
    const response = await api.get('/vitals/');
    return response.data;
  },
};

// Doctor API calls
export const doctorApi = {
  create: async (doctor: Omit<Doctor, 'id'>): Promise<ApiResponse<Doctor>> => {
    const response = await api.post('/doctors/', doctor);
    return response.data;
  },

  getAll: async (): Promise<ApiResponse<Doctor[]>> => {
    const response = await api.get('/doctors/');
    return response.data;
  },
};

// Recommendation API calls
export const recommendationApi = {
  create: async (recommendation: Omit<Recommendation, 'id'>): Promise<ApiResponse<Recommendation>> => {
    const response = await api.post('/recommendations/', recommendation);
    return response.data;
  },

  sendEmail: async (recommendationId: string): Promise<ApiResponse<any>> => {
    const response = await api.post(`/recommendations/${recommendationId}/send-email/`);
    return response.data;
  },
};

export default api;
