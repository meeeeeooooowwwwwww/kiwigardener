# KG-DIR-12 | 153 provisional GRID gardening businesses on native Kiwi

**10 November 2026 NZDT | source-ready pending actual GRID 153 public release.** Never claim native live solely from source/R2 changes.

## Physically proven expansion source

- [GRID protected bulk preview #42761812544](https://github.com/meeeeeooooowwwwwww/grideater/actions/runs/42761812544) PASS, **21 existing approved unchanged + 132 NZBN-backed provisional new entries = 153**, of which **125 are new gardening services and 7 new suppliers**. Public source release `kg-bulk-provisional-20261110052336535`, 178,914 bytes SHA256 `0e186bb362bd025d1b4b728e137b7a4d343e63c88693eeb93d89672146f68a34`. First-party site and independently verified territory are intentionally not required for this **provisional** category, but exact published GRID legal/ID/slug/NZBN backing is required. New records only claim an indicative NZBN business classification, and have no invented services, website or coverage.
- [GRID protected private contact export #42763043383](https://github.com/meeeeeooooowwwwwww/grideater/actions/runs/42763043383) PASS: **5 Kiwi public business phones** and **82 business emails to be revealed only after server-verified Turnstile**, private 4,259 bytes SHA256 `7c4f0abfb5e5b713e943a6892698c7fba34e6845854883bb6d5412b8f2312942`. Indexed 6 queries / 403 rows read / 0 written.
- [GRID dual immutable R2 #42763672021](https://github.com/meeeeeooooowwwwwww/grideater/actions/runs/42763672021) PASS, independent remote byte-for-byte SHA of BOTH new public and private snapshots. Dual writer [#2621](https://github.com/meeeeeooooowwwwwww/grideater/pull/2621) disarmed.
- GRID source [#2622](https://github.com/meeeeeooooowwwwwww/grideater/pull/2622) passed full CI and merged with strict exact 153 Worker GET/HEAD/negative proof. **Separately authorised Worker deploy [#2623](https://github.com/meeeeeooooowwwwwww/grideater/pull/2623) is pending as of this source document.** Do not merge Kiwi until its source-ready job confirms actual live GRID 153.

## Kiwi native publication contract

- GRID stays single national master for identities/categories/registered city; Kiwi builds static SEO-friendly cards, profiles, sitemap and keyword/town search from GRID approved public-only feed at build time, no second business DB and zero direct D1.
- Add independent `scripts/verify-live-153-gardeners.mjs` and negative tests `scripts/check-live-153-gardeners.mjs`. Protected PR `source-ready` requires live GRID exact release SHA, 153 validated, supplier vs contractor and 21 originals preserved. Native main production test requires **153 visible cards, 153 canonical profiles, 153 sitemap business paths, correct provisional category descriptions, no fabricated service territory**.
- Kiwi's separate private `KIWI_PRIVATE_CONTACTS` binding reads the new release-matched contact file: **5 public phone click-to-call entries**, **82 email addresses** only after server-side Turnstile. No phone/email in public GRID feed, HTML source, static directory JSON or GitHub Action logs. Current 21's legacy phone/email snapshot remains immutable for rollback. Manual human Turnstile end-to-end success separately unverified; invalid/no token requests must remain blocked.
- Dallas house profile remains separate. Existing 21 profiles should render unchanged except source release metadata. All category/area guesses are clearly marked provisional and can be corrected by business owners.
- Merge only after actual GRID main 153 live and Worker one-use disarm. Kiwi Cloudflare Workers Builds triggers own native deployment from Kiwi main; independent live 153 proof tests actual HTML and contacts, not just static source. Do not mark 153 LIVE until that evidence is successful.

## Scaling next

The old 50-at-a-time review cap was the main bottleneck; the first 132 provisional additions unlock practical bulk publication. Next: indexed keyset pagination beyond first 60 per category, national BIC-to-GRID shared category mapping, NZBN provider cursor recovery #2314, enrichment with Scrapy/local AI and owner correction/suppression. Avoid v1 200-record / 512KB ceiling by sharding or updating feed contract before further large batches.

**Cost:** No new visitor-time GRID/D1 requests; one build-time approved public GRID GET, no D1 writes, one independently gated static Worker release, and bounded 153 profile GETs for acceptance. No new paid Cloudflare features, account cache configuration, new cron, public raw business email, or site-specific second canonical database.
