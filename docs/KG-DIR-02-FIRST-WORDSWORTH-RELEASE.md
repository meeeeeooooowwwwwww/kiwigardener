# KG-DIR-02 | First real independent gardener, approved GRID EATER public feed

**8 November 2026 NZDT.** Kiwi-owned SOURCE PR staged; no independent Kiwi production deploy verified yet. This release must not merge before GRID EATER actually serves the live approved public feed.

## Source proof, strict dependencies
- [GRID EATER MVC-01D #42458603105](https://github.com/meeeeeooooowwwwwww/grideater/actions/runs/42458603105) physically verified one Wordsworth `gardeners` category, source evidence, human audit.
- [MVC-01G #42461489756](https://github.com/meeeeeooooowwwwwww/grideater/actions/runs/42461489756) physically verified one approved first-party `serves Christchurch` association and city-only public search address, no street contact.
- [MVC-01H #42461822852](https://github.com/meeeeeooooowwwwwww/grideater/actions/runs/42461822852) independently verified GRID EATER public Typesense search by name AND explicit Christchurch filter, matching category/city, canonical business profile HTTP 200.
- [MVC-01I #42463216411](https://github.com/meeeeeooooowwwwwww/grideater/actions/runs/42463216411): 28/28 tests, real reviewed public-only Wordsworth release `kg-wordsworth-20261108083040`, SHA256 `5224ff05584106b3cfe8a328f1bac02400fc5755c88ea1a3eb8522cc3a1c0b50`, 1,707 bytes, one official website-only contact, five evidenced services (Hedges, Lawns, Weeding, Irrigation, Landscaping), approved Christchurch serviceArea.
- [Owner R2 MVC-01J #42464163625](https://github.com/meeeeeooooowwwwwww/grideater/actions/runs/42464163625) SUCCESS: new isolated private R2 bucket `grideater-public-vertical-feeds-v1`, exact one public-only object, **remote GET hash independently verified**, 0 D1 writes. Never rerun.
- [MVC-01K GRID source-only config PR #2447](https://github.com/meeeeeooooowwwwwww/grideater/pull/2447) merged; Worker public-feed binding ID/SHA pinned; **this is not itself an active deployed Worker**.
- [GRID production Worker release PR #2448](https://github.com/meeeeeooooowwwwwww/grideater/pull/2448) merged after full PR test proof; its protected production [run #42465303705](https://github.com/meeeeeooooowwwwwww/grideater/actions/runs/42465303705) must complete and independent GET/ETag/SHA public route confirmation MUST pass before this Kiwi source PR is merged.

## Kiwi-owned narrow release
Existing Kiwi `src/gardener-directory.mjs` accepts ONE GRID public approved v1 feed with strict unknown-field, status, suppression, service/area, source, public-contact, timestamp, HTTPS, age and privacy checks. It creates a directory card and static canonical business profile under `/gardeners/wordsworth-gardens-9429052264047/`, plus an indexable hub/sitemap entry, in the **existing** combined services AND suppliers search. Dallas's independent enquiries and phone remain completely separate.

The only intended production code change is to make `build.mjs` use the approved, fixed `https://grideater.com/feeds/gardeners/v1.json` by default, with an explicit `KG_GRID_EATER_PUBLIC_FEED_URL` environment override available for controlled builds. The remote load happens ONCE DURING `npm run build` only. On non-200, invalid schema, removed/suppressed proof, stale release, or empty remote release, it **fails the build closed** instead of producing false public business pages. No D1, CRM, Typesense or Hetzner secrets in Kiwi; no per-visitor GRID queries, new database or cross-site deploy API. The source file `src/grid-eater-gardeners-public.json` remains the original empty/noindex local holding fixture, not an editable duplicate master.

## Owner deploy and live acceptance
After confirmed GRID public feed 200 and exact SHA/ETag:
1. Require Kiwi GitHub PR checks `site-check.yml` and native build `npm run build` to succeed using the live feed.
2. Merge Kiwi main, letting the EXISTING Cloudflare Workers Builds on `meeeeeooooowwwwwww/kiwigardener` `main` deploy the existing `kiwigardener` Worker. Never reactivate the retired GRID EATER cross-site deploy. Verify Cloudflare provider deployment separately; a green GitHub check alone does not prove it.
3. Independently GET public `https://kiwigardeners.com/gardeners/` and `/gardeners/wordsworth-gardens-9429052264047/`, inspect one real card/profile, explicit Christchurch area, keyword results and sitemap inclusion/indexability. Confirm Dallas house contact and Turnstile form still behave independently, and absence of raw business phone/email/street. If provider deploy fails, leave previously verified Kiwi live Worker untouched and inspect the source-specific Cloudflare build. Do not manually trigger unrelated jobs.

Future releases remain controlled by GRID EATER's approved R2 public snapshot ID/SHA, followed by Kiwi-owned build; update notification/urgent suppression propagation remains a later explicit milestone, not an assertion of instant synchronisation. One canonical GRID EATER editable master, no independent business database.

**Cost:** exactly one build-time public JSON GET per Kiwi build; zero additional D1/Typesense/R2 reads per site visitor; no new Cloudflare paid services, bindings, cache rules, deployments or cron triggers from staging this PR alone.
