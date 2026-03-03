import { createServer } from 'node:http';
import { readFileSync, existsSync, createReadStream } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT || 4173);
const publicDir = resolve(process.cwd(), 'apps/bundle-inspector-web/public');

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

function safePath(urlPath) {
  const clean = urlPath.split('?')[0].replace(/\.{2,}/g, '');
  return clean === '/' ? '/index.html' : clean;
}

createServer((req, res) => {
  const relPath = safePath(req.url || '/');
  const filePath = join(publicDir, relPath);

  if (!filePath.startsWith(publicDir) || !existsSync(filePath)) {
    res.writeHead(404, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: false, error: 'not_found', path: relPath }));
    return;
  }

  const ext = extname(filePath);
  res.writeHead(200, { 'content-type': contentTypes[ext] || 'application/octet-stream' });
  createReadStream(filePath).pipe(res);
}).listen(PORT, HOST, () => {
  const banner = readFileSync(join(publicDir, 'index.html'), 'utf8').match(/<title>(.*?)<\/title>/i)?.[1] || 'bundle-inspector-web';
  console.log(`[bundle-inspector-web] ${banner} listening on http://${HOST}:${PORT}`);
});
