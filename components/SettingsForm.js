'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { upload } from '@vercel/blob/client';

const SOCIALS = [
  ['twitter', 'X (Twitter)', 'https://x.com/yourname'],
  ['facebook', 'Facebook', 'https://facebook.com/yourpage'],
  ['instagram', 'Instagram', 'https://instagram.com/yourname'],
  ['youtube', 'YouTube', 'https://youtube.com/@yourchannel'],
  ['linkedin', 'LinkedIn', 'https://linkedin.com/in/yourname'],
  ['github', 'GitHub', 'https://github.com/yourname'],
];
const PRESETS = ['#0d6e73', '#2563eb', '#7c3aed', '#db2777', '#e11d48', '#ea580c', '#16a34a', '#0f172a'];
const TABS = [['general', 'General'], ['look', 'Look'], ['social', 'Social'], ['google', 'Google & SEO']];
const cleanName = (n) => n.replace(/[^\w.\-]/g, '-');

// Same logic as the server: accepts the whole <meta> tag or only the code
const extractCode = (v) => {
  const m = String(v || '').match(/content\s*=\s*["']([^"']+)["']/i);
  return (m ? m[1] : String(v || '')).trim();
};

export default function SettingsForm({ initial, defaults, siteUrl, latestUrl }) {
  const router = useRouter();
  const [tab, setTab] = useState('general');
  const [f, setF] = useState(() => ({
    siteName: initial.siteName || '',
    tagline: initial.tagline || '',
    description: initial.description || '',
    authorName: initial.authorName || '',
    twitterHandle: initial.twitterHandle || '',
    accentColor: initial.accentColor || defaults.accentColor,
    theme: initial.theme || 'auto',
    logoUrl: initial.logoUrl || '',
    faviconUrl: initial.faviconUrl || '',
    defaultOgImage: initial.defaultOgImage || '',
    gaId: initial.gaId || '',
    googleVerification: initial.googleVerification || '',
    bingVerification: initial.bingVerification || '',
    social: Object.fromEntries(SOCIALS.map(([k]) => [k, initial.social?.[k] || ''])),
  }));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [check, setCheck] = useState(null);
  const [checking, setChecking] = useState(false);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); setToast('Copied'); } catch { setToast('Copy failed. Select and copy manually.'); }
  };

  async function onImage(key, e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(key);
    try {
      const blob = await upload(`images/${cleanName(file.name)}`, file, { access: 'public', handleUploadUrl: '/api/upload' });
      set(key, blob.url);
    } catch (err) {
      setError(`Image upload failed: ${err.message}`);
    } finally {
      setUploading('');
      e.target.value = '';
    }
  }

  async function save(e) {
    e?.preventDefault();
    setBusy(true);
    setError('');
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...f,
        googleVerification: extractCode(f.googleVerification),
        bingVerification: extractCode(f.bingVerification),
      }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(d.error || 'Could not save.'); return false; }
    setF((x) => ({ ...x, googleVerification: extractCode(x.googleVerification), bingVerification: extractCode(x.bingVerification) }));
    setToast('Saved. Live in about a minute.');
    router.refresh();
    return true;
  }

  async function runCheck() {
    setChecking(true);
    setCheck(null);
    try {
      const res = await fetch('/api/settings/check', { cache: 'no-store' });
      setCheck(await res.json());
    } catch {
      setCheck({ ok: false, error: 'Check failed. Try again.' });
    }
    setChecking(false);
  }

  const urlLooksFake = /localhost|example\.com/.test(siteUrl);
  const sitemap = `${siteUrl}/sitemap.xml`;
  const descLen = f.description.length;
  const gCode = extractCode(f.googleVerification);
  const imgField = (key, label, hint) => (
    <div className="field">
      <span>{label}</span>
      <div className="upload-row">
        {f[key] ? <img src={f[key]} alt="" /> : null}
        <label className="btn btn-ghost btn-small">
          {uploading === key ? 'Uploading…' : f[key] ? 'Replace' : 'Upload'}
          <input type="file" accept="image/*" hidden disabled={!!uploading} onChange={(e) => onImage(key, e)} />
        </label>
        {f[key] && <button type="button" className="link-plain" onClick={() => set(key, '')}>Remove</button>}
      </div>
      <small>{hint}</small>
    </div>
  );

  return (
    <form className="editor" onSubmit={save}>
      <div className="tabs" role="tablist">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" role="tab" className="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === 'general' && (
        <div className="panel">
          <div className="card">
            <label className="field"><span>Site title</span>
              <input className="input" value={f.siteName} maxLength={60} placeholder={defaults.siteName} onChange={(e) => set('siteName', e.target.value)} />
            </label>
            <label className="field"><span>Tagline</span>
              <input className="input" value={f.tagline} maxLength={120} placeholder={defaults.tagline} onChange={(e) => set('tagline', e.target.value)} />
            </label>
            <label className="field">
              <div className="field-head"><span>Description (shown in Google)</span>
                <small className={`count ${descLen >= 120 && descLen <= 160 ? 'ok' : 'warn'}`}>{descLen}/160</small>
              </div>
              <textarea className="input" rows={3} maxLength={300} value={f.description} placeholder={defaults.description} onChange={(e) => set('description', e.target.value)} />
              <small>Best length is 120 to 160 characters.</small>
            </label>
            <div className="row">
              <label className="field"><span>Author name</span>
                <input className="input" value={f.authorName} maxLength={60} placeholder={defaults.authorName} onChange={(e) => set('authorName', e.target.value)} />
              </label>
              <label className="field"><span>X (Twitter) handle</span>
                <input className="input" value={f.twitterHandle} maxLength={16} placeholder="@yourname" onChange={(e) => set('twitterHandle', e.target.value)} />
              </label>
            </div>
            <small>Leave a field empty to use the default from your environment settings.</small>
          </div>
        </div>
      )}

      {tab === 'look' && (
        <div className="panel">
          <div className="card">
            <h2>Colour and theme</h2>
            <div className="field"><span>Accent colour</span>
              <div className="swatches">
                {PRESETS.map((c) => (
                  <button key={c} type="button" className="swatch" style={{ background: c }} aria-label={c} aria-pressed={f.accentColor === c} onClick={() => set('accentColor', c)} />
                ))}
                <input className="color-input" type="color" value={/^#[0-9a-f]{6}$/i.test(f.accentColor) ? f.accentColor : '#0d6e73'} onChange={(e) => set('accentColor', e.target.value)} aria-label="Custom colour" />
                <input className="input" style={{ width: '7rem' }} value={f.accentColor} maxLength={7} onChange={(e) => set('accentColor', e.target.value)} />
              </div>
            </div>
            <div className="field"><span>Theme</span>
              <div className="seg">
                {[['auto', 'Match device'], ['light', 'Light'], ['dark', 'Dark']].map(([v, l]) => (
                  <button key={v} type="button" aria-pressed={f.theme === v} onClick={() => set('theme', v)}>{l}</button>
                ))}
              </div>
            </div>
            <div className="preview-bar" style={{ '--accent': f.accentColor }}>
              {f.logoUrl && <img className="brand-logo" src={f.logoUrl} alt="" />}
              <strong style={{ color: f.accentColor }}>{f.siteName || defaults.siteName}</strong>
              <span className="muted">{f.tagline || defaults.tagline}</span>
            </div>
          </div>
          <div className="card">
            <h2>Images</h2>
            {imgField('logoUrl', 'Logo', 'Shown next to your site title. A square or wide PNG with transparent background works best.')}
            {imgField('faviconUrl', 'Favicon', 'The small icon in the browser tab and Google results. Use a square PNG, at least 48×48.')}
            {imgField('defaultOgImage', 'Default share image', 'Shown when your home page is shared on WhatsApp, LinkedIn and others. Use 1200×630.')}
          </div>
        </div>
      )}

      {tab === 'social' && (
        <div className="panel">
          <div className="card">
            <h2>Social links</h2>
            <small>Shown in the footer and sent to Google as your official profiles.</small>
            {SOCIALS.map(([k, label, ph]) => (
              <label key={k} className="field"><span>{label}</span>
                <input className="input" type="url" value={f.social[k]} placeholder={ph} onChange={(e) => setF((x) => ({ ...x, social: { ...x.social, [k]: e.target.value } }))} />
              </label>
            ))}
          </div>
        </div>
      )}

      {tab === 'google' && (
        <div className="panel">
          {urlLooksFake && (
            <p className="msg msg-error">Your site address is still <code>{siteUrl}</code>. Set <code>NEXT_PUBLIC_SITE_URL</code> to your real domain in Vercel and redeploy before using Search Console.</p>
          )}
          <div className="card">
            <h2>Connect Google Search Console</h2>
            <div className="step"><span className="step-n">1</span><div>
              <h3>Add your site</h3>
              <p>Open Search Console, click <strong>Add property</strong>, choose <strong>URL prefix</strong> and paste this address.</p>
              <div className="copybox"><code>{siteUrl}</code><button type="button" className="btn btn-ghost btn-small" onClick={() => copy(siteUrl)}>Copy</button></div>
              <p style={{ marginTop: '0.6rem' }}><a className="btn btn-small" href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer">Open Search Console</a></p>
            </div></div>
            <div className="step"><span className="step-n">2</span><div>
              <h3>Paste the verification tag</h3>
              <p>Pick <strong>HTML tag</strong> as the method. Copy the whole tag Google shows and paste it here. You do not need to edit anything.</p>
              <input className="input" value={f.googleVerification} placeholder='<meta name="google-site-verification" content="..." />' onChange={(e) => set('googleVerification', e.target.value)} />
              {gCode && f.googleVerification !== gCode && <small>Detected code: <code>{gCode}</code></small>}
              <div className="actions" style={{ marginTop: '0.7rem' }}>
                <button type="button" className="btn btn-small" disabled={busy} onClick={async () => { if (await save()) runCheck(); }}>Save and check my site</button>
                {check && (
                  <span className={`chip ${check.google && check.google === gCode ? 'chip-ok' : 'chip-warn'}`}>
                    {check.error ? check.error : check.google && check.google === gCode ? 'Live. Now click Verify in Google.' : check.google ? 'A different code is live. Wait a minute and check again.' : 'Not live yet. Wait a minute and check again.'}
                  </span>
                )}
              </div>
            </div></div>
            <div className="step"><span className="step-n">3</span><div>
              <h3>Submit your sitemap</h3>
              <p>After Google verifies the site, open <strong>Sitemaps</strong>, type <code>sitemap.xml</code> and click <strong>Submit</strong>.</p>
              <div className="copybox"><code>{sitemap}</code><button type="button" className="btn btn-ghost btn-small" onClick={() => copy(sitemap)}>Copy</button></div>
            </div></div>
          </div>

          <div className="card">
            <h2>Bing Webmaster Tools</h2>
            <p className="muted" style={{ margin: 0 }}>Easiest way: in Bing Webmaster Tools choose <strong>Import from Google Search Console</strong> after step 3. Or paste the Bing meta tag here.</p>
            <input className="input" value={f.bingVerification} placeholder='<meta name="msvalidate.01" content="..." />' onChange={(e) => set('bingVerification', e.target.value)} />
            {check && !check.error && <span className={`chip ${check.bing ? 'chip-ok' : 'chip-off'}`}>{check.bing ? 'Bing tag is live' : 'Bing tag not live'}</span>}
          </div>

          <div className="card">
            <h2>Google Analytics</h2>
            <label className="field"><span>Measurement ID</span>
              <input className="input" value={f.gaId} placeholder="G-XXXXXXXXXX" onChange={(e) => set('gaId', e.target.value)} />
              <small>Find it in Analytics under Admin, Data streams.</small>
            </label>
            {check && !check.error && <span className={`chip ${check.ga ? 'chip-ok' : 'chip-off'}`}>{check.ga ? `Live: ${check.ga}` : 'Analytics not live'}</span>}
          </div>

          <div className="card">
            <h2>Quick tests</h2>
            <div className="actions">
              {latestUrl && <a className="btn btn-ghost btn-small" href={`https://search.google.com/test/rich-results?url=${encodeURIComponent(latestUrl)}`} target="_blank" rel="noopener noreferrer">Test my latest post</a>}
              <a className="btn btn-ghost btn-small" href={`https://www.google.com/search?q=${encodeURIComponent(`site:${siteUrl.replace(/^https?:\/\//, '')}`)}`} target="_blank" rel="noopener noreferrer">See what Google has indexed</a>
              <button type="button" className="btn btn-ghost btn-small" disabled={checking} onClick={runCheck}>{checking ? 'Checking…' : 'Check my live site'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="savebar">
        <button className="btn" disabled={busy || !!uploading}>{busy ? 'Saving…' : 'Save settings'}</button>
        {error && <span className="msg msg-error" role="alert" style={{ padding: '0.3rem 0.8rem' }}>{error}</span>}
      </div>
      {toast && <div className="toast" role="status">{toast}</div>}
    </form>
  );
}
