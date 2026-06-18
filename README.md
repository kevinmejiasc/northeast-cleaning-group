# Northeast Cleaning Group — Website

Marketing site for **Northeast Cleaning Group**, a house & commercial cleaning company serving **Northeast Georgia**.

Static HTML/CSS — no build step. Hosted on **GitHub Pages** at **https://necgga.com**.

## Architecture (hub & spoke for local SEO)

| Page | Purpose |
|------|---------|
| `index.html` | **Regional hub** — ranks for "cleaning service Northeast Georgia" and routes visitors to city pages. |
| `locations/*.html` | **City spokes** — one tailored, locally-written page per city (ranks for "house cleaning <city> GA"). `braselton.html` is the live template. |
| `styles.css` | Shared styles for every page (edit once, applies everywhere). |

Supporting files: `booking.js` (booking popup), `sitemap.xml`, `robots.txt`, `favicon.svg`, `og-image.svg` / `og-image.png`.

## View locally

Just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Add a new city page

1. Copy the template: `cp locations/braselton.html locations/<city-slug>.html`
2. Replace every Braselton-specific reference with the new city — **and write genuinely local content** (neighborhoods, landmarks, counties, ZIP). Do **not** just swap the name; near-duplicate pages get treated as thin/doorway content by Google.
   - `<title>`, `<meta name="description">`, keywords
   - `<link rel="canonical">` and all `og:`/`twitter:` URLs → `https://necgga.com/locations/<city-slug>.html`
   - JSON-LD: `url`, `address`, `geo`, `areaServed`, and the `BreadcrumbList`
   - H1, hero intro, the local paragraph, reviews, and FAQ
3. Add the URL to `sitemap.xml`.
4. On `index.html`, turn that city's `<span class="area-pill">` into a link:
   `<a class="area-pill" href="locations/<city-slug>.html"><span class="pin">📍</span><city></a>`

## Things to fill in before/after launch

- **Phone number** — there is **no public phone** yet (by design). All CTAs route to the booking form. When a real number exists, add `tel:`/`sms:` CTAs and a `telephone` field to the JSON-LD. (No fake/`555` numbers — they hurt trust and schema validity.)
- **Booking popup** — every "Book" CTA opens a popup (`booking.js`) that collects name, phone, service, address, city, zip, notes, then a date and a 1-hour arrival window (8 AM–4 PM), plus optional **add-ons** that raise the total (edit the `ADDONS` list at the top of `booking.js` to change items/prices). Connect your CRM in **one place**: set `BOOKING_WEBHOOK_URL` at the top of `booking.js` to your GoHighLevel / Zapier / Make inbound webhook. Until then it shows the confirmation screen but sends nowhere.
- **OG image** — `og-image.png` (1200×630) is what social platforms show. Regenerate from `og-image.svg` if you change branding.
- **Reviews** — the testimonials are placeholders. Swap in real ones. Only add `Review`/`aggregateRating` schema once they are real, or it violates Google's guidelines.

## Domain / DNS

The site deploys to GitHub Pages and is live immediately at the project URL:
`https://kevinmejiasc.github.io/northeast-cleaning-group/`

To switch to the custom apex domain **necgga.com**:

1. At your DNS registrar, add four **A records** for `necgga.com` →
   `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   (optionally a **CNAME** record for `www` → `kevinmejiasc.github.io`).
2. In the repo: **Settings → Pages → Custom domain → `necgga.com`**, Save, then
   tick **Enforce HTTPS**. GitHub adds the `CNAME` file automatically.

The HTML already uses `https://necgga.com` for canonical / Open Graph / sitemap
URLs, so no code changes are needed at cutover. If the domain ever changes,
find-and-replace `necgga.com` across `*.html`, `sitemap.xml`, and `robots.txt`.
