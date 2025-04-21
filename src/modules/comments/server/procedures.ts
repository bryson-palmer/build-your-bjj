import { z } from "zod"
import { and, count, desc, eq, getTableColumns, lt, or } from "drizzle-orm"

import { db } from "@/db"
import { comments, users } from "@/db/schema"
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init"

export const commentsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        videoId: z.string().uuid(),
        value: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { videoId, value } = input
      const { id: userId } = ctx.user

      const [createdComment] = await db
        .insert(comments)
        .values({ userId, value, videoId })
        .returning()

      return createdComment
    }),
  getMany: baseProcedure
    .input(
      z.object({
        videoId: z.string().uuid(),
        cursor: z.object({
          id: z.string().uuid(),
          updatedAt: z.date(),
        }).nullish(),
        limit: z.number().min(1).max(100),
      })
    )
    .query(async ({ input }) => {
      const { cursor, limit, videoId } = input

      const [totalData, data] = await Promise.all([
        db
          .select({
            count: count()
          })
          .from(comments)
          .where(eq(comments.videoId, videoId)),
        db
          // Step 1: Select columns from the `comments` table and all fields from the `users` table.
          .select({
            ...getTableColumns(comments), // Gets all the columns from the `comments` table.
            user: users,                  // Selects the full `users` record and maps it under the key `user`.
            // totalCount: db.$count(comments, eq(comments.videoId, videoId))
          })
          // Step 2: Specify the main table to query from.
          .from(comments)
          // Step 3: Add WHERE clause to filter by:
          //    - Matching the videoId.
          //    - Optional pagination cursor.
          .where(and(
            eq(comments.videoId, videoId), // Filter: only comments for a specific video.
            // If a cursor is provided (for pagination), apply this logic:
            // Fetch comments that are:
            // - older than the cursor's updatedAt timestamp
            // OR
            // - have the same updatedAt timestamp but a smaller ID (to break ties and ensure consistent order)
            cursor
              ? or(
                  lt(comments.updatedAt, cursor.updatedAt),
                  and(
                    eq(comments.updatedAt, cursor.updatedAt),
                    lt(comments.id, cursor.id)
                  )
              )
            : undefined, // If no cursor, don’t apply this extra filter.
          ))
          // Step 4: Join `users` table to get info about the comment authors.
          .innerJoin(users, eq(comments.userId, users.id))
          // Step 5: Order by newest comments first.
          .orderBy(desc(comments.updatedAt), desc(comments.id))
          // Step 6: Fetch `limit + 1` records.
          // Why +1? To check if there’s another page (for pagination).
          .limit(limit + 1)
      ])

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
        totalCount: totalData[0].count
      }
    }),
})