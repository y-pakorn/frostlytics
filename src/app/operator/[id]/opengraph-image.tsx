import fs from "fs/promises"
import { ImageResponse } from "next/og"

import { MinimalOperatorWithMetadata } from "@/types/operator"
import { isValidAddress } from "@/lib/utils"
import {
  getMinimalOperatorsWithMetadataCached,
  getSuiNameCached,
} from "@/services"

// Image metadata
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"
export const alt = "Operator Profile"
export const revalidate = 86400 // 24 hours

async function loadGoogleFont(font: string, text: string) {
  const url = `https://fonts.googleapis.com/css2?family=${font}:wght@600&display=swap&text=${encodeURIComponent(text)}`
  const css = await (await fetch(url, { cache: "force-cache" })).text()
  const resource = css.match(/src: url\((.+)\) format\('(opentype|truetype)'\)/)

  if (resource) {
    const response = await fetch(resource[1])
    if (response.status == 200) {
      return await response.arrayBuffer()
    }
  }

  throw new Error("failed to load font data")
}

export const renderOperator = async (label: string, imageUrl?: string) => {
  const baseImage = await fs.readFile("og-template/operator.png")
  const avatar = await fs.readFile("og-template/avatar.png")

  return new ImageResponse(
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
          src={imageUrl || `data:image/png;base64,${avatar.toString("base64")}`}
          alt={label}
          style={{
            height: 154,
            width: 154,
            borderRadius: 9999,
            objectFit: "cover",
            position: "absolute",
            left: 35,
            top: 205,
          }}
          onError={(e) =>
            (e.currentTarget.src = `data:image/png;base64,${avatar.toString("base64")}`)
          }
        />
        <div
          style={{
            position: "absolute",
            left: 38,
            top: 397,
            maxWidth: size.width - 38,
            overflow: "hidden",
          }}
        >
          {label}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "DM Sans",
          data: await loadGoogleFont("DM Sans", label),
        },
      ],
    }
  )
}

export default async function Image({ params }: { params: { id: string } }) {
  const isValid = isValidAddress(params.id)
  if (!isValid) {
    return await renderOperator("Invalid Operator")
  }

  const operator = await getMinimalOperatorsWithMetadataCached(params.id)
  if (!operator) {
    return await renderOperator("Operator Not Found")
  }

  return await renderOperator(operator.name, operator.imageUrl)
}
