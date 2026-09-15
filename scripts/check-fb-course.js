require("dotenv").config();
process.env.DATABASE_URL = process.env.DIRECT_URL;
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
db.course
  .findUnique({
    where: { id: "fd97323b-6f25-49b8-a186-76f99378a80a" },
    include: {
      chapters: { orderBy: { position: "asc" }, include: { activities: true } },
      purchases: true,
    },
  })
  .then((c) => {
    console.log(
      JSON.stringify(
        {
          title: c.title,
          price: c.price,
          published: c.isPublished,
          chapters: c.chapters.map((x) => ({
            pos: x.position,
            title: x.title,
            fileId: x.activities[0]?.videoUrl,
            provider: x.activities[0]?.videoProvider,
          })),
          purchases: c.purchases.length,
        },
        null,
        2
      )
    );
    return db.$disconnect();
  });
