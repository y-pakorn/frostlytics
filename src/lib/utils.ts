import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidAddress(address: string) {
  return (
    address.startsWith("0x") && address.length <= 66 && address.length >= 40
  )
}
