import { db } from "@/lib/db";

export const getProgress = async (
  userId: string,
  courseId: string,
): Promise<number> => {
  try {
    const publishedChapters = await db.chapter.findMany({
      where: {
        courseId,
        isPublished: true,
      },
      select: {
        id: true,
        activities: {
          where: {
            // count video/text/quiz activities
          },
          select: { id: true },
        },
      },
    });

    const activityIds = publishedChapters
      .flatMap((chapter) => chapter.activities)
      .map((activity) => activity.id);

    if (activityIds.length === 0) {
      return 0;
    }

    const completedCount = await db.userProgress.count({
      where: {
        userId,
        activityId: { in: activityIds },
        completedAt: { not: null },
      },
    });

    return (completedCount / activityIds.length) * 100;
  } catch (error) {
    console.log("[GET_PROGRESS]", error);
    return 0;
  }
};
