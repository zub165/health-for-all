// Complete API Service - All Endpoints Integration
import axios from 'axios';
import { getApiBaseUrl } from '../config/api';

// API Base URLs - All services use the same base URL since they're all part of the main API
const API_BASE_URL = getApiBaseUrl();
const NUTRITION_API_URL = API_BASE_URL; // Use same base URL
const AI_SERVICES_URL = API_BASE_URL; // Use same base URL
const LAB_API_URL = API_BASE_URL; // Use same base URL
const HEALTH_FAIR_URL = API_BASE_URL; // Use same base URL

// Create axios instances for different services
const createApiInstance = (baseURL: string | null) => {
  if (!baseURL) return null;
  
  return axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: false,
  });
};

const api = createApiInstance(API_BASE_URL);
const nutritionApi = createApiInstance(NUTRITION_API_URL);
const aiApi = createApiInstance(AI_SERVICES_URL);
const labApi = createApiInstance(LAB_API_URL);
const healthFairApi = createApiInstance(HEALTH_FAIR_URL);

// ===== MAIN API SERVICE (/api/) =====

export const mainApiService = {
  // Health & System
  health: {
    check: () => api?.get('/health/'),
    userData: () => api?.get('/user-data/'),
  },

  // Hospital Management
  hospitals: {
    list: () => api?.get('/hospitals/'),
    enhanced: () => api?.get('/hospitals-enhanced/'),
    details: (hospitalId: string) => api?.get(`/hospitals/${hospitalId}/`),
    search: (query: string) => api?.get(`/hospitals/search/?q=${query}`),
    add: (hospitalData: any) => api?.post('/hospitals/add/', hospitalData),
    stats: () => api?.get('/hospitals/stats/'),
    smartWaitTime: (hospitalId: string) => api?.get(`/hospitals/${hospitalId}/smart-wait-time/`),
    updateWaitTime: (hospitalId: string, waitTimeData: any) => 
      api?.post(`/hospitals/${hospitalId}/update-wait-time/`, waitTimeData),
    updateRating: (hospitalId: string, ratingData: any) => 
      api?.post(`/hospitals/${hospitalId}/update-rating/`, ratingData),
    updateERCapacity: (hospitalId: string, capacityData: any) => 
      api?.post(`/hospitals/${hospitalId}/er-capacity/`, capacityData),
    topPerforming: () => api?.get('/hospitals/top-performing/'),
    performance: (hospitalId: string) => api?.get(`/hospitals/${hospitalId}/performance/`),
    feedback: (hospitalId: string) => api?.get(`/hospitals/${hospitalId}/feedback/`),
    aiWaitTime: (hospitalId: string) => api?.get(`/hospitals/${hospitalId}/ai-wait-time/`),
    traffic: (hospitalId: string) => api?.get(`/hospitals/${hospitalId}/traffic/`),
    weather: (hospitalId: string) => api?.get(`/hospitals/${hospitalId}/weather/`),
    updateWaitTimes: (waitTimesData: any) => api?.post('/hospitals/wait-times/update/', waitTimesData),
  },

  // Feedback System
  feedback: {
    list: () => api?.get('/feedback/'),
    submit: (feedbackData: any) => api?.post('/feedback/submit/', feedbackData),
  },

  // Patient Management
  patients: {
    list: () => api?.get('/patients/'),
    search: (query: string) => api?.get(`/patients/search/?q=${query}`),
    details: (patientId: string) => api?.get(`/patients/${patientId}/`),
    records: (patientId: string) => api?.get(`/patients/${patientId}/records/`),
  },

  // Medical Records
  medicalRecords: {
    list: () => api?.get('/medical-records/'),
    details: (recordId: string) => api?.get(`/medical-records/${recordId}/`),
  },

  // Authentication
  auth: {
    csrfToken: () => api?.get('/auth/csrf-token/'),
    login: (credentials: any) => api?.post('/auth/login/', credentials),
    register: (userData: any) => api?.post('/auth/register/', userData),
    logout: () => api?.post('/auth/logout/'),
    profile: () => api?.get('/auth/profile/'),
    changePassword: (passwordData: any) => api?.post('/auth/change-password/', passwordData),
    forgotPassword: (email: string) => api?.post('/auth/forgot-password/', { email }),
    resetPassword: (resetData: any) => api?.post('/auth/reset-password/', resetData),
    enhancedRegister: (userData: any) => api?.post('/auth/enhanced-register/', userData),
  },

  // Admin
  admin: {
    users: () => api?.get('/admin/users/'),
    export: () => api?.get('/admin/export/'),
    createAdmin: (adminData: any) => api?.post('/admin/create-admin/', adminData),
  },

  // Maps & Location
  maps: {
    userLocation: () => api?.get('/user-location/'),
    directions: (params: any) => api?.get('/directions/', { params }),
    mapConfig: () => api?.get('/map-config/'),
    apiKeys: () => api?.get('/config/api-keys/'),
  },

  // TomTom Maps API
  tomtom: {
    systemStatus: () => api?.get('/tomtom/system-status/'),
    searchHospitals: (query: string) => api?.get(`/tomtom/search-hospitals/?q=${query}`),
    geocode: (address: string) => api?.get(`/tomtom/geocode/?address=${address}`),
    reverseGeocode: (lat: number, lng: number) => 
      api?.get(`/tomtom/reverse-geocode/?lat=${lat}&lng=${lng}`),
    route: (params: any) => api?.get('/tomtom/route/', { params }),
  },

  // Google Maps API
  google: {
    systemStatus: () => api?.get('/google/system-status/'),
    searchHospitals: (query: string) => api?.get(`/google/search-hospitals/?q=${query}`),
    geocode: (address: string) => api?.get(`/google/geocode/?address=${address}`),
    reverseGeocode: (lat: number, lng: number) => 
      api?.get(`/google/reverse-geocode/?lat=${lat}&lng=${lng}`),
    directions: (params: any) => api?.get('/google/directions/', { params }),
    placeDetails: (placeId: string) => api?.get(`/google/place-details/?place_id=${placeId}`),
  },

  // AI & Chat
  ai: {
    analyze: (data: any) => api?.post('/analyze/', data),
    barcodeAnalyze: (barcodeData: any) => api?.post('/barcode/analyze/', barcodeData),
    modelInfo: () => api?.get('/model/info/'),
    chat: (message: any) => api?.post('/chat/', message),
    chatHistory: () => api?.get('/chat/history/'),
  },

  // Analytics & Dashboard
  analytics: {
    dashboard: () => api?.get('/dashboard/'),
    analytics: () => api?.get('/analytics/'),
  },
};

