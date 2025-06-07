import { z } from "zod"
import { eq, getTableColumns, inArray, isNotNull } from "drizzle-orm"

import { db } from "@/db"
import { TRPCError } from "@trpc/server"
import { subscriptions, users, videos } from "@/db/schema"
import { baseProcedure, createTRPCRouter } from "@/trpc/init"

export const usersRouter = createTRPCRouter({
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
      const viewerSubscriptions = db.$with("viewer_subscriptions").as(
        db
          .select()
          .from(subscriptions)
          .where(inArray(subscriptions.viewerId, userId ? [userId] : []))
      )

      const [existingUser] = await db
        .with(viewerSubscriptions) // Using the CTEs
        .select({
          ...getTableColumns(users), // Select all columns from users
          viewerSubscribed: isNotNull(viewerSubscriptions.viewerId).mapWith(Boolean),
          videoCount: db.$count(videos, eq(videos.userId, users.id)),
          subscriberCount: db.$count(subscriptions, eq(subscriptions.creatorId, users.id)),
        })
        .from(users)
        .leftJoin(viewerSubscriptions, eq(viewerSubscriptions.creatorId, users.id)) // Join with viewer subscriptions
        .where(eq(users.id, input.id)) // Filter for the requested video

      if (!existingUser) throw new TRPCError({ code: "NOT_FOUND" })

      return existingUser
    }),
})