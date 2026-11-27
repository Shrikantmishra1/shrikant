import { getAllPosts, getPost } from '@/lib/posts';
import { SITE_URL, SITE_LANG } from '@/lib/config';
import { getSettings } from '@/lib/settings';
import { renderMarkdown } from '@/lib/markdown';
import { absoluteUrl, postDescription, postPath } from '@/lib/seo';

export const dynamic = 'force-dynamic';

const x = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cdata = (s) => `<![CDATA[${String(s).replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;

export async function GET() {
  const s = await getSettings();
  const latest = (await getAllPosts()).filter((p) => !p.noindex).slice(0, 20);
  const posts = (await Promise.all(latest.map((p) => getPost(p.slug)))).filter(Boolean);

  const items = posts
    .map((p) => {
      const url = absoluteUrl(postPath(p.slug));
      const cover = p.coverImage ? `<p><img src="${x(p.coverImage)}" alt="${x(p.coverAlt || p.title)}"></p>` : '';
      return `<item>
<title>${x(p.title)}</title>
<link>${url}</link>
<guid isPermaLink="true">${url}</guid>
<pubDate>${new Date(`${p.date}T00:00:00Z`).toUTCString()}</pubDate>
<description>${x(postDescription(p))}</description>
${(p.tags || []).map((t) => `<category>${x(t)}</category>`).join('')}
<content:encoded>${cdata(cover + renderMarkdown(p.content))}</content:encoded>
</item>`;
    })
    .join('\n');

  const last = posts[0] ? new Date(posts[0].updatedAt || `${posts[0].date}T00:00:00Z`) : new Date();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
<title>${x(s.siteName)}</title>
<link>${SITE_URL}</link>
<description>${x(s.description)}</description>
<language>${x(SITE_LANG)}</language>
<lastBuildDate>${last.toUTCString()}</lastBuildDate>
<atom:link href="${absoluteUrl('/feed.xml')}" rel="self" type="application/rss+xml"/>
${items}
</channel>
</rss>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
