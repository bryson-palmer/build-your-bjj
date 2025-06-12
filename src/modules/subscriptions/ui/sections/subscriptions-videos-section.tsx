"use client"

import Link from "next/link"
import { toast } from "sonner"
import { Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"

import { trpc } from "@/trpc/client"
import { DEFAULT_LIMIT } from "@/constants"

import { InfiniteScroll } from "@/components/infinite-scroll"

import { SubscriptionItem, SubscriptionItemSkeleton } from "../components/subscription-item"

export const SubscriptionsVideosSection = () => {
  return (
    <Suspense fallback={<SubscriptionsVideosSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <SubscriptionsVideosSectionSuspense />
      </ErrorBoundary>
    </Suspense>
  )
}

const SubscriptionsVideosSectionSkeleton = () => {
  return (
    <div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
            <SubscriptionItemSkeleton key={index} />
          ))
        }
      </div>
    </div>
  )
}

const SubscriptionsVideosSectionSuspense = () => {
  const utils = trpc.useUtils()
  const [subscriptions, query] = trpc.subscriptions.getMany.useSuspenseInfiniteQuery(
    { limit: DEFAULT_LIMIT },
    {
      // Look into how this works
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  )

  const unSubscribe = trpc.subscriptions.remove.useMutation(
    {
      onSuccess: (data) => {
        toast.success("Unsubscribed")
        utils.subscriptions.getMany.invalidate()
        utils.videos.getManySubscriptions.invalidate()
        utils.users.getOne.invalidate({ id: data.creatorId })
      },
      onError: () => {
        toast.error("Something went wrong")
      }
    }
  ) 

  return (
    <div>
      <div className="flex flex-col gap-4">
        {subscriptions.pages
          .flatMap(page => page.items)
          .map(subscription => (
            <Link prefetch key={subscription.creatorId} href={`/users/${subscription.user.id}`}>
              <SubscriptionItem
                name={subscription.user.name}
                disabled={unSubscribe.isPending}
                imageUrl={subscription.user.imageUrl}
                subscriberCount={subscription.user.subscriberCount}
                onUnsubscribe={() => unSubscribe.mutate({ userId: subscription.creatorId })}
              />
            </Link>
          ))
        }
      </div>
      <InfiniteScroll
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        fetchNextPage={query.fetchNextPage}
      />
    </div>
  )
}