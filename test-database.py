#!/usr/bin/env python3
"""
Database Connection Test for Health For All Fair
Tests both HTTP (Port 3015) and HTTPS (Port 3016) endpoints
"""

import requests
import json
import sys
from urllib3.exceptions import InsecureRequestWarning

# Disable SSL warnings for testing
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

def test_endpoint(url, name):
    """Test a specific endpoint"""
    print(f"\n🔍 Testing {name}: {url}")
    try:
        response = requests.get(url, verify=False, timeout=10)
        print(f"✅ Status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"✅ Response: {json.dumps(data, indent=2)}")
                return True
            except json.JSONDecodeError:
                print(f"⚠️  Response is not JSON: {response.text[:200]}...")
                return False
        else:
            print(f"❌ Error: {response.text[:200]}...")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ Connection failed: Cannot connect to {url}")
        return False
    except requests.exceptions.Timeout:
        print(f"❌ Timeout: Request to {url} timed out")
        return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def main():
    print("🏥 Health For All Fair - Database Connection Test")
    print("=" * 60)
    
    # Test endpoints
    endpoints = [
        ("https://208.109.215.53:3016/api/health/", "HTTPS Health Check (Port 3016)"),
        ("https://208.109.215.53:3016/api/hospitals/", "HTTPS Hospitals API (Port 3016)"),
        ("http://208.109.215.53:3015/api/health/", "HTTP Health Check (Port 3015)"),
        ("http://208.109.215.53:3015/api/hospitals/", "HTTP Hospitals API (Port 3015)"),
    ]
    
    results = []
    
    for url, name in endpoints:
        success = test_endpoint(url, name)
        results.append((name, success))
    
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS SUMMARY:")
    print("=" * 60)
    
    for name, success in results:
        status = "✅ WORKING" if success else "❌ FAILED"
        print(f"{status}: {name}")
    
    # Overall assessment
    working_count = sum(1 for _, success in results if success)
    total_count = len(results)
    
    print(f"\n🎯 Overall Status: {working_count}/{total_count} endpoints working")
    
    if working_count > 0:
        print("✅ Database is accessible!")
        if working_count >= 2:
            print("✅ Both HTTP and HTTPS servers are working!")
        print("\n🚀 Your Health For All Fair application should work!")
    else:
        print("❌ Database connection issues detected!")
        print("🔧 Please check your Django server status")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()
