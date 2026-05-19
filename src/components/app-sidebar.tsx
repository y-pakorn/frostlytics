"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { navFooterItems, navGroups } from "@/config/nav"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Sidebar,
  SidebarContent,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"

import { Icons } from "./icons"
import { MobileSidebar } from "./mobile-sidebar"
import {
  SidebarNavItem,
  SidebarSectionLabel,
  SidebarToggleItem,
} from "./sidebar-nav-item"
import { SidebarWalPrice } from "./wal-price-badge"

const SIDEBAR_LOGO_CLASS = "h-8 w-7"
const SIDEBAR_WORDMARK_CLASS = "h-5 w-[98px]"

function DesktopSidebarContent({
  pathname,
  collapsed,
  onToggle,
}: {
  pathname: string
  collapsed: boolean
  onToggle: () => void
}) {
  return (
    <SidebarContent className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden p-0">
      <div
        className={cn(
          "flex shrink-0 items-center pt-3",
          collapsed
            ? "justify-center px-2"
            : "justify-between pl-2.5 pr-2"
        )}
      >
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2.5"
        >
          {collapsed ? (
            <Icons.logo className={SIDEBAR_LOGO_CLASS} />
          ) : (
            <>
              <Icons.logo className={SIDEBAR_LOGO_CLASS} />
              <Icons.logoWordmark className={SIDEBAR_WORDMARK_CLASS} />
            </>
          )}
        </Link>
        {!collapsed && <SidebarWalPrice />}
      </div>

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col justify-between pb-3",
          collapsed ? "mt-3 px-2" : "mt-4 px-2.5"
        )}
      >
        <div className="flex flex-col gap-1.5">
          {navGroups.map((group, groupIndex) => (
            <div key={group.label} className="flex flex-col gap-1.5">
              {collapsed && groupIndex > 0 && (
                <SidebarSeparator className="mx-auto my-1 w-8 bg-white/10" />
              )}
              <SidebarSectionLabel collapsed={collapsed}>
                {group.label}
              </SidebarSectionLabel>
              <div className="flex min-w-0 flex-col">
                {group.items.map((item) => {
                  const isActive = item.matchFn
                    ? item.matchFn(pathname)
                    : item.href === pathname

                  return (
                    <SidebarNavItem
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      isActive={isActive}
                      collapsed={collapsed}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          {navFooterItems.map((item) => {
            const isActive =
              "matchFn" in item && item.matchFn
                ? item.matchFn(pathname)
                : item.href === pathname

            return (
              <SidebarNavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                isActive={isActive}
                isExternal={"isExternal" in item ? item.isExternal : undefined}
                collapsed={collapsed}
              />
            )
          })}
          <SidebarSeparator
            className={cn(
              "bg-white/10",
              collapsed ? "mx-auto my-1 w-8" : "mx-0 my-1"
            )}
          />
          <SidebarToggleItem collapsed={collapsed} onToggle={onToggle} />
        </div>
      </div>
    </SidebarContent>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const { state, toggleSidebar, setOpenMobile } = useSidebar()
  const collapsed = state === "collapsed" && !isMobile

  const closeMobile = () => setOpenMobile(false)

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      {isMobile ? (
        <MobileSidebar pathname={pathname} onClose={closeMobile} />
      ) : (
        <DesktopSidebarContent
          pathname={pathname}
          collapsed={collapsed}
          onToggle={toggleSidebar}
        />
      )}
    </Sidebar>
  )
}
