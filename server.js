const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const HOST = '0.0.0.0';
const ROOT_DIR = __dirname;
const DATA_FILE = path.join(ROOT_DIR, 'shop-data.json');

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon'
  };
  return map[ext] || 'application/octet-stream';
}

function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) return { products: [], sales: [], theme: 'dark', updatedAt: 0 };
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      products: Array.isArray(parsed.products) ? parsed.products : [],
      sales: Array.isArray(parsed.sales) ? parsed.sales : [],
      theme: parsed.theme || 'dark',
      updatedAt: parsed.updatedAt || 0
    };
  } catch (error) {
    return { products: [], sales: [], theme: 'dark', updatedAt: 0 };
  }
}

function writeData(payload) {
  const safePayload = {
    products: Array.isArray(payload.products) ? payload.products : [],
    sales: Array.isArray(payload.sales) ? payload.sales : [],
    theme: payload.theme || 'dark',
    updatedAt: payload.updatedAt || Date.now()
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(safePayload, null, 2));
  return safePayload;
}

function serveFile(res, filePath) {
  if (!filePath.startsWith(ROOT_DIR)) {
    sendJson(res, 403, { error: 'Forbidden' });
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        sendJson(res, 404, { error: 'Not found' });
      } else {
        sendJson(res, 500, { error: 'Server error' });
      }
      return;
    }

    res.writeHead(200, { 'Content-Type': getMimeType(filePath) });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');

  if (req.method === 'GET' && url.pathname === '/api/data') {
    sendJson(res, 200, readData());
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/data') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const saved = writeData(parsed);
        sendJson(res, 200, saved);
      } catch (error) {
        sendJson(res, 400, { error: 'Invalid JSON' });
      }
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  let requestPath = decodeURIComponent(url.pathname);
  if (requestPath === '/') requestPath = '/index.html';

  const fullPath = path.join(ROOT_DIR, requestPath);
  if (!fullPath.startsWith(ROOT_DIR)) {
    sendJson(res, 403, { error: 'Forbidden' });
    return;
  }

  if (!fs.existsSync(fullPath)) {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }

  serveFile(res, fullPath);
});

server.listen(PORT, HOST, () => {
  console.log(`Shop sales server listening on http://localhost:${PORT}`);
  console.log(`Open http://<your-laptop-ip>:${PORT} to use it from your phone.`);
});
