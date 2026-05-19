"use client"

import Link from "next/link"
import { FaDiscord, FaXTwitter } from "react-icons/fa6"

import { links } from "@/config/link"
import { track } from "@/lib/analytic"
import { cn } from "@/lib/utils"

import { NavbarWalletButton } from "./wallet-button"
import { SearchPopover } from "./search-popover"
import { SidebarTrigger } from "./ui/sidebar"

const socialLinks = [
  {
    href: links.twitter,
    label: "Twitter",
    icon: FaXTwitter,
  },
  {
    href: links.discord,
    label: "Discord",
    icon: FaDiscord,
  },
] as const

export function AppNavbar() {
  return (
    <header className="sticky top-0 z-20 shrink-0 backdrop-blur-[50px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-nav"
      />
      <div className="relative flex items-center justify-between gap-3 px-4 py-4 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <SidebarTrigger className="md:hidden" />
          <SearchPopover
            triggerClassName="hidden w-full max-w-[320px] md:block"
          />
        </div>

        <div className="flex shrink-0 items-center gap-3 md:gap-4">
          <div className="flex items-center gap-4">
            {socialLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                onClick={() =>
                  track("ExternalLinkClick", { url: href, label })
                }
                className={cn(
                  "text-foreground flex size-6 items-center justify-center transition-opacity",
                  "hover:opacity-80 active:opacity-60"
                )}
              >
                <Icon className="size-6" />
              </Link>
            ))}
          </div>
          <NavbarWalletButton />
        </div>
      </div>
    </header>
  )
}
