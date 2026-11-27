import { cookies } from 'next/headers';
import { COOKIE_NAME, verifySession } from './auth';

export async function isAdmin() {
  return verifySession(cookies().get(COOKIE_NAME)?.value);
}
