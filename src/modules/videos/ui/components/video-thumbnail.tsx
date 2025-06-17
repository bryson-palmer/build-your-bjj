import Image from "next/image"

import { formatDuration } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { THUMBNAIL_FALLBACK } from "@/modules/videos/constants"

interface VideoThumbnailProps {
  title: string,
  duration: number,
  imageUrl?: string | null,
  previewUrl?: string | null,
}

export const VideoThumbnailSkeleton = () => {
  return (
    <div className="relative w-full overflow-hidden rounded-xl aspect-video">
      <Skeleton className="size-full" />
    </div>
  )
}

export const VideoThumbnail = ({
  title,
  duration,
  imageUrl,
  previewUrl,
}: VideoThumbnailProps) => {
  return (
    <div className="relative group">
      {/* Thumbnail wrapper */}
      <div className="relative w-full overflow-hidden rounded-xl aspect-video">
        <Image
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="size-full object-cover group-hover:opacity-0"
          src={imageUrl ?? THUMBNAIL_FALLBACK}
          alt={title}
        />
        <Image
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          unoptimized={!!previewUrl}
          className="opacity-0 size-full object-cover group-hover:opacity-100"
          src={previewUrl ?? THUMBNAIL_FALLBACK}
          alt={title}
        />
      </div>

      {/* Video duration box */}
      <div className="absolute bottom-2 right-2 px-1 py-0.5 rounded bg-black/80 text-white text-xs font-medium">
        {formatDuration(duration)}
      </div>
    </div>
  )
}