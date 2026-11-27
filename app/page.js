import Link from 'next/link';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import PostList from '@/components/PostList';
import Pagination from '@/components/Pagination';
import { getAllPosts } from '@/lib/posts';
import { formatDate } from '@/lib/config';
import { getSettings } from '@/lib/settings';
import { blogLd, ogImage, pageMeta, pageNum, paginate, tagPath, topTags } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }) {
  const s = await getSettings();
  const page = pageNum(searchParams);
  return pageMeta({
    s,
    title: page > 1 ? `Page ${page}` : s.siteName,
    absolute: page === 1,
    description: s.description,
    path: page > 1 ? `/?page=${page}` : '/',
    image: s.defaultOgImage || ogImage(s.siteName),
  });
}

export default async function Home({ searchParams }) {
  const s = await getSettings();
  const all = await getAllPosts();
  const page = pageNum(searchParams);
  const { items, totalPages } = paginate(all, page);
  if (page > 1 && !items.length) notFound();

  if (!all.length) {
    return (
      <section className="empty">
        <h1>{s.siteName}</h1>
        <p>No posts yet. Sign in to the <Link href="/admin">admin</Link> to write the first one.</p>
      </section>
    );
  }

  const featured = page === 1 ? items[0] : null;
  const list = featured ? items.slice(1) : items;
  const tags = topTags(all);

  return (
    <>
      <h1 className="sr-only">{s.siteName}: {s.tagline}</h1>
      <JsonLd data={blogLd(items, s)} />

      {featured && (
        <article className="feature">
          <Link href={`/blog/${featured.slug}`} className="feature-link">
            {featured.coverImage && (
              <img className="feature-img" src={featured.coverImage} alt={featured.coverAlt || ''} fetchpriority="high" decoding="async" />
            )}
            <time className="date" dateTime={featured.date}>{formatDate(featured.date)}</time>
            <h2 className="feature-title">{featured.title}</h2>
            {featured.excerpt && <p className="feature-excerpt">{featured.excerpt}</p>}
          </Link>
        </article>
      )}

      {page === 1 && tags.length > 0 && (
        <nav className="tags topics" aria-label="Topics">
          {tags.map((t) => (
            <Link key={t.key} className="tag-pill" href={tagPath(t.name)}>{t.name}</Link>
          ))}
        </nav>
      )}

      {list.length > 0 && <PostList posts={list} label="Posts" />}
      <Pagination page={page} totalPages={totalPages} basePath="/" />
    </>
  );
}
