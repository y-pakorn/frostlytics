import { ComponentProps, useEffect, useState } from "react"
import _ from "lodash"

import { Icons } from "./icons"

export function SafeImage({
  src,
  alt,
  className,
  ...props
}: ComponentProps<"img">) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!src) {
      setImageSrc(null)
      setHasError(false)
      return
    }

    setHasError(false)
    setImageSrc(null)

    const img = new Image()
    const usedSrc = `${src}`
    img.onload = () => setImageSrc(usedSrc as string)
    img.onerror = () => setHasError(true)
    img.onabort = () => setHasError(true)
    img.crossOrigin = "anonymous"
    img.src = usedSrc as string

    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [src])

  if (!src || hasError || !imageSrc) {
    return <Icons.avatar className={className} />
  }

  return <img src={imageSrc} alt={alt} className={className} {...props} />
}