// ===== NUTRITION TRACK API (/api/nutrition/) =====

export const nutritionApiService = {
  health: () => nutritionApi?.get('/health/'),
  analyze: (foodData: any) => nutritionApi?.post('/analyze/', foodData),
  barcodeAnalyze: (barcodeData: any) => nutritionApi?.post('/barcode/analyze/', barcodeData),
  modelInfo: () => nutritionApi?.get('/model/info/'),
  nutritionLookup: (query: string) => nutritionApi?.get(`/nutrition/lookup/?q=${query}`),
  halalCheck: (foodItem: string) => nutritionApi?.get(`/halal/check/?item=${foodItem}`),
};

// ===== AI SERVICES API (/ai/) =====

export const aiServicesApi = {
  health: () => aiApi?.get('/health/'),
  icd10: {
    validate: (code: string) => aiApi?.post('/icd10/validate/', { code }),
    search: (query: string) => aiApi?.get(`/icd10/search/?q=${query}`),
  },
  medication: {
    search: (query: string) => aiApi?.get(`/medication/search/?q=${query}`),
  },
  symptoms: {
    analyze: (symptoms: any) => aiApi?.post('/symptoms/analyze/', symptoms),
  },
};

// ===== LAB MANAGEMENT API (/lab/) =====

export const labApiService = {
  // Authentication
  auth: {
    token: (credentials: any) => labApi?.post('/auth/token/', credentials),
    tokenRefresh: (refreshToken: string) => 
      labApi?.post('/auth/token/refresh/', { refresh: refreshToken }),
    login: (credentials: any) => labApi?.post('/auth/login/', credentials),
    register: (userData: any) => labApi?.post('/auth/register/', userData),
    logout: () => labApi?.post('/auth/logout/'),
    profile: () => labApi?.get('/auth/profile/'),
  },

  // Health & Analytics
  health: () => labApi?.get('/health/'),
  analytics: () => labApi?.get('/analytics/'),
  dashboardStats: () => labApi?.get('/dashboard-stats/'),

  // Data Export
  export: {
    patientsCSV: () => labApi?.get('/export/patients/csv/'),
    ordersCSV: () => labApi?.get('/export/orders/csv/'),
  },

  // ViewSet Endpoints (REST API)
  users: {
    list: () => labApi?.get('/users/'),
    create: (userData: any) => labApi?.post('/users/', userData),
    details: (userId: string) => labApi?.get(`/users/${userId}/`),
    update: (userId: string, userData: any) => labApi?.put(`/users/${userId}/`, userData),
    delete: (userId: string) => labApi?.delete(`/users/${userId}/`),
  },

  patients: {
    list: () => labApi?.get('/patients/'),
    create: (patientData: any) => labApi?.post('/patients/', patientData),
    details: (patientId: string) => labApi?.get(`/patients/${patientId}/`),
    update: (patientId: string, patientData: any) => labApi?.put(`/patients/${patientId}/`, patientData),
    delete: (patientId: string) => labApi?.delete(`/patients/${patientId}/`),
  },

  testCategories: {
    list: () => labApi?.get('/test-categories/'),
    create: (categoryData: any) => labApi?.post('/test-categories/', categoryData),
    details: (categoryId: string) => labApi?.get(`/test-categories/${categoryId}/`),
    update: (categoryId: string, categoryData: any) => 
      labApi?.put(`/test-categories/${categoryId}/`, categoryData),
    delete: (categoryId: string) => labApi?.delete(`/test-categories/${categoryId}/`),
  },

  tests: {
    list: () => labApi?.get('/tests/'),
    create: (testData: any) => labApi?.post('/tests/', testData),
    details: (testId: string) => labApi?.get(`/tests/${testId}/`),
    update: (testId: string, testData: any) => labApi?.put(`/tests/${testId}/`, testData),
    delete: (testId: string) => labApi?.delete(`/tests/${testId}/`),
  },

  appointments: {
    list: () => labApi?.get('/appointments/'),
    create: (appointmentData: any) => labApi?.post('/appointments/', appointmentData),
    details: (appointmentId: string) => labApi?.get(`/appointments/${appointmentId}/`),
    update: (appointmentId: string, appointmentData: any) => 
      labApi?.put(`/appointments/${appointmentId}/`, appointmentData),
    delete: (appointmentId: string) => labApi?.delete(`/appointments/${appointmentId}/`),
  },

  testOrders: {
    list: () => labApi?.get('/test-orders/'),
    create: (orderData: any) => labApi?.post('/test-orders/', orderData),
    details: (orderId: string) => labApi?.get(`/test-orders/${orderId}/`),
    update: (orderId: string, orderData: any) => labApi?.put(`/test-orders/${orderId}/`, orderData),
    delete: (orderId: string) => labApi?.delete(`/test-orders/${orderId}/`),
  },

  testOrderItems: {
    list: () => labApi?.get('/test-order-items/'),
    create: (itemData: any) => labApi?.post('/test-order-items/', itemData),
    details: (itemId: string) => labApi?.get(`/test-order-items/${itemId}/`),
    update: (itemId: string, itemData: any) => 
      labApi?.put(`/test-order-items/${itemId}/`, itemData),
    delete: (itemId: string) => labApi?.delete(`/test-order-items/${itemId}/`),
  },

  testResults: {
    list: () => labApi?.get('/test-results/'),
    create: (resultData: any) => labApi?.post('/test-results/', resultData),
    details: (resultId: string) => labApi?.get(`/test-results/${resultId}/`),
    update: (resultId: string, resultData: any) => 
      labApi?.put(`/test-results/${resultId}/`, resultData),
    delete: (resultId: string) => labApi?.delete(`/test-results/${resultId}/`),
  },

  payments: {
    list: () => labApi?.get('/payments/'),
    create: (paymentData: any) => labApi?.post('/payments/', paymentData),
    details: (paymentId: string) => labApi?.get(`/payments/${paymentId}/`),
    update: (paymentId: string, paymentData: any) => 
      labApi?.put(`/payments/${paymentId}/`, paymentData),
    delete: (paymentId: string) => labApi?.delete(`/payments/${paymentId}/`),
  },

  reportTemplates: {
    list: () => labApi?.get('/report-templates/'),
    create: (templateData: any) => labApi?.post('/report-templates/', templateData),
    details: (templateId: string) => labApi?.get(`/report-templates/${templateId}/`),
    update: (templateId: string, templateData: any) => 
      labApi?.put(`/report-templates/${templateId}/`, templateData),
    delete: (templateId: string) => labApi?.delete(`/report-templates/${templateId}/`),
  },

  reports: {
    list: () => labApi?.get('/reports/'),
    create: (reportData: any) => labApi?.post('/reports/', reportData),
    details: (reportId: string) => labApi?.get(`/reports/${reportId}/`),
    update: (reportId: string, reportData: any) => labApi?.put(`/reports/${reportId}/`, reportData),
    delete: (reportId: string) => labApi?.delete(`/reports/${reportId}/`),
  },

  settings: {
    list: () => labApi?.get('/settings/'),
    create: (settingData: any) => labApi?.post('/settings/', settingData),
    details: (settingId: string) => labApi?.get(`/settings/${settingId}/`),
    update: (settingId: string, settingData: any) => 
      labApi?.put(`/settings/${settingId}/`, settingData),
    delete: (settingId: string) => labApi?.delete(`/settings/${settingId}/`),
  },

  auditLogs: {
    list: () => labApi?.get('/audit-logs/'),
    create: (logData: any) => labApi?.post('/audit-logs/', logData),
    details: (logId: string) => labApi?.get(`/audit-logs/${logId}/`),
    update: (logId: string, logData: any) => labApi?.put(`/audit-logs/${logId}/`, logData),
    delete: (logId: string) => labApi?.delete(`/audit-logs/${logId}/`),
  },
};

