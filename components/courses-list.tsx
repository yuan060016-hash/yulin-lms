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

const FALLBACK_IMAGES: Record<string, string> = {
  facebook:
    "https://images.unsplash.com/photo-1611162616475-46b635cb6868?auto=format&fit=crop&w=1200&q=80",
  default:
    "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80",
};

function pickImage(title: string, imageUrl?: string | null) {
  if (imageUrl) return imageUrl;
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
      <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
        {items.map((item) => (
          <CourseCard
            key={item.id}
            id={item.id}
            title={item.title}
            imageUrl={pickImage(item.title, item.imageUrl)}
            chaptersLength={item.chapters?.length}
            price={item.price ?? 2980}
            progress={item.progress}
            category={pickCategory(item.title, item?.category?.name)}
          />
        ))}
      </div>
      {items.length === 0 && (
        <div className="text-center text-sm text-muted-foreground mt-10">
          暂无已开通课程，请联系管理员开通后刷新页面
        </div>
      )}
    </div>
  );
};
