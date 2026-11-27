// Works in both the Edge runtime (middleware) and Node (route handlers).
export const COOKIE_NAME = 'admin_session';
const SESSION_DAYS = 7;
export const SESSION_MAX_AGE = SESSION_DAYS * 24 * 3600;
const enc = new TextEncoder();

async function hmac(message) {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(process.env.SESSION_SECRET || ''),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function passwordMatches(input) {
  const real = process.env.ADMIN_PASSWORD || '';
  if (!real) return false;
  return safeEqual(await hmac('pw:' + input), await hmac('pw:' + real));
}

export async function createSession() {
  const exp = String(Date.now() + SESSION_DAYS * 24 * 3600 * 1000);
  return `${exp}.${await hmac(exp)}`;
}

export async function verifySession(token) {
  if (!token || !process.env.SESSION_SECRET) return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return safeEqual(sig, await hmac(exp));
}
