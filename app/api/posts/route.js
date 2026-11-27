import { isAdmin } from '@/lib/auth-server';
import { deletePost, getPost, savePost } from '@/lib/posts';
import { SLUG_RE, parseTags, slugify } from '@/lib/text';
import { todayString } from '@/lib/config';

export const dynamic = 'force-dynamic';

const unauthorized = () => Response.json({ error: 'You are signed out. Sign in again.' }, { status: 401 });
const bad = (error, status = 400) => Response.json({ error }, { status });

export async function POST(req) {
  if (!(await isAdmin())) return unauthorized();
  const b = await req.json().catch(() => null);
  if (!b) return bad('Invalid request.');

  const title = String(b.title || '').trim();
  if (!title) return bad('Add a title.');

  const date = String(b.date || todayString());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return bad('Pick a valid date.');

  const coverImage = String(b.coverImage || '');
  if (coverImage && !/^https:\/\//.test(coverImage)) return bad('Cover image must be an https link.');

  let canonicalUrl = String(b.canonicalUrl || '').trim();
  if (canonicalUrl) {
    try {
      const u = new URL(canonicalUrl);
      if (!/^https?:$/.test(u.protocol)) throw new Error();
      canonicalUrl = u.toString();
    } catch {
      return bad('Canonical URL must be a full link starting with https://');
    }
  }

  const isEdit = Boolean(b.isEdit);
  const slug = isEdit ? String(b.slug || '') : slugify(String(b.slug || '') || title) || `post-${date}`;
  if (!SLUG_RE.test(slug)) return bad('Link can only use letters, numbers and hyphens.');

  const existing = await getPost(slug, { includeDrafts: true });
  if (!isEdit && existing) return bad('A post with this link already exists. Change the link or title.', 409);
  if (isEdit && !existing) return bad('Post not found.', 404);

  const now = new Date().toISOString();
  await savePost({
    slug,
    title,
    date,
    excerpt: String(b.excerpt || '').trim().slice(0, 300),
    content: String(b.content || ''),
    coverImage,
    coverAlt: String(b.coverAlt || '').trim().slice(0, 125),
    seoTitle: String(b.seoTitle || '').trim().slice(0, 120),
    seoDescription: String(b.seoDescription || '').trim().slice(0, 200),
    tags: parseTags(b.tags),
    canonicalUrl,
    noindex: Boolean(b.noindex),
    published: Boolean(b.published),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  });
  return Response.json({ ok: true, slug });
}

export async function DELETE(req) {
  if (!(await isAdmin())) return unauthorized();
  const slug = new URL(req.url).searchParams.get('slug') || '';
  if (!SLUG_RE.test(slug)) return bad('Invalid post.');
  await deletePost(slug);
  return Response.json({ ok: true });
}
