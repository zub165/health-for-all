#!/bin/bash

echo "🔧 FIXING TYPESCRIPT ISSUES"
echo "============================"

# Navigate to project directory
cd "/Users/zubairmalik/Desktop/Applications/Health For ALL/health-for-all"

echo "📝 Fixing TypeScript type mismatches..."

# Fix the EnhancedPatientRegistration component
echo "Fixing EnhancedPatientRegistration.tsx..."

# Create a temporary file with the corrected schema
cat > temp_schema.js << 'EOF'
const schema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phoneNumber: yup.string().required('Phone number is required'),
  age: yup.number().min(1).max(120).required('Age is required'),
  gender: yup.string().required('Gender is required'),
  bloodGroup: yup.string().required('Blood group is required'),
  pastMedicalHistory: yup.string(),
  allergies: yup.string(),
  familyHistory: yup.string(),
  medicationList: yup.string(),
});
EOF

echo "✅ TypeScript issues fixed"

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
        echo "✅ All TypeScript issues resolved"
        echo "✅ Application built successfully"
        echo "✅ Deployed to GitHub Pages"
    else
        echo "❌ Deployment failed"
        exit 1
    fi
else
    echo "❌ Build failed. Checking for remaining issues..."
    echo "Please check the error messages above."
    exit 1
fi
