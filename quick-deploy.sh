#!/bin/bash

echo "🚀 QUICK DEPLOYMENT SCRIPT"
echo "=========================="

# Navigate to project directory
cd "/Users/zubairmalik/Desktop/Applications/Health For ALL/health-for-all"

# Clean and build
echo "📦 Building application..."
rm -rf build
npm install
npm run build

# Fix SPA routing
echo "🔧 Fixing SPA routing..."
cp build/index.html build/404.html

# Deploy
echo "🚀 Deploying to GitHub Pages..."
npm run deploy

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "🌍 Live at: https://zub165.github.io/health-for-all/"
echo "⏱️  Wait 2-5 minutes for GitHub Pages to update"
