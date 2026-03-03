-- params: {{token}}, {{start_block}}, {{end_block}}
SELECT
  COUNT_IF(topic1 IS NULL OR topic2 IS NULL) AS missing_indexed_topics,
  COUNT_IF(length(data) < 66) AS short_data_fields
FROM base.logs
WHERE contract_address = lower('{{token}}')
  AND topic0 = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
  AND block_number BETWEEN {{start_block}} AND {{end_block}};
