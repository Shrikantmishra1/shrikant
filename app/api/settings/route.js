import { isAdmin } from '@/lib/auth-server';
import { cleanSettings, saveSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  if (!(await isAdmin())) return Response.json({ error: 'You are signed out. Sign in again.' }, { status: 401 });
  const b = await req.json().catch(() => null);
  if (!b) return Response.json({ error: 'Invalid request.' }, { status: 400 });
  try {
    const clean = cleanSettings(b);
    await saveSettings(clean);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message || 'Could not save.' }, { status: 400 });
  }
}
