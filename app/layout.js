import './globals.css';
import Link from 'next/link';
import { Newsreader, Bricolage_Grotesque } from 'next/font/google';
import JsonLd from '@/components/JsonLd';
import Analytics from '@/components/Analytics';
import { SITE_URL, SITE_LANG } from '@/lib/config';
import { absoluteUrl, websiteLd } from '@/lib/seo';
import { DEFAULT_ACCENT, getSettings, inkOn } from '@/lib/settings';

const serif = Newsreader({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-serif', display: 'swap' });
const sans = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export async function generateViewport() {
  const s = await getSettings();
  return { width: 'device-width', initialScale: 1, themeColor: s.accentColor };
}

export async function generateMetadata() {
  const s = await getSettings();
  const ogImg = s.defaultOgImage || absoluteUrl(`/api/og?title=${encodeURIComponent(s.siteName)}`);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: s.siteName, template: `%s | ${s.siteName}` },
    description: s.description,
    applicationName: s.siteName,
    authors: [{ name: s.authorName }],
    creator: s.authorName,
    icons: { icon: [{ url: '/icon' }], apple: [{ url: '/icon' }] },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
    },
    openGraph: {
      siteName: s.siteName,
      type: 'website',
      locale: SITE_LANG,
      images: [{ url: ogImg, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', site: s.twitterHandle || undefined, creator: s.twitterHandle || undefined },
    verification: {
      google: s.googleVerification || undefined,
      other: s.bingVerification ? { 'msvalidate.01': s.bingVerification } : undefined,
    },
  };
}

const SOCIAL_LABELS = { twitter: 'X', facebook: 'Facebook', instagram: 'Instagram', youtube: 'YouTube', linkedin: 'LinkedIn', github: 'GitHub' };

export default async function RootLayout({ children }) {
  const s = await getSettings();
  const customAccent = s.accentColor && s.accentColor !== DEFAULT_ACCENT;
  const socials = Object.entries(s.social).filter(([, v]) => v);

  return (
    <html lang={SITE_LANG} className={`${serif.variable} ${sans.variable}`} data-theme={s.theme === 'auto' ? undefined : s.theme}>
      <head>
        <link rel="alternate" type="application/rss+xml" title={`${s.siteName} feed`} href="/feed.xml" />
        {customAccent && (
          <style dangerouslySetInnerHTML={{ __html: `:root:root:root{--accent:${s.accentColor};--accent-ink:${inkOn(s.accentColor)}}` }} />
        )}
      </head>
      <body>
        <div className="bg-orbs" aria-hidden="true"><span /><span /><span /></div>
        <div className="progress" aria-hidden="true" />
        <JsonLd data={websiteLd(s)} />
        <header className="masthead">
          <Link href="/" className="brand-wrap">
            {s.logoUrl && <img className="brand-logo" src={s.logoUrl} alt="" />}
            <span className="brand">{s.siteName}</span>
          </Link>
          <span className="tagline">{s.tagline}</span>
        </header>
        <main className="page">{children}</main>
        <footer className="footer">
          <span>© {new Date().getFullYear()} {s.siteName}</span>
          <span className="footer-links">
            {socials.map(([k, url]) => (
              <a key={k} href={url} target="_blank" rel="noopener noreferrer me">{SOCIAL_LABELS[k]}</a>
            ))}
            <a href="/feed.xml">RSS</a>
            <a href="/sitemap.xml">Sitemap</a>
            <Link href="/admin">Admin</Link>
          </span>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
