import { ComponentProps, CSSProperties, forwardRef } from "react"

import { cn } from "@/lib/utils"

export const LiquidGlass = forwardRef<
  HTMLDivElement,
  ComponentProps<"div"> & {
    radius?: number
    opaque?: boolean
    /** Floating overlays (popover, dropdown) — full scrim + top stacking layer */
    overlay?: boolean
    contentClassName?: string
  }
>(function LiquidGlass(
  {
    radius,
    opaque = false,
    overlay = false,
    className,
    contentClassName,
    style,
    children,
    ...props
  },
  ref
) {
  const glassStyle = {
    ...(radius != null ? { "--corner-radius": `${radius}px` } : {}),
    ...style,
  } as CSSProperties

  const material = (
    <div className="liquid-glass-material" aria-hidden>
      <div className="liquid-glass-edge-reflection" />
      <div className="liquid-glass-emboss-reflection" />
      <div className="liquid-glass-refraction" />
      <div className="liquid-glass-blur" />
      <div className="liquid-glass-blend-layers" />
      <div className="liquid-glass-blend-edge" />
      <div className="liquid-glass-highlight" />
    </div>
  )

  return (
    <div
      ref={ref}
      className={cn(
        "liquid-glass",
        opaque && "liquid-glass-opaque",
        overlay && "liquid-glass-overlay",
        className
      )}
      style={glassStyle}
      {...props}
    >
      <div className={cn("liquid-glass-content", contentClassName)}>
        {opaque ? (
          <>
            <div className="liquid-glass-scrim" aria-hidden />
            <div className="liquid-glass-inner">{children}</div>
          </>
        ) : (
          children
        )}
      </div>
      {material}
    </div>
  )
})
