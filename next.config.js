/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    "/profile/[addr]/*": "./src/app/profile/[addr]/**/*", // include og image template png
  },
}

module.exports = nextConfig
