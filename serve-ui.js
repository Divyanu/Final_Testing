/**
 * Static server for index.html — binds to 127.0.0.1 so localhost works reliably.
 * PORT: optional. Default 8765. Use PORT=0 for a random free port.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = __dirname;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

const DEFAULT_PORT = 8765;

function parsePort() {
  const raw = process.env.PORT;
  if (raw === undefined || raw === '') return DEFAULT_PORT;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_PORT;
}

function safeJoin(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const rel = decoded === '/' ? 'index.html' : path.posix.normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, '');
  const full = path.join(ROOT, rel);
  if (!full.startsWith(ROOT)) return null;
  return full;
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405);
    res.end();
    return;
  }
  const full = safeJoin(req.url || '/');
  if (!full) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  fs.stat(full, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(full).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    fs.createReadStream(full).pipe(res);
  });
});

const PORT = parsePort();
const HOST = '127.0.0.1';

server.listen(PORT, HOST, () => {
  const addr = server.address();
  const p = typeof addr === 'object' && addr ? addr.port : PORT;
  const url = 'http://127.0.0.1:' + p + '/';
  console.log('');
  console.log('  TrackLab UI is running.');
  console.log('  Open: ' + url);
  console.log('');
  console.log('  IMPORTANT: Leave this terminal window open while you test.');
  console.log('  If you press Ctrl+C, the server stops and the page will not load.');
  console.log('');
  if (process.platform === 'darwin') {
    console.log('  Optional — open Chrome from Terminal:');
    console.log('    open -a "Google Chrome" "' + url + '"');
    console.log('');
  }

  if (process.env.OPEN_IN_CHROME === '1' || process.env.OPEN_IN_CHROME === 'true') {
    if (process.platform === 'darwin') {
      spawn('open', ['-a', 'Google Chrome', url], {
        stdio: 'ignore',
        detached: true,
      }).unref();
      console.log('  Opened Google Chrome with the URL above.');
    } else if (process.platform === 'win32') {
      spawn('cmd', ['/c', 'start', 'chrome', url], { stdio: 'ignore', detached: true }).unref();
      console.log('  Opened Chrome with the URL above.');
    } else {
      console.log('  Open this URL in Chrome: ' + url);
    }
  }
});

process.on('SIGINT', () => {
  console.log('\n  Server stopped. Run `npm run ui` again to view the page.\n');
  process.exit(0);
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error('');
    console.error('  Port ' + PORT + ' is already in use.');
    console.error('  Try another port, e.g.: PORT=8766 npm run ui');
    console.error('  Or pick a random free port: PORT=0 npm run ui');
    console.error('  On macOS you can see what is using the port: lsof -nP -iTCP:' + PORT + ' | grep LISTEN');
    console.error('');
  } else {
    console.error(e.message || e);
  }
  process.exit(1);
});
