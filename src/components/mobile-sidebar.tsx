"use client"

import Link from "next/link"

import { navFooterItems, navGroups } from "@/config/nav"

import { Icons } from "./icons"
import { MobileSidebarHeader } from "./mobile-sidebar-header"
import {
  SidebarNavItem,
  SidebarSectionLabel,
} from "./sidebar-nav-item"
import { SidebarWalPrice } from "./wal-price-badge"
import { MobileWalletCard } from "./wallet-button"

export function MobileSidebar({
  pathname,
  onClose,
}: {
  pathname: string
  onClose: () => void
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <MobileSidebarHeader onClose={onClose} />

      <div className="flex min-h-0 flex-1 flex-col gap-2.5 px-4 pb-4">
        <div className="flex min-h-0 flex-1 flex-col justify-between">
          <div className="flex flex-col gap-1.5">
            {navGroups.map((group) => (
              <div key={group.label} className="flex flex-col gap-1.5">
                <SidebarSectionLabel size="mobile">{group.label}</SidebarSectionLabel>
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
                        size="mobile"
                        onNavigate={onClose}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex min-w-0 flex-col">
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
                  size="mobile"
                  onNavigate={onClose}
                />
              )
            })}
          </div>
        </div>

        <MobileWalletCard />
      </div>

      <div className="flex h-12 shrink-0 items-center justify-between pl-4 pr-2">
        <Link
          href="/"
          onClick={onClose}
          className="flex min-w-0 items-center gap-2.5"
        >
          <Icons.logo className="h-8 w-7" />
          <Icons.logoWordmark className="h-5 w-[98px]" />
        </Link>
        <SidebarWalPrice />
      </div>
    </div>
  )
}
