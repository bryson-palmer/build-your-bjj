"use client"

import { toast } from "sonner"
import { Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"

import { trpc } from "@/trpc/client"
import { DEFAULT_LIMIT } from "@/constants"

import { InfiniteScroll } from "@/components/infinite-scroll"
import { VideoRowCard, VideoRowCardSkeleton } from "@/modules/videos/ui/components/video-row-card"
import { VideoGridCard, VideoGridCardSkeleton } from "@/modules/videos/ui/components/video-grid-card"

interface VideosSectionProps {
  playlistId: string,
}

export const VideosSection = ({
  playlistId,
}: VideosSectionProps) => {
  return (
    <Suspense fallback={<VideosSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <VideosSectionSuspense playlistId={playlistId} />
      </ErrorBoundary>
    </Suspense>
  )
}

const VideosSectionSkeleton = () => {
  return (
    <div>
      <div className="flex flex-col gap-4 gap-y-10 md:hidden">
        {Array.from({ length: 18 }).map((_, index) => (
            <VideoGridCardSkeleton key={index} />
          ))
        }
      </div>
      <div className="hidden md:flex flex-col gap-4">
        {Array.from({ length: 18 }).map((_, index) => (
            <VideoRowCardSkeleton key={index} size="compact" />
          ))
        }
      </div>
    </div>
  )
}

const VideosSectionSuspense = ({
  playlistId,
}: VideosSectionProps) => {
  const utils = trpc.useUtils()
  const [videos, query] = trpc.playlists.getVideosForPlaylist.useSuspenseInfiniteQuery(
    { limit: DEFAULT_LIMIT, playlistId },
    {
      // Look into how this works
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  )

  const removeVideo = trpc.playlists.removeVideo.useMutation({
      onSuccess: (data) => {
        toast.success("Video removed from playlist")
        utils.playlists.getMany.invalidate()
        utils.playlists.getManyForVideo.invalidate({ videoId: data.videoId })
        utils.playlists.getOne.invalidate({ id: data.playlistId })
        utils.playlists.getVideosForPlaylist.invalidate({ playlistId: data.playlistId })
      },
      onError: () => {
        toast.error("Something went wrong")
      }
    })

  return (
    <div>
      {/* Mobile */}
      <div className="flex flex-col gap-4 gap-y-10 md:hidden">
        {videos.pages
          .flatMap(page => page.items)
          .map(video => (
            <VideoGridCard
              key={video.id}
              data={video}
              onRemove={() => removeVideo.mutate({ playlistId, videoId: video.id })}
            />
          ))
        }
      </div>
      {/* Desktop */}
      <div className="hidden md:flex flex-col gap-4">
        {videos.pages
          .flatMap(page => page.items)
          .map(video => (
            <VideoRowCard
              key={video.id}
              data={video}
              size="compact"
              onRemove={() => removeVideo.mutate({ playlistId, videoId: video.id })}
            />
          ))
        }
      </div>
      <InfiniteScroll
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        fetchNextPage={query.fetchNextPage}
      />
    </div>
  )
}