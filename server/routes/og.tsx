import fs from "fs/promises"
import { Elysia, t } from "elysia"
import { ImageResponse } from "@vercel/og"
import memoizee from "memoizee"

import { isValidAddress } from "../../src/lib/utils"
import { getMinimalOperatorWithMetadata, getSuiName } from "../services"

async function loadGoogleFont(font: string, text: string) {
  const url = `https://fonts.googleapis.com/css2?family=${font}:wght@600&display=swap&text=${encodeURIComponent(text)}`
  const css = await (await fetch(url, { cache: "force-cache" })).text()
  const resource = css.match(
    /src: url\((.+)\) format\('(opentype|truetype)'\)/
  )

  if (resource) {
    const response = await fetch(resource[1])
    if (response.status == 200) {
      return await response.arrayBuffer()
    }
  }

  throw new Error("failed to load font data")
}

const operatorSize = { width: 1200, height: 630 }
const profileSize = { width: 1048, height: 550 }

const _generateOperatorOg = async (id: string): Promise<ArrayBuffer> => {
  const isValid = isValidAddress(id)
  let label = "Invalid Operator"
  let imageUrl: string | undefined

  if (isValid) {
    const operator = await getMinimalOperatorWithMetadata(id)
    if (operator) {
      label = operator.name
      imageUrl = operator.imageUrl
    } else {
      label = "Operator Not Found"
    }
  }

  const baseImage = await fs.readFile("og-template/operator.png")
  const avatar = await fs.readFile("og-template/avatar.png")

  const response = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundImage: `url(data:image/png;base64,${baseImage.toString("base64")})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          display: "flex",
          fontSize: 60,
          color: "white",
          position: "relative",
        }}
      >
        <img
          src={
            imageUrl ||
            `data:image/png;base64,${avatar.toString("base64")}`
          }
          alt={label}
          style={{
            height: 170,
            width: 170,
            borderRadius: 9999,
            objectFit: "cover",
            position: "absolute",
            left: 35,
            top: 205,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 38,
            top: 397,
            maxWidth: operatorSize.width - 38,
            overflow: "hidden",
          }}
        >
          {label}
        </div>
      </div>
    ),
    {
      ...operatorSize,
      fonts: [
        {
          name: "DM Sans",
          data: await loadGoogleFont("DM Sans", label),
        },
      ],
    }
  )

  return await response.arrayBuffer()
}

const _generateProfileOg = async (addr: string): Promise<ArrayBuffer> => {
  const isValid = isValidAddress(addr)
  const baseImage = await fs.readFile("og-template/profile.png")

  if (!isValid) {
    const response = new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundImage: `url(data:image/png;base64,${baseImage.toString("base64")})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            display: "flex",
            fontSize: 52.4,
            color: "white",
          }}
        >
          <div
            style={{
              marginLeft: 33,
              marginTop: 347,
            }}
          >
            Invalid Address
          </div>
        </div>
      ),
      {
        ...profileSize,
        fonts: [
          {
            name: "DM Sans",
            data: await loadGoogleFont("DM Sans", "Invalid Address"),
          },
        ],
      }
    )
    return await response.arrayBuffer()
  }

  const name = await getSuiName(addr)
  const displayName = name || `${addr.slice(0, 6)}..${addr.slice(-4)}`
  const isAddress = displayName.startsWith("0x")

  const response = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundImage: `url(data:image/png;base64,${baseImage.toString("base64")})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          display: "flex",
          fontSize: 52.4,
          color: "white",
        }}
      >
        <div
          style={{
            marginLeft: 33,
            marginTop: 347,
          }}
        >
          {displayName}
        </div>
      </div>
    ),
    {
      ...profileSize,
      fonts: [
        {
          name: isAddress ? "JetBrains Mono" : "DM Sans",
          data: await loadGoogleFont(
            isAddress ? "JetBrains Mono" : "DM Sans",
            displayName
          ),
        },
      ],
    }
  )
  return await response.arrayBuffer()
}

const generateOperatorOg = memoizee(_generateOperatorOg, {
  promise: true,
  maxAge: 86_400_000, // 24h
  max: 500,
  normalizer: ([id]: [string]) => id,
})

const generateProfileOg = memoizee(_generateProfileOg, {
  promise: true,
  maxAge: 86_400_000, // 24h
  max: 500,
  normalizer: ([addr]: [string]) => addr,
})

export const ogRoutes = new Elysia({ tags: ["Open Graph Images"] })
  .get(
    "/api/og/operator/:id",
    async ({ params, set }) => {
      const buffer = await generateOperatorOg(params.id)
      set.headers["content-type"] = "image/png"
      set.headers["cache-control"] = "public, max-age=86400"
      return new Response(buffer)
    },
    {
      params: t.Object({
        id: t.String({ description: "Operator's Sui object ID (0x-prefixed, 66 chars)" }),
      }),
      detail: {
        summary: "Generate operator OG image",
        description:
          "Generates a 1200x630 PNG Open Graph image for a Walrus operator, featuring their name and avatar overlaid on a branded template. Used for social media link previews (Twitter, Discord, Telegram, etc.). Images are cached for 24 hours (up to 500 operators). Returns a fallback image for invalid or unknown operator IDs.",
      },
      response: {
        200: t.Any({ description: "PNG image binary (content-type: image/png)" }),
      },
    }
  )
  .get(
    "/api/og/profile/:addr",
    async ({ params, set }) => {
      const buffer = await generateProfileOg(params.addr)
      set.headers["content-type"] = "image/png"
      set.headers["cache-control"] = "public, max-age=86400"
      return new Response(buffer)
    },
    {
      params: t.Object({
        addr: t.String({ description: "Sui wallet address (0x-prefixed, 66 chars)" }),
      }),
      detail: {
        summary: "Generate profile OG image",
        description:
          "Generates a 1048x550 PNG Open Graph image for a Sui wallet address, displaying either the resolved Sui Name Service name or a truncated address. Used for social media link previews on profile pages. Images are cached for 24 hours (up to 500 addresses). Returns a fallback image for invalid addresses.",
      },
      response: {
        200: t.Any({ description: "PNG image binary (content-type: image/png)" }),
      },
    }
  )
