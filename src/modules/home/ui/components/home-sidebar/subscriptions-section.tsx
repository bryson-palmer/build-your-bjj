"use client"

import Link from "next/link"
import { trpc } from "@/trpc/client"
import { ListIcon } from "lucide-react"
import { usePathname } from "next/navigation"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar"
import { DEFAULT_LIMIT } from "@/constants"
import { Skeleton } from "@/components/ui/skeleton"
import { UserAvatar } from "@/components/user-avatar"

export const LoadingSkeleton = () => (
  <>
    {[1, 2, 3, 4].map(i => (
      <SidebarMenuItem key={i}>
        <SidebarMenuButton disabled>
          <Skeleton className="size-6 rounded-full shrink-0" />
          <Skeleton className="h-4 w-full" />
        </SidebarMenuButton>
      </SidebarMenuItem>
    ))}
  </>
)

export const SubscriptionsSection = () => {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()
  const { data, isLoading } = trpc.subscriptions.getMany.useInfiniteQuery(
    { limit: DEFAULT_LIMIT },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  )

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Subscriptions</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {isLoading && <LoadingSkeleton />}
          {!isLoading && data?.pages
            .flatMap((page) => page.items)
            .map(subscription => (
            <SidebarMenuItem key={`${subscription.creatorId}-${subscription.viewerId}`}>
              <SidebarMenuButton
                asChild
                tooltip={subscription.user.name}
                isActive={pathname === `/users/${subscription.user.id}`}
              >
                <Link
                  prefetch
                  href={`/users/${subscription.user.id}`}
                  className="flex items-center gap-4"
                  onClick={() => setOpenMobile(false)}
                >
                  <UserAvatar
                    imageUrl={subscription.user.imageUrl}
                    name={subscription.user.name}
                    size="xs"
                  />
                  <span className="text-sm">{subscription.user.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          {!isLoading && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/subscriptions"}
              >
                <Link
                  prefetch
                  href="/subscriptions"
                  className="flex items-center gap-4"
                  onClick={() => setOpenMobile(false)}
                >
                  <ListIcon className="size-4" />
                  <span className="text-sm">All subscriptions</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}