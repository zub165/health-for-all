#!/bin/bash

echo "🔧 FIXING ALL GRID ISSUES AND DEPLOYING"
echo "========================================"

# Navigate to project directory
cd "/Users/zubairmalik/Desktop/Applications/Health For ALL/health-for-all"

echo "🔧 Fixing all Grid component issues..."

# Fix Grid components in all files
find src -name "*.tsx" -exec sed -i '' 's/<Grid item xs={\([^}]*\)}>/<Box sx={{ gridColumn: "span \1" }}>/g' {} \;
find src -name "*.tsx" -exec sed -i '' 's/<Grid item xs={\([^}]*\)} sm={\([^}]*\)}>/<Box sx={{ gridColumn: { xs: "span \1", sm: "span \2" } }}>/g' {} \;
find src -name "*.tsx" -exec sed -i '' 's/<Grid item xs={\([^}]*\)} md={\([^}]*\)}>/<Box sx={{ gridColumn: { xs: "span \1", md: "span \2" } }}>/g' {} \;
find src -name "*.tsx" -exec sed -i '' 's/<Grid item xs={\([^}]*\)} sm={\([^}]*\)} md={\([^}]*\)}>/<Box sx={{ gridColumn: { xs: "span \1", sm: "span \2", md: "span \3" } }}>/g' {} \;
find src -name "*.tsx" -exec sed -i '' 's/<\/Grid>/<\/Box>/g' {} \;
find src -name "*.tsx" -exec sed -i '' 's/<Grid container spacing={\([^}]*\)}>/<Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: \1 }}>/g' {} \;

echo "✅ Grid components fixed"

echo "🏗️ Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "🔧 Fixing SPA routing..."
    cp build/index.html build/404.html
    echo "✅ SPA routing fixed"
    
    echo "🚀 Deploying to GitHub Pages..."
    npm run deploy
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 DEPLOYMENT SUCCESSFUL!"
        echo "========================="
        echo "🌍 Live at: https://zub165.github.io/health-for-all/"
        echo "⏱️  Wait 2-5 minutes for GitHub Pages to update"
        echo ""
        echo "✅ All Grid issues fixed"
        echo "✅ Application built successfully"
        echo "✅ Deployed to GitHub Pages"
    else
        echo "❌ Deployment failed"
        exit 1
    fi
else
    echo "❌ Build still failed. There may be other issues."
    echo "Please check the error messages above."
    exit 1
fi