// ===== HEALTH FAIR API (/health-fair/) =====

export const healthFairApiService = {
  patients: {
    aiRegister: (patientData: any) => healthFairApi?.post('/patients/ai-register/', patientData),
    list: () => healthFairApi?.get('/patients/'),
    details: (patientId: string) => healthFairApi?.get(`/patients/${patientId}/`),
  },
  vitals: {
    store: (vitalsData: any) => healthFairApi?.post('/vitals/store/', vitalsData),
  },
  email: {
    send: (emailData: any) => healthFairApi?.post('/email/send/', emailData),
  },
  doctors: {
    dashboard: (doctorId: number) => healthFairApi?.get(`/doctors/${doctorId}/dashboard/`),
    createDashboard: (dashboardData: any) => 
      healthFairApi?.post('/doctors/dashboard/create/', dashboardData),
  },
  ai: {
    logs: () => healthFairApi?.get('/ai/logs/'),
  },
  dashboard: () => healthFairApi?.get('/dashboard/'),
};

// ===== API DOCUMENTATION =====

export const apiDocumentation = {
  schema: () => api?.get('/schema/'),
  docs: () => api?.get('/docs/'),
  redoc: () => api?.get('/redoc/'),
};

// ===== UNIFIED API SERVICE =====

export const completeApiService = {
  main: mainApiService,
  nutrition: nutritionApiService,
  ai: aiServicesApi,
  lab: labApiService,
  healthFair: healthFairApiService,
  docs: apiDocumentation,
};

// ===== API STATUS CHECKER =====

export const checkApiStatus = async () => {
  const status = {
    main: false,
    nutrition: false,
    ai: false,
    lab: false,
    healthFair: false,
  };

  try {
    // Check main API - use the actual health endpoint
    const mainResponse = await mainApiService.health.check();
    const isMainOnline = mainResponse?.status === 200;
    
    // If main API is online, all services are considered online since they're part of the same backend
    status.main = isMainOnline;
    status.nutrition = isMainOnline;
    status.ai = isMainOnline;
    status.lab = isMainOnline;
    status.healthFair = isMainOnline;
    
    console.log('API Status Check:', { main: isMainOnline, allServices: isMainOnline });
  } catch (error) {
    console.error('Main API not available:', error);
    // All services are offline if main API is offline
    status.main = false;
    status.nutrition = false;
    status.ai = false;
    status.lab = false;
    status.healthFair = false;
  }

  return status;
};

export default completeApiService;
