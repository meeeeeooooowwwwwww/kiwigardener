# KG-DIR-03 | First three live independent gardening businesses

**9 November 2026 NZDT.** GRID EATER remains canonical for every independent business, its NZBN/BIC category, first-party service evidence, public-approved town and correction requests. Kiwi Gardeners continues to consume the single public-only `https://grideater.com/feeds/gardeners/v1.json` at **build time**, never querying D1/Typesense per visitor.

Upstream verified work:
- GRID [KG-POP-05 #42489959549](https://github.com/meeeeeooooowwwwwww/grideater/actions/runs/42489959549): four authoritative BIC-supported provisional categories committed; no raw contacts or verified `serves` claims from official registered towns.
- GRID [KG-POP-06 #42515168609](https://github.com/meeeeeooooowwwwwww/grideater/actions/runs/42515168609): Waitakere Tree Services and TJR Groundworks each in actual Typesense name/category and town-filter search, both canonical profiles HTTP200.
- GRID [KG-POP-07 #42515805867](https://github.com/meeeeeooooowwwwwww/grideater/actions/runs/42515805867): reviewed public-only 3-record export with Wordsworth Gardens unchanged and two additions; new release `kg-first-three-20261108193606`, SHA `864b31350c1addf7a941ffd5b1e8da5d2ff06b810c2d8edf588d9db97d4a17dd`, 4,787 bytes.
- GRID [KG-POP-08 #42516526954](https://github.com/meeeeeooooowwwwwww/grideater/actions/runs/42516526954): isolated, immutable versioned new R2 object `verticals/kiwigardeners.com/v1/releases/kg-first-three-20261108193606.json` uploaded and independently SHA-verified. The old one-business R2 object is retained for rollback.
- GRID public Worker pin switch is managed only via the existing source-pinned protected main Worker deploy and exact 3-record GET/HEAD/SHA verification. **Do not merge this Kiwi change until the new public feed is truly live and passes.** A new R2 object alone does not publish new Kiwi listings.

This Kiwi source PR does **not** introduce a new directory engine, another database, repeated crawler, or cross-site API credentials. Its unchanged native build already fetches approved GRID data once and builds `/gardeners/`, three canonical-indexable profiles and sitemap. The only new code is a guarded public acceptance script plus tests:
1. Require status JSON release ID and 3 records, exactly 3 directory cards, all 3 source-ID-specific profile URLs, matching towns, indexability and sitemap entries.
2. Require `Mosgiel` to be explicitly shown as `Likely local area (NZBN registration)` and *not business-confirmed*, preserving second-pass correction semantics.
3. Require Dallas Timpson's independent Christchurch enquiry path and block raw phone, email, registration street and private source fields.
4. Native `main` commit triggers existing Cloudflare Workers Builds, then a bounded read-only GitHub Actions site acceptance (up to 12 attempts at 10-second intervals to allow provider build lag). No extra Worker deploy, job, R2 mutation, D1, paid feature or caching rule. If native build fails, previous live static site remains the last accepted state.

**Next:** after live 3-record proof, record founder's high-recall population-first policy and scale 10–25 existing NZBN/first-party/keyword candidates per bounded Hetzner processing batch. Follow-on feed release needs stable source-corrected public schemas and versioned R2+Worker pin; never rerun the original one-time MVC-01J bucket creator.
