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
    // For GitHub Pages - use exact domain without /api suffix
    return 'https://208.109.215.53';
  } else {
    // In development, use exact domain without /api suffix
    return 'https://208.109.215.53';
  }
};

// Environment detection
export const isDemoMode = (): boolean => {
  // Only use demo mode if explicitly set to null
  return getApiBaseUrl() === null;
};

export const isDevelopment = (): boolean => {
  return !window.location.hostname.includes('github.io');
};

export const isProduction = (): boolean => {
  return window.location.hostname.includes('github.io');
};
// Cache busting comment - Mon Oct  6 23:53:50 EDT 2025
