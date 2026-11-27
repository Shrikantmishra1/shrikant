import { getAllPosts } from '@/lib/posts';
import { absoluteUrl, postPath, tagPath, topTags } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export default async function sitemap() {
  const posts = await getAllPosts();
  const indexable = posts.filter((p) => !p.noindex);
  const newest = posts[0] ? new Date(posts[0].updatedAt || posts[0].date) : new Date();

  return [
    { url: absoluteUrl('/'), lastModified: newest, changeFrequency: 'daily', priority: 1 },
    ...indexable.map((p) => ({
      url: absoluteUrl(postPath(p.slug)),
      lastModified: new Date(p.updatedAt || p.date),
      changeFrequency: 'monthly',
      priority: 0.8,
    })),
    ...topTags(posts, 500).map((t) => ({
      url: absoluteUrl(tagPath(t.name)),
      lastModified: newest,
      changeFrequency: 'weekly',
      priority: 0.4,
    })),
  ];
}
