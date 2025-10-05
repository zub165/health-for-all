// AI Service for Health For All Fair
// This service provides AI-powered features for rapid patient processing

export interface AIPatientData {
  name: string;
  email: string;
  phoneNumber: string;
  age: number;
  gender: string;
  bloodGroup: string;
  allergies: string;
  pastMedicalHistory: string;
  familyHistory: string;
  medicationList: string;
}

export interface AIVitalsPrediction {
  bloodSugar: number;
  carotidDoppler: string;
  mentalHealthScore: number;
  confidence: number;
}

export interface AIRecommendation {
  summary: string;
  recommendations: string;
  urgency: 'low' | 'medium' | 'high';
  followUp: string;
}

class AIService {
  private readonly API_BASE_URL = 'http://localhost:3015/api/ai';

  // AI-powered patient data extraction from minimal input
  async extractPatientData(minimalInput: {
    name?: string;
    email?: string;
    phone?: string;
    age?: number;
  }): Promise<AIPatientData> {
    // Simulate AI processing with realistic delays
    await this.delay(2000); // 2 seconds for AI processing

    // Mock AI response - in real implementation, this would call an AI API
    const mockResponse: AIPatientData = {
      name: minimalInput.name || 'John Doe',
      email: minimalInput.email || 'john.doe@email.com',
      phoneNumber: minimalInput.phone || '+1-555-0123',
      age: minimalInput.age || 35,
      gender: this.predictGender(minimalInput.name),
      bloodGroup: this.predictBloodGroup(),
      allergies: this.predictAllergies(),
      pastMedicalHistory: this.predictMedicalHistory(),
      familyHistory: this.predictFamilyHistory(),
      medicationList: this.predictMedications(),
    };

    return mockResponse;
  }

  // AI-powered vitals prediction based on patient data
  async predictVitals(patientData: AIPatientData): Promise<AIVitalsPrediction> {
    await this.delay(1500); // 1.5 seconds for AI analysis

    // Mock AI vitals prediction
    const mockVitals: AIVitalsPrediction = {
      bloodSugar: this.predictBloodSugar(patientData),
      carotidDoppler: this.predictCarotidDoppler(patientData),
      mentalHealthScore: this.predictMentalHealthScore(patientData),
      confidence: 0.85 + Math.random() * 0.1, // 85-95% confidence
    };

    return mockVitals;
  }

  // AI-powered recommendation generation
  async generateRecommendations(
    patientData: AIPatientData,
    vitals: AIVitalsPrediction
  ): Promise<AIRecommendation> {
    await this.delay(1000); // 1 second for AI recommendation generation

    const mockRecommendation: AIRecommendation = {
      summary: this.generateSummary(patientData, vitals),
      recommendations: this.generateRecommendationText(patientData, vitals),
      urgency: this.determineUrgency(vitals),
      followUp: this.generateFollowUp(patientData, vitals),
    };

    return mockRecommendation;
  }

  // AI-powered email summary generation
  async generateEmailSummary(
    patientData: AIPatientData,
    vitals: AIVitalsPrediction,
    recommendations: AIRecommendation
  ): Promise<string> {
    await this.delay(500); // 0.5 seconds for email generation

    return `
Dear ${patientData.name},

Thank you for participating in the Health For All Fair screening. Here's your comprehensive health summary:

HEALTH SCREENING RESULTS:
• Blood Sugar: ${vitals.bloodSugar} mg/dL (${this.getBloodSugarStatus(vitals.bloodSugar)})
• Carotid Doppler: ${vitals.carotidDoppler}
• Mental Health Score: ${vitals.mentalHealthScore}/27 (${this.getMentalHealthStatus(vitals.mentalHealthScore)})

RECOMMENDATIONS:
${recommendations.recommendations}

FOLLOW-UP:
${recommendations.followUp}

URGENCY LEVEL: ${recommendations.urgency.toUpperCase()}

This summary was generated using AI-powered analysis of your health data. Please consult with your primary care physician for detailed interpretation of these results.

Best regards,
Health For All Fair Team
    `.trim();
  }

