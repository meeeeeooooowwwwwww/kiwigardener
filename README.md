# KiwiGardeners.com | Christchurch local SEO

Independent, Christchurch-focused gardening website. Separate from all other repositories and websites.

## Current site (October 2026)
- Original 48 indexable site pages plus a 331-entry plant directory: all 331 plant profiles have unique planting and maintenance notes and are indexable. All original service, area and guide pages remain.
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
4. Select the **kiwigardeners.com** property (not any existing site), go to **Indexing → Sitemaps**, submit `sitemap.xml`. The generator includes 380 canonical indexable pages (48 original pages, the plant directory and 331 independently written plant profiles). The 404 page is intentionally excluded.
5. Use URL Inspection on `https://kiwigardeners.com/` and representative service / suburb URLs, inspect Live URL first and request indexing if eligible.
6. After Google has crawled, review **Indexing → Pages**, **Performance → Search results**, and **Experience → Core Web Vitals**. Search Console verification and sitemap submission do **not** guarantee Google rankings, crawling speed or indexing.
7. Configure HTTPS and a canonical redirect from `www.kiwigardeners.com` to `https://kiwigardeners.com` once `www` is configured, to prevent separate host variants. Avoid changing DNS or redirect rules without checking the active Worker domain.
8. Add sitemap `lastmod` only if reliable per-page modification dates are tracked. The current sitemap intentionally omits `lastmod`; don't invent update dates or reset them on every deployment.

Google guidance: https://support.google.com/webmasters/answer/34592 and https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap

## Christchurch plant directory (November 2026)
- `/plants/` offers instant, accessible client-side search of 331 entries with filters for plant form, purpose, flower colour, foliage colour, light, flowering season and NZ native status. The page and individual plant URLs render without JavaScript; filtering requires JavaScript.
- Each `/plants/{slug}/` page is generated from factual botanical attributes only, has a unique canonical URL, descriptive title, breadcrumb, care considerations, links to the relevant gardening services and the original nursery reference. All text is independently composed, with no copied nursery descriptions or photographs.
- Source listing: Goughs Nurseries public plant catalogue, retrieved 2 November 2026. Listing availability is not mirrored and Kiwi Gardeners does not claim any commercial relationship.
- `src/plant-catalogue.mjs` stores the imported name index and extracted factual attributes; `src/plant-editorial.mjs` stores 42 original practical Christchurch notes; src/plant-review-{a,b,c}.mjs and src/plant-review.mjs add 229 individually authored notes; src/plant-expansion.mjs contains 60 further notes. All 331 profiles are indexable with matching photographs.
- For plant safety, verify invasive/pest species against Environment Canterbury's current regional plan and the National Pest Plant Accord before making explicit recommendations or accepting supplier offers.
- Future monetisation: the page renderer contains an intentionally inactive supplier/affiliate insertion point. When an authorised supplier relationship exists, add clearly identified paid links in a separate, reviewed change and label sponsored placements appropriately. No adverts, external plant photos, price or inventory feeds are currently installed.
- `npm run check` validates original pages, all 331 built profiles, 331 indexable profiles, source links, CTAs, metadata, navigation and sitemap. Also check Cloudflare Workers Builds independently before marking production deployed.

## November 2 pre-deployment design and SEO refinement
- Plant directory cards and related-profile cards now use the site's established `.card` and `.cards` system. Buttons, tags, sidebars, enquiry panels, typography, colour variables and header/footer markup remain shared with the other site pages.
- The desktop navigation switches to the compact menu on narrower laptops and tablets (up to 1100 px) to keep the additional Plants link from colliding with branding or the call CTA.
- Browser-side filtering renders results 24 at a time with an accessible Show more action. Without JavaScript, all 331 plant links remain visible. The free-text parser handles common garden queries such as 'white flowering shrubs' and 'native plants'. Filter state can be shared through URL query parameters.
- The hub cross-links to reviewed plant profiles, planting guides and gardening services. Hedge-trimming and maintenance pages link back to the plant finder; a shared enquiry panel encourages contacting Dallas without claiming plant sales.
- More descriptive individual metadata, an ItemList of the 42 reviewed/indexed plant profiles and accurate generic garden-photo alt text improve SEO without implying nursery affiliation or adding keyword doorway pages.
- Regression checks cover the global footer and navigation, 331 plant-page CTAs and canonicals, representative unindexed profiles, search functionality and computed card-grid layout at widths from 320 to 1920 px.
- **Release:** changes stay on the feature branch/PR until approved and deliberately merged; a passing GitHub check does not prove Cloudflare production deployment. After release, verify the live directory, featured profile, footer, mobile menu, search and sitemap on kiwigardeners.com.

