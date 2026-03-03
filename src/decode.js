const TRANSFER = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const APPROVAL = '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925';

function addr(topic) {
  if (typeof topic !== 'string' || topic.length < 66) return null;
  return `0x${topic.slice(26)}`;
}

export function decodeLog(log) {
  const topic0 = log?.topics?.[0]?.toLowerCase();
  if (topic0 === TRANSFER) {
    return { type: 'ERC20_TRANSFER', from: addr(log.topics?.[1]), to: addr(log.topics?.[2]), value: String(BigInt(log.data || '0x0')) };
  }
  if (topic0 === APPROVAL) {
    return { type: 'ERC20_APPROVAL', owner: addr(log.topics?.[1]), spender: addr(log.topics?.[2]), value: String(BigInt(log.data || '0x0')) };
  }
  return { type: 'UNKNOWN', raw: log };
}
