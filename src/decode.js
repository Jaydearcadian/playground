function decodeAddress(topic) {
  if (typeof topic !== 'string' || !topic.startsWith('0x') || topic.length < 66) return null;
  return `0x${topic.slice(26)}`;
}

export function decodeLog(log) {
  const topics = Array.isArray(log?.topics) ? log.topics : [];
  const topic0 = topics[0]?.toLowerCase();
  if (topic0 === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef') {
    return {
      type: 'ERC20_TRANSFER',
      from: decodeAddress(topics[1]),
      to: decodeAddress(topics[2]),
      value: String(BigInt(log.data || '0x0')),
    };
  }
  if (topic0 === '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925') {
    return {
      type: 'ERC20_APPROVAL',
      owner: decodeAddress(topics[1]),
      spender: decodeAddress(topics[2]),
      value: String(BigInt(log.data || '0x0')),
    };
  }
  return { type: 'UNKNOWN', raw: log };
}
