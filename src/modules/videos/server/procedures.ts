import { z } from "zod"
import { UTApi } from "uploadthing/server"
import { and, desc, eq, getTableColumns, inArray, isNotNull, lt, or } from "drizzle-orm"

import { db } from "@/db"
import { mux } from "@/lib/mux"
import { TRPCError } from "@trpc/server"
import { workflow } from "@/lib/workflow"
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init"
import { subscriptions, users, videoReactions, videos, videoUpdateSchema, videoViews } from "@/db/schema"

export const videosRouter = createTRPCRouter({
  getManySubscriptions: protectedProcedure
    .input(
      z.object({
        cursor: z.object({
          id: z.string().uuid(),
          updatedAt: z.date(),
        })
        .nullish(),
        limit: z.number().min(1).max(100),
      })
    )
    .query(async ({ input, ctx }) => {
      const { id: userId } = ctx.user
      const { cursor, limit } = input

      const viewerSubscriptions = db.$with("viewer_subscriptions").as(
        db
          .select({
            userId: subscriptions.creatorId,
          })
          .from(subscriptions)
          .where(eq(subscriptions.viewerId, userId))
      )


      const data = await db
        .with(viewerSubscriptions)
        .select({
          ...getTableColumns(videos),
          // Load the user
          user: users,
          // Get the counts
          viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id)),
          likeCount: db.$count(videoReactions, and(
            eq(videoReactions.videoId, videos.id),
            eq(videoReactions.type, "like")
          )),
          dislikeCount: db.$count(videoReactions, and(
            eq(videoReactions.videoId, videos.id),
            eq(videoReactions.type, "dislike")
          )),
        })
        .from(videos)
        // Join the user
        .innerJoin(users, eq(videos.userId, users.id))
        .innerJoin(viewerSubscriptions, eq(viewerSubscriptions.userId, users.id))
        .where(and(
          // Public videos
          eq(videos.visibility, "public"),
          // Pagination
          cursor
            ? or(
                lt(videos.updatedAt, cursor.updatedAt),
                and(
                  eq(videos.updatedAt, cursor.updatedAt),
                  lt(videos.id, cursor.id),
                )
              )
            : undefined,
        ))
        .orderBy(desc(videos.updatedAt), desc(videos.id))
        // Add 1 to the limit to check if there is more data
        .limit(limit + 1)
  
        const hasMore = data.length > limit
        // Remove the last item if there is more data
        const items = hasMore ? data.slice(0, -1) : data
        // Set the next cursor to the last item if there is more data
        const lastItem = items[items.length - 1]
        const nextCursor = hasMore
          ? {
              id: lastItem.id,
              updatedAt: lastItem.updatedAt
            }
          : null
  
      return {
        items,
        nextCursor,
      }
    }),
  getManyTrending: baseProcedure
    .input(
      z.object({
        cursor: z.object({
          id: z.string().uuid(),
          viewCount: z.number(),
        })
        .nullish(),
        limit: z.number().min(1).max(100),
      })
    )
    .query(async ({ input }) => {
      const { cursor, limit } = input

      const viewCountSubquery = db.$count(
        videoViews,
        eq(videoViews.videoId, videos.id),
      )

      const data = await db
        .select({
          ...getTableColumns(videos),
          // Load the user
          user: users,
          // Get the counts
          viewCount: viewCountSubquery,
          likeCount: db.$count(videoReactions, and(
            eq(videoReactions.videoId, videos.id),
            eq(videoReactions.type, "like")
          )),
          dislikeCount: db.$count(videoReactions, and(
            eq(videoReactions.videoId, videos.id),
            eq(videoReactions.type, "dislike")
          )),
        })
        .from(videos)
        // Join the user
        .innerJoin(users, eq(videos.userId, users.id))
        .where(and(
          // Public videos
          eq(videos.visibility, "public"),
          // Pagination
          cursor
            ? or(
                lt(viewCountSubquery, cursor.viewCount),
                and(
                  eq(viewCountSubquery, cursor.viewCount),
                  lt(videos.id, cursor.id),
                )
              )
            : undefined,
        ))
        .orderBy(desc(viewCountSubquery), desc(videos.id))
        // Add 1 to the limit to check if there is more data
        .limit(limit + 1)
  
        const hasMore = data.length > limit
        // Remove the last item if there is more data
        const items = hasMore ? data.slice(0, -1) : data
        // Set the next cursor to the last item if there is more data
        const lastItem = items[items.length - 1]
        const nextCursor = hasMore
          ? {
              id: lastItem.id,
              viewCount: lastItem.viewCount
            }
          : null
  
      return {
        items,
        nextCursor,
      }
    }),
  getMany: baseProcedure
    .input(
      z.object({
        categoryId: z.string().uuid().nullish(),
        userId: z.string().uuid().nullish(),
        cursor: z.object({
          id: z.string().uuid(),
          updatedAt: z.date(),
        })
        .nullish(),
        limit: z.number().min(1).max(100),
      })
    )
    .query(async ({ input }) => {
      const { cursor, limit, categoryId, userId } = input
      const data = await db
        .select({
          ...getTableColumns(videos),
          // Load the user
          user: users,
          // Get the counts
          viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id)),
          likeCount: db.$count(videoReactions, and(
            eq(videoReactions.videoId, videos.id),
            eq(videoReactions.type, "like")
          )),
          dislikeCount: db.$count(videoReactions, and(
            eq(videoReactions.videoId, videos.id),
            eq(videoReactions.type, "dislike")
          )),
        })
        .from(videos)
        // Join the user
        .innerJoin(users, eq(videos.userId, users.id))
        .where(and(
          // Public videos
          eq(videos.visibility, "public"),
          // By category id if present
          categoryId ? eq(videos.categoryId, categoryId) : undefined,
          // By userId id if present
          userId ? eq(videos.userId, userId) : undefined,
          // Pagination
          cursor
            ? or(
                lt(videos.updatedAt, cursor.updatedAt),
                and(
                  eq(videos.updatedAt, cursor.updatedAt),
                  lt(videos.id, cursor.id),
                )
              )
            : undefined,
        ))
        .orderBy(desc(videos.updatedAt), desc(videos.id))
        // Add 1 to the limit to check if there is more data
        .limit(limit + 1)
  
        const hasMore = data.length > limit
        // Remove the last item if there is more data
        const items = hasMore ? data.slice(0, -1) : data
        // Set the next cursor to the last item if there is more data
        const lastItem = items[items.length - 1]
        const nextCursor = hasMore
          ? {
              id: lastItem.id,
              updatedAt: lastItem.updatedAt
            }
          : null
  
      return {
        items,
        nextCursor,
      }
    }),
  // Have this explained further in the future regarding sub queries and common table expression
  getOne: baseProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const { clerkUserId } = ctx

      let userId

      const [user] = await db
        .select()
        .from(users)
        // The query checks if a user with this clerkUserId exists in the users table.
        .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []))

      if (user) {
        userId = user.id
      }

      // Common table expression
      const viewerReactions = db.$with("viewer_reactions").as(
        db
          .select({
            videoId: videoReactions.videoId,
            type: videoReactions.type,
          })
          .from(videoReactions)
          // Filters the reactions to only include those made by the currently authenticated user
          .where(inArray(videoReactions.userId, userId ? [userId] : []))
      )

      // Common table expression
      const viewerSubscriptions = db.$with("viewer_subscriptions").as(
        db
          .select()
          .from(subscriptions)
          .where(inArray(subscriptions.viewerId, userId ? [userId] : []))
      )

      const [existingVideo] = await db
        .with(viewerReactions, viewerSubscriptions) // Using the CTEs
        .select({
          ...getTableColumns(videos), // Select all columns from videos
          user: {
            ...getTableColumns(users), // Select all columns from users (uploader)
            subscriberCount: db.$count(subscriptions, eq(subscriptions.creatorId, users.id)),
            // If ever breaks, use: sql<boolean>`${isNotNull(viewerSubscriptions.viewerId)}`
            viewerSubscribed: isNotNull(viewerSubscriptions.viewerId).mapWith(Boolean)
          },
          // Subquery for view count
          viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id)),
          // Subquery for like count
          likeCount: db.$count(
            videoReactions,
            and(
              eq(videoReactions.videoId, videos.id),
              eq(videoReactions.type, "like"),
            )
          ),
          // Subquery for dislike count
          dislikeCount: db.$count(
            videoReactions,
            and(
              eq(videoReactions.videoId, videos.id),
              eq(videoReactions.type, "dislike"),
            )
          ),
          // Viewer’s reaction (from the CTE)
          viewerReaction: viewerReactions.type,
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id)) // Join with the author of the video
        .leftJoin(viewerReactions, eq(viewerReactions.videoId, videos.id)) // Join with viewer reactions
        .leftJoin(viewerSubscriptions, eq(viewerSubscriptions.creatorId, users.id)) // Join with viewer subscriptions
        .where(eq(videos.id, input.id)) // Filter for the requested video

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
  revalidate: protectedProcedure
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

        if (!existingVideo.muxUploadId) {
          throw new TRPCError({ code: "BAD_REQUEST" })
        }

        const upload = await mux.video.uploads.retrieve(
          existingVideo.muxUploadId
        )

        if (!upload || !upload.asset_id) {
          throw new TRPCError({ code: "BAD_REQUEST" })
        }

        const asset = await mux.video.assets.retrieve(
          upload.asset_id
        )

        if (!asset) {
          throw new TRPCError({ code: "BAD_REQUEST" })
        }

        const playbackId = asset.playback_ids?.[0].id
        const duration = asset.duration ? Math.round(asset.duration * 1000) : 0

        // TODO: Potentially revalidate trackId and trackStatus to keep subtitle status synced

        const [updatedVideo] = await db
          .update(videos)
          .set({
            muxStatus: asset.status,
            muxPlaybackId: playbackId,
            muxAssetId: asset.id,
            duration,
          })
          .where(and(
            eq(videos.id, input.id),
            eq(videos.userId, userId),
          ))
          .returning()
        
        return updatedVideo
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
            // Generates subtitles/transcripts in english
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