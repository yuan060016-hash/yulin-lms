import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const courses = await db.course.findMany({ select: { id: true, title: true } });
console.log(JSON.stringify(courses, null, 2));
for (const course of courses) {
  const chapters = await db.chapter.findMany({
    where: { courseId: course.id },
    orderBy: { position: "asc" },
    include: { activities: { orderBy: { position: "asc" } } },
  });
  console.log("\n#", course.title, course.id);
  for (const c of chapters) {
    const a = c.activities[0];
    console.log([c.position, c.title, a?.name, a?.videoProvider, a?.videoUrl].join(" | "));
  }
}
await db.$disconnect();
