import Link from 'next/link';

export default function Pagination({ page, totalPages, basePath = '/' }) {
  if (totalPages <= 1) return null;
  const href = (n) => (n === 1 ? basePath : `${basePath}?page=${n}`);
  return (
    <nav className="pager" aria-label="Pagination">
      {page > 1 ? <Link href={href(page - 1)} rel="prev">Newer posts</Link> : <span />}
      <span className="muted">Page {page} of {totalPages}</span>
      {page < totalPages ? <Link href={href(page + 1)} rel="next">Older posts</Link> : <span />}
    </nav>
  );
}
