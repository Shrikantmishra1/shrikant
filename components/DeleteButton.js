'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteButton({ slug, title }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setBusy(true);
    const res = await fetch(`/api/posts?slug=${encodeURIComponent(slug)}`, { method: 'DELETE' });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || 'Could not delete the post.');
      setBusy(false);
      return;
    }
    router.refresh();
  }

  return (
    <button className="link-danger" onClick={remove} disabled={busy}>
      {busy ? 'Deleting…' : 'Delete'}
    </button>
  );
}
