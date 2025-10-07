# 📧 EmailJS Templates Setup Guide

## 🎯 Quick Setup Instructions

### Step 1: Access EmailJS Dashboard
1. Go to [https://dashboard.emailjs.com/](https://dashboard.emailjs.com/)
2. Login to your account
3. Go to **Email Templates** section

### Step 2: Create Templates

#### Template 1: Patient Health Summary
- **Template Name**: `Patient Health Summary`
- **Template ID**: `template_patient_summary`
- **Subject**: `Health Summary - {{patient_name}}`

**Content**:
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #1976d2; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .section { margin: 20px 0; }
        .section h3 { color: #1976d2; border-bottom: 2px solid #1976d2; padding-bottom: 5px; }
        .footer { background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏥 Health Summary Report</h1>
        <p>From: Dr. {{doctor_name}}</p>
    </div>
    
    <div class="content">
        <p>Dear {{patient_name}},</p>
        
        <p>I hope this email finds you well. I am writing to provide you with a comprehensive summary of your recent health assessment and clinical data.</p>
        
        <div class="section">
            <h3>📊 Health Summary</h3>
            <p>{{health_summary}}</p>
        </div>
        
        <div class="section">
            <h3>🩺 Clinical Examination</h3>
            <p>{{clinical_exam}}</p>
        </div>
        
        <div class="section">
            <h3>💊 Medications</h3>
            <p>{{medications}}</p>
        </div>
        
        <div class="section">
            <h3>🧪 Laboratory Results</h3>
            <p>{{lab_results}}</p>
        </div>
        
        <div class="section">
            <h3>📋 Recommendations</h3>
            <p>{{recommendations}}</p>
        </div>
        
        <p>If you have any questions or concerns, please don't hesitate to contact our office.</p>
        
        <p>Best regards,<br>
        <strong>{{doctor_name}}</strong><br>
        Health For All Medical Center</p>
    </div>
    
    <div class="footer">
        <p>This email was sent from Health For All Medical Center. Please keep this information confidential.</p>
    </div>
</body>
</html>
```

#### Template 2: Health Fair Registration
- **Template Name**: `Health Fair Registration`
- **Template ID**: `template_health_fair_registration`
- **Subject**: `Health Fair Registration Confirmation - {{event_name}}`

**Content**:
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #FF6B35; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .section { margin: 20px 0; }
        .section h3 { color: #FF6B35; border-bottom: 2px solid #FF6B35; padding-bottom: 5px; }
        .footer { background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎉 Health Fair Registration Confirmed!</h1>
    </div>
    
    <div class="content">
        <p>Dear {{to_name}},</p>
        
        <p>Thank you for registering for our Health Fair event!</p>
        
        <div class="section">
            <h3>📅 Event Details</h3>
            <ul>
                <li><strong>Event:</strong> {{event_name}}</li>
                <li><strong>Date:</strong> {{event_date}}</li>
                <li><strong>Location:</strong> {{event_location}}</li>
            </ul>
        </div>
        
        <div class="section">
            <h3>🎯 What to Expect</h3>
            <ul>
                <li>Free health screenings</li>
                <li>Blood pressure and glucose testing</li>
                <li>Nutrition counseling</li>
                <li>Health education materials</li>
                <li>Raffle prizes and giveaways</li>
            </ul>
        </div>
        
        <p>We look forward to seeing you at the Health Fair!</p>
        
        <p>Best regards,<br>
        <strong>Health For All Team</strong></p>
    </div>
    
    <div class="footer">
        <p>Health For All Community Health Fair 2025</p>
    </div>
</body>
</html>
```

#### Template 3: Contact Form
- **Template Name**: `Contact Form`
- **Template ID**: `template_contact`
- **Subject**: `Contact Form: {{subject}}`

**Content**:
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #1976d2; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .section { margin: 20px 0; }
        .footer { background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📧 New Contact Form Submission</h1>
    </div>
    
    <div class="content">
        <div class="section">
            <p><strong>From:</strong> {{from_name}} ({{from_email}})</p>
            <p><strong>Subject:</strong> {{subject}}</p>
        </div>
        
        <div class="section">
            <h3>Message:</h3>
            <p>{{contact_message}}</p>
        </div>
    </div>
    
    <div class="footer">
        <p>This message was sent from the Health For All website contact form.</p>
    </div>
</body>
</html>
```

#### Template 4: Newsletter Signup
- **Template Name**: `Newsletter Signup`
- **Template ID**: `template_newsletter`
- **Subject**: `Welcome to Health For All Newsletter`

**Content**:
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .section { margin: 20px 0; }
        .footer { background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📰 Welcome to Health For All Newsletter!</h1>
    </div>
    
    <div class="content">
        <p>Dear {{to_name}},</p>
        
        <p>Thank you for subscribing to our newsletter! You'll now receive regular updates about:</p>
        
        <div class="section">
            <ul>
                <li>Health tips and wellness advice</li>
                <li>Upcoming health events and fairs</li>
                <li>New services and programs</li>
                <li>Community health initiatives</li>
                <li>Special offers and promotions</li>
            </ul>
        </div>
        
        <p>We're excited to keep you informed about health and wellness in our community!</p>
        
        <p>Best regards,<br>
        <strong>Health For All Team</strong></p>
    </div>
    
    <div class="footer">
        <p>Health For All Newsletter - Stay healthy, stay informed!</p>
    </div>
</body>
</html>
```

#### Template 5: Volunteer Application
- **Template Name**: `Volunteer Application`
- **Template ID**: `template_volunteer`
- **Subject**: `New Volunteer Application`

**Content**:
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #9C27B0; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .section { margin: 20px 0; }
        .footer { background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🤝 New Volunteer Application</h1>
    </div>
    
    <div class="content">
        <div class="section">
            <p><strong>From:</strong> {{from_name}} ({{from_email}})</p>
        </div>
        
        <div class="section">
            <h3>Volunteer Interest:</h3>
            <p>{{volunteer_interest}}</p>
        </div>
        
        <div class="section">
            <h3>Next Steps:</h3>
            <ul>
                <li>Review application</li>
                <li>Schedule interview if needed</li>
                <li>Complete background check</li>
                <li>Provide orientation materials</li>
            </ul>
        </div>
    </div>
    
    <div class="footer">
        <p>This volunteer application was submitted through the Health For All website.</p>
    </div>
</body>
</html>
```

### Step 3: Get Your Credentials

After creating the templates, you'll need:

1. **Service ID**: From your email service
2. **Public Key**: From your EmailJS account settings
3. **Template IDs**: The IDs you created above

### Step 4: Update Configuration

Once you have your credentials, I'll help you update the configuration in your code.

## 🎯 Next Steps

1. **Create EmailJS account** ✅
2. **Set up email service** ✅
3. **Create 5 templates** (use the content above)
4. **Get your credentials** (Service ID, Public Key)
5. **Update configuration** in the code
6. **Test email sending**

Let me know when you've completed steps 1-3, and I'll help you with the configuration update!
