import { cache } from "react";
import { db } from "@/lib/db";

export const getCourseSidebar = cache(async function getCourseSidebar(courseId: string, userId: string) {
  return db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      isPublished: true,
      userId: true,
      purchases: { where: { userId }, select: { id: true }, take: 1 },
      chapters: {
        where: { isPublished: true },
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          activities: {
            orderBy: { position: "asc" },
            select: {
              id: true,
              name: true,
              userProgress: {
                where: { userId },
                select: { completedAt: true },
                take: 1,
              },
            },
          },
        },
      },
    },
  });
});
