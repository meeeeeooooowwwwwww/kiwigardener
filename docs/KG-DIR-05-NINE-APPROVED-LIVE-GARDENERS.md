# KG-DIR-05 | Nine approved independent gardeners, GRID EATER canonical

**9 November 2026 NZDT. Native Kiwi Gardeners change; no cross-site GRID deploy, no source/master database writes.**

## Source-backed release lineage
- GRID EATER **GARDEN-DISC-22C protected #42537184445** physically promoted 25 provisional current NZBN PBD gardening categories with independent D1 readbacks; its one-time writer was disarmed.
- GRID EATER **GARDEN-DISC-24 #42541244346** verified exact 25/25 live Typesense search results and canonical business profiles, zero D1 mutations.
- GRID EATER **KG-POP-13 #42542269303** first-party-reviewed six additional service businesses, including independently evidenced services, locations and public website contacts; additive nine-record preview retained the prior three unchanged.
- GRID EATER **KG-POP-14 #42543004053** uploaded exact immutable versioned public-only nine-business R2 JSON and remotely read it back: release `kg-reviewed-six-20261109005020`, 12,438 bytes, SHA-256 `5f3b14b4362653327c7da50d28281598a30e5cb9cddf318c28e2c901126513b4`. The R2 uploader is disarmed. The new GRID public Worker must be independently verified serving this exact feed before merging this Kiwi native release.
- The new six include Xanthe White Design, Green Therapy, Tree Menders, Total Trees, AJ Landscaping & Earthworks and Blackbird Projects. The three prior Wordsworth Gardens, Waitakere Tree Services and TJR Groundworks entries remain. These nine are service providers; garden-centre retailer supplier categories remain a separate future release.

## Native Kiwi release and acceptance
Kiwi Gardeners already uses an **existing single build-time GET** to `https://grideater.com/feeds/gardeners/v1.json`. Its existing strict public contract validates service/area evidence, approval, contact and safety. No duplicate master database, new crawler, D1, Typesense, R2 credential, changes to search/filter architecture or new visitor-time API is required. A native main commit triggers Cloudflare Workers Builds; the site pages, indexable directory and sitemap are generated from the current approved nine records.

This change adds a guarded **read-only** acceptance script and tests:
- Independently GET current GRID public feed and require exact reviewed nine version, 12,438 bytes, SHA-256 hash, all nine distinct canonical IDs and names, gardening service status and website-only public contact.
- GET public Kiwi directory hub, nine individual business profiles, status JSON, sitemap and contact page. Prove nine searchable cards, nine indexable canonical profiles with correct names/IDs, source GRID links, services/areas and approved websites, nine sitemap entries and exact release ID.
- Preserve the Wordsworth/TJR/Waitakere three prior canonical profiles and Mosgiel's clearly provisional registration-town label. Keep Dallas Timpson's own service and enquiry form separate from the GRID directory; block known private contact/street data and private fields.
- On source-only PR the offline tests run. Only on the **native Kiwi main push**, after the external GRID public feed is proven nine, a bounded provider-native build+read-only acceptance runs (up to 12 anonymous GET attempts spaced 10 seconds). No second provider deploy or cross-site write is executed by acceptance. Do not merge if GRID's new public Worker pin is unverified.

## Cost and lifecycle
No paid Cloudflare features/account-wide cache rules, no new Worker/API runtime, and no D1 reads/writes. Native build fetches one approved GRID public feed, not per visitor. Acceptance uses 14 bounded anonymous GETs per attempt with a finite retry ceiling. Backout through separately reviewed source revert/native Workers Build. Never overwrite GRID immutable R2 objects or republish old one-shot releases. After successful live nine-record verification, record the exact native run and continue the larger national gardening discovery and promotion programme.
