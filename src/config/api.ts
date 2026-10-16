// API Configuration
export const getApiBaseUrl = (): string => {
  // Check if we're in production (GitHub Pages) or development
  const isGitHubPages = window.location.hostname.includes('github.io');
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  // ✅ FIXED: Use default HTTPS port (443) where SSL is already configured
  // Port 3015 doesn't have SSL configured, so we use the default HTTPS port
  const baseUrl = isLocalhost 
    ? 'http://api.mywaitime.com:3015'  // HTTP OK for localhost development
    : 'https://api.mywaitime.com';      // HTTPS default port 443 (has valid SSL)
  
  console.log('API Configuration:', {
    hostname: window.location.hostname,
    isGitHubPages,
    isLocalhost,
    baseUrl,
    fullUrl: `${baseUrl}/api/patients/`,
    note: isLocalhost 
      ? 'Using HTTP port 3015 for localhost' 
      : 'Using HTTPS default port 443 (valid SSL certificate)'
  });
  
  return baseUrl;
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
  NUTRITION: '/api/nutrition/health/',
  NUTRITION_HEALTH: '/api/nutrition/health/',
  AI_HEALTH: '/api/ai/health/',
  /** Legacy path — do not use for catalog. Prefer /lab/tests/ */
  LAB: '/api/lab/',
  /** GoDaddy Saeed Lab catalog (django_hospitalfinder :3015) */
  LAB_TESTS: '/lab/tests/',
  /** GoDaddy patient lab/radiology attach (same :3015) */
  LAB_RESULTS: '/api/lab-results/',
} as const;