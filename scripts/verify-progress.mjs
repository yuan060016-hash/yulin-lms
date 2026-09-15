import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const userId = "2809012b-8c47-44c7-8627-6eee720353d8";
const courseId = "5bab90cd-735d-44c5-9181-33b192014abe";

const publishedChapters = await db.chapter.findMany({
  where: { courseId, isPublished: true },
  select: { id: true, activities: { select: { id: true } } },
});
const activityIds = publishedChapters.flatMap((c) => c.activities).map((a) => a.id);
console.log("activities", activityIds.length);
const completedCount = await db.userProgress.count({
  where: { userId, activityId: { in: activityIds }, completedAt: { not: null } },
});
console.log("completed", completedCount);
console.log("progress", activityIds.length ? (completedCount / activityIds.length) * 100 : 0);

const purchased = await db.purchase.findMany({ where: { userId } });
const owned = await db.course.findMany({ where: { userId, isPublished: true } });
console.log("purchased", purchased.length, "owned", owned.length);
await db.$disconnect();
