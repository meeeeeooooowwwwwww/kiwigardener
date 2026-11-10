# KG-DIR-11 | Kiwi-only public phones and Turnstile-protected business email

**10 November 2026 NZDT | source and test stage, not yet a live contact release.**

## Product decision

GRID EATER remains the source of business NZBN, category, area, legal identity and contacts. **Phone numbers should be publicly readable on kiwigardeners.com**, but GRID EATER must continue to protect its own displayed telephone numbers. Business **email addresses should become visible on Kiwi only after Cloudflare Turnstile verification**, never in page HTML, JavaScript, public sitemap, static JSON, data attributes, public GRID feed or analytics. Use public-display business contacts only; owner correction/suppression takes precedence.

## Implementation

- Kiwi's read-only build continues to consume the existing GRID EATER *public, no-contacts* feed once, and the new shared producer/consumer format also allows *provisional* NZBN gardening categories without invented websites, offering evidence or towns. These are labelled provisional in cards and profiles, with real business identities and live canonical GRID profiles mandatory. This is how to get more listings without making unverified claims.
- A separate **private R2** contact object, under `verticals/kiwigardeners.com/v1/private-contacts/{releaseId}.json`, holds only the current approved Kiwi feed's NZBN business ID -> public-display phone/email mappings. This file is **not** placed under `dist`, copied to the Kiwi repository, included in the public GRID export, or exposed by the GRID Worker feed route.
- Kiwi Worker `KIWI_PRIVATE_CONTACTS` R2 binding reads the same pre-existing Cloudflare bucket. Public `GET /api/gardeners/phones` returns only validated public NZ business phone numbers and `tel:` links, with no emails, so the static page can show click-to-call phones. It checks the *currently built* Kiwi feed release ID against the private R2 snapshot; if the source is missing or stale, it fails closed.
- `POST /api/gardeners/:id/email` requires the existing Turnstile site key and secret, the exact `business_email_reveal` action, correct hostname and origin, JSON, IP rate limiting and a one-use challenge token. Only then does the Worker read the matching private contact snapshot and return that specific business's public-display email. **No cross-site unverified email identity mapping and no caller-selected release IDs.**
- On-page button, site key and Turnstile script are lazy-loaded; no email is embedded before a successful challenge. Public phone links are inserted only on Kiwi directory cards/profiles.
- Production flags `BUSINESS_PHONE_PUBLIC_ENABLED` and `BUSINESS_EMAIL_REVEAL_ENABLED` are deliberately **false** in this source PR until the canonical private snapshot has been generated, checksum-checked, uploaded using a separately protected one-use workflow and read back. In this state the existing 21-live site continues unchanged.
- The private source creation query is in GRID EATER and selects only `business_contacts.public_display=1` on published canonical businesses already in Kiwi's approved release. It excludes faxes, carries no raw phone/email to GitHub logs and performs no D1 writes. On contact changes/suppressions, regenerate the R2 projection before accepting a new native feed or exposing an obsolete contact.

## Readiness and remaining work

As of this source PR, the code does **not** claim contact values have been published on the live site. Production still needs: (1) protected GRID read-only 21-contact export and exact SHA; (2) one guarded private R2 upload and readback for that release; (3) separately enable Kiwi flags; (4) independent live API and directory checks, with invalid Turnstile action/hostname/response and missing contact negatives. No business contact should be invented from a legal name or trading name.

**Cost:** no direct D1 from Kiwi, one R2 object read when the public phone list is requested, plus an R2 read after successful Turnstile for email. No new scheduled crawler, paid Cloudflare feature, account-level cache rule, second directory database, raw email in public feed, or extra visitor-time GRID queries. Current immutable 21 source remains unchanged during this migration.

[GRID EATER master SOW](https://github.com/meeeeeooooowwwwwww/grideater/blob/main/docs/roadmaps/workstreams/NATIONAL_BUSINESS_ENRICHMENT_AND_VERTICAL_PUBLISHING.md) | [Kiwi native 21 milestone](KG-DIR-10-TWENTYONE-NATIVE-RELEASE.md).
