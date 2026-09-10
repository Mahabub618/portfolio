// Serves the production build (dist/frontend/browser) and proxies /api and /uploads
// to the Spring Boot backend on :8080. Dependency-free. Used for local preview + verification.
import { createServer } from 'node:http';
import { request as httpRequest } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const PORT = Number(process.env.PORT || 4200);
const ROOT = new URL('./dist/frontend/browser/', import.meta.url).pathname;
const API_TARGET = { host: '127.0.0.1', port: Number(process.env.API_PORT || 8080) };

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function proxy(req, res) {
  const upstream = httpRequest(
    { host: API_TARGET.host, port: API_TARGET.port, method: req.method, path: req.url, headers: req.headers },
    (up) => {
      res.writeHead(up.statusCode || 502, up.headers);
      up.pipe(res);
    },
  );
  upstream.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end('{"data":null,"error":{"code":"UPSTREAM","message":"backend unavailable"}}');
  });
  req.pipe(upstream);
}

async function sendFile(res, filePath) {
  try {
    const s = await stat(filePath);
    if (s.isDirectory()) throw new Error('dir');
    const body = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    // SPA fallback
    const index = await readFile(join(ROOT, 'index.html'));
    res.writeHead(200, { 'Content-Type': MIME['.html'] });
    res.end(index);
  }
}

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) {
    return proxy(req, res);
  }
  const safe = normalize(url.pathname).replace(/^(\.\.[/\\])+/, '');
  sendFile(res, join(ROOT, safe));
});

server.listen(PORT, '0.0.0.0', () => console.log(`serving ${ROOT} on :${PORT}, /api → :${API_TARGET.port}`));
