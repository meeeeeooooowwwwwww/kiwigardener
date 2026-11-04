# KG-DIR-00: Kiwi Gardeners read-only GRID EATER directory connection

Status: source-only implementation. Not a live data connection or a claim that GRID EATER currently publishes this feed.

## Division of responsibilities

- GRID EATER alone creates, validates, approves, suppresses, revises and publishes canonical Business data.
- Kiwi Gardeners consumes only a **public-safe, versioned, independently approved** snapshot for gardener service providers.
- There are no D1, Typesense, CRM, Hetzner or protected-contact credentials in this repository, no visitor-time upstream fetches and no Kiwi copy of editable Business truth.
- This milestone does not modify the GRID EATER crawler, verification rules, discovery or public-data service. Coordinate a matching export with its separate engineering owner.

## Consumer activation

By default, build.mjs reads the committed holding file at src/grid-eater-gardeners-public.json. It is intentionally empty, with approvedForKiwi=false, releaseId=null, records=[]. The /gardeners/ search interface exists and displays Dallas's **separate house-owned contact** alongside an honest no-independent-listings message. Its empty hub is NOINDEX and has no sitemap entry. No business profiles are generated.

An authorised producer can later expose a publicly accessible JSON GET at a stable URL under https://grideater.com/feeds/gardeners/. A trusted Kiwi build can opt in by setting KG_GRID_EATER_PUBLIC_FEED_URL to the **actual verified endpoint**. The file path in examples is a proposed contract, not an asserted deployed URL.

One GET occurs at build time only (8-second timeout, 512KB hard read cap, redirects disallowed, HTTPS-only grideater.com origin and feeds/gardeners path, no query/token parameter). Unexpected status, MIME type, schema, privacy field or approval state FAILS THE BUILD. No silent empty fallback when an opt-in production feed fails. Never put access tokens in the URL. Do not set the variable until GRID EATER has actually approved and published the export.

## Public feed schema v1

Required top-level fields: schemaVersion=1, source="grideater.com", releaseId (unique version), releasedAt (UTC ISO), approvedForKiwi=true, records (1 to 200). Release age <=90 days, no future-dated or unreviewed release. The ONLY allowed fields on each record:

| Field | Rule |
| --- | --- |
| id | Existing canonical NZBN-linked GRID EATER ID afnz- followed by 13 digits |
| slug | Stable lowercase hyphenated URL slug, unique within release |
| name, description | Publicly approved name and substantive original summary (70–450 chars) |
| kind | gardening_service only (suppliers are a distinct future collection) |
| status, approvedForKiwi, suppressed | published, true, false only |
| approvedAt | UTC ISO approval timestamp |
| sourcePage | Public grideater.com canonical record URL |
| services | 1–16 approved {name, verifiedAt, evidenceUrl} entries |
| serviceAreas | 1–25 independently evidenced {name, verifiedAt, evidenceUrl}; never inferred from registration/address |
| publicContact | Exactly one {type:website/phone/email, value, verifiedAt, evidenceUrl, approvedForPublicUse:true} |

Every nested object also has a strict field allowlist. An unknown field such as streetAddress, privateContact, sourcePayload or notes fails the whole release. No auto-promoting goughsnurseries.co.nz, ashcon.co.nz, unverified contacts, guessed localities, plant nursery suppliers or tier-C listings.

### Release sequence

1. Producer supplies source/approval provenance, complete release manifest and independently verified service-area and contact eligibility from GRID EATER. Review privacy and correction/suppression propagation.
2. Validate the manifest in an isolated CI run with synthetic test fixtures and a finite real approved cohort. Inspect each generated business URL, title, sitemap, contact action, canonical link and no data leaks.
3. Owner separately approves connection URL/configuration and the normal Cloudflare Worker build/release. Verify live /gardeners/, a reviewed profile, search and indexability, plus the existing /contact/, plants, guides, sitemap and Dallas enquiry routing. Rollback by removing the opt-in URL and redeploying the last verified Worker. Keep GRID EATER as source of truth.

## Directory UX

- /gardeners/ is a static hub with text, service and verified service-area filters, shareable q/service/area query parameters and an accessible live result count. Without JavaScript, approved cards remain visible with ordinary profile links.
- /gardeners/{slug}/ pages exist only for individually approved rows, with source IDs, verified service/area evidence, a single approved contact channel and a canonical GRID EATER correction link. Pages never invent ratings, price, availability or geographic coverage.
- Dallas's Kiwi Gardeners call/email panel remains separately identified as house-owned information, not presented as independent organic search ranking or another GRID EATER Business profile.
- Zero visitor D1 reads; all filtering operates in the browser on static, approved HTML. Cap 200 businesses per export until pagination/search indexing is separately reviewed. Avoid mass creating thin suburb x service doorway pages.
- Directory status JSON at /assets/gardener-directory-status.json contains only schemaVersion, source, releaseId, approval boolean and count, never names or private data.

## Explicit no-go boundaries

Do not activate the prior GRID EATER gardening crawler or C5 V2, change the canonical database, publish suppressed data or change Dallas's email/phone routing. The parallel data-pipeline rebuild is a separate workstream and is not part of this PR. The site-check CI and sitemap gates must pass before any production release.
