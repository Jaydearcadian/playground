-- params: {{token}}, {{start_block}}, {{end_block}}
SELECT
  COUNT_IF(topic1 IS NULL OR topic2 IS NULL) AS missing_indexed_topics,
  COUNT_IF(length(data) < 66) AS short_data_fields
FROM base.logs
WHERE contract_address = lower('{{token}}')
  AND topic0 = '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925'
  AND block_number BETWEEN {{start_block}} AND {{end_block}};
