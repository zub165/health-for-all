/**
 * Medical Standards Integration Service
 * Implements WHO, AHA/ACC, ADA, CDC, and ATS guidelines for health assessment
 */

// WHO Global Health Observatory Standards
export const WHO_STANDARDS = {
  // Age-based risk stratification (WHO Global Health Observatory 2021)
  AGE_RISK: {
    PEDIATRIC: { min: 0, max: 17, risk: 0.05, category: 'Pediatric Age' },
    YOUNG_ADULT: { min: 18, max: 34, risk: 0.02, category: 'Young Adult' },
    ADULT: { min: 35, max: 49, risk: 0.05, category: 'Adult Age' },
    MIDDLE_AGE: { min: 50, max: 64, risk: 0.10, category: 'Middle Age' },
    SENIOR: { min: 65, max: 74, risk: 0.15, category: 'Senior Age' },
    ELDERLY: { min: 75, max: 84, risk: 0.20, category: 'Elderly Age' },
    VERY_ELDERLY: { min: 85, max: 120, risk: 0.25, category: 'Very Elderly' }
  },

  // BMI Classification (WHO 2000 - Obesity: preventing and managing the global epidemic)
  BMI_CLASSIFICATION: {
    SEVERE_UNDERWEIGHT: { min: 0, max: 15.9, risk: 0.15, category: 'Severe Underweight' },
    UNDERWEIGHT: { min: 16, max: 18.4, risk: 0.05, category: 'Underweight' },
    NORMAL: { min: 18.5, max: 24.9, risk: 0.00, category: 'Normal Weight' },
    OVERWEIGHT: { min: 25, max: 29.9, risk: 0.05, category: 'Overweight' },
    OBESITY_CLASS_I: { min: 30, max: 34.9, risk: 0.10, category: 'Obesity Class I' },
    OBESITY_CLASS_II: { min: 35, max: 39.9, risk: 0.15, category: 'Obesity Class II' },
    OBESITY_CLASS_III: { min: 40, max: 100, risk: 0.20, category: 'Obesity Class III' }
  }
};

// AHA/ACC Cardiovascular Guidelines
export const AHA_ACC_STANDARDS = {
  // Blood Pressure Classification (AHA/ACC 2017 Guidelines)
  BLOOD_PRESSURE: {
    NORMAL: { systolic: { max: 119 }, diastolic: { max: 79 }, risk: 0.00, category: 'Normal' },
    ELEVATED: { systolic: { min: 120, max: 129 }, diastolic: { max: 79 }, risk: 0.05, category: 'Elevated' },
    STAGE_1_HYPERTENSION: { systolic: { min: 130, max: 139 }, diastolic: { min: 80, max: 89 }, risk: 0.10, category: 'Stage 1 Hypertension' },
    STAGE_2_HYPERTENSION: { systolic: { min: 140, max: 159 }, diastolic: { min: 90, max: 99 }, risk: 0.15, category: 'Stage 2 Hypertension' },
    HYPERTENSIVE_CRISIS: { systolic: { min: 160 }, diastolic: { min: 100 }, risk: 0.25, category: 'Hypertensive Crisis' }
  },

  // Heart Rate Standards (AHA Target Heart Rates)
  HEART_RATE: {
    BRADYCARDIA: { max: 59, risk: 0.05, category: 'Bradycardia' },
    NORMAL: { min: 60, max: 100, risk: 0.00, category: 'Normal Heart Rate' },
    TACHYCARDIA: { min: 101, risk: 0.10, category: 'Tachycardia' }
  },

  // Cardiovascular Risk Factors
  CARDIOVASCULAR_RISK: {
    FAMILY_HISTORY: { risk: 0.08, category: 'Family History of CVD' },
    SMOKING: { risk: 0.12, category: 'Tobacco Use' },
    DIABETES: { risk: 0.15, category: 'Diabetes Mellitus' },
    HYPERTENSION: { risk: 0.10, category: 'Hypertension' },
    HIGH_CHOLESTEROL: { risk: 0.08, category: 'Dyslipidemia' }
  }
};

