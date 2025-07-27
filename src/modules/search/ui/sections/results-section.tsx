"use client"

import { Suspense } from "react"
import { trpc } from "@/trpc/client"
import { DEFAULT_LIMIT } from "@/constants"
import { ErrorBoundary } from "react-error-boundary"

import { InfiniteScroll } from "@/components/infinite-scroll"
import { VideoRowCard, VideoRowCardSkeleton } from "@/modules/videos/ui/components/video-row-card"
import { VideoGridCard, VideoGridCardSkeleton } from "@/modules/videos/ui/components/video-grid-card"

interface ResultsSectionProps {
  query: string | undefined,
  categoryId: string | undefined,
}

export const ResultsSection = (props: ResultsSectionProps) => {
  return (
    <Suspense
      key={`${props.query}-${props.categoryId}`}
      fallback={<ResultsSectionSkeleton
    />}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <ResultsSectionSuspense {...props} />
      </ErrorBoundary>
    </Suspense>
  )
}

const ResultsSectionSkeleton = () => {
  return (
    <div>
      {/* Mobile */}
      <div className="flex flex-col gap-4 p-4 gap-y-10 pt-6 md:hidden">
        {Array.from({ length: 5}).map((_, index) => (
          <VideoGridCardSkeleton key={index} />
        ))}
      </div>
      {/* Desktop */}
      <div className="hidden flex-col gap-4 md:flex">
        {Array.from({ length: 5}).map((_, index) => (
          <VideoRowCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}

const ResultsSectionSuspense = ({
  query,
  categoryId,
}: ResultsSectionProps) => {
  const [results, resultsQuery] = trpc.search.getMany.useSuspenseInfiniteQuery(
    { query, categoryId, limit: DEFAULT_LIMIT },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  )

  const videos = results.pages.flatMap(page => page.items)
  const hasVideos = !!videos.length
  
  // Cleared search input return early
  if (!query && !categoryId) {
    return (
      <div className="text-center text-muted-foreground mt-10">
        <h2 className="text-xl font-semibold">Start Exploring</h2>
        <p className="mt-2">Use the search box above or select a category to begin.</p>
      </div>
    )
  }

  return (
    <>
      {!hasVideos && (
        <div className="text-center text-muted-foreground mt-10">
          <h2 className="text-xl font-semibold">We&apos;re sorry. We were not able to find a match.</h2>
          <p className="mt-2">Try another search</p>
        </div>
      )}
      
      {hasVideos && (
        <div>
          {/* Mobile */}
          <div className="flex flex-col gap-4 gap-y-10 md:hidden">
            {videos
              .map(video => (
                <VideoGridCard key={video.id} data={video} />
              ))
            }
          </div>
          
          {/* Desktop */}
          <div className="hidden md:flex flex-col gap-4">
            {videos
              .map(video => (
                <VideoRowCard key={video.id} data={video} />
              ))
            }
          </div>
          <InfiniteScroll
            hasNextPage={resultsQuery.hasNextPage}
            isFetchingNextPage={resultsQuery.isFetchingNextPage}
            fetchNextPage={resultsQuery.fetchNextPage}
          />
        </div>
      )}
    </>
  )
}