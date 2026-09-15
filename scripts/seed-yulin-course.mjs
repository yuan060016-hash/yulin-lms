import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { CURRICULUM } from "./curriculum.mjs";

const db = new PrismaClient();

const LESSONS = CURRICULUM;

async function main() {
  const teacherId = process.env.NEXT_PUBLIC_TEACHER_ID;
  if (!teacherId) {
    throw new Error("请先在 .env 设置 NEXT_PUBLIC_TEACHER_ID");
  }

  const category =
    (await db.category.findFirst({ where: { name: "外贸实战" } })) ||
    (await db.category.create({
      data: { id: randomUUID(), name: "外贸实战" },
    }));

  const existing = await db.course.findFirst({
    where: {
      userId: teacherId,
      title: "雨林外贸实战课程",
    },
  });

  if (existing) {
    console.log("课程已存在:", existing.id);
    return;
  }

  const courseId = randomUUID();
  const now = new Date();

  await db.course.create({
    data: {
      id: courseId,
      userId: teacherId,
      title: "雨林外贸实战课程",
      description:
        "面向想系统学习外贸获客、沟通成交与风险控制的学员。课程售价 2980 元，仅限已购买学员学习。",
      imageUrl:
        "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80",
      price: 2980,
      isPublished: true,
      categoryId: category.id,
      createdAt: now,
      updatedAt: now,
    },
  });

  for (let i = 0; i < LESSONS.length; i++) {
    const chapterId = randomUUID();
    const activityId = randomUUID();
    const { title, number } = LESSONS[i];

    await db.chapter.create({
      data: {
        id: chapterId,
        title: `${number} ${title}`,
        description: `${title}（视频后续接入腾讯云点播）`,
        position: i + 1,
        isPublished: true,
        isFree: false,
        courseId,
        createdAt: now,
        updatedAt: now,
      },
    });

    await db.chapterActivity.create({
      data: {
        id: activityId,
        name: title,
        type: "video",
        position: 1,
        chapterId,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  console.log("已创建课程:", courseId);
  console.log("章节数:", LESSONS.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
