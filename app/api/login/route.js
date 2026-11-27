import { COOKIE_NAME, SESSION_MAX_AGE, createSession, passwordMatches } from '@/lib/auth';

export async function POST(req) {
  if (!process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET) {
    return Response.json(
      { error: 'Server is missing ADMIN_PASSWORD or SESSION_SECRET. Add them in Vercel project settings.' },
      { status: 500 }
    );
  }
  const body = await req.json().catch(() => ({}));
  if (!(await passwordMatches(String(body.password || '')))) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return Response.json({ error: 'Wrong password.' }, { status: 401 });
  }
  const token = await createSession();
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const res = Response.json({ ok: true });
  res.headers.append(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}${secure}`
  );
  return res;
}
