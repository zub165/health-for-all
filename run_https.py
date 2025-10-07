#!/usr/bin/env python3
"""
HTTPS CORS Proxy Server for Health For All Fair
This script creates an HTTPS proxy to handle mixed content issues
between GitHub Pages (HTTPS) and Django backend (HTTP)
"""

import http.server
import ssl
import urllib.request
import urllib.parse
import json
from urllib.error import HTTPError, URLError

class CORSProxyHandler(http.server.BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        self.proxy_request()
    
    def do_POST(self):
        """Handle POST requests"""
        self.proxy_request()
    
    def do_PUT(self):
        """Handle PUT requests"""
        self.proxy_request()
    
    def do_DELETE(self):
        """Handle DELETE requests"""
        self.proxy_request()
    
    def send_cors_headers(self):
        """Send CORS headers"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Max-Age', '86400')
    
    def proxy_request(self):
        """Proxy the request to Django backend"""
        try:
            # Extract the path from the request
            path = self.path
            if path.startswith('/api/'):
                # Remove /api prefix and proxy to Django backend
                django_path = path[4:]  # Remove '/api'
            else:
                django_path = path
            
            # Build the Django backend URL
            django_url = f"http://208.109.215.53:3015{django_path}"
            
            # Get request data for POST/PUT requests
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = None
            if content_length > 0:
                post_data = self.rfile.read(content_length)
            
            # Create request to Django backend
            req = urllib.request.Request(
                django_url,
                data=post_data,
                method=self.command,
                headers={
                    'Content-Type': self.headers.get('Content-Type', 'application/json'),
                    'User-Agent': 'Health-For-All-Proxy/1.0'
                }
            )
            
            # Make request to Django backend
            with urllib.request.urlopen(req) as response:
                # Send response back to client
                self.send_response(response.status)
                self.send_cors_headers()
                
                # Copy headers from Django response
                for header, value in response.headers.items():
                    if header.lower() not in ['content-encoding', 'transfer-encoding']:
                        self.send_header(header, value)
                
                self.end_headers()
                
                # Copy response body
                self.wfile.write(response.read())
                
        except HTTPError as e:
            self.send_response(e.code)
            self.send_cors_headers()
            self.end_headers()
            self.wfile.write(f"HTTP Error {e.code}: {e.reason}".encode())
            
        except URLError as e:
            self.send_response(502)
            self.send_cors_headers()
            self.end_headers()
            self.wfile.write(f"Backend Error: {e.reason}".encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_cors_headers()
            self.end_headers()
            self.wfile.write(f"Proxy Error: {str(e)}".encode())

def run_https_proxy(port=8443):
    """Run the HTTPS proxy server"""
    server_address = ('', port)
    httpd = http.server.HTTPServer(server_address, CORSProxyHandler)
    
    # Create SSL context
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    
    # For development, create self-signed certificate
    # In production, use proper SSL certificates
    try:
        context.load_cert_chain('server.crt', 'server.key')
    except FileNotFoundError:
        print("⚠️  SSL certificates not found. Creating self-signed certificates...")
        import subprocess
        subprocess.run([
            'openssl', 'req', '-x509', '-newkey', 'rsa:4096', '-keyout', 'server.key',
            '-out', 'server.crt', '-days', '365', '-nodes', '-subj',
            '/C=US/ST=State/L=City/O=Organization/CN=localhost'
        ], check=True)
        context.load_cert_chain('server.crt', 'server.key')
    
    httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
    
    print(f"🚀 HTTPS CORS Proxy running on https://localhost:{port}")
    print(f"🔗 Proxying requests to: http://208.109.215.53:3015")
    print(f"📱 Your GitHub Pages app can now use: https://localhost:{port}/api/")
    print("Press Ctrl+C to stop")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Proxy server stopped")
        httpd.shutdown()

if __name__ == "__main__":
    run_https_proxy()
