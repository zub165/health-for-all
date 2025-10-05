// API Configuration for different environments
export const API_CONFIG = {
  // Development API URL (Django backend running locally)
  DEVELOPMENT: 'http://localhost:3015/api',
  
  // Production API URL (replace with your actual Django backend URL)
  PRODUCTION: 'https://your-django-backend.herokuapp.com/api', // Example: Heroku deployment
  
  // Demo mode (no backend, uses simulated data)
  DEMO: null,
};

// Get the appropriate API base URL based on environment
export const getApiBaseUrl = (): string | null => {
  // Check if we're in production (GitHub Pages)
  const isProduction = window.location.hostname.includes('github.io');
  
  // Check if Django backend is available
  const isBackendAvailable = process.env.REACT_APP_BACKEND_URL;
  
  if (isProduction && isBackendAvailable) {
    return process.env.REACT_APP_BACKEND_URL || null;
  } else if (isProduction) {
    // In production but no backend configured, use demo mode
    return API_CONFIG.DEMO;
  } else {
    // In development, try to use Django backend
    return API_CONFIG.DEVELOPMENT;
  }
};

// Environment detection
export const isDemoMode = (): boolean => {
  return getApiBaseUrl() === API_CONFIG.DEMO;
};

export const isDevelopment = (): boolean => {
  return !window.location.hostname.includes('github.io');
};

export const isProduction = (): boolean => {
  return window.location.hostname.includes('github.io');
};
