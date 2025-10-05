# 🚀 Railway Deployment Guide for Health For All Fair

## Step 1: Prepare Django Backend

### 1. Create Django Project Structure
```bash
# Create new directory for Django backend
mkdir health-fair-backend
cd health-fair-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Django and dependencies
pip install django djangorestframework django-cors-headers gunicorn psycopg2-binary python-decouple
pip freeze > requirements.txt
```

### 2. Create Django Project
```bash
# Create Django project
django-admin startproject health_fair_backend .
python manage.py startapp api

# Create models, views, and URLs as per django-backend-example.md
```

### 3. Create Railway Configuration Files

**Procfile:**
```
web: gunicorn health_fair_backend.wsgi --log-file -
```

**railway.json:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "python manage.py migrate && gunicorn health_fair_backend.wsgi --log-file -",
    "healthcheckPath": "/api/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## Step 2: Deploy to Railway

### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

### 2. Login and Deploy
```bash
# Login to Railway
railway login

# Initialize project
railway init

# Add PostgreSQL database
railway add postgresql

# Set environment variables
railway variables set DEBUG=False
railway variables set ALLOWED_HOSTS=*.railway.app
railway variables set CORS_ALLOWED_ORIGINS=https://zub165.github.io

# Deploy
railway up
```

### 3. Get Your Backend URL
After deployment, Railway will give you a URL like:
`https://your-app-name.railway.app`

## Step 3: Update React Frontend

### 1. Create Environment File
```bash
# In your React project root
echo "REACT_APP_BACKEND_URL=https://your-app-name.railway.app/api" > .env
```

### 2. Update CORS Settings in Django
```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://zub165.github.io",
]

CORS_ALLOW_CREDENTIALS = True
```

### 3. Redeploy React App
```bash
npm run build
npm run deploy
```

## Step 4: Configure Database

### 1. Railway PostgreSQL
Railway automatically provides PostgreSQL. Use these environment variables:
```bash
railway variables set DATABASE_URL=postgresql://user:pass@host:port/dbname
```

### 2. Run Migrations
```bash
railway run python manage.py migrate
railway run python manage.py createsuperuser
```

## Step 5: Configure Email Service

### 1. Set Email Environment Variables
```bash
railway variables set EMAIL_HOST_USER=your-email@gmail.com
railway variables set EMAIL_HOST_PASSWORD=your-app-password
railway variables set EMAIL_HOST=smtp.gmail.com
railway variables set EMAIL_PORT=587
railway variables set EMAIL_USE_TLS=True
```

### 2. Update Django Settings
```python
# settings.py
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD')
```

## Step 6: Test Full System

### 1. Test API Endpoints
```bash
# Test patient creation
curl -X POST https://your-app-name.railway.app/api/patients/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Patient",
    "email": "test@example.com",
    "phone_number": "123-456-7890",
    "age": 30,
    "gender": "Male",
    "blood_group": "O+",
    "past_medical_history": "None",
    "allergies": "None",
    "family_history": "None",
    "medication_list": "None"
  }'
```

### 2. Test React Frontend
Visit: https://zub165.github.io/health-for-all
- Try AI Rapid Registration
- Check if data is saved to database
- Test doctor dashboard
- Verify email functionality

## Step 7: Monitor and Maintain

### 1. Railway Dashboard
- Monitor application logs
- Check database usage
- View deployment status

### 2. Database Management
```bash
# Access database
railway connect postgresql

# Run Django shell
railway run python manage.py shell

# View admin panel
# Visit: https://your-app-name.railway.app/admin/
```

## Troubleshooting

### Common Issues:
1. **CORS Errors**: Check CORS_ALLOWED_ORIGINS includes your GitHub Pages URL
2. **Database Connection**: Verify DATABASE_URL is set correctly
3. **Email Issues**: Check Gmail app password and SMTP settings
4. **Build Failures**: Check Railway logs for deployment errors

### Support:
- Railway Documentation: https://docs.railway.app/
- Railway Discord: https://discord.gg/railway
- Check Railway logs: `railway logs`

## Cost Estimate
- **Railway**: $5/month for hobby plan (includes database)
- **GitHub Pages**: Free
- **Total**: ~$5/month for full external IP access with database

Your application will be accessible from any IP address worldwide with full database functionality!
