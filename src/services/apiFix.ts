// API Fix Service - Handle CORS and Network Issues
import axios from 'axios';
import { getApiBaseUrl } from '../config/api';

const API_BASE_URL = getApiBaseUrl();

// Create axios instance with enhanced error handling
const api = API_BASE_URL ? axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
  timeout: 10000, // 10 second timeout
}) : null;

// Enhanced API service with retry logic and error handling
export const apiFixService = {
  // Retry configuration
  retryConfig: {
    retries: 3,
    retryDelay: 1000,
    retryCondition: (error: any) => {
      return error.code === 'ERR_NETWORK' || 
             error.code === 'ERR_TIMEOUT' ||
             error.response?.status >= 500;
    }
  },

  // Enhanced patient API with retry logic
  async getPatientsWithRetry(): Promise<any> {
    if (!api) {
      throw new Error('API not available');
    }

    let lastError: any = null;
    
    for (let attempt = 1; attempt <= this.retryConfig.retries; attempt++) {
      try {
        console.log(`Attempt ${attempt} to fetch patients...`);
        
        const response = await api.get('/patients/', {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
          timeout: 10000,
        });

        console.log('Patients fetched successfully:', response.data);
        return response.data;
        
      } catch (error: any) {
        lastError = error;
        console.error(`Attempt ${attempt} failed:`, error.message);
        
        if (attempt < this.retryConfig.retries) {
          console.log(`Retrying in ${this.retryConfig.retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, this.retryConfig.retryDelay));
        }
      }
    }
    
    throw lastError;
  },

  // Alternative fetch method (bypass axios)
  async getPatientsWithFetch(): Promise<any> {
    const url = `${API_BASE_URL}/patients/`;
    
    try {
      console.log('Using fetch to get patients...');
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        mode: 'cors',
        credentials: 'omit',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Patients fetched with fetch:', data);
      return data;
      
    } catch (error: any) {
      console.error('Fetch failed:', error);
      throw error;
    }
  },

  // Health check
  async healthCheck(): Promise<boolean> {
    if (!api) return false;
    
    try {
      const response = await api.get('/health/', { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  },

  // Clear browser cache
  clearCache(): void {
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    // Clear localStorage cache
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('health_for_all') || key.includes('patients')) {
        localStorage.removeItem(key);
      }
    });
  },

  // Force refresh
  forceRefresh(): void {
    window.location.reload();
  }
};

export default apiFixService;
