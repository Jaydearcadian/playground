# Windowing and Chunking

- `latest = eth_blockNumber`
- `end = latest - finality_depth`
- `start = end - window_size + 1`
- initial chunk size 100 blocks
- fallback chunk size 50 for failing chunk
