import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
try {
  const columns = await db.$queryRawUnsafe('PRAGMA table_info("ChapterActivity")');
  if (!columns.some(column => column.name === "videoProvider")) {
    await db.$executeRawUnsafe('ALTER TABLE "ChapterActivity" ADD COLUMN "videoProvider" TEXT');
  }
  console.log("SQLite videoProvider column ready; existing data preserved.");
} finally { await db.$disconnect(); }
