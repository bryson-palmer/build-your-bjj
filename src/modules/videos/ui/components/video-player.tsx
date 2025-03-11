"use client"

import MuxPlayer from "@mux/mux-player-react"
import { THUMBNAIL_FALLBACK } from "@/modules/videos/constants"

interface VideoPlayerProps {
  playbackId?: string | null | undefined,
  thumbnailUrl?: string | null | undefined,
  autoPlay?: boolean,
  onPlay?: () => void
}

export const VideoPlayer = ({
  playbackId,
  thumbnailUrl,
  autoPlay,
  onPlay,
}: VideoPlayerProps) => {
  if (!playbackId) return null

  return (
    <MuxPlayer
      className="w-full h-full object-contain"
      accentColor="#FF2056"
      playbackId={playbackId}
      playerInitTime={0}
      thumbnailTime={0}
      poster={thumbnailUrl ?? THUMBNAIL_FALLBACK}
      autoPlay={autoPlay}
      onPlay={onPlay}
    />
  )
}