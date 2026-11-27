export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Stable key for a tag (used in /tag/<key>). Falls back to the raw text for non-Latin tags.
export function tagKey(tag) {
  return slugify(tag) || String(tag).trim().toLowerCase();
}

export function parseTags(input) {
  const arr = Array.isArray(input) ? input : String(input || '').split(',');
  const seen = new Set();
  const out = [];
  for (const raw of arr) {
    const t = String(raw).trim().replace(/^#/, '').trim().replace(/\s+/g, ' ').slice(0, 30);
    if (!t) continue;
    const k = tagKey(t);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
    if (out.length >= 8) break;
  }
  return out;
}

export function countWords(s) {
  const t = String(s || '').trim();
  return t ? t.split(/\s+/).length : 0;
}

export const readingMinutes = (words) => Math.max(1, Math.round(words / 200));

export function truncate(s, n) {
  s = String(s || '').replace(/\s+/g, ' ').trim();
  if (s.length <= n) return s;
  const cut = s.slice(0, n - 1);
  const sp = cut.lastIndexOf(' ');
  return (sp > n * 0.6 ? cut.slice(0, sp) : cut).replace(/[.,;:!\-–\s]+$/, '') + '…';
}
