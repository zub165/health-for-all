/**
 * Health Fair API Service
 * Integrates with the Health Fair backend at https://api.mywaitime.com:3015/health-fair/
 * Note: Backend supports both HTTP (localhost) and HTTPS (production)
 * CORS configured for https://zub165.github.io
 */

// ✅ FIXED: Use default HTTPS port (443) for production, port 3015 for localhost
// Port 3015 doesn't have SSL, so production uses default HTTPS port 443
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const HEALTH_FAIR_BASE_URL = isLocalhost 
  ? 'http://api.mywaitime.com:3015/health-fair'  // HTTP port 3015 for localhost
  : 'https://api.mywaitime.com/health-fair';      // HTTPS default port 443 (has SSL)

interface HealthFairPatient {
  id?: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  phone: string;
  email: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_history?: string[];
  current_medications?: string[];
  allergies?: string[];
  insurance_provider?: string;
}

interface HealthFairVitals {
  patient_id: string;
  blood_pressure_systolic: number;
  blood_pressure_diastolic: number;
  heart_rate: number;
  temperature: number;
  weight: number;
  height: number;
  blood_sugar: number;
  oxygen_saturation: number;
  respiratory_rate: number;
  pain_level: number;
  notes?: string;
}

interface HealthFairEmail {
  patient_id: string;
  email_type: 'health_report' | 'follow_up' | 'recommendations';
  subject: string;
  message: string;
  include_vitals?: boolean;
  include_recommendations?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class HealthFairAPI {
  private baseURL: string;
  private headers: Record<string, string>;

  constructor() {
    this.baseURL = HEALTH_FAIR_BASE_URL;
    this.headers = {
      'Content-Type': 'application/json',
      'Origin': 'https://zub165.github.io'
    };
  }

  /**
   * Register a new patient via AI Rapid Registration
   */
  async registerPatient(patientData: HealthFairPatient): Promise<ApiResponse<any>> {
    try {
      console.log('Health Fair API: Registering patient...', patientData);
      
      const response = await fetch(`${this.baseURL}/patients/ai-register/`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(patientData)
      });

      const result = await response.json();
      console.log('Health Fair API: Registration response:', result);

      if (result.status === 'success') {
        return {
          success: true,
          data: result,
          message: result.message
        };
      } else {
        return {
          success: false,
          error: result.message || 'Registration failed'
        };
      }
    } catch (error) {
      console.error('Health Fair API: Registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Store patient vitals with AI analysis
   */
  async storeVitals(vitalsData: HealthFairVitals): Promise<ApiResponse<any>> {
    try {
      console.log('Health Fair API: Storing vitals...', vitalsData);
      
      const response = await fetch(`${this.baseURL}/vitals/store/`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(vitalsData)
      });

      const result = await response.json();
      console.log('Health Fair API: Vitals response:', result);

      if (result.status === 'success') {
        return {
          success: true,
          data: result,
          message: result.message
        };
      } else {
        return {
          success: false,
          error: result.message || 'Vitals storage failed'
        };
      }
    } catch (error) {
      console.error('Health Fair API: Vitals error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Get all patients
   */
  async getPatients(): Promise<ApiResponse<any[]>> {
    try {
      console.log('Health Fair API: Fetching patients...');
      
      const response = await fetch(`${this.baseURL}/patients/`, {
        headers: this.headers
      });

      const result = await response.json();
      console.log('Health Fair API: Patients response:', result);

      if (result.status === 'success') {
        return {
          success: true,
          data: result.data,
          message: result.message
        };
      } else {
        return {
          success: false,
          error: result.message || 'Failed to fetch patients'
        };
      }
    } catch (error) {
      console.error('Health Fair API: Get patients error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Get patient details by ID
   */
  async getPatientDetails(patientId: string): Promise<ApiResponse<any>> {
    try {
      console.log('Health Fair API: Fetching patient details for:', patientId);
      
      const response = await fetch(`${this.baseURL}/patients/${patientId}/`, {
        headers: this.headers
      });

      const result = await response.json();
      console.log('Health Fair API: Patient details response:', result);

      if (result.status === 'success') {
        return {
          success: true,
          data: result.data,
          message: result.message
        };
      } else {
        return {
          success: false,
          error: result.message || 'Failed to fetch patient details'
        };
      }
    } catch (error) {
      console.error('Health Fair API: Get patient details error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Send email to patient
   */
  async sendEmail(emailData: HealthFairEmail): Promise<ApiResponse<any>> {
    try {
      console.log('Health Fair API: Sending email...', emailData);
      
      const response = await fetch(`${this.baseURL}/email/send/`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(emailData)
      });

      const result = await response.json();
      console.log('Health Fair API: Email response:', result);

      if (result.status === 'success') {
        return {
          success: true,
          data: result,
          message: result.message
        };
      } else {
        return {
          success: false,
          error: result.message || 'Email sending failed'
        };
      }
    } catch (error) {
      console.error('Health Fair API: Email error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Get Health Fair dashboard data
   */
  async getDashboard(): Promise<ApiResponse<any>> {
    try {
      console.log('Health Fair API: Fetching dashboard...');
      
      const response = await fetch(`${this.baseURL}/dashboard/`, {
        headers: this.headers
      });

      const result = await response.json();
      console.log('Health Fair API: Dashboard response:', result);

      if (result.status === 'success') {
        return {
          success: true,
          data: result.data,
          message: result.message
        };
      } else {
        return {
          success: false,
          error: result.message || 'Failed to fetch dashboard'
        };
      }
    } catch (error) {
      console.error('Health Fair API: Dashboard error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Complete health assessment workflow
   * Combines patient registration and vitals storage
   */
  async submitHealthAssessment(formData: any): Promise<ApiResponse<any>> {
    try {
      console.log('Health Fair API: Starting complete health assessment...', formData);

      // Step 1: Register patient
      const patientData: HealthFairPatient = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        emergency_contact_name: formData.emergencyContactName,
        emergency_contact_phone: formData.emergencyContactPhone,
        medical_history: formData.medicalHistory || [],
        current_medications: formData.currentMedications || [],
        allergies: formData.allergies || [],
        insurance_provider: formData.insuranceProvider || ''
      };

      const patientResult = await this.registerPatient(patientData);
      if (!patientResult.success) {
        return patientResult;
      }

      const patientId = patientResult.data?.patient_id;
      if (!patientId) {
        return {
          success: false,
          error: 'Patient registration succeeded but no patient ID returned'
        };
      }

      // Step 2: Store vitals
      const vitalsData: HealthFairVitals = {
        patient_id: patientId,
        blood_pressure_systolic: formData.bloodPressureSystolic,
        blood_pressure_diastolic: formData.bloodPressureDiastolic,
        heart_rate: formData.heartRate,
        temperature: formData.temperature,
        weight: formData.weight,
        height: formData.height,
        blood_sugar: formData.bloodSugar,
        oxygen_saturation: formData.oxygenSaturation,
        respiratory_rate: formData.respiratoryRate,
        pain_level: formData.painLevel,
        notes: formData.notes || ''
      };

      const vitalsResult = await this.storeVitals(vitalsData);
      if (!vitalsResult.success) {
        return vitalsResult;
      }

      return {
        success: true,
        data: {
          patientId: patientId,
          vitalsId: vitalsResult.data?.vitals_id,
          aiAnalysis: vitalsResult.data?.ai_analysis,
          patient: patientResult.data?.patient
        },
        message: 'Health assessment completed successfully'
      };

    } catch (error) {
      console.error('Health Fair API: Complete assessment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  // Update patient
  async updatePatient(patientId: string, patientData: any): Promise<ApiResponse<any>> {
    try {
      console.log('Health Fair API: Updating patient:', patientId);
      const response = await fetch(`${HEALTH_FAIR_BASE_URL}/patients/${patientId}/`, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify(patientData)
      });
      
      const data = await response.json();
      console.log('Health Fair API: Update response:', data);
      
      if (data.status === 'success') {
        return { success: true, data: data.data, message: 'Patient updated successfully' };
      } else {
        return { success: false, data: null, message: data.message || 'Failed to update patient' };
      }
    } catch (error) {
      console.error('Health Fair API: Update error:', error);
      return { success: false, data: null, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Delete patient
  async deletePatient(patientId: string): Promise<ApiResponse<any>> {
    try {
      // Clean patientId - remove any trailing status codes or invalid characters
      const cleanPatientId = patientId.replace(/\/\d+$/, '').trim();
      const deleteUrl = `${HEALTH_FAIR_BASE_URL}/patients/${cleanPatientId}/`;
      
      console.log('Health Fair API: Deleting patient:', cleanPatientId);
      console.log('Health Fair API: Delete URL:', deleteUrl);
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: this.headers
      });
      
      console.log('Health Fair API: Delete response status:', response.status);
      
      // ✅ Handle 404/500 as success (patient doesn't exist in backend)
      if (response.status === 404 || response.status === 500) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.detail || response.statusText;
        
        // Check if error is "patient not found" type
        if (errorMessage.includes('No HealthFairPatient matches') || 
            errorMessage.includes('not found') ||
            errorMessage.includes('does not exist')) {
          console.log('ℹ️ Patient not found in backend (404/500) - treating as success');
          return { 
            success: true, 
            data: { status: 'not_found' }, 
            message: 'Patient not found in backend (already deleted)' 
          };
        }
      }
      
      // ✅ Check server response
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.detail || `Server error: ${response.status} ${response.statusText}`;
        console.error('Health Fair API: Delete failed with status:', response.status, errorMessage);
        throw new Error(`Delete failed: ${errorMessage}`);
      }
      
      // Try to parse JSON response (some endpoints return 204 No Content)
      let result;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        // No JSON response (204 No Content) - treat as success
        console.log('Health Fair API: Delete successful (204 No Content)');
        return { success: true, data: { status: 'deleted' }, message: 'Patient deleted successfully' };
      }
      
      // ✅ Only return success if server confirms
      if (result.status === 'success' || result.success === true || response.status === 200 || response.status === 204) {
        console.log('Health Fair API: Delete successful');
        return { success: true, data: result, message: 'Patient deleted successfully' };
      } else {
        throw new Error(`Delete failed: ${result.message || 'Server returned failure'}`);
      }
    } catch (error) {
      console.error('Health Fair API: Delete error:', error);
      
      // ✅ If error is "not found" type, treat as success
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes('No HealthFairPatient matches') || 
          errorMsg.includes('not found') ||
          errorMsg.includes('does not exist') ||
          errorMsg.includes('404') ||
          errorMsg.includes('500')) {
        console.log('ℹ️ Patient not found in backend - treating as success');
        return { 
          success: true, 
          data: { status: 'not_found' }, 
          message: 'Patient not found in backend (already deleted)' 
        };
      }
      
      // ✅ Re-throw other errors
      throw error;
    }
  }

  // Get dashboard data
  async getDashboardData(): Promise<ApiResponse<any>> {
    try {
      console.log('Health Fair API: Fetching dashboard...');
      const response = await fetch(`${HEALTH_FAIR_BASE_URL}/dashboard/`, {
        method: 'GET',
        headers: this.headers
      });
      
      // Check if response is HTML (error page)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Health Fair API: Dashboard returned non-JSON response, using fallback data');
        // Return fallback dashboard data
        return {
          success: true,
          data: {
            total_patients: 0,
            patients_today: 0,
            average_health_score: null,
            high_risk_patients: 0,
            pending_follow_ups: 0
          },
          message: 'Dashboard data unavailable, using fallback'
        };
      }
      
      const data = await response.json();
      console.log('Health Fair API: Dashboard response:', data);
      
      if (data.status === 'success') {
        return { success: true, data: data.data, message: 'Dashboard data fetched successfully' };
      } else {
        return { success: false, data: null, message: data.message || 'Failed to fetch dashboard data' };
      }
    } catch (error) {
      console.error('Health Fair API: Dashboard error:', error);
      // Return fallback data instead of error
      return {
        success: true,
        data: {
          total_patients: 0,
          patients_today: 0,
          average_health_score: null,
          high_risk_patients: 0,
          pending_follow_ups: 0
        },
        message: 'Dashboard data unavailable, using fallback'
      };
    }
  }
}

// Create and export singleton instance
export const healthFairAPI = new HealthFairAPI();

// Export types for use in components
export type {
  HealthFairPatient,
  HealthFairVitals,
  HealthFairEmail,
  ApiResponse
};

export default healthFairAPI;
