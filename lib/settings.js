import { put, list } from '@vercel/blob';
import { cache } from 'react';
import { SITE_NAME, SITE_TAGLINE, SITE_DESCRIPTION, AUTHOR_NAME, TWITTER_HANDLE } from './config';

// Site settings live in Blob (meta/settings.json). Environment variables stay as fallbacks,
// so an empty field in admin means "use the default".
const PATH = 'meta/settings.json';
const TTL = 30_000;
let mem = { at: 0, data: null, url: '' };

export const SOCIALS = ['twitter', 'facebook', 'instagram', 'youtube', 'linkedin', 'github'];
export const DEFAULT_ACCENT = '#0d6e73';

export function defaults() {
  return {
    siteName: SITE_NAME,
    tagline: SITE_TAGLINE,
    description: SITE_DESCRIPTION,
    authorName: AUTHOR_NAME,
    twitterHandle: TWITTER_HANDLE,
    accentColor: DEFAULT_ACCENT,
    theme: 'auto',
    logoUrl: '',
    faviconUrl: '',
    defaultOgImage: '',
    social: Object.fromEntries(SOCIALS.map((k) => [k, ''])),
    gaId: process.env.NEXT_PUBLIC_GA_ID || '',
    googleVerification: process.env.GOOGLE_SITE_VERIFICATION || '',
    bingVerification: process.env.BING_SITE_VERIFICATION || '',
  };
}

function merge(stored) {
  const d = defaults();
  if (!stored || typeof stored !== 'object') return d;
  const out = { ...d };
  for (const k of Object.keys(d)) {
    if (k === 'social') continue;
    const v = stored[k];
    if (typeof v === 'string' && v.trim()) out[k] = v.trim();
  }
  out.social = { ...d.social };
  for (const k of SOCIALS) {
    const v = stored.social?.[k];
    if (typeof v === 'string' && v.trim()) out.social[k] = v.trim();
  }
  return out;
}

async function readStored() {
  try {
    let url = mem.url;
    if (!url) {
      const res = await list({ prefix: PATH, limit: 5 });
      url = res.blobs.find((b) => b.pathname === PATH)?.url || '';
      mem.url = url;
    }
    if (!url) return null;
    const r = await fetch(`${url}?t=${Date.now()}`, { cache: 'no-store' });
    return r.ok ? await r.json() : null;
  } catch {
    return null; // never break the site because settings could not load
  }
}

// What admin shows in the form: only what was saved (blank = use default)
export async function getStoredSettings() {
  return (await readStored()) || {};
}

export const getSettings = cache(async () => {
  if (mem.data && Date.now() - mem.at < TTL) return mem.data;
  const data = merge(await readStored());
  mem = { ...mem, at: Date.now(), data };
  return data;
});

// ---------- validation ----------
const str = (v, n) => String(v ?? '').trim().slice(0, n);

function httpsUrl(v, label) {
  const s = str(v, 500);
  if (!s) return '';
  let u;
  try { u = new URL(s); } catch { throw new Error(`${label} must be a full link starting with https://`); }
  if (u.protocol !== 'https:') throw new Error(`${label} must start with https://`);
  return u.toString();
}

// Accepts the whole <meta ... content="CODE"> tag or just the code
export function extractCode(v) {
  const s = str(v, 600);
  const m = s.match(/content\s*=\s*["']([^"']+)["']/i);
  return (m ? m[1] : s).trim();
}

function code(v, label) {
  const c = extractCode(v);
  if (!c) return '';
  if (!/^[A-Za-z0-9_\-]{8,120}$/.test(c)) throw new Error(`${label} does not look right. Paste only the code or the full meta tag.`);
  return c;
}

export function cleanSettings(b) {
  const accent = str(b.accentColor, 7);
  if (accent && !/^#[0-9a-fA-F]{6}$/.test(accent)) throw new Error('Accent colour must look like #0d6e73.');
  const theme = ['auto', 'light', 'dark'].includes(b.theme) ? b.theme : 'auto';
  let handle = str(b.twitterHandle, 40).replace(/^@+/, '');
  if (handle && !/^\w{1,15}$/.test(handle)) throw new Error('Twitter/X handle can only use letters, numbers and underscore.');
  const gaId = str(b.gaId, 20).toUpperCase();
  if (gaId && !/^G-[A-Z0-9]+$/.test(gaId)) throw new Error('Google Analytics ID looks like G-XXXXXXXXXX.');

  const social = {};
  for (const k of SOCIALS) social[k] = httpsUrl(b.social?.[k], `${k[0].toUpperCase()}${k.slice(1)} link`);

  return {
    siteName: str(b.siteName, 60),
    tagline: str(b.tagline, 120),
    description: str(b.description, 300),
    authorName: str(b.authorName, 60),
    twitterHandle: handle ? `@${handle}` : '',
    accentColor: accent.toLowerCase(),
    theme,
    logoUrl: httpsUrl(b.logoUrl, 'Logo'),
    faviconUrl: httpsUrl(b.faviconUrl, 'Favicon'),
    defaultOgImage: httpsUrl(b.defaultOgImage, 'Default share image'),
    social,
    gaId,
    googleVerification: code(b.googleVerification, 'Google verification code'),
    bingVerification: code(b.bingVerification, 'Bing verification code'),
  };
}

export async function saveSettings(clean) {
  const res = await put(PATH, JSON.stringify(clean), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
  mem = { at: Date.now(), data: merge(clean), url: res.url };
}

// Readable text colour on top of the accent colour
export function inkOn(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? '#0b1018' : '#ffffff';
}