  // Helper methods for AI predictions
  private predictGender(name?: string): string {
    if (!name) return 'Unknown';
    // Simple gender prediction based on common names
    const maleNames = ['john', 'michael', 'david', 'james', 'robert', 'william', 'richard', 'charles', 'thomas', 'christopher'];
    const femaleNames = ['mary', 'patricia', 'jennifer', 'linda', 'elizabeth', 'barbara', 'susan', 'jessica', 'sarah', 'karen'];
    
    const firstName = name.toLowerCase().split(' ')[0];
    if (maleNames.includes(firstName)) return 'Male';
    if (femaleNames.includes(firstName)) return 'Female';
    return 'Unknown';
  }

  private predictBloodGroup(): string {
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    return bloodGroups[Math.floor(Math.random() * bloodGroups.length)];
  }

  private predictAllergies(): string {
    const commonAllergies = [
      'None known',
      'Penicillin',
      'Shellfish',
      'Peanuts',
      'Dust mites',
      'Pollen',
      'Latex',
      'Penicillin, Shellfish',
      'None known',
      'None known'
    ];
    return commonAllergies[Math.floor(Math.random() * commonAllergies.length)];
  }

  private predictMedicalHistory(): string {
    const histories = [
      'None significant',
      'Hypertension (controlled)',
      'Type 2 Diabetes (well controlled)',
      'High cholesterol',
      'None significant',
      'Previous appendectomy',
      'None significant',
      'Mild asthma',
      'None significant',
      'None significant'
    ];
    return histories[Math.floor(Math.random() * histories.length)];
  }

  private predictFamilyHistory(): string {
    const histories = [
      'None significant',
      'Heart disease (father)',
      'Diabetes (mother)',
      'High blood pressure (both parents)',
      'None significant',
      'Cancer (grandmother)',
      'None significant',
      'Heart disease (father), Diabetes (mother)',
      'None significant',
      'None significant'
    ];
    return histories[Math.floor(Math.random() * histories.length)];
  }

  private predictMedications(): string {
    const medications = [
      'None',
      'Metformin 500mg daily',
      'Lisinopril 10mg daily',
      'Atorvastatin 20mg daily',
      'None',
      'Multivitamin daily',
      'None',
      'Metformin, Lisinopril',
      'None',
      'None'
    ];
    return medications[Math.floor(Math.random() * medications.length)];
  }

  private predictBloodSugar(patientData: AIPatientData): number {
    // AI prediction based on age, medical history, and medications
    let baseSugar = 90;
    
    if (patientData.pastMedicalHistory.includes('Diabetes')) {
      baseSugar += 40 + Math.random() * 30; // 130-160
    } else if (patientData.age > 50) {
      baseSugar += 10 + Math.random() * 20; // 100-120
    } else {
      baseSugar += Math.random() * 20; // 90-110
    }
    
    return Math.round(baseSugar);
  }

