# 🚀 Heroku Deployment Guide for Health For All Fair

## Step 1: Prepare Django Backend

### 1. Create Django Project
```bash
# Create new directory
mkdir health-fair-backend
cd health-fair-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install django djangorestframework django-cors-headers gunicorn psycopg2-binary python-decouple
pip freeze > requirements.txt
```

### 2. Create Heroku Configuration

**Procfile:**
```
web: gunicorn health_fair_backend.wsgi --log-file -
```

**runtime.txt:**
```
python-3.11.0
```

## Step 2: Deploy to Heroku

### 1. Install Heroku CLI
```bash
# Install Heroku CLI from https://devcenter.heroku.com/articles/heroku-cli
```

### 2. Create and Deploy
```bash
# Login to Heroku
heroku login

# Create Heroku app
heroku create your-health-fair-backend

# Add PostgreSQL database
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set DEBUG=False
heroku config:set ALLOWED_HOSTS=your-health-fair-backend.herokuapp.com
heroku config:set CORS_ALLOWED_ORIGINS=https://zub165.github.io

# Deploy
git init
git add .
git commit -m "Initial Django backend"
git push heroku main

# Run migrations
heroku run python manage.py migrate
heroku run python manage.py createsuperuser
```

## Step 3: Configure Email Service

### 1. Set Email Variables
```bash
heroku config:set EMAIL_HOST_USER=your-email@gmail.com
heroku config:set EMAIL_HOST_PASSWORD=your-app-password
heroku config:set EMAIL_HOST=smtp.gmail.com
heroku config:set EMAIL_PORT=587
heroku config:set EMAIL_USE_TLS=True
```

## Step 4: Update React Frontend

### 1. Set Environment Variable
```bash
# In React project root
echo "REACT_APP_BACKEND_URL=https://your-health-fair-backend.herokuapp.com/api" > .env
```

### 2. Redeploy
```bash
npm run build
npm run deploy
```

## Cost: ~$7/month (Heroku hobby plan)
