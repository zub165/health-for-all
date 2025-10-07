# 📧 Universal EmailJS Template Setup

## 🎯 One Template for All Email Types

Since EmailJS has template limits, we'll use one universal template that can handle all email types dynamically.

## 🚀 Setup Instructions

### Step 1: Create Universal Template
1. **Template Name**: `Health For All Universal`
2. **Template ID**: `template_universal`
3. **Subject**: `{{email_subject}}`

### Step 2: Template Content
Copy this HTML content:

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .header { background-color: {{header_color}}; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .section { margin: 20px 0; }
        .section h3 { color: {{header_color}}; border-bottom: 2px solid {{header_color}}; padding-bottom: 5px; }
        .footer { background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; }
        .highlight { background-color: #e3f2fd; padding: 10px; border-left: 4px solid {{header_color}}; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{email_title}}</h1>
        <p>{{email_subtitle}}</p>
    </div>
    
    <div class="content">
        <p>{{greeting}}</p>
        
        <div class="highlight">
            <strong>{{email_type_description}}</strong>
        </div>
        
        {{email_content}}
        
        <div class="section">
            <h3>{{closing_title}}</h3>
            <p>{{closing_message}}</p>
        </div>
        
        <p>{{signature}}</p>
    </div>
    
    <div class="footer">
        <p>{{footer_message}}</p>
    </div>
</body>
</html>
```

### Step 3: Right Panel Settings
- **To Email**: `{{to_email}}`
- **From Name**: `{{from_name}}`
- **Reply To**: `{{reply_to}}`

## 🎨 How It Works

The universal template uses dynamic variables to create different email types:

### Patient Health Summary
- **Header Color**: Blue (#1976d2)
- **Title**: 🏥 Health Summary Report
- **Content**: Vitals, clinical exam, medications, lab results

### Health Fair Registration
- **Header Color**: Orange (#FF6B35)
- **Title**: 🎉 Health Fair Registration Confirmed!
- **Content**: Event details, what to expect

### Contact Form
- **Header Color**: Blue (#1976d2)
- **Title**: 📧 New Contact Form Submission
- **Content**: Contact message details

### Newsletter Signup
- **Header Color**: Green (#4CAF50)
- **Title**: 📰 Welcome to Health For All Newsletter
- **Content**: Newsletter benefits and information

### Volunteer Application
- **Header Color**: Purple (#9C27B0)
- **Title**: 🤝 New Volunteer Application
- **Content**: Volunteer application details

## ✅ Benefits

1. **One Template**: Handles all email types
2. **Dynamic Content**: Different colors and content per email type
3. **Professional Design**: Consistent branding across all emails
4. **Easy Maintenance**: Update one template for all emails
5. **Template Limit Friendly**: Works within EmailJS free tier limits

## 🚀 Ready to Test

Once you create this universal template, your application will be able to send:
- ✅ Patient health summaries
- ✅ Health fair registrations
- ✅ Contact form submissions
- ✅ Newsletter signups
- ✅ Volunteer applications

All using just one template! 🎉
