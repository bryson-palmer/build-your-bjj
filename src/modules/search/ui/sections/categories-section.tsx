"use client"

import { Suspense } from "react"
import { trpc } from "@/trpc/client"
import { usePathname, useRouter } from "next/navigation"
import { ErrorBoundary } from "react-error-boundary"

import { FilterCarousel } from "@/components/filter-carousel"

// If categoryId becomes an [] of string ids, would need to update here
interface CategoriesSectionProps {
  query?: string,
  categoryId?: string
}

export const CategoriesSection = (params: CategoriesSectionProps) => {
  return (
    <Suspense fallback={<CategoriesSkeleton />}>
      <ErrorBoundary fallback={<p>Error...</p>}>
        <CategoriesSectionSuspense {...params} />
      </ErrorBoundary>
    </Suspense>
  )
}

const CategoriesSkeleton = () => {
  return <FilterCarousel isLoading data={[]} onSelect={() => {}} />
}

const CategoriesSectionSuspense = ({ categoryId, query }: CategoriesSectionProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const [categories] = trpc.categories.getMany.useSuspenseQuery()

  const data = categories.map(({ id, name }) => ({
    value: id,
    label: name
  }))

  const onSelect = (value: string | null) => {
    const params = new URLSearchParams()
    
    // If params changes to become an [] Array of ids,
    // then we will have to use a different method other than set. append perhaps
    if (query) {
      params.set("query", query)
    }

    if (value && value !== categoryId) {
      params.set("categoryId", value)
    } else {
      params.delete("categoryId")
    }
    
    const newUrl = pathname === "/search" && query
      ? `/search?${params.toString()}`
      : `/?${params.toString()}`
    router.push(newUrl)
  }

  return <FilterCarousel onSelect={onSelect} value={categoryId} data={data} />
}