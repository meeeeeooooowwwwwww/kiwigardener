# KG-DIR-09 | 17 source-reviewed GRID gardening businesses into Kiwi native directory

**10 November 2026 NZDT, source-only, not a live site change until merge/native build.**

## Official source chain

GRID owner repository `meeeeeooooowwwwwww/grideater` holds the canonical business master for all categories. Kiwi is a **build-time consumer** and never imports source directly from D1/NZBN/Typesense, never exposes raw contact fields and never pushes revisions upstream without review.

- GRID R2 immutable release [KG-POP-25 physical #42719249362](https://github.com/meeeeeooooowwwwwww/grideater/actions/runs/42719249362) SUCCESS: exact 17 public-approved records, old 15 unchanged, **2 new reviewed gardening services**, zero withdrawals/updates, one nursery supplier retained in Te Puna. SHA `5bb88613586882387bd0cdd8946413e7a27f0b2689a0b7700728f11a16359af0`, 23,443 bytes, release ID `kg-reviewed-two-20261109230520`. Immutable R2 writer disarmed by PR #2587.
- GRID Worker source [PR #2588](https://github.com/meeeeeooooowwwwwww/grideater/pull/2588) merged after full CI; physically activating its 17-record feed is a **separate protected deployment** [PR #2589](https://github.com/meeeeeooooowwwwwww/grideater/pull/2589), with read-only GET/HEAD/privacy canaries and disarm. Native source-ready **MUST HOLD** until that public GRID feed actually serves exact new 17 SHA.
- New Kiwi independent business rows: `afnz-9429038286858` Wai-Ora Forest Landscapes, Christchurch lawn/garden/hedge; `afnz-9429047194632` Precision Tree Services, Auckland tree and hedge; neither are supplier premises. The pre-existing 15 including Grower Direct BOP's **Te Puna shop-only** record are fully retained.

## Native promotion and proof

This source-only PR adds `scripts/verify-live-seventeen-gardeners.mjs`, the isolated offline fixture/negative tests `scripts/check-live-seventeen-gardeners.mjs`, and `.github/workflows/seventeen-approved-gardeners-live-proof.yml`:
1. Exact 17 ID/format/category/byte/SHA from the **current anonymous GRID EATER public feed**, not merely R2 source artifact. Source-ready PR job fails closed until GRID serves new SHA. Zero direct D1/R2 administration.
2. Consumer's current `src/gardener-directory.mjs` and `build.mjs` already accept up to 200 reviewed v1 records and build 1 directory card and 1 profile per source row plus same-origin static JSON search and exact sitemap. No duplicate Kiwi master, no visitor-time GRID API.
3. Upon native Kiwi main merge, Cloudflare native Workers Builds publishes site. The source job alone does **not** deploy. A separate read-only live job verifies exact **17 cards, 17 distinct public profiles, 17 sitemap business URLs**, status JSON, preserved Te Puna nursery premises without claiming nursery contractor coverage, published local evidence, original provisional NZBN city explicitly labelled not confirmed, Dallas Timpson's independent Christchurch contact routes unchanged, and no raw Wordworth private phone/email/street or unknown feed fields.
4. After native live receipt, update SOW/roadmap and return to 50-ID pipeline. Five first-party sites not confirmed in official NZBN remain HOLD for *independent website* verification rather than fake identity; phone/email Turnstile reveal on Kiwi still separately gated by exact Cloudflare server verification, never a static public JSON export.

**Cost:** source-only change creates zero production requests. Existing Kiwi build makes one bounded public GRID feed GET; after deployment, read-only native acceptance performs 22 public GETs (one GRID source, hub, 17 profiles, status, sitemap, contact). **D1 reads/writes 0/0**, no query/index/EQP, no R2 writes, new paid service, cron/AI job, account cache change, contact leakage or cross-site GRID Worker deployment from Kiwi.
