"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { blo } from "blo"
import { Search } from "lucide-react"

import { images } from "@/config/image"
import { track } from "@/lib/analytic"
import { isValidAddress } from "@/lib/utils"
import { suiClient } from "@/services/client"
import { useFullOperators } from "@/hooks"
import { cn } from "@/lib/utils"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command"
import { GlassPill } from "./ui/glass-pill"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"

const SEARCH_PLACEHOLDER = "Search by addresses or operators"

export function SearchPopover({
  triggerClassName,
  variant = "default",
  onNavigate,
}: {
  triggerClassName?: string
  variant?: "default" | "mobilePill"
  onNavigate?: () => void
}) {
  const fullOperators = useFullOperators()
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [walletAddress, setWalletAddress] = useState<{
    address: string
    displayName: string
  } | null>(null)

  useEffect(() => {
    const checkAddress = async () => {
      if (!searchValue) {
        setWalletAddress(null)
        return
      }

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

      if (searchValue.startsWith("0x") && searchValue.length >= 3) {
        setWalletAddress({
          address: searchValue,
          displayName: searchValue,
        })
        return
      }

      setWalletAddress(null)
    }

    const timeoutId = setTimeout(checkAddress, 300)
    return () => clearTimeout(timeoutId)
  }, [searchValue])

  const close = () => {
    setOpen(false)
    onNavigate?.()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {variant === "mobilePill" ? (
          <GlassPill
            type="button"
            size="icon"
            aria-label="Search"
            className={triggerClassName}
          >
            <Search className="size-5" />
          </GlassPill>
        ) : (
          <GlassPill
            type="button"
            aria-label="Search"
            className={cn("w-full max-w-[320px]", triggerClassName)}
          >
            <Search className="text-foreground/70 size-5 shrink-0" />
            <span className="text-placeholder min-w-0 flex-1 truncate text-sm leading-5 font-normal">
              {SEARCH_PLACEHOLDER}
            </span>
          </GlassPill>
        )}
      </PopoverTrigger>
      <PopoverContent variant="glass" align="start" className="p-0">
        <Command className="bg-transparent">
          <CommandInput
            placeholder={SEARCH_PLACEHOLDER}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            {!walletAddress && <CommandEmpty>No results found</CommandEmpty>}
            <CommandGroup heading="Operators">
              {fullOperators?.map((o) => (
                <Link
                  href={`/operator?id=${o.id}`}
                  key={o.id}
                  prefetch={false}
                  onClick={() => {
                    track("ClickSearch", { searchValue, operatorId: o.id })
                    close()
                  }}
                >
                  <CommandItem>
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
                  href={`/profile?addr=${walletAddress.address}`}
                  prefetch={false}
                  onClick={() => {
                    track("ClickSearch", {
                      searchValue,
                      walletAddress: walletAddress.address,
                    })
                    close()
                  }}
                >
                  <CommandItem>
                    <img
                      src={blo(walletAddress.address as `0x${string}`)}
                      alt={walletAddress.displayName}
                      className="size-5 shrink-0 rounded-full"
                    />
                    <div className="flex flex-col">
                      <div>{walletAddress.displayName}</div>
                      {walletAddress.displayName !== walletAddress.address && (
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
  )
}