  private predictCarotidDoppler(patientData: AIPatientData): string {
    const options = ['Normal', 'Mild stenosis (< 50%)', 'Moderate stenosis (50-69%)', 'Severe stenosis (70-99%)', 'Occlusion (100%)'];
    const weights = [0.7, 0.15, 0.08, 0.05, 0.02]; // Most patients have normal results
    
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < options.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return options[i];
      }
    }
    
    return 'Normal';
  }

  private predictMentalHealthScore(patientData: AIPatientData): number {
    // AI prediction based on age, medical history, and other factors
    let baseScore = 2;
    
    if (patientData.pastMedicalHistory.includes('Diabetes')) {
      baseScore += 3;
    }
    if (patientData.age > 60) {
      baseScore += 2;
    }
    if (patientData.medicationList.includes('None')) {
      baseScore -= 1;
    }
    
    // Add some randomness
    baseScore += Math.floor(Math.random() * 8) - 4; // -4 to +4
    
    return Math.max(0, Math.min(27, baseScore));
  }

  private generateSummary(patientData: AIPatientData, vitals: AIVitalsPrediction): string {
    return `Health screening completed for ${patientData.name}, age ${patientData.age}. Blood sugar: ${vitals.bloodSugar} mg/dL, Carotid Doppler: ${vitals.carotidDoppler}, Mental Health Score: ${vitals.mentalHealthScore}/27. Overall health status: ${this.getOverallHealthStatus(vitals)}.`;
  }

  private generateRecommendationText(patientData: AIPatientData, vitals: AIVitalsPrediction): string {
    let recommendations = [];
    
    if (vitals.bloodSugar > 140) {
      recommendations.push("• Blood sugar is elevated. Consider dietary modifications and regular monitoring.");
    } else if (vitals.bloodSugar < 70) {
      recommendations.push("• Blood sugar is low. Ensure regular meals and monitor for hypoglycemia symptoms.");
    } else {
      recommendations.push("• Blood sugar levels are within normal range. Continue current lifestyle habits.");
    }
    
    if (vitals.carotidDoppler !== 'Normal') {
      recommendations.push("• Carotid Doppler shows abnormalities. Follow up with a cardiologist for further evaluation.");
    } else {
      recommendations.push("• Carotid Doppler results are normal. Continue cardiovascular health maintenance.");
    }
    
    if (vitals.mentalHealthScore > 14) {
      recommendations.push("• Mental health screening suggests moderate to severe depression. Consider consultation with a mental health professional.");
    } else if (vitals.mentalHealthScore > 9) {
      recommendations.push("• Mental health screening suggests mild depression. Monitor symptoms and consider lifestyle modifications.");
    } else {
      recommendations.push("• Mental health screening is within normal range. Continue current mental health practices.");
    }
    
    recommendations.push("• Schedule annual health checkup with primary care physician.");
    recommendations.push("• Maintain regular exercise routine and balanced diet.");
    
    return recommendations.join('\n');
  }

  private determineUrgency(vitals: AIVitalsPrediction): 'low' | 'medium' | 'high' {
    if (vitals.bloodSugar > 200 || vitals.carotidDoppler.includes('Severe') || vitals.mentalHealthScore > 19) {
      return 'high';
    } else if (vitals.bloodSugar > 140 || vitals.carotidDoppler.includes('Moderate') || vitals.mentalHealthScore > 14) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private generateFollowUp(patientData: AIPatientData, vitals: AIVitalsPrediction): string {
    const urgency = this.determineUrgency(vitals);
    
    switch (urgency) {
      case 'high':
        return "Immediate follow-up recommended within 1-2 weeks. Please contact your primary care physician or visit urgent care if symptoms worsen.";
      case 'medium':
        return "Follow-up recommended within 2-4 weeks. Schedule an appointment with your primary care physician for detailed evaluation.";
      default:
        return "Routine follow-up in 6-12 months. Continue current health maintenance practices.";
    }
  }

  private getBloodSugarStatus(bloodSugar: number): string {
    if (bloodSugar < 70) return 'Low';
    if (bloodSugar > 140) return 'High';
    return 'Normal';
  }

  private getMentalHealthStatus(score: number): string {
    if (score <= 4) return 'Minimal depression';
    if (score <= 9) return 'Mild depression';
    if (score <= 14) return 'Moderate depression';
    if (score <= 19) return 'Moderately severe depression';
    return 'Severe depression';
  }

  private getOverallHealthStatus(vitals: AIVitalsPrediction): string {
    const urgency = this.determineUrgency(vitals);
    switch (urgency) {
      case 'high': return 'Requires immediate attention';
      case 'medium': return 'Needs follow-up care';
      default: return 'Generally healthy';
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const aiService = new AIService();
