/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Enable standalone output for Docker
  output: 'standalone',

  // API proxy for development
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    return [
      {
        source: '/api/:path*',
        destination: apiUrl + '/api/:path*',
      },
    ];
  },

  // WebSocket configuration - exclude from server bundle
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't bundle socket.io-client on the server
      config.externals = [...config.externals, 'socket.io-client'];
    }
    return config;
  },
};

module.exports = nextConfig;
