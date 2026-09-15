import { cache } from "react";
import { db } from "@/lib/db";

export const getLessonAccess = cache(async function getLessonAccess(
  userId: string,
  params: { courseId: string; chapterId: string; activityId: string }
) {
  const activity = await db.chapterActivity.findFirst({
    where: {
      id: params.activityId,
      chapterId: params.chapterId,
      chapter: { courseId: params.courseId },
    },
    select: {
      id: true,
      name: true,
      type: true,
      textContent: true,
      videoProvider: true,
      videoUrl: true,
      position: true,
      muxData: { select: { playbackId: true }, take: 1 },
      userProgress: { where: { userId }, select: { completedAt: true }, take: 1 },
      chapter: {
        select: {
          id: true,
          title: true,
          position: true,
          isPublished: true,
          course: {
            select: {
              id: true,
              userId: true,
              isPublished: true,
              purchases: { where: { userId }, select: { id: true }, take: 1 },
            },
          },
        },
      },
    },
  });
  if (!activity) return null;
  const course = activity.chapter.course;
  const isOwner = course.userId === userId;
  const available = isOwner || (course.isPublished && activity.chapter.isPublished);
  const allowed = available && (isOwner || course.purchases.length > 0);
  return { activity, isOwner, available, allowed };
});

export async function getNextLesson(
  courseId: string,
  current: { chapterId: string; chapterPosition: number; position: number; id: string }
) {
  // Prefer next activity in same chapter.
  const nextInChapter = await db.chapterActivity.findFirst({
    where: {
      chapterId: current.chapterId,
      position: { gt: current.position },
    },
    orderBy: { position: "asc" },
    select: { id: true, chapterId: true, name: true },
  });
  if (nextInChapter) return nextInChapter;

  // Otherwise first activity of the next published chapter.
  const nextChapter = await db.chapter.findFirst({
    where: {
      courseId,
      isPublished: true,
      position: { gt: current.chapterPosition },
    },
    orderBy: { position: "asc" },
    select: {
      id: true,
      activities: {
        orderBy: { position: "asc" },
        take: 1,
        select: { id: true, chapterId: true, name: true },
      },
    },
  });
  return nextChapter?.activities?.[0] || null;
}
