> **CLOSED AS PHYSICALLY LIVE | 10 NOVEMBER 2026 NZDT:** [Kiwi native run #42748171794](https://github.com/meeeeeooooowwwwwww/kiwigardener/actions/runs/42748171794) **SUCCESS** after independently verified live [GRID 21 public #42747039217](https://github.com/meeeeeooooowwwwwww/grideater/actions/runs/42747039217) and GRID [post-disarm #42748090440](https://github.com/meeeeeooooowwwwwww/grideater/actions/runs/42748090440). Exact native **21 cards / 21 profiles / 21 sitemap entries** on `kiwigardeners.com`, 17 prior approved unchanged, four added (two services and two suppliers); [Kiwi build #42748171808](https://github.com/meeeeeooooowwwwwww/kiwigardener/actions/runs/42748171808) SUCCESS. Old staging instructions below are kept as historical release procedure, not current pending gates. Provisional Waiheke, Twin Falls plant delivery without walk-in, Greenlife public Ōtaki shop, prior Te Puna nursery and independent Dallas contact all verified. Zero direct D1 writes and no private phone/email leak. New candidate work resumes through GRID's [fresh 50 private review #42748999787](https://github.com/meeeeeooooowwwwwww/grideater/actions/runs/42748999787), with 21 live excluded and **0 unreviewed approvals**. Native protected contact reveal/automatic approved-digest/sharding remain future scope.

# KG-DIR-10 | Native Kiwi directory acceptance for 21 GRID EATER reviewed gardening businesses

**Source-only preparation and do-not-merge gate below were satisfied before the verified live release; retained as historical procedure.**

## Source authority and current staged release

- GRID is the **single canonical business master** for all categories. Kiwi is a build-time, read-only consumer of the exact approved public gardening v1 export, not a second database.
- Verified [GRID protected 21-record source preview #42742178541](https://github.com/meeeeeooooowwwwwww/grideater/actions/runs/42742178541): **17 existing unchanged + 4 source-reviewed additions**, two gardening services and two gardening suppliers, 0 updates/withdrawals; 21 public GRID search/profile pairs checked; 5 indexed production D1 queries/16 metered read rows, 0 written; private source artifact 28,646 bytes SHA256 `3fb0f4a06e79390068f1dda6eb59e0b2d5361a4a82e5b697fa4188bb75dcb98c`.
- Verified [21 immutable R2 #42743669367](https://github.com/meeeeeooooowwwwwww/grideater/actions/runs/42743669367): independent remote exact-byte readback with same SHA, release `kg-reviewed-four-20261110022228`. Its one-use writer disarmed [#2601](https://github.com/meeeeeooooowwwwwww/grideater/pull/2601).
- GRID public-source [PR #2602](https://github.com/meeeeeooooowwwwwww/grideater/pull/2602) source merged after all CI PASS. **This alone is not live**: a separately authorised [protected Worker deploy PR #2603](https://github.com/meeeeeooooowwwwwww/grideater/pull/2603) must physically succeed and exact GET/HEAD/404/405/21-ID SHA public proof must pass before Kiwi can promote this source.
- Previous 17 [native proof #42727775238](https://github.com/meeeeeooooowwwwwww/kiwigardener/actions/runs/42727775238) is the last independently verified Kiwi live checkpoint until the new native verification succeeds.

## New four and strict presentation

1. **Untangled Landscapes Ltd**, `afnz-9429032462685`: gardening service; public source-stated Auckland activities, not unverified region-wide contractor territory.
2. **The Greenspace Landscape Company Limited**, `afnz-9429032218886`: gardening service; `Waiheke Island` is **`basis:nzbn_registered_locality`**, shown as a *provisional registered location*, explicitly not confirmed service coverage.
3. **Twin Falls Nursery**, `afnz-9429048751926`: **gardening supplier**; `New Zealand` denotes verified **plant delivery**, NOT on-site contracting. The private nursery land is not a public walk-in garden centre. No shop/premises location exported.
4. **Greenlife Perennials / The Perennial Garden**, `afnz-9429031205924`: **gardening supplier** with verified public Ōtaki nursery-shop town, no invented nationwide delivery coverage.

One previously reviewed **Te Puna** supplier is retained. Expected 21 total = **18 gardening services + 3 gardening suppliers**, including new suppliers. All 17 old records remain unchanged and Dallas Timpson's own Christchurch enquiry panel remains separate.

## Source-only native acceptance implementation

- Add `scripts/verify-live-twentyone-gardeners.mjs`: exact **21 ID, 28,646 byte, SHA256**, release, immutable privacy/category/area rules; fetch public GRID approved feed once and Kiwi 21 individual native profiles, hub, build-status JSON, sitemap, contact. Require **21 cards, 21 distinct canonical public profiles and 21 sitemap profile URLs** plus user-facing correct service/supplier/locality messages. Reject raw protected phone, email and street leakage.
- Add `scripts/check-live-twentyone-gardeners.mjs`: synthetic unit-fixture and negative controls for incorrect counts, source SHA/release, supplier/contractor conflation, provisional labels, visitor-contact leakage, Dallas separation, incomplete sitemap, status mismatch.
- Add `.github/workflows/twentyone-approved-gardeners-live-proof.yml`: offline tests, PR **source-ready** gate demanding *actual* GRID 21 public HTTP bytes/SHA, and protected Kiwi main read-only live proof after **Kiwi-owned Cloudflare Workers Builds** deployment. The workflow never deploys GRID or Kiwi itself.
- Existing `build.mjs` already reads exactly one public GRID feed at build time and generates directory cards/profiles plus native search/sitemap without a second business DB. No change to its data ownership or protected-contact handling is required for source scale from 17 to 21.

## Cost, privacy and completion definition

Source-only tests: **0 direct D1 reads/writes, 0 R2 writes, 0 Worker/Kiwi deploy**, no paid Cloudflare features/account cache change. Native production build: one bounded approved GRID public feed GET, no visitor-time GRID/D1 calls. Native public acceptance: **26 anonymous GETs** (1 GRID feed, hub, 21 profiles, status, sitemap, contact), 0 D1 access, 0 writes. v1 stays below 200 records and 512KB.

**Publish only after:** GRID exact public 21 proof PASS, Kiwi source-ready PR PASS, native Kiwi main/Cloudflare build actually deployed, live 21 cards/profiles/sitemap/keyword+town search safety and supplier semantics PASS, with Dallas own contact and all protected business phone/email absent. Update [KG-DIR-06 roadmap](KG-DIR-06-CANONICAL-FEED-AND-RELEASE-ROADMAP.md) and GRID tracker [#2222](https://github.com/meeeeeooooowwwwwww/grideater/issues/2222) with physically verified receipts, and keep NZBN-P0 #2314 separate.

**Next after 21-live:** scale GRID EATER gardening discovery and source-graded website/location mapping to larger reviewed batches, then publish via the same generic category-neutral feed path. Avoid auto-approving the other 46 private 50-cohort leads or treating official NZBN PBD missing website as evidence the website is false.
