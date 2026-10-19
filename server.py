#!/usr/bin/env python3
"""
Servidor do Moto Racer 3D.

- Serve os arquivos do jogo (index.html, style.css, game.js)
- API de ranking:  GET /api/scores
                   POST /api/scores {"name": "...", "score": 123, "bike": "Falcon S1", "stage": 3}
- Salva o ranking em scores.json

Uso:  python server.py [porta]      (padrão: 8000)
"""
import json
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Lock

ROOT = os.path.dirname(os.path.abspath(__file__))
SCORES_FILE = os.path.join(ROOT, "scores.json")
MAX_SCORES = 10
lock = Lock()


def load_scores():
    try:
        with open(SCORES_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, list) else []
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def save_scores(scores):
    with open(SCORES_FILE, "w", encoding="utf-8") as f:
        json.dump(scores, f, ensure_ascii=False, indent=2)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def _json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.split("?")[0] == "/api/scores":
            with lock:
                self._json(load_scores())
        else:
            super().do_GET()

    def do_POST(self):
        if self.path.split("?")[0] != "/api/scores":
            self._json({"error": "not found"}, 404)
            return
        try:
            size = int(self.headers.get("Content-Length", 0))
            if size <= 0 or size > 1024:
                raise ValueError("tamanho inválido")
            payload = json.loads(self.rfile.read(size))
            name = str(payload.get("name", "")).strip()[:12] or "Piloto"
            score = max(0, min(int(payload.get("score", 0)), 10_000_000))
            bike = str(payload.get("bike", "")).strip()[:20]
            stage = max(1, min(int(payload.get("stage", 1)), 999))
        except (ValueError, TypeError, AttributeError, json.JSONDecodeError):
            self._json({"error": "dados inválidos"}, 400)
            return

        with lock:
            scores = load_scores()
            scores.append({"name": name, "score": score, "bike": bike, "stage": stage})
            scores.sort(key=lambda s: s.get("score", 0), reverse=True)
            scores = scores[:MAX_SCORES]
            save_scores(scores)
        self._json(scores)

    def log_message(self, fmt, *args):
        if "/api/" in (args[0] if args else ""):
            super().log_message(fmt, *args)


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"Moto Racer 3D rodando em http://localhost:{port}  (Ctrl+C para parar)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor encerrado.")


if __name__ == "__main__":
    main()