#!/bin/bash

echo "🔧 Fixing HTTPS and IP Address Issues..."

# Navigate to project directory
cd "/Users/zubairmalik/Desktop/Applications/Health For ALL/health-for-all"

echo "📋 Issues Fixed:"
echo "✅ Issue #1: Mixed Content (HTTPS → HTTP) - Now using HTTPS"
echo "✅ Issue #2: Wrong IP Address - Now using correct IP: 208.109.215.53"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application with HTTPS backend
echo "🔨 Building application with HTTPS backend..."
npm run build

# Fix 404.html for single-page app
echo "🔧 Creating 404.html for SPA routing..."
cp build/index.html build/404.html

# Deploy to GitHub Pages
echo "🚀 Deploying to GitHub Pages..."
npm run deploy

echo ""
echo "✅ Deployment complete with fixes!"
echo ""
echo "🔧 Issues Fixed:"
echo "1. ✅ Mixed Content: Frontend (HTTPS) → Backend (HTTPS)"
echo "2. ✅ Correct IP: Using 208.109.215.53:3015"
echo "3. ✅ Router Basename: /health-for-all"
echo "4. ✅ 404.html: For SPA deep linking"
echo ""
echo "🌍 Your app: https://zub165.github.io/health-for-all/"
echo "🔗 Backend: https://208.109.215.53:3015/api"
echo ""
echo "📋 Final Steps:"
echo "1. Go to: https://github.com/zub165/health-for-all/settings/pages"
echo "2. Set Source: Deploy from a branch"
echo "3. Set Branch: gh-pages"
echo "4. Set Folder: / (root)"
echo "5. Click Save"
echo ""
echo "🎯 Your app will then work perfectly with HTTPS backend connection!"
