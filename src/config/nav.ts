import {
  Gem,
  LayoutDashboard,
  MessageCircleQuestionMark,
  PackageCheck,
  User,
} from "lucide-react"

import { links } from "./link"

export const navItems = [
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
    ],
  },
  {
    label: "MORE",
    items: [
      {
        label: "FAQ",
        icon: MessageCircleQuestionMark,
        href: "/faq",
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
