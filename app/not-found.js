import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="empty">
      <h1>Page not found</h1>
      <p>This post may have moved or isn’t live yet. <Link href="/">Go to all posts</Link>.</p>
    </section>
  );
}
