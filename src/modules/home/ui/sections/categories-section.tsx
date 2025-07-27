"use client"

import { Suspense } from "react"
import { trpc } from "@/trpc/client"
import { useRouter } from "next/navigation"
import { ErrorBoundary } from "react-error-boundary"

import { FilterCarousel } from "@/components/filter-carousel"

// If categoryId becomes an [] of string ids, would need to update here
interface CategoriesSectionProps {
  categoryId?: string
}

export const CategoriesSection = ({ categoryId }: CategoriesSectionProps) => {
  return (
    <Suspense fallback={<CategoriesSkeleton />}>
      <ErrorBoundary fallback={<p>Error...</p>}>
        <CategoriesSectionSuspense categoryId={categoryId} />
      </ErrorBoundary>
    </Suspense>
  )
}

const CategoriesSkeleton = () => {
  return <FilterCarousel isLoading data={[]} onSelect={() => {}} />
}

const CategoriesSectionSuspense = ({ categoryId }: CategoriesSectionProps) => {
  const router = useRouter()
  const [categories] = trpc.categories.getMany.useSuspenseQuery()

  const data = categories.map(({ id, name }) => ({
    value: id,
    label: name
  }))

  const onSelect = (value: string | null) => {
    const url = new URL(window.location.href)

    // If searchParams changes to become an [] Array of ids,
    // then we will have to use a different method other than set. append perhaps
    if (value && value !== categoryId) {
      url.searchParams.set("categoryId", value)
    } else {
      url.searchParams.delete("categoryId")
    }

    router.push(url.toString())
  }

  return <FilterCarousel onSelect={onSelect} value={categoryId} data={data} />
}