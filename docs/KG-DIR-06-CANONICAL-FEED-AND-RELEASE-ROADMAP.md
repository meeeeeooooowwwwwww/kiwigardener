# KG-DIR-06 | Kiwi Gardeners as a specialist consumer of GRID EATER

**Owner outcome and SOW alignment, 9 November 2026 NZDT.** Refer to the [GRID EATER national all-category enrichment / vertical publishing SOW](https://github.com/meeeeeooooowwwwwww/grideater/blob/main/docs/roadmaps/workstreams/NATIONAL_BUSINESS_ENRICHMENT_AND_VERTICAL_PUBLISHING.md). That master SOW governs the platform-wide intent. This file governs Kiwi's independent consumer/release boundary.

## Architectural and editorial requirements

- **ONE editable business master:** GRID EATER owns NZBN identities, every industry category, business source evidence, legal/trading names, source-approved websites, location, owner corrections, canonical Cloudflare D1, Typesense and public profiles. Kiwi and future vertical sites use approved public projections, NOT private duplicate databases or independent classifiers/crawlers.
- **ONE Kiwi directory:** gardening service and supplier results share the /gardeners/ keyword and NZ town/city typeahead. A nursery/garden centre is not assumed to do gardening contracts. Dallas Timpson's independent Christchurch service and contact routing remain separately presented, without suggesting he serves the nationwide third-party directory's territories.
- **Never autopublish a provisional category:** GRID first must independently show actual business category in public search/profile; then Kiwi requires a separate services/supplies/editorial, provenance, category and public website/contact review. A registered-office city/town is a labelled provisional clue, NOT verified works/delivers/serves or an approved street-level public location. Owner corrections override assumptions; never leak private email/phone/street.
- **Native consumer ownership:** GRID EATER produces reviewed, versioned, immutable public-only feed (R2/Worker), while Kiwi's own GitHub main, Cloudflare Workers Builds and the existing kiwigardener Worker publish site assets. Never reinstate GRID's retired direct cross-site Kiwi deployment. Kiwi must not make per-visitor D1/Typesense calls to render directory pages.

## Desired repeatable cycle (still an implementation target)

1. GRID EATER's shared, ALL-category national pipeline acquires NZBN/BIC, trading/legal names and credible first-party website clues, categorises fast with deterministic source-backed rules and uses existing Hetzner crawler/AI to improve and resolve ambiguous cases. Store source grades and respect owner edits.
2. Guarded canonical updates go through indexed bounded D1 writes, independent physical readback and live GRID Typesense/profile verification.
3. Independently reviewed Kiwi-eligible changes, including additions, corrections, status changes, exclusions and withdrawals, produce a new version/digest of approved public-only data. Never change immutable past R2 snapshots.
4. A future authorised, idempotent approved-feed digest notification triggers a **Kiwi-owned native build** (or separately approved incremental refresh), with last-good rollback. **Do not claim this is already automatic:** the present nine-record release was explicitly reviewed and independently deployed.
5. Kiwi's native tests verify source SHA, site build, live directory cards, profile count/content, sitemap/indexability, name and classification, supplier vs contractor, regional/locality labels and contact privacy. A GRID category is not a Kiwi LIVE record without these checks.
6. For national thousands, design versioned/sharded feeds, page/search/sitemap pagination, review changes and withdrawals and incremental build costs. The present v1 feed has **200-record / 512 KB limits**, so no unbounded massive JSON feed.

## Verified stage counters, not interchangeable

| Stage | Verified 9 November position |
| --- | --- |
| GRID direct gardening BIC source discovery | 1,284 distinct provisional candidates (GARDEN-DISC-25), not already-categorised counts |
| Canonical GRID categories | 50 new provisional assignments across two guarded 25-business cohorts |
| GRID public Typesense/profile | Earlier 25 verified 25/25; second 25 public proof still outstanding |
| Kiwi reviewed and public immutable feed | Exactly nine approved independent gardening services |
| Kiwi actual native live directory | Nine cards, nine canonical profiles, nine sitemap entries, Dallas's service separate |
| All-industry national engine | Target only: new production audit/writer lanes specialised to gardening six BIC codes |
| Automatic reviewed digest-to-Kiwi publication | Target only: not yet proven end-to-end with updates and withdrawals |
| Thousands-scale consumer architecture | Pending, limited by current v1 feed size |

Physical evidence: [national audit](https://github.com/meeeeeooooowwwwwww/grideater/actions/runs/42578469632), [second conditional category release](https://github.com/meeeeeooooowwwwwww/grideater/actions/runs/42580912104), [completed Kiwi nine-live milestone](KG-DIR-05-NINE-APPROVED-LIVE-GARDENERS.md), [native nine-live proof](https://github.com/meeeeeooooowwwwwww/kiwigardener/actions/runs/42568541096).

## Next work and no-drift check

Priority: independently verify the second 25 on GRID public search/profiles; scale the shared all-category acquisition/classification pipeline; reconcile NZBN API recovery [#2314](https://github.com/meeeeeooooowwwwwww/grideater/issues/2314); separately develop approved feed change/withdrawal → native Kiwi refresh; and solve feed sharding before thousands. Track each conversion stage, source freshness, owner overrides, D1 cost and physical delivery receipts. Do NOT manually handcraft many disconnected vertical records instead of the common pipeline.

**Documentation only:** this records the owner's desired outcome and is not authorisation to publish 41 additional Kiwi records, expose private contact, re-run old one-time writers, or deploy code.
