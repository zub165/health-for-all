# 🏥 Django Email Setup for Health For All

## 🎯 Current Status
- **Django Backend**: ✅ Running on `http://208.109.215.53:3015`
- **Hospital Data**: ✅ 195 hospitals available
- **API Health**: ✅ `/api/health/` responding
- **GoDaddy SMTP**: ✅ 4998/5000 relays available
- **Email Endpoint**: ❌ Needs to be added

## 🔧 Quick Setup (5 minutes)

### Step 1: Add Email View to Django

Create or update your Django views file (e.g., `views.py` or `email_views.py`):

```python
import json
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import logging

logger = logging.getLogger(__name__)

# GoDaddy SMTP Configuration
GODADDY_SMTP_CONFIG = {
    'smtp_server': 'smtpout.secureserver.net',
    'smtp_port': 465,
    'smtp_username': 'your-email@yourdomain.com',  # ← Update this
    'smtp_password': 'your-email-password',        # ← Update this
    'from_email': 'noreply@yourdomain.com',        # ← Update this
    'from_name': 'Health For All Medical Center'
}

@csrf_exempt
@require_http_methods(["POST"])
def send_email(request):
    """Send emails via GoDaddy SMTP"""
    try:
        data = json.loads(request.body)
        
        to_email = data.get('to')
        subject = data.get('subject')
        html_content = data.get('html')
        text_content = data.get('text')
        
        if not all([to_email, subject, html_content]):
            return JsonResponse({
                'success': False,
                'message': 'Missing required fields: to, subject, html'
            }, status=400)
        
        # Create email message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{GODADDY_SMTP_CONFIG['from_name']} <{GODADDY_SMTP_CONFIG['from_email']}>"
        msg['To'] = to_email
        
        # Add text and HTML parts
        if text_content:
            text_part = MIMEText(text_content, 'plain')
            msg.attach(text_part)
        
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        # Send email via GoDaddy SMTP
        success = send_smtp_email(to_email, msg)
        
        if success:
            logger.info(f"Email sent successfully to {to_email}")
            return JsonResponse({
                'success': True,
                'message': 'Email sent successfully',
                'emailId': f"email_{hash(to_email + subject)}"
            })
        else:
            return JsonResponse({
                'success': False,
                'message': 'Failed to send email via SMTP'
            }, status=500)
            
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        logger.error(f"Email sending error: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Email sending failed: {str(e)}'
        }, status=500)

def send_smtp_email(to_email, message):
    """Send email via GoDaddy SMTP server"""
    try:
        # Create SSL context
        context = ssl.create_default_context()
        
        # Connect to GoDaddy SMTP server
        with smtplib.SMTP_SSL(
            GODADDY_SMTP_CONFIG['smtp_server'], 
            GODADDY_SMTP_CONFIG['smtp_port'], 
            context=context
        ) as server:
            # Login to SMTP server
            server.login(
                GODADDY_SMTP_CONFIG['smtp_username'], 
                GODADDY_SMTP_CONFIG['smtp_password']
            )
            
            # Send email
            server.send_message(message)
            
        return True
        
    except smtplib.SMTPAuthenticationError:
        logger.error("SMTP Authentication failed - check username/password")
        return False
    except smtplib.SMTPRecipientsRefused:
        logger.error(f"Recipient refused: {to_email}")
        return False
    except smtplib.SMTPServerDisconnected:
        logger.error("SMTP server disconnected")
        return False
    except Exception as e:
        logger.error(f"SMTP error: {str(e)}")
        return False
```

### Step 2: Add URL Route

In your Django `urls.py` file, add:

```python
from django.urls import path
from . import views  # or email_views

urlpatterns = [
    # ... your existing URLs
    path('api/send-email/', views.send_email, name='send_email'),
]
```

### Step 3: Update GoDaddy Credentials

Replace these values in the code above:
- `your-email@yourdomain.com` → Your actual GoDaddy email
- `your-email-password` → Your email password
- `noreply@yourdomain.com` → Your domain email

### Step 4: Test the Endpoint

```bash
curl -X POST http://208.109.215.53:3015/api/send-email/ \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<h1>Test Email</h1><p>This is a test email from Health For All.</p>",
    "text": "Test Email - This is a test email from Health For All."
  }'
```

## 🎯 Expected Response

**Success:**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "emailId": "email_123456789"
}
```

**Error:**
```json
{
  "success": false,
  "message": "Missing required fields: to, subject, html"
}
```

## 🚀 After Setup

Once the endpoint is added:

1. **Frontend will automatically use real email sending**
2. **GoDaddy SMTP will handle all email delivery**
3. **Professional HTML emails will be sent to patients**
4. **Email tracking and logging will be available**

## 📊 GoDaddy SMTP Status

- **Available Relays**: 4998/5000 (99.96% available)
- **SMTP Server**: smtpout.secureserver.net
- **Port**: 465 (SSL)
- **Status**: Ready for production use

## 🔧 Troubleshooting

1. **Authentication Error**: Check email credentials
2. **Connection Error**: Verify SMTP server settings
3. **Recipient Refused**: Check email address format
4. **Timeout**: Increase timeout settings if needed

**Your Django backend is ready - just add the email endpoint!** 🚀
