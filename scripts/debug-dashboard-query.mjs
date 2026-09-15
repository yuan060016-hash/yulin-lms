import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const userId = "2809012b-8c47-44c7-8627-6eee720353d8";

const purchasedCourses = await db.purchase.findMany({
  where: { userId },
  select: {
    course: {
      include: {
        category: true,
        chapters: { where: { isPublished: true } },
      },
    },
  },
});
console.log("purchase_count", purchasedCourses.length);
console.log(purchasedCourses.map((p) => ({
  title: p.course?.title,
  chapters: p.course?.chapters?.length,
  category: p.course?.category?.name || null,
  imageUrl: !!p.course?.imageUrl,
})));
await db.$disconnect();
