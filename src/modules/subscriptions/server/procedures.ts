import { z } from "zod"
import { and, eq } from "drizzle-orm"
import { TRPCError } from "@trpc/server"

import { db } from "@/db"
import { subscriptions } from "@/db/schema"
import { createTRPCRouter, protectedProcedure } from "@/trpc/init"

export const subscriptionsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { userId } = input

      // User is trying to subscribe to themself
      if (userId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST"})
      }

      const [createdSubscription] = await db
        .insert(subscriptions)
        // viewerId is the user that owns the protected procedure
        // creatorId is the user that the viewer chooses to subscribe to (from input)
        .values({ viewerId: ctx.user.id, creatorId: userId })
        .returning()

      return createdSubscription
    }),
    remove: protectedProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { userId } = input

      // User is trying to subscribe to themself
      if (userId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST"})
      }

      const [deletedSubscription] = await db
        .delete(subscriptions)
        .where(
          and(
            eq(subscriptions.viewerId, ctx.user.id),
            eq(subscriptions.creatorId, userId),
          )
        )
        .returning()

      return deletedSubscription
    }),
})