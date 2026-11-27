import { isAdmin } from '@/lib/auth-server';
import { SITE_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';

// Looks at your live home page and reports which verification tags are really being served.
export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: 'Signed out.' }, { status: 401 });
  try {
    const res = await fetch(`${SITE_URL}/?check=${Date.now()}`, { cache: 'no-store', headers: { 'User-Agent': 'SettingsCheck' } });
    const html = await res.text();
    const find = (name) => {
      const m = html.match(new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']+)["']`, 'i'))
        || html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${name}["']`, 'i'));
      return m ? m[1] : '';
    };
    const ga = (html.match(/googletagmanager\.com\/gtag\/js\?id=(G-[A-Z0-9]+)/) || [])[1] || '';
    return Response.json({
      ok: res.ok,
      status: res.status,
      google: find('google-site-verification'),
      bing: find('msvalidate.01'),
      ga,
      siteUrl: SITE_URL,
    });
  } catch {
    return Response.json({ ok: false, error: 'Could not reach your site. If this is local, deploy first.' });
  }
}
