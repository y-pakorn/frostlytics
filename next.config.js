/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    turbotrace: {},
  },
}

module.exports = nextConfig
