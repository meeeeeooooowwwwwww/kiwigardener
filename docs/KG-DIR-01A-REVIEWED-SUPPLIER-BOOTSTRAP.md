## CURRENT VERIFIED BOUNDARY | 8 NOVEMBER 2026 NZDT

**Read [authoritative GRID EATER/Kiwi 8 November session close](https://github.com/meeeeeooooowwwwwww/grideater/blob/main/docs/operations/handovers/GE-GARDEN-KIWI-SESSION-CLOSE-2026-11-08.md) before using old “NEXT” notes here.** GRID EATER PR #2426 + Kiwi PR #37 merged **one** services AND suppliers approved public static feed contract, not separate customer search engines or independent editable supplier databases. Kiwi Native GitHub main → Cloudflare Workers Builds → existing Worker `kiwigardener` is the ONLY website deployment route; GRID #2424 removed its mistaken Kiwi cross-site deploy lane. Source code/site CI and a native Cloudflare production build passed, **but GRID approved feed/public business records still ZERO, update notification OFF, independent live-traffic browser acceptance unverified**.

GRID EATER publication requires separate owner/source-reviewed canonical category, actual public GRID search AND GRID business profile evidence within 48 hours of release, correct public-safe offerings/contacts and suppression/withdrawal controls. Supplier shop premises are distinct from verified delivery; *provisional* NZBN office-town inference is labelled `Likely serves [town]` and is NOT silently a verified delivery/service claim. Old supplier-specific service-only/deploy-gateway narratives below are **historical**, not authority to publish/activate. Avoid private phone/email, unapproved business pages or false regional coverage. Preserve useful editorial references pending real official source feed and SEO migration checks. Do not migrate or delete anything under this docs-only checkpoint.

[Current contradiction register](https://github.com/meeeeeooooowwwwwww/grideater/blob/main/docs/operations/registries/GARDEN-DOCS-RECONCILIATION-2026-11-08.md) · [cleanup candidates](https://github.com/meeeeeooooowwwwwww/grideater/blob/main/docs/operations/registries/GARDEN-CLEANUP-CANDIDATES-2026-11-08.md)

---

# KG-DIR-01A | First public-source Canterbury garden supplier cohort

**8 November 2026 NZDT.** Priority: get genuinely source-supported gardening suppliers visible before the upstream nationwide category and location enrichment backlog is fully resolved. This release creates a limited, public-safe editorial projection; it is **not** a canonical GRID EATER category/website/contact/area update and is not the separate approved gardener v1 feed.

## Two source-grounded entries

| GRID EATER public canonical identity | First-party business evidence | Public editorial classification | Source-supported premises | Service area? |
| --- | --- | --- | --- | --- |
| `afnz-9429041785683` Goughs Nurseries Limited | https://www.goughsnurseries.co.nz/ | Plant nursery, native plants, trees, hedging plants | Swannanoa, Waimakariri | **Not claimed.** Plant delivery reach, if stated separately by supplier, is not gardener coverage. |
| `afnz-9429039092267` Ashburton Contracting Limited | https://ashcon.co.nz/landscaping-supplies/ | Garden mix, compost, bark, soil, aggregates | Ashburton landscaping yard | **Not claimed.** Mixed construction activities do not turn product sales into a gardener service. |

Both canonical GRID EATER public records were exact-ID public profile HTTP-200 on repeat in [GE-GARDEN-00's 4 November first-party anchor audit](https://github.com/meeeeeooooowwwwwww/grideater/blob/main/docs/operations/milestones/GE-GARDEN-00-LIVE-PUBLIC-EVIDENCE.md). The source review was refreshed on 8 November from first-party supplier websites. Their public business identity references and first-party product/premises details are adequate for **public-source supplier references**, but no current production D1 category or service-area facts, active offer availability or protected contact values were exported.

## Publication and safety model

- The two input rows are held in `src/grid-eater-reviewed-garden-suppliers.json` as **read-only public editorial snapshots**, not editable truth. They carry only canonical GRID EATER NZBN-linked ID and URL, first-party website, products, summary, premises locality, review date and schema flags. No street addresses, emails, phone numbers, raw NZBN PBD, private evidence or public `serves` claims.
- `src/reviewed-supplier-directory.mjs` strictly validates source, exact field allowlist, site scope, review freshness (90 days), canonical ID/URL match, first-party HTTPS evidence URLs and unique slugs. The site build fails closed on malformed/stale records.
- Creates indexable `/suppliers/`, `/suppliers/goughs-nurseries/` and `/suppliers/ashburton-contracting-landscaping-supplies/` with unique title/summary, canonical GRID EATER links, first-party source links, products and clearly labelled premises. These **are not** GRID EATER site-approved formal feed entries, not a claim of paid partnership, endorsement, stock/price, service-area verification or owner control.
- The existing `/gardeners/` remains unchanged as a separate independent service-directory source, with **zero approved v1 independent gardener records**. Dallas's house-owned service and enquiry route remain untouched. Supplier pages do not count as gardener service results.
- No D1, Typesense, R2, CRM, Hetzner or Worker API in this release. No visitor-time calls to GRID EATER. Cloudflare Worker static deploy follows the existing Kiwi GitHub main build, not this PR alone. No updates to first-party supplier websites.
- Repeated or withdrawn supplier evidence must be corrected in GRID EATER's canonical record or excluded from this projection at the next reviewed build. These references are a bootstrap, **not an alternative independent business database or future replacement for GRID EATER's planned versioned approved public feed**.

## Next actual-data milestones

1. **GRID EATER:** independently inspect two exact IDs' active status, current category and first-party website evidence, then prepare bounded owner-respecting taxonomy candidates `garden-centres`/landscaping suppliers, along with *premises-only* official locality and duplicate/primary-category checks. Do not write guessed `serves` edges or override manual data. Extend to Gardening Services with pinned first-party identities after D1/owner review.
2. **Kiwi Gardeners:** independently verify Cloudflare Workers build/deploy and public HTTP 200 for all three supplier pages, sitemap inclusion, responsive layout, canonical links and Dallas contact preserved. Never claim merge alone proves production.
3. **GRID EATER public feed:** build an official supplier-specific approved public snapshot and build-time consumer, including withdrawal/suppression semantics. Migrate this bootstrap projection to it once the source public export is actually deployed and verified. Independently complete the existing gardening-service feed path before indexing gardener profiles.

## Cost/rollback

No production database SQL or D1 rows read/written, no new Cloudflare paid features, no new cron or per-visitor query multiplier. Source-only/CI and existing static Workers build. If the live site fails checks, revert the Kiwi site main commit through the existing Cloudflare deployment rollback; GRID EATER canonical business records are unchanged.

Upstream: [GE-GARDEN-00](https://github.com/meeeeeooooowwwwwww/grideater/issues/2222), [FAST-DIR](https://github.com/meeeeeooooowwwwwww/grideater/issues/2313), [Kiwi directory #30](https://github.com/meeeeeooooowwwwwww/kiwigardener/issues/30).
