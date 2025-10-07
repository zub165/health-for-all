# Django Email Backend for GoDaddy SMTP Integration
# Add this to your Django backend to handle email sending

import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# GoDaddy SMTP Configuration
GODADDY_SMTP_CONFIG = {
    'smtp_server': 'smtpout.secureserver.net',  # GoDaddy SMTP server
    'smtp_port': 465,  # SSL port
    'smtp_username': 'your-email@yourdomain.com',  # Replace with your GoDaddy email
    'smtp_password': 'your-email-password',  # Replace with your email password
    'from_email': 'noreply@yourdomain.com',  # Replace with your domain
    'from_name': 'Health For All Medical Center'
}

@csrf_exempt
@require_http_methods(["POST"])
def send_email(request):
    """
    Django view to send emails via GoDaddy SMTP
    """
    try:
        # Parse request data
        data = json.loads(request.body)
        
        to_email = data.get('to')
        subject = data.get('subject')
        html_content = data.get('html')
        text_content = data.get('text')
        from_email = data.get('from', GODADDY_SMTP_CONFIG['from_email'])
        
        if not all([to_email, subject, html_content]):
            return JsonResponse({
                'success': False,
                'message': 'Missing required fields: to, subject, html'
            }, status=400)
        
        # Create email message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{GODADDY_SMTP_CONFIG['from_name']} <{from_email}>"
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
    """
    Send email via GoDaddy SMTP server
    """
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

# Add this to your Django urls.py:
# path('api/send-email/', send_email, name='send_email'),

# Alternative: If you want to use Django's built-in email system
from django.core.mail import send_mail
from django.conf import settings

def send_email_django_way(request):
    """
    Alternative implementation using Django's built-in email system
    """
    try:
        data = json.loads(request.body)
        
        to_email = data.get('to')
        subject = data.get('subject')
        html_content = data.get('html')
        text_content = data.get('text')
        
        # Configure Django email settings in settings.py:
        # EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
        # EMAIL_HOST = 'smtpout.secureserver.net'
        # EMAIL_PORT = 465
        # EMAIL_USE_SSL = True
        # EMAIL_HOST_USER = 'your-email@yourdomain.com'
        # EMAIL_HOST_PASSWORD = 'your-email-password'
        # DEFAULT_FROM_EMAIL = 'noreply@yourdomain.com'
        
        send_mail(
            subject=subject,
            message=text_content or html_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[to_email],
            html_message=html_content,
            fail_silently=False,
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Email sent successfully via Django'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Email sending failed: {str(e)}'
        }, status=500)

# Instructions for setup:
"""
1. Replace the SMTP configuration with your GoDaddy email details:
   - smtp_username: Your GoDaddy email address
   - smtp_password: Your email password
   - from_email: Your domain email address

2. Add this to your Django urls.py:
   path('api/send-email/', send_email, name='send_email'),

3. Make sure your GoDaddy email is properly configured and has SMTP access enabled.

4. Test the email functionality by sending a test email first.

5. Monitor your GoDaddy SMTP relay usage (you have 2/5000 used, so plenty of capacity).
"""