### Future catalogue categories
Portstone Christchurch was consulted only for public category structure, not copied descriptions, photographs, products or availability. Populated shortcuts cover shrubs, trees, fruit/edibles, hedges, native plants, foliage/flower colours, groundcovers and perennials. Roses, citrus, deciduous fruit trees and accessory sections (pots, water features, greenhouses, plant supports) require separately verified original content, products and a legitimate supplier arrangement before they are presented as stocked or linked commercially. No current relationship with Portstone is claimed.

### Plant photos embedded in cards (November 2026)
- `src/plant-photo-links.mjs` maps the 271 original plant slugs to exact Goughs nursery JPEG URLs.
- `npm run build` downloads, validates and saves each photo to `dist/assets/plant-photos/{slug}.jpg`, served as ordinary first-party Cloudflare Worker static assets. A build fails rather than publishing broken photo placeholders when remote pictures are missing. All 331 files are generated at each build; no external hotlink request is made by visitors.
- Plant directory cards and individual plant profiles display each genuine photo directly without photo links to the supplier. The text card links retain the local plant-guide navigation and normal contact CTA.
- Existing source listing links in the reference paragraphs remain separate from the photographs. No nursery sales, current stock, affiliate arrangement or other partnership is implied.
- CI checks real JPEG files exist for every plant, that all images are not identical placeholders, and that the browser can decode a real photo from the local origin. Preserve existing plant SEO and responsive layout checks.

## Christchurch City Council Newsline RSS (November 2026)
- `https://www.newsline.ccc.govt.nz/news/stories` is an official, 24-item RSS feed, not an ordinary article index. Council permits use of the feed subject to its website terms. The feed currently **does not contain image enclosures**.
- The parser in `scripts/council-news-feed.mjs` selects recent Newsline titles about Christchurch gardens, parks, reserves, waterways, native habitats, environmental restoration and nearby public spaces, with mandatory source-domain and date validation. It specifically excludes industrial/wastewater 'plant' false positives. Only direct Newsline article links, publication dates and short titles are republished.
- `src/council-news.mjs` displays up to 2 relevant dated stories per ordinary page, or 3 on directory hubs, in a compact section above the standard footer. It now covers the homepage, all service and area hubs, individual services, suburb pages, guides, plant directory and all 331 editorially enhanced plant profiles.
- Council article images aren't included in RSS, and Council's official logo requires written permission to reproduce. Instead, the section names **Christchurch City Council Newsline** in readable text, without using its trademarked logo or claiming endorsement. Beside each story, an **explicitly illustrative** photo from this site's existing licensed Christchurch garden/nature photo library appears, with visible artist, file and licence credits. No Council photo is falsely attributed to Newsline.
- `scripts/council-news-images.mjs` downloads up to 5 licensed Wikimedia photo assets at build time to `/assets/council-news/*.jpg`, eliminating browser hotlinks. If Wikimedia is unavailable, an existing site-hosted botanical photo is substituted, never an empty/broken-image card. Daily RSS availability does not interrupt site builds; `src/council-news.json` holds validated last-good headlines for outages.
- The scheduled daily GitHub Action `.github/workflows/refresh-council-news.yml` updates the stored snapshot only when relevant headlines change. Cloudflare Worker Builds must be checked independently after the first new release and after the first scheduled update.
- RSS and responsive regression tests exercise broad topic matching, CCC source text, dates, real image decoding, 331 plant photos and contact/SEO/robots preservation. No change is made to the global footer, contact form, Turnstile or site canonical sitemap.

## November 2026 expanded plant catalogue
- Added 60 individually illustrated, independently worded profiles, researched from CJ's Plant Farm in Amberley, Canterbury. Existing card design, filters, layouts and URL structure remain unchanged.
- New entries join the current plant sitemap automatically because their individual profiles contain original species-specific care notes. Search engines may still decide independently whether to index a page.
- The build validates and caches each nursery image as a local static JPEG, avoiding brittle browser hotlinks.

## Full 331-profile editorial and native-label release (2 November 2026)
- Every original 229 previously unreviewed plant profiles now has a named plant-specific note and practical maintenance note, combined with Christchurch site checks. Indexing follows the same existing editorial status test.
- Corrected obvious NZ native-flag errors against Department of Conservation Canterbury species lists, including kahikatea, giant umbrella sedge, akeake, silver tussock and others. Corrected Chilean iris to introduced; removed unreliable flower-colour tags from selected species.
- Existing card, photo, filters, related links and profile layout are unchanged. The XML sitemap is derived from indexable plant pages and should now include 380 URLs; Google still decides whether to index them.
- References: https://www.doc.govt.nz/nature/native-plants/canterbury-native-plants/native-plants-natural-to-coastal-areas/ and https://www.doc.govt.nz/nature/native-plants/canterbury-native-plants/wetland-and-river-stream-margin-native-plants/ and https://www.doc.govt.nz/nature/native-plants/canterbury-native-plants/native-plants-natural-to-banks-peninsula/.
