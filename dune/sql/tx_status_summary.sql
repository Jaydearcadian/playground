-- params: {{start_block}}, {{end_block}}
SELECT tx_success, COUNT(*) AS tx_count
FROM base.transactions
WHERE block_number BETWEEN {{start_block}} AND {{end_block}}
GROUP BY 1
ORDER BY 2 DESC;
