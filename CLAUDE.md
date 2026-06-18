# CLAUDE.md — Northeast Cleaning Group site

Static marketing site (plain HTML/CSS, no build, no framework). Hosted on GitHub Pages → **necgga.com**.

## Brand facts (use exactly)
- **Name:** Northeast Cleaning Group
- **Region:** Northeast Georgia (Jackson, Barrow, Hall, Gwinnett, Athens-Clarke, etc.)
- **Domain (canonical, apex):** `https://necgga.com/`
- **Phone:** NONE yet. Do **not** add `tel:`/`sms:` links or a `telephone` field to schema until the user provides a real number. CTAs route to `#book` / `#instant-price`. Never invent a number (no `555`).
- **Colors:** teal `#0E6E7C`, ink `#11343B`, sun `#F5B53F`, mist `#F0F6F7`. Fonts: Outfit (display) + Inter (body).

## Structure
- `index.html` — regional hub (NE Georgia).
- `locations/<city>.html` — one page per city (spoke). `braselton.html` is the reference implementation.
- `styles.css` — shared; all pages link it (`styles.css` from root, `../styles.css` from `locations/`).
- Paths are **relative** for assets/internal links (so the github.io preview works too); only `canonical`, `og:`, `twitter:`, sitemap, and schema URLs are absolute `necgga.com`.

## Adding a city page (see README for the full checklist)
Copy `locations/braselton.html`, then rewrite ALL of: title/description/keywords, canonical + OG/Twitter URLs, JSON-LD (`url`, `address`, `geo`, `areaServed`, `BreadcrumbList`), H1, hero/local paragraph, reviews, FAQ. Add to `sitemap.xml` and link the pill in `index.html`'s `#areas`. **Each city page must have unique, genuinely local copy** — no name-swap clones (doorway-page risk).

## SEO conventions
- Exactly one `<h1>` per page.
- Keep the JSON-LD `@graph`: `LocalBusiness`+`HouseCleaner`, `WebSite` (hub only), `FAQPage` (mirror the on-page FAQ), `BreadcrumbList` (city pages).
- No `aggregateRating`/`Review` schema while testimonials are placeholders.
- Update `sitemap.xml` `lastmod` when content changes.

## Deploy
Repo `kevinmejiasc/northeast-cleaning-group`, branch `main`, GitHub Pages serves from root. Commit + push to deploy. Custom domain `necgga.com` is set via Settings → Pages once DNS A-records are pointed (GitHub then writes the `CNAME` file). Until then the site is live at `https://kevinmejiasc.github.io/northeast-cleaning-group/`.
