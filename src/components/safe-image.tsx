import { ComponentProps, memo, useEffect, useState } from "react"

import { Icons } from "./icons"

export const SafeImage = memo(function SafeImage({
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
    img.src = usedSrc as string

    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [src])

  if (!src || hasError || !imageSrc) {
    return <Icons.avatar className={className} />
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      {...props}
    />
  )
})
