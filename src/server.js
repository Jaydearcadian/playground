import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, join, normalize } from 'path';
import { runObservatory } from './observatory.js';
import { computeManifestHash } from './canonical.js';
import { computeMerkleRoot, verifyProof } from './merkle.js';
import { assertHex32, assertProofPayload, normalizeLeafHashes } from './schema.js';
import { decodeLog } from './decode.js';
import { deriveFeatures } from './features.js';
import { generateTopics, validateTopics } from './topics.js';

const publicDir = new URL('../public', import.meta.url).pathname;

function json(res, code, data) {
  res.writeHead(code, { 'content-type': 'application/json' });
  res.end(JSON.stringify(data));
}

async function parseBody(req) {
  let body = '';
  for await (const chunk of req) body += chunk;
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    throw new Error('Invalid JSON');
  }
}

async function serveStatic(pathname, res) {
  const reqPath = pathname === '/' ? '/index.html' : pathname;
  const file = normalize(join(publicDir, reqPath));
  if (!file.startsWith(normalize(publicDir))) return false;
  const mime = {
    '.html': 'text/html',
    '.json': 'application/json',
    '.js': 'application/javascript',
    '.css': 'text/css',
  }[extname(file)] || 'text/plain';
  try {
    const data = await readFile(file);
    res.writeHead(200, { 'content-type': mime });
    res.end(data);
    return true;
  } catch {
    return false;
  }
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (req.method === 'GET' && url.pathname === '/health') return json(res, 200, { ok: true });

    if (req.method === 'POST' && url.pathname === '/observatory/run') {
      const payload = await parseBody(req);
      return json(res, 200, await runObservatory(payload));
    }

    if (req.method === 'POST' && url.pathname === '/observatory/verify-manifest') {
      const body = await parseBody(req);
      const manifest = body.manifest || body;
      const computed_manifest_hash = computeManifestHash(manifest);
      const expected = body.manifest_hash || manifest.manifest_hash;
      if (expected) assertHex32(expected, 'manifest_hash');
      return json(res, 200, { is_valid: expected ? expected.toLowerCase() === computed_manifest_hash.toLowerCase() : true, computed_manifest_hash });
    }

    if (req.method === 'POST' && url.pathname === '/observatory/verify-root') {
      const body = await parseBody(req);
      const leafHashes = normalizeLeafHashes(body.leaf_hashes || []);
      const computed_evidence_root = computeMerkleRoot(leafHashes);
      if (body.evidence_root) assertHex32(body.evidence_root, 'evidence_root');
      return json(res, 200, { is_valid: body.evidence_root ? body.evidence_root.toLowerCase() === computed_evidence_root.toLowerCase() : true, computed_evidence_root });
    }

    if (req.method === 'POST' && url.pathname === '/observatory/verify-proof') {
      const body = await parseBody(req);
      assertProofPayload(body);
      return json(res, 200, verifyProof(body.leaf_hash, body.path, body.root));
    }

    if (req.method === 'POST' && url.pathname === '/topics/generate') return json(res, 200, generateTopics(await parseBody(req)));
    if (req.method === 'POST' && url.pathname === '/topics/validate') return json(res, 200, validateTopics(await parseBody(req)));
    if (req.method === 'POST' && url.pathname === '/logs/decode') {
      const body = await parseBody(req);
      return json(res, 200, { decoded: (body.logs || []).map(decodeLog) });
    }
    if (req.method === 'POST' && url.pathname === '/features/derive') return json(res, 200, { features: deriveFeatures(await parseBody(req)) });

    if (req.method === 'GET' && await serveStatic(url.pathname, res)) return;

    res.writeHead(404); res.end('Not found');
  } catch (e) {
    return json(res, 400, { error: e.message });
  }
}).listen(Number(process.env.PORT || 3000), () => console.log(`listening on ${process.env.PORT || 3000}`));
