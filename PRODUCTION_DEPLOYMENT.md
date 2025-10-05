# 🚀 Production Deployment Guide - Health For All Fair

This guide covers deploying your AI-powered Health For All Fair application with full Django backend integration.

## 🎯 Deployment Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │  Django Backend │    │   Database      │
│  (GitHub Pages) │◄──►│  (Cloud Host)   │◄──►│  (Cloud DB)     │
│                 │    │                 │    │                 │
│ • AI Features   │    │ • API Endpoints │    │ • Patient Data  │
│ • UI/UX         │    │ • Email Service │    │ • Vitals        │
│ • Demo Mode     │    │ • AI Processing │    │ • Recommendations│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

- ✅ Django backend deployed and running
- ✅ Database configured and migrated
- ✅ Email service configured
- ✅ CORS settings updated for production domain

## 🔧 Step 1: Deploy Django Backend

### Option A: Heroku Deployment

```bash
# Install Heroku CLI
# Create new Heroku app
heroku create your-health-fair-backend

# Set environment variables
heroku config:set DEBUG=False
heroku config:set ALLOWED_HOSTS=your-health-fair-backend.herokuapp.com
heroku config:set EMAIL_HOST_USER=your-email@gmail.com
heroku config:set EMAIL_HOST_PASSWORD=your-app-password

# Deploy
git push heroku main
heroku run python manage.py migrate
heroku run python manage.py createsuperuser
```

### Option B: Railway Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Option C: DigitalOcean App Platform

1. Connect your Django repository
2. Configure build settings
3. Set environment variables
4. Deploy

## 🔧 Step 2: Configure React Frontend

### 1. Update Environment Configuration

Create `.env` file in your React project root:

```bash
# Copy the example file
cp env.example .env

# Edit .env with your backend URL
REACT_APP_BACKEND_URL=https://your-health-fair-backend.herokuapp.com/api
```

### 2. Update package.json Homepage

```json
{
  "homepage": "https://yourusername.github.io/health-for-all"
}
```

### 3. Build and Deploy

```bash
# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## 🌐 Step 3: Configure CORS

Update your Django settings to allow your GitHub Pages domain:

```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://yourusername.github.io",  # Add your GitHub Pages URL
]

# For production, you might also want:
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False  # Security: only allow specific origins
```

## 📧 Step 4: Configure Email Service

### Gmail SMTP Configuration

```python
# settings.py
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@gmail.com'
EMAIL_HOST_PASSWORD = 'your-app-password'  # Use App Password, not regular password
DEFAULT_FROM_EMAIL = 'your-email@gmail.com'
```

### Create Gmail App Password

1. Enable 2-Factor Authentication on Gmail
2. Go to Google Account Settings
3. Security → App passwords
4. Generate app password for "Mail"
5. Use this password in Django settings

## 🗄️ Step 5: Database Configuration

### Option A: PostgreSQL (Recommended for Production)

```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST'),
        'PORT': os.environ.get('DB_PORT'),
    }
}
```

### Option B: SQLite (For Simple Deployments)

```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

## 🔒 Step 6: Security Configuration

### Production Settings

```python
# settings.py
DEBUG = False
ALLOWED_HOSTS = ['your-backend-domain.com', 'your-backend.herokuapp.com']

# Security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# HTTPS settings (if using HTTPS)
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

## 🧪 Step 7: Testing Production Deployment

### 1. Test API Endpoints

```bash
# Test patient creation
curl -X POST https://your-backend.herokuapp.com/api/patients/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Patient",
    "email": "test@example.com",
    "phone_number": "123-456-7890",
    "age": 30,
    "gender": "Other",
    "blood_group": "O+",
    "past_medical_history": "None",
    "allergies": "None",
    "family_history": "None",
    "medication_list": "None"
  }'
```

### 2. Test Email Functionality

```bash
# Test email sending
curl -X POST https://your-backend.herokuapp.com/api/email/send/ \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<h1>Test</h1>",
    "text": "Test"
  }'
```

### 3. Test React Frontend

1. Visit your GitHub Pages URL
2. Try AI Rapid Registration
3. Check browser console for errors
4. Verify data is being saved to backend

## 📊 Step 8: Monitoring and Maintenance

### Health Checks

```python
# Create health check endpoint
# views.py
from django.http import JsonResponse
from django.db import connection

def health_check(request):
    try:
        # Test database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        return JsonResponse({
            'status': 'healthy',
            'database': 'connected',
            'timestamp': timezone.now().isoformat()
        })
    except Exception as e:
        return JsonResponse({
            'status': 'unhealthy',
            'error': str(e)
        }, status=500)
```

### Logging Configuration

```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'health_fair.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
```

## 🚀 Step 9: Final Deployment Checklist

### Django Backend
- [ ] Backend deployed and accessible
- [ ] Database migrated and seeded
- [ ] Email service configured and tested
- [ ] CORS settings updated for production domain
- [ ] Environment variables set
- [ ] Health check endpoint working
- [ ] Admin panel accessible

### React Frontend
- [ ] Environment variables configured
- [ ] Homepage URL updated in package.json
- [ ] Application built successfully
- [ ] Deployed to GitHub Pages
- [ ] All features working in production
- [ ] Mobile responsiveness verified

### Integration Testing
- [ ] AI Rapid Registration saves to backend
- [ ] Patient data persists in database
- [ ] Email summaries are sent successfully
- [ ] Doctor dashboard shows real data
- [ ] Vitals tracking works end-to-end
- [ ] Recommendations are generated and stored

## 🎉 Success!

Your AI-powered Health For All Fair application is now fully deployed with:

- ✅ **React Frontend** on GitHub Pages
- ✅ **Django Backend** on cloud platform
- ✅ **Database** with persistent storage
- ✅ **Email Service** for automated communications
- ✅ **AI Features** working in production
- ✅ **Full Integration** between frontend and backend

## 🔧 Troubleshooting

### Common Issues:

1. **CORS Errors**
   - Check CORS_ALLOWED_ORIGINS includes your GitHub Pages URL
   - Verify backend is accessible from frontend domain

2. **Email Not Sending**
   - Check Gmail app password is correct
   - Verify EMAIL_HOST settings
   - Test SMTP connection

3. **Database Connection Issues**
   - Check database credentials
   - Verify database is accessible from cloud platform
   - Run migrations: `python manage.py migrate`

4. **Build Failures**
   - Check environment variables are set
   - Verify all dependencies are installed
   - Check for TypeScript errors

## 📞 Support

For deployment issues:
1. Check cloud platform logs
2. Verify environment variables
3. Test API endpoints individually
4. Check browser console for frontend errors

Your production-ready Health For All Fair application is now live! 🌍
