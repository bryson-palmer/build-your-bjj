"use client"

import { useCallback, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

type SearchNavigation = {
  query: string
  categoryId: string
  navigateBack: () => void
}

export const useSearchNavigation = ():SearchNavigation => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const query = searchParams.get("query") ?? ""
  const categoryId = searchParams.get("categoryId") ?? ""

  const navigateBack = useCallback(() => {
    try {
      if (!query && pathname !== "/" && pathname !== "/search") {
        router.push(pathname)
        return
      }
      
      if (pathname === "/search") {
        const url = categoryId
        ? `/?categoryId=${encodeURIComponent(categoryId)}`
        : "/search"
        router.push(url)
        return
      }

      router.push("/")
    } catch (err) {
      console.error("Failed to navigate to previous path:", err)
      router.push("/")
    }
  }, [categoryId, pathname, query, router])

  return useMemo(() => ({
    query,
    categoryId,
    navigateBack,
  }), [categoryId, navigateBack, query])
}
