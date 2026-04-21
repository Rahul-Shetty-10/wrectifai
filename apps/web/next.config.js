const path = require('node:path');
const API_PROXY_TARGET = process.env.API_PROXY_TARGET?.trim().replace(/\/+$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Render build environment can miss workspace ESLint plugins.
    // Keep deploys unblocked; linting can run separately in CI/local.
    ignoreDuringBuilds: true,
  },
  outputFileTracingRoot: path.join(__dirname, '../..'),
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
  async rewrites() {
    if (!API_PROXY_TARGET) return [];
    return [
      {
        source: '/api/:path*',
        destination: `${API_PROXY_TARGET}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
