require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
(async () => {
  const courses = await db.course.findMany({
    include: {
      chapters: {
        orderBy: { position: "asc" },
        include: { activities: true },
      },
      purchases: true,
    },
  });
  console.log(
    JSON.stringify(
      courses.map((c) => ({
        id: c.id,
        title: c.title,
        price: c.price,
        userId: c.userId,
        published: c.isPublished,
        chapters: c.chapters.map((ch) => ({
          pos: ch.position,
          title: ch.title,
          acts: ch.activities.map((a) => ({
            name: a.name,
            provider: a.videoProvider,
            fileId: a.videoUrl,
          })),
        })),
        purchases: c.purchases.length,
      })),
      null,
      2
    )
  );
  await db.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
