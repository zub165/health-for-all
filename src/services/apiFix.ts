// API Fix Service - Handle CORS and Network Issues
import axios from 'axios';
import { getApiBaseUrl } from '../config/api';

const API_BASE_URL = getApiBaseUrl();

// Safe fetch helper - no preflight headers
async function getJson(url: string): Promise<any> {
  const res = await fetch(url, { 
    method: 'GET', 
    cache: 'no-store',
    mode: 'cors',
    credentials: 'omit'
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) throw new Error(`Expected JSON, got ${ct}`);
  return res.json();
}

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
    let lastError: any = null;
    
    for (let attempt = 1; attempt <= this.retryConfig.retries; attempt++) {
      try {
        console.log(`Attempt ${attempt} to fetch patients...`);
        
        const data = await getJson(`${API_BASE_URL}/api/patients/`);

        console.log('Patients fetched successfully:', data);
        return data;
        
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
    try {
      console.log('Using fetch to get patients...');
      
      const data = await getJson(`${API_BASE_URL}/api/patients/`);
      console.log('Patients fetched with fetch:', data);
      return data;
      
    } catch (error: any) {
      console.error('Fetch failed:', error);
      throw error;
    }
  },

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await getJson(`${API_BASE_URL}/api/health/`);
      return true;
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
