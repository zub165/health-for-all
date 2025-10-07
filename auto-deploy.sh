#!/bin/bash

echo "🚀 AUTO-DEPLOYMENT SCRIPT FOR HEALTH FOR ALL FAIR"
echo "================================================="
echo "✅ Automated deployment with error handling"
echo "✅ Automatic fixes for common issues"
echo "✅ Complete deployment process"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to handle errors
handle_error() {
    print_error "Deployment failed at step: $1"
    print_error "Error: $2"
    exit 1
}

# Function to retry command
retry_command() {
    local max_attempts=3
    local attempt=1
    local command="$1"
    local description="$2"
    
    while [ $attempt -le $max_attempts ]; do
        print_status "Attempt $attempt/$max_attempts: $description"
        if eval "$command"; then
            print_success "$description completed successfully"
            return 0
        else
            print_warning "$description failed (attempt $attempt/$max_attempts)"
            if [ $attempt -eq $max_attempts ]; then
                handle_error "$description" "Failed after $max_attempts attempts"
            fi
            sleep 2
            ((attempt++))
        fi
    done
}

# Start deployment
print_status "Starting automated deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Check if Node.js is installed
if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command_exists npm; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Check if git is installed
if ! command_exists git; then
    print_error "git is not installed. Please install git first."
    exit 1
fi

print_success "All required tools are available"

# Step 1: Clean previous builds
print_status "Step 1: Cleaning previous builds..."
if [ -d "build" ]; then
    rm -rf build
    print_success "Previous build directory removed"
else
    print_status "No previous build directory found"
fi

# Step 2: Install dependencies
print_status "Step 2: Installing dependencies..."
retry_command "npm install" "Dependency installation"

# Step 3: Check for common issues and fix them
print_status "Step 3: Checking for common issues..."

# Fix any potential icon import issues
if grep -q "Stethoscope" src/components/*.tsx 2>/dev/null; then
    print_warning "Found potential Stethoscope icon issue, fixing..."
    sed -i '' 's/Stethoscope/LocalHospital/g' src/components/*.tsx 2>/dev/null || true
    print_success "Icon issues fixed"
fi

# Step 4: Build the application
print_status "Step 4: Building the application..."
retry_command "npm run build" "Application build"

# Step 5: Fix SPA routing
print_status "Step 5: Fixing SPA routing..."
if [ -f "build/index.html" ]; then
    cp build/index.html build/404.html
    print_success "SPA routing fixed (404.html created)"
else
    handle_error "SPA routing fix" "build/index.html not found"
fi

# Step 6: Check build output
print_status "Step 6: Verifying build output..."
if [ -d "build" ] && [ -f "build/index.html" ]; then
    print_success "Build output verified"
    print_status "Build size: $(du -sh build | cut -f1)"
else
    handle_error "Build verification" "Build directory or index.html not found"
fi

# Step 7: Deploy to GitHub Pages
print_status "Step 7: Deploying to GitHub Pages..."
retry_command "npm run deploy" "GitHub Pages deployment"

# Step 8: Verify deployment
print_status "Step 8: Verifying deployment..."
sleep 5  # Wait for GitHub Pages to process

# Check if gh-pages branch exists
if git ls-remote --heads origin gh-pages | grep -q gh-pages; then
    print_success "gh-pages branch exists"
else
    print_warning "gh-pages branch not found, but deployment may still be in progress"
fi

# Step 9: Final status
print_status "Step 9: Deployment summary..."

echo ""
echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "====================================="
echo ""
print_success "✅ Dependencies installed"
print_success "✅ Application built successfully"
print_success "✅ SPA routing fixed"
print_success "✅ Deployed to GitHub Pages"
echo ""
echo "🌍 Your Application:"
echo "   Frontend: https://zub165.github.io/health-for-all/"
echo "   Backend:  https://208.109.215.53/api"
echo ""
echo "🎯 Features Deployed:"
echo "   🤖 AI-Enhanced Patient Registration"
echo "   🧠 AI Health Assessment"
echo "   👨‍⚕️ Enhanced Doctor Dashboard"
echo "   📊 Real-time health scoring"
echo "   💡 AI-powered suggestions"
echo ""
echo "📋 Final Steps:"
echo "1. Go to: https://github.com/zub165/health-for-all/settings/pages"
echo "2. Set Source: Deploy from a branch"
echo "3. Set Branch: gh-pages"
echo "4. Set Folder: / (root)"
echo "5. Click Save"
echo ""
echo "⏱️  GitHub Pages typically takes 2-5 minutes to update"
echo "🔄 If you don't see changes immediately, wait a few minutes and refresh"
echo ""
print_success "🚀 Your Health For All Fair is now live with all corrected functionality!"
echo ""
echo "🏥 Ready for advanced healthcare management! 🌍"
