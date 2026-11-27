export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Daily Notes';
export const SITE_TAGLINE = process.env.NEXT_PUBLIC_SITE_TAGLINE || 'One post, every day.';
export const SITE_DESCRIPTION = process.env.NEXT_PUBLIC_SITE_DESCRIPTION || SITE_TAGLINE;
export const AUTHOR_NAME = process.env.NEXT_PUBLIC_AUTHOR_NAME || SITE_NAME;
export const SITE_LANG = process.env.NEXT_PUBLIC_SITE_LANG || 'en';
export const TIMEZONE = process.env.SITE_TIMEZONE || 'Asia/Kolkata';
export const PAGE_SIZE = 10;

const rawHandle = (process.env.NEXT_PUBLIC_TWITTER_HANDLE || '').trim();
export const TWITTER_HANDLE = rawHandle ? (rawHandle.startsWith('@') ? rawHandle : `@${rawHandle}`) : '';

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000')
).replace(/\/$/, '');

// Today's date as YYYY-MM-DD in the blog's timezone
export function todayString() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(new Date());
}

export function formatDate(str) {
  if (!str) return '';
  return new Date(`${str}T00:00:00Z`).toLocaleDateString('en-IN', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
