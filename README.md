# KiwiGardeners.com | Christchurch local SEO

Independent, Christchurch-focused gardening website. Separate from all other repositories and websites.

## Current site (October 2026)
- 48 indexable HTML pages plus a custom 404: homepage, 10 service pages, 22 area pages, 9 garden guides, and site information/hub pages.
- Local area pages are grouped by geography. Gardening guides follow history → plants/soil → care → gardening help, with context-specific reading links.
- Dallas Timpson is presented as the independent gardening provider. Phone calls link to `tel:+64273406581`; public email links use `dallas@kiwigardeners.com`.
- Unique meta titles, descriptions, canonical URLs, accessible navigation, JSON-LD, XML sitemap and robots.txt.
- Responsive design and Cloudflare-compatible security headers.
- Photo-led homepage with clearly identified illustrative stock photographs and credited Wikimedia Commons photographs; contact and privacy pages.
- Direct email enquiry calls-to-action and a link to https://grideater.com/ (separate website).
- No fabricated customer work, reviews, opening hours, pricing or live bookings.

## Build
Node.js 20+ with no third-party dependencies.
```bash
npm run check
```
`npm run build` writes the site to `dist/`.

## Cloudflare Workers Builds: LIVE CONFIGURATION
Cloudflare has a Worker project called `kiwigardener` connected to GitHub `main`, rather than a Pages project. The successful GitHub build check does not prove a Cloudflare deployment.

A `wrangler.jsonc` config lives at the repository root, specifying the **existing** Worker name `kiwigardener` and static assets from `./dist`. This is the supported deployment path and prevents Wrangler from requiring a worker script entry point.

### Build settings in Cloudflare
1. Cloudflare → Workers & Pages → `kiwigardener` → Settings → Build.
2. GitHub repository: `meeeeeooooowwwwwww/kiwigardener`, production branch: `main`.
3. Build command `npm run build`.
4. Deploy command `npx wrangler deploy`.
5. Root directory `/`. Static site builds need no build-time secrets. The contact Worker **does** require its own securely configured runtime bindings, Turnstile and rate limiting; never put secrets in this repository.
6. Retry the latest failed build if an automatic deployment has not started after the config commit.
7. Check Deploying logs, published Worker URL, and verify `/`, `/contact/`, `/areas/linwood/`, `/sitemap.xml` and `/robots.txt`.
8. Under Worker → Domains, add `kiwigardeners.com` as a **Custom Domain** (not an unrelated Pages project), then verify TLS and DNS.
9. Verify Google Search Console and submit sitemap once the public domain works.

Source: https://developers.cloudflare.com/workers/static-assets/ and https://developers.cloudflare.com/workers/ci-cd/builds/troubleshoot/

## Editorial and future release rules
- The site offers Christchurch gardening information and direct contact with Dallas Timpson, an independent sole-trader gardener. Check job suitability and regional availability rather than promising bookings.
- Display only genuine, permissioned examples of Dallas's work and don't invent customer reviews or certifications.
- Use server-side Turnstile checks, consent/privacy disclosure, rate limiting and secured CRM integration before adding any enquiry form. Never store card numbers.
- Expand only with useful and distinctive original content. Avoid mass-produced keyword doorway pages.
- Do not copy photographs or content from similarly named businesses, including the Waikato operator.

## Release milestones and what to improve next
- Verify each Cloudflare production deployment independently of successful GitHub checks; inspect TLS, live pages, assets, contact functionality, Core Web Vitals and indexing.
- Inspect Search Console metrics by guide, suburb and service; prioritise stronger evidence and actual customer queries over publishing more generic location pages.
- Add permissioned before-and-after examples of Dallas's work only when supplied and verified; preserve secure contact processing.

### Image provenance
- Hero: Jason Dodd, Avonside community garden, Unsplash, https://unsplash.com/photos/a-lush-garden-with-a-winding-path-and-manicured-hedges-9zxXi2j-OgU
- Additional illustrative lawn/garden photos: Marc Pell and Declan Sun, Unsplash (https://unsplash.com/license). These are **not** examples of work carried out by Kiwi Gardeners.
- Local historical and botanical photographs: see the `images` collection in `src/local-editorial.mjs`. Each file specifies its author, source page and licence. Do not relabel a photo of another location as Christchurch.

### Deployment limitation
This repository has validation CI and a Worker-compatible `wrangler.jsonc`. Cloudflare Workers Builds must publish it using its own authorised build token; merging or pushing code does **not** by itself prove a successful production deployment.

## Google Search Console: separate property for the new domain

**Important:** Google Search Console ownership of `americafirst.co.nz` does **not** verify `kiwigardeners.com`. Each root domain needs its own property.

1. Visit https://search.google.com/search-console and use the **property selector → Add property**.
2. Select **Domain**, enter exactly `kiwigardeners.com` (no https, no www, no path).
3. Use Google's Cloudflare registrar/DNS connection or add Google's verification TXT record to the `kiwigardeners.com` Cloudflare zone. Leave the existing Worker DNS record alone. Click **Verify**.
4. Select the **kiwigardeners.com** property (not any existing site), go to **Indexing → Sitemaps**, submit `sitemap.xml`. The generator currently lists 48 canonical indexable pages. The 404 page is intentionally excluded.
5. Use URL Inspection on `https://kiwigardeners.com/` and representative service / suburb URLs, inspect Live URL first and request indexing if eligible.
6. After Google has crawled, review **Indexing → Pages**, **Performance → Search results**, and **Experience → Core Web Vitals**. Search Console verification and sitemap submission do **not** guarantee Google rankings, crawling speed or indexing.
7. Configure HTTPS and a canonical redirect from `www.kiwigardeners.com` to `https://kiwigardeners.com` once `www` is configured, to prevent separate host variants. Avoid changing DNS or redirect rules without checking the active Worker domain.
8. Add sitemap `lastmod` only if reliable per-page modification dates are tracked. The current sitemap intentionally omits `lastmod`; don't invent update dates or reset them on every deployment.

Google guidance: https://support.google.com/webmasters/answer/34592 and https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
