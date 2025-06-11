import { Skeleton } from "@/components/ui/skeleton"
import { UserAvatar } from "@/components/user-avatar"

import { SubscriptionButton } from "./subscription-button"

interface SubscriptionItemProps {
  name: string,
  imageUrl: string,
  disabled: boolean,
  subscriberCount: number,
  onUnsubscribe: () => void,
}

export const SubscriptionItemSkeleton = () => {
  return (
    <div className="flex items-start gap-4">
      <Skeleton className="size-10 rounded-full" />

      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-20 mt-1" />
          </div>

          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  )
}

export const SubscriptionItem = ({
  name,
  imageUrl,
  disabled,
  subscriberCount,
  onUnsubscribe
}: SubscriptionItemProps) => {

  return (
    <div className="flex items-start gap-4">
      <UserAvatar
        size="lg"
        imageUrl={imageUrl}
        name={name}
      />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm">
              {name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {subscriberCount.toLocaleString()} subscribers
            </p>
          </div>

          <SubscriptionButton
            isSubscribed
            size="sm"
            onClick={e => {
              e.preventDefault()
              onUnsubscribe()
            }}
            disabled={disabled}

          />
        </div>
      </div>
    </div>
  )
}