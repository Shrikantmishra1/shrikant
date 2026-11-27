'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push('/admin');
      router.refresh();
      return;
    }
    const d = await res.json().catch(() => ({}));
    setError(d.error || 'Could not sign in.');
    setBusy(false);
  }

  return (
    <form className="login" onSubmit={submit}>
      <h1>Sign in</h1>
      <label className="field">
        <span>Admin password</span>
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus required />
      </label>
      {error && <p className="msg msg-error" role="alert">{error}</p>}
      <button className="btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
  );
}
