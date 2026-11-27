import { put, list, del } from '@vercel/blob';
import { todayString } from './config';
import { SLUG_RE, countWords } from './text';
import { plainText } from './markdown';

const PREFIX = 'posts/';
const INDEX_PATH = 'meta/index.json';

const bust = (url) => `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;

async function readJson(blob) {
  try {
    const r = await fetch(bust(blob.url), { cache: 'no-store' });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

async function findBlob(path) {
  const res = await list({ prefix: path, limit: 5 });
  return res.blobs.find((b) => b.pathname === path) || null;
}

const isLive = (p) => p.published && p.date <= todayString();

// Index entries = post without its body (keeps list pages, sitemap and feeds to one fetch)
function summarize(p) {
  const { content, ...rest } = p;
  return { ...rest, wordCount: countWords(plainText(content)) };
}

async function writeIndex(items) {
  await put(INDEX_PATH, JSON.stringify(items), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
}

async function rebuildIndex() {
  const blobs = [];
  let cursor;
  do {
    const res = await list({ prefix: PREFIX, cursor, limit: 1000 });
    blobs.push(...res.blobs);
    cursor = res.hasMore ? res.cursor : undefined;
  } while (cursor);
  const posts = (await Promise.all(blobs.map(readJson))).filter(Boolean);
  const items = posts.map(summarize);
  await writeIndex(items);
  return items;
}

async function readIndex() {
  const blob = await findBlob(INDEX_PATH);
  if (!blob) return rebuildIndex();
  const data = await readJson(blob);
  return Array.isArray(data) ? data : rebuildIndex();
}

// List of posts (without body), newest first.
export async function getAllPosts({ includeDrafts = false } = {}) {
  const items = await readIndex();
  return items
    .filter((p) => includeDrafts || isLive(p))
    .sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || '').localeCompare(a.createdAt || ''));
}

// One full post, including body.
export async function getPost(slug, { includeDrafts = false } = {}) {
  if (!SLUG_RE.test(slug)) return null;
  const blob = await findBlob(`${PREFIX}${slug}.json`);
  if (!blob) return null;
  const post = await readJson(blob);
  if (!post) return null;
  if (!includeDrafts && !isLive(post)) return null;
  return post;
}

export async function savePost(post) {
  await put(`${PREFIX}${post.slug}.json`, JSON.stringify(post), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
  const items = (await readIndex()).filter((p) => p.slug !== post.slug);
  items.push(summarize(post));
  await writeIndex(items);
}

export async function deletePost(slug) {
  const blob = await findBlob(`${PREFIX}${slug}.json`);
  if (blob) await del(blob.url);
  const items = (await readIndex()).filter((p) => p.slug !== slug);
  await writeIndex(items);
}
