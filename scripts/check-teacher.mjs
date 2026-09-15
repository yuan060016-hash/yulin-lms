import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const user = await db.localUser.findUnique({ where: { email: "asdfjkl2024@qq.com" } });
console.log(JSON.stringify({
  exists: !!user,
  role: user?.role || null,
  idLen: user?.id?.length || 0,
  email: user?.email || null,
}, null, 2));
const courses = await db.course.findMany({ where: { title: "雨林外贸实战课程" }, select: { id: true, userId: true, title: true } });
console.log("courses", courses);
await db.$disconnect();
