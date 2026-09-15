import { Category, Chapter, Course } from "@prisma/client";

import { db } from "@/lib/db";
import { getProgress } from "@/actions/get-progress";

type CourseWithProgressWithCategory = Course & {
  category: Category | null;
  chapters: Chapter[];
  progress: number | null;
};

type DashboardCourses = {
  completedCourses: CourseWithProgressWithCategory[];
  coursesInProgress: CourseWithProgressWithCategory[];
};

export const getDashboardCourses = async (userId: string): Promise<DashboardCourses> => {
  try {
    const purchasedCourses = await db.purchase.findMany({
      where: { userId, course: { isPublished: true } },
      select: {
        course: {
          include: {
            category: true,
            chapters: {
              where: { isPublished: true },
            },
          },
        },
      },
    });

    // Teachers should also see courses they own, even without purchase row.
    const ownedCourses = await db.course.findMany({
      where: {
        userId,
        isPublished: true,
      },
      include: {
        category: true,
        chapters: {
          where: { isPublished: true },
        },
      },
    });

    const map = new Map<string, CourseWithProgressWithCategory>();

    for (const row of purchasedCourses) {
      if (row.course) {
        map.set(row.course.id, row.course as CourseWithProgressWithCategory);
      }
    }
    for (const course of ownedCourses) {
      map.set(course.id, course as CourseWithProgressWithCategory);
    }

    const courses = Array.from(map.values());

    for (const course of courses) {
      course.progress = await getProgress(userId, course.id);
    }

    const completedCourses = courses.filter((course) => course.progress === 100);
    const coursesInProgress = courses.filter((course) => (course.progress ?? 0) < 100);

    return {
      completedCourses,
      coursesInProgress,
    };
  } catch (error) {
    console.log("[GET_DASHBOARD_COURSES]", error);
    return {
      completedCourses: [],
      coursesInProgress: [],
    };
  }
};
