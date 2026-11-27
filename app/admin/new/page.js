import PostForm from '@/components/PostForm';
import { SITE_URL, todayString } from '@/lib/config';

export const dynamic = 'force-dynamic';

export default function NewPost() {
  return (
    <section>
      <h1>New post</h1>
      <PostForm today={todayString()} siteUrl={SITE_URL} />
    </section>
  );
}
