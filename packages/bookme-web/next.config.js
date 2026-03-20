/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  eslint: {
    dirs: ['src', 'pages', 'components'],
  },
  redirects: async () => [
    { source: '/', destination: '/dashboard', permanent: false },
  ],
  rewrites: async () => ({
    beforeFiles: [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ],
  }),
};

module.exports = nextConfig;
