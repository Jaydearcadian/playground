const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function toHexBlock(n) {
  return `0x${Number(n).toString(16)}`;
}

export function parseHexInt(hex) {
  return Number.parseInt(hex, 16);
}

export async function rpcRequest(endpoint, method, params, attempt = 0) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
  });

  if (RETRYABLE_STATUS.has(res.status) && attempt < 5) {
    await sleep((2 ** attempt) * 200);
    return rpcRequest(endpoint, method, params, attempt + 1);
  }

  const body = await res.json();
  if (body.error) throw new Error(`${method}: ${body.error.message}`);
  return body.result;
}

export async function rpcWithProviderFallback(endpoints, method, params) {
  let lastErr;
  for (const endpoint of endpoints) {
    try {
      return await rpcRequest(endpoint, method, params);
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(`All providers failed for ${method}: ${lastErr?.message || 'unknown error'}`);
}

export async function getLatestBlock(endpoints) {
  return parseHexInt(await rpcWithProviderFallback(endpoints, 'eth_blockNumber', []));
}

export async function getLogsChunked({ endpoints, address, topic, startBlock, endBlock }) {
  const all = [];
  let cursor = startBlock;
  let chunkSize = 100;

  while (cursor <= endBlock) {
    const chunkEnd = Math.min(cursor + chunkSize - 1, endBlock);
    try {
      const logs = await rpcWithProviderFallback(endpoints, 'eth_getLogs', [{
        address,
        fromBlock: toHexBlock(cursor),
        toBlock: toHexBlock(chunkEnd),
        topics: [topic],
      }]);
      all.push(...logs);
      cursor = chunkEnd + 1;
      chunkSize = 100;
    } catch (e) {
      if (chunkSize > 50) chunkSize = 50;
      else throw e;
    }
  }

  return all;
}
