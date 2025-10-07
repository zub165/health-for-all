// API Fix Service - Handle CORS and Network Issues
import axios from 'axios';
import { getApiBaseUrl } from '../config/api';

const API_BASE_URL = getApiBaseUrl();

// Create axios instance with enhanced error handling
const api = API_BASE_URL ? axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  timeout: 10000, // 10 second timeout
}) : null;

// Remove Content-Type on GET and enforce JSON on responses
if (api) {
  api.interceptors.request.use((config) => {
    const method = (config.method || 'get').toLowerCase();
    if (!config.headers) config.headers = {} as any;
    if (method === 'get') {
      if ((config.headers as any).delete) {
        (config.headers as any).delete('Content-Type');
      } else if ('Content-Type' in (config.headers as any)) {
        delete (config.headers as any)['Content-Type'];
      }
    }
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
      const ct = String(response.headers['content-type'] || '');
      if (method === 'get' && !ct.includes('application/json')) {
        const preview = typeof response.data === 'string' ? response.data.slice(0, 200) : '';
        return Promise.reject(new Error(`Expected JSON, got ${ct || 'unknown'} — ${preview}`));
      }
      return response;
    },
    (error) => {
      const status = error?.response?.status;
      const statusText = error?.response?.statusText || '';
      const ct = String(error?.response?.headers?.['content-type'] || '');
      let body = '';
      try { body = typeof error?.response?.data === 'string' ? error.response.data : JSON.stringify(error?.response?.data); } catch {}
      return Promise.reject(new Error(`HTTP ${status} ${statusText} — ct:${ct} — ${body.slice(0, 200)}`));
    }
  );
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
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        mode: 'cors',
        credentials: 'omit',
      });

      const ct = String(response.headers.get('content-type') || '');
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status} ${response.statusText} — ${text.slice(0, 200)}`);
      }
      if (!ct.includes('application/json')) {
        const text = await response.text().catch(() => '');
        throw new Error(`Expected JSON, got ${ct || 'unknown'} — ${text.slice(0, 200)}`);
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
