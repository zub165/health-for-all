/**
 * Lab API Service
 * Integrates with the Lab Management backend (separate Django app)
 * Uses /lab/ endpoint (lab_management app, not /api/lab/)
 *
 * Always use HTTPS nginx (443). Browser calls to :3015 fail with "Failed to fetch"
 * (CORS / mixed / blocked port) — same pattern as patients/vitals.
 */
const LAB_BASE_URL = 'https://api.mywaitime.com/lab';

interface LabTest {
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

interface LabTestCategory {
  id: number;
  name: string;
  description: string;
}

interface LabTestOrder {
  id?: string;
  patient_id: string;
  test_id: string;
  test_name: string;
  test_code: string;
  ordered_by: string;
  order_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'routine' | 'urgent' | 'stat';
  notes?: string;
}

interface LabTestResult {
  id?: string;
  order_id: string;
  test_id: string;
  result_value: string;
  result_unit: string;
  reference_range: string;
  status: 'normal' | 'abnormal' | 'critical';
  notes?: string;
  completed_by: string;
  completed_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class LabApiService {
  private baseURL: string;
  private headers: HeadersInit;

  constructor() {
    this.baseURL = LAB_BASE_URL;
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Origin': 'https://zub165.github.io'
    };
  }

  // Get all available lab tests
  async getTests(): Promise<ApiResponse<LabTest[]>> {
    try {
      console.log('Lab API: Fetching tests...');
      const response = await fetch(`${this.baseURL}/tests/`, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Lab API: Tests fetched successfully');
      
      return {
        success: true,
        data: data,
        message: 'Lab tests retrieved successfully'
      };
    } catch (error) {
      console.error('Lab API: Error fetching tests:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get test categories
  async getTestCategories(): Promise<ApiResponse<LabTestCategory[]>> {
    try {
      console.log('Lab API: Fetching test categories...');
      const response = await fetch(`${this.baseURL}/test-categories/`, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Lab API: Test categories fetched successfully');
      
      return {
        success: true,
        data: data,
        message: 'Test categories retrieved successfully'
      };
    } catch (error) {
      console.error('Lab API: Error fetching test categories:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Create a new test order
  async createTestOrder(orderData: Omit<LabTestOrder, 'id'>): Promise<ApiResponse<LabTestOrder>> {
    try {
      console.log('Lab API: Creating test order...', orderData);
      const response = await fetch(`${this.baseURL}/test-orders/`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Lab API: Test order created successfully');
      
      return {
        success: true,
        data: data,
        message: 'Test order created successfully'
      };
    } catch (error) {
      console.error('Lab API: Error creating test order:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get test orders for a patient
  async getPatientTestOrders(patientId: string): Promise<ApiResponse<LabTestOrder[]>> {
    try {
      console.log('Lab API: Fetching test orders for patient:', patientId);
      const response = await fetch(`${this.baseURL}/test-orders/?patient_id=${patientId}`, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Lab API: Patient test orders fetched successfully');
      
      return {
        success: true,
        data: data,
        message: 'Patient test orders retrieved successfully'
      };
    } catch (error) {
      console.error('Lab API: Error fetching patient test orders:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Submit test results
  async submitTestResult(resultData: Omit<LabTestResult, 'id'>): Promise<ApiResponse<LabTestResult>> {
    try {
      console.log('Lab API: Submitting test result...', resultData);
      const response = await fetch(`${this.baseURL}/test-results/`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(resultData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Lab API: Test result submitted successfully');
      
      return {
        success: true,
        data: data,
        message: 'Test result submitted successfully'
      };
    } catch (error) {
      console.error('Lab API: Error submitting test result:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get test results for an order
  async getTestResults(orderId: string): Promise<ApiResponse<LabTestResult[]>> {
    try {
      console.log('Lab API: Fetching test results for order:', orderId);
      const response = await fetch(`${this.baseURL}/test-results/?order_id=${orderId}`, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Lab API: Test results fetched successfully');
      
      return {
        success: true,
        data: data,
        message: 'Test results retrieved successfully'
      };
    } catch (error) {
      console.error('Lab API: Error fetching test results:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const labApi = new LabApiService();

// Export types
export type {
  LabTest,
  LabTestCategory,
  LabTestOrder,
  LabTestResult,
  ApiResponse
};
