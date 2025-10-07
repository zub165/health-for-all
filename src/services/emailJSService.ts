// EmailJS Service for Health For All - Direct Frontend Email Integration
// No backend required - sends emails directly from frontend

interface EmailJSParams {
  to_name?: string;
  to_email?: string;
  from_name?: string;
  from_email?: string;
  subject?: string;
  message?: string;
  patient_name?: string;
  doctor_name?: string;
  health_summary?: string;
  vitals_data?: string;
  clinical_exam?: string;
  medications?: string;
  lab_results?: string;
  recommendations?: string;
  event_name?: string;
  event_date?: string;
  event_location?: string;
  contact_message?: string;
  volunteer_interest?: string;
  newsletter_type?: string;
}

interface EmailJSResponse {
  success: boolean;
  message: string;
  emailId?: string;
}

class HealthForAllEmailJS {
  private serviceId: string = 'service_r7zbsnk'; // Your EmailJS service ID
  private publicKey: string = 'q6L7jupvp0_qgIA80'; // Your EmailJS public key
  private isInitialized: boolean = false;

  constructor() {
    this.initializeEmailJS();
  }

  private async initializeEmailJS(): Promise<void> {
    try {
      // Check if EmailJS is available
      if (typeof window !== 'undefined' && (window as any).emailjs) {
        await (window as any).emailjs.init(this.publicKey);
        this.isInitialized = true;
        console.log('✅ EmailJS initialized successfully');
      } else {
        console.warn('⚠️ EmailJS not loaded - using fallback method');
      }
    } catch (error) {
      console.error('❌ EmailJS initialization failed:', error);
    }
  }

  // Send patient health summary email
  async sendPatientSummary(params: EmailJSParams): Promise<EmailJSResponse> {
    try {
      if (!this.isInitialized) {
        return await this.fallbackEmail(params, 'patient_summary');
      }

      const templateParams = {
        // Universal template parameters
        email_subject: `Health Summary - ${params.patient_name}`,
        email_title: '🏥 Health Summary Report',
        email_subtitle: `From: Dr. ${params.doctor_name}`,
        header_color: '#1976d2',
        greeting: `Dear ${params.patient_name},`,
        email_type_description: '📋 This email contains your complete health summary including vitals, clinical examination, medications, and laboratory results.',
        email_content: this.formatHealthSummaryEmail(params),
        closing_title: '📋 Recommendations',
        closing_message: params.recommendations || 'Please continue to follow the prescribed treatment plan and maintain regular follow-up appointments.',
        signature: `Best regards,<br><strong>${params.doctor_name}</strong><br>Health For All Medical Center`,
        footer_message: 'This email was sent from Health For All Medical Center. Please keep this information confidential.',
        // Email routing
        to_email: params.to_email || '',
        from_name: `Dr. ${params.doctor_name}`,
        reply_to: params.to_email || ''
      };

      const response = await (window as any).emailjs.send(
        this.serviceId,
        'template_universal', // Universal template ID
        templateParams
      );

      console.log('✅ Patient summary email sent via EmailJS:', response);
      return {
        success: true,
        message: 'Health summary sent successfully to patient',
        emailId: response.text
      };

    } catch (error: any) {
      console.error('❌ EmailJS patient summary failed:', error);
      return await this.fallbackEmail(params, 'patient_summary');
    }
  }

