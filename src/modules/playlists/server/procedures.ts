import { z } from "zod"
import { and, desc, eq, getTableColumns, lt, or } from "drizzle-orm"

import { db } from "@/db"
import { createTRPCRouter, protectedProcedure } from "@/trpc/init"
import { users, videoReactions, videos, videoViews } from "@/db/schema"

export const playlistsRouter = createTRPCRouter({
  getHistory: protectedProcedure
    .input(
      z.object({
        cursor: z.object({
          id: z.string().uuid(),
          viewedAt: z.date(),
        })
        .nullish(),
        limit: z.number().min(1).max(100),
      })
    )
    .query(async ({ input, ctx }) => {
      const { id: userId } = ctx.user
      const { cursor, limit } = input

      const viewerVideoViews = db.$with("viewer_video_views").as(
        db
          .select({
            videoId: videoViews.videoId,
            viewedAt: videoViews.updatedAt,
          })
          .from(videoViews)
          .where(eq(videoViews.userId, userId))
      )

      const data = await db
        .with(viewerVideoViews)
        .select({
          ...getTableColumns(videos),
          // Load the user
          user: users,
          viewedAt: viewerVideoViews.viewedAt,
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
        .innerJoin(viewerVideoViews, eq(videos.id, viewerVideoViews.videoId))
        .where(and(
          // Public videos
          eq(videos.visibility, "public"),
          // Pagination
          cursor
            ? or(
                lt(viewerVideoViews.viewedAt, cursor.viewedAt),
                and(
                  eq(viewerVideoViews.viewedAt, cursor.viewedAt),
                  lt(videos.id, cursor.id),
                )
              )
            : undefined,
        ))
        .orderBy(desc(viewerVideoViews.viewedAt), desc(videos.id))
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
              viewedAt: lastItem.viewedAt
            }
          : null
  
      return {
        items,
        nextCursor,
      }
    }),
  getLiked: protectedProcedure
    .input(
      z.object({
        cursor: z.object({
          id: z.string().uuid(),
          likedAt: z.date(),
        })
        .nullish(),
        limit: z.number().min(1).max(100),
      })
    )
    .query(async ({ input, ctx }) => {
      const { id: userId } = ctx.user
      const { cursor, limit } = input

      const viewerVideoReactions = db.$with("viewer_video_reactions").as(
        db
          .select({
            videoId: videoReactions.videoId,
            likedAt: videoReactions.updatedAt,
          })
          .from(videoReactions)
          .where(and(
            eq(videoReactions.userId, userId),
            eq(videoReactions.type, "like"),
          ))
      )

      const data = await db
        .with(viewerVideoReactions)
        .select({
          ...getTableColumns(videos),
          // Load the user
          user: users,
          likedAt: viewerVideoReactions.likedAt,
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
        .innerJoin(viewerVideoReactions, eq(videos.id, viewerVideoReactions.videoId))
        .where(and(
          // Public videos
          eq(videos.visibility, "public"),
          // Pagination
          cursor
            ? or(
                lt(viewerVideoReactions.likedAt, cursor.likedAt),
                and(
                  eq(viewerVideoReactions.likedAt, cursor.likedAt),
                  lt(videos.id, cursor.id),
                )
              )
            : undefined,
        ))
        .orderBy(desc(viewerVideoReactions.likedAt), desc(videos.id))
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
              likedAt: lastItem.likedAt
            }
          : null
  
      return {
        items,
        nextCursor,
      }
    }),
})