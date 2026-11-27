import { NextResponse } from 'next/server';
import { COOKIE_NAME, verifySession } from './lib/auth';

export async function middleware(req) {
  if (req.nextUrl.pathname === '/admin/login') return NextResponse.next();
  const ok = await verifySession(req.cookies.get(COOKIE_NAME)?.value);
  if (!ok) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*'] };
