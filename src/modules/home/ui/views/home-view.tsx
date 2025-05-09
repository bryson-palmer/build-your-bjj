import { CategoriesSection } from "../sections/categories-section"
import { VideosSection } from "../sections/videos-section"

// If categoryId becomes an [] of string ids, would need to update here
interface HomeViewProps {
  categoryId?: string
}

export const HomeView = ({ categoryId }: HomeViewProps) => {

  return (
    <div className="max-w-[2400px] mx-auto mb-10 px-4 pt-2.5 flex flex-col gap-y-6">
      <CategoriesSection categoryId={categoryId} />
      <VideosSection categoryId={categoryId} />
    </div>
  )
}