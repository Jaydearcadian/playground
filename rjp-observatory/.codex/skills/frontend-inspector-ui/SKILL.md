---
name: frontend-inspector-ui
description: Use for inspector dashboard UX including manifest/evidence/leaf/proof tabs, Merkle visualizer, debug console, and downloadable artifacts.
---

# Frontend Inspector UI

Use this skill for app-level inspector behavior and presentation.

## Responsibilities
- Manifest/Evidence/Leaf/Proof tabbed inspection.
- Merkle visualizer and proof console.
- Debug + raw workbench panels.
- Bundle artifact export controls.

## Workflow
1. Ensure run state feedback is explicit (status + progress).
2. Keep all inspector tabs renderable from same bundle state.
3. Expose verification actions near relevant data.
4. Keep mobile layout functional.

## References
- `references/tab-contracts.md`
- `references/ui-quality-gates.md`
