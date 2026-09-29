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

const FALLBACK_IMAGES = {
  facebook: "/course-covers/facebook-course.jpg",
  default: "/course-covers/trade-practice.jpg",
} as const;

function pickImage(title: string, imageUrl?: string | null) {
  if (imageUrl) {
    if (imageUrl.startsWith("https://") || imageUrl.startsWith("http://")) {
      return imageUrl;
    }
    if (
      imageUrl.startsWith("/course-covers/") &&
      !imageUrl.endsWith("facebook-course.png")
    ) {
      return imageUrl;
    }
  }
  if (/facebook/i.test(title)) return FALLBACK_IMAGES.facebook;
  return FALLBACK_IMAGES.default;
}

function pickCategory(title: string, category?: string | null) {
  if (category) return category;
  if (/facebook/i.test(title)) return "Facebook获客";
  return "外贸实战";
}

export const CoursesList = ({ items }: CoursesListProps) => {
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
        {items.map((item, index) => (
          <CourseCard
            key={item.id}
            id={item.id}
            title={item.title}
            imageUrl={pickImage(item.title, item.imageUrl)}
            chaptersLength={item.chapters?.length}
            price={item.price ?? 2980}
            progress={item.progress}
            category={pickCategory(item.title, item?.category?.name)}
            priority={index < 2}
          />
        ))}
      </div>
      {items.length === 0 && (
        <div className="mt-10 text-center text-sm text-muted-foreground">
          暂无已开通课程，请联系管理员开通后刷新页面
        </div>
      )}
    </div>
  );
};
