import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import {
  VideoAssetCreatedWebhookEvent,
  VideoAssetDeletedWebhookEvent,
  VideoAssetErroredWebhookEvent,
  VideoAssetReadyWebhookEvent,
  VideoAssetTrackReadyWebhookEvent,
} from "@mux/mux-node/resources/webhooks"

import { db } from "@/db"
import { mux } from "@/lib/mux"
import { videos } from "@/db/schema"

const SIGNING_SECRET = process.env.MUX_WEBHOOK_SECRET!

type WebhookEvent =
| VideoAssetCreatedWebhookEvent
| VideoAssetDeletedWebhookEvent
| VideoAssetErroredWebhookEvent
| VideoAssetReadyWebhookEvent
| VideoAssetTrackReadyWebhookEvent

export const POST = async (request: Request) => {
  // Unauthorized
  if (!SIGNING_SECRET) {
    throw new Error("SIGNING_SECRET is not set")
  }

  // Obtain Mux signiture
  const headersPayload = await headers()
  const muxSignature = headersPayload.get("mux-signature")

  if (!muxSignature) {
    return new Response("No signature found", { status: 401 })
  }

  const payload = await request.json()
  const body = JSON.stringify(payload)

  // Verify connection
  mux.webhooks.verifySignature(
    body,
    {
      "mux-signature": muxSignature
    },
    SIGNING_SECRET
  )

  switch (payload.type as WebhookEvent["type"]) {
    case "video.asset.created": {
      const data = payload.data as VideoAssetCreatedWebhookEvent["data"]

      // Mux error: id doesn't exist in Mux
      if (!data.upload_id) {
        return new Response("No upload ID found", { status: 400 })
      }

      // Connect Mux video asset to db
      await db
        .update(videos)
        .set({
          muxAssetId: data.id,
          muxStatus: data.status,
        })
        .where(eq(videos.muxUploadId, data.upload_id))
      break
    }

    case "video.asset.ready": {
      const data = payload.data as VideoAssetReadyWebhookEvent["data"]
      const playbackId = data.playback_ids?.[0].id

      // Mux error: upload or playback id doesn't exist in Mux
      if (!data.upload_id) {
        return new Response("Missing upload ID", { status: 400 })
      }
      if (!playbackId) {
        return new Response("Missing playback ID", { status: 400 })
      }

      const thumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`
      const previewUrl = `https://image.mux.com/${playbackId}/animated.gif`

      const duration = data.duration ? Math.round(data.duration * 1000) : 0

      await db
        .update(videos)
        .set({
          muxAssetId: data.id,
          muxPlaybackId: playbackId,
          muxStatus: data.status,
          thumbnailUrl,
          previewUrl,
          duration,
        })
        .where(eq(videos.muxUploadId, data.upload_id))
      break
    }

    case "video.asset.errored": {
      const data = payload.data as VideoAssetErroredWebhookEvent["data"]

      // Mux error: upload id doesn't exist in Mux
      if (!data.upload_id) {
        return new Response("Missing upload ID", { status: 400 })
      }

      await db
        .update(videos)
        .set({
          muxStatus: data.status
        })
        .where(eq(videos.muxUploadId, data.upload_id))
      break
    }

    case "video.asset.deleted": {
      const data = payload.data as VideoAssetDeletedWebhookEvent["data"]

      // Mux error: upload id doesn't exist in Mux
      if (!data.upload_id) {
        return new Response("Missing upload ID", { status: 400 })
      }

      await db
        .delete(videos)
        .where(eq(videos.muxUploadId, data.upload_id))
      break
    }

    case "video.asset.track.ready": {
      const data = payload.data as VideoAssetTrackReadyWebhookEvent["data"] & {
        asset_id: string,
      }

      // Typescript incorrectly says that asset_id does not exist
      const assetId = data.asset_id
      const trackId = data.id
      const status = data.status

      // Mux error: asset id doesn't exist in Mux
      if (!assetId) {
        return new Response("Missing asset ID", { status: 400 })
      }

      await db
        .update(videos)
        .set({
          muxTrackId: trackId,
          muxTrackStatus: status
        })
        .where(eq(videos.muxAssetId, assetId))
      break
    }
  }

  // Successful return
  return new Response("Webhook received", { status: 200 })
}