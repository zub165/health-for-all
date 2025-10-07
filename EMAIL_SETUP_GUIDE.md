# 📧 Email Setup Guide - GoDaddy SMTP Integration

## 🎯 Overview
This guide will help you set up real email functionality using your GoDaddy SMTP relay to send patient health summaries.

## 📊 Your Current Status
- **GoDaddy SMTP Relays**: 2/5000 used (0% usage) ✅
- **Server**: 208.109.215.53 (Ubuntu 22.04) ✅
- **Frontend**: Ready with email service ✅
- **Backend**: Needs email endpoint setup

## 🔧 Step 1: Configure GoDaddy Email Settings

### Get Your GoDaddy Email Credentials:
1. **Login to GoDaddy** → Go to your domain management
2. **Find your email account** (e.g., `noreply@yourdomain.com`)
3. **Note down**:
   - Email address: `your-email@yourdomain.com`
   - Email password: `your-email-password`
   - SMTP server: `smtpout.secureserver.net`
   - SMTP port: `465` (SSL)

## 🔧 Step 2: Add Email Endpoint to Django Backend

### Option A: Quick Setup (Recommended)
1. **Copy the code** from `django_email_backend.py`
2. **Add to your Django project**:
   ```python
   # In your Django views.py or create new email_views.py
   # Copy the send_email function from django_email_backend.py
   ```

3. **Update your Django urls.py**:
   ```python
   from django.urls import path
   from . import email_views  # or wherever you put the email function
   
   urlpatterns = [
       # ... your existing URLs
       path('api/send-email/', email_views.send_email, name='send_email'),
   ]
   ```

4. **Update SMTP configuration** in the code:
   ```python
   GODADDY_SMTP_CONFIG = {
       'smtp_server': 'smtpout.secureserver.net',
       'smtp_port': 465,
       'smtp_username': 'your-actual-email@yourdomain.com',  # ← Update this
       'smtp_password': 'your-actual-password',              # ← Update this
       'from_email': 'noreply@yourdomain.com',               # ← Update this
       'from_name': 'Health For All Medical Center'
   }
   ```

### Option B: Django Settings Method
1. **Add to your Django settings.py**:
   ```python
   EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
   EMAIL_HOST = 'smtpout.secureserver.net'
   EMAIL_PORT = 465
   EMAIL_USE_SSL = True
   EMAIL_HOST_USER = 'your-email@yourdomain.com'
   EMAIL_HOST_PASSWORD = 'your-email-password'
   DEFAULT_FROM_EMAIL = 'noreply@yourdomain.com'
   ```

## 🔧 Step 3: Test Email Functionality

### Test the Backend Endpoint:
```bash
curl -X POST https://208.109.215.53:8443/api/send-email/ \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<h1>Test Email</h1><p>This is a test email from Health For All.</p>",
    "text": "Test Email - This is a test email from Health For All."
  }'
```

### Test from Frontend:
1. **Go to Doctor Dashboard**
2. **Select a patient**
3. **Go to Email Summary tab**
4. **Click "Send Email Summary"**
5. **Check console for success/error messages**

## 📧 Email Features

### What Gets Sent:
- **Professional HTML email** with styling
- **Complete health summary**:
  - Vitals (blood pressure, heart rate, temperature, etc.)
  - Clinical examination findings
  - Prescribed medications
  - Laboratory results
  - Medical recommendations
- **Doctor's signature** and contact information
- **Responsive design** for mobile and desktop

### Email Template Includes:
- 🏥 **Header** with medical center branding
- 📊 **Health Summary** section with all vitals
- 🩺 **Clinical Examination** findings
- 💊 **Medications** prescribed
- 🧪 **Laboratory Results**
- 📋 **Recommendations** and next steps
- 📞 **Contact information**
- 🔒 **Confidentiality notice**

## 🚀 Current Status

### ✅ Ready:
- Frontend email service
- Email template with styling
- GoDaddy SMTP configuration
- Error handling and fallbacks

### 🔧 Needs Setup:
- Django backend email endpoint
- GoDaddy email credentials
- SMTP configuration

## 📊 Monitoring

### Track Email Usage:
- **GoDaddy Dashboard**: Monitor SMTP relay usage (currently 2/5000)
- **Email Logs**: Check Django logs for email sending status
- **Patient Feedback**: Monitor if patients receive emails

### Troubleshooting:
1. **Authentication Error**: Check email credentials
2. **Connection Error**: Verify SMTP server settings
3. **Recipient Refused**: Check email address format
4. **Timeout**: Increase timeout settings if needed

## 🎯 Next Steps

1. **Set up Django email endpoint** (5 minutes)
2. **Configure GoDaddy credentials** (2 minutes)
3. **Test email sending** (2 minutes)
4. **Deploy and monitor** (ongoing)

**Total setup time: ~10 minutes**

## 📞 Support

If you need help with the setup:
1. Check Django logs for error messages
2. Verify GoDaddy email settings
3. Test SMTP connection separately
4. Monitor GoDaddy SMTP relay usage

**Your GoDaddy SMTP relay is ready to use with 4998 emails remaining!** 🚀
