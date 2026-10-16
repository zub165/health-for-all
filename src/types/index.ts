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
  allergies?: string | string[];
  familyHistory?: string;
  medicationList?: string;
  emergencyContact?: any;
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
  past_medical_history?: string;
  family_history?: string;
  current_medications?: string[];
  emergency_contact?: any;
  health_risk_score?: number;
  recommended_specialists?: string[];
  health_trends?: any;
  ai_health_insights?: any;
  // SOAP Note fields
  soapNote?: {
    subjective?: {
      chiefComplaint?: string;
      historyOfPresentIllness?: string;
      symptoms?: string;
      allergies?: string;
      medications?: string;
      familyHistory?: string;
      socialHistory?: string;
      psychologicalAssessment?: string;
    };
    objective?: {
      physicalExam?: string;
      labResults?: string;
      diagnosticTests?: string;
      vitalSigns?: {
        bloodPressure?: string;
        heartRate?: string;
        temperature?: string;
        oxygenSaturation?: string;
        bloodSugar?: string;
        weight?: string;
        height?: string;
        carotidDoppler?: string;
      };
    };
    assessment?: {
      clinicalDiagnosis?: string;
      differentialDiagnosis?: string;
      riskFactors?: string;
      healthScore?: number;
      riskLevel?: string;
    };
    plan?: {
      treatmentPlan?: string;
      followUpInstructions?: string;
      patientEducation?: string;
      referrals?: string;
    };
  };
  doctorAssessment?: {
    clinicalAssessment?: string;
    treatmentPlan?: string;
    recommendations?: string;
    followUpPlan?: string;
  };
  lastUpdated?: string;
  updatedBy?: string;
  // Consent and legal fields
  consentData?: {
    medicalScreening?: boolean;
    dataCollection?: boolean;
    volunteerService?: boolean;
    emergencyContact?: boolean;
    followUpCare?: boolean;
    educationalUse?: boolean;
    privacyRights?: boolean;
    liabilityAcknowledgment?: boolean;
    volunteerLimitations?: boolean;
    emergencyProtocols?: boolean;
  };
  recommendations?: string;
  doctorRecommendations?: {
    text: string;
    doctor: string;
    timestamp: string;
    status: string;
  };
  // Volunteer information
  volunteerInfo?: {
    name?: string;
    organization?: string;
    role?: string;
    contact?: string;
  };
  // Privacy and unique ID fields
  useUniqueId?: boolean;
  disclosePersonalInfo?: boolean;
  uniquePatientId?: string;
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
  hba1c?: number;
  totalCholesterol?: number;
  ldlCholesterol?: number;
  hdlCholesterol?: number;
  triglycerides?: number;
  mentalHealthScore?: number;
  mentalHealthAnswers?: MentalHealthAnswer[];
  mentalHealthData?: MentalHealthScreeningData;
  recordedBy?: string;
  recordedAt: string;
}

export interface MentalHealthAnswer {
  question: string;
  answer: number; // 0-4 scale
}

export interface MentalHealthScreeningData {
  // Part 1: Initial Screening
  phq2: number[]; // [0, 0] for 2 questions
  gad2: number[]; // [0, 0] for 2 questions
  
  // Part 2: Clinical Action
  needsPHQ9: boolean;
  needsGAD7: boolean;
  
  // Part 3: Full Assessments (if triggered)
  phq9?: number[]; // 9 questions
  functionalImpairment?: number;
  gad7?: number[]; // 7 questions
  
  // Clinician Use
  followUpPlan?: string;
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
