// API Configuration
export const getApiBaseUrl = (): string => {
  // Always use demo mode for now to prevent 404 errors
  // When you have a working Django backend, uncomment the lines below
  /*
  if (window.location.hostname.includes('github.io')) {
    return 'https://208.109.215.53/api'; // Your production API URL
  }
  return 'http://localhost:3015/api';
  */
  return ''; // Empty string forces demo mode
};

export const isDemoMode = (): boolean => {
  // Always use demo mode to prevent API errors
  return true;
};

export const API_ENDPOINTS = {
  PATIENTS: '/patients/',
  VITALS: '/vitals/',
  DOCTORS: '/doctors/',
  RECOMMENDATIONS: '/recommendations/',
  HEALTH_CHECK: '/health/',
  AI_ASSESSMENT: '/ai/assessment/',
  NUTRITION: '/nutrition/',
  LAB: '/lab/',
} as const;