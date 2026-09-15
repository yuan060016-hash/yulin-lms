import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import dotenv from "dotenv";

dotenv.config();
const db = new PrismaClient();

const teacherId = process.env.NEXT_PUBLIC_TEACHER_ID;
const course = await db.course.findFirst({
  where: { title: "雨林外贸实战课程", userId: teacherId },
});

if (!course || !teacherId) {
  console.log("no course/teacher");
  process.exit(0);
}

await db.purchase.upsert({
  where: {
    userId_courseId: {
      userId: teacherId,
      courseId: course.id,
    },
  },
  update: { amount: 2980 },
  create: {
    id: randomUUID(),
    userId: teacherId,
    courseId: course.id,
    amount: 2980,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
});

console.log("teacher enrolled", course.id);
await db.$disconnect();