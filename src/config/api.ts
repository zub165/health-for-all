// API Configuration
export const getApiBaseUrl = (): string => {
  // Check if we're in production (GitHub Pages)
  if (window.location.hostname.includes('github.io')) {
    return 'https://208.109.215.53/api'; // Your production API URL
  }
  
  // Development mode
  return 'http://localhost:3015/api';
};

export const isDemoMode = (): boolean => {
  // Enable demo mode for localhost or when API is not available
  return window.location.hostname.includes('localhost') || 
         window.location.hostname.includes('127.0.0.1') ||
         !getApiBaseUrl();
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