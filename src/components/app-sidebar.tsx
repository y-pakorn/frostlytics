"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ArrowUpRight,
  Book,
  Gem,
  Layout,
  LayoutDashboard,
  PackageCheck,
  User,
} from "lucide-react"
import { FaXTwitter } from "react-icons/fa6"

import { links } from "@/config/link"
import { navItems } from "@/config/nav"
import { track } from "@/lib/analytic"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import { Icons } from "./icons"
import { Button } from "./ui/button"

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="flex-row items-center gap-3 px-4 py-5 group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:px-2">
        <Icons.logo />
        <Icons.logoText className="group-data-[state=collapsed]:hidden" />
      </SidebarHeader>
      <SidebarContent>
        {navItems.map((item) => (
          <SidebarGroup key={item.label}>
            <SidebarGroupLabel>{item.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => (
                  <Link
                    href={item.href}
                    key={item.href}
                    className={cn(item.disabled && "pointer-events-none")}
                    target={item.isExternal ? "_blank" : undefined}
                    rel={item.isExternal ? "noopener noreferrer" : undefined}
                    onClick={() => {
                      if (item.isExternal) {
                        track("ExternalLinkClick", {
                          url: item.href,
                          label: item.label,
                        })
                      } else {
                        track("NavigationClick", {
                          destination: item.href,
                          label: item.label,
                        })
                      }
                    }}
                  >
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        disabled={item.disabled}
                        isActive={
                          item.matchFn
                            ? item.matchFn(pathname)
                            : item.href === pathname
                        }
                        variant="gradient"
                      >
                        <item.icon className={cn(item.className)} />
                        <span className="group-data-[state=collapsed]:hidden">
                          {item.label}
                        </span>
                        {item.isExternal && (
                          <ArrowUpRight className="text-accent-blue! ml-auto" />
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </Link>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="flex-row justify-center">
        <Link
          href={links.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="mr-auto group-data-[state=collapsed]:hidden"
          onClick={() =>
            track("ExternalLinkClick", {
              url: links.twitter,
              label: "Twitter",
            })
          }
        >
          <Button variant="ghost" size="icon">
            <FaXTwitter />
          </Button>
        </Link>
        {/* <Link
          href={links.docs}
          target="_blank"
          rel="noopener noreferrer"
          className="mr-auto group-data-[state=collapsed]:hidden"
        >
          <Button variant="ghost" size="icon">
            <Book />
          </Button>
        </Link> */}
        <SidebarTrigger size="icon" className="rounded-full" variant="outline">
          <Layout />
        </SidebarTrigger>
      </SidebarFooter>
    </Sidebar>
  )
}
