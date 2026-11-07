# KG-DIR-01B | First verified-source gardening business, editorial only

**8 November 2026 NZDT.** This source-reviewed public reference provides useful real gardening service information while canonical GRID EATER gardening-category, `serves` area and Kiwi site-specific public-feed approvals are incomplete.

## One genuine business, independently sourced

- **Wordsworth Gardens**, GRID EATER known published canonical business ID `afnz-9429052264047`.
- Its [own homepage](https://www.wordsworthgardens.com/) and [own services page](https://www.wordsworthgardens.com/services) explicitly describe lawn mowing, hedge care, weeding, gardening, garden design/renovation, irrigation and landscaping. The operator reports New Brighton (Christchurch) as its base and **Canterbury as its normal broad service region**. Larger jobs elsewhere in the South Island are described as exceptional, not ordinary coverage.
- GRID EATER's verified [existing website postread #42166143125](https://github.com/meeeeeooooowwwwwww/grideater/actions/runs/42166143125) confirmed the original first-party WWW website and source identity. Independent [quality inventory #42167369738](https://github.com/meeeeeooooowwwwwww/grideater/actions/runs/42167369738) found a published business, eight actual canonical services and verified website, but **zero `business_categories`, zero `business_locations` and public-use contact permission unproven**. These are still unfinished canonical enrichment tasks.
- **No raw phone/email, exact street address, private protected contact or invented canonical service area** is used here. Links send users to the business's *own site* for contact.

## Site changes

The editor-reviewed snapshot in `src/grid-eater-reviewed-gardening-services.json` is strict enough to reject wrong exact ID, unexpected private fields, stale source, source URL drift, false canonical approvals and false publication. A separate `src/reviewed-gardening-service-directory.mjs` builds:

- `/garden-service-providers/` (indexable first-party editorial service hub).
- `/garden-service-providers/wordsworth-gardens/` (indexable first-party service profile).

The **existing `/gardeners/`** remains the different, *verified-only* GRID EATER gardening v1 feed consumer. It has zero approved independent feed records, stays **noindex**, and preserves Dallas Timpson's separately labelled own service. The service editorial page/hub are **not** integrated into the approved v1 filter results, and do not claim that a private contact or category was verified. The `/suppliers/` source-reviewed nursery/materials references remain separate; normal Kiwi contact links/Dallas service pages stay unchanged.

These source-reviewed entries provide useful immediate editorial navigation without replacing GRID EATER's single canonical business master or duplicating an independently editable business database. They should be replaced with a GRID EATER versioned, canonical-approved public feed once its exact records are corrected and reviewed. A public source statement of Canterbury coverage is **not** independent proof of service to every suburb and cannot create D1 `serves`.

## Tests / rollout

`node --test scripts/check-first-party-gardening-services.mjs`, ordinary `npm run check`, SEO, sitemap, responsive and fail-closed feed tests run in existing `.github/workflows/site-check.yml`. Only after green merge check the separate Cloudflare Workers Builds deployment, live 200 responses, indexable sitemap links, source links and existing Dallas call/email functionality. The GitHub merge itself does not prove those live checks.

## Parallel canonical follow-up

GRID EATER must add genuine source-backed `gardeners` category, reconcile controlled Canterbury region/canonical service-area relationship without overwriting owner edits, and approve a privacy-safe public contact method and Kiwi feed record. The historic one-Canterbury region create workflow is RETIRED after national GEO-NZ scope superseded it: do not reactivate or run it. No new geography/schema mutation or NZBN cursor reset follows from this editorial page.

**Cost/rollback:** static assets only, no live D1 SQL or rows read/written, no new recurring/visitor fetches or paid Cloudflare features. Roll back Kiwi static commit if a real deployment issue; GRID EATER source untouched.

Tracks [Kiwi #30](https://github.com/meeeeeooooowwwwwww/kiwigardener/issues/30), [GRID EATER gardening #2222](https://github.com/meeeeeooooowwwwwww/grideater/issues/2222), [FAST-DIR #2313](https://github.com/meeeeeooooowwwwwww/grideater/issues/2313).
