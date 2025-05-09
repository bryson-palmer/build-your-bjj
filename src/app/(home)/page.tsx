import { HydrateClient, trpc } from "@/trpc/server"

import { DEFAULT_LIMIT } from "@/constants"

import { HomeView } from "@/modules/home/ui/views/home-view"

export const dynamic = "force-dynamic"

// Make searchParams an [] Array of string ids so we can collect many category ids
interface PageProps {
  searchParams: Promise<{
    categoryId?: string
}>
}

const Page = async ({ searchParams }: PageProps) => {
  const { categoryId } = await searchParams

  void trpc.videos.getMany.prefetchInfinite({ categoryId, limit: DEFAULT_LIMIT })
  void trpc.categories.getMany.prefetch()

  return (
    <HydrateClient>
      <HomeView categoryId={categoryId} />
    </HydrateClient>
  )
}

export default Page