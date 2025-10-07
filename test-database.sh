#!/bin/bash

echo "🏥 Health For All Fair - Database Connection Test"
echo "=============================================="

# Install required Python packages
echo "📦 Installing required packages..."
pip install requests urllib3

# Run the database test
echo "🔍 Testing database connections..."
python test-database.py

echo ""
echo "🎯 Quick Manual Tests:"
echo "1. HTTPS (Port 3016): https://208.109.215.53:3016/api/health/"
echo "2. HTTP (Port 3015):  http://208.109.215.53:3015/api/health/"
echo ""
echo "💡 If you see JSON responses, your database is working!"
echo "💡 If you see HTML error pages, there might be connection issues."
