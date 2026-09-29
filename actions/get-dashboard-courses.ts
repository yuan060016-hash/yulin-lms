import { Category, Chapter, Course } from "@prisma/client";

import { db } from "@/lib/db";

type CourseWithProgressWithCategory = Course & {
  category: Category | null;
  chapters: Chapter[];
  progress: number | null;
};

type DashboardCourses = {
  completedCourses: CourseWithProgressWithCategory[];
  coursesInProgress: CourseWithProgressWithCategory[];
};

async function getProgressMap(userId: string, courseIds: string[]) {
  const progressByCourse = new Map<string, number>();
  if (courseIds.length === 0) return progressByCourse;

  const chapters = await db.chapter.findMany({
    where: {
      courseId: { in: courseIds },
      isPublished: true,
    },
    select: {
      id: true,
      courseId: true,
      activities: {
        select: { id: true },
      },
    },
  });

  const activityIdsByCourse = new Map<string, string[]>();
  const allActivityIds: string[] = [];

  for (const chapter of chapters) {
    const ids = chapter.activities.map((a) => a.id);
    if (!ids.length) continue;
    const current = activityIdsByCourse.get(chapter.courseId) || [];
    current.push(...ids);
    activityIdsByCourse.set(chapter.courseId, current);
    allActivityIds.push(...ids);
  }

  const completed = allActivityIds.length
    ? await db.userProgress.findMany({
        where: {
          userId,
          activityId: { in: allActivityIds },
          completedAt: { not: null },
        },
        select: { activityId: true },
      })
    : [];

  const completedSet = new Set(completed.map((row) => row.activityId));

  for (const courseId of courseIds) {
    const activityIds = activityIdsByCourse.get(courseId) || [];
    if (activityIds.length === 0) {
      progressByCourse.set(courseId, 0);
      continue;
    }
    let done = 0;
    for (const id of activityIds) {
      if (completedSet.has(id)) done += 1;
    }
    progressByCourse.set(courseId, (done / activityIds.length) * 100);
  }

  return progressByCourse;
}

export const getDashboardCourses = async (
  userId: string
): Promise<DashboardCourses> => {
  try {
    const [purchasedCourses, ownedCourses] = await Promise.all([
      db.purchase.findMany({
        where: { userId, course: { isPublished: true } },
        select: {
          course: {
            include: {
              category: true,
              chapters: {
                where: { isPublished: true },
                select: { id: true },
              },
            },
          },
        },
      }),
      db.course.findMany({
        where: {
          userId,
          isPublished: true,
        },
        include: {
          category: true,
          chapters: {
            where: { isPublished: true },
            select: { id: true },
          },
        },
      }),
    ]);

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
    const progressMap = await getProgressMap(
      userId,
      courses.map((course) => course.id)
    );

    for (const course of courses) {
      course.progress = progressMap.get(course.id) ?? 0;
    }

    const completedCourses = courses.filter((course) => course.progress === 100);
    const coursesInProgress = courses.filter(
      (course) => (course.progress ?? 0) < 100
    );

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
