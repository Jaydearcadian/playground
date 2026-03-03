# Provider Fallback

Prefer ordered endpoint list:
1. primary RPC
2. secondary RPC
3. tertiary RPC

Fallback trigger:
- repeated transport/API failures
- sustained rate limits

Maintain deterministic behavior by retrying same request parameters before switching.