// ADA Diabetes Standards
export const ADA_STANDARDS = {
  // Blood Glucose Levels (ADA 2021 Standards)
  BLOOD_GLUCOSE: {
    NORMAL: { max: 99, risk: 0.00, category: 'Normal Glucose' },
    PREDIABETES: { min: 100, max: 125, risk: 0.08, category: 'Prediabetes' },
    DIABETES: { min: 126, risk: 0.15, category: 'Diabetes' },
    SEVERE_HYPERGLYCEMIA: { min: 200, risk: 0.25, category: 'Severe Hyperglycemia' },
    HYPOGLYCEMIA: { max: 69, risk: 0.20, category: 'Hypoglycemia' }
  },

  // Diabetes Risk Factors
  DIABETES_RISK: {
    FAMILY_HISTORY: { risk: 0.10, category: 'Family History of Diabetes' },
    GESTATIONAL_DIABETES: { risk: 0.12, category: 'History of Gestational Diabetes' },
    POLYCYSTIC_OVARY: { risk: 0.08, category: 'PCOS' },
    SEDENTARY_LIFESTYLE: { risk: 0.05, category: 'Physical Inactivity' }
  }
};

// CDC Infectious Disease Guidelines
export const CDC_STANDARDS = {
  // Temperature Standards (CDC 2021 Guidelines)
  TEMPERATURE: {
    HYPOTHERMIA: { max: 95, risk: 0.15, category: 'Hypothermia' },
    NORMAL: { min: 96, max: 100.3, risk: 0.00, category: 'Normal Temperature' },
    FEVER: { min: 100.4, max: 102.9, risk: 0.10, category: 'Fever' },
    HIGH_FEVER: { min: 103, risk: 0.20, category: 'High Fever' }
  },

  // Infectious Disease Risk Factors
  INFECTIOUS_DISEASE_RISK: {
    IMMUNOCOMPROMISED: { risk: 0.15, category: 'Immunocompromised' },
    CHRONIC_DISEASE: { risk: 0.08, category: 'Chronic Disease' },
    RECENT_TRAVEL: { risk: 0.05, category: 'Recent Travel' },
    EXPOSURE_HISTORY: { risk: 0.10, category: 'Exposure History' }
  }
};

// ATS Respiratory Guidelines
export const ATS_STANDARDS = {
  // Oxygen Saturation (ATS 2021 Guidelines)
  OXYGEN_SATURATION: {
    SEVERE_HYPOXEMIA: { max: 89, risk: 0.25, category: 'Severe Hypoxemia' },
    MILD_HYPOXEMIA: { min: 90, max: 94, risk: 0.10, category: 'Mild Hypoxemia' },
    NORMAL: { min: 95, max: 100, risk: 0.00, category: 'Normal Oxygenation' }
  },

  // Respiratory Risk Factors
  RESPIRATORY_RISK: {
    SMOKING_HISTORY: { risk: 0.12, category: 'Smoking History' },
    ASTHMA: { risk: 0.08, category: 'Asthma' },
    COPD: { risk: 0.15, category: 'COPD' },
    OCCUPATIONAL_EXPOSURE: { risk: 0.06, category: 'Occupational Exposure' }
  }
};

