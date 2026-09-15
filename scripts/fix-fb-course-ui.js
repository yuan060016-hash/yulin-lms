require("dotenv").config();
process.env.DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

const FB_IMAGE =
  "https://images.unsplash.com/photo-1611162616475-46b635cb6868?auto=format&fit=crop&w=1200&q=80";
const MAIN_IMAGE =
  "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80";

async function main() {
  // Ensure distinct categories
  const tradeCat = await db.category.upsert({
    where: { name: "外贸实战" },
    update: {},
    create: { name: "外贸实战" },
  });
  const fbCat = await db.category.upsert({
    where: { name: "Facebook获客" },
    update: {},
    create: { name: "Facebook获客" },
  });

  const main = await db.course.update({
    where: { id: "5bab90cd-735d-44c5-9181-33b192014abe" },
    data: {
      imageUrl: MAIN_IMAGE,
      categoryId: tradeCat.id,
    },
  });

  const fb = await db.course.update({
    where: { id: "fd97323b-6f25-49b8-a186-76f99378a80a" },
    data: {
      imageUrl: FB_IMAGE,
      categoryId: fbCat.id,
      description:
        "专注 Facebook 获客从 0 到 1：账号搭建、内容策略与私信转化，三节课快速上手。",
    },
  });

  const fixed = await db.chapterActivity.updateMany({
    where: { type: { in: ["VIDEO", "Video"] } },
    data: { type: "video" },
  });

  const fbActs = await db.chapterActivity.findMany({
    where: {
      chapter: { courseId: fb.id },
    },
    select: { id: true, name: true, type: true, videoUrl: true, videoProvider: true },
  });

  console.log(
    JSON.stringify(
      {
        main: { title: main.title, imageUrl: main.imageUrl, categoryId: main.categoryId },
        fb: { title: fb.title, imageUrl: fb.imageUrl, categoryId: fb.categoryId },
        fixedTypes: fixed.count,
        fbActs,
      },
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => db.$disconnect());
