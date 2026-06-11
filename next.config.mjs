/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
  images: {
    remotePatterns: [
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'https', hostname: '*.amazonaws.com' },
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
      ...(process.env.NGINX_DOMAIN
        ? [{ protocol: 'https', hostname: process.env.NGINX_DOMAIN }]
        : []),
    ],
  },
  env: {
    NEXT_PUBLIC_APP_URL:  process.env.NEXT_PUBLIC_APP_URL  ?? 'http://localhost:3000',
    NEXT_PUBLIC_API_URL:  process.env.NEXT_PUBLIC_API_URL  ?? '',
    NEXT_PUBLIC_MOCK_MODE: process.env.NEXT_PUBLIC_MOCK_MODE ?? 'false',
  },
  async rewrites() {
    const externalApi = process.env.NEXT_PUBLIC_API_URL;
    if (!externalApi) return [];
    // Only proxy when an external backend URL is explicitly configured.
    // By default (blank), the Next.js route handlers at /api/* handle everything.
    return [
      { source: '/api/:path*', destination: `${externalApi}/api/:path*` },
    ];
  },
};

export default nextConfig;
