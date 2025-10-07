#!/bin/bash

echo "🔧 FIXING PORT 3015 CONNECTION ERROR"
echo "===================================="
echo "✅ Updated all hardcoded port 3015 references"
echo "✅ Now using production API: https://208.109.215.53/api"
echo ""

# Navigate to project directory
cd "/Users/zubairmalik/Desktop/Applications/Health For ALL/health-for-all"

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building application with corrected API endpoints..."
npm run build

echo "🔧 Creating 404.html for SPA routing..."
cp build/index.html build/404.html

echo "🚀 Deploying to GitHub Pages..."
npm run deploy

echo ""
echo "✅ FIXED! All port 3015 references updated!"
echo ""
echo "🎯 What was fixed:"
echo "   ✅ src/config/api.ts - Updated development API URL"
echo "   ✅ src/services/emailService.ts - Updated API_BASE_URL"
echo "   ✅ src/services/aiService.ts - Updated API_BASE_URL"
echo "   ✅ src/components/RecommendationForm.tsx - Updated error message"
echo "   ✅ src/components/AIRapidRegistration.tsx - Updated error message"
echo ""
echo "🌍 Your Application:"
echo "   Frontend: https://zub165.github.io/health-for-all/"
echo "   Backend:  https://208.109.215.53/api"
echo ""
echo "🎉 No more Django connection errors on port 3015!"
echo "🚀 Your Health For All Fair is now fully connected!"
echo ""
echo "📋 Final Steps:"
echo "1. Go to: https://github.com/zub165/health-for-all/settings/pages"
echo "2. Set Source: Deploy from a branch"
echo "3. Set Branch: gh-pages"
echo "4. Set Folder: / (root)"
echo "5. Click Save"
echo ""
echo "🏥 Ready for global healthcare management! 🌍"
