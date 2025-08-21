"use client"

import { Search } from "lucide-react"

import { Button } from "./ui/button"
import { Input } from "./ui/input"

const NAV_HEIGHT = "72px"

export function AppNavbar() {
  return (
    <nav
      className="bg-nav/90 text-nav-foreground backdrop-blur-sm"
      style={{
        height: NAV_HEIGHT,
      }}
    >
      <div className="z-10 container flex h-full shrink-0 items-center gap-2">
        <h1 className="font-bold">Dashboard</h1>
        <div className="flex-1" />
        <div className="relative md:w-[320px]">
          <Input placeholder="Search" className="pl-10" />
          <Search className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
        </div>
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => {
            console.log("connect wallet")
          }}
        >
          Connect Wallet
        </Button>
      </div>
    </nav>
  )
}
