import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();
const db = new PrismaClient();

const teacherId = process.env.NEXT_PUBLIC_TEACHER_ID;
console.log("teacherId", teacherId);

const users = await db.localUser.findMany({ select: { id: true, email: true, role: true } });
console.log("users", users);

const courses = await db.course.findMany({
  include: {
    chapters: { select: { id: true } },
    purchases: true,
  },
});
for (const c of courses) {
  console.log({
    id: c.id,
    title: c.title,
    userId: c.userId,
    published: c.isPublished,
    price: c.price,
    chapters: c.chapters.length,
    purchases: c.purchases.map((p) => ({ userId: p.userId, amount: p.amount })),
  });
}

await db.$disconnect();
