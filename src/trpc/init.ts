import { auth } from "@clerk/nextjs/server"
import { initTRPC, TRPCError } from "@trpc/server"
import { eq } from "drizzle-orm"
import { cache } from "react"
import superjson from "superjson"

import { db } from "@/db"
import { users } from "@/db/schema"
import { ratelimit } from "@/lib/ratelimit"

/*
  Keep context lightweight
  because the context will run for every procedure we do
  regardless if it's a public or private procedure.
  Calling the auth() doesn't use fetch() and only
  destructure the jwt token.
*/
export const createTRPCContext = cache(async () => {
  const { userId } = await auth()
  return { clerkUserId: userId }
})

export type Context = Awaited<ReturnType<typeof createTRPCContext>>

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.context<Context>().create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
})
// Base router and procedure helpers
export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory
export const baseProcedure = t.procedure
export const protectedProcedure = t.procedure.use(async function isAuthed(opts) {
  const { ctx } = opts

  // If user is not logged in
  if (!ctx.clerkUserId) {
    throw new TRPCError({ code: "UNAUTHORIZED"})
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, ctx.clerkUserId))
    .limit(1)

    // If user is not in the database
    if (!user) {
      throw new TRPCError({ code: "UNAUTHORIZED"})
    }

    const { success } = await ratelimit.limit(user.id)

    // If user doesn't have a successful ratelimit
    if (!success) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS" })
    }

  return opts.next({
    ctx: {
      ...ctx,
      user,
    },
  })
})