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
  rewrites: async () => ({
    beforeFiles: [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ],
  }),
  output: 'standalone',
};

module.exports = nextConfig;
