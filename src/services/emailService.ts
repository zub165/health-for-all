// Automated Email Service for Health For All Fair
// This service handles AI-generated email summaries

import { AIPatientData, AIVitalsPrediction, AIRecommendation } from './aiService';

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailService {
  private readonly API_BASE_URL = 'http://localhost:3015/api';

  // Send AI-generated email summary to patient
  async sendPatientSummary(
    patientData: AIPatientData,
    vitals: AIVitalsPrediction,
    recommendations: AIRecommendation
  ): Promise<EmailResult> {
    try {
      // Generate AI email content
      const emailContent = await this.generateEmailContent(patientData, vitals, recommendations);
      
      // Send email via API
      const response = await fetch(`${this.API_BASE_URL}/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: patientData.email,
          subject: `Health For All Fair - Your AI-Generated Health Summary`,
          html: emailContent.html,
          text: emailContent.text,
          patientId: patientData.email, // Using email as identifier
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          messageId: result.messageId,
        };
      } else {
        const error = await response.text();
        return {
          success: false,
          error: error || 'Failed to send email',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Generate comprehensive email content
  private async generateEmailContent(
    patientData: AIPatientData,
    vitals: AIVitalsPrediction,
    recommendations: AIRecommendation
  ): Promise<{ html: string; text: string }> {
    const bloodSugarStatus = this.getBloodSugarStatus(vitals.bloodSugar);
    const mentalHealthStatus = this.getMentalHealthStatus(vitals.mentalHealthScore);

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Health For All Fair - Your Health Summary</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1976d2, #42a5f5); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .section { background: white; margin: 20px 0; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .urgent { border-left: 5px solid #f44336; }
        .medium { border-left: 5px solid #ff9800; }
        .low { border-left: 5px solid #4caf50; }
        .vitals-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 15px 0; }
        .vital-item { background: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; }
        .status-normal { color: #4caf50; font-weight: bold; }
        .status-warning { color: #ff9800; font-weight: bold; }
        .status-danger { color: #f44336; font-weight: bold; }
        .ai-badge { background: #e3f2fd; color: #1976d2; padding: 5px 10px; border-radius: 15px; font-size: 12px; display: inline-block; margin: 5px 0; }
        .footer { text-align: center; margin-top: 30px; padding: 20px; background: #e3f2fd; border-radius: 8px; }
        .recommendations { white-space: pre-line; }
        @media (max-width: 600px) { .vitals-grid { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏥 Health For All Fair</h1>
        <h2>Your AI-Generated Health Summary</h2>
        <div class="ai-badge">🤖 Powered by AI</div>
    </div>
    
    <div class="content">
        <div class="section">
            <h3>👤 Patient Information</h3>
            <p><strong>Name:</strong> ${patientData.name}</p>
            <p><strong>Age:</strong> ${patientData.age} years</p>
            <p><strong>Gender:</strong> ${patientData.gender}</p>
            <p><strong>Blood Group:</strong> ${patientData.bloodGroup}</p>
        </div>

        <div class="section urgent-${recommendations.urgency}">
            <h3>🔬 Health Screening Results</h3>
            <div class="vitals-grid">
                <div class="vital-item">
                    <h4>Blood Sugar</h4>
                    <p class="status-${bloodSugarStatus.toLowerCase()}">${vitals.bloodSugar} mg/dL</p>
                    <small>${bloodSugarStatus}</small>
                </div>
                <div class="vital-item">
                    <h4>Carotid Doppler</h4>
                    <p>${vitals.carotidDoppler}</p>
                </div>
                <div class="vital-item">
                    <h4>Mental Health Score</h4>
                    <p class="status-${mentalHealthStatus.toLowerCase().includes('severe') ? 'danger' : mentalHealthStatus.toLowerCase().includes('moderate') ? 'warning' : 'normal'}">${vitals.mentalHealthScore}/27</p>
                    <small>${mentalHealthStatus}</small>
                </div>
                <div class="vital-item">
                    <h4>AI Confidence</h4>
                    <p class="status-normal">${(vitals.confidence * 100).toFixed(1)}%</p>
                </div>
            </div>
        </div>

        <div class="section urgent-${recommendations.urgency}">
            <h3>📋 AI-Generated Recommendations</h3>
            <div class="recommendations">${recommendations.recommendations}</div>
            <p><strong>Urgency Level:</strong> <span class="status-${recommendations.urgency}">${recommendations.urgency.toUpperCase()}</span></p>
        </div>

        <div class="section">
            <h3>📅 Follow-Up Instructions</h3>
            <p>${recommendations.followUp}</p>
        </div>

        <div class="section">
            <h3>📊 Health Summary</h3>
            <p>${recommendations.summary}</p>
        </div>

        <div class="footer">
            <p><strong>Important Disclaimer:</strong></p>
            <p>This health summary was generated using AI-powered analysis. While our AI system provides high-confidence predictions, this information should not replace professional medical advice. Please consult with your primary care physician for detailed interpretation of these results.</p>
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            <p>Processing time: Under 10 seconds ⚡</p>
        </div>
    </div>
</body>
</html>
    `;

    const text = `
HEALTH FOR ALL FAIR - AI-GENERATED HEALTH SUMMARY

Patient Information:
- Name: ${patientData.name}
- Age: ${patientData.age} years
- Gender: ${patientData.gender}
- Blood Group: ${patientData.bloodGroup}

Health Screening Results:
- Blood Sugar: ${vitals.bloodSugar} mg/dL (${bloodSugarStatus})
- Carotid Doppler: ${vitals.carotidDoppler}
- Mental Health Score: ${vitals.mentalHealthScore}/27 (${mentalHealthStatus})
- AI Confidence: ${(vitals.confidence * 100).toFixed(1)}%

AI-Generated Recommendations:
${recommendations.recommendations}

Urgency Level: ${recommendations.urgency.toUpperCase()}

Follow-Up Instructions:
${recommendations.followUp}

Health Summary:
${recommendations.summary}

IMPORTANT DISCLAIMER:
This health summary was generated using AI-powered analysis. While our AI system provides high-confidence predictions, this information should not replace professional medical advice. Please consult with your primary care physician for detailed interpretation of these results.

Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
Processing time: Under 10 seconds

Best regards,
Health For All Fair Team
    `;

    return { html, text };
  }

  private getUrgencyColor(urgency: string): string {
    switch (urgency) {
      case 'high': return 'urgent';
      case 'medium': return 'medium';
      default: return 'low';
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

  // Send notification to doctor about new patient
  async notifyDoctor(
    patientData: AIPatientData,
    vitals: AIVitalsPrediction,
    recommendations: AIRecommendation,
    doctorEmail: string
  ): Promise<EmailResult> {
    try {
      const emailContent = `
New patient processed through AI system:

Patient: ${patientData.name}
Age: ${patientData.age}
Urgency: ${recommendations.urgency.toUpperCase()}

Key Findings:
- Blood Sugar: ${vitals.bloodSugar} mg/dL
- Carotid Doppler: ${vitals.carotidDoppler}
- Mental Health Score: ${vitals.mentalHealthScore}/27

AI Confidence: ${(vitals.confidence * 100).toFixed(1)}%

Please review the full patient record in the system.
      `;

      const response = await fetch(`${this.API_BASE_URL}/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: doctorEmail,
          subject: `AI-Processed Patient: ${patientData.name} - ${recommendations.urgency.toUpperCase()} Priority`,
          text: emailContent,
        }),
      });

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: 'Failed to notify doctor' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }
}

export const emailService = new EmailService();
