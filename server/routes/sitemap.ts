import { Elysia } from "elysia"
import memoizee from "memoizee"

import { getOperatorProfiles } from "../services"

const _generateSitemap = async (): Promise<string> => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const operators = await getOperatorProfiles()
  const now = new Date().toISOString()

  const urls = [
    { loc: appUrl, priority: "1.0", changefreq: "daily", lastmod: now },
    { loc: `${appUrl}/reward-calculator`, priority: "0.9", lastmod: now },
    { loc: `${appUrl}/profile`, priority: "0.9", lastmod: now },
    { loc: `${appUrl}/faq`, priority: "0.9" },
    ...operators.map((operator) => ({
      loc: `${appUrl}/operator?id=${operator.id}`,
      priority: "0.8",
      changefreq: "daily",
      lastmod: now,
    })),
  ]

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <priority>${u.priority}</priority>${u.changefreq ? `\n    <changefreq>${u.changefreq}</changefreq>` : ""}${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""}
  </url>`
  )
  .join("\n")}
</urlset>`
}

const generateSitemap = memoizee(_generateSitemap, {
  promise: true,
  maxAge: 86_400_000, // 24h
})

export const sitemapRoutes = new Elysia().get(
  "/sitemap.xml",
  async ({ set }) => {
    const xml = await generateSitemap()
    set.headers["content-type"] = "application/xml"
    set.headers["cache-control"] = "public, max-age=86400"
    return xml
  }
)
