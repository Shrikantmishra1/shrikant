# Daily blog (Next.js + Vercel Blob) with full SEO

A daily blog with a password-protected admin. Write posts, upload cover and inline images,
save drafts, schedule posts for a future date, edit and delete. No database needed:
posts and images are stored in Vercel Blob.

## Deploy

1. Push this folder to a GitHub repo and import it into Vercel.
2. In the project: **Storage → Create → Blob** → connect it to the project (adds `BLOB_READ_WRITE_TOKEN`).
3. **Settings → Environment Variables**, add at least:
   - `ADMIN_PASSWORD`, `SESSION_SECRET`
   - `NEXT_PUBLIC_SITE_URL` (your final domain, e.g. `https://myblog.com`)
   - `NEXT_PUBLIC_SITE_NAME`, `NEXT_PUBLIC_SITE_DESCRIPTION`, `NEXT_PUBLIC_AUTHOR_NAME`
   (see `.env.example` for all options)
4. **Redeploy**, then open `/admin`.

## Run locally

```bash
npm install
npx vercel link
npx vercel env pull .env.local
npm run dev
```

## Site settings (Admin → Settings)

Change these without redeploying. They are saved in Blob (`meta/settings.json`) and the environment variables stay as fallbacks.
- **General:** site title, tagline, description, author, X handle
- **Look:** accent colour, light/dark/auto theme, logo, favicon, default share image
- **Social:** profile links shown in the footer and sent to Google
- **Google & SEO:** guided Google Search Console setup (paste the tag, check it is live, copy the sitemap link), Bing code, Google Analytics ID, quick tests

Changes can take up to about a minute to show publicly.

## SEO features

**Per post (Admin → New post → "Search and sharing")**
- SEO title and meta description with character counters and a live Google-style preview
- Falls back to post title, summary, then the first words of the post
- Cover image alt text, tags, canonical URL override, and a "hide from search engines" switch
- SEO checklist (title/description length, cover, alt text, tags, 300+ words)

**Automatic on the site**
- Canonical URL, Open Graph and Twitter Card tags on every page
- Auto-generated 1200×630 share image (`/api/og`) for posts with no cover image
- JSON-LD structured data: `WebSite`, `Blog`, `BlogPosting`, `BreadcrumbList`
- `sitemap.xml` (home, posts, tag pages, with last-modified dates) and `robots.txt`
- RSS feed at `/feed.xml`, advertised in the page head for feed readers
- Tag pages at `/tag/<tag>`, related posts, previous/next links, breadcrumbs (internal linking)
- Paginated home and tag pages (10 per page) with correct canonicals
- Reading time, byline and "Updated" date on posts
- One `h1` per page, semantic HTML, `lang` attribute, favicon, theme colour
- Fast pages: a post index (one fetch for all lists), CDN caching (`s-maxage=60`), prioritised cover image
- Optional: Google Search Console / Bing verification tags and Google Analytics 4 via env vars

## After you go live (5 minutes)

1. Set `NEXT_PUBLIC_SITE_URL` to your real domain and redeploy.
2. **Google Search Console**: add your site, verify (use `GOOGLE_SITE_VERIFICATION`), then submit `https://yourdomain/sitemap.xml`.
3. **Bing Webmaster Tools**: import from Search Console or add the site and sitemap.
4. Test a post at https://search.google.com/test/rich-results and share a link in WhatsApp/LinkedIn to see the preview card.

## Notes

- Images up to 10 MB (jpg/png/webp/gif/avif) upload straight from the browser to Blob.
- Changes can take up to about a minute to show on the public site (CDN cache).
- The generated share image and favicon use a Latin-only font. Posts with a cover image are unaffected.
- Deleting a post does not delete its images from Blob (remove them in the Vercel Storage tab).
- If posts ever look out of sync, delete the `meta/index.json` file in the Blob store. It is rebuilt automatically.