// Comprehensive Health Assessment Function
export function calculateComprehensiveHealthScore(patientData: any, vitals?: any): {
  score: number;
  riskLevel: string;
  factors: string[];
  recommendations: string[];
  medicalReferences: string[];
} {
  let score = 100;
  const factors: string[] = [];
  const recommendations: string[] = [];
  const medicalReferences: string[] = [];

  console.log('🔬 Comprehensive Medical Standards Assessment:', { patientData, vitals });

  // === WHO AGE-BASED RISK ASSESSMENT ===
  if (patientData.age) {
    const ageRisk = getAgeRisk(patientData.age);
    score -= ageRisk.risk * 100;
    factors.push(ageRisk.category);
    medicalReferences.push('WHO Global Health Observatory 2021');
    
    if (ageRisk.risk > 0.15) {
      recommendations.push('Annual comprehensive health screening recommended');
    }
  }

  // === WHO BMI CLASSIFICATION ===
  if (vitals?.weight && vitals?.height) {
    const bmi = calculateBMI(vitals.weight, vitals.height);
    const bmiRisk = getBMIRisk(bmi);
    score -= bmiRisk.risk * 100;
    factors.push(bmiRisk.category);
    medicalReferences.push('WHO Obesity Classification 2000');
    
    if (bmiRisk.risk > 0.10) {
      recommendations.push('Weight management consultation recommended');
    }
  }

  // === AHA/ACC CARDIOVASCULAR ASSESSMENT ===
  if (vitals?.bloodPressure) {
    const bpRisk = getBloodPressureRisk(vitals.bloodPressure);
    score -= bpRisk.risk * 100;
    factors.push(bpRisk.category);
    medicalReferences.push('AHA/ACC 2017 Hypertension Guidelines');
    
    if (bpRisk.risk > 0.10) {
      recommendations.push('Cardiovascular risk assessment recommended');
    }
  }

  if (vitals?.heartRate) {
    const hrRisk = getHeartRateRisk(vitals.heartRate);
    score -= hrRisk.risk * 100;
    factors.push(hrRisk.category);
    medicalReferences.push('AHA Target Heart Rates 2021');
  }

  // === ADA DIABETES ASSESSMENT ===
  if (vitals?.bloodSugar) {
    const glucoseRisk = getBloodGlucoseRisk(vitals.bloodSugar);
    score -= glucoseRisk.risk * 100;
    factors.push(glucoseRisk.category);
    medicalReferences.push('ADA Diabetes Care Standards 2021');
    
    if (glucoseRisk.risk > 0.08) {
      recommendations.push('Diabetes screening and management consultation');
    }
  }

  // === CDC INFECTIOUS DISEASE ASSESSMENT ===
  if (vitals?.temperature) {
    const tempRisk = getTemperatureRisk(vitals.temperature);
    score -= tempRisk.risk * 100;
    factors.push(tempRisk.category);
    medicalReferences.push('CDC Temperature Guidelines 2021');
    
    if (tempRisk.risk > 0.05) {
      recommendations.push('Infectious disease evaluation recommended');
    }
  }

  // === ATS RESPIRATORY ASSESSMENT ===
  if (vitals?.oxygenSaturation) {
    const oxygenRisk = getOxygenSaturationRisk(vitals.oxygenSaturation);
    score -= oxygenRisk.risk * 100;
    factors.push(oxygenRisk.category);
    medicalReferences.push('ATS Oxygen Therapy Guidelines 2021');
    
    if (oxygenRisk.risk > 0.05) {
      recommendations.push('Respiratory function evaluation recommended');
    }
  }

  // === MEDICAL HISTORY ASSESSMENT ===
  if (patientData.pastMedicalHistory) {
    const historyRisk = assessMedicalHistory(patientData.pastMedicalHistory);
    score -= historyRisk.risk * 100;
    factors.push(...historyRisk.factors);
    medicalReferences.push(...historyRisk.references);
    
    if (historyRisk.risk > 0.10) {
      recommendations.push('Specialist consultation based on medical history');
    }
  }

  // === FAMILY HISTORY ASSESSMENT ===
  if (patientData.familyHistory) {
    const familyRisk = assessFamilyHistory(patientData.familyHistory);
    score -= familyRisk.risk * 100;
    factors.push(...familyRisk.factors);
    medicalReferences.push(...familyRisk.references);
  }

  // === LIFESTYLE RISK ASSESSMENT ===
  if (patientData.socialHistory) {
    const lifestyleRisk = assessLifestyleFactors(patientData.socialHistory);
    score -= lifestyleRisk.risk * 100;
    factors.push(...lifestyleRisk.factors);
    medicalReferences.push(...lifestyleRisk.references);
  }

  // === POSITIVE HEALTH FACTORS ===
  if (patientData.emergencyContact) {
    score += 2; // Positive factor
    factors.push('Emergency Contact Available');
  }

  if (patientData.volunteerInfo?.name) {
    score += 1; // Positive factor
    factors.push('Volunteer Support Available');
  }

  const finalScore = Math.max(0, Math.min(100, score));
  const riskLevel = getRiskLevel(finalScore);

  console.log('📊 Comprehensive Health Assessment Complete:', {
    finalScore,
    riskLevel,
    factors,
    recommendations,
    medicalReferences: Array.from(new Set(medicalReferences))
  });

  return {
    score: finalScore,
    riskLevel,
    factors,
    recommendations,
    medicalReferences: Array.from(new Set(medicalReferences))
  };
}

