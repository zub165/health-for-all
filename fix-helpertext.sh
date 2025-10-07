#!/bin/bash

echo "🔧 Fixing all helperText TypeScript issues..."

# Fix all helperText issues in all component files
find src/components -name "*.tsx" -exec sed -i '' 's/helperText={errors\.\([^}]*\)\.message}/helperText={errors.\1?.message as string}/g' {} \;

echo "✅ All helperText issues fixed!"
echo "🚀 Now building the application..."

npm run build
