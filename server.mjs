import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./dist', import.meta.url)));
const apiUrl = process.env.VITE_API_URL?.trim();
const port = Number(process.env.PORT || 3000);

if (!apiUrl) {
  throw new Error('Set VITE_API_URL to the public HTTPS API URL.');
}

const api = new URL(apiUrl);
if (!['http:', 'https:'].includes(api.protocol) || api.username || api.password) {
  throw new Error('VITE_API_URL must be an HTTP(S) URL without credentials.');
}

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be a valid TCP port number.');
}

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
]);

const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end();
    return;
  }

  if (pathname === '/_runtime-config.js') {
    const config = JSON.stringify({ apiUrl: api.toString().replace(/\/+$/, '') })
      .replaceAll('<', '\\u003c');
    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/javascript; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(`window.__APP_CONFIG__ = Object.freeze(${config});`);
    return;
  }

  const requestedPath = resolve(root, `.${pathname}`);
  const pathFromRoot = relative(root, requestedPath);
  if (pathFromRoot === '..' || pathFromRoot.startsWith(`..${sep}`) || pathFromRoot.startsWith(sep)) {
    response.writeHead(404).end();
    return;
  }

  let filePath = requestedPath;
  try {
    const fileInfo = await stat(filePath);
    if (fileInfo.isDirectory()) filePath = resolve(filePath, 'index.html');
    await stat(filePath);
  } catch {
    if (extname(pathname)) {
      response.writeHead(404).end();
      return;
    }
    filePath = resolve(root, 'index.html');
  }

  response.writeHead(200, {
    'Cache-Control': pathFromRoot.startsWith(`assets${sep}`)
      ? 'public, max-age=31536000, immutable'
      : 'no-cache',
    'Content-Type': contentTypes.get(extname(filePath)) || 'application/octet-stream',
    'X-Content-Type-Options': 'nosniff',
  });

  if (request.method === 'HEAD') {
    response.end();
    return;
  }

  createReadStream(filePath)
    .on('error', (error) => {
      console.error('Failed to read static asset.', error);
      if (!response.headersSent) response.writeHead(500);
      response.end();
    })
    .pipe(response);
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Frontend listening on port ${port}.`);
});
