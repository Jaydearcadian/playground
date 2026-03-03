# Determinism Rules

- Leaf ordering keys:
  1) block_number
  2) tx_index
  3) log_index
  4) leaf_type_code
  5) tx_hash
- Leaf hash = keccak256(serialized leaf)
- Internal node = keccak256(left || right)
- Odd-node levels duplicate the last node
- Empty-tree root = keccak256(empty bytes)
