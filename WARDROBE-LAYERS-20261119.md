# Wardrobe layer correction — 2026-11-19

A selected outfit, headwear and held item must compose one animal, not multiple full-body poses. The held-item pose owns anatomy whenever an item is equipped. Clothes and headwear use isolated transparent artwork; only the same held pose may be repainted in the foreground to preserve the gripping paws. Explicit body/outfit/foreground/headwear ordering and an 8% safe area are shared by the shop, saved avatar and home.

Seven cutout atlases are indexed by magical-wardrobe-layers.js. Their ten crop rectangles refer to five clothes and five headwear cells, normalized to species-specific fitting boxes. Original generation files and prompts are retained locally in outputs/coin-magic-review/layer-fix.

Verification: 875 outfit/headwear/item combinations retain exactly one anatomy layer and same-pose foreground. Browser checks cover persistence, buying/retrying, all seven rendered samples and 1024 × 768 horizontal overflow. The reported otter cape/Tiny Orbit/lantern case is inspected visually. No account data or coin pricing changes.

