import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import PostList from '@/components/PostList';
import Pagination from '@/components/Pagination';
import { getAllPosts } from '@/lib/posts';
import { getSettings } from '@/lib/settings';
import { tagKey } from '@/lib/text';
import { absoluteUrl, breadcrumbLd, ogImage, pageMeta, pageNum, paginate, tagPath } from '@/lib/seo';

export const dynamic = 'force-dynamic';

function decode(s) {
  try { return decodeURIComponent(s); } catch { return s; }
}

async function load(rawTag) {
  const key = decode(rawTag);
  const all = await getAllPosts();
  const posts = all.filter((p) => (p.tags || []).some((t) => tagKey(t) === key));
  const name = posts.length ? posts[0].tags.find((t) => tagKey(t) === key) : key;
  return { key, name, posts };
}

export async function generateMetadata({ params, searchParams }) {
  const s = await getSettings();
  const { name, posts } = await load(params.tag);
  if (!posts.length) return { title: 'Topic not found' };
  const page = pageNum(searchParams);
  const base = tagPath(name);
  return pageMeta({
    s,
    title: `${name}${page > 1 ? `, page ${page}` : ''}`,
    description: `${posts.length} ${posts.length === 1 ? 'post' : 'posts'} about ${name} on ${s.siteName}.`,
    path: page > 1 ? `${base}?page=${page}` : base,
    image: ogImage(`${name} on ${s.siteName}`),
  });
}

export default async function TagPage({ params, searchParams }) {
  const s = await getSettings();
  const { name, posts } = await load(params.tag);
  if (!posts.length) notFound();
  const page = pageNum(searchParams);
  const { items, totalPages } = paginate(posts, page);
  if (!items.length) notFound();
  const base = tagPath(name);

  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: s.siteName, url: absoluteUrl('/') },
          { name, url: absoluteUrl(base) },
        ])}
      />
      <header className="tag-head">
        <p className="muted">Topic</p>
        <h1 className="post-title">{name}</h1>
        <p className="muted">{posts.length} {posts.length === 1 ? 'post' : 'posts'}</p>
      </header>
      <PostList posts={items} label={`Posts about ${name}`} />
      <Pagination page={page} totalPages={totalPages} basePath={base} />
    </>
  );
}
