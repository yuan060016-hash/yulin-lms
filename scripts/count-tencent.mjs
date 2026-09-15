import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const n = await db.chapterActivity.count({ where: { videoProvider: "tencent-vod" } });
console.log("tencent_bound=" + n);
await db.$disconnect();
