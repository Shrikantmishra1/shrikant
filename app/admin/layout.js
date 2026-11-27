import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';
import { isAdmin } from '@/lib/auth-server';

export const metadata = { title: 'Admin', robots: { index: false, follow: false } };

export default async function AdminLayout({ children }) {
  const signedIn = await isAdmin();
  return (
    <div className="admin">
      {signedIn && (
        <nav className="admin-bar" aria-label="Admin">
          <Link href="/admin">Posts</Link>
          <Link href="/admin/new">New post</Link>
          <Link href="/admin/settings">Settings</Link>
          <Link href="/" target="_blank">View site</Link>
          <span className="spacer" />
          <LogoutButton />
        </nav>
      )}
      {children}
    </div>
  );
}
