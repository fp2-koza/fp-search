import os, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))
import http.server, socketserver
port = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
with socketserver.TCPServer(("", port), http.server.SimpleHTTPRequestHandler) as httpd:
    print(f"serving fp-search on {port}")
    httpd.serve_forever()
