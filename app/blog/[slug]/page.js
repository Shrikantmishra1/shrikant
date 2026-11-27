import Link from 'next/link';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import { getAllPosts, getPost } from '@/lib/posts';
import { formatDate } from '@/lib/config';
import { getSettings } from '@/lib/settings';
import { plainText, renderMarkdown } from '@/lib/markdown';
import { countWords, readingMinutes, tagKey } from '@/lib/text';
import {
  absoluteUrl, breadcrumbLd, ogImage, pageMeta, postDescription, postLd, postPath, postSeoTitle, tagPath,
} from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const s = await getSettings();
  const post = await getPost(params.slug);
  if (!post) return { title: 'Post not found' };
  return pageMeta({
    s,
    title: postSeoTitle(post),
    description: postDescription(post),
    path: postPath(post.slug),
    canonical: post.canonicalUrl || undefined,
    image: ogImage(post.title, post.date, post.coverImage),
    type: 'article',
    noindex: post.noindex,
    og: {
      publishedTime: post.date,
      modifiedTime: post.updatedAt || post.date,
      authors: [s.authorName],
      tags: post.tags?.length ? post.tags : undefined,
    },
  });
}

export default async function PostPage({ params }) {
  const s = await getSettings();
  const post = await getPost(params.slug);
  if (!post) notFound();

  const all = await getAllPosts();
  const idx = all.findIndex((p) => p.slug === post.slug);
  const newer = idx > 0 ? all[idx - 1] : null;
  const older = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;

  const keys = new Set((post.tags || []).map(tagKey));
  const related = all
    .filter((p) => p.slug !== post.slug)
    .map((p) => ({ p, score: (p.tags || []).filter((t) => keys.has(tagKey(t))).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.p.date.localeCompare(a.p.date))
    .slice(0, 3)
    .map((x) => x.p);

  const words = countWords(plainText(post.content));
  const mins = readingMinutes(words);
  const updatedDay = (post.updatedAt || '').slice(0, 10);
  const url = absoluteUrl(postPath(post.slug));

  return (
    <article className="post">
      <JsonLd
        data={postLd(post, {
          image: ogImage(post.title, post.date, post.coverImage),
          description: postDescription(post),
          wordCount: words,
          s,
        })}
      />
      <JsonLd
        data={breadcrumbLd([
          { name: s.siteName, url: absoluteUrl('/') },
          { name: post.title, url },
        ])}
      />

      <nav aria-label="Breadcrumb" className="crumbs">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{post.title}</span>
      </nav>

      <time className="date" dateTime={post.date}>{formatDate(post.date)}</time>
      <h1 className="post-title">{post.title}</h1>
      <p className="byline">
        By {s.authorName}. {mins} min read.
        {updatedDay && updatedDay > post.date ? ` Updated ${formatDate(updatedDay)}.` : ''}
      </p>

      {post.coverImage && (
        <img className="post-cover" src={post.coverImage} alt={post.coverAlt || ''} fetchpriority="high" decoding="async" />
      )}

      <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }} />

      {post.tags?.length > 0 && (
        <p className="tags">
          {post.tags.map((t) => (
            <Link key={t} className="tag-pill" href={tagPath(t)}>{t}</Link>
          ))}
        </p>
      )}

      {(newer || older) && (
        <nav className="postnav" aria-label="More posts">
          {older ? (
            <Link href={postPath(older.slug)} rel="prev">
              <small>Previous post</small>
              <span>{older.title}</span>
            </Link>
          ) : <span />}
          {newer ? (
            <Link href={postPath(newer.slug)} rel="next" className="postnav-next">
              <small>Next post</small>
              <span>{newer.title}</span>
            </Link>
          ) : <span />}
        </nav>
      )}

      {related.length > 0 && (
        <aside className="related" aria-label="Related posts">
          <h2>Related posts</h2>
          <ul>
            {related.map((p) => (
              <li key={p.slug}>
                <Link href={postPath(p.slug)}>{p.title}</Link>
                <span className="muted">{formatDate(p.date)}</span>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </article>
  );
}
