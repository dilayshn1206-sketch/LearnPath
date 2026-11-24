# Wardrobe correction — revision 4, local Transform validation 2026-11-24

The three-trial Transform exercise reproduced the rabbit's covered pupil and
revealed incorrect red-panda registration. The six panda body frames have distinct
forehead coordinates; prop registration follows separately checked torso shifts.
Thirty panda headwear/costume pairs pass both protected pupil regions. Existing
purchase/preview tests and all-combination bounds/aspect checks also pass. Evidence
and the rejected controls are in outputs/transform-evaluation-20261124. These local
changes are not evidence that a live release completed.

Revision 3: the old species-wide rectangles passed bounds checks but did not prove
that headwear fitted the illustrated skull. Replace them with 42 per-pose forehead
and skull-width landmarks (seven animals × six costume states), plus contact points
on each accessory. Scale uniformly using the actual crop dimensions. The helmet
contact follows the opening above the eyes, rather than the enclosing image box.
Props now use aspect-preserving containment. Shift the unchanged-scale doll down
six percent so tall headbands fit without top clipping. Outfit/body art, earned
coins, prices and saved equipment IDs stay unchanged.

Fresh audit: all 1,512 combinations rendered again, 49 contact sheets, with no
layer outside the avatar. Visually inspected the seven headwear sweeps against
all six outfits and the prop sweeps. Aspect-ratio regression checks now cover
every accessory in every combination. The previous audit remains in audit-v2;
the new evidence is in audit-v3. Bounds checks alone are not a visual fit approval.

Supersedes the earlier held-pose/clothes overlay. Each animal has one complete
anatomy and costume bitmap. A held item never replaces that body or its clothes.

Seven body atlases contain the plain animal and five approved outfits. Seven head
atlases contain only isolated headwear. Sprite normalization removes neighboring
fragments and adds transparent gutters. The panda's displaced costume frames use
the same head/body anchor.

The ten-piece prop atlas has no animal anatomy: five objects and their five strap
variants. Grounded animals carry props by a strap rather than gaining another limb.

Art decodes before a requested look replaces the current preview. The newest Try
request retains the other requested slots; clearing cancels late image requests.
The sticky preview fits between measured top and bottom bars. Classic collection
navigation is removed. IDs, prices, balances and saved equipment are preserved.

Verification: 1,512 distinct combinations plus seven head sweeps, 49 screenshots.
No layer exceeded its avatar bounds and no script/image decode error occurred.
All 15 products were rapidly added on all seven animals in a real local browser.
Preview bounds pass at 1024×768, 1440×667 and 1024×600. Purchase, retry, cancellation,
persistence and full planner workflow checks passed separately.

Prompts, normalization scripts and contact sheets are kept locally in
outputs/coin-magic-review/layer-fix/audit-v2. Prior source/art remain in Git history.
