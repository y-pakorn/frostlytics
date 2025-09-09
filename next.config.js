/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    "/*": ["og-template/**/*"],
  },
  experimental: {
    optimizeCss: true,
  },
}

module.exports = nextConfig
