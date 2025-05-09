import { HydrateClient, trpc } from "@/trpc/server"

import { DEFAULT_LIMIT } from "@/constants"

import { SubscriptionsView } from "@/modules/home/ui/views/subscriptions-view"

export const dynamic = "force-dynamic"

const Page = async () => {
  void trpc.videos.getManySubscriptions.prefetchInfinite({ limit: DEFAULT_LIMIT })

  return (
    <HydrateClient>
      <SubscriptionsView />
    </HydrateClient>
  )
}

export default Page