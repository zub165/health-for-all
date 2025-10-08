// API Configuration
export const getApiBaseUrl = (): string => {
  // Check if we're in production (GitHub Pages) or development
  if (window.location.hostname.includes('github.io')) {
    return 'https://208.109.215.53'; // Your production API URL (HTTPS through Nginx reverse proxy)
  }
  return 'http://localhost:3015'; // Development API URL (HTTP for local)
};

export const isDemoMode = (): boolean => {
  // Use demo mode only if API is not available
  return false; // Try to use real API first
};

export const API_ENDPOINTS = {
  PATIENTS: '/api/patients/',
  VITALS: '/api/vitals/',
  DOCTORS: '/api/doctors/',
  RECOMMENDATIONS: '/api/recommendations/',
  HEALTH_CHECK: '/api/health/',
  AI_ASSESSMENT: '/api/ai/assessment/',
  NUTRITION: '/api/nutrition/',
  LAB: '/api/lab/',
} as const;