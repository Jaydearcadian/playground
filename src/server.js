import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, join, normalize } from 'path';
import { runObservatory } from './observatory.js';
import { computeManifestHash } from './canonical.js';
import { computeMerkleRoot, verifyProof } from './merkle.js';
import { generateTopics, validateTopics } from './topics.js';
import { decodeLog } from './decode.js';
import { deriveFeatures } from './features.js';
import { assertHex32, assertProofPayload, normalizeLeafHashes } from './schema.js';

const publicDir = new URL('../public', import.meta.url).pathname;

function sendJson(res, code, payload) {
  res.writeHead(code, { 'content-type': 'application/json' });
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  let body = '';
  for await (const chunk of req) body += chunk;
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    throw new Error('Invalid JSON body');
  }
}

async function serveStatic(pathname, res) {
  const filePath = pathname === '/' ? '/index.html' : pathname;
  const full = normalize(join(publicDir, filePath));
  if (!full.startsWith(normalize(publicDir))) return false;
  const ext = extname(full);
  const mime = ext === '.html' ? 'text/html' : ext === '.json' ? 'application/json' : 'text/plain';
  try {
    const data = await readFile(full);
    res.writeHead(200, { 'content-type': mime });
    res.end(data);
    return true;
  } catch {
    return false;
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (req.method === 'GET' && url.pathname === '/health') {
      return sendJson(res, 200, { ok: true, service: 'rjp-observatory-bundle-inspector' });
    }

    if (req.method === 'POST' && url.pathname === '/observatory/run') {
      return sendJson(res, 200, await runObservatory(await readBody(req)));
    }

    if (req.method === 'POST' && url.pathname === '/observatory/verify-manifest') {
      const body = await readBody(req);
      const manifest = body.manifest || body;
      const computed_manifest_hash = computeManifestHash(manifest);
      const expected = body.manifest_hash || manifest.manifest_hash;
      if (expected) assertHex32(expected, 'manifest_hash');
      return sendJson(res, 200, {
        is_valid: expected ? computed_manifest_hash.toLowerCase() === expected.toLowerCase() : true,
        computed_manifest_hash,
      });
    }

    if (req.method === 'POST' && url.pathname === '/observatory/verify-root') {
      const body = await readBody(req);
      const hashes = normalizeLeafHashes(body.leaf_hashes || []);
      const computed_evidence_root = computeMerkleRoot(hashes);
      if (body.evidence_root) assertHex32(body.evidence_root, 'evidence_root');
      return sendJson(res, 200, {
        is_valid: body.evidence_root ? computed_evidence_root.toLowerCase() === body.evidence_root.toLowerCase() : true,
        computed_evidence_root,
      });
    }

    if (req.method === 'POST' && url.pathname === '/observatory/verify-proof') {
      const body = await readBody(req);
      assertProofPayload(body);
      return sendJson(res, 200, verifyProof(body.leaf_hash, body.path || [], body.root));
    }

    if (req.method === 'POST' && url.pathname === '/topics/generate') return sendJson(res, 200, generateTopics(await readBody(req)));
    if (req.method === 'POST' && url.pathname === '/topics/validate') return sendJson(res, 200, validateTopics(await readBody(req)));
    if (req.method === 'POST' && url.pathname === '/logs/decode') {
      const body = await readBody(req);
      return sendJson(res, 200, { decoded: (body.logs || []).map(decodeLog) });
    }
    if (req.method === 'POST' && url.pathname === '/features/derive') {
      const body = await readBody(req);
      return sendJson(res, 200, { features: deriveFeatures(body || { evidence_items: [] }) });
    }

    if (req.method === 'GET' && await serveStatic(url.pathname, res)) return;
    res.writeHead(404); res.end('Not found');
  } catch (error) {
    return sendJson(res, 400, { error: error.message });
  }
});

const port = Number(process.env.PORT || 3000);
server.listen(port, () => console.log(`listening on ${port}`));
