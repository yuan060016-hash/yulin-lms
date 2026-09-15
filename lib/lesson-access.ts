import { db } from "@/lib/db";

// Shared by lesson rendering and progress APIs; a URL must match the full hierarchy.
export async function getLessonAccess(userId: string, params: {
  courseId: string; chapterId: string; activityId: string;
}) {
  const activity = await db.chapterActivity.findFirst({
    where: { id: params.activityId, chapterId: params.chapterId, chapter: { courseId: params.courseId } },
    include: {
      muxData: true,
      userProgress: { where: { userId } },
      chapter: { include: { course: { include: { purchases: { where: { userId }, select: { id: true } } } } } },
    },
  });
  if (!activity) return null;
  const course = activity.chapter.course;
  const isOwner = course.userId === userId;
  const available = isOwner || (course.isPublished && activity.chapter.isPublished);
  const allowed = available && (isOwner || course.purchases.length > 0);
  return { activity, isOwner, available, allowed };
}
