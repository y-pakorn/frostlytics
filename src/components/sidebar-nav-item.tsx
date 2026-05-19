"use client"

import type { ElementType, ReactNode } from "react"
import Link from "next/link"

import { track } from "@/lib/analytic"
import { cn } from "@/lib/utils"

export function SidebarNavItem({
  href,
  label,
  icon: Icon,
  isActive,
  isExternal,
  collapsed,
  size = "desktop",
  onNavigate,
}: {
  href: string
  label: string
  icon: ElementType
  isActive: boolean
  isExternal?: boolean
  collapsed?: boolean
  size?: "desktop" | "mobile"
  onNavigate?: () => void
}) {
  const isMobile = size === "mobile"

  return (
    <Link
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      title={collapsed ? label : undefined}
      onClick={() => {
        if (isExternal) {
          track("ExternalLinkClick", { url: href, label })
        } else {
          track("NavigationClick", { destination: href, label })
          onNavigate?.()
        }
      }}
      className={cn(
        "flex w-full items-center rounded-full transition-[transform,background-color,filter] duration-150 ease-out active:scale-[0.99] active:duration-75 motion-reduce:transition-none motion-reduce:active:scale-100",
        isMobile ? "h-10" : "h-9",
        collapsed ? "justify-center px-0" : isActive ? "pl-2.5 pr-2.5" : "px-2",
        isActive
          ? "bg-[rgba(82,70,93,0.8)] text-white backdrop-blur-md active:brightness-95"
          : "text-sidebar-foreground hover:bg-white/[0.08] active:bg-white/[0.12]"
      )}
    >
      <span
        className={cn(
          "flex items-center",
          collapsed ? "justify-center" : isMobile ? "gap-2.5" : "gap-2.5"
        )}
      >
        <Icon className="size-5 shrink-0 stroke-[1.5]" />
        {!collapsed && (
          <span className="font-heading text-sm leading-5 font-medium">
            {label}
          </span>
        )}
      </span>
    </Link>
  )
}

export function SidebarSectionLabel({
  children,
  collapsed,
  size = "desktop",
}: {
  children: ReactNode
  collapsed?: boolean
  size?: "desktop" | "mobile"
}) {
  if (collapsed) return null

  return (
    <p
      className={cn(
        "font-heading text-brand-300 text-[10px] font-bold tracking-wide uppercase"
      )}
    >
      {children}
    </p>
  )
}
