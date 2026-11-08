## 8 November 2026 NZDT | One search across gardening services, nurseries and supplies (source only)

Owner's highest priority is **population** of ONE `/gardeners/` directory, not a second supplier search or separate public business database. Services, retail plant nurseries, garden centres, soil/compost/bark and landscaping-materials suppliers appear in the SAME cards/keyword/NZ town search once GRID EATER confirms each is finalised, reviewed, assigned an appropriate canonical category, indexed in its public search and present on its public business profile. The separate `/suppliers/` pages remain clearly labelled editorial reference pages but are not independently approved search results.

Existing strictly validated `schemaVersion:1` feed consumer now permits `kind:gardening_service` or `kind:gardening_supplier` (ASCII `gardening_supplier` in code). Both share the independently approved public website-only contact and the canonical GRID EATER source link. Supplier `services[]` holds reviewed product/supply names for matching the existing 25 keyword groups; supplier `publicLocations[]` holds independently verified shop or nursery town(s), and separate `serviceAreas[]` holds proven DELIVERY areas. No service or delivery territory may be inferred from a retail yard, NZBN registration or town address. The browser joins exact `data-locations` towns only and expands only verified service/delivery `data-areas` regions. A supplier with only a shop can be found at its shop town, without pretending it serves every town in Canterbury.

Static business and supplier profile rendering stay under `/gardeners/<slug>/`, with visible 'Verified gardening service' / 'Verified supplier' badges, respective offerings/areas, approved website and canonical GRID EATER source. The existing noindex zero-feed holding state, Dallas contact, search autocomplete, source-only build, private phone/email blocking, no D1 visitor reads and 597 official towns stay unchanged. The combined directory remains unpopulated until actual GRID EATER production approvals exist and the changed approved release is activated under the existing owner protection gates.

Tests cover a fully synthetic mixed approved feed (never deployed as businesses), strict reject of private/unknown fields, supplier pickup-vs-delivery, one index with both card types, mobile browser combined keyword and locality results, and no all-Canterbury expansion for a single Ashburton yard.

---
## 8 November 2026 NZDT | KG-DIR-01 town + gardening keyword autocomplete

**Source-only UI improvement, no new source of business truth or feed activation.** The original `/gardeners/` search controls now use two JSON-backed type-ahead comboboxes: (1) a reviewed gardening-services AND gardening-supplies vocabulary, and (2) all **597** populated Stats NZ UR2026 urban areas and rural settlements (195 urban, 402 rural). No separate Gardening Service dropdown, no company/business-name text search and no suburbs/regions as user-facing selector options. Browsers read one static same-origin `/assets/garden-directory-filter-data.json` generated during the Kiwi build, not GRID EATER/D1 per visitor.

