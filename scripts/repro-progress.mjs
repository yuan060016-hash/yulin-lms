import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const userId = "2809012b-8c47-44c7-8627-6eee720353d8";
const courseId = "5bab90cd-735d-44c5-9181-33b192014abe";
try {
  const publishedChapters = await db.chapter.findMany({
    where: { courseId, isPublished: true },
    select: { id: true },
  });
  console.log("chapters", publishedChapters.length);
  const ids = publishedChapters.map((c) => c.id);
  await db.userProgress.count({
    where: {
      userId,
      chapterId: { in: ids },
      isCompleted: true,
    },
  });
} catch (e) {
  console.log("ERROR", String(e).slice(0, 300));
}
await db.$disconnect();
