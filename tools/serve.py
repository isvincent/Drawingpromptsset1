from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler
from socketserver import ThreadingTCPServer
import argparse

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description='靈感畫室本機伺服器')
parser.add_argument('--port', type=int, default=8765)
args = parser.parse_args()
class LocalServer(ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True
handler = partial(SimpleHTTPRequestHandler, directory=str(root))
with LocalServer(('127.0.0.1', args.port), handler) as server:
    print(f'http://127.0.0.1:{args.port}/', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
