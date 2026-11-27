import { notFound } from 'next/navigation';
import PostForm from '@/components/PostForm';
import { getPost } from '@/lib/posts';
import { SITE_URL, todayString } from '@/lib/config';

export const dynamic = 'force-dynamic';

export default async function EditPost({ params }) {
  const post = await getPost(params.slug, { includeDrafts: true });
  if (!post) notFound();
  return (
    <section>
      <h1>Edit post</h1>
      <PostForm initial={post} isEdit today={todayString()} siteUrl={SITE_URL} />
    </section>
  );
}
