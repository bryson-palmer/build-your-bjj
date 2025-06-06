import { z } from "zod"
import { and, eq } from "drizzle-orm"

import { db } from "@/db"
import { commentReactions } from "@/db/schema"
import { createTRPCRouter, protectedProcedure } from "@/trpc/init"

export const commentReactionsRouter = createTRPCRouter({
  like: protectedProcedure
    .input(z.object({ commentId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { commentId } = input
      const { id: userId } = ctx.user

      const [existingCommentReactionLike] = await db
        .select()
        .from(commentReactions)
        .where(
          and(
            eq(commentReactions.commentId, commentId),
            eq(commentReactions.userId, userId),
            eq(commentReactions.type, "like"),
          )
        )

      if (existingCommentReactionLike) {
        const [deletedViewerReaction] = await db
          .delete(commentReactions)
          .where(
            and(
              eq(commentReactions.userId, userId),
              eq(commentReactions.commentId, commentId),
            )
          )
          .returning()

        return deletedViewerReaction
      }

      const [createdCommentReaction] = await db
        .insert(commentReactions)
        .values({
          userId,
          commentId,
          type: "like",
        })
        // Need explanation on upserting
        // in the case that the reaction that comes in is "dislike"
        .onConflictDoUpdate({
          target: [commentReactions.userId, commentReactions.commentId],
          set: {
            type: "like"
          }
        })
        .returning()

      return createdCommentReaction
    }),
  dislike: protectedProcedure
    .input(z.object({ commentId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { commentId } = input
      const { id: userId } = ctx.user

      const [existingCommentReactionDislike] = await db
        .select()
        .from(commentReactions)
        .where(
          and(
            eq(commentReactions.commentId, commentId),
            eq(commentReactions.userId, userId),
            eq(commentReactions.type, "dislike"),
          )
        )

      if (existingCommentReactionDislike) {
        const [deletedViewerReaction] = await db
          .delete(commentReactions)
          .where(
            and(
              eq(commentReactions.userId, userId),
              eq(commentReactions.commentId, commentId),
            )
          )
          .returning()

        return deletedViewerReaction
      }

      const [createdCommentReaction] = await db
        .insert(commentReactions)
        .values({
          userId,
          commentId,
          type: "dislike",
        })
        // Need explanation on upserting
        // in the case that the reaction that comes in is "dislike"
        .onConflictDoUpdate({
          target: [commentReactions.userId, commentReactions.commentId],
          set: {
            type: "dislike"
          }
        })
        .returning()

      return createdCommentReaction
    }),
})