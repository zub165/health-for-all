#!/bin/bash

echo "🚀 Fixing Health For All Fair Deployment..."

# Navigate to project directory
cd "/Users/zubairmalik/Desktop/Applications/Health For ALL/health-for-all"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Fix 404.html for single-page app
echo "🔧 Creating 404.html for SPA routing..."
cp build/index.html build/404.html

# Deploy to GitHub Pages
echo "🚀 Deploying to GitHub Pages..."
npm run deploy

echo "✅ Deployment complete!"
echo "🌍 Your app should be live at: https://zub165.github.io/health-for-all/"
echo ""
echo "📋 Next steps:"
echo "1. Go to: https://github.com/zub165/health-for-all/settings/pages"
echo "2. Set Source: Deploy from a branch"
echo "3. Set Branch: gh-pages"
echo "4. Set Folder: / (root)"
echo "5. Click Save"
echo ""
echo "🎯 Your app will then be fully functional with Django backend connection!"
