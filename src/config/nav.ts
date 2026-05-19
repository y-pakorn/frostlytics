import type { ElementType } from "react"
import {
  BarChart2,
  Calculator,
  Coins,
  Cross,
  MessageCircleQuestionMark,
  PackageCheck,
  User,
} from "lucide-react"

import { links } from "./link"

export const navGroups = [
  {
    label: "EXPLORE",
    items: [
      {
        label: "Protocol Stats",
        icon: BarChart2,
        href: "/",
        matchFn: (pathname: string) => pathname === "/",
      },
      {
        label: "Staking & Operators",
        icon: Coins,
        href: "/operator",
        matchFn: (pathname: string) =>
          pathname === "/operator" || pathname === "/operator/",
      },
      {
        label: "Protocol Health",
        icon: Cross,
        href: "/protocol-health",
        matchFn: (pathname: string) => pathname === "/protocol-health",
      },
      {
        label: "Profile",
        icon: User,
        href: "/profile",
        matchFn: (pathname: string) => pathname === "/profile",
      },
    ],
  },
  {
    label: "UTILITY",
    items: [
      {
        label: "Reward Calculator",
        icon: Calculator,
        href: "/reward-calculator",
        matchFn: (pathname: string) => pathname === "/reward-calculator",
      },
    ],
  },
] as const

export const navFooterItems = [
  {
    label: "FAQ",
    icon: MessageCircleQuestionMark,
    href: "/faq",
    matchFn: (pathname: string) => pathname === "/faq",
  },
  {
    label: "Become a Validator",
    icon: PackageCheck,
    href: links.becomeValidator,
    isExternal: true,
  },
] as const

/** @deprecated use navGroups + navFooterItems */
export const navItems = [
  ...navGroups,
  {
    label: "MORE",
    items: [...navFooterItems],
  },
] as {
  label: string
  items: {
    label: string
    icon: ElementType
    href: string
    className?: string
    isExternal?: boolean
    matchFn?: (pathname: string) => boolean
    disabled?: boolean
  }[]
}[]

export type NavItem = (typeof navGroups)[number]["items"][number]
