'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { upload } from '@vercel/blob/client';
import { countWords, parseTags, slugify } from '@/lib/text';

const cleanName = (n) => n.replace(/[^\w.\-]/g, '-');

export default function PostForm({ initial, isEdit = false, today, siteUrl = '' }) {
  const router = useRouter();
  const textRef = useRef(null);
  const [form, setForm] = useState({
    title: initial?.title || '',
    slug: initial?.slug || '',
    date: initial?.date || today,
    excerpt: initial?.excerpt || '',
    content: initial?.content || '',
    coverImage: initial?.coverImage || '',
    coverAlt: initial?.coverAlt || '',
    seoTitle: initial?.seoTitle || '',
    seoDescription: initial?.seoDescription || '',
    tags: (initial?.tags || []).join(', '),
    canonicalUrl: initial?.canonicalUrl || '',
    noindex: !!initial?.noindex,
    published: initial ? initial.published : true,
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function uploadFile(file) {
    const blob = await upload(`images/${cleanName(file.name)}`, file, {
      access: 'public',
      handleUploadUrl: '/api/upload',
    });
    return blob.url;
  }

  async function onCover(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading('cover');
    try {
      set('coverImage', await uploadFile(file));
    } catch (err) {
      setError(`Image upload failed: ${err.message}`);
    } finally {
      setUploading('');
      e.target.value = '';
    }
  }

  async function onInline(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading('inline');
    const pos = textRef.current ? textRef.current.selectionStart : form.content.length;
    try {
      const url = await uploadFile(file);
      const alt = cleanName(file.name).replace(/\.[^.]+$/, '');
      const md = `\n\n![${alt}](${url})\n\n`;
      setForm((f) => ({ ...f, content: f.content.slice(0, pos) + md + f.content.slice(pos) }));
    } catch (err) {
      setError(`Image upload failed: ${err.message}`);
    } finally {
      setUploading('');
      e.target.value = '';
    }
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, isEdit }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not save the post.');
        setBusy(false);
        return;
      }
      router.push('/admin');
      router.refresh();
    } catch {
      setError('Network error. Try saving again.');
      setBusy(false);
    }
  }

  // ----- SEO helpers -----
  const host = (() => { try { return new URL(siteUrl).host; } catch { return ''; } })();
  const slugPreview = form.slug || slugify(form.title) || 'your-post';
  const serpTitle = form.seoTitle || form.title || 'Post title';
  const serpDesc = form.seoDescription || form.excerpt || 'Add a description so search engines show a clear snippet.';
  const titleLen = (form.seoTitle || form.title).length;
  const descLen = (form.seoDescription || form.excerpt).length;
  const words = countWords(form.content);
  const checks = [
    [titleLen >= 30 && titleLen <= 60, 'Title is 30 to 60 characters'],
    [descLen >= 70 && descLen <= 160, 'Description is 70 to 160 characters'],
    [!!form.coverImage, 'Cover image added'],
    [!!form.coverImage && !!form.coverAlt.trim(), 'Cover image has alt text'],
    [parseTags(form.tags).length > 0, 'At least one tag'],
    [words >= 300, `At least 300 words (now ${words})`],
  ];

  return (
    <form className="editor" onSubmit={save}>
      <label className="field">
        <span>Title</span>
        <input
          className="input input-title"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          required
          autoFocus={!isEdit}
        />
      </label>

      <div className="row">
        <label className="field">
          <span>Date</span>
          <input className="input" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} required />
          <small>A future date schedules the post. It goes live that day.</small>
        </label>
        <label className="field">
          <span>Link</span>
          <input
            className="input"
            value={form.slug}
            disabled={isEdit}
            placeholder="Made from the title"
            onChange={(e) => set('slug', e.target.value)}
          />
          <small>{isEdit ? 'The link stays the same after publishing.' : 'Optional. Letters, numbers, hyphens.'}</small>
        </label>
      </div>

      <div className="field">
        <span>Cover image</span>
        {form.coverImage && (
          <div className="cover-preview">
            <img src={form.coverImage} alt={form.coverAlt || 'Cover preview'} />
          </div>
        )}
        <div className="actions">
          <label className="btn btn-ghost">
            {uploading === 'cover' ? 'Uploading…' : form.coverImage ? 'Replace image' : 'Upload image'}
            <input type="file" accept="image/*" onChange={onCover} hidden disabled={!!uploading} />
          </label>
          {form.coverImage && (
            <button type="button" className="btn btn-ghost" onClick={() => set('coverImage', '')}>
              Remove image
            </button>
          )}
        </div>
        {form.coverImage && (
          <>
            <input
              className="input"
              value={form.coverAlt}
              maxLength={125}
              onChange={(e) => set('coverAlt', e.target.value)}
              placeholder="Describe the image in a few words (alt text)"
              aria-label="Cover image alt text"
            />
            <small>Alt text helps screen readers and image search.</small>
          </>
        )}
      </div>

      <label className="field">
        <span>Summary</span>
        <textarea
          className="input"
          rows={2}
          maxLength={300}
          value={form.excerpt}
          onChange={(e) => set('excerpt', e.target.value)}
          placeholder="One or two sentences shown on the home page"
        />
      </label>

      <div className="field">
        <div className="field-head">
          <span>Post</span>
          <label className="btn btn-ghost btn-small">
            {uploading === 'inline' ? 'Uploading…' : 'Insert image'}
            <input type="file" accept="image/*" onChange={onInline} hidden disabled={!!uploading} />
          </label>
        </div>
        <textarea
          ref={textRef}
          className="input input-body"
          rows={18}
          value={form.content}
          onChange={(e) => set('content', e.target.value)}
          placeholder="Write your post here."
        />
        <small>
          Formatting: <code># Heading</code>, <code>**bold**</code>, <code>*italic*</code>, <code>[text](https://link)</code>,{' '}
          <code>- list item</code>, <code>&gt; quote</code>. Leave a blank line between paragraphs. Edit the image
          description between the square brackets <code>![like this](…)</code>.
        </small>
      </div>

      <label className="field">
        <span>Tags</span>
        <input
          className="input"
          value={form.tags}
          onChange={(e) => set('tags', e.target.value)}
          placeholder="travel, food, notes"
        />
        <small>Separate with commas. Each tag gets its own page that search engines can index.</small>
      </label>

      <fieldset className="seo-box">
        <legend>Search and sharing</legend>

        <div className="serp" aria-label="Search result preview">
          <div className="serp-url">{host}{host ? ' › blog › ' : ''}{slugPreview}</div>
          <div className="serp-title">{serpTitle}</div>
          <div className="serp-desc">{serpDesc}</div>
        </div>

        <label className="field">
          <span>SEO title</span>
          <input
            className="input"
            value={form.seoTitle}
            maxLength={120}
            onChange={(e) => set('seoTitle', e.target.value)}
            placeholder={form.title || 'Uses the post title if empty'}
          />
          <small className={titleLen >= 30 && titleLen <= 60 ? 'count ok' : 'count warn'}>
            {titleLen} characters. Aim for 30 to 60.
          </small>
        </label>

        <label className="field">
          <span>Meta description</span>
          <textarea
            className="input"
            rows={3}
            maxLength={200}
            value={form.seoDescription}
            onChange={(e) => set('seoDescription', e.target.value)}
            placeholder={form.excerpt || 'Uses the summary if empty'}
          />
          <small className={descLen >= 70 && descLen <= 160 ? 'count ok' : 'count warn'}>
            {descLen} characters. Aim for 70 to 160.
          </small>
        </label>

        <label className="field">
          <span>Canonical URL</span>
          <input
            className="input"
            value={form.canonicalUrl}
            onChange={(e) => set('canonicalUrl', e.target.value)}
            placeholder="Leave empty unless this post was first published elsewhere"
          />
        </label>

        <label className="check">
          <input type="checkbox" checked={form.noindex} onChange={(e) => set('noindex', e.target.checked)} />
          <span>Hide this post from search engines</span>
        </label>

        <ul className="checklist" aria-label="SEO checklist">
          {checks.map(([ok, label]) => (
            <li key={label} className={ok ? 'done' : ''}>
              <span aria-hidden="true">{ok ? '✓' : '○'}</span> {label}
            </li>
          ))}
        </ul>
      </fieldset>

      <label className="check">
        <input type="checkbox" checked={form.published} onChange={(e) => set('published', e.target.checked)} />
        <span>Published (untick to keep as a draft)</span>
      </label>

      {error && <p className="msg msg-error" role="alert">{error}</p>}

      <div className="actions">
        <button className="btn" disabled={busy || !!uploading}>
          {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Publish post'}
        </button>
        <a className="btn btn-ghost" href="/admin">Cancel</a>
      </div>
    </form>
  );
}
