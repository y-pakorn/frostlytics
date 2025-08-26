"use client"

import { usePathname } from "next/navigation"
import _ from "lodash"
import { Search } from "lucide-react"

import { navItems } from "@/config/nav"

import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { WalletButton } from "./wallet-button"

const NAV_HEIGHT = "64px"

export function AppNavbar() {
  const pathname = usePathname()
  const label: string | undefined = _.chain(navItems)
    .flatMap("items")
    .find({ href: pathname })
    .value()?.label

  return (
    <nav
      className="bg-nav/90 text-nav-foreground backdrop-blur-sm"
      style={{
        height: NAV_HEIGHT,
      }}
    >
      <div className="z-10 container flex h-full shrink-0 items-center gap-2">
        <h1 className="font-bold">{label}</h1>
        <div className="flex-1" />
        <div className="relative md:w-[320px]">
          <Input placeholder="Search" className="pl-10" />
          <Search className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
        </div>
        <WalletButton />
      </div>
    </nav>
  )
}