The town list derives from the previously verified GEO-NZ-07 full [Stats NZ / LINZ source archive](https://drive.google.com/file/d/1QawTmcX-DljahSEVRG7orTJCNBV84pdK/view). Exact original Stats JSONL SHA256 `89bb35e1ab3dc42ae5db6d47990299a74c75caecec28c18387fffe19171a161a`; reproducible compact JSON SHA256 `79adcceb10e7303b9e7b9fb52d01266ad1bcd6e4994146cd336693a0b0c38420`. A pinned gzip+base64 source file in `src/data/` is decompressed and SHA-validated at static build time, with hard count checks and Richmond's two region memberships. No live Stats requests; no browser geocoding charges.

**Coverage mapping:** Search can interpret an already independently approved `serviceAreas.name='Canterbury'` or `'Canterbury Region'` in the canonical public gardening service feed as matching official towns/cities belonging to Stats NZ region code `13`. The same rule applies to other official NZ region-level *approved service claims*; Richmond may match Tasman or Nelson where explicitly claimed. This is a runtime/filter-only expansion, NOT generation of 90 separate canonical location edges, and NEVER an inference from a business registered address, supplier pickup yard, office, or general BIC. Specific approved town claims continue to match only that town. No suburbs, no delivery-territory guesses.

Keyword suggestions include maintenance, weeding, mowing, hedges, irrigation, arboriculture and landscaping services, plus nurseries, native/hedging plants, seeds, compost, topsoil, mulch, equipment and landscaping supplies. Only independently approved commercial `services` facts are searchable for the currently enabled **gardening-service-only** feed. Unapproved supplier editorials remain clearly separate at `/suppliers/`; this UI does **not** invent an approved supplier feed or allow Tier-C business records into `/gardeners/` results. Add approved supplier service/product facts only when the distinct GRID EATER supplier feed contract/owner/suppression/contact gates pass.

CI acceptance: static index SHA/count/region code checks; no retired service dropdown; combobox suggestions in empty holding state; synthetic browser case Canterbury-approved claim→Christchurch and Ashburton, exact Dunedin, rejected irrelevant company-name search, no suburb inference; existing Dallas contact and zero/noindex business-feed gate. This request does not enable the public feed, change protected raw phone/email, trigger R2, D1, Qwen, or Cloudflare deployments. Verify CI, merge then independently verify the production Worker version and live browser.

---
## 8 November 2026 | P0 shared contract safety patch (SOURCE ONLY)

Until the producer and consumer separately verify protected action-capability refs, v1 intentionally permits **website contact only**. Raw phone/email in `publicContact.value` is rejected even if the source has marked it public. The corresponding GRID EATER producer draft PR must pass before any public-feed origin activation. 'Reveal phone' and 'Email this business' remain blocked on independent listings until server-side GRID EATER relay, Kiwi Turnstile hostname validation, rate limiting, permission/withdrawal and end-to-end production action tests pass.

No GRID EATER canonical data changes, Kiwi feed activation, new independent listings, build/deployment or public status change from this source-only patch. Dallas's existing house contact stays unchanged. This is a strict privacy requirement of KG-DIR-01, not approval of a new business.

---
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
| publicContact | Exactly one {type:website, value:verified official HTTPS URL, verifiedAt, evidenceUrl, approvedForPublicUse:true}. Raw phone/email explicitly rejected. Protected actions require a separately verified cross-site capability contract. |

Every nested object also has a strict field allowlist. An unknown field such as streetAddress, privateContact, sourcePayload or notes fails the whole release. No auto-promoting goughsnurseries.co.nz, ashcon.co.nz, unverified contacts, guessed localities, plant nursery suppliers or tier-C listings.

### Release sequence

1. Producer supplies source/approval provenance, complete release manifest and independently verified service-area and contact eligibility from GRID EATER. Review privacy and correction/suppression propagation.
2. Validate the manifest in an isolated CI run with synthetic test fixtures and a finite real approved cohort. Inspect each generated business URL, title, sitemap, contact action, canonical link and no data leaks.
3. Owner separately approves connection URL/configuration and the normal Cloudflare Worker build/release. Verify live /gardeners/, a reviewed profile, search and indexability, plus the existing /contact/, plants, guides, sitemap and Dallas enquiry routing. Rollback by removing the opt-in URL and redeploying the last verified Worker. Keep GRID EATER as source of truth.

## Directory UX

- /gardeners/ is a static hub with JSON-backed gardening-keyword and NZ-town autocomplete filters, shareable q/area query parameters and an accessible live result count. Without JavaScript, approved cards remain visible with ordinary profile links. Region-wide matching is only for independent verified business service-area claims, not registrations.
- /gardeners/{slug}/ pages exist only for individually approved rows, with source IDs, verified service/area evidence, a single approved contact channel and a canonical GRID EATER correction link. Pages never invent ratings, price, availability or geographic coverage.
- Dallas's Kiwi Gardeners call/email panel remains separately identified as house-owned information, not presented as independent organic search ranking or another GRID EATER Business profile.
- Zero visitor D1 reads; all filtering operates in the browser on static, approved HTML. Cap 200 businesses per export until pagination/search indexing is separately reviewed. Avoid mass creating thin suburb x service doorway pages.
- Directory status JSON at /assets/gardener-directory-status.json contains only schemaVersion, source, releaseId, approval boolean and count, never names or private data.

## Explicit no-go boundaries

Do not activate the prior GRID EATER gardening crawler or C5 V2, change the canonical database, publish suppressed data or change Dallas's email/phone routing. The parallel data-pipeline rebuild is a separate workstream and is not part of this PR. The site-check CI and sitemap gates must pass before any production release.
