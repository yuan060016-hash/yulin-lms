import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const r = await db.course.deleteMany({
  where: { title: "01 外贸认知与方向", isPublished: false },
});
console.log("deleted_draft", r.count);
await db.$disconnect();
