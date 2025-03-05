import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import {
  VideoAssetCreatedWebhookEvent,
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
  }

  // Successful return
  return new Response("Webhook received", { status: 200 })
}