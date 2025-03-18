import { z } from "zod"
import { UTApi } from "uploadthing/server"
import { and, eq, getTableColumns } from "drizzle-orm"

import { db } from "@/db"
import { mux } from "@/lib/mux"
import { TRPCError } from "@trpc/server"
import { workflow } from "@/lib/workflow"
import { users, videos, videoUpdateSchema } from "@/db/schema"
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init"

export const videosRouter = createTRPCRouter({
  getOne: baseProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const [existingVideo] = await db
        .select({
          ...getTableColumns(videos),
          user: {
            ...getTableColumns(users)
          },
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id))
        .where(eq(videos.id, input.id))

      if (!existingVideo) throw new TRPCError({ code: "NOT_FOUND" })

      return existingVideo
    }),
  generateTitle: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user

      const { workflowRunId } = await workflow.trigger({
        url: `${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/title`,
        body: { userId, videoId: input.id },
      })

      return workflowRunId
    }),
  generateDescription: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user

      const { workflowRunId } = await workflow.trigger({
        url: `${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/description`,
        body: { userId, videoId: input.id },
      })

      return workflowRunId
    }),
  generateThumbnail: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      prompt: z.string().min(10),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user

      const { workflowRunId } = await workflow.trigger({
        url: `${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/thumbnail`,
        body: { userId, videoId: input.id, prompt: input.prompt },
      })

      return workflowRunId
    }),
  restoreThumbnail: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
    const { id: userId } = ctx.user

      const [existingVideo] = await db
        .select()
        .from(videos)
        .where(and(
          eq(videos.id, input.id),
          eq(videos.userId, userId),
        ))
        
        if (!existingVideo) {
          throw new TRPCError({ code: "NOT_FOUND" })
        }

        if (existingVideo.thumbnailKey) {
          const utapi = new UTApi()

          // Clean up uploadThing thumbnail by key
          await utapi.deleteFiles(existingVideo.thumbnailKey)
          // Clean up database thumbnail url & key
          await db
            .update(videos)
            .set({ thumbnailKey: null, thumbnailUrl: null })
            .where(and(
              eq(videos.id, input.id),
              eq(videos.userId, userId),
            ))
        }

        if (!existingVideo.muxPlaybackId) {
          throw new TRPCError({ code: "BAD_REQUEST" })
        }

        const utapi = new UTApi()

        const tempThumbnailUrl = `https://image.mux.com/${existingVideo.muxPlaybackId}/thumbnail.jpg`
        const uploadedThumbnail = await utapi.uploadFilesFromUrl(tempThumbnailUrl)

        if (!uploadedThumbnail.data) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" })
        }

        const { key: thumbnailKey, url: thumbnailUrl } = uploadedThumbnail.data

        const [updatedVideo] = await db
          .update(videos)
          .set({ thumbnailUrl, thumbnailKey })
          .where(and(
            eq(videos.id, input.id),
            eq(videos.userId, userId),
          ))
          .returning()

        return updatedVideo
    }),
  remove: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user

      const [removedVideo] = await db
        .delete(videos)
        .where(and(
          eq(videos.id, input.id), // Check if vid id eq input vid id
          eq(videos.userId, userId), // Check if we own video and vid user id eq context user id
        ))
        .returning()

        if (!removedVideo) {
          throw new TRPCError({ code: "NOT_FOUND" })
        }

        return removedVideo
    }),
  update: protectedProcedure
    .input(videoUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user

      if (!input.id) {
        throw new TRPCError({ code: "BAD_REQUEST" })
      }

      const [updatedVideo] = await db
        .update(videos)
        .set({
          title: input.title,
          description: input.description,
          categoryId: input.categoryId,
          visibility: input.visibility,
          updatedAt: new Date(),
        })
        .where(and(
          eq(videos.id, input.id),
          eq(videos.userId, userId),
        ))
        .returning()

      if (!updatedVideo) {
        throw new TRPCError({ code: "NOT_FOUND" })
      }

      return updatedVideo
    }),
  create: protectedProcedure.mutation(async ({ ctx }) => {
    const { id: userId } = ctx.user

    // Create new mux video asset with input configs
    const upload = await mux.video.uploads.create({
      new_asset_settings: {
        passthrough: userId,
        playback_policy: ["public"],
        input: [
          {
            generated_subtitles: [
              {
                language_code: "en",
                name: "English",
              }
            ]
          }
        ]
      },
      cors_origin: "*" // TODO: in production, set to the url
    })

    // Create new database video
    const [video] = await db
      .insert(videos)
      .values({
        userId,
        title: "Untitled",
        muxStatus: "waiting",
        muxUploadId: upload.id,
      })
      .returning()

      return {
        video: video,
        url: upload.url,
      }
  })
})