// Helper Functions
function getAgeRisk(age: number) {
  for (const [key, standard] of Object.entries(WHO_STANDARDS.AGE_RISK)) {
    if (age >= standard.min && age <= standard.max) {
      return standard;
    }
  }
  return WHO_STANDARDS.AGE_RISK.VERY_ELDERLY;
}

function calculateBMI(weight: number, height: number): number {
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
}

function getBMIRisk(bmi: number) {
  for (const [key, standard] of Object.entries(WHO_STANDARDS.BMI_CLASSIFICATION)) {
    if (bmi >= standard.min && bmi <= standard.max) {
      return standard;
    }
  }
  return WHO_STANDARDS.BMI_CLASSIFICATION.OBESITY_CLASS_III;
}

function getBloodPressureRisk(bp: string) {
  const [systolic, diastolic] = bp.split('/').map(Number);
  
  for (const [key, standard] of Object.entries(AHA_ACC_STANDARDS.BLOOD_PRESSURE)) {
    const sMatch = (!('min' in standard.systolic) || systolic >= standard.systolic.min) && 
                   (!('max' in standard.systolic) || systolic <= standard.systolic.max);
    const dMatch = (!('min' in standard.diastolic) || diastolic >= standard.diastolic.min) && 
                   (!('max' in standard.diastolic) || diastolic <= standard.diastolic.max);
    
    if (sMatch && dMatch) {
      return standard;
    }
  }
  return AHA_ACC_STANDARDS.BLOOD_PRESSURE.HYPERTENSIVE_CRISIS;
}

function getHeartRateRisk(hr: number) {
  if (hr <= AHA_ACC_STANDARDS.HEART_RATE.BRADYCARDIA.max) {
    return AHA_ACC_STANDARDS.HEART_RATE.BRADYCARDIA;
  } else if (hr >= AHA_ACC_STANDARDS.HEART_RATE.NORMAL.min && hr <= AHA_ACC_STANDARDS.HEART_RATE.NORMAL.max) {
    return AHA_ACC_STANDARDS.HEART_RATE.NORMAL;
  } else {
    return AHA_ACC_STANDARDS.HEART_RATE.TACHYCARDIA;
  }
}

function getBloodGlucoseRisk(glucose: number) {
  if (glucose <= ADA_STANDARDS.BLOOD_GLUCOSE.NORMAL.max) {
    return ADA_STANDARDS.BLOOD_GLUCOSE.NORMAL;
  } else if (glucose >= ADA_STANDARDS.BLOOD_GLUCOSE.PREDIABETES.min && glucose <= ADA_STANDARDS.BLOOD_GLUCOSE.PREDIABETES.max) {
    return ADA_STANDARDS.BLOOD_GLUCOSE.PREDIABETES;
  } else if (glucose >= ADA_STANDARDS.BLOOD_GLUCOSE.DIABETES.min && glucose < ADA_STANDARDS.BLOOD_GLUCOSE.SEVERE_HYPERGLYCEMIA.min) {
    return ADA_STANDARDS.BLOOD_GLUCOSE.DIABETES;
  } else if (glucose >= ADA_STANDARDS.BLOOD_GLUCOSE.SEVERE_HYPERGLYCEMIA.min) {
    return ADA_STANDARDS.BLOOD_GLUCOSE.SEVERE_HYPERGLYCEMIA;
  } else {
    return ADA_STANDARDS.BLOOD_GLUCOSE.HYPOGLYCEMIA;
  }
}

