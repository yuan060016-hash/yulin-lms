require("dotenv").config();
process.env.DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
(async () => {
  const n = await db.course.count();
  console.log("ok courses", n);
  await db.$disconnect();
})().catch(async (e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
