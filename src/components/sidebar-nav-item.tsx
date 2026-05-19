"use client"

import type { ElementType, ReactNode } from "react"
import Link from "next/link"
import { Menu, PanelLeftClose } from "lucide-react"

import { track } from "@/lib/analytic"
import { cn } from "@/lib/utils"

const navItemClassName = cn(
  "flex w-full min-w-0 items-center rounded-full transition-[transform,background-color,filter] duration-150 ease-out active:scale-[0.99] active:duration-75 motion-reduce:transition-none motion-reduce:active:scale-100"
)

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
        navItemClassName,
        isMobile ? "h-10" : "h-9",
        collapsed ? "justify-center gap-0 px-0" : "gap-2.5",
        !collapsed && (isActive ? "pl-2.5 pr-2.5" : "px-2"),
        isActive
          ? "bg-[rgba(82,70,93,0.8)] text-white backdrop-blur-md active:brightness-95"
          : "text-sidebar-foreground hover:bg-white/[0.08] active:bg-white/[0.12]"
      )}
    >
      <Icon className="size-5 shrink-0 stroke-[1.5]" />
      {!collapsed && (
        <span className="min-w-0 flex-1 truncate font-heading text-sm leading-5 font-medium">
          {label}
        </span>
      )}
    </Link>
  )
}

export function SidebarToggleItem({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const label = collapsed ? "Expand sidebar" : "Collapse sidebar"
  const ToggleIcon = collapsed ? Menu : PanelLeftClose

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      title={collapsed ? "Expand sidebar" : undefined}
      className={cn(
        navItemClassName,
        "h-9",
        collapsed ? "justify-center gap-0 px-0" : "gap-2.5 px-2",
        "text-sidebar-foreground hover:bg-white/[0.08] active:bg-white/[0.12]"
      )}
    >
      <ToggleIcon className="size-5 shrink-0 stroke-[1.5]" />
      {!collapsed && (
        <span className="min-w-0 flex-1 truncate text-left font-heading text-sm leading-5 font-medium">
          Collapse
        </span>
      )}
    </button>
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
