#!/usr/bin/env python3
"""
Simple HTTP server for the AI SEO Calculator
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8080

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def main():
    # Change to the directory containing our files
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Create server
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"🚀 AI SEO Calculator server starting...")
        print(f"📍 Server running at: http://localhost:{PORT}")
        print(f"🌐 Open your browser and navigate to the URL above")
        print(f"⏹️  Press Ctrl+C to stop the server")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print(f"\n🛑 Server stopped.")
            sys.exit(0)

if __name__ == "__main__":
    main()
