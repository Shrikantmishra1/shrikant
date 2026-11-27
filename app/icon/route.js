import { ImageResponse } from 'next/og';
import { getSettings, inkOn } from '@/lib/settings';

export const dynamic = 'force-dynamic';

// Favicon / search-result icon: your uploaded favicon, otherwise the first letter of the site name
export async function GET() {
  const s = await getSettings();

  if (s.faviconUrl) {
    try {
      const r = await fetch(s.faviconUrl);
      if (r.ok) {
        return new Response(await r.arrayBuffer(), {
          headers: {
            'Content-Type': r.headers.get('content-type') || 'image/png',
            'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600',
          },
        });
      }
    } catch {}
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: s.accentColor, color: inkOn(s.accentColor), fontSize: 320, fontWeight: 800,
        }}
      >
        {s.siteName.charAt(0).toUpperCase()}
      </div>
    ),
    { width: 512, height: 512 }
  );
}
