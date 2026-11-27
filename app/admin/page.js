import Link from 'next/link';
import DeleteButton from '@/components/DeleteButton';
import { getAllPosts } from '@/lib/posts';
import { formatDate, todayString } from '@/lib/config';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const posts = await getAllPosts({ includeDrafts: true });
  const today = todayString();
  const status = (p) =>
    !p.published ? ['Draft', 'tag-draft'] : p.date > today ? ['Scheduled', 'tag-sched'] : ['Live', 'tag-live'];

  return (
    <section>
      <div className="admin-head">
        <h1>Posts</h1>
        <Link className="btn" href="/admin/new">New post</Link>
      </div>

      {!posts.length ? (
        <p className="muted">No posts yet. Write your first one.</p>
      ) : (
        <ul className="admin-list">
          {posts.map((p) => {
            const [label, cls] = status(p);
            return (
              <li key={p.slug}>
                {p.coverImage ? <img src={p.coverImage} alt="" /> : <span className="thumb-empty" />}
                <div className="admin-item">
                  <strong>{p.title}</strong>
                  <span className="muted">{formatDate(p.date)}</span>
                </div>
                <span className={`tag ${cls}`}>{label}</span>
                <div className="admin-actions">
                  <Link href={`/admin/edit/${p.slug}`}>Edit</Link>
                  {label !== 'Draft' && <Link href={`/blog/${p.slug}`} target="_blank">View</Link>}
                  <DeleteButton slug={p.slug} title={p.title} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
