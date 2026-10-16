import axios from 'axios';
import { Patient, Vitals, Doctor, Recommendation, ApiResponse } from '../types';
import { getApiBaseUrl, API_ENDPOINTS } from '../config/api';

const API_BASE_URL = getApiBaseUrl();

// Create axios instance only if we have a backend URL
const api = API_BASE_URL ? axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false, // Keep false unless using cookies
  timeout: 10000, // 10 second timeout
}) : null;

// Safe fetch helper with proper error handling
export async function getJson(url: string): Promise<any> {
  try {
    console.log(`Making API call to: ${url}`);
    const response = await fetch(url, {
      method: 'GET',
  headers: {
    'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors', // Enable CORS
    });

    if (!response.ok) {
      console.warn(`API endpoint not available: ${url} (${response.status})`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('API response:', data);
    return data;
  } catch (error) {
    console.error(`API call failed for ${url}:`, error);
    throw error;
  }
}

// Helper function to check if API is available
const isApiAvailable = (): boolean => {
  const baseUrl = getApiBaseUrl();
  return baseUrl !== ''; // API is available if we have a base URL
};

// Helper function to calculate date of birth from age
const calculateDateOfBirth = (age: number): string => {
  const today = new Date();
  const birthYear = today.getFullYear() - age;
  return `${birthYear}-01-01`; // Default to January 1st
};

// Patient API calls
export const patientApi = {
  create: async (patient: Omit<Patient, 'id'>): Promise<ApiResponse<Patient>> => {
    // HYBRID STORAGE: Try backend first, then local storage
    try {
      const baseUrl = getApiBaseUrl();
      const patientsUrl = `${baseUrl}${API_ENDPOINTS.PATIENTS}`;
      console.log(`Attempting to create patient at: ${patientsUrl}`);
      console.log('Frontend patient data:', patient);
      
      // Transform frontend data to Django backend format (COMPLETE format with all medical fields)
      const backendPatient = {
        // REQUIRED FIELDS
        first_name: patient.name ? patient.name.split(' ')[0] : '',
        last_name: patient.name ? patient.name.split(' ').slice(1).join(' ') : '',
        email: patient.email || '',
        phone: patient.phoneNumber || '',
        date_of_birth: patient.dateOfBirth || calculateDateOfBirth(patient.age || 30), // Convert age to date
        gender: patient.gender ? patient.gender.toLowerCase() : 'male',
        address: patient.address || 'Not provided', // REQUIRED FIELD
        
        // OPTIONAL FIELDS
        blood_type: patient.bloodGroup && patient.bloodGroup !== '' ? patient.bloodGroup : null,
        allergies: patient.allergies ? (Array.isArray(patient.allergies) ? patient.allergies : [patient.allergies]) : [],
        emergency_contact: patient.emergencyContact || {},
        
        // NEW MEDICAL FIELDS (added to backend)
        past_medical_history: patient.pastMedicalHistory || null,
        family_history: patient.familyHistory || null,
        current_medications: patient.medicationList ? 
          (Array.isArray(patient.medicationList) ? patient.medicationList : patient.medicationList.split(',').map(m => m.trim())) : []
      };
      
      console.log('Backend patient data being sent:', backendPatient);
      
      const response = await fetch(patientsUrl, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit', // Don't send cookies
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendPatient),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Successfully created patient in database:', data);
        return { success: true, data: data.data || data, message: 'Patient created successfully in database' };
      } else {
        const errorText = await response.text();
        console.error(`API returned ${response.status}:`, errorText);
        console.error('Backend error details:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
          requestData: backendPatient
        });
        console.warn(`API returned ${response.status}, falling back to local storage`);
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.warn('Failed to connect to database, saving to local storage:', error);
      
      // HIPAA COMPLIANCE: No local storage of patient data
      console.error('HIPAA VIOLATION PREVENTED: Cannot store patient data in browser localStorage');
      console.error('Patient data must be stored in encrypted backend database only');
      
      // Return error instead of storing in localStorage
      return { 
        success: false, 
        data: undefined, 
        message: 'HIPAA Compliance: Patient data cannot be stored in browser. Please ensure backend database is available.' 
      };
    }
  },

  getAll: async (): Promise<ApiResponse<Patient[]>> => {
    // HYBRID STORAGE: Try backend first, then local storage, then demo data
    try {
      const baseUrl = getApiBaseUrl();
      const patientsUrl = `${baseUrl}${API_ENDPOINTS.PATIENTS}`;
      console.log(`🔍 DEBUG: Attempting to fetch patients from: ${patientsUrl}`);
      console.log(`🔍 DEBUG: Base URL: ${baseUrl}`);
      console.log(`🔍 DEBUG: Full URL: ${patientsUrl}`);
      
      const response = await fetch(patientsUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit', // Don't send cookies
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      console.log('API Response Status:', response.status);
      console.log('API Response Headers:', response.headers);

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        console.log('Response Content-Type:', contentType);
        
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Response is not JSON, received:', contentType);
          throw new Error(`Expected JSON response, got ${contentType}`);
        }
        
        const data = await response.json();
        console.log('Successfully fetched patients from database:', data);
        
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
            allergies: backendPatient.allergies, // Ensure allergies is passed as is
            pastMedicalHistory: backendPatient.past_medical_history,
            familyHistory: backendPatient.family_history,
            medicationList: backendPatient.medication_list,
            health_risk_score: backendPatient.health_risk_score,
            recommended_specialists: backendPatient.recommended_specialists,
            health_trends: backendPatient.health_trends,
            ai_health_insights: backendPatient.ai_health_insights,
          }));
          
          return { success: true, data: transformedPatients, message: 'Patients loaded successfully' };
        }
        return { success: true, data: data.data || data, message: 'Patients loaded from database' };
      } else {
        console.warn(`API returned ${response.status}, falling back to demo mode`);
        throw new Error(`API returned ${response.status}`);
      }
    } catch (error) {
      console.error('🚨 API Error Details:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      console.warn('🚨 Failed to connect to GoDaddy database, trying local storage:', error);
      console.log('🚨 This means your GoDaddy Django server might not be accessible or CORS is not configured properly');
      
      // HIPAA COMPLIANCE: No local storage access
      console.error('HIPAA VIOLATION PREVENTED: Cannot load patient data from browser localStorage');
      console.error('Patient data must be loaded from encrypted backend database only');
      
      // Final fallback: Demo mode
      console.warn('No local storage data found, using demo patients');
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
    
    const response = await api!.get(`/api/patients/${id}/`);
    return response.data;
  },

  update: async (id: string, patient: Partial<Patient>): Promise<ApiResponse<Patient>> => {
    // HYBRID STORAGE: Try backend first, then local storage
    try {
      const baseUrl = getApiBaseUrl();
      const patientsUrl = `${baseUrl}${API_ENDPOINTS.PATIENTS}${id}/`;
      console.log(`Attempting to update patient at: ${patientsUrl}`);
      console.log('Frontend patient update data:', patient);
      
      // Transform frontend data to Django backend format
      const backendPatient = {
        first_name: patient.name ? patient.name.split(' ')[0] : '',
        last_name: patient.name ? patient.name.split(' ').slice(1).join(' ') : '',
        email: patient.email || '',
        phone: patient.phoneNumber || '',
        date_of_birth: patient.dateOfBirth || calculateDateOfBirth(patient.age || 30),
        gender: patient.gender ? patient.gender.toLowerCase() : 'male',
        address: patient.address || 'Not provided',
        blood_type: patient.bloodGroup && patient.bloodGroup !== '' ? patient.bloodGroup : null,
        allergies: patient.allergies ? (Array.isArray(patient.allergies) ? patient.allergies : [patient.allergies]) : [],
        emergency_contact: patient.emergencyContact || {},
        past_medical_history: patient.pastMedicalHistory || null,
        family_history: patient.familyHistory || null,
        current_medications: patient.medicationList ? 
          (Array.isArray(patient.medicationList) ? patient.medicationList : patient.medicationList.split(',').map(m => m.trim())) : []
      };
      
      console.log('Backend patient update data being sent:', backendPatient);
      
      const response = await fetch(patientsUrl, {
        method: 'PUT',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendPatient),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Successfully updated patient in database:', data);
        return { success: true, data: data.data || data, message: 'Patient updated successfully in database' };
      } else {
        const errorText = await response.text();
        console.error(`API returned ${response.status}:`, errorText);
        console.warn(`API returned ${response.status}, falling back to local storage`);
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.warn('Failed to connect to database, updating local storage:', error);
      
      // HIPAA COMPLIANCE: No local storage updates
      console.error('HIPAA VIOLATION PREVENTED: Cannot update patient data in browser localStorage');
      console.error('Patient data must be updated in encrypted backend database only');
      
      return { 
        success: false, 
        data: undefined, 
        message: 'HIPAA Compliance: Patient data cannot be updated in browser. Please ensure backend database is available.' 
      };
    }
  },

  delete: async (id: string): Promise<ApiResponse<boolean>> => {
    try {
      const baseUrl = getApiBaseUrl();
      const patientsUrl = `${baseUrl}${API_ENDPOINTS.PATIENTS}${id}/`;
      console.log(`Attempting to delete patient at: ${patientsUrl}`);

      const response = await fetch(patientsUrl, {
        method: 'DELETE',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      // Already gone on server
      if (response.status === 404) {
        return { success: true, data: true, message: 'Patient already deleted from database' };
      }

      if (response.ok) {
        console.log('Successfully deleted patient from database');
        return { success: true, data: true, message: 'Patient deleted successfully from database' };
      }

      const errorText = await response.text();
      console.error(`API returned ${response.status}:`, errorText);
      return {
        success: false,
        data: false,
        message: `Delete failed (${response.status}): ${errorText.slice(0, 200)}`,
      };
    } catch (error) {
      console.warn('Delete request failed:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        data: false,
        message: `Delete failed — patient still on GoDaddy: ${errorMsg}`,
      };
    }
  },
};

// Vitals API calls
export const vitalsApi = {
  create: async (vitals: Omit<Vitals, 'id'>): Promise<ApiResponse<Vitals>> => {
    // HYBRID STORAGE: Try backend first, then local storage, then demo
    try {
      const baseUrl = getApiBaseUrl();
      const vitalsUrl = `${baseUrl}${API_ENDPOINTS.VITALS}`;
      console.log(`Attempting to create vitals at: ${vitalsUrl}`);
      console.log('Frontend vitals data:', vitals);
      
      const response = await fetch(vitalsUrl, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vitals),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Successfully created vitals in database:', data);
        return { success: true, data: data.data || data, message: 'Vitals recorded successfully in database' };
      } else {
        const errorText = await response.text();
        console.error(`Vitals API returned ${response.status}:`, errorText);
        console.warn(`Vitals API returned ${response.status}, falling back to local storage`);
        throw new Error(`Vitals API returned ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.warn('Failed to connect to vitals database, saving to local storage:', error);
      
      // HYBRID STORAGE: Save to local storage
      try {
        const newVitals: Vitals = {
          ...vitals,
          id: `local_vitals_${Date.now()}`,
        };
        
        // Get existing vitals from local storage
        const existingVitals = localStorage.getItem('health_for_all_vitals');
        let vitalsList: Vitals[] = [];
        
        if (existingVitals) {
          vitalsList = JSON.parse(existingVitals);
        }
        
        // Add new vitals
        vitalsList.push(newVitals);
        
        // Save back to local storage
        localStorage.setItem('health_for_all_vitals', JSON.stringify(vitalsList));
        
        console.log('Vitals saved to local storage:', newVitals);
        return { success: true, data: newVitals, message: 'Vitals recorded successfully (Local Storage)' };
      } catch (localError) {
        console.error('Failed to save vitals to local storage:', localError);
        // Final fallback: Demo mode
        const demoVitals: Vitals = {
          ...vitals,
          id: `demo_vitals_${Date.now()}`,
        };
        return { success: true, data: demoVitals, message: 'Vitals recorded successfully (Demo Mode)' };
      }
    }
  },

  getByPatientId: async (patientId: string): Promise<ApiResponse<Vitals[]>> => {
    // HYBRID STORAGE: Try backend first, then local storage, then demo data
    try {
      const baseUrl = getApiBaseUrl();
      const vitalsUrl = `${baseUrl}/api/vitals/patient/${patientId}/`;
      console.log(`Attempting to fetch vitals for patient ${patientId} from: ${vitalsUrl}`);
      
      const response = await fetch(vitalsUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Successfully fetched vitals from database:', data);
        return { success: true, data: data.data || data, message: 'Vitals loaded from database' };
      } else {
        // Check if it's a backend model error (500 with specific message)
        const errorText = await response.text();
        console.warn(`Vitals API returned ${response.status}:`, errorText);
        
        if (response.status === 500 && errorText.includes('full_name')) {
          console.warn('Backend model error detected, skipping backend and using local storage');
          throw new Error('Backend model error - using local storage');
        }
        
        throw new Error(`Vitals API returned ${response.status}`);
      }
    } catch (error) {
      console.warn('Failed to connect to vitals database, trying local storage:', error);
      
      // HYBRID STORAGE: Try local storage
      try {
        const localVitals = localStorage.getItem('health_for_all_vitals');
        if (localVitals) {
          const allVitals = JSON.parse(localVitals);
          const patientVitals = allVitals.filter((v: Vitals) => v.patientId === patientId);
          console.log('Loading vitals from local storage:', patientVitals.length);
          return { success: true, data: patientVitals, message: 'Vitals loaded from local storage' };
        }
      } catch (localError) {
        console.error('Failed to load vitals from local storage:', localError);
      }
      
      // Final fallback: Demo mode
      console.warn('No local storage vitals found, using demo vitals');
      return { success: true, data: [], message: 'No vitals found (Demo Mode)' };
    }
  },

  getAll: async (): Promise<ApiResponse<Vitals[]>> => {
    // HYBRID STORAGE: Try backend first, then local storage, then demo data
    try {
      const baseUrl = getApiBaseUrl();
      const vitalsUrl = `${baseUrl}${API_ENDPOINTS.VITALS}`;
      console.log(`Attempting to fetch all vitals from: ${vitalsUrl}`);
      
      const response = await fetch(vitalsUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Successfully fetched all vitals from database:', data);
        return { success: true, data: data.data || data, message: 'All vitals loaded from database' };
      } else {
        console.warn(`Vitals API returned ${response.status}, falling back to local storage`);
        throw new Error(`Vitals API returned ${response.status}`);
      }
    } catch (error) {
      console.warn('Failed to connect to vitals database, trying local storage:', error);
      
      // HYBRID STORAGE: Try local storage
      try {
        const localVitals = localStorage.getItem('health_for_all_vitals');
        if (localVitals) {
          const allVitals = JSON.parse(localVitals);
          console.log('Loading all vitals from local storage:', allVitals.length);
          return { success: true, data: allVitals, message: 'All vitals loaded from local storage' };
        }
      } catch (localError) {
        console.error('Failed to load vitals from local storage:', localError);
      }
      
      // Final fallback: Demo mode
      console.warn('No local storage vitals found, using demo vitals');
      return { success: true, data: [], message: 'No vitals found (Demo Mode)' };
    }
  },
};

// Doctor API calls
export const doctorApi = {
  create: async (doctor: any): Promise<ApiResponse<any>> => {
    try {
      console.log('Creating doctor:', doctor);
      
      // Use fetch instead of axios for better CORS handling
      const API_BASE_URL = getApiBaseUrl();
      if (!API_BASE_URL) {
        // Demo mode: simulate successful creation
        const demoDoctor = {
          ...doctor,
          id: `demo_doctor_${Date.now()}`,
        };
        return { success: true, data: demoDoctor, message: 'Doctor created successfully (Demo Mode)' };
      }
      
      // ✅ FIXED: Use Nginx HTTPS (port 443) for production, direct HTTP for localhost
      const isLocalhost = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const healthFairUrl = isLocalhost
        ? 'http://api.mywaitime.com:3015/health-fair/doctors/'
        : 'https://api.mywaitime.com/health-fair/doctors/';
      const response = await fetch(healthFairUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': 'https://zub165.github.io'
        },
        body: JSON.stringify(doctor),
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          const responseText = await response.text();
          if (responseText) {
            errorData = JSON.parse(responseText);
          }
        } catch (parseError) {
          // If JSON parsing fails, use the response text or status
          errorData = { message: response.statusText || 'Invalid data' };
        }
        
        const errorMessage = errorData.message || errorData.error || errorData.detail || `HTTP ${response.status}: ${response.statusText}`;
        console.error('❌ Doctor creation failed:', response.status, errorMessage, errorData);
        
        // Return error response instead of throwing
        return {
          success: false,
          error: errorMessage,
          message: errorMessage,
          data: null
        };
      }

      const data = await response.json();
      console.log('✅ Doctor created successfully:', data);
      
      if (data.status === 'success' && data.data) {
        return { success: true, data: data.data, message: 'Doctor created successfully' };
      } else if (data.id || data.email) {
        // If backend returns doctor object directly (not wrapped)
        return { success: true, data: data, message: 'Doctor created successfully' };
      } else {
        const errorMessage = data.message || data.error || 'Failed to create doctor';
        return {
          success: false,
          error: errorMessage,
          message: errorMessage,
          data: null
        };
      }
    } catch (error: any) {
      console.error('❌ Error creating doctor:', error);
      const errorMessage = error.message || error.toString() || 'Failed to create doctor. Please check your connection and try again.';
      return { 
        success: false, 
        error: errorMessage,
        message: errorMessage,
        data: null
      };
    }
  },

  getAll: async (): Promise<ApiResponse<Doctor[]>> => {
    if (!isApiAvailable()) {
      // Demo mode: return empty array
      return { success: true, data: [], message: 'No doctors found (Demo Mode)' };
    }
    
    const response = await api!.get('/api/doctors/');
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
    
    const response = await api!.post('/api/recommendations/', recommendation);
    return response.data;
  },

  sendEmail: async (recommendationId: string): Promise<ApiResponse<any>> => {
    if (!isApiAvailable()) {
      // Demo mode: simulate successful email sending
      return { success: true, data: { messageId: `demo_${Date.now()}` }, message: 'Email sent successfully (Demo Mode)' };
    }
    
    const response = await api!.post(`/api/recommendations/${recommendationId}/send-email/`);
    return response.data;
  },
};

export default api;
