import SettingsForm from '@/components/SettingsForm';
import { getAllPosts } from '@/lib/posts';
import { SITE_URL } from '@/lib/config';
import { defaults, getStoredSettings } from '@/lib/settings';
import { postPath } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const [stored, posts] = await Promise.all([getStoredSettings(), getAllPosts()]);
  const latest = posts[0] ? `${SITE_URL}${postPath(posts[0].slug)}` : '';
  return (
    <section>
      <h1>Site settings</h1>
      <SettingsForm initial={stored} defaults={defaults()} siteUrl={SITE_URL} latestUrl={latest} />
    </section>
  );
}
