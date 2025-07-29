"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Skeleton } from "./ui/skeleton"
import { Badge } from "@/components/ui/badge"

interface FilterCarouselProps {
  value?: string | null
  isLoading?: boolean
  onSelect(value: string | null): void
  data: {
    value: string
    label: string
  }[]
}

export const FilterCarousel = ({
  value,
  onSelect,
  data,
  isLoading,
}: FilterCarouselProps) => {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)
  const lastSnapIndex = useRef<number>(0)

  const scrollToCategory = useCallback((index: number, animate = true) => {
    if (api) {
      api.scrollTo(index, !animate)
      lastSnapIndex.current = index
    }
  }, [api])

  useEffect(() => {
    if (!api) return

    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap() + 1)

    const handleSelect = () => {
      const index = api.selectedScrollSnap()
      lastSnapIndex.current = index
      setCurrent(index + 1)
    }

    api.on("select", handleSelect)

    if (value) {
      const index = data.findIndex(item => item.value === value)
      if (index >= 0) scrollToCategory(index + 1, false)
    } else {
      scrollToCategory(lastSnapIndex.current || 0, false)
    }

    return () => {
      api.off("select", handleSelect)
    }
  }, [api, value, data, scrollToCategory])

  const renderSkeletons = () =>
    Array.from({ length: 14 }).map((_, index) => (
      <CarouselItem key={index} className="pl-3 basis-auto">
        <Skeleton className="rounded-lg px-3 py-1 h-full text-sm w-[100px] font-semibold">
          &nbsp;
        </Skeleton>
      </CarouselItem>
    ))

  const renderCategories = () => (
    <>
      <CarouselItem
        onClick={() => onSelect(null)}
        className="pl-3 basis-auto"
      >
        <Badge
          variant={!value ? "default" : "secondary"}
          className="rounded-lg px-3 py-1 cursor-pointer whitespace-nowrap text-sm"
        >
          All
        </Badge>
      </CarouselItem>
      {data.map(item => (
        <CarouselItem
          key={item.value}
          onClick={() => {
            onSelect(item.value)
            const index = data.findIndex(d => d.value === item.value)
            if (index >= 0) scrollToCategory(index + 1)
          }}
          className="pl-3 basis-auto"
        >
          <Badge
            variant={value === item.value ? "default" : "secondary"}
            className="rounded-lg px-3 py-1 cursor-pointer whitespace-nowrap text-sm"
          >
            {item.label}
          </Badge>
        </CarouselItem>
      ))}
    </>
  )

  return (
    <div className="relative w-full">
      {/* Left fade */}
      <div
        className={cn(
          "absolute left-12 top-0 bottom-0 w-12 z-10 bg-gradient-to-r from-white to-transparent pointer-events-none",
          current === 1 && "hidden"
        )}
      />
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          dragFree: true,
        }}
        className="w-full px-12"
      >
        <CarouselContent className="-ml-3">
          {isLoading ? renderSkeletons() : renderCategories()}
        </CarouselContent>
        <CarouselPrevious
          className="left-0 z-20"
          onClick={() => scrollToCategory(Math.max(current - 2, 0))}
        />
        <CarouselNext
          className="right-0 z-20"
          onClick={() => scrollToCategory(Math.min(current, count - 1))}
        />
      </Carousel>
      {/* Right fade */}
      <div
        className={cn(
          "absolute right-12 top-0 bottom-0 w-12 z-10 bg-gradient-to-l from-white to-transparent pointer-events-none",
          current === count && "hidden"
        )}
      />
    </div>
  )
}