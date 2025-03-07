import Image from "next/image"

import { formatDuration } from "@/lib/utils"

interface VideoThumbnailProps {
  title: string,
  duration: number,
  imageUrl?: string | null,
  previewUrl?: string | null,
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
          className="size-full object-cover group-hover:opacity-0"
          src={imageUrl ?? "/placeholder.svg"}
          alt={title}
        />
        <Image
          fill
          unoptimized={!!previewUrl}
          className="opacity-0 size-full object-cover group-hover:opacity-100"
          src={previewUrl ?? "/placeholder.svg"}
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