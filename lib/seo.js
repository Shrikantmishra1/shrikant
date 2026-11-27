import { SITE_URL, SITE_LANG, PAGE_SIZE } from './config';
import { plainText } from './markdown';
import { tagKey, truncate } from './text';

export const absoluteUrl = (path = '/') => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
export const postPath = (slug) => `/blog/${slug}`;
export const tagPath = (tag) => `/tag/${encodeURIComponent(tagKey(tag))}`;

export const postSeoTitle = (post) => post.seoTitle || post.title;
export const postDescription = (post) =>
  truncate(post.seoDescription || post.excerpt || plainText(post.content || ''), 160);

// Cover image if there is one, otherwise an auto-generated share card
export function ogImage(title, date, cover) {
  if (cover) return cover;
  const q = `title=${encodeURIComponent(title)}${date ? `&date=${encodeURIComponent(date)}` : ''}`;
  return absoluteUrl(`/api/og?${q}`);
}

export function pageMeta({ s, title, absolute = false, description, path, canonical, image, type = 'website', noindex = false, og = {} }) {
  const url = canonical || absoluteUrl(path);
  const plainTitle = title;
  return {
    title: absolute ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    robots: noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      title: plainTitle,
      description,
      url,
      siteName: s.siteName,
      type,
      locale: SITE_LANG,
      images: image ? [{ url: image, width: 1200, height: 630 }] : undefined,
      ...og,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: plainTitle,
      description,
      images: image ? [image] : undefined,
      site: s.twitterHandle || undefined,
      creator: s.twitterHandle || undefined,
    },
  };
}

export function paginate(items, page, size = PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  return { items: items.slice((page - 1) * size, page * size), totalPages };
}

export function pageNum(searchParams) {
  const n = parseInt(searchParams?.page, 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function topTags(posts, limit = 12) {
  const map = new Map();
  for (const p of posts) {
    for (const t of p.tags || []) {
      const k = tagKey(t);
      const cur = map.get(k) || { key: k, name: t, count: 0 };
      cur.count++;
      map.set(k, cur);
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)).slice(0, limit);
}

// ---------- JSON-LD ----------
const sameAs = (s) => Object.values(s.social || {}).filter(Boolean);
const logoUrl = (s) => s.logoUrl || absoluteUrl('/icon');

export const websiteLd = (s) => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: s.siteName,
  url: SITE_URL,
  description: s.description,
  inLanguage: SITE_LANG,
  publisher: {
    '@type': 'Organization',
    name: s.siteName,
    url: SITE_URL,
    logo: logoUrl(s),
    sameAs: sameAs(s).length ? sameAs(s) : undefined,
  },
});

export const blogLd = (posts, s) => ({
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: s.siteName,
  description: s.description,
  url: SITE_URL,
  inLanguage: SITE_LANG,
  blogPost: posts.map((p) => ({
    '@type': 'BlogPosting',
    headline: p.title,
    url: absoluteUrl(postPath(p.slug)),
    datePublished: p.date,
    image: p.coverImage || undefined,
  })),
});

export const postLd = (post, { image, description, wordCount, s }) => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.title.slice(0, 110),
  description,
  image: [image],
  datePublished: post.date,
  dateModified: post.updatedAt || post.date,
  author: { '@type': 'Person', name: s.authorName },
  publisher: { '@type': 'Organization', name: s.siteName, logo: { '@type': 'ImageObject', url: logoUrl(s) } },
  mainEntityOfPage: { '@type': 'WebPage', '@id': post.canonicalUrl || absoluteUrl(postPath(post.slug)) },
  url: post.canonicalUrl || absoluteUrl(postPath(post.slug)),
  keywords: (post.tags || []).join(', ') || undefined,
  wordCount,
  inLanguage: SITE_LANG,
});

export const breadcrumbLd = (crumbs) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: c.name,
    item: c.url,
  })),
});
