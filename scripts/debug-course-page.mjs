import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();
const db = new PrismaClient();
const courseId = "5bab90cd-735d-44c5-9181-33b192014abe";
const userId = process.env.NEXT_PUBLIC_TEACHER_ID;

const course = await db.course.findUnique({
  where: { id: courseId },
  include: {
    chapters: {
      where: { isPublished: true },
      orderBy: { position: "asc" },
      include: {
        activities: {
          orderBy: { position: "asc" },
          include: { muxData: true, userProgress: { where: { userId } } },
        },
      },
    },
  },
});
console.log({
  title: course?.title,
  chapters: course?.chapters.length,
  first: course?.chapters[0]?.title,
  firstActs: course?.chapters[0]?.activities?.length,
  belong: course?.userId === userId,
});

const purchase = await db.purchase.findUnique({
  where: { userId_courseId: { userId, courseId } },
});
console.log("purchase", !!purchase);
await db.$disconnect();
