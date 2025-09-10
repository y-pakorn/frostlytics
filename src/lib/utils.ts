import { clsx, type ClassValue } from "clsx"
import _ from "lodash"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidAddress(address: string) {
  return (
    address.startsWith("0x") && address.length <= 66 && address.length >= 40
  )
}

// max shown pages is 5
export function getPaginationPages(
  totalPages: number,
  currentPage: number
): (number | null)[] {
  if (totalPages <= 5) {
    // If we have 5 or fewer pages, show all pages
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages: (number | null)[] = []

  // Always show first page
  pages.push(1)

  if (currentPage <= 3) {
    // Current page is near the beginning
    pages.push(2, 3, 4)
    pages.push(null) // ellipsis
    pages.push(totalPages)
  } else if (currentPage >= totalPages - 2) {
    // Current page is near the end
    pages.push(null) // ellipsis
    pages.push(totalPages - 3, totalPages - 2, totalPages - 1)
    pages.push(totalPages)
  } else {
    // Current page is in the middle
    pages.push(null) // ellipsis
    pages.push(currentPage - 1, currentPage, currentPage + 1)
    pages.push(null) // ellipsis
    pages.push(totalPages)
  }

  return pages
}
