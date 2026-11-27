const publicCache = [{ key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=600' }];

/** @type {import('next').NextConfig} */
module.exports = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: '/', headers: publicCache },
      { source: '/blog/:slug*', headers: publicCache },
      { source: '/tag/:tag*', headers: publicCache },
      { source: '/feed.xml', headers: publicCache },
      { source: '/sitemap.xml', headers: publicCache },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};
