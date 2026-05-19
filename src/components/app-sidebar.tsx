"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, PanelLeftClose } from "lucide-react"

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
} from "./sidebar-nav-item"
import { Button } from "./ui/button"
import { SidebarWalPrice } from "./wal-price-badge"

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
          className="flex items-center gap-[8.5px]"
        >
          {collapsed ? (
            <Icons.logo className="h-6 w-5" />
          ) : (
            <>
              <Icons.logo />
              <Icons.logoWordmark />
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
              <div className="flex flex-col">
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

        <div className="flex flex-col">
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
        </div>
      </div>

      <div className="flex shrink-0 justify-center px-2 pb-3">
        <Button
          variant="ghost"
          size="iconSm"
          className="rounded-lg border border-white/20 text-white"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <Menu className="size-4 stroke-[1.5]" />
          ) : (
            <PanelLeftClose className="size-4 stroke-[1.5]" />
          )}
        </Button>
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
