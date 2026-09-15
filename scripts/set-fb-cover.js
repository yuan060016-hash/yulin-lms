require("dotenv").config();
process.env.DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
(async () => {
  const updated = await db.course.update({
    where: { id: "fd97323b-6f25-49b8-a186-76f99378a80a" },
    data: { imageUrl: "/course-covers/facebook-lead-gen.jpg" },
    select: { id: true, title: true, imageUrl: true },
  });
  console.log(updated);
  await db.$disconnect();
})().catch(async (e) => { console.error(e); process.exit(1); });
