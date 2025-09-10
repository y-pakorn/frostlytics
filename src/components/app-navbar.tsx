"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { blo } from "blo"
import _ from "lodash"
import { Search, User } from "lucide-react"

import { images } from "@/config/image"
import { navItems } from "@/config/nav"
import { isValidAddress } from "@/lib/utils"
import { suiClient } from "@/services/client"
import { useFullOperators } from "@/hooks"
import { getSuiName } from "@/services"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command"
import { Input } from "./ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { WalletButton } from "./wallet-button"

const NAV_HEIGHT = "64px"

export function AppNavbar() {
  const pathname = usePathname()
  const label: string | undefined = _.chain(navItems)
    .flatMap("items")
    .find({ href: pathname })
    .value()?.label

  const fullOperators = useFullOperators()

  const [open, setOpen] = useState(false)

  const [searchValue, setSearchValue] = useState("")
  const [walletAddress, setWalletAddress] = useState<{
    address: string
    displayName: string
  } | null>(null)

  // Check if input looks like a wallet address or SUI name
  useEffect(() => {
    const checkAddress = async () => {
      if (!searchValue) {
        setWalletAddress(null)
        return
      }

      // Check if it's a valid 0x address
      if (isValidAddress(searchValue)) {
        try {
          const suiName = await suiClient.resolveNameServiceNames({
            address: searchValue,
          })
          setWalletAddress({
            address: searchValue,
            displayName: suiName.data?.[0] || searchValue,
          })
        } catch {
          setWalletAddress({
            address: searchValue,
            displayName: searchValue,
          })
        }
        return
      }

      // Check if it looks like a SUI name (ends with common domain extensions)
      if (searchValue.includes(".")) {
        const suiNamePattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]\.(sui)$/
        if (suiNamePattern.test(searchValue.toLowerCase())) {
          const suiAddress = await suiClient.resolveNameServiceAddress({
            name: searchValue,
          })
          if (suiAddress) {
            setWalletAddress({
              address: suiAddress,
              displayName: searchValue,
            })
          }
          return
        }
      }

      // If it's a partial address (starts with 0x but not complete)
      if (searchValue.startsWith("0x") && searchValue.length >= 3) {
        setWalletAddress({
          address: searchValue,
          displayName: searchValue,
        })
        return
      }

      setWalletAddress(null)
    }

    const timeoutId = setTimeout(checkAddress, 300) // Debounce
    return () => clearTimeout(timeoutId)
  }, [searchValue])

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
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="relative md:w-[320px]">
              <Input placeholder="Search" className="pl-10" readOnly />
              <Search className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-0">
            <Command>
              <CommandInput
                placeholder="Search operators or enter wallet address"
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <CommandList>
                {!walletAddress && (
                  <CommandEmpty>No results found</CommandEmpty>
                )}
                <CommandGroup heading="Operators">
                  {fullOperators?.map((o) => (
                    <Link
                      href={`/operator/${o.id}`}
                      key={o.id}
                      prefetch={false}
                    >
                      <CommandItem onSelect={() => setOpen(false)}>
                        <img
                          src={o.metadata?.imageUrl || images.avatar}
                          alt={o.name}
                          className="size-5 shrink-0 rounded-full"
                          onError={(e) => (e.currentTarget.src = images.avatar)}
                        />
                        <div>{o.name}</div>
                      </CommandItem>
                    </Link>
                  ))}
                </CommandGroup>
                {walletAddress && (
                  <CommandGroup heading="Wallet Address" forceMount>
                    <Link
                      href={`/profile/${walletAddress.address}`}
                      prefetch={false}
                    >
                      <CommandItem onSelect={() => setOpen(false)}>
                        <img
                          src={blo(walletAddress.address as any)}
                          alt={walletAddress.displayName}
                          className="size-5 shrink-0 rounded-full"
                        />
                        <div className="flex flex-col">
                          <div>{walletAddress.displayName}</div>
                          {walletAddress.displayName !==
                            walletAddress.address && (
                            <span className="text-tertiary truncate font-mono text-xs">
                              {walletAddress.address.length > 20
                                ? `${walletAddress.address.slice(0, 6)}...${walletAddress.address.slice(-4)}`
                                : walletAddress.address}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    </Link>
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <WalletButton />
      </div>
    </nav>
  )
}
