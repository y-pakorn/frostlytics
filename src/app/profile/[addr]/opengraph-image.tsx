import fs from "fs/promises"
import path from "path"
import { ImageResponse } from "next/og"

import { isValidAddress } from "@/lib/utils"
import { getSuiNameCached } from "@/services"

// Image metadata
export const size = {
  width: 1048,
  height: 550,
}
export const contentType = "image/png"
export const revalidate = 86400 // 24 hours

async function loadGoogleFont(font: string, text: string) {
  const url = `https://fonts.googleapis.com/css2?family=${font}:wght@600&display=swap&text=${encodeURIComponent(text)}`
  const css = await (await fetch(url)).text()
  const resource = css.match(/src: url\((.+)\) format\('(opentype|truetype)'\)/)

  if (resource) {
    const response = await fetch(resource[1])
    if (response.status == 200) {
      return await response.arrayBuffer()
    }
  }

  throw new Error("failed to load font data")
}

export default async function Image({ params }: { params: { addr: string } }) {
  const name = await getSuiNameCached(params.addr)
  const isValid = isValidAddress(params.addr)
  const displayName = isValid
    ? name || `${params.addr.slice(0, 6)}..${params.addr.slice(-4)}`
    : "Invalid Address"
  const isAddress = displayName.startsWith("0x")
  const baseImage = await fs.readFile("./src/app/profile/[addr]/og-profile.png")

  return new ImageResponse(
    (
      // ImageResponse JSX element
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
      ...size,
      fonts: [
        {
          name: "Font",
          data: await loadGoogleFont(
            isAddress ? "JetBrains Mono" : "DM Sans",
            displayName
          ),
        },
      ],
    }
  )
}
