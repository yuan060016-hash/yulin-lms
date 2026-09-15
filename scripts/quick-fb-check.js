require("dotenv").config();
process.env.DATABASE_URL = process.env.DIRECT_URL;
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient({ log: ["error"] });
(async () => {
  const acts = await db.chapterActivity.findMany({
    where: { chapter: { courseId: "fd97323b-6f25-49b8-a186-76f99378a80a" } },
    select: { name: true, type: true },
  });
  const course = await db.course.findUnique({
    where: { id: "fd97323b-6f25-49b8-a186-76f99378a80a" },
    select: { title: true, imageUrl: true, categoryId: true, price: true },
  });
  console.log(JSON.stringify({ course, acts }, null, 2));
  await db.$disconnect();
})().catch(async (e) => {
  console.error(e.message);
  process.exit(1);
});
