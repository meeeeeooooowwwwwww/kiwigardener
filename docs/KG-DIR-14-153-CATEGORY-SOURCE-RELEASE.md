# KG-DIR-14 | Native Kiwi category-specific 153 release
**12 November 2026 NZDT | Source and validation only until GRID EATER physically deploys the new public pin.**

## Canonical source provenance
GRID EATER remains the only canonical master. The existing approved independent gardening directory contains **153 NZBN business identities**, of which 21 have previously source-reviewed business offerings and 132 are approved as **provisional** NZBN/BIC-related gardening discovery leads. There are **no additional business identities** in this release.

The already staged new immutable public GRID EATER R2 snapshot, exact release `kg-category-provisional-20261111045747746`, is **173,880 bytes**, SHA-256 `8b416584f93af81a0b4ce3dac7b114dc4a5cfa05653ef77e09e9e094b598a796`. [Protected category audit #42962549177](https://github.com/meeeeeooooowwwwwww/grideater/actions/runs/42962549177) proved **132/132** current canonical matching industry categories, no holds, six indexed D1 statements, 792 read rows, zero writes. Five groups: 32 general gardeners, 30 lawn care, 32 landscapers, 31 arborists/tree, 7 garden-centre/nursery suppliers. [R2 stage #42963538182](https://github.com/meeeeeooooowwwwwww/grideater/actions/runs/42963538182) independently byte-SHA-verified the new immutable public and new private contact objects, with original 21 reviewed records unchanged and existing five public business phones and 82 Turnstile-only protected business emails preserved. One-time R2 writer re-disarmed via [GRID PR #2674](https://github.com/meeeeeooooowwwwwww/grideater/pull/2674).

Old public source `kg-bulk-provisional-20261110052336535`, SHA `0e186bb362bd025d1b4b728e137b7a4d343e63c88693eeb93d89672146f68a34` (178,914 bytes), stays immutable for rollback.

## Kiwi release contract
The Kiwi-owned `scripts/verify-live-153-gardeners.mjs` now pins the exact new public bytes and verifies current canonical category counts for the existing 132. Each of their five category label types remains **indicative only**. It verifies those labels appear in the actual native `/gardeners/` directory cards and their respective canonical `/gardeners/<slug>/` profile HTML. There is no source-confirmed service, town/delivery area, availability, qualification, website or phone derived from an NZBN classification.

All 153 businesses must remain in one accessible native directory, with 153 unique canonical profiles and 153 matching sitemap entries, the two existing gardening keyword/town autocomplete inputs, Dallas Timpson's own services separate, no contact leak in HTML or static JSON, and exact source-released status. The shared private R2 contact object is keyed by the new source release ID; the public phone endpoint must still expose exactly the same five already-approved numbers and email reveals must remain Turnstile-POST-only, with no public email JSON.

**Release order:**
1. Finish [GRID source PR #2675](https://github.com/meeeeeooooowwwwwww/grideater/pull/2675), physically deploy new Worker via its independent protected one-time request, verify exact public source GET/HEAD/negative status, then disarm Worker request. New public source must be live before Kiwi can build.
2. Merge this Kiwi source/verification PR only after its GitHub CI, including exact public source preflight, passes. Existing Cloudflare Workers Builds for `kiwigardener` (GitHub `main`, `npm run build`, `npx wrangler deploy`) owns native deployment. A GitHub merge alone is **not** a provider deployment receipt.
3. Independently verify the Cloudflare production Worker build and live Kiwi 153 cards, 153 profiles, sitemap, category text, keyword suggestions, exact phone release ID and protected email negatives. If provider build or live check fails, the old verified Kiwi Worker version is the rollback; never open private contact data or create cross-repo deployment authority.

## Cost boundaries
This Kiwi change adds **zero** D1 SQL/reads/writes, zero R2 PUTs, zero database, no new upstream crawler, model, search provider or paid feature. Kiwi fetches the single approved public GRID JSON once **at build time**, never per visitor. Existing Kiwi static directory search remains client-side. The source-only PR requires standard GitHub tests; the independent Kiwi provider build is existing account infrastructure. Preserve old release evidence and tests for regression, not as current live status.