function getTemperatureRisk(temp: number) {
  if (temp <= CDC_STANDARDS.TEMPERATURE.HYPOTHERMIA.max) {
    return CDC_STANDARDS.TEMPERATURE.HYPOTHERMIA;
  } else if (temp >= CDC_STANDARDS.TEMPERATURE.NORMAL.min && temp <= CDC_STANDARDS.TEMPERATURE.NORMAL.max) {
    return CDC_STANDARDS.TEMPERATURE.NORMAL;
  } else if (temp >= CDC_STANDARDS.TEMPERATURE.FEVER.min && temp <= CDC_STANDARDS.TEMPERATURE.FEVER.max) {
    return CDC_STANDARDS.TEMPERATURE.FEVER;
  } else {
    return CDC_STANDARDS.TEMPERATURE.HIGH_FEVER;
  }
}

function getOxygenSaturationRisk(spo2: number) {
  if (spo2 <= ATS_STANDARDS.OXYGEN_SATURATION.SEVERE_HYPOXEMIA.max) {
    return ATS_STANDARDS.OXYGEN_SATURATION.SEVERE_HYPOXEMIA;
  } else if (spo2 >= ATS_STANDARDS.OXYGEN_SATURATION.MILD_HYPOXEMIA.min && spo2 <= ATS_STANDARDS.OXYGEN_SATURATION.MILD_HYPOXEMIA.max) {
    return ATS_STANDARDS.OXYGEN_SATURATION.MILD_HYPOXEMIA;
  } else {
    return ATS_STANDARDS.OXYGEN_SATURATION.NORMAL;
  }
}

function assessMedicalHistory(history: string) {
  const factors: string[] = [];
  const references: string[] = [];
  let risk = 0;

  const historyLower = history.toLowerCase();

  // Cardiovascular conditions
  if (historyLower.includes('heart') || historyLower.includes('cardiac')) {
    risk += 0.15;
    factors.push('Cardiovascular Disease');
    references.push('AHA/ACC Guidelines 2017');
  }

  // Diabetes
  if (historyLower.includes('diabetes')) {
    risk += 0.12;
    factors.push('Diabetes Mellitus');
    references.push('ADA Standards 2021');
  }

  // Cancer
  if (historyLower.includes('cancer') || historyLower.includes('tumor')) {
    risk += 0.18;
    factors.push('Cancer History');
    references.push('WHO Cancer Guidelines 2021');
  }

  return { risk, factors, references };
}

function assessFamilyHistory(familyHistory: string) {
  const factors: string[] = [];
  const references: string[] = [];
  let risk = 0;

  const familyLower = familyHistory.toLowerCase();

  if (familyLower.includes('diabetes')) {
    risk += 0.08;
    factors.push('Family History of Diabetes');
    references.push('ADA Standards 2021');
  }

  if (familyLower.includes('heart') || familyLower.includes('cardiac')) {
    risk += 0.10;
    factors.push('Family History of Heart Disease');
    references.push('AHA/ACC Guidelines 2017');
  }

  if (familyLower.includes('cancer')) {
    risk += 0.12;
    factors.push('Family History of Cancer');
    references.push('WHO Cancer Guidelines 2021');
  }

  return { risk, factors, references };
}

function assessLifestyleFactors(socialHistory: string) {
  const factors: string[] = [];
  const references: string[] = [];
  let risk = 0;

  const socialLower = socialHistory.toLowerCase();

  if (socialLower.includes('smoking') || socialLower.includes('tobacco')) {
    risk += 0.12;
    factors.push('Tobacco Use');
    references.push('CDC Tobacco Guidelines 2021');
  }

  if (socialLower.includes('alcohol')) {
    risk += 0.06;
    factors.push('Alcohol Use');
    references.push('CDC Alcohol Guidelines 2021');
  }

  return { risk, factors, references };
}

function getRiskLevel(score: number): string {
  if (score >= 90) return 'Low Risk';
  if (score >= 75) return 'Moderate Risk';
  if (score >= 60) return 'High Risk';
  return 'Very High Risk';
}
