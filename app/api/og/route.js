import { ImageResponse } from 'next/og';
import { formatDate } from '@/lib/config';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

// Auto-generated 1200x630 share card, used when a post has no cover image.
export async function GET(req) {
  const s = await getSettings();
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get('title') || s.siteName).slice(0, 120);
  const rawDate = (searchParams.get('date') || '').slice(0, 10);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? formatDate(rawDate) : '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', background: '#17202e', color: '#ffffff', padding: 72,
          borderLeft: `24px solid ${s.accentColor}`,
        }}
      >
        <div style={{ display: 'flex', fontSize: 34, color: '#7fd4d8' }}>{date || s.siteName}</div>
        <div style={{ display: 'flex', fontSize: title.length > 70 ? 56 : 76, fontWeight: 800, lineHeight: 1.1 }}>
          {title}
        </div>
        <div style={{ display: 'flex', fontSize: 34, color: '#9aa6b8' }}>{date ? s.siteName : ''}</div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
