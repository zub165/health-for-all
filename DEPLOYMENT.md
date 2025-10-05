# Deployment Guide - Health for All Fair

## Quick Start

### 1. Local Development
```bash
cd health-for-all
npm install
npm start
```
The app will run at `http://localhost:3000`

### 2. Django Backend Setup
1. Set up your Django server on port 3015
2. Use the provided `django-backend-example.md` as a reference
3. Ensure CORS is configured for `http://localhost:3000`

### 3. GitHub Deployment

#### Step 1: Create GitHub Repository
1. Go to GitHub and create a new repository named `health-for-all`
2. Copy the repository URL

#### Step 2: Update Configuration
1. Edit `package.json` and update the homepage URL:
```json
"homepage": "https://YOUR_USERNAME.github.io/health-for-all"
```

2. Update the API URL in `src/services/api.ts` for production:
```typescript
const API_BASE_URL = 'https://your-backend-domain.com/api';
```

#### Step 3: Deploy to GitHub Pages
```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit"

# Add your GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/health-for-all.git

# Push to GitHub
git push -u origin main

# Deploy to GitHub Pages
npm run deploy
```

#### Step 4: Configure GitHub Pages
1. Go to your repository settings
2. Navigate to "Pages" section
3. Select "gh-pages" branch as source
4. Your app will be available at `https://YOUR_USERNAME.github.io/health-for-all`

## Features Overview

### ✅ Completed Features
- **Patient Registration**: Complete form with medical history, allergies, family history
- **Doctor Dashboard**: Patient management, search, and vitals recording
- **Vitals Tracking**: Blood sugar, carotid doppler, mental health screening (PHQ-9)
- **Email Recommendations**: Automated email delivery system
- **Modern UI**: Material-UI with responsive design
- **TypeScript**: Full type safety
- **Form Validation**: Comprehensive validation with Yup
- **API Integration**: Ready for Django backend on port 3015

### 🔧 Backend Requirements
Your Django server should provide these endpoints:
- `POST /api/patients/` - Create patient
- `GET /api/patients/` - List patients
- `POST /api/vitals/` - Record vitals
- `GET /api/vitals/patient/{id}/` - Get patient vitals
- `POST /api/recommendations/` - Create recommendations
- `POST /api/recommendations/{id}/send-email/` - Send email

## Usage Workflow

### For Patients:
1. Visit the application
2. Click "Patient Registration"
3. Fill out comprehensive medical form
4. Submit registration
5. Proceed to doctor for screening

### For Doctors:
1. Click "Doctor Login"
2. Enter credentials (demo mode)
3. Access dashboard to:
   - View all patients
   - Record vitals and screenings
   - Generate recommendations
   - Send emails to patients

## Customization

### Styling
- Modify `src/App.tsx` theme configuration
- Update colors, fonts, and spacing as needed

### API Configuration
- Update `src/services/api.ts` for different backend URLs
- Modify request/response handling as needed

### Form Fields
- Add/remove fields in `src/components/PatientRegistration.tsx`
- Update validation schema accordingly

## Troubleshooting

### Common Issues:
1. **CORS Errors**: Ensure Django CORS is configured for your domain
2. **API Connection**: Verify Django server is running on port 3015
3. **Build Errors**: Run `npm install` to ensure all dependencies are installed
4. **Deployment Issues**: Check GitHub Pages settings and repository permissions

### Support:
- Check browser console for errors
- Verify network requests in developer tools
- Ensure all environment variables are set correctly

## Security Notes

- Patient data should be handled securely
- Use HTTPS in production
- Implement proper authentication for doctors
- Consider data encryption for sensitive information

## Next Steps

1. Set up your Django backend using the provided example
2. Configure email service for recommendations
3. Test the complete workflow
4. Deploy to GitHub Pages
5. Share with your health fair team

The application is now ready for your Health for All Fair! 🏥✨
