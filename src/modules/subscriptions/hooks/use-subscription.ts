import { toast } from "sonner"
import { useClerk } from "@clerk/nextjs"

import { trpc } from "@/trpc/client"

interface UseSubscriptionProps {
  userId: string,
  isSubscribed: boolean,
  fromVideoId?: string,
}

export const useSubscription = ({
  userId,
  isSubscribed,
  fromVideoId,
}: UseSubscriptionProps) => {
  const clerk = useClerk()
  const utils = trpc.useUtils()

  const subscribe = trpc.subscriptions.create.useMutation({
    onSuccess: () => {
      toast.success("Subscribed")
      utils.videos.getManySubscriptions.invalidate()
      utils.users.getOne.invalidate({ id: userId })
      // TODO: reinvalidate subscriptions.getMany

      if (fromVideoId) {
        utils.videos.getOne.invalidate({ id: fromVideoId })
      }
    },
    onError: (error) => {
      toast.error("Something went wrong")

      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn()
      }
    }
  })

  const unSubscribe = trpc.subscriptions.remove.useMutation(
    {
      onSuccess: () => {
        toast.success("Unsubscribed")
        utils.videos.getManySubscriptions.invalidate()
        utils.users.getOne.invalidate({ id: userId })
        // TODO: reinvalidate subscriptions.getMany
  
        if (fromVideoId) {
          utils.videos.getOne.invalidate({ id: fromVideoId })
        }
      },
      onError: (error) => {
        toast.error("Something went wrong")
  
        if (error.data?.code === "UNAUTHORIZED") {
          clerk.openSignIn()
        }
      }
    }
  )

  const isPending = subscribe.isPending || unSubscribe.isPending

  const onClick = () => {
    if (isSubscribed) {
      unSubscribe.mutate({ userId })
    } else {
      subscribe.mutate({ userId })
    }
  }

  return {
    isPending,
    onClick,
  }
}