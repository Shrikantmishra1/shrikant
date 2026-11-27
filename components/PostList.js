import Link from 'next/link';
import { formatDate } from '@/lib/config';

export default function PostList({ posts, label = 'Posts' }) {
  return (
    <section aria-label={label} className="archive">
      {posts.map((p) => (
        <Link key={p.slug} href={`/blog/${p.slug}`} className="entry">
          <time className="date" dateTime={p.date}>{formatDate(p.date)}</time>
          <div className="entry-text">
            <h2>{p.title}</h2>
            {p.excerpt && <p>{p.excerpt}</p>}
          </div>
          {p.coverImage ? (
            <img className="entry-img" src={p.coverImage} alt={p.coverAlt || ''} loading="lazy" decoding="async" />
          ) : (
            <span />
          )}
        </Link>
      ))}
    </section>
  );
}
