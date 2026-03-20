/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  eslint: {
    dirs: ['src', 'components'],
  },
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
