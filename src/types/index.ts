export interface Patient {
  id?: string;
  // Form fields
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  age?: number;
  gender?: string;
  address?: string;
  bloodGroup?: string;
  pastMedicalHistory?: string;
  allergies?: string;
  familyHistory?: string;
  medicationList?: string;
  registeredAt?: string;
  createdAt?: string;
  updatedAt?: string;
  // Django backend fields
  first_name?: string;
  last_name?: string;
  full_name?: string;
  date_of_birth?: string;
  phone?: string;
  blood_type?: string;
  health_risk_score?: number;
  recommended_specialists?: string[];
  health_trends?: any;
  ai_health_insights?: any;
}

export interface Vitals {
  id?: string;
  patientId: string;
  bloodPressure: string;
  heartRate: number;
  temperature: number;
  oxygenSaturation: number;
  weight: number;
  height: number;
  bloodSugar?: number;
  carotidDoppler?: string;
  mentalHealthScore?: number;
  mentalHealthAnswers?: MentalHealthAnswer[];
  recordedBy?: string;
  recordedAt: string;
}

export interface MentalHealthAnswer {
  question: string;
  answer: number; // 0-4 scale
}

export interface Doctor {
  id?: string;
  name: string;
  email: string;
  specialization: string;
}

export interface Recommendation {
  id?: string;
  patientId: string;
  doctorId: string;
  recommendations: string;
  sentAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
