export interface Patient {
  id?: string;
  name: string;
  email: string;
  phoneNumber: string;
  age: number;
  gender: string;
  bloodGroup: string;
  pastMedicalHistory: string;
  allergies: string;
  familyHistory: string;
  medicationList: string;
  registeredAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Vitals {
  id?: string;
  patientId: string;
  bloodSugar: number;
  carotidDoppler: string;
  mentalHealthScore: number;
  mentalHealthAnswers: MentalHealthAnswer[];
  recordedBy: string;
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
