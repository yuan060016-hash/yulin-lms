require("dotenv").config();
process.env.DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

const COURSE_TITLE = "Facebook获客0-1全流程";
const COURSE_PRICE = 1680;
const CHAPTERS = [
  { position: 1, title: "Facebook获客(1)", fileId: "5001834820125101240" },
  { position: 2, title: "Facebook获客(2)", fileId: "5001834820048701927" },
  { position: 3, title: "Facebook获客(3)", fileId: "5001834820048702588" },
];

async function main() {
  const all = await db.course.findMany({ select: { id: true, title: true, price: true } });
  console.log("existing", all);

  const teacher =
    (await db.course.findFirst({ where: { title: { contains: "雨林" } } }))?.userId ||
    process.env.NEXT_PUBLIC_TEACHER_ID;
  if (!teacher) throw new Error("missing teacher userId");

  let course = await db.course.findFirst({
    where: { title: COURSE_TITLE },
    include: { chapters: { include: { activities: true } }, purchases: true },
  });

  if (!course) {
    course = await db.course.create({
      data: {
        userId: teacher,
        title: COURSE_TITLE,
        description: "Facebook 获客从 0 到 1 的完整实操流程，共三节课。",
        price: COURSE_PRICE,
        isPublished: true,
      },
      include: { chapters: { include: { activities: true } }, purchases: true },
    });
    console.log("created course", course.id);
  } else {
    course = await db.course.update({
      where: { id: course.id },
      data: {
        price: COURSE_PRICE,
        isPublished: true,
        description: "Facebook 获客从 0 到 1 的完整实操流程，共三节课。",
      },
      include: { chapters: { include: { activities: true } }, purchases: true },
    });
    console.log("updated course", course.id);
  }

  for (const item of CHAPTERS) {
    let chapter = course.chapters.find((c) => c.position === item.position);
    if (!chapter) {
      chapter = await db.chapter.create({
        data: {
          title: item.title,
          position: item.position,
          isPublished: true,
          isFree: false,
          courseId: course.id,
          description: item.title,
        },
        include: { activities: true },
      });
      console.log("created chapter", item.title);
    } else {
      chapter = await db.chapter.update({
        where: { id: chapter.id },
        data: { title: item.title, isPublished: true },
        include: { activities: true },
      });
    }

    const activity = chapter.activities[0];
    if (!activity) {
      await db.chapterActivity.create({
        data: {
          name: item.title,
          type: "VIDEO",
          position: 1,
          chapterId: chapter.id,
          videoProvider: "tencent-vod",
          videoUrl: item.fileId,
        },
      });
      console.log("created activity", item.title, item.fileId);
    } else {
      await db.chapterActivity.update({
        where: { id: activity.id },
        data: {
          name: item.title,
          type: "VIDEO",
          videoProvider: "tencent-vod",
          videoUrl: item.fileId,
        },
      });
      console.log("updated activity", item.title, item.fileId);
    }
  }

  await db.purchase.upsert({
    where: { userId_courseId: { userId: teacher, courseId: course.id } },
    update: { amount: COURSE_PRICE },
    create: { userId: teacher, courseId: course.id, amount: COURSE_PRICE },
  });

  const finalCourse = await db.course.findUnique({
    where: { id: course.id },
    include: {
      chapters: { orderBy: { position: "asc" }, include: { activities: true } },
      purchases: true,
    },
  });

  console.log(
    JSON.stringify(
      {
        id: finalCourse.id,
        title: finalCourse.title,
        price: finalCourse.price,
        chapters: finalCourse.chapters.map((c) => ({
          pos: c.position,
          title: c.title,
          fileId: c.activities[0]?.videoUrl,
        })),
        purchases: finalCourse.purchases.length,
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
  .finally(async () => {
    await db.$disconnect();
  });