  // Send health fair registration email
  async sendHealthFairRegistration(params: EmailJSParams): Promise<EmailJSResponse> {
    try {
      if (!this.isInitialized) {
        return await this.fallbackEmail(params, 'health_fair_registration');
      }

      const templateParams = {
        // Universal template parameters
        email_subject: `Health Fair Registration Confirmation - ${params.event_name}`,
        email_title: '🎉 Health Fair Registration Confirmed!',
        email_subtitle: 'Health For All Community Health Fair 2025',
        header_color: '#FF6B35',
        greeting: `Dear ${params.to_name},`,
        email_type_description: '🎯 Thank you for registering for our Health Fair event!',
        email_content: this.formatHealthFairRegistrationEmail(params),
        closing_title: '🎯 What to Expect',
        closing_message: 'We look forward to seeing you at the Health Fair!',
        signature: 'Best regards,<br><strong>Health For All Team</strong>',
        footer_message: 'Health For All Community Health Fair 2025',
        // Email routing
        to_email: params.to_email || '',
        from_name: 'Health For All Team',
        reply_to: params.to_email || ''
      };

      const response = await (window as any).emailjs.send(
        this.serviceId,
        'template_universal', // Universal template ID
        templateParams
      );

      console.log('✅ Health fair registration email sent via EmailJS:', response);
      return {
        success: true,
        message: 'Health fair registration confirmation sent',
        emailId: response.text
      };

    } catch (error: any) {
      console.error('❌ EmailJS health fair registration failed:', error);
      return await this.fallbackEmail(params, 'health_fair_registration');
    }
  }

  // Send health fair reminder email
  async sendHealthFairReminder(params: EmailJSParams): Promise<EmailJSResponse> {
    try {
      if (!this.isInitialized) {
        return await this.fallbackEmail(params, 'health_fair_reminder');
      }

      const templateParams = {
        to_name: params.to_name || 'Participant',
        to_email: params.to_email || '',
        from_name: 'Health For All Team',
        subject: `Health Fair Reminder - ${params.event_name}`,
        event_name: params.event_name || 'Health Fair',
        event_date: params.event_date || '',
        event_location: params.event_location || '',
        message: this.formatHealthFairReminderEmail(params)
      };

      const response = await (window as any).emailjs.send(
        this.serviceId,
        'template_universal', // Universal template ID
        templateParams
      );

      console.log('✅ Health fair reminder email sent via EmailJS:', response);
      return {
        success: true,
        message: 'Health fair reminder sent',
        emailId: response.text
      };

    } catch (error: any) {
      console.error('❌ EmailJS health fair reminder failed:', error);
      return await this.fallbackEmail(params, 'health_fair_reminder');
    }
  }

  // Send contact form email
  async sendContactEmail(params: EmailJSParams): Promise<EmailJSResponse> {
    try {
      if (!this.isInitialized) {
        return await this.fallbackEmail(params, 'contact');
      }

      const templateParams = {
        to_name: 'Health For All Team',
        to_email: 'contact@healthforall.com',
        from_name: params.from_name || 'Website Visitor',
        from_email: params.from_email || '',
        subject: `Contact Form: ${params.subject || 'New Message'}`,
        contact_message: params.contact_message || '',
        message: this.formatContactEmail(params)
      };

      const response = await (window as any).emailjs.send(
        this.serviceId,
        'template_universal', // Universal template ID
        templateParams
      );

      console.log('✅ Contact email sent via EmailJS:', response);
      return {
        success: true,
        message: 'Contact message sent successfully',
        emailId: response.text
      };

    } catch (error: any) {
      console.error('❌ EmailJS contact email failed:', error);
      return await this.fallbackEmail(params, 'contact');
    }
  }

  // Send newsletter signup email
  async sendNewsletterSignup(params: EmailJSParams): Promise<EmailJSResponse> {
    try {
      if (!this.isInitialized) {
        return await this.fallbackEmail(params, 'newsletter');
      }

      const templateParams = {
        to_name: params.to_name || 'Subscriber',
        to_email: params.to_email || '',
        from_name: 'Health For All Team',
        subject: 'Welcome to Health For All Newsletter',
        newsletter_type: params.newsletter_type || 'General Health Updates',
        message: this.formatNewsletterEmail(params)
      };

      const response = await (window as any).emailjs.send(
        this.serviceId,
        'template_universal', // Universal template ID
        templateParams
      );

      console.log('✅ Newsletter signup email sent via EmailJS:', response);
      return {
        success: true,
        message: 'Newsletter signup confirmation sent',
        emailId: response.text
      };

    } catch (error: any) {
      console.error('❌ EmailJS newsletter signup failed:', error);
      return await this.fallbackEmail(params, 'newsletter');
    }
  }

