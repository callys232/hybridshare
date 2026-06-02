/** @type {import('next').NextConfig} */
const nextConfig = {
  // serverActions graduated from experimental in Next.js 14 — no config needed
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      // Add your production domain via NGINX_DOMAIN env var
      ...(process.env.NGINX_DOMAIN
        ? [{ protocol: 'https', hostname: process.env.NGINX_DOMAIN }]
        : []),
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    NEXT_PUBLIC_MOCK_MODE: process.env.NEXT_PUBLIC_MOCK_MODE ?? 'false',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
