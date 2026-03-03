-- params: {{start_block}}, {{end_block}}
SELECT
  {{start_block}} AS start_block,
  {{end_block}} AS end_block,
  ({{end_block}} - {{start_block}} + 1) AS computed_window_size;
