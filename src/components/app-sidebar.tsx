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

const items = [
  {
    label: "DASHBOARD",
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/",
      },
      {
        label: "Profile",
        icon: User,
        href: "/profile",
      },
      {
        label: "Reward Calculator",
        icon: Gem,
        href: "/reward-calculator",
      },
      {
        label: "Become an Operator",
        icon: PackageCheck,
        href: links.becomeValidator,
        isExternal: true,
      },
    ],
  },
] as {
  label: string
  items: {
    label: string
    icon: React.ElementType
    href: string
    className?: string
    isExternal?: boolean
    matchFn?: (pathname: string) => boolean
    disabled?: boolean
  }[]
}[]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="flex-row items-center gap-3 px-4 py-5 group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:px-2">
        <Icons.logo className="group-data-[state=collapsed]:size-6" />
        <Icons.logoText className="group-data-[state=collapsed]:hidden" />
      </SidebarHeader>
      <SidebarContent>
        {items.map((item) => (
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
                        <span>{item.label}</span>
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
      <SidebarFooter className="flex-row justify-end group-data-[state=collapsed]:justify-center">
        <Link
          href={links.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="group-data-[state=collapsed]:hidden"
        >
          <Button variant="ghost" size="icon">
            <FaXTwitter />
          </Button>
        </Link>
        <Link
          href={links.docs}
          target="_blank"
          rel="noopener noreferrer"
          className="mr-auto group-data-[state=collapsed]:hidden"
        >
          <Button variant="ghost" size="icon">
            <Book />
          </Button>
        </Link>
        <SidebarTrigger size="icon" className="rounded-full" variant="outline">
          <Layout />
        </SidebarTrigger>
      </SidebarFooter>
    </Sidebar>
  )
}
