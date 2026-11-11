# KG-DIR-13 | Honest source grades and easier canonical business contact

**11 November 2026 NZDT.** Scope: Kiwi native presentation only; no GRID/Cloudflare data changes.

## Current production baseline

[KG-DIR-12](KG-DIR-12-153-PROVISIONAL-NATIVE-RELEASE.md) established **153 live business profiles and cards**: 21 reviewed prior listings plus 132 explicitly provisional NZBN-BIC classifications. The current 153 public source snapshot is immutable (`kg-bulk-provisional-20261110052336535`). [GRID #42951980315](https://github.com/meeeeeooooowwwwwww/grideater/actions/runs/42951980315) independently found 0 eligible unlinked crawler handoff jobs in bounded current queue head, with **312 D1 rows read / 0 written**, but that does not mean websites were verified. The existing 5 public business phones and 82 Turnstile-only business emails are unchanged.

## User-facing improvement
- Show **source-reviewed vs provisional NZBN counts** rather than calling the whole directory 'verified' (which overstates the evidence for 132).
- Mark the source grade on each card for client-side count updates after keyword/town filtering; no new query endpoint, dropdown, browser D1 or external search.
- For provisional listings without a source-backed town, explain why they may not appear in town-filtered searches rather than silently pretending the company serves all suburbs or regions.
- Add **direct approved business contact links** from each directory card: the canonical GRID EATER business profile or the verified public business website already present in the safe feed. Existing profile pages, phones and protected Turnstile email reveal remain unchanged.
- Present the 13-digit NZBN identifier instead of the internal `afnz-` ID on directory cards. The actual source business ID remains unchanged in DOM hooks, canonical URLs and the feed.

## Cost, authority and rollout
- Source PR: 0 D1 reads/writes, 0 NZBN API calls, 0 new R2 requests, 0 paid Cloudflare features or cache configuration changes. The existing single build-time approved public GRID feed GET remains unchanged.
- New browser behaviour uses existing static DOM `data-source-grade` only and no extra HTTP request. No unverified services, website, city, phone, email or product claims are invented. User still has one gardening keyword and one town field, with no company-name autosuggest.
- Publisher remains GRID EATER; independent Kiwi repo build/deploy and current-site verification are required. If main merges but native deploy does not succeed, report that separately.
- Tested against one synthetic reviewed and one provisional record with source-labeled counts, no raw contact leakage, genuine approved links. Re-run full existing 153-live acceptance and original SEO/negative checks following main deployment.

**Next GRID master improvement:** enrich the 132 exact NZBN-backed provisional records with independently verified business website and explicit **registered-office town** matching through BIZ-MAP-01. Do not label an untyped `business_addresses.public_city` as an official NZBN registered office. Supplier shop/pickup and service coverage must remain separate and owner corrections take precedence. Re-publish via a NEW reviewed immutable R2 source and separate guarded GRID Worker then Kiwi-native release; do not mutate the current immutable 153 source.
