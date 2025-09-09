/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    "/*": "og-template/**/*",
  },
}

module.exports = nextConfig
