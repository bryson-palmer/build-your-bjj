"use client"

import { SearchIcon, XIcon } from "lucide-react"
import { ErrorBoundary } from "react-error-boundary"
import { usePathname, useRouter } from "next/navigation"
import { Suspense, useCallback, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useSearchNavigation } from "@/hooks/use-search-navigation"

export const SearchInput = () => {
  return (
    <Suspense fallback={<Skeleton className="h-10 w-full" />}>
      <ErrorBoundary fallback={<p>Error loading search input</p>}>
        <SearchInputSuspense />
      </ErrorBoundary>
    </Suspense>
  )
}

const SearchInputSuspense = () => {
  const router = useRouter()
  const pathname = usePathname()
  const { query, categoryId, navigateBack } = useSearchNavigation()

  const [value, setValue] = useState(query)

  useEffect(() => {
    setValue(query)
  }, [query])

  useEffect(() => {
    const onPopState = () => {
      const url = new URL(window.location.href)
      const urlPathname = url.pathname
      const urlSearch = url.search

      if (urlSearch.includes("?query=") && query && !value) {
        setValue(query)
      }

      if (
        (urlPathname === "/search" || urlPathname === "/") &&
        !urlSearch.includes("?query=") &&
        !query &&
        value
      ) {
        setValue("")
      }
    }

    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [query, value])

  const handleSearch = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const trimmed = value.trim()

      if (!trimmed) {
        setValue("")
        navigateBack()
        return
      }
      
      const params = new URLSearchParams()
      params.set("query", trimmed)
      if (categoryId) params.set("categoryId", categoryId)

      router.push(`/search?${params.toString()}`)
    },
    [categoryId, navigateBack, router, value]
  )

  const handleChange = useCallback(
    (newValue: string) => {
      setValue(newValue)

      if (pathname === "/search" && newValue === "") {
        const params = new URLSearchParams()

        if (categoryId) {
          params.set("categoryId", categoryId)
        }
        
        const newUrl = params.toString() ? `/?${params.toString()}` : "/search"
        router.push(newUrl)
      }
    },
    [categoryId, pathname, router]
  )

  const handleClear = useCallback(() => {
    setValue("")
    navigateBack()
  }, [navigateBack])
  
  return (
    <form className="flex w-full max-w-[600px]" onSubmit={handleSearch}>
      <div className="relative w-full">
        <label htmlFor="search-bar" className="sr-only">
          Search the site
        </label>
        <input
          id="search-bar"
          name="search"
          type="text"
          value={value}
          placeholder="Search"
          onChange={e => handleChange(e.target.value)}
          className="w-full pl-4 py-2 pr-12 rounded-l-full border focus:outline-none focus:border-blue-500"
          aria-label="Search input"
        />
        {value.trim().length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            aria-label="Clear search input"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
          >
            <XIcon className="text-gray-500" />
          </Button>
        )}
      </div>
      <button
        type="submit"
        aria-label="Submit search"
        disabled={!value.trim()}
        className="px-5 py-2.5 bg-gray-100 border border-l-0 rounded-r-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <SearchIcon className="size-5" />
      </button>
    </form>
  )
}