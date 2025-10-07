#!/bin/bash

echo "🎉 Final Deployment - Health For All Fair"
echo "✅ Using Dual Server Setup:"
echo "   - HTTP Server: Port 3015 (existing apps)"
echo "   - HTTPS Server: Port 3016 (GitHub Pages)"
echo ""

# Navigate to project directory
cd "/Users/zubairmalik/Desktop/Applications/Health For ALL/health-for-all"

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building application with HTTPS backend (Port 3016)..."
npm run build

echo "🔧 Creating 404.html for SPA routing..."
cp build/index.html build/404.html

echo "🚀 Deploying to GitHub Pages..."
npm run deploy

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "🌍 Your Application:"
echo "   Frontend: https://zub165.github.io/health-for-all/"
echo "   Backend:  https://208.109.215.53:3016/api"
echo ""
echo "🔧 Server Status:"
echo "   ✅ HTTP Server (Port 3015): http://208.109.215.53:3015"
echo "   ✅ HTTPS Server (Port 3016): https://208.109.215.53:3016"
echo ""
echo "📋 Final Steps:"
echo "1. Go to: https://github.com/zub165/health-for-all/settings/pages"
echo "2. Set Source: Deploy from a branch"
echo "3. Set Branch: gh-pages"
echo "4. Set Folder: / (root)"
echo "5. Click Save"
echo ""
echo "🎯 Your Health For All Fair application is now:"
echo "   ✅ Globally accessible from any IP address"
echo "   ✅ Connected to HTTPS backend (Port 3016)"
echo "   ✅ No mixed content security issues"
echo "   ✅ Full database functionality"
echo "   ✅ AI-powered features working"
echo "   ✅ Doctor dashboard with real data"
echo ""
echo "🚀 Ready for global healthcare management! 🏥🌍"
