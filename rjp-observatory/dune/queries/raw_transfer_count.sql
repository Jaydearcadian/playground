-- params: {{token}}, {{start_block}}, {{end_block}}
SELECT COUNT(*) AS raw_transfer_count
FROM base.logs
WHERE contract_address = lower('{{token}}')
  AND topic0 = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
  AND block_number BETWEEN {{start_block}} AND {{end_block}};
