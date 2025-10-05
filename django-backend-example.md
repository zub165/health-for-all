# Django Backend API Structure

This document outlines the expected Django backend API structure for the Health for All Fair application.

## Required Models

### Patient Model
```python
from django.db import models

class Patient(models.Model):
    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20)
    blood_group = models.CharField(max_length=5)
    past_medical_history = models.TextField()
    allergies = models.TextField()
    family_history = models.TextField()
    medication_list = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### Vitals Model
```python
class Vitals(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    blood_sugar = models.FloatField()
    carotid_doppler = models.CharField(max_length=100)
    mental_health_score = models.IntegerField()
    mental_health_answers = models.JSONField()  # Store PHQ-9 answers
    recorded_by = models.CharField(max_length=200)
    recorded_at = models.DateTimeField(auto_now_add=True)
```

### Doctor Model
```python
class Doctor(models.Model):
    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    specialization = models.CharField(max_length=100)
```

### Recommendation Model
```python
class Recommendation(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE)
    recommendations = models.TextField()
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

## Required API Endpoints

### Patients API
- `POST /api/patients/` - Create new patient
- `GET /api/patients/` - List all patients
- `GET /api/patients/{id}/` - Get patient by ID
- `PUT /api/patients/{id}/` - Update patient
- `DELETE /api/patients/{id}/` - Delete patient

### Vitals API
- `POST /api/vitals/` - Record new vitals
- `GET /api/vitals/` - List all vitals
- `GET /api/vitals/patient/{patient_id}/` - Get vitals for specific patient

### Doctors API
- `POST /api/doctors/` - Create new doctor
- `GET /api/doctors/` - List all doctors

### Recommendations API
- `POST /api/recommendations/` - Create new recommendation
- `POST /api/recommendations/{id}/send-email/` - Send recommendation via email

## Django Settings

### CORS Configuration
```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://yourusername.github.io",
]

CORS_ALLOW_CREDENTIALS = True
```

### Email Configuration
```python
# settings.py
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@gmail.com'
EMAIL_HOST_PASSWORD = 'your-app-password'
```

## Sample Serializers

### Patient Serializer
```python
from rest_framework import serializers

class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = '__all__'
```

### Vitals Serializer
```python
class VitalsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vitals
        fields = '__all__'
```

## Sample Views

### Patient ViewSet
```python
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
```

### Vitals ViewSet
```python
class VitalsViewSet(viewsets.ModelViewSet):
    queryset = Vitals.objects.all()
    serializer_class = VitalsSerializer
    
    @action(detail=False, methods=['get'])
    def patient(self, request, patient_id=None):
        vitals = self.queryset.filter(patient_id=patient_id)
        serializer = self.get_serializer(vitals, many=True)
        return Response(serializer.data)
```

## URL Configuration

```python
# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PatientViewSet, VitalsViewSet, DoctorViewSet, RecommendationViewSet

router = DefaultRouter()
router.register(r'patients', PatientViewSet)
router.register(r'vitals', VitalsViewSet)
router.register(r'doctors', DoctorViewSet)
router.register(r'recommendations', RecommendationViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]
```

## Installation Commands

```bash
# Create Django project
django-admin startproject health_fair_backend
cd health_fair_backend

# Create app
python manage.py startapp api

# Install required packages
pip install djangorestframework django-cors-headers

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run server
python manage.py runserver 3015
```

This backend structure will support all the functionality required by the React frontend application.
