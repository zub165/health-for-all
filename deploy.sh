#!/bin/bash

# Build the application
npm run build

# Create gh-pages branch if it doesn't exist
git checkout -b gh-pages 2>/dev/null || git checkout gh-pages

# Remove all files except .git
git rm -rf .

# Copy build files
cp -r build/* .

# Add all files
git add .

# Commit
git commit -m "Deploy Health For All React application"

# Push to gh-pages branch
git push origin gh-pages

# Go back to master
git checkout master

echo "Deployment complete! Check https://zub165.github.io/health-for-all"
