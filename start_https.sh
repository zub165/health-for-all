#!/bin/bash

echo "🚀 Starting HTTPS CORS Proxy for Health For All Fair..."

# Navigate to project directory
cd "/Users/zubairmalik/Desktop/Applications/Health For ALL/health-for-all"

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "Please install Python 3 and try again."
    exit 1
fi

# Check if OpenSSL is available
if ! command -v openssl &> /dev/null; then
    echo "❌ OpenSSL is required but not installed."
    echo "Please install OpenSSL and try again."
    exit 1
fi

echo "✅ Python 3 found"
echo "✅ OpenSSL found"
echo ""

# Make the Python script executable
chmod +x run_https.py

echo "🔧 Starting HTTPS CORS Proxy..."
echo "📋 This will:"
echo "   - Create HTTPS proxy on port 8443"
echo "   - Handle CORS requests from GitHub Pages"
echo "   - Proxy to Django backend at 208.109.215.53:3015"
echo "   - Resolve mixed content security issues"
echo ""

# Start the HTTPS proxy
python3 run_https.py
