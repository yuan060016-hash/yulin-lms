require("dotenv").config();
process.env.DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
(async () => {
  const courses = await db.course.findMany({
    include: {
      chapters: {
        orderBy: { position: "asc" },
        include: { activities: { orderBy: { position: "asc" } } },
      },
      purchases: true,
    },
    orderBy: { createdAt: "asc" },
  });
  console.log(
    JSON.stringify(
      courses.map((c) => ({
        id: c.id,
        title: c.title,
        price: c.price,
        imageUrl: c.imageUrl,
        published: c.isPublished,
        purchases: c.purchases.map((p) => p.userId),
        chapters: c.chapters.map((ch) => ({
          id: ch.id,
          pos: ch.position,
          title: ch.title,
          published: ch.isPublished,
          activities: ch.activities.map((a) => ({
            id: a.id,
            name: a.name,
            type: a.type,
            provider: a.videoProvider,
            videoUrl: a.videoUrl,
          })),
        })),
      })),
      null,
      2
    )
  );
  await db.$disconnect();
})().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