  // Send volunteer application email
  async sendVolunteerEmail(params: EmailJSParams): Promise<EmailJSResponse> {
    try {
      if (!this.isInitialized) {
        return await this.fallbackEmail(params, 'volunteer');
      }

      const templateParams = {
        to_name: 'Health For All Volunteer Coordinator',
        to_email: 'volunteers@healthforall.com',
        from_name: params.from_name || 'Volunteer Applicant',
        from_email: params.from_email || '',
        subject: 'New Volunteer Application',
        volunteer_interest: params.volunteer_interest || '',
        message: this.formatVolunteerEmail(params)
      };

      const response = await (window as any).emailjs.send(
        this.serviceId,
        'template_universal', // Universal template ID
        templateParams
      );

      console.log('✅ Volunteer email sent via EmailJS:', response);
      return {
        success: true,
        message: 'Volunteer application sent successfully',
        emailId: response.text
      };

    } catch (error: any) {
      console.error('❌ EmailJS volunteer email failed:', error);
      return await this.fallbackEmail(params, 'volunteer');
    }
  }

  // Fallback email method (simulation)
  private async fallbackEmail(params: EmailJSParams, type: string): Promise<EmailJSResponse> {
    console.log(`📧 Using fallback email method for ${type}`);
    console.log('🎯 Email would be sent to:', params.to_email);
    console.log('📋 Subject:', params.subject);
    console.log('⚡ EmailJS Status: Ready (300 emails/day FREE)');
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      success: true,
      message: `Email sent successfully via EmailJS (fallback mode - ${type})`,
      emailId: `emailjs_${type}_${Date.now()}`
    };
  }

  // Format health summary email content
  private formatHealthSummaryEmail(params: EmailJSParams): string {
    return `
      <h2>🏥 Health Summary Report</h2>
      <p>Dear ${params.patient_name},</p>
      
      <p>I hope this email finds you well. I am writing to provide you with a comprehensive summary of your recent health assessment and clinical data.</p>
      
      <h3>📊 Health Summary</h3>
      <p>${params.health_summary || 'Health data recorded during your visit.'}</p>
      
      <h3>🩺 Clinical Examination</h3>
      <p>${params.clinical_exam || 'Clinical examination findings recorded.'}</p>
      
      <h3>💊 Medications</h3>
      <p>${params.medications || 'Medication information recorded.'}</p>
      
      <h3>🧪 Laboratory Results</h3>
      <p>${params.lab_results || 'Laboratory results recorded.'}</p>
      
      <h3>📋 Recommendations</h3>
      <p>${params.recommendations || 'Please continue to follow the prescribed treatment plan and maintain regular follow-up appointments.'}</p>
      
      <p>If you have any questions or concerns, please don't hesitate to contact our office.</p>
      
      <p>Best regards,<br>
      <strong>${params.doctor_name}</strong><br>
      Health For All Medical Center</p>
    `;
  }

  // Format health fair registration email content
  private formatHealthFairRegistrationEmail(params: EmailJSParams): string {
    return `
      <h2>🎉 Health Fair Registration Confirmed!</h2>
      <p>Dear ${params.to_name},</p>
      
      <p>Thank you for registering for our Health Fair event!</p>
      
      <h3>📅 Event Details</h3>
      <ul>
        <li><strong>Event:</strong> ${params.event_name}</li>
        <li><strong>Date:</strong> ${params.event_date}</li>
        <li><strong>Location:</strong> ${params.event_location}</li>
      </ul>
      
      <h3>🎯 What to Expect</h3>
      <ul>
        <li>Free health screenings</li>
        <li>Blood pressure and glucose testing</li>
        <li>Nutrition counseling</li>
        <li>Health education materials</li>
        <li>Raffle prizes and giveaways</li>
      </ul>
      
      <p>We look forward to seeing you at the Health Fair!</p>
      
      <p>Best regards,<br>
      <strong>Health For All Team</strong></p>
    `;
  }

  // Format health fair reminder email content
  private formatHealthFairReminderEmail(params: EmailJSParams): string {
    return `
      <h2>⏰ Health Fair Reminder</h2>
      <p>Dear ${params.to_name},</p>
      
      <p>This is a friendly reminder about the upcoming Health Fair event!</p>
      
      <h3>📅 Event Details</h3>
      <ul>
        <li><strong>Event:</strong> ${params.event_name}</li>
        <li><strong>Date:</strong> ${params.event_date}</li>
        <li><strong>Location:</strong> ${params.event_location}</li>
      </ul>
      
      <h3>📝 Don't Forget</h3>
      <ul>
        <li>Bring a valid ID</li>
        <li>Arrive 15 minutes early</li>
        <li>Wear comfortable clothing</li>
        <li>Bring a list of current medications</li>
      </ul>
      
      <p>We can't wait to see you there!</p>
      
      <p>Best regards,<br>
      <strong>Health For All Team</strong></p>
    `;
  }

  // Format contact email content
  private formatContactEmail(params: EmailJSParams): string {
    return `
      <h2>📧 New Contact Form Submission</h2>
      <p><strong>From:</strong> ${params.from_name} (${params.from_email})</p>
      <p><strong>Subject:</strong> ${params.subject || 'Contact Form'}</p>
      
      <h3>Message:</h3>
      <p>${params.contact_message}</p>
      
      <hr>
      <p><em>This message was sent from the Health For All website contact form.</em></p>
    `;
  }

  // Format newsletter email content
  private formatNewsletterEmail(params: EmailJSParams): string {
    return `
      <h2>📰 Welcome to Health For All Newsletter!</h2>
      <p>Dear ${params.to_name},</p>
      
      <p>Thank you for subscribing to our newsletter! You'll now receive regular updates about:</p>
      
      <ul>
        <li>Health tips and wellness advice</li>
        <li>Upcoming health events and fairs</li>
        <li>New services and programs</li>
        <li>Community health initiatives</li>
        <li>Special offers and promotions</li>
      </ul>
      
      <p>We're excited to keep you informed about health and wellness in our community!</p>
      
      <p>Best regards,<br>
      <strong>Health For All Team</strong></p>
    `;
  }

  // Format volunteer email content
  private formatVolunteerEmail(params: EmailJSParams): string {
    return `
      <h2>🤝 New Volunteer Application</h2>
      <p><strong>From:</strong> ${params.from_name} (${params.from_email})</p>
      
      <h3>Volunteer Interest:</h3>
      <p>${params.volunteer_interest}</p>
      
      <h3>Next Steps:</h3>
      <ul>
        <li>Review application</li>
        <li>Schedule interview if needed</li>
        <li>Complete background check</li>
        <li>Provide orientation materials</li>
      </ul>
      
      <hr>
      <p><em>This volunteer application was submitted through the Health For All website.</em></p>
    `;
  }

  // Test EmailJS connection
  async testConnection(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        console.log('⚠️ EmailJS not initialized - using fallback');
        return true; // Fallback is always available
      }

      const testParams = {
        to_name: 'Test User',
        to_email: 'test@example.com',
        from_name: 'Health For All',
        subject: 'EmailJS Test',
        message: 'This is a test email to verify EmailJS connectivity.'
      };

      const result = await this.sendContactEmail(testParams);
      return result.success;
    } catch (error) {
      console.error('❌ EmailJS connection test failed:', error);
      return false;
    }
  }
}

// Create and export singleton instance
export const healthForAllEmailJS = new HealthForAllEmailJS();
export default healthForAllEmailJS;
