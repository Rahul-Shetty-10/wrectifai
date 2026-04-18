/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias['@'] = require('node:path').resolve(__dirname, 'src');
    return config;
  },
};

module.exports = nextConfig;
