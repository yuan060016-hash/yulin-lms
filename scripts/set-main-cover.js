require("dotenv").config();
process.env.DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
(async () => {
  await db.course.update({
    where: { id: "5bab90cd-735d-44c5-9181-33b192014abe" },
    data: { imageUrl: "/course-covers/trade-practice.jpg" },
  });
  console.log("main cover local ok");
  await db.$disconnect();
})().catch(async (e) => { console.error(e.message); process.exit(1); });
