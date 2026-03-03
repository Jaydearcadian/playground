export async function executeDuneQuery({ apiKey, queryId, query_parameters = [] }) {
  const res = await fetch(`https://api.dune.com/api/v1/query/${queryId}/execute`, {
    method: 'POST',
    headers: { 'x-dune-api-key': apiKey, 'content-type': 'application/json' },
    body: JSON.stringify({ query_parameters }),
  });
  return res.json();
}

export async function fetchDuneResults({ apiKey, executionId }) {
  const res = await fetch(`https://api.dune.com/api/v1/execution/${executionId}/results`, {
    headers: { 'x-dune-api-key': apiKey },
  });
  return res.json();
}
