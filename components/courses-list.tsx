import { Category, Course } from "@prisma/client";

import { CourseCard } from "@/components/course-card";

type CourseWithProgressWithCategory = Course & {
  category?: Category | null;
  chapters?: { id: string }[];
  progress?: number | null;
};

interface CoursesListProps {
  items: CourseWithProgressWithCategory[];
}

export const CoursesList = ({
  items
}: CoursesListProps) => {
  return (
    <div>
      <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
        {items.map((item) => (
          <CourseCard
            key={item.id}
            id={item.id}
            title={item.title}
            imageUrl={item.imageUrl || "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80"}
            chaptersLength={item.chapters?.length}
            price={item.price ?? 2980}
            progress={item.progress}
            category={item?.category?.name || "外贸实战"}
          />
        ))}
      </div>
      {items.length === 0 && (
        <div className="text-center text-sm text-muted-foreground mt-10">
          暂无已开通课程，请联系管理员开通后刷新页面
        </div>
      )}
    </div>
  )
}
