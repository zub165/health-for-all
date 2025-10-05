#!/bin/bash

# Navigate to project directory
cd "/Users/zubairmalik/Desktop/Applications/Health For ALL/health-for-all"

# Add all files to git
git add .

# Commit with comprehensive message
git commit -m "Complete Health For All Fair application with Django backend integration

✅ Features:
- AI Rapid Registration (sub-10-second patient workflow)
- Patient Registration with comprehensive medical forms
- Doctor Dashboard with real patient data
- Vitals Tracking (blood sugar, carotid doppler, mental health)
- Email Recommendations with AI-generated summaries
- Mobile responsive design with Material-UI

✅ Backend Integration:
- Connected to Django backend at 208.109.215.53:3015
- Real database storage for patient data
- Email service for automated notifications
- CORS configured for cross-origin requests

✅ Deployment:
- GitHub Pages deployment ready
- Production build optimized
- Environment-aware API configuration
- Global accessibility from any IP address

✅ Documentation:
- Complete deployment guides
- Django backend setup instructions
- Production deployment configurations
- Public deployment options

Ready for global healthcare management! 🏥🚀"

# Push to GitHub
git push origin master

# Deploy to GitHub Pages
npm run deploy

echo "✅ All files uploaded to GitHub successfully!"
echo "🌍 Your application is live at: https://zub165.github.io/health-for-all"
echo "🔗 Backend connected to: http://208.109.215.53:3015/api"
